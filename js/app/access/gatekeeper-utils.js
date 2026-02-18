/**
 * ALIDADE Gatekeeper Access Utilities
 * Extracted from legacy app.js with adapter hooks.
 */
(function bootstrapGatekeeperAccessUtils(windowObj) {
    if (!windowObj) return;

    const accessUtils = windowObj.ALIDADE_ACCESS_UTILS || (windowObj.ALIDADE_ACCESS_UTILS = {});
    const debugLog = (...args) => {
        if (windowObj.__ALIDADE_DEBUG_LOGS__ === true) {
            console.log(...args);
        }
    };

    if (typeof accessUtils.showAccessDeniedModal !== 'function') {
        accessUtils.showAccessDeniedModal = function showAccessDeniedModal(requiredTier = 'ULTIMATE', featureKey = '', adapter = {}) {
            const modalId = 'access-denied-modal';
            const normalizeTier = typeof adapter.normalizeTierTag === 'function'
                ? adapter.normalizeTierTag
                : accessUtils.normalizeTierTag;
            const getUserTier = typeof adapter.getUserTier === 'function'
                ? adapter.getUserTier
                : () => 'BASIC';
            const resolveUpgradeContext = typeof adapter.getUpgradeContext === 'function'
                ? adapter.getUpgradeContext
                : accessUtils.getUpgradeContext;
            const escapeHtml = typeof adapter.escapeHtml === 'function'
                ? adapter.escapeHtml
                : accessUtils.escapeHtml;
            const trackLock = typeof adapter.trackLockImpression === 'function'
                ? adapter.trackLockImpression
                : accessUtils.trackLockImpression;
            const trackFunnel = typeof adapter.trackTierFunnelEvent === 'function'
                ? adapter.trackTierFunnelEvent
                : accessUtils.trackTierFunnelEvent;
            const showUpgradeModal = typeof adapter.showUpgradeModal === 'function'
                ? adapter.showUpgradeModal
                : windowObj.showUpgradeModal;
            const lockIcon = typeof adapter.getLockIcon === 'function'
                ? adapter.getLockIcon()
                : '';
            const doc = adapter.document || windowObj.document;
            const storage = adapter.localStorage || windowObj.localStorage;
            if (!doc) return;

            const required = normalizeTier
                ? normalizeTier(requiredTier || 'ULTIMATE')
                : String(requiredTier || 'ULTIMATE').trim().toUpperCase();
            const current = normalizeTier
                ? normalizeTier(getUserTier())
                : String(getUserTier() || 'BASIC').trim().toUpperCase();
            const context = typeof resolveUpgradeContext === 'function'
                ? resolveUpgradeContext(featureKey || required)
                : { title: required, preview: '', benefits: [], label: required };
            const safeEscapeHtml = typeof escapeHtml === 'function'
                ? escapeHtml
                : (value) => String(value || '');
            const benefitsHtml = (context.benefits || []).map((item) => `
        <li class="text-[11px] font-mono text-zinc-300 flex items-start gap-2">
            <span class="text-signal-amber mt-[1px]">+</span>
            <span>${safeEscapeHtml(item)}</span>
        </li>
    `).join('');

            // Prevent duplicate modals
            doc.getElementById(modalId)?.remove();

            // ---------------------------------------------------------------
            // RESCUE PHASE B: FEATURE GATING DEBUG
            // ---------------------------------------------------------------
            windowObj.testFeatureGate = {
                // 1. Simulate using a feature
                useScanner: () => {
                    const feature = 'ai_scanner';

                    // Check Limit
                    if (!windowObj.enforceLimit(feature, (reason) => {
                        console.warn(`[BLOCK] ${reason}`);
                        windowObj.openUpgradeModal(reason);
                    })) {
                        return 'BLOCKED';
                    }

                    // Increment Usage
                    const status = windowObj.incrementUsage(feature);
                    debugLog(`[SUCCESS] Scan used. Remaining: ${status.remaining}`);
                    return 'SUCCESS';
                },

                // 2. Reset limits
                resetLimits: () => {
                    if (!storage) return;
                    Object.keys(storage).forEach((key) => {
                        if (key.startsWith('usage_')) storage.removeItem(key);
                    });
                    debugLog('Limits reset.');
                }
            };
            debugLog('[DEBUG] Feature Gate Tests Ready: Run window.testFeatureGate.useScanner()');

            if (typeof trackLock === 'function') {
                trackLock(context.label || featureKey || required, 'access_denied_modal');
            }

            const modalHtml = `
            <div id="${modalId}" class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fadeIn">
                <div class="w-full max-w-md bg-void-950 border-2 border-signal-amber/50 rounded-sm relative overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.2)]">
                    <!-- Scanlines -->
                    <div class="absolute inset-0 opacity-[0.05] pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(245,158,11,0.5) 2px, rgba(245,158,11,0.5) 4px);"></div>
                    
                    <div class="p-6 relative z-10 text-center">
                        <div class="text-signal-amber mb-4 animate-pulse">
                            ${lockIcon}
                        </div>
                        
                        <h2 class="font-mono text-xl font-bold text-signal-amber mb-2 tracking-widest uppercase">ACCESS DENIED</h2>
                        
                        <div class="h-[1px] w-full bg-signal-amber/30 mb-4"></div>
                        
                        <p class="text-xs font-mono text-zinc-400 mb-2 leading-relaxed">
                            ${required} CLEARANCE REQUIRED.<br/>
                            Current access: <span class="text-white font-bold">${current}</span> operatives.
                        </p>

                        <div class="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-sm border border-signal-amber/30 bg-signal-amber/10 text-[10px] font-mono text-signal-amber tracking-widest uppercase">
                            <span>CLASSIFIED</span>
                            <span class="text-zinc-500">::</span>
                            <span>${safeEscapeHtml(context.title)}</span>
                        </div>

                        <p class="text-xs text-zinc-300 mb-4 leading-relaxed">
                            ${safeEscapeHtml(context.preview)}
                        </p>

                        <ul class="text-left space-y-2 mb-6 border border-void-800 bg-void-900/50 rounded-sm p-3">
                            ${benefitsHtml}
                        </ul>
                        
                        <button id="${modalId}-upgrade" class="block w-full py-3 bg-signal-amber hover:bg-signal-amber/80 text-black font-bold font-mono text-sm tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.6)]">
                            UNLOCK NOW
                        </button>
                        
                        <button onclick="document.getElementById('${modalId}').remove()" class="mt-4 text-[10px] subpixel-antialiased font-mono text-void-600 hover:text-zinc-400 uppercase tracking-widest">
                            DISMISS
                        </button>
                    </div>
                </div>
            </div>
        `;
            doc.body?.insertAdjacentHTML('beforeend', modalHtml);

            const upgradeBtn = doc.getElementById(`${modalId}-upgrade`);
            if (upgradeBtn) {
                upgradeBtn.addEventListener('click', () => {
                    if (typeof trackFunnel === 'function') {
                        trackFunnel('click_upgrade', {
                            source: 'access_denied_modal',
                            feature: context.label || String(featureKey || '').toUpperCase() || 'UNKNOWN'
                        });
                    }
                    if (typeof showUpgradeModal === 'function') {
                        showUpgradeModal('ultimate', context.label || context.title || 'Ultimate');
                    }
                    doc.getElementById(modalId)?.remove();
                });
            }
        };
    }

    if (typeof accessUtils.checkAccess !== 'function') {
        accessUtils.checkAccess = function checkAccess(requiredTier, actionCallback, featureKey = '', adapter = {}) {
            const normalizeTier = typeof adapter.normalizeTierTag === 'function'
                ? adapter.normalizeTierTag
                : accessUtils.normalizeTierTag;
            const hasTierAccessFn = typeof adapter.hasTierAccess === 'function'
                ? adapter.hasTierAccess
                : accessUtils.hasTierAccess;
            const getUserTier = typeof adapter.getUserTier === 'function'
                ? adapter.getUserTier
                : () => 'BASIC';
            const showDenied = typeof adapter.showAccessDeniedModal === 'function'
                ? adapter.showAccessDeniedModal
                : windowObj.showAccessDeniedModal;

            const tier = normalizeTier
                ? normalizeTier(getUserTier())
                : String(getUserTier() || 'BASIC').trim().toUpperCase();
            const requiredRaw = (requiredTier || 'BASIC').toUpperCase();
            const required = requiredRaw === 'LITE'
                ? 'ULTIMATE'
                : (normalizeTier ? normalizeTier(requiredRaw) : requiredRaw);

            if (typeof hasTierAccessFn === 'function' && hasTierAccessFn(tier, required)) {
                if (typeof actionCallback === 'function') {
                    actionCallback();
                }
                return;
            }

            if (typeof showDenied === 'function') {
                showDenied(required, featureKey);
            }
        };
    }
})(typeof window !== 'undefined' ? window : null);
