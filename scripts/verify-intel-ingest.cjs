#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

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

function sha256Hex(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
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

function buildProbeEvents(options) {
    const { count, lat, lng, dangerLevel, source, signingSecret } = options;
    const sessionId = `ops_verify_${Date.now().toString(36)}`;
    const nowMs = Date.now();
    const events = [];

    for (let i = 0; i < count; i += 1) {
        const envelope = {
            id: `verify_${nowMs}_${i}`,
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
            nonce: `verify_nonce_${nowMs}_${i}`,
            signature: null,
            signature_alg: 'sha256'
        };
        envelope.signature = sha256Hex(`${signingSecret}.${buildCanonicalForSignature(envelope)}`);
        events.push(envelope);
    }

    return events;
}

async function runProbe(options) {
    const {
        supabaseUrl,
        ingestApiKey,
        signingSecret,
        count,
        lat,
        lng,
        dangerLevel,
        source
    } = options;

    const endpoint = `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/intel-ingest`;
    const events = buildProbeEvents({
        count,
        lat,
        lng,
        dangerLevel,
        source,
        signingSecret
    });

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'x-intel-ingest-key': ingestApiKey
        },
        body: JSON.stringify({ events })
    });

    let body = null;
    try {
        body = await response.json();
    } catch (_error) {
        body = null;
    }

    const acceptedCount = Number(body?.acceptedCount || 0);
    const rejectedCount = Number(body?.rejectedCount || 0);
    const persistedCount = body?.persistedCount === undefined ? null : Number(body.persistedCount);
    const ok = Boolean(response.ok) && acceptedCount >= count && rejectedCount === 0;

    return {
        ok,
        endpoint,
        requestedCount: count,
        responseStatus: response.status,
        acceptedCount,
        rejectedCount,
        persistedCount,
        persistenceWarning: body?.persistenceWarning ?? null
    };
}

function buildHealthChecks(metrics, minEvents, maxDelayed) {
    const totalEvents = Number(metrics.totalEvents || 0);
    const delayedIngestCount = Number(metrics.delayedIngestCount || 0);
    return [
        {
            id: 'min_events',
            required: `>= ${minEvents}`,
            value: totalEvents,
            ok: totalEvents >= minEvents
        },
        {
            id: 'max_delayed',
            required: `<= ${maxDelayed}`,
            value: delayedIngestCount,
            ok: delayedIngestCount <= maxDelayed
        }
    ];
}

async function runHealth(options) {
    const {
        supabaseUrl,
        serviceRoleKey,
        windowMinutes,
        minEvents,
        maxDelayed
    } = options;

    const client = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    });

    const { data, error } = await client.rpc('get_intel_ingest_health', {
        window_minutes: windowMinutes
    });
    if (error) {
        throw new Error(`RPC get_intel_ingest_health failed: ${error.message}`);
    }

    const metrics = data && typeof data === 'object' ? data : {};
    const checks = buildHealthChecks(metrics, minEvents, maxDelayed);
    const ok = checks.every((check) => check.ok);

    return {
        ok,
        windowMinutes,
        checks,
        metrics
    };
}

async function main() {
    const supabaseUrl = parseStringFlag('--supabase-url', String(process.env.SUPABASE_URL || '').trim());
    const serviceRoleKey = parseStringFlag('--service-role-key', String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim());
    const ingestApiKey = parseStringFlag('--api-key', String(process.env.INTEL_INGEST_API_KEY || '').trim());
    const signingSecret = parseStringFlag('--signing-secret', String(process.env.INTEL_INGEST_SIGNING_SECRET || '').trim());

    if (!supabaseUrl || !serviceRoleKey || !ingestApiKey || !signingSecret) {
        throw new Error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / INTEL_INGEST_API_KEY / INTEL_INGEST_SIGNING_SECRET');
    }

    const count = parseIntegerFlag('--count', 5, 1, 200);
    const windowMinutes = parseIntegerFlag('--window-minutes', 60, 1, 1440);
    const minEvents = parseIntegerFlag('--min-events', count, 0, 1000000);
    const maxDelayed = parseIntegerFlag('--max-delayed', 25, 0, 1000000);
    const lat = parseNumberFlag('--lat', 31.6259, -90, 90);
    const lng = parseNumberFlag('--lng', -7.9890, -180, 180);
    const source = parseStringFlag('--source', 'ops_verify');
    const dangerLevel = parseStringFlag('--danger-level', 'medium');

    const probe = await runProbe({
        supabaseUrl,
        ingestApiKey,
        signingSecret,
        count,
        lat,
        lng,
        dangerLevel,
        source
    });

    const health = await runHealth({
        supabaseUrl,
        serviceRoleKey,
        windowMinutes,
        minEvents,
        maxDelayed
    });

    const report = {
        ok: probe.ok && health.ok,
        probe,
        health
    };

    console.log(JSON.stringify(report, null, 2));
    if (!report.ok) {
        process.exitCode = 2;
    }
}

main().catch((error) => {
    console.error('[INTEL_INGEST_VERIFY] FAIL');
    console.error(error && error.stack ? error.stack : String(error));
    process.exit(1);
});
