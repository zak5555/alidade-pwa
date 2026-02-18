#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

function getEnvValue(name) {
    if (process.env[name]) return String(process.env[name]).trim();
    const fallbackKey = Object.keys(process.env).find((key) => key.replace(/^\uFEFF/, '') === name);
    return fallbackKey ? String(process.env[fallbackKey] || '').trim() : '';
}

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

function parseCsvFlag(flagName) {
    const raw = parseStringFlag(flagName, '').trim();
    if (!raw) return [];
    return raw
        .split(',')
        .map((value) => String(value || '').trim())
        .filter(Boolean);
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
    const {
        count,
        lat,
        lng,
        dangerLevel,
        source,
        signingSecret,
        eventIdPrefix = 'verify',
        sessionPrefix = 'ops_verify',
        tamperSignature = false
    } = options;
    const sessionId = `${sessionPrefix}_${Date.now().toString(36)}`;
    const nowMs = Date.now();
    const events = [];

    for (let i = 0; i < count; i += 1) {
        const envelope = {
            id: `${eventIdPrefix}_${nowMs}_${i}`,
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
        if (tamperSignature) {
            envelope.signature = `x${String(envelope.signature).slice(1)}`;
        }
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
        source,
        eventIdPrefix = 'verify',
        sessionPrefix = 'ops_verify',
        tamperSignature = false,
        expectRejects = false
    } = options;

    const endpoint = `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/intel-ingest`;
    const events = buildProbeEvents({
        count,
        lat,
        lng,
        dangerLevel,
        source,
        signingSecret,
        eventIdPrefix,
        sessionPrefix,
        tamperSignature
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
    const rejectedReasons = Array.isArray(body?.rejected)
        ? body.rejected
            .map((item) => String(item?.reason || '').trim())
            .filter(Boolean)
        : [];
    const persistedCount = body?.persistedCount === undefined ? null : Number(body.persistedCount);
    const rejectedPersistedCount = body?.rejectedPersistedCount === undefined
        ? null
        : Number(body.rejectedPersistedCount);
    const ok = expectRejects
        ? Boolean(response.ok) && acceptedCount === 0 && rejectedCount >= count
        : Boolean(response.ok) && acceptedCount >= count && rejectedCount === 0;

    return {
        ok,
        endpoint,
        requestedCount: count,
        responseStatus: response.status,
        expectedMode: expectRejects ? 'reject' : 'accept',
        acceptedCount,
        rejectedCount,
        rejectedReasons,
        persistedCount,
        persistenceWarning: body?.persistenceWarning ?? null,
        rejectedPersistedCount,
        rejectionPersistenceWarning: body?.rejectionPersistenceWarning ?? null
    };
}

function buildHealthChecks(metrics, minEvents, maxDelayed) {
    const totalEvents = Number(metrics.totalEvents || 0);
    const totalRejected = Number(metrics.totalRejected || 0);
    const delayedIngestCount = Number(metrics.delayedIngestCount || 0);
    const distinctSessions = Number(metrics.distinctSessions || 0);
    const p95DelayMs = metrics.ingestDelayMsP95 === null || metrics.ingestDelayMsP95 === undefined
        ? null
        : Number(metrics.ingestDelayMsP95);
    const freshnessSeconds = metrics.freshnessSeconds === null || metrics.freshnessSeconds === undefined
        ? null
        : Number(metrics.freshnessSeconds);
    const minDistinctSessions = Number(metrics.__minDistinctSessionsThreshold || 0);
    const maxP95DelayMs = Number(metrics.__maxP95DelayMsThreshold || 120000);
    const maxFreshnessSeconds = Number(metrics.__maxFreshnessSecondsThreshold || 900);
    const maxRejected = Number(metrics.__maxRejectedThreshold || 1000000);
    const maxRejectRatePct = Number(metrics.__maxRejectRatePctThreshold || 100);
    const ignoreRejectSourceInRate = String(metrics.__ignoreRejectSourceInRate || '').trim();
    const ignoreRejectSourcesInRate = Array.isArray(metrics.__ignoreRejectSourcesInRate)
        ? metrics.__ignoreRejectSourcesInRate
            .map((value) => String(value || '').trim())
            .filter(Boolean)
        : [];
    const ignoreRejectSourcePrefixes = Array.isArray(metrics.__ignoreRejectSourcePrefixes)
        ? metrics.__ignoreRejectSourcePrefixes
            .map((value) => String(value || '').trim())
            .filter(Boolean)
        : [];
    const allowedRejectReasons = Array.isArray(metrics.__allowedRejectReasons)
        ? metrics.__allowedRejectReasons
            .map((value) => String(value || '').trim())
            .filter(Boolean)
        : [];
    const allowedRejectSources = Array.isArray(metrics.__allowedRejectSources)
        ? metrics.__allowedRejectSources
            .map((value) => String(value || '').trim())
            .filter(Boolean)
        : [];
    const allowedRejectSourcePrefixes = Array.isArray(metrics.__allowedRejectSourcePrefixes)
        ? metrics.__allowedRejectSourcePrefixes
            .map((value) => String(value || '').trim())
            .filter(Boolean)
        : [];
    const requireSource = String(metrics.__requireSource || '').trim();
    const minSourceEvents = Number(metrics.__minSourceEventsThreshold || 0);
    const rejectSource = String(metrics.__rejectSource || '').trim();
    const minRejectSourceEvents = Number(metrics.__minRejectSourceEventsThreshold || 0);
    const maxRejectSourceEvents = Number(metrics.__maxRejectSourceEventsThreshold || 0);
    const eventsBySource = metrics.eventsBySource && typeof metrics.eventsBySource === 'object'
        ? metrics.eventsBySource
        : {};
    const rejectedBySource = metrics.rejectedBySource && typeof metrics.rejectedBySource === 'object'
        ? metrics.rejectedBySource
        : {};
    const rejectedByReason = metrics.rejectedByReason && typeof metrics.rejectedByReason === 'object'
        ? metrics.rejectedByReason
        : {};
    const rejectedSourceKeys = Object.keys(rejectedBySource);
    const rejectedReasonKeys = Object.keys(rejectedByReason);
    const allowedRejectReasonsSet = new Set(allowedRejectReasons);
    const allowedRejectSourcesSet = new Set(allowedRejectSources);
    const unexpectedRejectReasons = allowedRejectReasons.length > 0
        ? rejectedReasonKeys.filter((reason) => !allowedRejectReasonsSet.has(reason))
        : [];
    const unexpectedRejectSources = (allowedRejectSources.length > 0 || allowedRejectSourcePrefixes.length > 0)
        ? rejectedSourceKeys.filter((sourceName) => {
            const allowedByName = allowedRejectSourcesSet.has(sourceName);
            const allowedByPrefix = allowedRejectSourcePrefixes.some((prefix) => sourceName.startsWith(prefix));
            return !allowedByName && !allowedByPrefix;
        })
        : [];
    const sourceEventCount = requireSource ? Number(eventsBySource[requireSource] || 0) : null;
    const rejectSourceEventCount = rejectSource ? Number(rejectedBySource[rejectSource] || 0) : null;
    const rejectRatePercent = metrics.rejectRatePercent === null || metrics.rejectRatePercent === undefined
        ? null
        : Number(metrics.rejectRatePercent);
    const ignoredRejectSourceNames = new Set([
        ...(ignoreRejectSourceInRate ? [ignoreRejectSourceInRate] : []),
        ...ignoreRejectSourcesInRate
    ]);
    const ignoredRejectSourceCount = Object.entries(rejectedBySource).reduce((total, [sourceName, count]) => {
        const ignoredByName = ignoredRejectSourceNames.has(sourceName);
        const ignoredByPrefix = ignoreRejectSourcePrefixes.some((prefix) => sourceName.startsWith(prefix));
        if (ignoredByName || ignoredByPrefix) {
            return total + Number(count || 0);
        }
        return total;
    }, 0);
    const adjustedRejectedCount = Math.max(totalRejected - ignoredRejectSourceCount, 0);
    const adjustedRejectRatePercent = (totalEvents + adjustedRejectedCount) === 0
        ? 0
        : Number(((adjustedRejectedCount * 100) / (totalEvents + adjustedRejectedCount)).toFixed(4));

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
        },
        {
            id: 'min_distinct_sessions',
            required: `>= ${minDistinctSessions}`,
            value: distinctSessions,
            ok: distinctSessions >= minDistinctSessions
        },
        {
            id: 'max_p95_delay_ms',
            required: `<= ${maxP95DelayMs}`,
            value: p95DelayMs,
            ok: totalEvents === 0 ? true : Number.isFinite(Number(p95DelayMs)) && Number(p95DelayMs) <= maxP95DelayMs
        },
        {
            id: 'max_freshness_seconds',
            required: `<= ${maxFreshnessSeconds}`,
            value: freshnessSeconds,
            ok: totalEvents === 0 ? true : Number.isFinite(Number(freshnessSeconds)) && Number(freshnessSeconds) <= maxFreshnessSeconds
        },
        {
            id: 'source_min_events',
            required: requireSource ? `${requireSource} >= ${minSourceEvents}` : 'not_required',
            value: requireSource ? sourceEventCount : null,
            ok: requireSource ? sourceEventCount >= minSourceEvents : true
        },
        {
            id: 'max_rejected',
            required: `<= ${maxRejected}`,
            value: totalRejected,
            ok: totalRejected <= maxRejected
        },
        {
            id: 'max_reject_rate_pct',
            required: (() => {
                const ignoredLabelParts = [
                    ...(ignoreRejectSourceInRate ? [ignoreRejectSourceInRate] : []),
                    ...ignoreRejectSourcesInRate,
                    ...ignoreRejectSourcePrefixes.map((prefix) => `${prefix}*`)
                ];
                return ignoredLabelParts.length > 0
                    ? `<= ${maxRejectRatePct} (excluding ${ignoredLabelParts.join(', ')})`
                    : `<= ${maxRejectRatePct}`;
            })(),
            value: (ignoredRejectSourceNames.size > 0 || ignoreRejectSourcePrefixes.length > 0)
                ? adjustedRejectRatePercent
                : rejectRatePercent,
            ok: (totalEvents + adjustedRejectedCount) === 0
                ? true
                : Number.isFinite(Number((ignoredRejectSourceNames.size > 0 || ignoreRejectSourcePrefixes.length > 0)
                    ? adjustedRejectRatePercent
                    : rejectRatePercent))
                    && Number((ignoredRejectSourceNames.size > 0 || ignoreRejectSourcePrefixes.length > 0)
                        ? adjustedRejectRatePercent
                        : rejectRatePercent) <= maxRejectRatePct
        },
        {
            id: 'reject_source_max_events',
            required: rejectSource ? `${rejectSource} <= ${maxRejectSourceEvents}` : 'not_required',
            value: rejectSource ? rejectSourceEventCount : null,
            ok: rejectSource ? rejectSourceEventCount <= maxRejectSourceEvents : true
        },
        {
            id: 'reject_source_min_events',
            required: rejectSource ? `${rejectSource} >= ${minRejectSourceEvents}` : 'not_required',
            value: rejectSource ? rejectSourceEventCount : null,
            ok: rejectSource ? rejectSourceEventCount >= minRejectSourceEvents : true
        },
        {
            id: 'allowed_reject_reasons',
            required: allowedRejectReasons.length > 0 ? allowedRejectReasons.join(', ') : 'not_required',
            value: rejectedReasonKeys,
            unexpected: unexpectedRejectReasons,
            ok: allowedRejectReasons.length > 0 ? unexpectedRejectReasons.length === 0 : true
        },
        {
            id: 'allowed_reject_sources',
            required: (() => {
                const requiredTokens = [
                    ...allowedRejectSources,
                    ...allowedRejectSourcePrefixes.map((prefix) => `${prefix}*`)
                ];
                return requiredTokens.length > 0 ? requiredTokens.join(', ') : 'not_required';
            })(),
            value: rejectedSourceKeys,
            unexpected: unexpectedRejectSources,
            ok: (allowedRejectSources.length > 0 || allowedRejectSourcePrefixes.length > 0)
                ? unexpectedRejectSources.length === 0
                : true
        }
    ];
}

async function runHealth(options) {
    const {
        supabaseUrl,
        serviceRoleKey,
        windowMinutes,
        minEvents,
        maxDelayed,
        minDistinctSessions,
        maxP95DelayMs,
        maxFreshnessSeconds,
        requireSource,
        minSourceEvents,
        maxRejected,
        maxRejectRatePct,
        ignoreRejectSourceInRate,
        ignoreRejectSourcesInRate,
        ignoreRejectSourcePrefixes,
        allowedRejectReasons,
        allowedRejectSources,
        allowedRejectSourcePrefixes,
        rejectSource,
        minRejectSourceEvents,
        maxRejectSourceEvents
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
    const checks = buildHealthChecks({
        ...metrics,
        __minDistinctSessionsThreshold: minDistinctSessions,
        __maxP95DelayMsThreshold: maxP95DelayMs,
        __maxFreshnessSecondsThreshold: maxFreshnessSeconds,
        __requireSource: requireSource,
        __minSourceEventsThreshold: minSourceEvents,
        __maxRejectedThreshold: maxRejected,
        __maxRejectRatePctThreshold: maxRejectRatePct,
        __ignoreRejectSourceInRate: ignoreRejectSourceInRate,
        __ignoreRejectSourcesInRate: ignoreRejectSourcesInRate,
        __ignoreRejectSourcePrefixes: ignoreRejectSourcePrefixes,
        __allowedRejectReasons: allowedRejectReasons,
        __allowedRejectSources: allowedRejectSources,
        __allowedRejectSourcePrefixes: allowedRejectSourcePrefixes,
        __rejectSource: rejectSource,
        __minRejectSourceEventsThreshold: minRejectSourceEvents,
        __maxRejectSourceEventsThreshold: maxRejectSourceEvents
    }, minEvents, maxDelayed);
    const ok = checks.every((check) => check.ok);

    return {
        ok,
        windowMinutes,
        checks,
        metrics
    };
}

async function main() {
    const supabaseUrl = normalizeSupabaseUrl(parseStringFlag('--supabase-url', getEnvValue('SUPABASE_URL')));
    const serviceRoleKey = parseStringFlag('--service-role-key', getEnvValue('SUPABASE_SERVICE_ROLE_KEY'));
    const ingestApiKey = parseStringFlag('--api-key', getEnvValue('INTEL_INGEST_API_KEY'));
    const signingSecret = parseStringFlag('--signing-secret', getEnvValue('INTEL_INGEST_SIGNING_SECRET'));

    const missing = [];
    if (!supabaseUrl) missing.push('SUPABASE_URL');
    if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
    if (!ingestApiKey) missing.push('INTEL_INGEST_API_KEY');
    if (!signingSecret) missing.push('INTEL_INGEST_SIGNING_SECRET');
    if (missing.length > 0) {
        throw new Error(`Missing required values: ${missing.join(', ')}. Set them in .env or pass CLI flags.`);
    }
    if (!isLikelySupabaseServiceRoleKey(serviceRoleKey)) {
        throw new Error(
            'SUPABASE_SERVICE_ROLE_KEY format looks invalid. Expected a service_role JWT or sb_secret_ key.'
        );
    }

    const count = parseIntegerFlag('--count', 5, 1, 200);
    const windowMinutes = parseIntegerFlag('--window-minutes', 60, 1, 1440);
    const minEvents = parseIntegerFlag('--min-events', count, 0, 1000000);
    const maxDelayed = parseIntegerFlag('--max-delayed', 25, 0, 1000000);
    const minDistinctSessions = parseIntegerFlag('--min-distinct-sessions', 1, 0, 1000000);
    const maxP95DelayMs = parseIntegerFlag('--max-p95-delay-ms', 120000, 0, 3600000);
    const maxFreshnessSeconds = parseIntegerFlag('--max-freshness-seconds', 900, 0, 86400);
    const maxRejected = parseIntegerFlag('--max-rejected', 1000000, 0, 1000000);
    const maxRejectRatePct = parseNumberFlag('--max-reject-rate-pct', 100, 0, 100);
    const allowedRejectReasons = parseCsvFlag('--allowed-reject-reasons');
    const allowedRejectSources = parseCsvFlag('--allowed-reject-sources');
    const allowedRejectSourcePrefixes = parseCsvFlag('--allowed-reject-source-prefixes');
    const requirePersistence = parseIntegerFlag('--require-persistence', 1, 0, 1) === 1;
    const rejectionProbeCount = parseIntegerFlag('--rejection-probe-count', 0, 0, 200);
    const rejectionProbeSource = parseStringFlag('--rejection-probe-source', 'ops_verify_reject_probe').trim();
    const requireRejectionPersistence = parseIntegerFlag('--require-rejection-persistence', 0, 0, 1) === 1;
    const rejectionProbeExpectedReason = parseStringFlag(
        '--rejection-probe-expected-reason',
        rejectionProbeCount > 0 ? 'invalid_signature' : ''
    ).trim();
    const lat = parseNumberFlag('--lat', 31.6259, -90, 90);
    const lng = parseNumberFlag('--lng', -7.9890, -180, 180);
    const source = parseStringFlag('--source', 'ops_verify');
    const requireSource = parseStringFlag('--require-source', source).trim();
    const minSourceEvents = parseIntegerFlag('--min-source-events', count, 0, 1000000);
    const rejectSourceDefault = rejectionProbeCount > 0 ? rejectionProbeSource : source;
    const rejectSource = parseStringFlag('--reject-source', rejectSourceDefault).trim();
    const minRejectSourceEventsDefault = rejectionProbeCount > 0 && rejectSource === rejectionProbeSource
        ? rejectionProbeCount
        : 0;
    const maxRejectSourceEventsDefault = rejectionProbeCount > 0 && rejectSource === rejectionProbeSource
        ? rejectionProbeCount
        : 0;
    const minRejectSourceEvents = parseIntegerFlag('--min-reject-source-events', minRejectSourceEventsDefault, 0, 1000000);
    const maxRejectSourceEvents = parseIntegerFlag('--max-reject-source-events', maxRejectSourceEventsDefault, 0, 1000000);
    const ignoreRejectSourceInRate = parseStringFlag(
        '--ignore-reject-source-in-rate',
        rejectionProbeCount > 0 ? rejectionProbeSource : ''
    ).trim();
    const ignoreRejectSourcesInRate = parseCsvFlag('--ignore-reject-sources-in-rate');
    const ignoreRejectSourcePrefixes = parseCsvFlag('--ignore-reject-source-prefixes');
    if (rejectionProbeCount > 0 && ignoreRejectSourcePrefixes.length === 0) {
        ignoreRejectSourcePrefixes.push('ops_verify_reject_');
    }
    const dangerLevel = parseStringFlag('--danger-level', 'medium');

    if (requireRejectionPersistence && rejectionProbeCount === 0) {
        throw new Error('--require-rejection-persistence=1 requires --rejection-probe-count >= 1');
    }

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

    const rejectionProbe = rejectionProbeCount > 0
        ? await runProbe({
            supabaseUrl,
            ingestApiKey,
            signingSecret,
            count: rejectionProbeCount,
            lat,
            lng,
            dangerLevel,
            source: rejectionProbeSource,
            eventIdPrefix: 'verify_reject',
            sessionPrefix: 'ops_verify_reject',
            tamperSignature: true,
            expectRejects: true
        })
        : null;

    const health = await runHealth({
        supabaseUrl,
        serviceRoleKey,
        windowMinutes,
        minEvents,
        maxDelayed,
        minDistinctSessions,
        maxP95DelayMs,
        maxFreshnessSeconds,
        requireSource,
        minSourceEvents,
        maxRejected,
        maxRejectRatePct,
        ignoreRejectSourceInRate,
        ignoreRejectSourcesInRate,
        ignoreRejectSourcePrefixes,
        allowedRejectReasons,
        allowedRejectSources,
        allowedRejectSourcePrefixes,
        rejectSource,
        minRejectSourceEvents,
        maxRejectSourceEvents
    });

    const persistenceOk = (() => {
        if (!requirePersistence) return true;
        if (probe.persistenceWarning) return false;
        if (probe.persistedCount === null || probe.persistedCount === undefined) return false;
        return Number(probe.persistedCount) >= count;
    })();

    const rejectionPersistenceOk = (() => {
        if (!requireRejectionPersistence) return true;
        if (!rejectionProbe || !rejectionProbe.ok) return false;
        if (rejectionProbe.rejectionPersistenceWarning) return false;
        if (rejectionProbe.rejectedPersistedCount === null || rejectionProbe.rejectedPersistedCount === undefined) return false;
        return Number(rejectionProbe.rejectedPersistedCount) >= rejectionProbeCount;
    })();

    const rejectionReasonOk = (() => {
        if (!rejectionProbeExpectedReason) return true;
        if (!rejectionProbe) return false;
        return Array.isArray(rejectionProbe.rejectedReasons)
            && rejectionProbe.rejectedReasons.includes(rejectionProbeExpectedReason);
    })();

    const report = {
        ok: probe.ok && health.ok && persistenceOk && rejectionPersistenceOk && rejectionReasonOk,
        probe,
        rejectionProbe,
        health,
        persistence: {
            required: requirePersistence,
            ok: persistenceOk
        },
        rejectionPersistence: {
            required: requireRejectionPersistence,
            ok: rejectionPersistenceOk
        },
        rejectionReason: {
            expected: rejectionProbeExpectedReason || null,
            observed: rejectionProbe && Array.isArray(rejectionProbe.rejectedReasons)
                ? rejectionProbe.rejectedReasons
                : [],
            ok: rejectionReasonOk
        }
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
