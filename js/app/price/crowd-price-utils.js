/**
 * ALIDADE Crowd Price Utilities
 * Extracted from CrowdPriceDB in legacy app.js with compatibility hooks.
 */
(function bootstrapCrowdPriceUtils(windowObj) {
    if (!windowObj) return;

    const priceUtils = windowObj.ALIDADE_PRICE_UTILS || (windowObj.ALIDADE_PRICE_UTILS = {});
    const CROWD_SYNC_BADGE_STORAGE_KEY = 'alidade_crowd_sync_badge';
    const DEFAULT_SYNC_BADGE_LABEL = 'LOCAL MODE';

    function coerceBoolean(value, fallback) {
        if (typeof value === 'boolean') return value;
        const normalized = String(value || '').trim().toLowerCase();
        if (!normalized) return fallback;
        if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
        if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
        return fallback;
    }

    function normalizeRewardsFlagName(flagName) {
        return String(flagName || '').trim().toUpperCase();
    }

    if (typeof priceUtils.buildCrowdPriceSubmission !== 'function') {
        priceUtils.buildCrowdPriceSubmission = function buildCrowdPriceSubmission(data) {
            return {
                item_type: data.itemType,
                price_paid: Math.round(data.pricePaid),
                asking_price: data.askingPrice ? Math.round(data.askingPrice) : null,
                quality_estimate: data.qualityEstimate ? parseFloat(data.qualityEstimate.toFixed(2)) : null,
                area: data.area || 'unknown',
                lat_fuzzy: data.lat ? Math.round(data.lat * 100) / 100 : null,  // 2 decimal = ~1km precision
                lng_fuzzy: data.lng ? Math.round(data.lng * 100) / 100 : null,
                user_id: null,  // Anonymous by default (linked if authenticated)
                app_version: '2.0'
            };
        };
    }

    if (typeof priceUtils.resolveCrowdRank !== 'function') {
        priceUtils.resolveCrowdRank = function resolveCrowdRank(points) {
            return points >= 500 ? 'Master' : points >= 200 ? 'Cartographer'
                : points >= 100 ? 'Pathfinder' : points >= 30 ? 'Navigator' : 'Scout';
        };
    }

    if (typeof priceUtils.readCrowdUserStats !== 'function') {
        priceUtils.readCrowdUserStats = function readCrowdUserStats(storageObj, pendingQueue) {
            return {
                contributions: parseInt(storageObj.getItem('alidade_contributions') || '0', 10),
                points: parseInt(storageObj.getItem('alidade_crowd_points') || '0', 10),
                rank: storageObj.getItem('alidade_crowd_rank') || 'Scout',
                syncBadge: storageObj.getItem(CROWD_SYNC_BADGE_STORAGE_KEY) || DEFAULT_SYNC_BADGE_LABEL,
                pendingQueue
            };
        };
    }

    if (typeof priceUtils.resolveRewardsFlags !== 'function') {
        priceUtils.resolveRewardsFlags = function resolveRewardsFlags(storageObjParam) {
            const storageObj = storageObjParam || windowObj.localStorage;
            const runtimeFlags = windowObj.ALIDADE_RUNTIME_CONFIG?.rewardsFlags || {};
            const defaults = {
                ENABLE_REWARDS_UI: true,
                ENABLE_SERVER_VALIDATION: true,
                ENABLE_LEDGER_WRITE: true,
                ENABLE_ADVANCED_SCORING: false
            };

            return Object.keys(defaults).reduce((acc, key) => {
                const normalized = normalizeRewardsFlagName(key);
                const storageValue = storageObj && typeof storageObj.getItem === 'function'
                    ? storageObj.getItem(`ALIDADE_FLAG_${normalized}`)
                    : '';
                const runtimeValue = runtimeFlags[normalized];
                const fallback = defaults[normalized];
                const resolved = storageValue != null && String(storageValue).trim() !== ''
                    ? coerceBoolean(storageValue, fallback)
                    : coerceBoolean(runtimeValue, fallback);
                acc[normalized] = resolved;
                return acc;
            }, {});
        };
    }

    if (typeof priceUtils.getRewardsFlag !== 'function') {
        priceUtils.getRewardsFlag = function getRewardsFlag(flagName, fallback = false, storageObj) {
            const flags = typeof priceUtils.resolveRewardsFlags === 'function'
                ? priceUtils.resolveRewardsFlags(storageObj)
                : {};
            const normalized = normalizeRewardsFlagName(flagName);
            if (Object.prototype.hasOwnProperty.call(flags, normalized)) {
                return Boolean(flags[normalized]);
            }
            return coerceBoolean(windowObj.ALIDADE_RUNTIME_CONFIG?.rewardsFlags?.[normalized], fallback);
        };
    }

    if (typeof priceUtils.resolveCrowdSyncBadgeLabel !== 'function') {
        priceUtils.resolveCrowdSyncBadgeLabel = function resolveCrowdSyncBadgeLabel(rawStatus) {
            const normalized = String(rawStatus || '')
                .trim()
                .toLowerCase()
                .replace(/[\s-]+/g, '_');
            if (normalized === 'synced' || normalized === 'verified') return 'SYNCED';
            if (normalized === 'pending' || normalized === 'pending_review') return 'PENDING REVIEW';
            if (normalized === 'rejected') return 'REJECTED';
            return DEFAULT_SYNC_BADGE_LABEL;
        };
    }

    if (typeof priceUtils.resolveCrowdSyncStatusFromLabel !== 'function') {
        priceUtils.resolveCrowdSyncStatusFromLabel = function resolveCrowdSyncStatusFromLabel(labelRaw) {
            const label = String(labelRaw || '').trim().toUpperCase();
            if (label === 'SYNCED') return 'synced';
            if (label === 'PENDING REVIEW') return 'pending_review';
            if (label === 'REJECTED') return 'rejected';
            return 'local_mode';
        };
    }

    if (typeof priceUtils.storeCrowdSyncBadgeLabel !== 'function') {
        priceUtils.storeCrowdSyncBadgeLabel = function storeCrowdSyncBadgeLabel(storageObjParam, badgeLabel) {
            const storageObj = storageObjParam || windowObj.localStorage;
            if (!storageObj || typeof storageObj.setItem !== 'function') return;
            const next = typeof priceUtils.resolveCrowdSyncBadgeLabel === 'function'
                ? priceUtils.resolveCrowdSyncBadgeLabel(badgeLabel)
                : DEFAULT_SYNC_BADGE_LABEL;
            storageObj.setItem(CROWD_SYNC_BADGE_STORAGE_KEY, next);
        };
    }

    if (typeof priceUtils.readCrowdSyncBadgeLabel !== 'function') {
        priceUtils.readCrowdSyncBadgeLabel = function readCrowdSyncBadgeLabel(storageObjParam) {
            const storageObj = storageObjParam || windowObj.localStorage;
            if (!storageObj || typeof storageObj.getItem !== 'function') {
                return DEFAULT_SYNC_BADGE_LABEL;
            }
            const raw = storageObj.getItem(CROWD_SYNC_BADGE_STORAGE_KEY) || DEFAULT_SYNC_BADGE_LABEL;
            return typeof priceUtils.resolveCrowdSyncBadgeLabel === 'function'
                ? priceUtils.resolveCrowdSyncBadgeLabel(raw)
                : DEFAULT_SYNC_BADGE_LABEL;
        };
    }

    if (typeof priceUtils.resolveCrowdSessionId !== 'function') {
        priceUtils.resolveCrowdSessionId = function resolveCrowdSessionId() {
            const intelUtils = windowObj.ALIDADE_INTEL_EVENT_UTILS;
            if (intelUtils && typeof intelUtils.getSessionId === 'function') {
                return String(intelUtils.getSessionId() || '').trim();
            }
            return '';
        };
    }

    if (typeof priceUtils.resolveCrowdAuthUser !== 'function') {
        priceUtils.resolveCrowdAuthUser = function resolveCrowdAuthUser() {
            const manager = windowObj.licenseManager;
            if (manager && typeof manager.getAuthUser === 'function') {
                return manager.getAuthUser() || null;
            }
            return null;
        };
    }

    if (typeof priceUtils.resolveCrowdAuthBearerToken !== 'function') {
        priceUtils.resolveCrowdAuthBearerToken = async function resolveCrowdAuthBearerToken() {
            const explicit = String(windowObj.ALIDADE_RUNTIME_CONFIG?.intelAuthBearerToken || '').trim();
            if (explicit) return explicit;

            const manager = windowObj.licenseManager;
            if (!manager?.supabase?.auth?.getSession) return '';

            try {
                const { data, error } = await manager.supabase.auth.getSession();
                if (error) return '';
                return String(data?.session?.access_token || '').trim();
            } catch {
                return '';
            }
        };
    }

    if (typeof priceUtils.buildCrowdIntelSubmissionPayload !== 'function') {
        priceUtils.buildCrowdIntelSubmissionPayload = function buildCrowdIntelSubmissionPayload(submission) {
            return {
                item_type: String(submission?.item_type || '').trim() || 'generic_item',
                area: String(submission?.area || 'unknown').trim() || 'unknown',
                price_paid: Number(submission?.price_paid),
                currency: 'MAD',
                asking_price: submission?.asking_price == null ? null : Number(submission.asking_price),
                quality_estimate: submission?.quality_estimate == null ? null : Number(submission.quality_estimate),
                lat_fuzzy: submission?.lat_fuzzy == null ? null : Number(submission.lat_fuzzy),
                lng_fuzzy: submission?.lng_fuzzy == null ? null : Number(submission.lng_fuzzy),
                app_version: String(submission?.app_version || '2.0')
            };
        };
    }

    if (typeof priceUtils.emitCrowdSubmittedIntelEvent !== 'function') {
        priceUtils.emitCrowdSubmittedIntelEvent = async function emitCrowdSubmittedIntelEvent(submission, consoleObj) {
            const logger = consoleObj || console;
            const intelUtils = windowObj.ALIDADE_INTEL_EVENT_UTILS;
            if (!intelUtils || typeof intelUtils.emitIntelEvent !== 'function') {
                return { ok: false, skipped: true, reason: 'intel_runtime_unavailable' };
            }

            const payload = typeof priceUtils.buildCrowdIntelSubmissionPayload === 'function'
                ? priceUtils.buildCrowdIntelSubmissionPayload(submission)
                : null;
            if (!payload) {
                return { ok: false, skipped: true, reason: 'intel_payload_unavailable' };
            }

            const authUser = typeof priceUtils.resolveCrowdAuthUser === 'function'
                ? priceUtils.resolveCrowdAuthUser()
                : null;
            const meta = {
                sessionId: typeof priceUtils.resolveCrowdSessionId === 'function'
                    ? priceUtils.resolveCrowdSessionId()
                    : undefined,
                source: 'crowd_price_submit',
                app_version: String(submission?.app_version || '2.0')
            };
            if (authUser?.id) {
                meta.auth_user_id = String(authUser.id);
            }

            if (typeof priceUtils.resolveCrowdAuthBearerToken === 'function') {
                const bearer = await priceUtils.resolveCrowdAuthBearerToken();
                if (bearer && typeof intelUtils.setIngestAuthBearerToken === 'function') {
                    intelUtils.setIngestAuthBearerToken(bearer, { persist: false });
                }
            }

            const result = await intelUtils.emitIntelEvent('price.crowd_submitted', payload, meta);
            if (result && result.ok === true && typeof intelUtils.flushQueue === 'function') {
                intelUtils.flushQueue(false).catch(() => { });
            } else if (result && result.ok !== true) {
                logger.warn('[CROWD] Intel event rejected:', result.reason || 'unknown_reason');
            }
            return result;
        };
    }

    if (typeof priceUtils.resolveCrowdSupabaseBaseUrl !== 'function') {
        priceUtils.resolveCrowdSupabaseBaseUrl = function resolveCrowdSupabaseBaseUrl(client) {
            const configUrl = String(windowObj.ALIDADE_PRICE_CHECK_CONFIG?.SUPABASE_URL || '').trim();
            if (configUrl) return configUrl.replace(/\/+$/, '');

            const endpoint = String(client?.endpoint || '').trim();
            if (!endpoint) return '';
            try {
                const parsed = new URL(endpoint);
                return String(parsed.origin || '').replace(/\/+$/, '');
            } catch {
                return '';
            }
        };
    }

    if (typeof priceUtils.fetchCrowdServerSyncStatus !== 'function') {
        priceUtils.fetchCrowdServerSyncStatus = async function fetchCrowdServerSyncStatus(client, fetchFn, consoleObj) {
            const logger = consoleObj || console;
            const fetchImpl = fetchFn || fetch;
            const serverValidationEnabled = typeof priceUtils.getRewardsFlag === 'function'
                ? priceUtils.getRewardsFlag('ENABLE_SERVER_VALIDATION', true, windowObj.localStorage)
                : true;
            const ledgerWriteEnabled = typeof priceUtils.getRewardsFlag === 'function'
                ? priceUtils.getRewardsFlag('ENABLE_LEDGER_WRITE', true, windowObj.localStorage)
                : true;
            if (!serverValidationEnabled) {
                return {
                    ok: true,
                    status: 'local_mode',
                    label: 'LOCAL MODE'
                };
            }
            if (!ledgerWriteEnabled) {
                const fallbackLabel = typeof priceUtils.readCrowdSyncBadgeLabel === 'function'
                    ? priceUtils.readCrowdSyncBadgeLabel(windowObj.localStorage)
                    : DEFAULT_SYNC_BADGE_LABEL;
                const fallbackStatus = typeof priceUtils.resolveCrowdSyncStatusFromLabel === 'function'
                    ? priceUtils.resolveCrowdSyncStatusFromLabel(fallbackLabel)
                    : 'local_mode';
                return {
                    ok: true,
                    status: fallbackStatus,
                    label: fallbackLabel
                };
            }
            const baseUrl = typeof priceUtils.resolveCrowdSupabaseBaseUrl === 'function'
                ? priceUtils.resolveCrowdSupabaseBaseUrl(client)
                : '';
            if (!baseUrl) {
                return {
                    ok: false,
                    status: 'local_mode',
                    label: typeof priceUtils.readCrowdSyncBadgeLabel === 'function'
                        ? priceUtils.readCrowdSyncBadgeLabel(windowObj.localStorage)
                        : DEFAULT_SYNC_BADGE_LABEL
                };
            }

            const sessionId = typeof priceUtils.resolveCrowdSessionId === 'function'
                ? priceUtils.resolveCrowdSessionId()
                : '';
            const authUser = typeof priceUtils.resolveCrowdAuthUser === 'function'
                ? priceUtils.resolveCrowdAuthUser()
                : null;
            const userId = authUser?.id ? String(authUser.id) : null;

            const headers = {
                'Content-Type': 'application/json',
                apikey: String(client?.apiKey || ''),
                Authorization: `Bearer ${String(client?.apiKey || '')}`
            };

            if (typeof priceUtils.resolveCrowdAuthBearerToken === 'function') {
                const bearer = await priceUtils.resolveCrowdAuthBearerToken();
                if (bearer) {
                    headers.Authorization = `Bearer ${bearer}`;
                }
            }

            try {
                const response = await fetchImpl(`${baseUrl}/rest/v1/rpc/get_points_sync_status_v1`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        session_id: sessionId || null,
                        user_id: userId
                    })
                });

                if (!response.ok) {
                    logger.warn('[CROWD] Sync status RPC failed:', response.status);
                    return {
                        ok: false,
                        status: 'local_mode',
                        label: typeof priceUtils.readCrowdSyncBadgeLabel === 'function'
                            ? priceUtils.readCrowdSyncBadgeLabel(windowObj.localStorage)
                            : DEFAULT_SYNC_BADGE_LABEL
                    };
                }

                const raw = await response.json();
                const row = Array.isArray(raw) ? (raw[0] || {}) : (raw || {});
                const status = String(
                    row.sync_status ||
                    row.syncStatus ||
                    row.status ||
                    row.badge_label ||
                    row.badge ||
                    'local_mode'
                ).trim().toLowerCase();

                const label = typeof priceUtils.resolveCrowdSyncBadgeLabel === 'function'
                    ? priceUtils.resolveCrowdSyncBadgeLabel(status)
                    : DEFAULT_SYNC_BADGE_LABEL;
                if (typeof priceUtils.storeCrowdSyncBadgeLabel === 'function') {
                    priceUtils.storeCrowdSyncBadgeLabel(windowObj.localStorage, label);
                }

                return {
                    ok: true,
                    status,
                    label,
                    details: row
                };
            } catch (error) {
                logger.warn('[CROWD] Sync status fetch failed:', error?.message || String(error));
                return {
                    ok: false,
                    status: 'local_mode',
                    label: typeof priceUtils.readCrowdSyncBadgeLabel === 'function'
                        ? priceUtils.readCrowdSyncBadgeLabel(windowObj.localStorage)
                        : DEFAULT_SYNC_BADGE_LABEL
                };
            }
        };
    }

    if (typeof priceUtils.buildCrowdPostHeaders !== 'function') {
        priceUtils.buildCrowdPostHeaders = function buildCrowdPostHeaders(apiKey) {
            return {
                'Content-Type': 'application/json',
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Prefer': 'return=minimal'
            };
        };
    }

    if (typeof priceUtils.buildCrowdReadHeaders !== 'function') {
        priceUtils.buildCrowdReadHeaders = function buildCrowdReadHeaders(apiKey) {
            return {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`
            };
        };
    }

    if (typeof priceUtils.loadCrowdRetryQueue !== 'function') {
        priceUtils.loadCrowdRetryQueue = function loadCrowdRetryQueue(storageObj) {
            try {
                return JSON.parse(storageObj.getItem('alidade_price_queue') || '[]');
            } catch {
                return [];
            }
        };
    }

    if (typeof priceUtils.queueCrowdRetrySubmission !== 'function') {
        priceUtils.queueCrowdRetrySubmission = function queueCrowdRetrySubmission(queue, submission, nowMs) {
            return [...queue, { ...submission, _retryAt: nowMs }];
        };
    }

    if (typeof priceUtils.isCrowdRetryStale !== 'function') {
        priceUtils.isCrowdRetryStale = function isCrowdRetryStale(retryAt, nowMs, maxAgeMs = 86400000) {
            return (nowMs - retryAt) > maxAgeMs;
        };
    }

    if (typeof priceUtils.buildContributionSubmissionPayload !== 'function') {
        priceUtils.buildContributionSubmissionPayload = function buildContributionSubmissionPayload(
            classification,
            haggledPrice,
            area,
            position
        ) {
            return {
                itemType: classification?.topPrediction?.label || classification?.item?.type || 'generic_item',
                pricePaid: haggledPrice,
                askingPrice: classification?.askingPrice || null,
                qualityEstimate: classification?.deepAnalysis?.quality_multiplier || null,
                area,
                lat: position?.lat || null,
                lng: position?.lng || null
            };
        };
    }

    if (typeof priceUtils.buildCrowdQueryParams !== 'function') {
        priceUtils.buildCrowdQueryParams = function buildCrowdQueryParams(itemType, sinceIso, area, limit = 100) {
            const params = new URLSearchParams({
                select: 'price_paid,quality_estimate,area,created_at',
                item_type: `eq.${itemType}`,
                verified: 'eq.true',
                flagged: 'eq.false',
                created_at: `gte.${sinceIso}`,
                order: 'created_at.desc',
                limit: String(limit)
            });

            // If area is known, prefer that area but also get overall
            if (area && area !== 'unknown') {
                params.set('area', `eq.${area}`);
            }

            return params;
        };
    }

    if (typeof priceUtils.removeCrowdIqrOutliers !== 'function') {
        priceUtils.removeCrowdIqrOutliers = function removeCrowdIqrOutliers(prices) {
            const len = prices.length;
            const q1 = prices[Math.floor(len * 0.25)];
            const q3 = prices[Math.floor(len * 0.75)];
            const iqr = q3 - q1;
            const lowerBound = q1 - 1.5 * iqr;
            const upperBound = q3 + 1.5 * iqr;
            return prices.filter(price => price >= lowerBound && price <= upperBound);
        };
    }

    if (typeof priceUtils.computeCrowdAverageQuality !== 'function') {
        priceUtils.computeCrowdAverageQuality = function computeCrowdAverageQuality(data) {
            const qualities = data
                .filter(item => item.quality_estimate != null)
                .map(item => parseFloat(item.quality_estimate));
            return qualities.length > 0
                ? qualities.reduce((sum, q) => sum + q, 0) / qualities.length
                : null;
        };
    }

    if (typeof priceUtils.buildCrowdStatsPayload !== 'function') {
        priceUtils.buildCrowdStatsPayload = function buildCrowdStatsPayload(sortedClean, avgQuality, area) {
            const n = sortedClean.length;
            return {
                minimum: sortedClean[0],
                p25: sortedClean[Math.floor(n * 0.25)],
                median: sortedClean[Math.floor(n * 0.5)],
                p75: sortedClean[Math.floor(n * 0.75)],
                maximum: sortedClean[n - 1],
                mean: Math.round(sortedClean.reduce((s, p) => s + p, 0) / n),
                sampleSize: n,
                avgQuality,
                area,
                lastUpdated: new Date().toISOString(),
                sourceType: 'crowdsourced',
                confidence: Math.min(0.95, 0.5 + (n / 100) * 0.45) // Scales 0.5→0.95 based on sample size
            };
        };
    }

    if (typeof priceUtils.resolveCrowdComputeStatsFlow !== 'function') {
        priceUtils.resolveCrowdComputeStatsFlow = function resolveCrowdComputeStatsFlow(
            data,
            area,
            configObj,
            consoleObj
        ) {
            const logger = consoleObj || console;
            const prices = (Array.isArray(data) ? data : []).map(d => d.price_paid).sort((a, b) => a - b);
            const cleaned = typeof priceUtils.removeCrowdIqrOutliers === 'function'
                ? priceUtils.removeCrowdIqrOutliers(prices)
                : null;
            if (!cleaned || cleaned.length < configObj.CROWD_MIN_SAMPLES) {
                return null;
            }

            const sortedClean = cleaned.sort((a, b) => a - b);
            const avgQuality = typeof priceUtils.computeCrowdAverageQuality === 'function'
                ? priceUtils.computeCrowdAverageQuality(data)
                : null;
            const stats = typeof priceUtils.buildCrowdStatsPayload === 'function'
                ? priceUtils.buildCrowdStatsPayload(sortedClean, avgQuality, area)
                : null;
            if (!stats) return null;

            logger.log(`[CROWD] Stats for ${area}:`, stats.median, 'DH median from', stats.sampleSize, 'reports');
            return stats;
        };
    }

    if (typeof priceUtils.resolveCrowdSubmitPriceFlow !== 'function') {
        priceUtils.resolveCrowdSubmitPriceFlow = async function resolveCrowdSubmitPriceFlow(
            client,
            data,
            fetchFn,
            consoleObj
        ) {
            const logger = consoleObj || console;
            const fetchImpl = fetchFn || fetch;

            const submission = typeof priceUtils.buildCrowdPriceSubmission === 'function'
                ? priceUtils.buildCrowdPriceSubmission(data)
                : null;
            if (!submission) return false;

            const postHeaders = typeof priceUtils.buildCrowdPostHeaders === 'function'
                ? priceUtils.buildCrowdPostHeaders(client?.apiKey)
                : null;
            if (!postHeaders) return false;

            try {
                const response = await fetchImpl(client.endpoint, {
                    method: 'POST',
                    headers: postHeaders,
                    body: JSON.stringify(submission)
                });

                if (response.ok) {
                    logger.log('[CROWD] Price submitted:', submission.item_type, submission.price_paid, 'DH');
                    const rewardsEnabled = typeof priceUtils.getRewardsFlag === 'function'
                        ? priceUtils.getRewardsFlag('ENABLE_REWARDS_UI', true, windowObj.localStorage)
                        : true;
                    const serverValidationEnabled = typeof priceUtils.getRewardsFlag === 'function'
                        ? priceUtils.getRewardsFlag('ENABLE_SERVER_VALIDATION', true, windowObj.localStorage)
                        : true;

                    if (rewardsEnabled && client && typeof client._rewardUser === 'function') {
                        client._rewardUser();
                    }

                    if (serverValidationEnabled) {
                        if (typeof priceUtils.storeCrowdSyncBadgeLabel === 'function') {
                            priceUtils.storeCrowdSyncBadgeLabel(windowObj.localStorage, 'PENDING REVIEW');
                        }
                        if (typeof priceUtils.emitCrowdSubmittedIntelEvent === 'function') {
                            const intelResult = await priceUtils.emitCrowdSubmittedIntelEvent(submission, logger);
                            if (intelResult && intelResult.ok === false && intelResult.skipped !== true) {
                                logger.warn('[CROWD] Server validation lane rejected contribution');
                            }
                        }
                    } else if (typeof priceUtils.storeCrowdSyncBadgeLabel === 'function') {
                        priceUtils.storeCrowdSyncBadgeLabel(windowObj.localStorage, 'LOCAL MODE');
                    }
                    return true;
                }

                const errText = await response.text();
                logger.warn('[CROWD] Submit failed:', response.status, errText);
                if (client && typeof client._queueForRetry === 'function') {
                    client._queueForRetry(submission);
                }
                return false;
            } catch (error) {
                logger.warn('[CROWD] Network error, queuing for retry:', error.message);
                if (client && typeof client._queueForRetry === 'function') {
                    client._queueForRetry(submission);
                }
                return false;
            }
        };
    }

    if (typeof priceUtils.resolveCrowdGetDataAllAreasFlow !== 'function') {
        priceUtils.resolveCrowdGetDataAllAreasFlow = async function resolveCrowdGetDataAllAreasFlow(
            client,
            itemType,
            sinceIso,
            configObj,
            fetchFn
        ) {
            const fetchImpl = fetchFn || fetch;

            try {
                const params = typeof priceUtils.buildCrowdQueryParams === 'function'
                    ? priceUtils.buildCrowdQueryParams(itemType, sinceIso, null, 100)
                    : null;
                if (!params) return null;

                const readHeaders = typeof priceUtils.buildCrowdReadHeaders === 'function'
                    ? priceUtils.buildCrowdReadHeaders(client?.apiKey)
                    : null;
                if (!readHeaders) return null;

                const response = await fetchImpl(`${client.endpoint}?${params}`, { headers: readHeaders });
                if (!response.ok) return null;

                const data = await response.json();
                if (!data || data.length < configObj.CROWD_MIN_SAMPLES) return null;

                if (typeof priceUtils.resolveCrowdComputeStatsFlow === 'function') {
                    return priceUtils.resolveCrowdComputeStatsFlow(data, 'all_areas', configObj, console);
                }
                if (client && typeof client._computeStats === 'function') {
                    return client._computeStats(data, 'all_areas');
                }
                return null;
            } catch {
                return null;
            }
        };
    }

    if (typeof priceUtils.resolveCrowdGetDataFlow !== 'function') {
        priceUtils.resolveCrowdGetDataFlow = async function resolveCrowdGetDataFlow(
            client,
            itemType,
            area,
            configObj,
            fetchFn,
            consoleObj
        ) {
            const logger = consoleObj || console;
            const fetchImpl = fetchFn || fetch;

            try {
                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
                const params = typeof priceUtils.buildCrowdQueryParams === 'function'
                    ? priceUtils.buildCrowdQueryParams(itemType, thirtyDaysAgo, area, 100)
                    : null;
                if (!params) return null;

                const readHeaders = typeof priceUtils.buildCrowdReadHeaders === 'function'
                    ? priceUtils.buildCrowdReadHeaders(client?.apiKey)
                    : null;
                if (!readHeaders) return null;

                const response = await fetchImpl(`${client.endpoint}?${params}`, {
                    headers: readHeaders
                });

                if (!response.ok) {
                    logger.warn('[CROWD] API error:', response.status);
                    return null;
                }

                const data = await response.json();
                if (!data || data.length < configObj.CROWD_MIN_SAMPLES) {
                    logger.log(`[CROWD] Insufficient data for ${itemType}/${area}: ${data?.length || 0} samples`);

                    if (area && area !== 'unknown') {
                        if (typeof priceUtils.resolveCrowdGetDataAllAreasFlow === 'function') {
                            return await priceUtils.resolveCrowdGetDataAllAreasFlow(
                                client,
                                itemType,
                                thirtyDaysAgo,
                                configObj,
                                fetchImpl
                            );
                        }
                        if (client && typeof client._getCrowdDataAllAreas === 'function') {
                            return await client._getCrowdDataAllAreas(itemType, thirtyDaysAgo);
                        }
                    }
                    return null;
                }

                if (typeof priceUtils.resolveCrowdComputeStatsFlow === 'function') {
                    return priceUtils.resolveCrowdComputeStatsFlow(data, area, configObj, logger);
                }
                if (client && typeof client._computeStats === 'function') {
                    return client._computeStats(data, area);
                }
                return null;
            } catch (error) {
                logger.warn('[CROWD] Fetch error:', error.message);
                return null;
            }
        };
    }

    if (typeof priceUtils.resolveCrowdRewardUserFlow !== 'function') {
        priceUtils.resolveCrowdRewardUserFlow = function resolveCrowdRewardUserFlow(storageObj, consoleObj) {
            const logger = consoleObj || console;
            const rewardTotals = typeof priceUtils.computeCrowdRewardTotals === 'function'
                ? priceUtils.computeCrowdRewardTotals(
                    storageObj.getItem('alidade_contributions'),
                    storageObj.getItem('alidade_crowd_points'),
                    10
                )
                : null;
            if (!rewardTotals) return null;

            const count = rewardTotals.count;
            const points = rewardTotals.points;
            storageObj.setItem('alidade_contributions', count.toString());
            storageObj.setItem('alidade_crowd_points', points.toString());

            const rank = typeof priceUtils.resolveCrowdRank === 'function'
                ? priceUtils.resolveCrowdRank(points)
                : null;
            if (!rank) return null;

            storageObj.setItem('alidade_crowd_rank', rank);
            logger.log(`[CROWD] +10 pts -> Total: ${points} (${rank}) | Contributions: ${count}`);
            return { count, points, rank };
        };
    }

    if (typeof priceUtils.resolveCrowdProcessRetryQueueFlow !== 'function') {
        priceUtils.resolveCrowdProcessRetryQueueFlow = async function resolveCrowdProcessRetryQueueFlow(
            client,
            fetchFn,
            consoleObj,
            nowFn
        ) {
            if (!client || !Array.isArray(client._retryQueue) || client._retryQueue.length === 0) return;

            const logger = consoleObj || console;
            const fetchImpl = fetchFn || fetch;

            const postHeaders = typeof priceUtils.buildCrowdPostHeaders === 'function'
                ? priceUtils.buildCrowdPostHeaders(client.apiKey)
                : null;
            if (!postHeaders) return;

            logger.log(`[CROWD] Processing ${client._retryQueue.length} queued submissions...`);
            const remaining = [];

            for (const item of client._retryQueue) {
                try {
                    const response = await fetchImpl(client.endpoint, {
                        method: 'POST',
                        headers: postHeaders,
                        body: JSON.stringify(item)
                    });

                    if (!response.ok) {
                        const nowMs = typeof nowFn === 'function' ? nowFn() : Date.now();
                        const isStale = typeof priceUtils.isCrowdRetryStale === 'function'
                            ? priceUtils.isCrowdRetryStale(item._retryAt, nowMs, 86400000)
                            : false;
                        if (isStale) {
                            logger.log('[CROWD] Discarding stale submission');
                        } else {
                            remaining.push(item);
                        }
                    } else {
                        logger.log('[CROWD] Retry succeeded for:', item.item_type);
                    }
                } catch {
                    remaining.push(item);
                }
            }

            client._retryQueue = remaining;
            if (typeof client._saveRetryQueue === 'function') {
                client._saveRetryQueue();
            }
        };
    }

    if (typeof priceUtils.computeCrowdRewardTotals !== 'function') {
        priceUtils.computeCrowdRewardTotals = function computeCrowdRewardTotals(contributionsRaw, pointsRaw, rewardStep = 10) {
            return {
                count: parseInt(contributionsRaw || '0', 10) + 1,
                points: parseInt(pointsRaw || '0', 10) + rewardStep
            };
        };
    }
})(typeof window !== 'undefined' ? window : null);
