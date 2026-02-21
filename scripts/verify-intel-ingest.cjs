#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
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

function normalizeVerifyProfileName(rawName) {
    const normalized = String(rawName || '').trim().toLowerCase().replace(/-/g, '_');
    if (!normalized) return '';
    const aliases = {
        fast: 'quick',
        standard: 'quick',
        full: 'strict'
    };
    return aliases[normalized] || normalized;
}

function getVerifyProfileDefaults(profileName) {
    if (!profileName) return null;
    const profiles = {
        quick: {
            count: 3,
            windowMinutes: 20,
            minEvents: 3,
            maxDelayed: 25,
            minDistinctSessions: 1,
            maxP95DelayMs: 120000,
            maxFreshnessSeconds: 900,
            maxRejected: 1000000,
            maxRejectRatePct: 5,
            requirePersistence: true,
            source: 'ops_verify',
            requireSource: 'ops_verify',
            minSourceEvents: 3,
            rejectSource: 'ops_verify',
            minRejectSourceEvents: 0,
            maxRejectSourceEvents: 0,
            ignoreRejectSourceInRate: '',
            ignoreRejectSourcesInRate: ['ops_reject_probe', 'crowd_price_submit'],
            ignoreRejectSourcePrefixes: ['ops_verify_reject_'],
            allowedRejectReasons: ['invalid_signature', 'crowd_duplicate_within_window'],
            allowedRejectSources: ['ops_reject_probe', 'crowd_price_submit'],
            allowedRejectSourcePrefixes: ['ops_verify_reject_'],
            allowedRejectSourceReasons: 'ops_reject_probe:invalid_signature,ops_verify_reject_*:invalid_signature,crowd_price_submit:crowd_duplicate_within_window',
            rejectionProbeCount: 0,
            requireRejectionPersistence: false,
            rejectionProbeSource: 'ops_verify_reject_probe',
            rejectionProbeExpectedReason: '',
            probeRetries: 1,
            healthRetries: 1,
            retryDelayMs: 250
        },
        strict: {
            count: 5,
            windowMinutes: 60,
            minEvents: 5,
            maxDelayed: 25,
            minDistinctSessions: 1,
            maxP95DelayMs: 120000,
            maxFreshnessSeconds: 900,
            maxRejected: 1000000,
            maxRejectRatePct: 5,
            requirePersistence: true,
            source: 'ops_verify',
            requireSource: 'ops_verify',
            minSourceEvents: 5,
            rejectSource: 'ops_verify',
            minRejectSourceEvents: 0,
            maxRejectSourceEvents: 0,
            ignoreRejectSourceInRate: '',
            ignoreRejectSourcesInRate: ['ops_reject_probe', 'crowd_price_submit'],
            ignoreRejectSourcePrefixes: ['ops_verify_reject_'],
            allowedRejectReasons: ['invalid_signature', 'crowd_duplicate_within_window'],
            allowedRejectSources: ['ops_reject_probe', 'crowd_price_submit'],
            allowedRejectSourcePrefixes: ['ops_verify_reject_'],
            allowedRejectSourceReasons: 'ops_reject_probe:invalid_signature,ops_verify_reject_*:invalid_signature,crowd_price_submit:crowd_duplicate_within_window',
            rejectionProbeCount: 0,
            requireRejectionPersistence: false,
            rejectionProbeSource: 'ops_verify_reject_probe',
            rejectionProbeExpectedReason: '',
            probeRetries: 2,
            healthRetries: 2,
            retryDelayMs: 300
        },
        strict_rejection: {
            count: 5,
            windowMinutes: 60,
            minEvents: 5,
            maxDelayed: 25,
            minDistinctSessions: 1,
            maxP95DelayMs: 120000,
            maxFreshnessSeconds: 900,
            maxRejected: 1000000,
            maxRejectRatePct: 5,
            requirePersistence: true,
            source: 'ops_verify',
            requireSource: 'ops_verify',
            minSourceEvents: 5,
            rejectSource: 'ops_verify_reject_probe',
            minRejectSourceEvents: 1,
            maxRejectSourceEvents: 1000000,
            ignoreRejectSourceInRate: '',
            ignoreRejectSourcesInRate: ['crowd_price_submit'],
            ignoreRejectSourcePrefixes: ['ops_verify_reject_'],
            allowedRejectReasons: ['invalid_signature', 'crowd_duplicate_within_window'],
            allowedRejectSources: ['ops_reject_probe', 'crowd_price_submit'],
            allowedRejectSourcePrefixes: ['ops_verify_reject_'],
            allowedRejectSourceReasons: 'ops_reject_probe:invalid_signature,ops_verify_reject_*:invalid_signature,crowd_price_submit:crowd_duplicate_within_window',
            rejectionProbeCount: 1,
            requireRejectionPersistence: true,
            rejectionProbeSource: 'ops_verify_reject_probe',
            rejectionProbeExpectedReason: 'invalid_signature',
            probeRetries: 2,
            healthRetries: 2,
            retryDelayMs: 300
        }
    };
    const selected = profiles[profileName];
    if (!selected) {
        throw new Error('Unknown --profile value "' + profileName + '". Allowed: quick, strict, strict_rejection');
    }
    return selected;
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

const TRANSIENT_HTTP_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);

