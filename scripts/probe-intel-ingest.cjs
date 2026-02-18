#!/usr/bin/env node
'use strict';

const crypto = require('crypto');

function parseIntegerFlag(flagName, fallback, min, max) {
    const index = process.argv.indexOf(flagName);
    if (index === -1) return fallback;
    const raw = process.argv[index + 1];
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
        throw new Error(`${flagName} must be an integer in [${min}, ${max}]`);
    }
    return parsed;
}

function parseNumberFlag(flagName, fallback, min, max) {
    const index = process.argv.indexOf(flagName);
    if (index === -1) return fallback;
    const raw = process.argv[index + 1];
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
        throw new Error(`${flagName} must be a number in [${min}, ${max}]`);
    }
    return parsed;
}

function parseStringFlag(flagName, fallback) {
    const index = process.argv.indexOf(flagName);
    if (index === -1) return fallback;
    return String(process.argv[index + 1] || '').trim() || fallback;
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
    const supabaseUrl = parseStringFlag('--supabase-url', String(process.env.SUPABASE_URL || '').trim());
    const ingestApiKey = parseStringFlag('--api-key', String(process.env.INTEL_INGEST_API_KEY || '').trim());
    const signingSecret = parseStringFlag('--signing-secret', String(process.env.INTEL_INGEST_SIGNING_SECRET || '').trim());

    if (!supabaseUrl || !ingestApiKey || !signingSecret) {
        throw new Error('Missing SUPABASE_URL / INTEL_INGEST_API_KEY / INTEL_INGEST_SIGNING_SECRET in environment');
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

    const endpoint = `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/intel-ingest`;
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
    const ok = Boolean(response.ok) && acceptedCount >= count && rejectedCount === 0;

    const report = {
        ok,
        endpoint,
        requestedCount: count,
        responseStatus: response.status,
        acceptedCount,
        rejectedCount,
        persistedCount,
        persistenceWarning: payload?.persistenceWarning ?? null
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
