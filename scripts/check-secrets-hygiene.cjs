#!/usr/bin/env node
'use strict';

const fs = require('fs');
const { spawnSync } = require('child_process');

function runGit(args) {
    const result = spawnSync('git', args, { encoding: 'utf8' });
    if (result.status !== 0) {
        const message = (result.stderr || result.stdout || 'Unknown git error').trim();
        throw new Error(`git ${args.join(' ')} failed: ${message}`);
    }
    return String(result.stdout || '').trim();
}

function toPosix(filePath) {
    return String(filePath || '').replace(/\\/g, '/');
}

function parseArgs() {
    const staged = process.argv.includes('--staged');
    return { staged };
}

function getCandidateFiles(staged) {
    const output = staged
        ? runGit(['diff', '--cached', '--name-only', '--diff-filter=ACMR'])
        : runGit(['ls-files']);
    if (!output) return [];
    return output
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
}

function shouldIgnoreFile(filePath) {
    const normalized = toPosix(filePath);
    if (!normalized) return true;

    if (
        normalized.startsWith('node_modules/') ||
        normalized.startsWith('.git/') ||
        normalized.startsWith('dist/') ||
        normalized.startsWith('build/')
    ) {
        return true;
    }

    const baseName = normalized.split('/').pop() || '';
    if (
        baseName === '.env' ||
        baseName.startsWith('.env.') ||
        baseName.endsWith('.env')
    ) {
        return true;
    }

    return false;
}

function readUtf8(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (_error) {
        return null;
    }
}

function decodeBase64UrlJson(segment) {
    try {
        const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
        const paddingLength = (4 - (normalized.length % 4)) % 4;
        const padded = normalized + '='.repeat(paddingLength);
        const decoded = Buffer.from(padded, 'base64').toString('utf8');
        return JSON.parse(decoded);
    } catch (_error) {
        return null;
    }
}

function isPlaceholderValue(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) return true;

    if (
        normalized.includes('<') ||
        normalized.includes('>') ||
        normalized.includes('your_') ||
        normalized.includes('placeholder') ||
        normalized.includes('example') ||
        normalized.includes('sample') ||
        normalized.includes('changeme') ||
        normalized.includes('replace_me')
    ) {
        return true;
    }
    return false;
}

function maskValue(value, keep = 4) {
    const text = String(value || '');
    if (text.length <= keep * 2) return `${text.slice(0, keep)}...`;
    return `${text.slice(0, keep)}...${text.slice(-keep)}`;
}

function collectIssues(filePath, source) {
    const issues = [];
    const lines = String(source || '').split(/\r?\n/);

    const supabaseSecretPattern = /sb_secret_[A-Za-z0-9_-]{20,}/g;
    const jwtPattern = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g;
    const hardcodedNamedSecretPattern = /(SUPABASE_SERVICE_ROLE_KEY|INTEL_INGEST_SIGNING_SECRET|INTEL_INGEST_API_KEY)\s*[:=]\s*['"]([^'"]{8,})['"]/;

    lines.forEach((line, index) => {
        const lineNumber = index + 1;

        const secretMatch = line.match(supabaseSecretPattern);
        if (secretMatch) {
            secretMatch.forEach((match) => {
                issues.push({
                    filePath,
                    lineNumber,
                    type: 'supabase_secret_key',
                    detail: maskValue(match)
                });
            });
        }

        const jwtMatches = line.match(jwtPattern);
        if (jwtMatches) {
            jwtMatches.forEach((jwt) => {
                const parts = jwt.split('.');
                if (parts.length !== 3) return;
                const payload = decodeBase64UrlJson(parts[1]);
                if (!payload || String(payload.role || '').toLowerCase() !== 'service_role') {
                    return;
                }
                issues.push({
                    filePath,
                    lineNumber,
                    type: 'supabase_service_role_jwt',
                    detail: maskValue(jwt)
                });
            });
        }

        const namedSecretMatch = line.match(hardcodedNamedSecretPattern);
        if (namedSecretMatch) {
            const keyName = String(namedSecretMatch[1] || '').trim();
            const keyValue = String(namedSecretMatch[2] || '').trim();
            if (!isPlaceholderValue(keyValue)) {
                issues.push({
                    filePath,
                    lineNumber,
                    type: 'hardcoded_named_secret',
                    detail: `${keyName}=${maskValue(keyValue)}`
                });
            }
        }
    });

    return issues;
}

function main() {
    const { staged } = parseArgs();
    const files = getCandidateFiles(staged).filter((filePath) => !shouldIgnoreFile(filePath));
    const issues = [];

    files.forEach((filePath) => {
        const source = readUtf8(filePath);
        if (source === null) return;
        issues.push(...collectIssues(filePath, source));
    });

    if (issues.length > 0) {
        console.error('[SECRET_HYGIENE] FAIL');
        issues.forEach((issue) => {
            console.error(`- ${issue.filePath}:${issue.lineNumber} [${issue.type}] ${issue.detail}`);
        });
        process.exit(1);
        return;
    }

    console.log('[SECRET_HYGIENE] PASS');
    console.log(JSON.stringify({
        scannedFiles: files.length,
        mode: staged ? 'staged' : 'tracked',
        issues: 0
    }, null, 2));
}

try {
    main();
} catch (error) {
    console.error('[SECRET_HYGIENE] ERROR');
    console.error(error && error.stack ? error.stack : String(error));
    process.exit(1);
}
