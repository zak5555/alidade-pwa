/**
 * ALIDADE Upgrade Context + Lock Impression Utilities
 * Extracted from legacy app.js with adapter hooks.
 */
(function bootstrapUpgradeContextUtils(windowObj) {
    if (!windowObj) return;

    const accessUtils = windowObj.ALIDADE_ACCESS_UTILS || (windowObj.ALIDADE_ACCESS_UTILS = {});

    if (typeof accessUtils.getUpgradeContext !== 'function') {
        accessUtils.getUpgradeContext = function getUpgradeContext(featureKey = '', adapter = {}) {
            const normalized = String(featureKey || '').trim().toUpperCase();
            const contextMap = adapter.contextMap || {};
            const fromMap = contextMap[normalized];
            if (fromMap) return fromMap;

            return {
                title: 'Ultimate Clearance',
                label: normalized || 'ULTIMATE',
                preview: 'This module is visible but classified until upgrade.',
                benefits: ['Unlimited scans', 'Full archive access', 'Advanced tactical workflows']
            };
        };
    }

    if (typeof accessUtils.trackLockImpression !== 'function') {
        accessUtils.trackLockImpression = function trackLockImpression(featureKey = '', source = 'unknown', adapter = {}) {
            const normalizedFeature = String(featureKey || 'unknown').trim().toUpperCase() || 'UNKNOWN';
            const normalizeTier = typeof adapter.normalizeTierTag === 'function'
                ? adapter.normalizeTierTag
                : (value) => String(value || 'BASIC').trim().toUpperCase();
            const currentTier = typeof adapter.getUserTier === 'function'
                ? adapter.getUserTier()
                : (windowObj.USER_TIER || 'BASIC');

            const dedupeStore = adapter.seenLockImpressions || (accessUtils.__seenLockImpressions ||= new Set());
            const dedupeKey = `${source}:${normalizedFeature}:${normalizeTier(currentTier)}`;

            if (dedupeStore.has(dedupeKey)) return false;
            dedupeStore.add(dedupeKey);

            if (typeof adapter.trackTierFunnelEvent === 'function') {
                adapter.trackTierFunnelEvent('view_lock', { source, feature: normalizedFeature });
            } else if (typeof accessUtils.trackTierFunnelEvent === 'function') {
                accessUtils.trackTierFunnelEvent('view_lock', { source, feature: normalizedFeature });
            }

            return true;
        };
    }
})(typeof window !== 'undefined' ? window : null);
