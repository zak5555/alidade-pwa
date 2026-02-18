/**
 * ALIDADE Tier Bridge Utilities
 * Extracted from legacy app.js with adapter-based state hooks.
 */
(function bootstrapTierBridge(windowObj) {
    if (!windowObj) return;

    const accessUtils = windowObj.ALIDADE_ACCESS_UTILS || (windowObj.ALIDADE_ACCESS_UTILS = {});
    const commonUtils = windowObj.ALIDADE_UTILS || null;
    const debugLog = (...args) => {
        if (windowObj.__ALIDADE_DEBUG_LOGS__ === true) {
            console.log(...args);
        }
    };

    function normalizeTier(rawTier, fallback = 'BASIC') {
        if (typeof commonUtils?.normalizeTierTag === 'function') {
            return commonUtils.normalizeTierTag(rawTier, fallback);
        }
        const tier = String(rawTier || '').trim().toUpperCase();
        if (tier === 'ULTIMATE') return 'ULTIMATE';
        if (tier === 'BASIC' || tier === 'FREE' || tier === 'DEMO' || tier === 'LITE') return 'BASIC';
        return fallback;
    }

    if (typeof accessUtils.syncTierFromLicenseManager !== 'function') {
        accessUtils.syncTierFromLicenseManager = function syncTierFromLicenseManager(adapter = {}) {
            const lm = typeof adapter.getLicenseManager === 'function'
                ? adapter.getLicenseManager()
                : windowObj.licenseManager;

            if (!lm?.user?.license_tier) {
                debugLog('[TIER_BRIDGE] No license data available yet');
                return false;
            }

            const dbTier = normalizeTier(lm.user.license_tier, 'BASIC');
            const validTiers = ['ULTIMATE', 'BASIC'];
            const currentUserTier = typeof adapter.getUserTier === 'function'
                ? adapter.getUserTier()
                : normalizeTier(windowObj.USER_TIER || 'BASIC');

            if (!validTiers.includes(dbTier)) {
                console.warn(`[TIER_BRIDGE] Unknown tier: "${dbTier}", keeping current: ${currentUserTier}`);
                return false;
            }

            if (currentUserTier === dbTier) return false;

            if (typeof adapter.setTierState === 'function') {
                adapter.setTierState(dbTier);
            } else {
                windowObj.USER_TIER = dbTier;
            }

            if (typeof adapter.getTierData === 'function' && typeof adapter.setCurrentTierConfig === 'function') {
                const tierData = adapter.getTierData();
                if (tierData) {
                    adapter.setCurrentTierConfig(tierData[dbTier] || tierData.BASIC);
                }
            }

            debugLog(`[TIER_BRIDGE] ${currentUserTier} -> ${dbTier} (from Supabase)`);

            if (typeof adapter.onTierSynced === 'function') {
                adapter.onTierSynced(dbTier, currentUserTier);
            }

            return true;
        };
    }

    if (typeof accessUtils.updateUIForPlan !== 'function') {
        accessUtils.updateUIForPlan = function updateUIForPlan(adapter = {}) {
            const normalize = typeof adapter.normalizeTierTag === 'function'
                ? adapter.normalizeTierTag
                : normalizeTier;

            let plan = typeof adapter.getCurrentUserPlan === 'function'
                ? adapter.getCurrentUserPlan()
                : windowObj.USER_TIER;

            plan = normalize(plan);

            if (typeof adapter.setCurrentUserPlan === 'function') {
                adapter.setCurrentUserPlan(plan);
            }

            if (typeof adapter.setUserTier === 'function') {
                adapter.setUserTier(plan);
            } else {
                windowObj.USER_TIER = plan;
            }

            if (typeof adapter.getTierData === 'function' && typeof adapter.setCurrentTierConfig === 'function') {
                const tierData = adapter.getTierData();
                if (tierData) {
                    adapter.setCurrentTierConfig(tierData[plan] || tierData.BASIC);
                }
            }

            debugLog(`[ALIDADE] Updating UI for plan: ${plan}`);

            if (typeof adapter.renderApp === 'function') {
                adapter.renderApp();
            }

            return plan;
        };
    }

    if (typeof accessUtils.updateUIByTier !== 'function') {
        accessUtils.updateUIByTier = function updateUIByTier(adapter = {}) {
            if (typeof adapter.syncTierFromLicenseManager === 'function') {
                return adapter.syncTierFromLicenseManager();
            }
            if (typeof accessUtils.syncTierFromLicenseManager === 'function') {
                return accessUtils.syncTierFromLicenseManager(adapter);
            }
            return false;
        };
    }
})(typeof window !== 'undefined' ? window : null);
