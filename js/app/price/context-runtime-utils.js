/**
 * ALIDADE Price Context Runtime Utilities
 * Extracted from legacy app.js with compatibility hooks.
 */
(function bootstrapPriceContextRuntimeUtils(windowObj) {
    if (!windowObj) return;

    const priceUtils = windowObj.ALIDADE_PRICE_UTILS || (windowObj.ALIDADE_PRICE_UTILS = {});

    if (typeof priceUtils.resolveFeatureContext !== 'function') {
        priceUtils.resolveFeatureContext = function resolveFeatureContext(contextEngine, feature, fallbackValue) {
            return contextEngine?.getContext(feature) || fallbackValue;
        };
    }

    if (typeof priceUtils.buildAnalyzeWithContextResponse !== 'function') {
        priceUtils.buildAnalyzeWithContextResponse = function buildAnalyzeWithContextResponse(context, price) {
            return { context, price };
        };
    }

    if (typeof priceUtils.buildNegotiationWithContextResponse !== 'function') {
        priceUtils.buildNegotiationWithContextResponse = function buildNegotiationWithContextResponse(
            askingPrice,
            itemType,
            context
        ) {
            return {
                askingPrice,
                itemType,
                context,
                recommendedTactics: context.recommendedTactics || []
            };
        };
    }
})(typeof window !== 'undefined' ? window : null);
