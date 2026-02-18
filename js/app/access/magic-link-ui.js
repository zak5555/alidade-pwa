/**
 * ALIDADE Magic Link + Tier Badge UI Utilities
 * Extracted from legacy app.js with adapter hooks.
 */
(function bootstrapMagicLinkUi(windowObj) {
    if (!windowObj) return;

    const accessUtils = windowObj.ALIDADE_ACCESS_UTILS || (windowObj.ALIDADE_ACCESS_UTILS = {});
    const debugLog = (...args) => {
        if (windowObj.__ALIDADE_DEBUG_LOGS__ === true) {
            console.log(...args);
        }
    };

    if (typeof accessUtils.checkUrlForMagicLink !== 'function') {
        accessUtils.checkUrlForMagicLink = function checkUrlForMagicLink(adapter = {}) {
            const urlParams = new URLSearchParams(window.location.search);
            const accessKey = urlParams.get('access');
            if (!accessKey) return null;

            debugLog('[ACCESS] Magic Link detected:', accessKey);

            const validKeys = adapter.validKeys || {
                ULTIMATE: 'ultimate_10_key',
                BASIC: 'basic_free_key',
                LITE: 'lite_5_key'
            };

            let detectedPlan = null;
            if (accessKey === validKeys.ULTIMATE) {
                detectedPlan = 'ULTIMATE';
            } else if (accessKey === validKeys.BASIC || accessKey === validKeys.LITE) {
                detectedPlan = 'BASIC';
            }

            if (!detectedPlan) return null;

            localStorage.setItem('user_plan', detectedPlan);
            localStorage.setItem('alidade_access_token', accessKey);

            if (typeof adapter.setPlanState === 'function') {
                adapter.setPlanState(detectedPlan);
            } else {
                windowObj.USER_TIER = detectedPlan;
            }

            if (typeof adapter.updateUIForPlan === 'function') {
                adapter.updateUIForPlan();
            }

            const lockModal = document.getElementById('lock-modal');
            if (lockModal) lockModal.classList.add('hidden');

            window.history.replaceState({}, document.title, window.location.pathname);

            if (typeof adapter.showToast === 'function') {
                adapter.showToast(`ACCESS GRANTED: ${detectedPlan} MODE ACTIVATED`, 'success');
            }

            return detectedPlan;
        };
    }

    if (typeof accessUtils.updateTierDisplay !== 'function') {
        accessUtils.updateTierDisplay = function updateTierDisplay(adapter = {}) {
            const normalizeTierTag = typeof adapter.normalizeTierTag === 'function'
                ? adapter.normalizeTierTag
                : (value) => String(value || '').trim().toUpperCase();
            const getUserTier = typeof adapter.getUserTier === 'function'
                ? adapter.getUserTier
                : () => windowObj.USER_TIER || 'BASIC';

            const tier = normalizeTierTag(getUserTier()).toLowerCase();
            const badge = document.getElementById('tier-badge');
            const stats = document.getElementById('usage-stats');
            const countSpan = document.getElementById('usage-count');
            const hint = document.getElementById('upgrade-hint');

            if (!badge) return false;

            const labels = { basic: '🆓 BASIC', ultimate: '🚀 ULTIMATE' };
            const colors = {
                basic: 'text-zinc-500 border-void-700 bg-void-800',
                ultimate: 'text-signal-amber border-signal-amber/30 bg-signal-amber/10'
            };

            badge.textContent = labels[tier] || labels.basic;
            badge.className = `cursor-pointer px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold tracking-wider transition-colors border ${colors[tier] || colors.basic}`;

            const scanLimits = { basic: 1, ultimate: -1 };
            const limit = scanLimits[tier] ?? 1;

            if (limit === -1) {
                stats.classList.remove('hidden');
                countSpan.textContent = '∞';
                countSpan.className = 'text-signal-emerald';
                hint.classList.add('hidden');
                return true;
            }

            const today = new Date().toISOString().split('T')[0];
            const usageKey = `usage_ai_scanner_${today}`;
            const currentUsage = parseInt(localStorage.getItem(usageKey) || '0', 10);

            stats.classList.remove('hidden');
            countSpan.textContent = `${currentUsage}/${limit}`;

            const percent = currentUsage / limit;
            if (percent >= 1) countSpan.className = 'text-signal-crimson';
            else if (percent >= 0.8) countSpan.className = 'text-signal-amber';
            else countSpan.className = 'text-signal-emerald';

            if (tier !== 'ultimate') {
                hint.classList.remove('hidden');
            } else {
                hint.classList.add('hidden');
            }

            return true;
        };
    }
})(typeof window !== 'undefined' ? window : null);