function isTransientHttpStatus(statusCode) {
    const normalized = Number(statusCode);
    if (!Number.isInteger(normalized)) return false;
    return TRANSIENT_HTTP_STATUS_CODES.has(normalized);
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
        expectRejects = false,
        maxRetries = 0,
        retryDelayMs = 250
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

    const totalAttempts = Math.max(0, Number(maxRetries) || 0) + 1;
    let attempt = 0;
    let lastError = null;

    while (attempt < totalAttempts) {
        attempt += 1;

        try {
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
            const transientStatus = isTransientHttpStatus(response.status);
            const shouldRetry = !ok && transientStatus && attempt < totalAttempts;

            if (shouldRetry) {
                await sleep(computeRetryDelayMs(retryDelayMs, attempt));
                continue;
            }

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
                rejectionPersistenceWarning: body?.rejectionPersistenceWarning ?? null,
                attempts: attempt,
                retriesUsed: Math.max(0, attempt - 1),
                retried: attempt > 1
            };
        } catch (error) {
            lastError = error;
            if (attempt < totalAttempts) {
                await sleep(computeRetryDelayMs(retryDelayMs, attempt));
                continue;
            }
            throw error;
        }
    }

    throw lastError || new Error('Probe failed after retries');
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
    const allowedRejectSourceReasonRules = Array.isArray(metrics.__allowedRejectSourceReasonRules)
        ? metrics.__allowedRejectSourceReasonRules
            .map((rule) => {
                const sourcePattern = String(rule && rule.sourcePattern ? rule.sourcePattern : '').trim();
                const reasons = Array.isArray(rule && rule.reasons)
                    ? rule.reasons
                        .map((value) => String(value || '').trim())
                        .filter(Boolean)
                    : [];
                if (!sourcePattern || reasons.length === 0) return null;
                return {
                    sourcePattern,
                    reasons: Array.from(new Set(reasons))
                };
            })
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
        allowedRejectSourceReasonRules,
        rejectSource,
        minRejectSourceEvents,
        maxRejectSourceEvents,
        maxRetries = 0,
        retryDelayMs = 250
    } = options;

    const client = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    });

    const totalAttempts = Math.max(0, Number(maxRetries) || 0) + 1;
    let attempt = 0;
    let lastError = null;

    while (attempt < totalAttempts) {
        attempt += 1;

        const { data, error } = await client.rpc('get_intel_ingest_health', {
            window_minutes: windowMinutes
        });

        if (error) {
            lastError = error;
            const transient = isLikelyTransientRpcError(error);
            if (transient && attempt < totalAttempts) {
                await sleep(computeRetryDelayMs(retryDelayMs, attempt));
                continue;
            }
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
            __allowedRejectSourceReasonRules: allowedRejectSourceReasonRules,
            __rejectSource: rejectSource,
            __minRejectSourceEventsThreshold: minRejectSourceEvents,
            __maxRejectSourceEventsThreshold: maxRejectSourceEvents
        }, minEvents, maxDelayed);
        const ok = checks.every((check) => check.ok);

        return {
            ok,
            windowMinutes,
            checks,
            metrics,
            retry: {
                attempts: attempt,
                retriesUsed: Math.max(0, attempt - 1),
                retried: attempt > 1
            }
        };
    }

    throw new Error(`RPC get_intel_ingest_health failed after retries: ${lastError ? lastError.message : 'unknown_error'}`);
}

