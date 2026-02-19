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

function hasFlag(flagName) {
    return process.argv.includes(flagName);
}

function parseCsvFlag(flagName) {
    const raw = parseStringFlag(flagName, '').trim();
    if (!raw) return [];
    return raw
        .split(',')
        .map((value) => String(value || '').trim())
        .filter(Boolean);
}

function sourcePatternMatches(sourceName, sourcePattern) {
    if (!sourcePattern) return false;
    if (sourcePattern.endsWith('*')) {
        return sourceName.startsWith(sourcePattern.slice(0, -1));
    }
    return sourceName === sourcePattern;
}

function parseAllowedRejectSourceReasonRulesRaw(rawValue, flagName) {
    const raw = String(rawValue || '').trim();
    if (!raw) return [];

    return raw
        .split(',')
        .map((entryRaw) => String(entryRaw || '').trim())
        .filter(Boolean)
        .map((entry) => {
            const separatorIndex = entry.indexOf(':');
            if (separatorIndex <= 0 || separatorIndex >= entry.length - 1) {
                throw new Error(`${flagName} entry "${entry}" must use sourcePattern:reason1|reason2`);
            }

            const sourcePattern = entry.slice(0, separatorIndex).trim();
            const reasons = entry
                .slice(separatorIndex + 1)
                .split('|')
                .map((value) => String(value || '').trim())
                .filter(Boolean);

            if (!sourcePattern) {
                throw new Error(`${flagName} entry "${entry}" is missing sourcePattern`);
            }
            if (sourcePattern.includes('*') && !sourcePattern.endsWith('*')) {
                throw new Error(`${flagName} sourcePattern "${sourcePattern}" only supports wildcard suffix "*"`);
            }
            if (reasons.length === 0) {
                throw new Error(`${flagName} entry "${entry}" must include at least one reason`);
            }

            return {
                sourcePattern,
                reasons: Array.from(new Set(reasons))
            };
        });
}

function parseAllowedRejectSourceReasonRules(flagName) {
    const raw = parseStringFlag(flagName, '').trim();
    return parseAllowedRejectSourceReasonRulesRaw(raw, flagName);
}

function normalizeHealthProfileName(rawName) {
    const normalized = String(rawName || '').trim().toLowerCase().replace(/-/g, '_');
    if (!normalized) return '';
    const aliases = {
        fast: 'quick',
        standard: 'quick',
        full: 'strict'
    };
    return aliases[normalized] || normalized;
}

function getHealthProfileDefaults(profileName) {
    if (!profileName) return null;
    const profiles = {
        quick: {
            windowMinutes: 20,
            minEvents: 3,
            maxDelayed: 25,
            minDistinctSessions: 1,
            maxP95DelayMs: 120000,
            maxFreshnessSeconds: 900,
            maxRejected: 1000000,
            maxRejectRatePct: 5,
            requireSource: 'ops_verify',
            minSourceEvents: 3,
            rejectSource: 'ops_verify',
            minRejectSourceEvents: 0,
            maxRejectSourceEvents: 0,
            ignoreRejectSourceInRate: '',
            ignoreRejectSourcesInRate: ['ops_reject_probe'],
            ignoreRejectSourcePrefixes: ['ops_verify_reject_'],
            allowedRejectReasons: ['invalid_signature'],
            allowedRejectSources: ['ops_reject_probe'],
            allowedRejectSourcePrefixes: ['ops_verify_reject_'],
            allowedRejectSourceReasons: 'ops_reject_probe:invalid_signature,ops_verify_reject_*:invalid_signature',
            healthRetries: 1,
            retryDelayMs: 250
        },
        strict: {
            windowMinutes: 15,
            minEvents: 5,
            maxDelayed: 25,
            minDistinctSessions: 1,
            maxP95DelayMs: 120000,
            maxFreshnessSeconds: 900,
            maxRejected: 1000000,
            maxRejectRatePct: 5,
            requireSource: 'ops_verify',
            minSourceEvents: 5,
            rejectSource: 'ops_verify',
            minRejectSourceEvents: 0,
            maxRejectSourceEvents: 0,
            ignoreRejectSourceInRate: '',
            ignoreRejectSourcesInRate: ['ops_reject_probe'],
            ignoreRejectSourcePrefixes: ['ops_verify_reject_'],
            allowedRejectReasons: ['invalid_signature'],
            allowedRejectSources: ['ops_reject_probe'],
            allowedRejectSourcePrefixes: ['ops_verify_reject_'],
            allowedRejectSourceReasons: 'ops_reject_probe:invalid_signature,ops_verify_reject_*:invalid_signature',
            healthRetries: 2,
            retryDelayMs: 300
        }
    };
    const selected = profiles[profileName];
    if (!selected) {
        throw new Error(`Unknown --profile value "${profileName}". Allowed: quick, strict`);
    }
    return selected;
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

function isLikelyTransientRpcError(error) {
    if (!error) return false;
    const code = String(error.code || '').trim().toUpperCase();
    if (['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN'].includes(code)) {
        return true;
    }

    const message = String(error.message || '').toLowerCase();
    if (!message) return false;

    const transientTokens = [
        'fetch failed',
        'network',
        'socket hang up',
        'timeout',
        'timed out',
        'temporar',
        'too many requests',
        'rate limit'
    ];
    if (transientTokens.some((token) => message.includes(token))) {
        return true;
    }

    return /\b429\b/.test(message) || /\b5\d\d\b/.test(message);
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, Math.max(0, Number(ms) || 0));
    });
}

