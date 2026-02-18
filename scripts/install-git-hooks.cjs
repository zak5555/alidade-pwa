#!/usr/bin/env node
'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runGit(args) {
    const result = spawnSync('git', args, { encoding: 'utf8' });
    if (result.status !== 0) {
        const detail = (result.stderr || result.stdout || 'Unknown git error').trim();
        throw new Error(`git ${args.join(' ')} failed: ${detail}`);
    }
}

function ensurePreCommitExists() {
    const hookPath = path.join(process.cwd(), '.githooks', 'pre-commit');
    if (!fs.existsSync(hookPath)) {
        throw new Error('Missing .githooks/pre-commit. Commit hook file before installing hooks path.');
    }
}

function main() {
    ensurePreCommitExists();
    runGit(['config', 'core.hooksPath', '.githooks']);
    console.log('[GIT_HOOKS] Installed');
    console.log(JSON.stringify({
        hooksPath: '.githooks',
        preCommit: '.githooks/pre-commit'
    }, null, 2));
}

try {
    main();
} catch (error) {
    console.error('[GIT_HOOKS] FAIL');
    console.error(error && error.stack ? error.stack : String(error));
    process.exit(1);
}