async function main() {
    const profile = normalizeVerifyProfileName(parseStringFlag('--profile', ''));
    const profileDefaults = getVerifyProfileDefaults(profile);
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

    const count = parseIntegerFlag('--count', profileDefaults?.count ?? 5, 1, 200);
    const windowMinutes = parseIntegerFlag('--window-minutes', profileDefaults?.windowMinutes ?? 60, 1, 1440);
    const probeRetries = parseIntegerFlag('--probe-retries', profileDefaults?.probeRetries ?? 1, 0, 5);
    const healthRetries = parseIntegerFlag('--health-retries', profileDefaults?.healthRetries ?? 1, 0, 5);
    const retryDelayMs = parseIntegerFlag('--retry-delay-ms', profileDefaults?.retryDelayMs ?? 250, 50, 10000);
    const minEvents = parseIntegerFlag('--min-events', profileDefaults?.minEvents ?? count, 0, 1000000);
    const maxDelayed = parseIntegerFlag('--max-delayed', profileDefaults?.maxDelayed ?? 25, 0, 1000000);
    const minDistinctSessions = parseIntegerFlag('--min-distinct-sessions', profileDefaults?.minDistinctSessions ?? 1, 0, 1000000);
    const maxP95DelayMs = parseIntegerFlag('--max-p95-delay-ms', profileDefaults?.maxP95DelayMs ?? 120000, 0, 3600000);
    const maxFreshnessSeconds = parseIntegerFlag('--max-freshness-seconds', profileDefaults?.maxFreshnessSeconds ?? 900, 0, 86400);
    const maxRejected = parseIntegerFlag('--max-rejected', profileDefaults?.maxRejected ?? 1000000, 0, 1000000);
    const maxRejectRatePct = parseNumberFlag('--max-reject-rate-pct', profileDefaults?.maxRejectRatePct ?? 100, 0, 100);
    const allowedRejectReasons = parseCsvFlag('--allowed-reject-reasons');
    const allowedRejectSources = parseCsvFlag('--allowed-reject-sources');
    const allowedRejectSourcePrefixes = parseCsvFlag('--allowed-reject-source-prefixes');
    const allowedRejectSourceReasonRules = parseAllowedRejectSourceReasonRules('--allowed-reject-source-reasons');
    const requirePersistence = parseIntegerFlag(
        '--require-persistence',
        profileDefaults?.requirePersistence === false ? 0 : 1,
        0,
        1
    ) === 1;
    const rejectionProbeCount = parseIntegerFlag('--rejection-probe-count', profileDefaults?.rejectionProbeCount ?? 0, 0, 200);
    const rejectionProbeSource = parseStringFlag(
        '--rejection-probe-source',
        profileDefaults?.rejectionProbeSource || 'ops_verify_reject_probe'
    ).trim();
    const requireRejectionPersistence = parseIntegerFlag(
        '--require-rejection-persistence',
        profileDefaults?.requireRejectionPersistence ? 1 : 0,
        0,
        1
    ) === 1;
    const rejectionProbeExpectedReason = parseStringFlag(
        '--rejection-probe-expected-reason',
        profileDefaults?.rejectionProbeExpectedReason ?? (rejectionProbeCount > 0 ? 'invalid_signature' : '')
    ).trim();
    const lat = parseNumberFlag('--lat', 31.6259, -90, 90);
    const lng = parseNumberFlag('--lng', -7.9890, -180, 180);
    const source = parseStringFlag('--source', profileDefaults?.source || 'ops_verify');
    const requireSource = parseStringFlag('--require-source', profileDefaults?.requireSource || source).trim();
    const minSourceEvents = parseIntegerFlag('--min-source-events', profileDefaults?.minSourceEvents ?? count, 0, 1000000);
    const rejectSourceDefault = profileDefaults?.rejectSource || (rejectionProbeCount > 0 ? rejectionProbeSource : source);
    const rejectSource = parseStringFlag('--reject-source', rejectSourceDefault).trim();
    const minRejectSourceEventsDefault = profileDefaults?.minRejectSourceEvents ?? (
        rejectionProbeCount > 0 && rejectSource === rejectionProbeSource ? rejectionProbeCount : 0
    );
    const maxRejectSourceEventsDefault = profileDefaults?.maxRejectSourceEvents ?? (
        rejectionProbeCount > 0 && rejectSource === rejectionProbeSource ? rejectionProbeCount : 0
    );
    const minRejectSourceEvents = parseIntegerFlag('--min-reject-source-events', minRejectSourceEventsDefault, 0, 1000000);
    const maxRejectSourceEvents = parseIntegerFlag('--max-reject-source-events', maxRejectSourceEventsDefault, 0, 1000000);
    const ignoreRejectSourceInRate = parseStringFlag(
        '--ignore-reject-source-in-rate',
        profileDefaults?.ignoreRejectSourceInRate ?? (rejectionProbeCount > 0 ? rejectionProbeSource : '')
    ).trim();
    const ignoreRejectSourcesInRate = parseCsvFlag('--ignore-reject-sources-in-rate');
    const ignoreRejectSourcePrefixes = parseCsvFlag('--ignore-reject-source-prefixes');
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
    if (rejectionProbeCount > 0 && ignoreRejectSourcePrefixes.length === 0) {
        ignoreRejectSourcePrefixes.push('ops_verify_reject_');
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
        source,
        maxRetries: probeRetries,
        retryDelayMs
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
            expectRejects: true,
            maxRetries: probeRetries,
            retryDelayMs
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
        allowedRejectSourceReasonRules,
        rejectSource,
        minRejectSourceEvents,
        maxRejectSourceEvents,
        maxRetries: healthRetries,
        retryDelayMs
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
        },
        retryPolicy: {
            probeRetries,
            healthRetries,
            retryDelayMs
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