function computeRetryDelayMs(baseDelayMs, attemptNumber) {
    const normalizedBaseDelay = Math.max(0, Number(baseDelayMs) || 0);
    const normalizedAttempt = Math.max(1, Number(attemptNumber) || 1);
    const backoffFactor = 2 ** Math.max(0, normalizedAttempt - 1);
    return Math.min(normalizedBaseDelay * backoffFactor, 5000);
}

async function main() {
    const profile = normalizeHealthProfileName(parseStringFlag('--profile', ''));
    const profileDefaults = getHealthProfileDefaults(profile);
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

    const windowMinutes = parseIntegerFlag('--window-minutes', profileDefaults?.windowMinutes ?? 15, 1, 1440);
    const healthRetries = parseIntegerFlag('--health-retries', profileDefaults?.healthRetries ?? 1, 0, 5);
    const retryDelayMs = parseIntegerFlag('--retry-delay-ms', profileDefaults?.retryDelayMs ?? 250, 50, 10000);
    const minEvents = parseIntegerFlag('--min-events', profileDefaults?.minEvents ?? 0, 0, 1000000);
    const maxDelayed = parseIntegerFlag('--max-delayed', profileDefaults?.maxDelayed ?? 25, 0, 1000000);
    const minDistinctSessions = parseIntegerFlag('--min-distinct-sessions', profileDefaults?.minDistinctSessions ?? 0, 0, 1000000);
    const maxP95DelayMs = parseIntegerFlag('--max-p95-delay-ms', profileDefaults?.maxP95DelayMs ?? 120000, 0, 3600000);
    const maxFreshnessSeconds = parseIntegerFlag('--max-freshness-seconds', profileDefaults?.maxFreshnessSeconds ?? 900, 0, 86400);
    const maxRejected = parseIntegerFlag('--max-rejected', profileDefaults?.maxRejected ?? 1000000, 0, 1000000);
    const maxRejectRatePct = parseNumberFlag('--max-reject-rate-pct', profileDefaults?.maxRejectRatePct ?? 100, 0, 100);
    const ignoreRejectSourceInRate = parseStringFlag(
        '--ignore-reject-source-in-rate',
        profileDefaults?.ignoreRejectSourceInRate ?? ''
    ).trim();
    const ignoreRejectSourcesInRate = parseCsvFlag('--ignore-reject-sources-in-rate');
    const ignoreRejectSourcePrefixes = parseCsvFlag('--ignore-reject-source-prefixes');
    const allowedRejectReasons = parseCsvFlag('--allowed-reject-reasons');
    const allowedRejectSources = parseCsvFlag('--allowed-reject-sources');
    const allowedRejectSourcePrefixes = parseCsvFlag('--allowed-reject-source-prefixes');
    const allowedRejectSourceReasonRules = parseAllowedRejectSourceReasonRules('--allowed-reject-source-reasons');
    const requireSource = parseStringFlag('--require-source', profileDefaults?.requireSource ?? '').trim();
    const minSourceEvents = parseIntegerFlag('--min-source-events', profileDefaults?.minSourceEvents ?? 0, 0, 1000000);
    const rejectSource = parseStringFlag('--reject-source', profileDefaults?.rejectSource ?? '').trim();
    const minRejectSourceEvents = parseIntegerFlag(
        '--min-reject-source-events',
        profileDefaults?.minRejectSourceEvents ?? 0,
        0,
        1000000
    );
    const maxRejectSourceEvents = parseIntegerFlag(
        '--max-reject-source-events',
        profileDefaults?.maxRejectSourceEvents ?? 0,
        0,
        1000000
    );

    if (!hasFlag('--ignore-reject-sources-in-rate') &&
        ignoreRejectSourcesInRate.length === 0 &&
        Array.isArray(profileDefaults?.ignoreRejectSourcesInRate)) {
        ignoreRejectSourcesInRate.push(...profileDefaults.ignoreRejectSourcesInRate);
    }
    if (!hasFlag('--ignore-reject-source-prefixes') &&
        ignoreRejectSourcePrefixes.length === 0 &&
        Array.isArray(profileDefaults?.ignoreRejectSourcePrefixes)) {
        ignoreRejectSourcePrefixes.push(...profileDefaults.ignoreRejectSourcePrefixes);
    }
    if (!hasFlag('--allowed-reject-reasons') &&
        allowedRejectReasons.length === 0 &&
        Array.isArray(profileDefaults?.allowedRejectReasons)) {
        allowedRejectReasons.push(...profileDefaults.allowedRejectReasons);
    }
    if (!hasFlag('--allowed-reject-sources') &&
        allowedRejectSources.length === 0 &&
        Array.isArray(profileDefaults?.allowedRejectSources)) {
        allowedRejectSources.push(...profileDefaults.allowedRejectSources);
    }
    if (!hasFlag('--allowed-reject-source-prefixes') &&
        allowedRejectSourcePrefixes.length === 0 &&
        Array.isArray(profileDefaults?.allowedRejectSourcePrefixes)) {
        allowedRejectSourcePrefixes.push(...profileDefaults.allowedRejectSourcePrefixes);
    }
    if (!hasFlag('--allowed-reject-source-reasons') &&
        allowedRejectSourceReasonRules.length === 0 &&
        profileDefaults?.allowedRejectSourceReasons) {
        const derived = parseAllowedRejectSourceReasonRulesRaw(
            profileDefaults.allowedRejectSourceReasons,
            '--allowed-reject-source-reasons'
        );
        allowedRejectSourceReasonRules.push(...derived);
    }

    const client = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    });

    const totalAttempts = Math.max(0, Number(healthRetries) || 0) + 1;
    let attempt = 0;
    let data = null;
    let error = null;

    while (attempt < totalAttempts) {
        attempt += 1;
        const result = await client.rpc('get_intel_ingest_health', {
            window_minutes: windowMinutes
        });
        data = result.data;
        error = result.error;

        if (!error) {
            break;
        }

        const transient = isLikelyTransientRpcError(error);
        if (transient && attempt < totalAttempts) {
            await sleep(computeRetryDelayMs(retryDelayMs, attempt));
            continue;
        }

        throw new Error(`RPC get_intel_ingest_health failed: ${error.message}`);
    }

    if (error) {
        throw new Error(`RPC get_intel_ingest_health failed after retries: ${error.message}`);
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
    const rejectedBySourceReason = metrics.rejectedBySourceReason && typeof metrics.rejectedBySourceReason === 'object'
        ? metrics.rejectedBySourceReason
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
    const observedRejectSourceReasonPairs = Object.entries(rejectedBySourceReason)
        .flatMap(([sourceName, reasonsBucket]) => {
            if (!reasonsBucket || typeof reasonsBucket !== 'object') return [];
            return Object.keys(reasonsBucket).map((reason) => ({ sourceName, reason }));
        })
        .sort((left, right) => {
            if (left.sourceName === right.sourceName) {
                return left.reason.localeCompare(right.reason);
            }
            return left.sourceName.localeCompare(right.sourceName);
        });
    const unexpectedRejectSourceReasonPairs = allowedRejectSourceReasonRules.length > 0
        ? observedRejectSourceReasonPairs.filter(({ sourceName, reason }) => {
            return !allowedRejectSourceReasonRules.some((rule) => {
                const sourceMatches = sourcePatternMatches(sourceName, rule.sourcePattern);
                const reasonMatches = rule.reasons.includes(reason);
                return sourceMatches && reasonMatches;
            });
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
        },
        {
            id: 'allowed_reject_source_reasons',
            required: allowedRejectSourceReasonRules.length > 0
                ? allowedRejectSourceReasonRules
                    .map((rule) => `${rule.sourcePattern}:${rule.reasons.join('|')}`)
                    .join(', ')
                : 'not_required',
            value: observedRejectSourceReasonPairs.map(({ sourceName, reason }) => `${sourceName}:${reason}`),
            unexpected: unexpectedRejectSourceReasonPairs.map(({ sourceName, reason }) => `${sourceName}:${reason}`),
            ok: allowedRejectSourceReasonRules.length > 0
                ? unexpectedRejectSourceReasonPairs.length === 0
                : true
        }
    ];

    const ok = checks.every((check) => check.ok);

    const report = {
        ok,
        windowMinutes,
        checks,
        metrics,
        retryPolicy: {
            healthRetries,
            retryDelayMs,
            attempts: attempt,
            retriesUsed: Math.max(0, attempt - 1),
            retried: attempt > 1
        }
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
