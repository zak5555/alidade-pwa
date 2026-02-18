/**
 * ALIDADE Hybrid Price Utilities
 * Extracted from calculateHybridPrice in legacy app.js with compatibility hooks.
 */
(function bootstrapHybridPriceUtils(windowObj) {
    if (!windowObj) return;

    const priceUtils = windowObj.ALIDADE_PRICE_UTILS || (windowObj.ALIDADE_PRICE_UTILS = {});

    if (typeof priceUtils.determineQualityBracket !== 'function') {
        priceUtils.determineQualityBracket = function determineQualityBracket(qualityMultiplier) {
            if (qualityMultiplier < 0.7) return 'low';
            if (qualityMultiplier < 1.3) return 'medium';
            if (qualityMultiplier < 2.2) return 'high';
            return 'premium';
        };
    }

    if (typeof priceUtils.resolveHybridLocationMultiplier !== 'function') {
        priceUtils.resolveHybridLocationMultiplier = function resolveHybridLocationMultiplier(contextMultiplier, area, locationFactors) {
            if (typeof contextMultiplier === 'number' && area !== 'unknown') return contextMultiplier;
            return locationFactors?.[area] || 1.0;
        };
    }

    if (typeof priceUtils.buildHybridAdjustedPrices !== 'function') {
        priceUtils.buildHybridAdjustedPrices = function buildHybridAdjustedPrices(priceSource, qualityMultiplier, qualityAdjusted) {
            return {
                minimum: Math.round(priceSource.minimum * qualityMultiplier),
                p25: Math.round(priceSource.p25 * qualityMultiplier),
                median: qualityAdjusted,
                p75: Math.round(priceSource.p75 * qualityMultiplier),
                maximum: Math.round(priceSource.maximum * qualityMultiplier),
                mean: Math.round((priceSource.mean || priceSource.median) * qualityMultiplier),
                sampleSize: priceSource.sampleSize
            };
        };
    }

    if (typeof priceUtils.calculateHybridConfidence !== 'function') {
        priceUtils.calculateHybridConfidence = function calculateHybridConfidence(priceSource, useCrowd) {
            const baseConfidence = priceSource.confidence || 0.5;
            const sampleBoost = Math.min(0.15, (priceSource.sampleSize / 200) * 0.15);
            const crowdBoost = useCrowd ? 0.1 : 0;
            return Math.min(0.98, baseConfidence + sampleBoost + crowdBoost);
        };
    }

    if (typeof priceUtils.buildHybridPriceResult !== 'function') {
        priceUtils.buildHybridPriceResult = function buildHybridPriceResult(payload) {
            return {
                category: payload.category,
                displayName: payload.displayNameMap[payload.category],
                prices: payload.prices,
                basePrices: payload.localData,
                fairPrice: payload.locationAdjusted,
                priceRange: {
                    min: Math.round(payload.locationAdjusted * 0.7),
                    max: Math.round(payload.locationAdjusted * 1.3)
                },
                qualityMultiplier: payload.qualityMultiplier,
                qualityBracket: payload.qualityBracket,
                locationMultiplier: payload.locationMultiplier,
                locationFactor: payload.locationMultiplier,
                area: payload.area,
                areaName: payload.soukLandmarks[payload.area]?.name || 'Unknown Area',
                areaMarkup: payload.soukLandmarks[payload.area]?.markup || 'UNKNOWN',
                dataSource: payload.dataSource,
                source: payload.useCrowd ? 'hybrid' : 'local',
                confidence: payload.totalConfidence,
                sampleSize: payload.priceSource.sampleSize,
                crowdData: payload.useCrowd ? {
                    median: payload.crowdData.median,
                    sampleSize: payload.crowdData.sampleSize,
                    avgQuality: payload.crowdData.avgQuality
                } : null,
                breakdown: {
                    baseMedian: payload.baseMedian,
                    qualityAdjustment: `×${payload.qualityMultiplier.toFixed(1)}`,
                    afterQuality: payload.qualityAdjusted,
                    locationAdjustment: `×${payload.locationMultiplier.toFixed(1)} (${payload.area})`,
                    finalPrice: payload.locationAdjusted
                },
                materialScore: payload.deepAnalysis?.material?.score || 0,
                craftsmanshipScore: payload.deepAnalysis?.craftsmanship?.score || 0,
                conditionScore: payload.deepAnalysis?.condition?.score || 0,
                isHandmade: payload.deepAnalysis?.authenticity?.genuine_handmade ?? null,
                redFlags: payload.deepAnalysis?.authenticity?.red_flags || [],
                lastUpdated: payload.priceSource.lastUpdated || new Date().toISOString(),
                isSimulated: false
            };
        };
    }

    if (typeof priceUtils.buildHybridContextPayload !== 'function') {
        priceUtils.buildHybridContextPayload = function buildHybridContextPayload(
            itemType,
            area,
            fairPrice,
            qualityMultiplier,
            dataSource,
            sampleSize
        ) {
            return {
                itemType,
                area,
                fairPrice,
                qualityMultiplier,
                dataSource,
                sampleSize
            };
        };
    }

    if (typeof priceUtils.buildHybridSessionActivityPayload !== 'function') {
        priceUtils.buildHybridSessionActivityPayload = function buildHybridSessionActivityPayload(
            itemType,
            fairPrice,
            area,
            qualityMultiplier,
            dataSource
        ) {
            return {
                itemType,
                fairPrice,
                area,
                qualityMultiplier,
                source: dataSource
            };
        };
    }
})(typeof window !== 'undefined' ? window : null);
