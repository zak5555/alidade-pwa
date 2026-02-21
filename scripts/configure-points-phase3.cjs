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

function parseOptionalIntegerFlag(flagName, min, max) {
    const raw = findLastFlagValue(flagName);
    if (raw === undefined) return undefined;
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
        throw new Error(`${flagName} must be an integer in [${min}, ${max}]`);
    }
    return parsed;
}

function parseOptionalNumericFlag(flagName, min, max) {
    const raw = findLastFlagValue(flagName);
    if (raw === undefined) return undefined;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
        throw new Error(`${flagName} must be a number in [${min}, ${max}]`);
    }
    return parsed;
}

function toBoolean(value, fallback) {
    if (typeof value === 'boolean') return value;
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) return fallback;
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
    return fallback;
}

function parseOptionalBooleanFlag(flagName) {
    const raw = findLastFlagValue(flagName);
    if (raw === undefined) return undefined;
    const normalized = String(raw || '').trim().toLowerCase();
    if (!['1', '0', 'true', 'false', 'yes', 'no', 'on', 'off'].includes(normalized)) {
        throw new Error(`${flagName} must be a boolean value`);
    }
    return toBoolean(raw, false);
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

async function runStatus(client) {
    const { data, error } = await client.rpc('get_points_engine_phase3_status_v1');
    if (error) {
        return { ok: false, error: error.message };
    }
    return { ok: true, status: data };
}

async function runSettle(client, limit) {
    const { data, error } = await client.rpc('settle_pending_points_v2', { p_limit: limit });
    if (error) {
        return { ok: false, error: error.message };
    }
    return { ok: true, settlement: data };
}

async function runUpdate(client) {
    const patch = {};
    const enableAdvancedScoring = parseOptionalBooleanFlag('--enable-advanced-scoring');
    const authLowConsistencyPending = parseOptionalBooleanFlag('--auth-low-consistency-pending');
    const anonVerifiedRatio = parseOptionalNumericFlag('--anon-verified-ratio', 0, 1);
    const pendingAutoVerifyMinutes = parseOptionalIntegerFlag('--pending-auto-verify-minutes', 5, 10080);
    const noveltyWindowHours = parseOptionalIntegerFlag('--novelty-window-hours', 1, 168);
    const consistencySoftDeviation = parseOptionalNumericFlag('--consistency-soft-deviation', 0, 10);
    const consistencyHardDeviation = parseOptionalNumericFlag('--consistency-hard-deviation', 0, 10);

    if (enableAdvancedScoring !== undefined) patch.enable_advanced_scoring = enableAdvancedScoring;
    if (authLowConsistencyPending !== undefined) patch.auth_low_consistency_pending = authLowConsistencyPending;
    if (anonVerifiedRatio !== undefined) patch.anon_verified_ratio = anonVerifiedRatio;
    if (pendingAutoVerifyMinutes !== undefined) patch.pending_auto_verify_minutes = pendingAutoVerifyMinutes;
    if (noveltyWindowHours !== undefined) patch.novelty_window_hours = noveltyWindowHours;
    if (consistencySoftDeviation !== undefined) patch.consistency_soft_deviation = consistencySoftDeviation;
    if (consistencyHardDeviation !== undefined) patch.consistency_hard_deviation = consistencyHardDeviation;

    const hasPatch = Object.keys(patch).length > 0;
    if (!hasPatch) {
        return { ok: false, error: 'No update flags provided.' };
    }

    patch.singleton = true;
    patch.updated_at = new Date().toISOString();

    const { error } = await client
        .from('points_engine_config')
        .upsert(patch, { onConflict: 'singleton' });
    if (error) {
        return { ok: false, error: error.message, patch };
    }

    const statusResult = await runStatus(client);
    if (!statusResult.ok) {
        return {
            ok: true,
            warning: statusResult.error || 'status_read_failed_after_update',
            updated: patch
        };
    }

    return {
        ok: true,
        updated: patch,
        status: statusResult.status
    };
}

async function main() {
    const supabaseUrl = normalizeSupabaseUrl(parseStringFlag('--supabase-url', getEnvValue('SUPABASE_URL')));
    const serviceRoleKey = parseStringFlag('--service-role-key', getEnvValue('SUPABASE_SERVICE_ROLE_KEY'));
    const mode = parseStringFlag('--mode', 'status').toLowerCase();
    const settleLimit = parseIntegerFlag('--limit', 500, 1, 5000);
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

    let result;
    if (mode === 'status') {
        result = await runStatus(client);
    } else if (mode === 'update') {
        result = await runUpdate(client);
    } else if (mode === 'settle') {
        result = await runSettle(client, settleLimit);
    } else {
        throw new Error(`Unsupported mode: ${mode}. Use status|update|settle`);
    }

    const output = {
        ok: result.ok === true,
        mode,
        ...result
    };
    console.log(JSON.stringify(output, null, 2));

    if (!output.ok && !softFail) {
        process.exitCode = 2;
    }
}

main().catch((error) => {
    console.error('[POINTS_PHASE3_CONFIG] FAIL');
    console.error(error && error.stack ? error.stack : String(error));
    process.exit(1);
});
