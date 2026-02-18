/**
 * ALIDADE Hybrid Price Runtime Utilities
 * Extracted from calculateHybridPrice in legacy app.js with compatibility hooks.
 */
(function bootstrapHybridPriceRuntimeUtils(windowObj) {
    if (!windowObj) return;

    const priceUtils = windowObj.ALIDADE_PRICE_UTILS || (windowObj.ALIDADE_PRICE_UTILS = {});

    if (typeof priceUtils.resolveHybridAreaContext !== 'function') {
        priceUtils.resolveHybridAreaContext = async function resolveHybridAreaContext(
            contextEngine,
            location,
            getCurrentPositionFn,
            detectSoukAreaFn
        ) {
            // Step 1: Detect location area (prefer shared context, then GPS fallback)
            let area = contextEngine?.getContext('price_checker')?.location || 'unknown';
            let gpsCoords = location || null;

            if (!gpsCoords && area === 'unknown') {
                try {
                    gpsCoords = await getCurrentPositionFn();
                } catch {
                    // silent
                }
            }

            if (gpsCoords) {
                area = detectSoukAreaFn(gpsCoords.lat, gpsCoords.lng);
                if (contextEngine?.updateLocation) {
                    await contextEngine.updateLocation(gpsCoords.lat, gpsCoords.lng, {
                        source: 'hybrid_price'
                    });
                }
            }

            return { area, gpsCoords };
        };
    }

    if (typeof priceUtils.fetchHybridCrowdData !== 'function') {
        priceUtils.fetchHybridCrowdData = async function fetchHybridCrowdData(
            crowdPriceDB,
            category,
            area,
            timeoutMs
        ) {
            try {
                return await Promise.race([
                    crowdPriceDB.getCrowdData(category, area),
                    new Promise(resolve => setTimeout(() => resolve(null), timeoutMs))
                ]);
            } catch (error) {
                console.warn('[HYBRID_PRICE] Crowd fetch error:', error.message);
                return null;
            }
        };
    }

    if (typeof priceUtils.selectHybridPriceSource !== 'function') {
        priceUtils.selectHybridPriceSource = function selectHybridPriceSource(crowdData, localData, minSamples) {
            const useCrowd = crowdData && crowdData.sampleSize >= minSamples;
            return {
                useCrowd,
                priceSource: useCrowd ? crowdData : localData,
                dataSource: useCrowd ? 'community' : 'database'
            };
        };
    }
})(typeof window !== 'undefined' ? window : null);
