/**
 * ALIDADE Logistics Gate Utilities
 * Extracted from legacy app.js with adapter hooks.
 */
(function bootstrapLogisticsGateUtils(windowObj) {
    if (!windowObj) return;

    const accessUtils = windowObj.ALIDADE_ACCESS_UTILS || (windowObj.ALIDADE_ACCESS_UTILS = {});

    if (typeof accessUtils.isLicenseUserAuthenticated !== 'function') {
        accessUtils.isLicenseUserAuthenticated = function isLicenseUserAuthenticated(adapter = {}) {
            const lm = adapter.licenseManager || windowObj.licenseManager;
            return Boolean(
                lm &&
                typeof lm.isAuthenticated === 'function' &&
                lm.isAuthenticated()
            );
        };
    }

    if (typeof accessUtils.isProtocolsLogisticsAuthRequired !== 'function') {
        accessUtils.isProtocolsLogisticsAuthRequired = function isProtocolsLogisticsAuthRequired(adapter = {}) {
            const isAuthenticated = typeof adapter.isLicenseUserAuthenticated === 'function'
                ? adapter.isLicenseUserAuthenticated()
                : accessUtils.isLicenseUserAuthenticated(adapter);
            return !isAuthenticated;
        };
    }

    if (typeof accessUtils.getProtocolsLogisticsGateStatus !== 'function') {
        accessUtils.getProtocolsLogisticsGateStatus = function getProtocolsLogisticsGateStatus(adapter = {}) {
            const normalizeTierTag = typeof adapter.normalizeTierTag === 'function'
                ? adapter.normalizeTierTag
                : (value) => String(value || 'BASIC').trim().toUpperCase();
            const getFeatureUsageStatus = typeof adapter.getFeatureUsageStatus === 'function'
                ? adapter.getFeatureUsageStatus
                : (() => ({ allowed: true, current_usage: 0, limit: -1 }));
            const featureName = adapter.featureName || 'protocols_logistics_optimize';
            const freeTries = Number.isFinite(adapter.freeTries) ? adapter.freeTries : 3;
            const userTier = typeof adapter.getUserTier === 'function'
                ? adapter.getUserTier()
                : (windowObj.USER_TIER || 'BASIC');

            const tier = normalizeTierTag(userTier);
            const status = getFeatureUsageStatus(featureName);
            const baseLimit = Number.isFinite(status.limit) ? status.limit : (status.limit ?? -1);
            const limit = (tier === 'ULTIMATE')
                ? -1
                : (baseLimit === -1 ? freeTries : Number(baseLimit));
            const used = Number(status.current_usage || 0);
            const allowed = tier === 'ULTIMATE'
                ? true
                : (Boolean(status.allowed) && (limit === -1 || used < limit));

            return {
                tier,
                limit,
                used,
                remaining: limit === -1 ? -1 : Math.max(0, limit - used),
                allowed,
                locked: !allowed
            };
        };
    }

    if (typeof accessUtils.getProtocolsLogisticsUsageText !== 'function') {
        accessUtils.getProtocolsLogisticsUsageText = function getProtocolsLogisticsUsageText(logisticsState, adapter = {}) {
            const authRequired = typeof adapter.isProtocolsLogisticsAuthRequired === 'function'
                ? adapter.isProtocolsLogisticsAuthRequired()
                : accessUtils.isProtocolsLogisticsAuthRequired(adapter);
            if (authRequired) {
                return 'Registration required before optimization';
            }
            if (!logisticsState || logisticsState.limit === -1) {
                return 'Unlimited route optimizations available';
            }
            return `${logisticsState.remaining}/${logisticsState.limit} tries left`;
        };
    }

    if (typeof accessUtils.getProtocolsLogisticsUsageMeta !== 'function') {
        accessUtils.getProtocolsLogisticsUsageMeta = function getProtocolsLogisticsUsageMeta(logisticsState, adapter = {}) {
            const authRequired = typeof adapter.isProtocolsLogisticsAuthRequired === 'function'
                ? adapter.isProtocolsLogisticsAuthRequired()
                : accessUtils.isProtocolsLogisticsAuthRequired(adapter);
            if (authRequired) {
                return 'Sign in to unlock your 3 free route optimizations on this profile';
            }
            if (!logisticsState || logisticsState.limit === -1) {
                return 'ULTIMATE: unlimited tactical planning';
            }
            return `Used ${logisticsState.used} of ${logisticsState.limit} free route optimizations`;
        };
    }
})(typeof window !== 'undefined' ? window : null);
