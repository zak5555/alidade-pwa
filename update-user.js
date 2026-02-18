#!/usr/bin/env node
'use strict';

const https = require('https');

function parseArg(flagName, fallback = '') {
    const index = process.argv.indexOf(flagName);
    if (index === -1) return fallback;
    return String(process.argv[index + 1] || '').trim() || fallback;
}

function getEnvValue(name) {
    if (process.env[name]) return String(process.env[name]).trim();
    const fallbackKey = Object.keys(process.env).find((key) => key.replace(/^\uFEFF/, '') === name);
    return fallbackKey ? String(process.env[fallbackKey] || '').trim() : '';
}

function resolveSupabaseBaseUrl(rawUrl) {
    const normalized = String(rawUrl || '').trim();
    if (!normalized) return null;
    const withProtocol = /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`;
    try {
        return new URL(withProtocol);
    } catch (_error) {
        return null;
    }
}

function supabaseRequest(baseUrl, serviceRoleKey, path, method, bodyObject = null) {
    return new Promise((resolve, reject) => {
        const payload = bodyObject ? JSON.stringify(bodyObject) : null;
        const options = {
            hostname: baseUrl.hostname,
            port: 443,
            path,
            method,
            headers: {
                apikey: serviceRoleKey,
                Authorization: `Bearer ${serviceRoleKey}`,
                'Content-Type': 'application/json',
                Prefer: 'return=representation'
            }
        };

        if (payload) {
            options.headers['Content-Length'] = Buffer.byteLength(payload);
        }

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                const statusCode = Number(res.statusCode || 0);
                let parsed = null;
                try {
                    parsed = data ? JSON.parse(data) : null;
                } catch (_error) {
                    parsed = data;
                }
                if (statusCode >= 200 && statusCode < 300) {
                    resolve(parsed);
                    return;
                }
                reject(new Error(`Supabase HTTP ${statusCode}: ${typeof parsed === 'string' ? parsed : JSON.stringify(parsed)}`));
            });
        });

        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

async function main() {
    const rawSupabaseUrl = parseArg('--supabase-url', getEnvValue('SUPABASE_URL'));
    const serviceRoleKey = parseArg('--service-role-key', getEnvValue('SUPABASE_SERVICE_ROLE_KEY'));
    const targetEmail = parseArg('--email', getEnvValue('UPDATE_USER_EMAIL') || 'alidade.ops@gmail.com');
    const licenseKey = parseArg('--license-key', getEnvValue('UPDATE_USER_LICENSE_KEY'));
    const dryRun = process.argv.includes('--dry-run');

    const baseUrl = resolveSupabaseBaseUrl(rawSupabaseUrl);
    if (!baseUrl) {
        throw new Error('Missing or invalid SUPABASE_URL. Use --supabase-url or env SUPABASE_URL.');
    }
    if (!serviceRoleKey) {
        throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY. Use --service-role-key or env SUPABASE_SERVICE_ROLE_KEY.');
    }
    if (!targetEmail) {
        throw new Error('Missing target email. Use --email or env UPDATE_USER_EMAIL.');
    }
    if (!licenseKey) {
        throw new Error('Missing license key. Use --license-key or env UPDATE_USER_LICENSE_KEY.');
    }

    const path = `/rest/v1/users?email=eq.${encodeURIComponent(targetEmail)}`;
    const payload = { license_key: licenseKey };

    if (dryRun) {
        console.log(JSON.stringify({
            ok: true,
            dryRun: true,
            path,
            payload
        }, null, 2));
        return;
    }

    const updatedRows = await supabaseRequest(baseUrl, serviceRoleKey, path, 'PATCH', payload);
    console.log(JSON.stringify({
        ok: true,
        targetEmail,
        updatedCount: Array.isArray(updatedRows) ? updatedRows.length : 0,
        updated: Array.isArray(updatedRows) ? updatedRows : updatedRows ? [updatedRows] : []
    }, null, 2));
}

main().catch((error) => {
    console.error('[UPDATE_USER] FAIL');
    console.error(error && error.stack ? error.stack : String(error));
    process.exit(1);
});
