/**
 * ALIDADE Common Utilities
 * Extracted from legacy app.js with strict behavior parity.
 */
(function bootstrapCommonUtils(windowObj) {
    if (!windowObj) return;

    const utils = windowObj.ALIDADE_UTILS || (windowObj.ALIDADE_UTILS = {});

    if (typeof utils.normalizeTierTag !== 'function') {
        utils.normalizeTierTag = function normalizeTierTag(rawTier, fallback = 'BASIC') {
            const tier = String(rawTier || '').trim().toUpperCase();
            if (tier === 'ULTIMATE') return 'ULTIMATE';
            if (tier === 'BASIC' || tier === 'FREE' || tier === 'DEMO' || tier === 'LITE') return 'BASIC';
            return fallback;
        };
    }

    if (typeof utils.escapeHtml !== 'function') {
        utils.escapeHtml = function escapeHtml(value = '') {
            return String(value).replace(/[&<>"']/g, (char) => {
                return ({
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    '\'': '&#39;'
                })[char] || char;
            });
        };
    }

    if (!utils.viewTierRequirements) {
        utils.viewTierRequirements = Object.freeze({
            HOME: 'BASIC',
            SOUK: 'BASIC',
            NEGOTIATION: 'BASIC',
            PRODUCT_FORENSICS: 'BASIC',
            CERAMICS: 'BASIC',
            LEATHER: 'BASIC',
            RUGS: 'BASIC',
            METALS: 'BASIC',
            TRANSPORT: 'BASIC',
            DEFENSE: 'BASIC',
            ORGANIC_LAB: 'ULTIMATE',
            INTEL: 'BASIC',
            FORTRESS: 'ULTIMATE',
            PROTOCOLS: 'BASIC',
            VECTOR: 'ULTIMATE',
            PHRASES: 'BASIC',
            MARKET: 'ULTIMATE'
        });
    }

    if (typeof utils.getRequiredTierForView !== 'function') {
        utils.getRequiredTierForView = function getRequiredTierForView(viewName) {
            const key = String(viewName || '').trim().toUpperCase();
            return utils.viewTierRequirements[key] || 'BASIC';
        };
    }

    if (typeof utils.hasTierAccess !== 'function') {
        utils.hasTierAccess = function hasTierAccess(currentTierRaw, requiredTierRaw = 'BASIC', fallbackCurrentTier = 'BASIC') {
            const currentTier = utils.normalizeTierTag(currentTierRaw || fallbackCurrentTier || 'BASIC');
            const requiredTier = utils.normalizeTierTag(requiredTierRaw || 'BASIC');
            if (requiredTier === 'BASIC') return true;
            return currentTier === 'ULTIMATE';
        };
    }
})(typeof window !== 'undefined' ? window : null);
