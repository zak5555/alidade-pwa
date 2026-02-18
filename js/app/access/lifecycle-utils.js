/**
 * ALIDADE Access Lifecycle Utilities
 * Extracted from legacy app.js with adapter hooks.
 */
(function bootstrapAccessLifecycleUtils(windowObj) {
    if (!windowObj) return;

    const accessUtils = windowObj.ALIDADE_ACCESS_UTILS || (windowObj.ALIDADE_ACCESS_UTILS = {});

    if (typeof accessUtils.ensureUpgradeModalBridge !== 'function') {
        accessUtils.ensureUpgradeModalBridge = function ensureUpgradeModalBridge(adapter = {}) {
            const target = adapter.windowObj || windowObj;
            if (!target || typeof target.showUpgradeModal === 'function') return;

            const getLicenseManager = typeof adapter.getLicenseManager === 'function'
                ? adapter.getLicenseManager
                : () => target.licenseManager;
            const openUpgradeModal = typeof adapter.openUpgradeModal === 'function'
                ? adapter.openUpgradeModal
                : ((tier, featureName) => {
                    if (typeof target.openUpgradeModal === 'function') {
                        target.openUpgradeModal(String(tier || 'ultimate'), String(featureName || ''));
                    }
                });
            const activateUrl = String(adapter.activateUrl || 'activate.html');

            target.showUpgradeModal = function showUpgradeModal(targetTier = 'ultimate', featureName = '') {
                const licenseManager = getLicenseManager();
                if (licenseManager && typeof licenseManager.showUpgradeModal === 'function') {
                    licenseManager.showUpgradeModal(targetTier, featureName);
                    return;
                }

                if (typeof openUpgradeModal === 'function') {
                    openUpgradeModal(String(targetTier || 'ultimate'), String(featureName || ''));
                    return;
                }

                if (target.location) {
                    target.location.href = activateUrl;
                }
            };
        };
    }

    if (typeof accessUtils.bindTierChangeSync !== 'function') {
        accessUtils.bindTierChangeSync = function bindTierChangeSync(adapter = {}) {
            const target = adapter.windowObj || windowObj;
            if (!target || target.__alidadeTierChangeBound || typeof target.addEventListener !== 'function') {
                return;
            }

            target.__alidadeTierChangeBound = true;

            const normalizeTier = typeof adapter.normalizeTierTag === 'function'
                ? adapter.normalizeTierTag
                : accessUtils.normalizeTierTag;
            const getUserTier = typeof adapter.getUserTier === 'function'
                ? adapter.getUserTier
                : () => 'BASIC';
            const trackTierFunnel = typeof adapter.trackTierFunnelEvent === 'function'
                ? adapter.trackTierFunnelEvent
                : accessUtils.trackTierFunnelEvent;
            const ensureUltimateDataPack = typeof adapter.ensureUltimateDataPack === 'function'
                ? adapter.ensureUltimateDataPack
                : () => { };
            const updateUiByTier = typeof adapter.updateUIByTier === 'function'
                ? adapter.updateUIByTier
                : (() => target.updateUIByTier?.());
            const rerenderApp = typeof adapter.renderApp === 'function'
                ? adapter.renderApp
                : null;
            const setUserTier = typeof adapter.setUserTier === 'function'
                ? adapter.setUserTier
                : null;

            target.addEventListener('alidade:tier-change', (event) => {
                const fallbackTier = getUserTier();
                const changedTier = normalizeTier
                    ? normalizeTier(event?.detail?.tier || fallbackTier || 'BASIC')
                    : String(event?.detail?.tier || fallbackTier || 'BASIC').trim().toUpperCase();

                if (typeof setUserTier === 'function') {
                    setUserTier(changedTier);
                } else {
                    target.USER_TIER = changedTier;
                }

                if (changedTier === 'ULTIMATE' && target.__alidadeUpgradeAttempted && !target.__alidadeUpgradeSuccessTracked) {
                    target.__alidadeUpgradeSuccessTracked = true;
                    if (typeof trackTierFunnel === 'function') {
                        trackTierFunnel('success', { source: 'tier_change_event', feature: 'UPGRADE' });
                    }
                }
                if (changedTier === 'ULTIMATE') {
                    ensureUltimateDataPack();
                }
                if (typeof updateUiByTier === 'function') {
                    updateUiByTier();
                }
                if (typeof rerenderApp === 'function') {
                    rerenderApp();
                }
            });
        };
    }
})(typeof window !== 'undefined' ? window : null);
