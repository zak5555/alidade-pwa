/**
 * ALIDADE Navigation Utilities
 * Extracted from legacy app.js with adapter hooks.
 */
(function bootstrapNavigationUtils(windowObj) {
    if (!windowObj) return;

    const navUtils = windowObj.ALIDADE_NAV_UTILS || (windowObj.ALIDADE_NAV_UTILS = {});

    if (typeof navUtils.commitNavigation !== 'function') {
        navUtils.commitNavigation = function commitNavigation(view, adapter = {}) {
            const triggerHaptics = typeof adapter.triggerHaptics === 'function'
                ? adapter.triggerHaptics
                : () => { };
            triggerHaptics('light');

            if (typeof adapter.setCurrentView === 'function') {
                adapter.setCurrentView(view);
            }
            if (typeof adapter.setAppState === 'function') {
                adapter.setAppState('currentView', view, true);
            }
            if (typeof adapter.showSkeletonFor === 'function') {
                adapter.showSkeletonFor(view);
            }

            const renderApp = typeof adapter.renderApp === 'function'
                ? adapter.renderApp
                : () => { };
            const scrollTo = typeof adapter.scrollTo === 'function'
                ? adapter.scrollTo
                : ((x, y) => windowObj.scrollTo?.(x, y));
            const nextFrame = typeof adapter.requestAnimationFrame === 'function'
                ? adapter.requestAnimationFrame
                : windowObj.requestAnimationFrame;
            if (typeof nextFrame === 'function') {
                nextFrame(() => {
                    renderApp();
                    scrollTo(0, 0);
                });
            } else {
                renderApp();
                scrollTo(0, 0);
            }
        };
    }

    if (typeof navUtils.navigateTo !== 'function') {
        navUtils.navigateTo = function navigateTo(view, adapter = {}) {
            const getRequiredTierForView = typeof adapter.getRequiredTierForView === 'function'
                ? adapter.getRequiredTierForView
                : () => 'BASIC';
            const hasTierAccess = typeof adapter.hasTierAccess === 'function'
                ? adapter.hasTierAccess
                : () => true;
            const getUserTier = typeof adapter.getUserTier === 'function'
                ? adapter.getUserTier
                : () => 'BASIC';
            const showAccessDeniedModal = typeof adapter.showAccessDeniedModal === 'function'
                ? adapter.showAccessDeniedModal
                : windowObj.showAccessDeniedModal;
            const normalizeTier = typeof adapter.normalizeTierTag === 'function'
                ? adapter.normalizeTierTag
                : (value) => String(value || 'BASIC').trim().toUpperCase();
            const showSkeletonFor = typeof adapter.showSkeletonFor === 'function'
                ? adapter.showSkeletonFor
                : () => { };
            const ensureUltimateDataPack = typeof adapter.ensureUltimateDataPack === 'function'
                ? adapter.ensureUltimateDataPack
                : () => Promise.resolve(false);
            const commitNavigation = typeof adapter.commitNavigation === 'function'
                ? adapter.commitNavigation
                : navUtils.commitNavigation;

            const requiredTier = getRequiredTierForView(view);
            if (!hasTierAccess(getUserTier(), requiredTier)) {
                if (typeof showAccessDeniedModal === 'function') {
                    showAccessDeniedModal(requiredTier, view);
                }
                return;
            }

            const normalizedRequired = normalizeTier(requiredTier || 'BASIC');
            if (normalizedRequired === 'ULTIMATE') {
                showSkeletonFor(view);
                Promise.resolve(ensureUltimateDataPack()).finally(() => {
                    if (typeof commitNavigation === 'function') {
                        if (commitNavigation === navUtils.commitNavigation) {
                            commitNavigation(view, adapter);
                        } else {
                            commitNavigation(view);
                        }
                    }
                });
                return;
            }

            if (typeof commitNavigation === 'function') {
                if (commitNavigation === navUtils.commitNavigation) {
                    commitNavigation(view, adapter);
                } else {
                    commitNavigation(view);
                }
            }
        };
    }
})(typeof window !== 'undefined' ? window : null);
