/**
 * ALIDADE Intel Event Runtime
 * Security gate for client-side intel event emission:
 * - canonical event whitelist
 * - schema checks
 * - rate limiting
 * - replay nonce guard
 * - signed queue envelopes + resilient flush
 */
(function registerAlidadeIntelEventRuntime(windowObj) {
    'use strict';

    if (!windowObj) return;
    if (windowObj.ALIDADE_INTEL_EVENT_UTILS?.__initialized) {
        if (typeof windowObj.ALIDADE_INTEL_EVENT_UTILS.refreshPolicy === 'function') {
            windowObj.ALIDADE_INTEL_EVENT_UTILS.refreshPolicy();
        }
        return;
    }

    const QUEUE_STORAGE_KEY = 'alidade_intel_event_queue_v1';
    const SESSION_STORAGE_KEY = 'alidade_intel_session_id_v1';
    const SIGNING_SECRET_KEY = 'alidade_intel_signing_secret_v1';
    const INGEST_API_KEY_STORAGE_KEY = 'alidade_intel_ingest_api_key_v1';
    const INGEST_AUTH_BEARER_STORAGE_KEY = 'alidade_intel_ingest_auth_bearer_v1';
    const INGEST_ENDPOINT_STORAGE_KEY = 'alidade_intel_ingest_endpoint_v1';
    const REJECTION_LOG_MAX = 80;
    const NONCE_TTL_MS = 10 * 60 * 1000;
    const GEOHASH7_REGEX = /^[0123456789bcdefghjkmnpqrstuvwxyz]{7}$/i;
    const THREAT_NODE_STATUSES = new Set(['unverified', 'provisional', 'verified']);
    const THREAT_SEVERITIES = new Set(['low', 'medium', 'high']);

    function resolveDefaultIngestEndpoint() {
        return '/functions/v1/intel-ingest';
    }

    function resolveIngestEndpointWithPriority(queueEndpoint = '') {
        const explicit = String(windowObj.__ALIDADE_INTEL_INGEST_ENDPOINT__ || '').trim();
        if (explicit) return explicit;

        const runtimeConfigEndpoint = String(windowObj.ALIDADE_RUNTIME_CONFIG?.intelIngestEndpoint || '').trim();
        if (runtimeConfigEndpoint) return runtimeConfigEndpoint;

        const persisted = String(storage.getItem(INGEST_ENDPOINT_STORAGE_KEY) || '').trim();
        if (persisted) return persisted;

        const fromPolicy = String(queueEndpoint || '').trim();
        if (fromPolicy) return fromPolicy;

        return resolveDefaultIngestEndpoint();
    }

    const DEFAULT_POLICY = Object.freeze({
        endpoint: resolveDefaultIngestEndpoint(),
        flushIntervalMs: 30000,
        batchSize: 50,
        priorityTiers: {
            sos_event: 1,
            hazard_alert: 2,
            price_anomaly: 3,
            context_update: 4,
            legacy_activity: 5
        },
        retryStrategy: {
            default: {
                maxRetryAttempts: 3,
                retryBackoffMs: 1000,
                backoffType: 'exponential'
            },
            sos_event: {
                maxRetryAttempts: 100,
                retryBackoffMs: 500,
                backoffType: 'linear',
                persistToLocalStorage: true,
                notifyUserOnFailure: true
            },
            hazard_alert: {
                maxRetryAttempts: 20,
                retryBackoffMs: 1000,
                backoffType: 'exponential'
            }
        },
        maxQueueEntries: 400
    });

    const EVENT_RATE_LIMITS_PER_MIN = Object.freeze({
        'context.update': 160,
        'sos.armed': 30,
        'sos.triggered': 20,
        'sos.deactivated': 20,
        'threat.report_submitted': 8,
        default: 100
    });

    const POWER_POLICY_FACTORS = Object.freeze({
        normal: { flushIntervalFactor: 1, batchSizeFactor: 1 },
        power_saver: { flushIntervalFactor: 2, batchSizeFactor: 0.85 },
        emergency: { flushIntervalFactor: 4, batchSizeFactor: 0.7 },
        critical: { flushIntervalFactor: 8, batchSizeFactor: 0.5 }
    });

    const CANONICAL_EVENTS = new Set([
        'price.quote_seen',
        'price.anomaly_detected',
        'price.crowd_submitted',
        'negotiation.round_recorded',
        'hazard.zone_state_changed',
        'sos.armed',
        'sos.triggered',
        'sos.deactivated',
        'context.update',
        'threat.report_submitted',
        'threat.report_deduped',
        'threat.report_rate_limited',
        'threat.node_status_changed',
        'nav.state_changed',
        'nav.guidance_issued',
        'nav.guidance_marked_false',
        'nav.recovery_started',
        'nav.recovery_action_presented',
        'nav.recovery_completed'
    ]);

    function isFiniteInRange(value, min, max) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return false;
        if (Number.isFinite(min) && parsed < min) return false;
        if (Number.isFinite(max) && parsed > max) return false;
        return true;
    }

    function isStringInRange(value, minLen = 1, maxLen = 200) {
        const text = String(value || '').trim();
        return text.length >= minLen && text.length <= maxLen;
    }

    function normalizeThreatSeverity(value) {
        const normalized = String(value || '').trim().toLowerCase();
        return THREAT_SEVERITIES.has(normalized) ? normalized : '';
    }

    function normalizeThreatNodeStatus(value) {
        const normalized = String(value || '').trim().toLowerCase();
        return THREAT_NODE_STATUSES.has(normalized) ? normalized : '';
    }

    const EVENT_SCHEMA_VALIDATORS = {
        'context.update': (payload) =>
            payload &&
            typeof payload.type === 'string' &&
            Number.isFinite(Number(payload.lat)) &&
            Number.isFinite(Number(payload.lng)),
        'sos.armed': (payload) =>
            payload &&
            typeof payload.method === 'string',
        'sos.triggered': (payload) =>
            payload &&
            Number.isFinite(Number(payload.tier)) &&
            Number(payload.tier) >= 1 &&
            Number(payload.tier) <= 3,
        'sos.deactivated': (payload) =>
            payload &&
            Number.isFinite(Number(payload.durationSec || 0)),
        'hazard.zone_state_changed': (payload) =>
            payload &&
            typeof payload.zoneId === 'string' &&
            ['clear', 'caution', 'danger'].includes(String(payload.state || '').toLowerCase()),
        'price.anomaly_detected': (payload) =>
            payload &&
            Number.isFinite(Number(payload.askPrice)) &&
            Number.isFinite(Number(payload.expectedPrice)),
        'price.crowd_submitted': (payload) => {
            if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
            const itemType = String(payload.item_type || '').trim();
            const area = String(payload.area || '').trim();
            const currency = String(payload.currency || '').trim().toUpperCase();
            const pricePaid = Number(payload.price_paid);
            const askingPrice = payload.asking_price == null ? null : Number(payload.asking_price);
            const qualityEstimate = payload.quality_estimate == null ? null : Number(payload.quality_estimate);
            if (!itemType || !area || !currency) return false;
            if (!Number.isFinite(pricePaid) || pricePaid < 5 || pricePaid > 50000) return false;
            if (askingPrice !== null && (!Number.isFinite(askingPrice) || askingPrice < pricePaid)) return false;
            if (qualityEstimate !== null && (!Number.isFinite(qualityEstimate) || qualityEstimate < 0 || qualityEstimate > 1)) {
                return false;
            }
            return true;
        },
        'threat.report_submitted': (payload) => {
            if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
            const category = String(payload.category || '').trim().toLowerCase();
            const geohash7 = String(payload.geohash7 || '').trim().toLowerCase();
            const severity = normalizeThreatSeverity(payload.severity);
            const occurredAt = String(payload.occurred_at || '').trim();
            const deviceHash = String(payload.device_hash || '').trim();
            if (!isStringInRange(category, 2, 64)) return false;
            if (!GEOHASH7_REGEX.test(geohash7)) return false;
            if (!severity) return false;
            if (!occurredAt || !Number.isFinite(Date.parse(occurredAt))) return false;
            if (!isStringInRange(deviceHash, 8, 128)) return false;
            if (payload.is_contradictory != null && typeof payload.is_contradictory !== 'boolean') return false;
            return true;
        },
        'threat.report_deduped': (payload) => {
            if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
            const category = String(payload.category || '').trim().toLowerCase();
            const geohash7 = String(payload.geohash7 || '').trim().toLowerCase();
            return isStringInRange(category, 2, 64) && GEOHASH7_REGEX.test(geohash7);
        },
        'threat.report_rate_limited': (payload) => {
            if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
            const category = String(payload.category || '').trim().toLowerCase();
            const geohash7 = String(payload.geohash7 || '').trim().toLowerCase();
            const reason = String(payload.reason || '').trim();
            return isStringInRange(category, 2, 64) &&
                GEOHASH7_REGEX.test(geohash7) &&
                isStringInRange(reason, 3, 120);
        },
        'threat.node_status_changed': (payload) => {
            if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
            const fromStatus = normalizeThreatNodeStatus(payload.from_status);
            const toStatus = normalizeThreatNodeStatus(payload.to_status);
            const reason = String(payload.reason || '').trim();
            const weightedScore = Number(payload.weighted_score);
            const agreementScore = Number(payload.agreement_score);
            return Boolean(fromStatus) &&
                Boolean(toStatus) &&
                isStringInRange(reason, 3, 120) &&
                Number.isFinite(weightedScore) &&
                weightedScore >= 0 &&
                Number.isFinite(agreementScore) &&
                agreementScore >= 0 &&
                agreementScore <= 1;
        },
        'nav.state_changed': (payload) => {
            if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
            const fromState = String(payload.from_state || '').trim().toUpperCase();
            const toState = String(payload.to_state || '').trim().toUpperCase();
            const reason = String(payload.reason || '').trim();
            const allowedStates = new Set(['UNKNOWN', 'CONFIDENT', 'ESTIMATED', 'LOST', 'PANIC']);
            if (!allowedStates.has(fromState) || !allowedStates.has(toState)) return false;
            if (!isStringInRange(reason, 2, 120)) return false;
            if (!isFiniteInRange(payload.freshness_ms, 0, Number.POSITIVE_INFINITY)) return false;
            if (!isFiniteInRange(payload.confidence, 0, 1)) return false;
            if (payload.accuracy_m != null && !isFiniteInRange(payload.accuracy_m, 0, Number.POSITIVE_INFINITY)) return false;
            return true;
        },
        'nav.guidance_issued': (payload) => {
            if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
            const targetType = String(payload.target_type || '').trim().toLowerCase();
            return isStringInRange(targetType, 2, 40);
        },
        'nav.guidance_marked_false': (payload) => {
            if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
            const reason = String(payload.reason || '').trim().toLowerCase();
            const stateAtIssue = String(payload.state_at_issue || '').trim().toUpperCase();
            const targetType = String(payload.target_type || '').trim().toLowerCase();
            return isStringInRange(reason, 3, 80) &&
                isStringInRange(stateAtIssue, 4, 20) &&
                isStringInRange(targetType, 2, 40) &&
                isFiniteInRange(payload.elapsed_ms_from_issue, 0, Number.POSITIVE_INFINITY);
        },
        'nav.recovery_started': (payload) => {
            if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
            const startState = String(payload.start_state || '').trim().toUpperCase();
            return startState === 'LOST' || startState === 'PANIC';
        },
        'nav.recovery_action_presented': (payload) => {
            if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
            const actionType = String(payload.action_type || '').trim().toLowerCase();
            const allowed = new Set(['backtrack', 'safe_point', 'show_to_local', 'sos']);
            return allowed.has(actionType);
        },
        'nav.recovery_completed': (payload) => {
            if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
            const resolutionType = String(payload.resolution_type || '').trim().toLowerCase();
            const method = String(payload.method || '').trim().toLowerCase();
            return isStringInRange(resolutionType, 2, 40) &&
                isStringInRange(method, 2, 40) &&
                isFiniteInRange(payload.elapsed_ms, 0, Number.POSITIVE_INFINITY);
        }
    };

    function safeParseJSON(value, fallback) {
        try {
            return value ? JSON.parse(value) : fallback;
        } catch (_error) {
            return fallback;
        }
    }

    function clone(value, fallback = {}) {
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (_error) {
            return fallback;
        }
    }

    function createInMemoryStorage() {
        const memory = new Map();
        return {
            getItem(key) {
                return memory.has(key) ? memory.get(key) : null;
            },
            setItem(key, value) {
                memory.set(String(key), String(value));
            },
            removeItem(key) {
                memory.delete(String(key));
            }
        };
    }

    const storage = (() => {
        try {
            if (windowObj.localStorage) return windowObj.localStorage;
        } catch (_error) {
            // fall through
        }
        return createInMemoryStorage();
    })();

    function getRandomHex(byteLength = 16) {
        const safeLength = Math.max(8, Math.min(64, Number(byteLength || 16)));
        if (windowObj.crypto && typeof windowObj.crypto.getRandomValues === 'function') {
            const bytes = new Uint8Array(safeLength);
            windowObj.crypto.getRandomValues(bytes);
            return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0')).join('');
        }
        let output = '';
        for (let i = 0; i < safeLength; i += 1) {
            output += Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
        }
        return output;
    }

    function generateNonce() {
        if (windowObj.crypto && typeof windowObj.crypto.randomUUID === 'function') {
            return windowObj.crypto.randomUUID();
        }
        return `${Date.now().toString(36)}_${getRandomHex(12)}`;
    }

    function fallbackHashHex(input) {
        const text = String(input || '');
        let h1 = 0x811c9dc5;
        let h2 = 0x9e3779b9;
        for (let i = 0; i < text.length; i += 1) {
            const code = text.charCodeAt(i);
            h1 ^= code;
            h1 = Math.imul(h1, 0x01000193);
            h2 ^= code + i;
            h2 = Math.imul(h2, 0x85ebca6b);
        }
        const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
        const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
        return `${part1}${part2}${part1}${part2}${part1}${part2}${part1}${part2}`;
    }

    async function computeSha256Hex(input) {
        const text = String(input || '');
        if (windowObj.crypto?.subtle && typeof windowObj.TextEncoder === 'function') {
            try {
                const bytes = new windowObj.TextEncoder().encode(text);
                const digest = await windowObj.crypto.subtle.digest('SHA-256', bytes);
                return Array.from(new Uint8Array(digest))
                    .map((byte) => byte.toString(16).padStart(2, '0'))
                    .join('');
            } catch (_error) {
                // fallback below
            }
        }
        return fallbackHashHex(text);
    }

    function getOrCreateSessionId() {
        const existing = String(storage.getItem(SESSION_STORAGE_KEY) || '').trim();
        if (existing) return existing;
        const next = `s_${Date.now().toString(36)}_${getRandomHex(8)}`;
        storage.setItem(SESSION_STORAGE_KEY, next);
        return next;
    }

    function getOrCreateSigningSecret() {
        const existing = String(storage.getItem(SIGNING_SECRET_KEY) || '').trim();
        if (existing) return existing;
        const runtimeConfigSecret = String(windowObj.ALIDADE_RUNTIME_CONFIG?.intelIngestSigningSecret || '').trim();
        if (runtimeConfigSecret) {
            storage.setItem(SIGNING_SECRET_KEY, runtimeConfigSecret);
            return runtimeConfigSecret;
        }
        const next = `${getRandomHex(20)}.${getRandomHex(20)}`;
        storage.setItem(SIGNING_SECRET_KEY, next);
        return next;
    }

    function setSigningSecret(nextSecret) {
        const normalized = String(nextSecret || '').trim();
        if (normalized) {
            storage.setItem(SIGNING_SECRET_KEY, normalized);
        } else {
            storage.removeItem(SIGNING_SECRET_KEY);
        }
        return {
            ok: true,
            configured: Boolean(normalized)
        };
    }

    function resolveIngestApiKey() {
        const explicit = String(windowObj.__ALIDADE_INTEL_INGEST_API_KEY__ || '').trim();
        if (explicit) return explicit;
        const runtimeConfigKey = String(windowObj.ALIDADE_RUNTIME_CONFIG?.intelIngestApiKey || '').trim();
        if (runtimeConfigKey) return runtimeConfigKey;
        const persisted = String(storage.getItem(INGEST_API_KEY_STORAGE_KEY) || '').trim();
        if (persisted) return persisted;
        return '';
    }

    function setIngestApiKey(nextKey, options = {}) {
        const normalized = String(nextKey || '').trim();
        const persist = options.persist !== false;
        if (persist) {
            if (normalized) {
                storage.setItem(INGEST_API_KEY_STORAGE_KEY, normalized);
            } else {
                storage.removeItem(INGEST_API_KEY_STORAGE_KEY);
            }
        }

        if (normalized) {
            windowObj.__ALIDADE_INTEL_INGEST_API_KEY__ = normalized;
        } else {
            try {
                delete windowObj.__ALIDADE_INTEL_INGEST_API_KEY__;
            } catch (_error) {
                windowObj.__ALIDADE_INTEL_INGEST_API_KEY__ = '';
            }
        }

        return {
            ok: true,
            configured: Boolean(resolveIngestApiKey())
        };
    }

    function resolveConfiguredIngestAuthBearerToken() {
        const explicit = String(windowObj.__ALIDADE_INTEL_INGEST_AUTH_BEARER_TOKEN__ || '').trim();
        if (explicit) return explicit;
        const runtimeConfigToken = String(windowObj.ALIDADE_RUNTIME_CONFIG?.intelAuthBearerToken || '').trim();
        if (runtimeConfigToken) return runtimeConfigToken;
        const persisted = String(storage.getItem(INGEST_AUTH_BEARER_STORAGE_KEY) || '').trim();
        if (persisted) return persisted;
        return '';
    }

    async function resolveIngestAuthBearerToken() {
        const configured = resolveConfiguredIngestAuthBearerToken();
        if (configured) return configured;

        const licenseManager = windowObj.licenseManager;
        if (!licenseManager?.supabase?.auth?.getSession) return '';
        try {
            const { data, error } = await licenseManager.supabase.auth.getSession();
            if (error) return '';
            return String(data?.session?.access_token || '').trim();
        } catch {
            return '';
        }
    }

    function setIngestAuthBearerToken(nextToken, options = {}) {
        const normalized = String(nextToken || '').trim();
        const persist = options.persist === true;
        if (persist) {
            if (normalized) {
                storage.setItem(INGEST_AUTH_BEARER_STORAGE_KEY, normalized);
            } else {
                storage.removeItem(INGEST_AUTH_BEARER_STORAGE_KEY);
            }
        }

        if (normalized) {
            windowObj.__ALIDADE_INTEL_INGEST_AUTH_BEARER_TOKEN__ = normalized;
        } else {
            try {
                delete windowObj.__ALIDADE_INTEL_INGEST_AUTH_BEARER_TOKEN__;
            } catch (_error) {
                windowObj.__ALIDADE_INTEL_INGEST_AUTH_BEARER_TOKEN__ = '';
            }
            if (!persist) {
                storage.removeItem(INGEST_AUTH_BEARER_STORAGE_KEY);
            }
        }

        return {
            ok: true,
            configured: Boolean(resolveConfiguredIngestAuthBearerToken())
        };
    }

    function toPositiveInteger(value, fallback) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
        return Math.round(parsed);
    }

    function toNonNegativeInteger(value, fallback) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed < 0) return fallback;
        return Math.round(parsed);
    }

    async function safeReadResponseJson(response) {
        if (!response || typeof response.json !== 'function') return null;
        try {
            const parsed = await response.json();
            return parsed && typeof parsed === 'object' ? parsed : null;
        } catch (_error) {
            return null;
        }
    }

    function resolveIngestResultMetrics(responsePayload, processedCount) {
        const body = responsePayload && typeof responsePayload === 'object' ? responsePayload : {};
        const safeProcessed = toNonNegativeInteger(processedCount, 0);
        const hasAccepted = Number.isFinite(Number(body.acceptedCount));
        const hasRejected = Number.isFinite(Number(body.rejectedCount));

        let acceptedCount = safeProcessed;
        let rejectedCount = 0;

        if (hasAccepted && hasRejected) {
            acceptedCount = Math.min(safeProcessed, toNonNegativeInteger(body.acceptedCount, safeProcessed));
            rejectedCount = Math.min(
                Math.max(0, safeProcessed - acceptedCount),
                toNonNegativeInteger(body.rejectedCount, 0)
            );
        } else if (hasAccepted) {
            acceptedCount = Math.min(safeProcessed, toNonNegativeInteger(body.acceptedCount, safeProcessed));
            rejectedCount = Math.max(0, safeProcessed - acceptedCount);
        } else if (hasRejected) {
            rejectedCount = Math.min(safeProcessed, toNonNegativeInteger(body.rejectedCount, 0));
            acceptedCount = Math.max(0, safeProcessed - rejectedCount);
        }

        const persistedCountRaw = Number(body.persistedCount);
        const persistedCount = Number.isFinite(persistedCountRaw) && persistedCountRaw >= 0
            ? Math.round(persistedCountRaw)
            : null;
        const persistenceWarning = String(body.persistenceWarning || '').trim() || null;

        return {
            acceptedCount,
            rejectedCount,
            persistedCount,
            persistenceWarning
        };
    }

    function normalizeRetryStrategy(raw, fallback) {
        const source = raw && typeof raw === 'object' ? raw : {};
        const base = fallback && typeof fallback === 'object' ? fallback : {};
        const backoffType = String(source.backoff_type || source.backoffType || base.backoffType || 'exponential').toLowerCase();
        return {
            maxRetryAttempts: toPositiveInteger(source.max_retry_attempts ?? source.maxRetryAttempts, base.maxRetryAttempts || 3),
            retryBackoffMs: toPositiveInteger(source.retry_backoff_ms ?? source.retryBackoffMs, base.retryBackoffMs || 1000),
            backoffType: backoffType === 'linear' ? 'linear' : 'exponential',
            persistToLocalStorage: Boolean(source.persist_to_local_storage ?? source.persistToLocalStorage ?? base.persistToLocalStorage),
            notifyUserOnFailure: Boolean(source.notify_user_on_failure ?? source.notifyUserOnFailure ?? base.notifyUserOnFailure)
        };
    }

    function resolvePolicyFromGoldenRecord() {
        const record = windowObj.ALIDADE_GOLDEN_RECORD;
        const queue = record?.policy_config?.ingestion_queue;
        if (!queue || typeof queue !== 'object') return clone(DEFAULT_POLICY, DEFAULT_POLICY);

        const retryDefault = normalizeRetryStrategy(
            queue?.retry_strategy?.default,
            DEFAULT_POLICY.retryStrategy.default
        );

        return {
            endpoint: resolveIngestEndpointWithPriority(queue.endpoint || ''),
            flushIntervalMs: toPositiveInteger(queue.flush_interval_ms, DEFAULT_POLICY.flushIntervalMs),
            batchSize: toPositiveInteger(queue.batch_size, DEFAULT_POLICY.batchSize),
            priorityTiers: {
                ...DEFAULT_POLICY.priorityTiers,
                ...(queue.priority_tiers || {})
            },
            retryStrategy: {
                default: retryDefault,
                sos_event: normalizeRetryStrategy(queue?.retry_strategy?.sos_event, {
                    ...retryDefault,
                    ...DEFAULT_POLICY.retryStrategy.sos_event
                }),
                hazard_alert: normalizeRetryStrategy(queue?.retry_strategy?.hazard_alert, {
                    ...retryDefault,
                    ...DEFAULT_POLICY.retryStrategy.hazard_alert
                })
            },
            maxQueueEntries: DEFAULT_POLICY.maxQueueEntries
        };
    }

    function setIngestEndpoint(nextEndpoint, options = {}) {
        const normalized = String(nextEndpoint || '').trim();
        const persist = options.persist !== false;
        if (persist) {
            if (normalized) {
                storage.setItem(INGEST_ENDPOINT_STORAGE_KEY, normalized);
            } else {
                storage.removeItem(INGEST_ENDPOINT_STORAGE_KEY);
            }
        }

        if (normalized) {
            windowObj.__ALIDADE_INTEL_INGEST_ENDPOINT__ = normalized;
        } else {
            try {
                delete windowObj.__ALIDADE_INTEL_INGEST_ENDPOINT__;
            } catch (_error) {
                windowObj.__ALIDADE_INTEL_INGEST_ENDPOINT__ = '';
            }
        }
        refreshPolicy();
        return {
            ok: true,
            endpoint: runtimePolicy.endpoint
        };
    }

    function resolvePowerMode() {
        const runtimeMode = windowObj.ALIDADE_POWER_RUNTIME_UTILS?.getMode?.();
        const stateMode = windowObj.__ALIDADE_RUNTIME_SECURITY_STATE__?.power?.mode;
        const candidate = String(runtimeMode || stateMode || 'normal').toLowerCase();
        if (candidate === 'power_saver') return 'power_saver';
        if (candidate === 'emergency') return 'emergency';
        if (candidate === 'critical') return 'critical';
        return 'normal';
    }

    function applyPowerModePolicy(basePolicy, powerMode) {
        const factors = POWER_POLICY_FACTORS[powerMode] || POWER_POLICY_FACTORS.normal;
        return {
            ...basePolicy,
            flushIntervalMs: Math.max(1000, Math.round(basePolicy.flushIntervalMs * factors.flushIntervalFactor)),
            batchSize: Math.max(1, Math.round(basePolicy.batchSize * factors.batchSizeFactor)),
            powerMode
        };
    }

    function resolvePriorityClass(eventName) {
        const normalized = String(eventName || '').toLowerCase();
        if (normalized.startsWith('sos.')) return 'sos_event';
        if (normalized.startsWith('hazard.')) return 'hazard_alert';
        if (normalized.startsWith('threat.')) return 'hazard_alert';
        if (normalized.startsWith('nav.')) return 'hazard_alert';
        if (normalized.startsWith('price.anomaly')) return 'price_anomaly';
        if (normalized.startsWith('context.')) return 'context_update';
        return 'legacy_activity';
    }

    function shouldDropForPowerMode(eventName, powerMode) {
        if (powerMode !== 'critical') return false;
        const priorityClass = resolvePriorityClass(eventName);
        return priorityClass === 'context_update' || priorityClass === 'legacy_activity';
    }

    let runtimeBasePolicy = resolvePolicyFromGoldenRecord();
    let runtimePowerMode = resolvePowerMode();
    let runtimePolicy = applyPowerModePolicy(runtimeBasePolicy, runtimePowerMode);
    const rejectionLog = [];
    const nonceCache = new Map();
    const rateWindow = new Map();

    function cleanupNonceCache(nowMs = Date.now()) {
        nonceCache.forEach((expiresAt, nonce) => {
            if (expiresAt <= nowMs) nonceCache.delete(nonce);
        });
    }

    function consumeNonce(nonce) {
        const normalized = String(nonce || '').trim();
        if (!normalized) return false;
        const now = Date.now();
        cleanupNonceCache(now);
        if (nonceCache.has(normalized)) return false;
        nonceCache.set(normalized, now + NONCE_TTL_MS);
        return true;
    }

    function recordRejection(reason, eventName, payload, meta) {
        const entry = {
            at: new Date().toISOString(),
            reason: String(reason || 'unknown'),
            eventName: String(eventName || 'unknown'),
            payloadPreview: clone(payload, null),
            metaPreview: clone(meta, null)
        };
        rejectionLog.push(entry);
        if (rejectionLog.length > REJECTION_LOG_MAX) {
            rejectionLog.splice(0, rejectionLog.length - REJECTION_LOG_MAX);
        }
        try {
            windowObj.dispatchEvent(new CustomEvent('alidade:intelEventRejected', { detail: entry }));
        } catch (_error) {
            // ignore dispatch errors
        }
        return { ok: false, reason: entry.reason };
    }

    function checkRateLimit(eventName, sessionId) {
        const name = String(eventName || 'unknown');
        const sid = String(sessionId || 'anonymous');
        const key = `${sid}::${name}`;
        const now = Date.now();
        const windowStart = now - 60000;
        const limit = EVENT_RATE_LIMITS_PER_MIN[name] || EVENT_RATE_LIMITS_PER_MIN.default;
        const existing = rateWindow.get(key) || [];
        const fresh = existing.filter((stamp) => stamp >= windowStart);
        if (fresh.length >= limit) {
            rateWindow.set(key, fresh);
            return false;
        }
        fresh.push(now);
        rateWindow.set(key, fresh);
        return true;
    }

    function validateEventSchema(eventName, payload) {
        const validator = EVENT_SCHEMA_VALIDATORS[eventName];
        if (typeof validator !== 'function') {
            return payload && typeof payload === 'object' && !Array.isArray(payload);
        }
        try {
            return Boolean(validator(payload));
        } catch (_error) {
            return false;
        }
    }

    class IntelEventQueueManager {
        constructor(fetcher) {
            this.fetcher = typeof fetcher === 'function' ? fetcher : null;
            this.queue = safeParseJSON(storage.getItem(QUEUE_STORAGE_KEY), []) || [];
            this.flushing = false;
            this.lastFlushAt = null;
            this.lastFlushError = null;
        }

        saveQueue() {
            try {
                storage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
            } catch (_error) {
                // keep memory queue even if persistence fails
            }
        }

        resolvePriorityClass(eventName) {
            return resolvePriorityClass(eventName);
        }

        resolvePriorityValue(priorityClass) {
            return toPositiveInteger(runtimePolicy.priorityTiers?.[priorityClass], runtimePolicy.priorityTiers.legacy_activity || 5);
        }

        resolveRetryStrategy(priorityClass) {
            if (priorityClass === 'sos_event') return runtimePolicy.retryStrategy.sos_event;
            if (priorityClass === 'hazard_alert') return runtimePolicy.retryStrategy.hazard_alert;
            return runtimePolicy.retryStrategy.default;
        }

        enqueue(envelope) {
            const priorityClass = this.resolvePriorityClass(envelope.event_name);
            const item = {
                id: `${Date.now().toString(36)}_${getRandomHex(6)}`,
                createdAt: new Date().toISOString(),
                priorityClass,
                priority: this.resolvePriorityValue(priorityClass),
                envelope,
                attempts: 0,
                nextAttemptAt: Date.now(),
                lastError: null
            };
            this.queue.push(item);
            this.queue.sort((a, b) => (a.priority - b.priority) || (Date.parse(a.createdAt) - Date.parse(b.createdAt)));
            if (this.queue.length > runtimePolicy.maxQueueEntries) {
                this.queue.splice(runtimePolicy.maxQueueEntries);
            }
            this.saveQueue();
            return item;
        }

        getStats() {
            return {
                pending: this.queue.length,
                flushing: this.flushing,
                lastFlushAt: this.lastFlushAt,
                lastFlushError: this.lastFlushError
            };
        }

        async flush(options = {}) {
            if (this.flushing) {
                return { ok: false, skipped: true, reason: 'already_flushing', pending: this.queue.length };
            }
            const force = options.force === true;
            if (!force && typeof navigator !== 'undefined' && navigator.onLine === false) {
                return { ok: false, skipped: true, reason: 'offline', pending: this.queue.length };
            }
            if (!this.fetcher) {
                return { ok: false, skipped: true, reason: 'fetch_unavailable', pending: this.queue.length };
            }
            if (this.queue.length === 0) {
                return {
                    ok: true,
                    processed: 0,
                    succeeded: 0,
                    failed: 0,
                    dropped: 0,
                    pending: 0,
                    acceptedCount: 0,
                    rejectedCount: 0,
                    persistedCount: 0,
                    persistenceWarning: null
                };
            }

            const ingestApiKey = resolveIngestApiKey();
            if (!ingestApiKey) {
                this.lastFlushError = 'missing_ingest_api_key';
                return {
                    ok: false,
                    skipped: true,
                    reason: 'missing_ingest_api_key',
                    pending: this.queue.length
                };
            }

            this.flushing = true;
            const now = Date.now();
            const dueItems = this.queue
                .filter((item) => force || Number(item.nextAttemptAt || 0) <= now)
                .slice(0, runtimePolicy.batchSize);

            if (dueItems.length === 0) {
                this.flushing = false;
                return {
                    ok: true,
                    processed: 0,
                    succeeded: 0,
                    failed: 0,
                    dropped: 0,
                    pending: this.queue.length,
                    acceptedCount: 0,
                    rejectedCount: 0,
                    persistedCount: 0,
                    persistenceWarning: null
                };
            }

            const dueIds = new Set(dueItems.map((item) => item.id));
            let failed = 0;
            let dropped = 0;

            try {
                const headers = { 'Content-Type': 'application/json' };
                headers['x-intel-ingest-key'] = ingestApiKey;
                const ingestAuthBearer = await resolveIngestAuthBearerToken();
                if (ingestAuthBearer) {
                    headers.Authorization = `Bearer ${ingestAuthBearer}`;
                }
                const response = await this.fetcher(runtimePolicy.endpoint, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        events: dueItems.map((item) => item.envelope)
                    })
                });

                const responsePayload = await safeReadResponseJson(response);
                if (response && response.ok) {
                    const metrics = resolveIngestResultMetrics(responsePayload, dueItems.length);
                    const responseStatus = Number(response.status);
                    this.queue = this.queue.filter((item) => !dueIds.has(item.id));
                    this.lastFlushError = metrics.rejectedCount > 0
                        ? `ingest_rejected:${metrics.rejectedCount}`
                        : (metrics.persistenceWarning ? `ingest_warning:${metrics.persistenceWarning}` : null);
                    this.lastFlushAt = new Date().toISOString();
                    this.saveQueue();
                    return {
                        ok: metrics.rejectedCount === 0,
                        processed: dueItems.length,
                        succeeded: metrics.acceptedCount,
                        failed: metrics.rejectedCount,
                        dropped: 0,
                        pending: this.queue.length,
                        acceptedCount: metrics.acceptedCount,
                        rejectedCount: metrics.rejectedCount,
                        persistedCount: metrics.persistedCount,
                        persistenceWarning: metrics.persistenceWarning,
                        status: Number.isFinite(responseStatus) ? responseStatus : null
                    };
                }
                const responseStatus = Number(response?.status);
                const responseError = String(
                    responsePayload?.error ||
                    responsePayload?.detail ||
                    responsePayload?.message ||
                    ''
                ).trim();
                throw new Error(
                    Number.isFinite(responseStatus)
                        ? `HTTP ${responseStatus}${responseError ? ` (${responseError})` : ''}`
                        : 'HTTP unknown'
                );
            } catch (error) {
                this.queue.forEach((item) => {
                    if (!dueIds.has(item.id)) return;
                    const strategy = this.resolveRetryStrategy(item.priorityClass);
                    item.attempts = Number(item.attempts || 0) + 1;
                    item.lastError = String(error?.message || error || 'unknown');

                    if (item.attempts >= strategy.maxRetryAttempts && !strategy.persistToLocalStorage) {
                        item.__drop = true;
                        dropped += 1;
                        return;
                    }

                    const baseMs = toPositiveInteger(strategy.retryBackoffMs, 1000);
                    const delay = strategy.backoffType === 'linear'
                        ? baseMs * item.attempts
                        : baseMs * (2 ** Math.min(6, item.attempts));
                    item.nextAttemptAt = Date.now() + Math.min(delay, 10 * 60 * 1000);
                    failed += 1;
                });

                this.queue = this.queue.filter((item) => item.__drop !== true);
                this.lastFlushError = `${failed} failed, ${dropped} dropped`;
                this.lastFlushAt = new Date().toISOString();
                this.saveQueue();
                return {
                    ok: false,
                    processed: dueItems.length,
                    succeeded: 0,
                    failed,
                    dropped,
                    pending: this.queue.length,
                    acceptedCount: 0,
                    rejectedCount: 0,
                    persistedCount: null,
                    persistenceWarning: null
                };
            } finally {
                this.flushing = false;
            }
        }
    }

    const queueManager = new IntelEventQueueManager(windowObj.fetch?.bind(windowObj));
    let flushWorker = null;

    function restartFlushWorker() {
        if (flushWorker) {
            clearInterval(flushWorker);
            flushWorker = null;
        }
        flushWorker = setInterval(() => {
            queueManager.flush({ force: false }).then((result) => {
                if (!result || result.skipped) return;
                try {
                    windowObj.dispatchEvent(new CustomEvent('alidade:intelEventFlushed', { detail: result }));
                } catch (_error) {
                    // ignore dispatch errors
                }
            }).catch(() => { });
        }, runtimePolicy.flushIntervalMs);
    }

    function refreshPolicy() {
        runtimeBasePolicy = resolvePolicyFromGoldenRecord();
        runtimePowerMode = resolvePowerMode();
        runtimePolicy = applyPowerModePolicy(runtimeBasePolicy, runtimePowerMode);
        restartFlushWorker();
        return clone(runtimePolicy, {});
    }

    function refreshPowerMode() {
        runtimePowerMode = resolvePowerMode();
        runtimePolicy = applyPowerModePolicy(runtimeBasePolicy, runtimePowerMode);
        restartFlushWorker();
        return clone(runtimePolicy, {});
    }

    async function signEnvelope(envelope) {
        const signingSecret = getOrCreateSigningSecret();
        const canonical = JSON.stringify({
            id: envelope.id,
            event_name: envelope.event_name,
            occurred_at: envelope.occurred_at,
            payload: envelope.payload,
            meta: envelope.meta,
            nonce: envelope.nonce
        });
        return computeSha256Hex(`${signingSecret}.${canonical}`);
    }

    async function emitIntelEvent(eventName, payload = {}, meta = {}) {
        const normalizedName = String(eventName || '').trim();
        if (!CANONICAL_EVENTS.has(normalizedName)) {
            return recordRejection('unknown_event', normalizedName, payload, meta);
        }
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
            return recordRejection('payload_not_object', normalizedName, payload, meta);
        }
        if (!validateEventSchema(normalizedName, payload)) {
            return recordRejection('schema_validation_failed', normalizedName, payload, meta);
        }
        if (shouldDropForPowerMode(normalizedName, runtimePowerMode)) {
            return recordRejection('power_mode_drop_noncritical', normalizedName, payload, meta);
        }

        const safeMeta = meta && typeof meta === 'object' ? { ...meta } : {};
        safeMeta.sessionId = String(safeMeta.sessionId || getOrCreateSessionId());
        safeMeta.source = String(safeMeta.source || 'unknown');

        if (!checkRateLimit(normalizedName, safeMeta.sessionId)) {
            return recordRejection('rate_limit_exceeded', normalizedName, payload, safeMeta);
        }

        const nonce = String(safeMeta.nonce || generateNonce());
        if (!consumeNonce(nonce)) {
            return recordRejection('replay_nonce_detected', normalizedName, payload, safeMeta);
        }

        const envelope = {
            id: `${Date.now().toString(36)}_${getRandomHex(6)}`,
            event_name: normalizedName,
            occurred_at: new Date().toISOString(),
            payload: clone(payload, {}),
            meta: clone(safeMeta, {}),
            nonce,
            signature: null,
            signature_alg: 'sha256'
        };
        envelope.signature = await signEnvelope(envelope);

        const queuedItem = queueManager.enqueue(envelope);
        try {
            windowObj.dispatchEvent(new CustomEvent('alidade:intelEventQueued', {
                detail: {
                    id: queuedItem.id,
                    eventName: normalizedName,
                    priorityClass: queuedItem.priorityClass,
                    pending: queueManager.getStats().pending
                }
            }));
        } catch (_error) {
            // ignore dispatch errors
        }

        const shouldForceFlush = queuedItem.priorityClass === 'sos_event';
        const shouldBatchFlush = queueManager.getStats().pending >= runtimePolicy.batchSize;
        if (shouldForceFlush || shouldBatchFlush) {
            queueManager.flush({ force: shouldForceFlush }).then((result) => {
                try {
                    windowObj.dispatchEvent(new CustomEvent('alidade:intelEventFlushed', { detail: result }));
                } catch (_error) {
                    // ignore dispatch errors
                }
            }).catch(() => { });
        }

        return { ok: true, queued: true, id: queuedItem.id, nonce, eventName: normalizedName };
    }

    function getQueueStats() {
        return queueManager.getStats();
    }

    function getRecentRejections() {
        return rejectionLog.slice();
    }

    async function flushQueue(force = false) {
        const result = await queueManager.flush({ force: force === true });
        try {
            windowObj.dispatchEvent(new CustomEvent('alidade:intelEventFlushed', { detail: result }));
        } catch (_error) {
            // ignore dispatch errors
        }
        return result;
    }

    if (!windowObj.__ALIDADE_INTEL_EVENT_RUNTIME_BOUND__) {
        windowObj.__ALIDADE_INTEL_EVENT_RUNTIME_BOUND__ = true;
        windowObj.addEventListener('online', () => {
            flushQueue(true).catch(() => { });
        });
        windowObj.addEventListener('alidade:goldenRecordReady', () => {
            refreshPolicy();
            flushQueue(false).catch(() => { });
        });
        windowObj.addEventListener('alidade:securityStateChanged', () => {
            refreshPolicy();
        });
        windowObj.addEventListener('alidade:powerModeChanged', () => {
            refreshPowerMode();
        });
    }

    restartFlushWorker();

    windowObj.ALIDADE_INTEL_EVENT_UTILS = {
        __initialized: true,
        emitIntelEvent,
        flushQueue,
        getQueueStats,
        getRecentRejections,
        getCanonicalEvents: () => Array.from(CANONICAL_EVENTS),
        isCanonicalEvent: (eventName) => CANONICAL_EVENTS.has(String(eventName || '').trim()),
        refreshPolicy,
        getPolicyConfig: () => clone(runtimePolicy, {}),
        getPowerMode: () => runtimePowerMode,
        getSessionId: getOrCreateSessionId,
        setIngestApiKey,
        setIngestAuthBearerToken,
        setSigningSecret,
        getIngestApiKeyConfigured: () => Boolean(resolveIngestApiKey()),
        setIngestEndpoint,
        getIngestEndpoint: () => String(runtimePolicy.endpoint || '')
    };

    try {
        windowObj.dispatchEvent(new CustomEvent('alidade:intelGuardReady', {
            detail: {
                pending: queueManager.getStats().pending,
                flushIntervalMs: runtimePolicy.flushIntervalMs,
                batchSize: runtimePolicy.batchSize,
                powerMode: runtimePowerMode
            }
        }));
    } catch (_error) {
        // ignore dispatch errors
    }
})(typeof window !== 'undefined' ? window : null);
