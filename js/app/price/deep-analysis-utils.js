/**
 * ALIDADE Deep Analysis Price Utilities
 * Extracted from legacy app.js with compatibility hooks.
 */
(function bootstrapDeepAnalysisPriceUtils(windowObj) {
    if (!windowObj) return;

    const priceUtils = windowObj.ALIDADE_PRICE_UTILS || (windowObj.ALIDADE_PRICE_UTILS = {});
    const deepAnalysisDebugLog = (...args) => {
        if (windowObj.__ALIDADE_DEBUG_LOGS__ === true) {
            console.log(...args);
        }
    };

    if (typeof priceUtils.runSingleShotDeepAnalysis !== 'function') {
        priceUtils.runSingleShotDeepAnalysis = async function runSingleShotDeepAnalysis(imageSource, DeepImageAnalyzerCtor, VisionAPIClientCtor) {
            const deepAnalyzer = new DeepImageAnalyzerCtor();
            const visionClient = new VisionAPIClientCtor();

            // Step 1: Extract intelligent zones
            const zones = await deepAnalyzer.extractZones(imageSource);

            // Step 2: Send to Gemini for multi-zone analysis
            const analysis = await visionClient.callGeminiDeep(zones);

            return analysis;
        };
    }

    if (typeof priceUtils.calculateSmartPriceResult !== 'function') {
        priceUtils.calculateSmartPriceResult = function calculateSmartPriceResult(
            deepAnalysis,
            itemCategory,
            mockPriceDatabase,
            displayNames
        ) {
            const category = itemCategory || deepAnalysis.item?.item_id;

            if (!category || !mockPriceDatabase[category]) {
                console.warn('[SMART_PRICE] No price data for:', category);
                return null;
            }

            const baseData = mockPriceDatabase[category];
            const multiplier = Math.max(0.3, Math.min(3.5, deepAnalysis.quality_multiplier || 1.0));

            // Apply quality multiplier to price range
            const adjustedPrices = {
                minimum: Math.round(baseData.minimum * multiplier),
                p25: Math.round(baseData.p25 * multiplier),
                median: Math.round(baseData.median * multiplier),
                p75: Math.round(baseData.p75 * multiplier),
                maximum: Math.round(baseData.maximum * multiplier),
                mean: Math.round(baseData.mean * multiplier),
                sampleSize: baseData.sampleSize
            };

            deepAnalysisDebugLog('[SMART_PRICE] Quality multiplier:', multiplier.toFixed(2),
                '| Base median:', baseData.median, '-> Adjusted:', adjustedPrices.median);

            return {
                category,
                displayName: displayNames[category],
                prices: adjustedPrices,
                basePrices: baseData,
                qualityMultiplier: multiplier,
                materialScore: deepAnalysis.material?.score || 0,
                craftsmanshipScore: deepAnalysis.craftsmanship?.score || 0,
                conditionScore: deepAnalysis.condition?.score || 0,
                isHandmade: deepAnalysis.authenticity?.genuine_handmade ?? null,
                redFlags: deepAnalysis.authenticity?.red_flags || [],
                lastUpdated: new Date().toISOString(),
                isSimulated: false
            };
        };
    }
})(typeof window !== 'undefined' ? window : null);

