/**
 * ALIDADE Tier Funnel Utilities
 * Extracted from legacy app.js with adapter hooks.
 */
(function bootstrapFunnelUtils(windowObj) {
    if (!windowObj) return;

    const accessUtils = windowObj.ALIDADE_ACCESS_UTILS || (windowObj.ALIDADE_ACCESS_UTILS = {});
    const FUNNEL_STORAGE_KEY = 'alidade_tier_funnel_events_v1';
    const debugLog = (...args) => {
        if (windowObj.__ALIDADE_DEBUG_LOGS__ === true) {
            console.log(...args);
        }
    };

    if (typeof accessUtils.trackTierFunnelEvent !== 'function') {
        accessUtils.trackTierFunnelEvent = function trackTierFunnelEvent(eventName, payload = {}, adapter = {}) {
            const event = String(eventName || '').trim();
            if (!event) return null;

            if ((event === 'click_upgrade' || event === 'checkout_open') && typeof adapter.markUpgradeAttempted === 'function') {
                adapter.markUpgradeAttempted();
            }

            const tier = typeof adapter.getCurrentTier === 'function'
                ? adapter.getCurrentTier()
                : (windowObj.USER_TIER || 'BASIC');

            const envelope = {
                event,
                timestamp: Date.now(),
                tier,
                ...payload
            };

            try {
                const raw = localStorage.getItem(FUNNEL_STORAGE_KEY);
                const current = raw ? JSON.parse(raw) : [];
                current.push(envelope);
                if (current.length > 200) current.splice(0, current.length - 200);
                localStorage.setItem(FUNNEL_STORAGE_KEY, JSON.stringify(current));
            } catch (error) {
                console.warn('[FUNNEL] Failed to persist event:', error);
            }

            if (typeof adapter.logActivity === 'function') {
                adapter.logActivity('tier_funnel', envelope);
            }

            debugLog('[FUNNEL]', envelope);
            return envelope;
        };
    }
})(typeof window !== 'undefined' ? window : null);
