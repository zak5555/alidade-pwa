/**
 * ALIDADE Crowd Price Utilities
 * Extracted from CrowdPriceDB in legacy app.js with compatibility hooks.
 */
(function bootstrapCrowdPriceUtils(windowObj) {
    if (!windowObj) return;

    const priceUtils = windowObj.ALIDADE_PRICE_UTILS || (windowObj.ALIDADE_PRICE_UTILS = {});

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
                pendingQueue
            };
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
                    if (client && typeof client._rewardUser === 'function') {
                        client._rewardUser();
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
