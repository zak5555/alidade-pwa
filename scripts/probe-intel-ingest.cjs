#!/usr/bin/env node
'use strict';

const crypto = require('crypto');

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
    return process.argv[valueIndex];
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

function parseNumberFlag(flagName, fallback, min, max) {
    const raw = findLastFlagValue(flagName);
    if (raw === undefined) return fallback;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
        throw new Error(`${flagName} must be a number in [${min}, ${max}]`);
    }
    return parsed;
}

function parseStringFlag(flagName, fallback) {
    const value = findLastFlagValue(flagName);
    if (value === undefined) return fallback;
    return String(value || '').trim() || fallback;
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

function buildCanonicalForSignature(envelope) {
    return JSON.stringify({
        id: envelope.id,
        event_name: envelope.event_name,
        occurred_at: envelope.occurred_at,
        payload: envelope.payload,
        meta: envelope.meta,
        nonce: envelope.nonce
    });
}

function signEnvelope(envelope, signingSecret) {
    const canonical = buildCanonicalForSignature(envelope);
    return crypto.createHash('sha256').update(`${signingSecret}.${canonical}`).digest('hex');
}

async function main() {
    const supabaseUrl = normalizeSupabaseUrl(parseStringFlag('--supabase-url', getEnvValue('SUPABASE_URL')));
    const ingestApiKey = parseStringFlag('--api-key', getEnvValue('INTEL_INGEST_API_KEY'));
    const signingSecret = parseStringFlag('--signing-secret', getEnvValue('INTEL_INGEST_SIGNING_SECRET'));

    const missing = [];
    if (!supabaseUrl) missing.push('SUPABASE_URL');
    if (!ingestApiKey) missing.push('INTEL_INGEST_API_KEY');
    if (!signingSecret) missing.push('INTEL_INGEST_SIGNING_SECRET');
    if (missing.length > 0) {
        throw new Error(`Missing required values: ${missing.join(', ')}. Set them in .env or pass CLI flags.`);
    }

    const count = parseIntegerFlag('--count', 5, 1, 200);
    const lat = parseNumberFlag('--lat', 31.6259, -90, 90);
    const lng = parseNumberFlag('--lng', -7.9890, -180, 180);
    const source = parseStringFlag('--source', 'ops_probe');
    const dangerLevel = parseStringFlag('--danger-level', 'medium');
    const sessionId = `ops_probe_${Date.now().toString(36)}`;

    const nowMs = Date.now();
    const events = [];
    for (let i = 0; i < count; i += 1) {
        const envelope = {
            id: `probe_${nowMs}_${i}`,
            event_name: 'context.update',
            occurred_at: new Date(nowMs + i * 10).toISOString(),
            payload: {
                type: 'location',
                lat,
                lng,
                dangerLevel
            },
            meta: {
                source,
                sessionId
            },
            nonce: `probe_nonce_${nowMs}_${i}`,
            signature: null,
            signature_alg: 'sha256'
        };
        envelope.signature = signEnvelope(envelope, signingSecret);
        events.push(envelope);
    }

    const endpoint = `${supabaseUrl}/functions/v1/intel-ingest`;
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'x-intel-ingest-key': ingestApiKey
        },
        body: JSON.stringify({ events })
    });

    let payload = null;
    try {
        payload = await response.json();
    } catch (_error) {
        payload = null;
    }

    const acceptedCount = Number(payload?.acceptedCount || 0);
    const rejectedCount = Number(payload?.rejectedCount || 0);
    const persistedCount = payload?.persistedCount === undefined ? null : Number(payload.persistedCount);
    const rejectedPersistedCount = payload?.rejectedPersistedCount === undefined
        ? null
        : Number(payload.rejectedPersistedCount);
    const ok = Boolean(response.ok) && acceptedCount >= count && rejectedCount === 0;

    const report = {
        ok,
        endpoint,
        requestedCount: count,
        responseStatus: response.status,
        acceptedCount,
        rejectedCount,
        persistedCount,
        persistenceWarning: payload?.persistenceWarning ?? null,
        rejectedPersistedCount,
        rejectionPersistenceWarning: payload?.rejectionPersistenceWarning ?? null
    };

    console.log(JSON.stringify(report, null, 2));
    if (!ok) {
        process.exitCode = 2;
    }
}

main().catch((error) => {
    console.error('[INTEL_INGEST_PROBE] FAIL');
    console.error(error && error.stack ? error.stack : String(error));
    process.exit(1);
});
