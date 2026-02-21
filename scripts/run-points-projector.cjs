#!/usr/bin/env node
'use strict';

const { createClient } = require('@supabase/supabase-js');

function getEnvValue(name) {
    if (process.env[name]) return String(process.env[name]).trim();
    const fallbackKey = Object.keys(process.env).find((key) => key.replace(/^\uFEFF/, '') === name);
    return fallbackKey ? String(process.env[fallbackKey] || '').trim() : '';
}

function findLastFlagValue(flagName) {
    let valueIndex = -1;
    for (let index = 2; index < process.argv.length; index += 1) {
        if (process.argv[index] === flagName) {
            valueIndex = index + 1;
        }
    }
    if (valueIndex === -1) return undefined;
    if (valueIndex >= process.argv.length) {
        throw new Error(`${flagName} requires a value`);
    }
    const value = process.argv[valueIndex];
    if (String(value).startsWith('--')) {
        throw new Error(`${flagName} requires a value`);
    }
    return value;
}

function parseStringFlag(flagName, fallback) {
    const value = findLastFlagValue(flagName);
    if (value === undefined) return fallback;
    return String(value || '').trim() || fallback;
}

function parseIntegerFlag(flagName, fallback, min, max) {
    const raw = findLastFlagValue(flagName);
    if (raw === undefined) return fallback;
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
        throw new Error(`${flagName} must be an integer in [${min}, ${max}]`);
    }
    return parsed;
}

function parseBooleanFlag(flagName, fallback) {
    const raw = findLastFlagValue(flagName);
    if (raw === undefined) return fallback;
    const normalized = String(raw || '').trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
    throw new Error(`${flagName} must be a boolean value`);
}

function normalizeSupabaseUrl(rawUrl) {
    const normalized = String(rawUrl || '').trim();
    if (!normalized) return '';
    const withProtocol = /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`;
    try {
        const parsed = new URL(withProtocol);
        return `${parsed.origin}`.replace(/\/+$/, '');
    } catch (_error) {
        return '';
    }
}

function decodeBase64UrlJson(segment) {
    try {
        const normalized = String(segment || '').replace(/-/g, '+').replace(/_/g, '/');
        const paddingLength = (4 - (normalized.length % 4)) % 4;
        const padded = normalized + '='.repeat(paddingLength);
        const decoded = Buffer.from(padded, 'base64').toString('utf8');
        return JSON.parse(decoded);
    } catch (_error) {
        return null;
    }
}

function isLikelySupabaseServiceRoleKey(value) {
    const normalized = String(value || '').trim();
    if (!normalized) return false;

    if (/^sb_secret_[A-Za-z0-9_-]{20,}$/.test(normalized)) {
        return true;
    }

    const jwtParts = normalized.split('.');
    if (jwtParts.length === 3) {
        const payload = decodeBase64UrlJson(jwtParts[1]);
        if (payload && String(payload.role || '').toLowerCase() === 'service_role') {
            return true;
        }
    }
    return false;
}

async function main() {
    const supabaseUrl = normalizeSupabaseUrl(parseStringFlag('--supabase-url', getEnvValue('SUPABASE_URL')));
    const serviceRoleKey = parseStringFlag('--service-role-key', getEnvValue('SUPABASE_SERVICE_ROLE_KEY'));
    const limit = parseIntegerFlag('--limit', 500, 1, 5000);
    const runSettlement = parseBooleanFlag('--run-settlement', true);
    const settlementLimit = parseIntegerFlag('--settlement-limit', 500, 1, 5000);
    const softFail = parseIntegerFlag('--soft-fail', 0, 0, 1) === 1;

    const missing = [];
    if (!supabaseUrl) missing.push('SUPABASE_URL');
    if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
    if (missing.length > 0) {
        throw new Error(`Missing required values: ${missing.join(', ')}`);
    }
    if (!isLikelySupabaseServiceRoleKey(serviceRoleKey)) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY format looks invalid. Expected service_role JWT or sb_secret_ key.');
    }

    const client = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    });

    const startedAt = Date.now();
    const { data, error } = await client.rpc('project_points_from_intel_stream', {
        p_limit: limit
    });
    const durationMs = Date.now() - startedAt;

    if (error) {
        const result = {
            ok: false,
            error: error.message,
            limit,
            durationMs
        };
        console.log(JSON.stringify(result, null, 2));
        if (!softFail) {
            process.exitCode = 2;
        }
        return;
    }

    let settlement = null;
    let settlementWarning = null;
    if (runSettlement) {
        const settleStartedAt = Date.now();
        const settleResult = await client.rpc('settle_pending_points_v2', {
            p_limit: settlementLimit
        });
        if (settleResult.error) {
            settlementWarning = settleResult.error.message;
        } else {
            settlement = {
                durationMs: Date.now() - settleStartedAt,
                result: settleResult.data
            };
        }
    }

    console.log(JSON.stringify({
        ok: true,
        limit,
        runSettlement,
        settlementLimit,
        durationMs,
        projection: data,
        settlement,
        settlementWarning
    }, null, 2));
}

main().catch((error) => {
    console.error('[POINTS_PROJECTOR_RUN] FAIL');
    console.error(error && error.stack ? error.stack : String(error));
    process.exit(1);
});
