/**
 * ALIDADE Feature Usage Utilities
 * Extracted from legacy app.js with adapter hooks.
 */
(function bootstrapFeatureUsageUtils(windowObj) {
    if (!windowObj) return;

    const accessUtils = windowObj.ALIDADE_ACCESS_UTILS || (windowObj.ALIDADE_ACCESS_UTILS = {});

    if (typeof accessUtils.getFeatureUsageStatus !== 'function') {
        accessUtils.getFeatureUsageStatus = function getFeatureUsageStatus(featureName, adapter = {}) {
            const normalizedFeature = String(featureName || '').trim();
            if (!normalizedFeature) {
                return {
                    allowed: true,
                    reason: null,
                    current_usage: 0,
                    limit: -1
                };
            }

            const lm = adapter.licenseManager || windowObj.licenseManager;
            if (lm && typeof lm.canUseFeature === 'function') {
                return lm.canUseFeature(normalizedFeature);
            }

            const checkFeatureAccess = adapter.checkFeatureAccess || windowObj.checkFeatureAccess;
            if (typeof checkFeatureAccess === 'function') {
                const fallback = checkFeatureAccess(normalizedFeature) || {};
                return {
                    allowed: Boolean(fallback.allowed),
                    reason: fallback.reason || null,
                    upgrade_to: fallback.upgradeNeeded || (fallback.allowed ? null : 'ultimate'),
                    current_usage: fallback.current_usage ?? 0,
                    limit: fallback.limit ?? -1
                };
            }

            return {
                allowed: true,
                reason: null,
                current_usage: 0,
                limit: -1
            };
        };
    }

    if (typeof accessUtils.consumeFeatureUsage !== 'function') {
        accessUtils.consumeFeatureUsage = function consumeFeatureUsage(featureName, adapter = {}) {
            const normalizedFeature = String(featureName || '').trim();
            if (!normalizedFeature) {
                return { count: 0, limit: -1, remaining: -1 };
            }

            let status;
            const lm = adapter.licenseManager || windowObj.licenseManager;
            if (lm && typeof lm.incrementFeatureUsage === 'function') {
                status = lm.incrementFeatureUsage(normalizedFeature);
            } else {
                const incrementUsage = adapter.incrementUsage || windowObj.incrementUsage;
                if (typeof incrementUsage === 'function') {
                    status = incrementUsage(normalizedFeature);
                } else {
                    status = { count: 0, limit: -1, remaining: -1 };
                }
            }

            const updateTierDisplay = adapter.updateTierDisplay || windowObj.updateTierDisplay;
            if (typeof updateTierDisplay === 'function') {
                updateTierDisplay();
            }

            return status;
        };
    }

    if (typeof accessUtils.consumeAiScannerUsage !== 'function') {
        accessUtils.consumeAiScannerUsage = function consumeAiScannerUsage(adapter = {}) {
            const consume = adapter.consumeFeatureUsage || accessUtils.consumeFeatureUsage;
            return consume('ai_scanner');
        };
    }
})(typeof window !== 'undefined' ? window : null);
