#!/usr/bin/env node
'use strict';

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
    const raw = findLastFlagValue(flagName);
    if (raw === undefined) return fallback;
    return String(raw || '').trim();
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

function normalizeSupabaseUrl(rawUrl) {
    const normalized = String(rawUrl || '').trim();
    if (!normalized) return '';
    const withProtocol = /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`;
    try {
        const parsed = new URL(withProtocol);
        return String(parsed.origin || '').replace(/\/+$/, '');
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

function classifySupabaseServiceRoleKey(value) {
    const normalized = String(value || '').trim();
    if (!normalized) return 'missing';

    if (/^sb_secret_[A-Za-z0-9_-]{20,}$/.test(normalized)) {
        return 'sb_secret';
    }

    const jwtParts = normalized.split('.');
    if (jwtParts.length === 3) {
        const payload = decodeBase64UrlJson(jwtParts[1]);
        if (payload && String(payload.role || '').toLowerCase() === 'service_role') {
            return 'service_role_jwt';
        }
    }

    return 'unknown';
}

function maskValue(value, keep = 4) {
    const text = String(value || '').trim();
    if (!text) return '';
    if (text.length <= keep * 2) return `${text.slice(0, keep)}...`;
    return `${text.slice(0, keep)}...${text.slice(-keep)}`;
}

function main() {
    const requireEnabled = parseIntegerFlag('--require-enabled', 1, 0, 1) === 1;
    const softFail = parseIntegerFlag('--soft-fail', 0, 0, 1) === 1;
    const output = parseStringFlag('--output', 'json').toLowerCase();

    const verifyEnabled = parseStringFlag('--intel-verify-enabled', getEnvValue('INTEL_VERIFY_ENABLED'));
    const supabaseUrlRaw = parseStringFlag('--supabase-url', getEnvValue('SUPABASE_URL'));
    const supabaseUrlNormalized = normalizeSupabaseUrl(supabaseUrlRaw);
    const serviceRoleKey = parseStringFlag('--service-role-key', getEnvValue('SUPABASE_SERVICE_ROLE_KEY'));
    const serviceRoleKeyType = classifySupabaseServiceRoleKey(serviceRoleKey);
    const ingestApiKey = parseStringFlag('--api-key', getEnvValue('INTEL_INGEST_API_KEY'));
    const signingSecret = parseStringFlag('--signing-secret', getEnvValue('INTEL_INGEST_SIGNING_SECRET'));

    const reasons = [];
    if (requireEnabled && verifyEnabled !== '1') {
        reasons.push('intel_verify_disabled');
    }

    if (!supabaseUrlRaw) {
        reasons.push('missing_SUPABASE_URL');
    } else if (!supabaseUrlNormalized) {
        reasons.push('invalid_SUPABASE_URL_format');
    }

    if (!serviceRoleKey) {
        reasons.push('missing_SUPABASE_SERVICE_ROLE_KEY');
    } else if (serviceRoleKeyType === 'unknown') {
        reasons.push('invalid_SUPABASE_SERVICE_ROLE_KEY_format');
    }

    if (!ingestApiKey) {
        reasons.push('missing_INTEL_INGEST_API_KEY');
    }

    if (!signingSecret) {
        reasons.push('missing_INTEL_INGEST_SIGNING_SECRET');
    } else if (signingSecret.length < 32) {
        reasons.push('invalid_INTEL_INGEST_SIGNING_SECRET_length');
    }

    const report = {
        ok: reasons.length === 0,
        reason: reasons.length === 0 ? 'ok' : reasons.join(' '),
        reasons,
        checks: {
            requireEnabled,
            intelVerifyEnabled: verifyEnabled === '1',
            supabaseUrlPresent: Boolean(supabaseUrlRaw),
            supabaseUrlValid: Boolean(supabaseUrlNormalized),
            serviceRoleKeyType,
            ingestApiKeyPresent: Boolean(ingestApiKey),
            signingSecretLength: signingSecret.length
        },
        hints: {
            supabaseUrl: supabaseUrlNormalized || null,
            ingestApiKeyMasked: ingestApiKey ? maskValue(ingestApiKey) : null,
            signingSecretMasked: signingSecret ? maskValue(signingSecret) : null
        }
    };

    if (output === 'json') {
        console.log(JSON.stringify(report, null, 2));
    } else {
        console.log(report.reason);
    }

    if (!report.ok && !softFail) {
        process.exitCode = 2;
    }
}

try {
    main();
} catch (error) {
    console.error('[INTEL_VERIFY_SECRETS] FAIL');
    console.error(error && error.stack ? error.stack : String(error));
    process.exit(1);
}
