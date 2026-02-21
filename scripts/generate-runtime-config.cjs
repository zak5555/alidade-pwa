#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
    const args = Array.isArray(argv) ? argv.slice(2) : [];
    let allowMissing = false;
    let outFile = 'runtime-config.json';

    for (let i = 0; i < args.length; i += 1) {
        const arg = String(args[i] || '').trim();
        if (!arg) continue;
        if (arg === '--allow-missing') {
            allowMissing = true;
            continue;
        }
        if (arg === '--out') {
            outFile = String(args[i + 1] || '').trim() || outFile;
            i += 1;
        }
    }

    return { allowMissing, outFile };
}

function readEnvValue(...keys) {
    for (const key of keys) {
        const value = typeof process.env[key] === 'string' ? process.env[key].trim() : '';
        if (value) return value;
    }
    return '';
}

function resolveEndpoint() {
    const explicit = readEnvValue('ALIDADE_INTEL_INGEST_ENDPOINT', 'INTEL_INGEST_ENDPOINT');
    if (explicit) return explicit;
    const supabaseUrl = readEnvValue('SUPABASE_URL');
    if (!supabaseUrl) return '';
    return `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/intel-ingest`;
}

function ensureDir(filePath) {
    const dir = path.dirname(filePath);
    if (!dir || dir === '.') return;
    fs.mkdirSync(dir, { recursive: true });
}

function main() {
    const { allowMissing, outFile } = parseArgs(process.argv);
    const apiKey = readEnvValue('INTEL_INGEST_API_KEY');
    const signingSecret = readEnvValue('INTEL_INGEST_SIGNING_SECRET');
    const authBearerToken = readEnvValue('ALIDADE_INTEL_AUTH_BEARER_TOKEN', 'INTEL_AUTH_BEARER_TOKEN');
    const endpoint = resolveEndpoint();

    if (!allowMissing) {
        const missing = [];
        if (!apiKey) missing.push('INTEL_INGEST_API_KEY');
        if (!signingSecret) missing.push('INTEL_INGEST_SIGNING_SECRET');
        if (missing.length > 0) {
            console.error('[RUNTIME_CONFIG] Missing required env keys:', missing.join(', '));
            console.error('[RUNTIME_CONFIG] Hint: run with --allow-missing only for non-prod smoke.');
            process.exit(1);
            return;
        }
    }

    const payload = {};
    if (endpoint) payload.intelIngestEndpoint = endpoint;
    if (apiKey) payload.intelIngestApiKey = apiKey;
    if (signingSecret) payload.intelIngestSigningSecret = signingSecret;
    if (authBearerToken) payload.intelAuthBearerToken = authBearerToken;

    const outputPath = path.resolve(process.cwd(), outFile);
    ensureDir(outputPath);
    fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

    const keys = Object.keys(payload);
    console.log('[RUNTIME_CONFIG] Wrote', path.relative(process.cwd(), outputPath));
    console.log('[RUNTIME_CONFIG] Keys:', keys.length ? keys.join(', ') : '(empty)');
}

try {
    main();
} catch (error) {
    console.error('[RUNTIME_CONFIG] ERROR');
    console.error(error && error.stack ? error.stack : String(error));
    process.exit(1);
}
