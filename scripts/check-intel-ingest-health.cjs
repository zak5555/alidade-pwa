#!/usr/bin/env node
'use strict';

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

async function main() {
    const supabaseUrl = normalizeSupabaseUrl(parseStringFlag('--supabase-url', getEnvValue('SUPABASE_URL')));
    const serviceRoleKey = parseStringFlag('--service-role-key', getEnvValue('SUPABASE_SERVICE_ROLE_KEY'));

    const missing = [];
    if (!supabaseUrl) missing.push('SUPABASE_URL');
    if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
    if (missing.length > 0) {
        throw new Error(`Missing required values: ${missing.join(', ')}. Set them in .env or pass CLI flags.`);
    }
    if (!isLikelySupabaseServiceRoleKey(serviceRoleKey)) {
        throw new Error(
            'SUPABASE_SERVICE_ROLE_KEY format looks invalid. Expected a service_role JWT or sb_secret_ key.'
        );
    }

    const windowMinutes = parseIntegerFlag('--window-minutes', 15, 1, 1440);
    const minEvents = parseIntegerFlag('--min-events', 0, 0, 1000000);
    const maxDelayed = parseIntegerFlag('--max-delayed', 25, 0, 1000000);
    const minDistinctSessions = parseIntegerFlag('--min-distinct-sessions', 0, 0, 1000000);
    const maxP95DelayMs = parseIntegerFlag('--max-p95-delay-ms', 120000, 0, 3600000);
    const maxFreshnessSeconds = parseIntegerFlag('--max-freshness-seconds', 900, 0, 86400);
    const maxRejected = parseIntegerFlag('--max-rejected', 1000000, 0, 1000000);
    const maxRejectRatePct = parseNumberFlag('--max-reject-rate-pct', 100, 0, 100);
    const ignoreRejectSourceInRate = parseStringFlag('--ignore-reject-source-in-rate', '').trim();
    const ignoreRejectSourcesInRate = parseCsvFlag('--ignore-reject-sources-in-rate');
    const ignoreRejectSourcePrefixes = parseCsvFlag('--ignore-reject-source-prefixes');
    const allowedRejectReasons = parseCsvFlag('--allowed-reject-reasons');
    const allowedRejectSources = parseCsvFlag('--allowed-reject-sources');
    const allowedRejectSourcePrefixes = parseCsvFlag('--allowed-reject-source-prefixes');
    const requireSource = parseStringFlag('--require-source', '').trim();
    const minSourceEvents = parseIntegerFlag('--min-source-events', 0, 0, 1000000);
    const rejectSource = parseStringFlag('--reject-source', '').trim();
    const minRejectSourceEvents = parseIntegerFlag('--min-reject-source-events', 0, 0, 1000000);
    const maxRejectSourceEvents = parseIntegerFlag('--max-reject-source-events', 0, 0, 1000000);

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
    const totalEvents = Number(metrics.totalEvents || 0);
    const totalRejected = Number(metrics.totalRejected || 0);
    const distinctSessions = Number(metrics.distinctSessions || 0);
    const delayedIngestCount = Number(metrics.delayedIngestCount || 0);
    const p95DelayMs = metrics.ingestDelayMsP95 === null || metrics.ingestDelayMsP95 === undefined
        ? null
        : Number(metrics.ingestDelayMsP95);
    const freshnessSeconds = metrics.freshnessSeconds === null || metrics.freshnessSeconds === undefined
        ? null
        : Number(metrics.freshnessSeconds);
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
    const sourceEventCount = requireSource
        ? Number(eventsBySource[requireSource] || 0)
        : null;
    const rejectSourceEventCount = rejectSource
        ? Number(rejectedBySource[rejectSource] || 0)
        : null;

    const checks = [
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

    const ok = checks.every((check) => check.ok);

    const report = {
        ok,
        windowMinutes,
        checks,
        metrics
    };

    console.log(JSON.stringify(report, null, 2));
    if (!ok) {
        process.exitCode = 2;
    }
}

main().catch((error) => {
    console.error('[INTEL_INGEST_HEALTH] FAIL');
    console.error(error && error.stack ? error.stack : String(error));
    process.exit(1);
});
