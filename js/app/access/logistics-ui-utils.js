/**
 * ALIDADE Logistics UI Access Utilities
 * Extracted from legacy app.js with adapter hooks.
 */
(function bootstrapLogisticsUiUtils(windowObj) {
    if (!windowObj) return;

    const accessUtils = windowObj.ALIDADE_ACCESS_UTILS || (windowObj.ALIDADE_ACCESS_UTILS = {});

    if (typeof accessUtils.openFeatureAuthModal !== 'function') {
        accessUtils.openFeatureAuthModal = function openFeatureAuthModal(options = {}, adapter = {}) {
            const {
                source = 'feature_auth_gate',
                title = 'Authenticate To Continue',
                copy = 'Registration is required before continuing this action.',
                meta = 'Sign in once to continue on this profile.'
            } = options || {};

            const getLogisticsStatus = typeof adapter.getProtocolsLogisticsGateStatus === 'function'
                ? adapter.getProtocolsLogisticsGateStatus
                : accessUtils.getProtocolsLogisticsGateStatus;
            const openAuthModal = typeof adapter.openProtocolsAuthModal === 'function'
                ? adapter.openProtocolsAuthModal
                : windowObj.openProtocolsAuthModal;

            if (typeof openAuthModal === 'function') {
                const logisticsState = getLogisticsStatus ? getLogisticsStatus() : {};
                openAuthModal(logisticsState, source);
            }

            const doc = adapter.document || windowObj.document;
            if (!doc) return;

            const titleNode = doc.getElementById('protocols-auth-modal-title');
            const copyNode = doc.getElementById('protocols-auth-modal-copy');
            const metaNode = doc.getElementById('protocols-auth-modal-tries');

            if (titleNode) titleNode.textContent = String(title || 'Authenticate To Continue');
            if (copyNode) copyNode.textContent = String(copy || '');
            if (metaNode) metaNode.textContent = String(meta || '');
        };
    }

    if (typeof accessUtils.ensureBasicFeatureAuth !== 'function') {
        accessUtils.ensureBasicFeatureAuth = function ensureBasicFeatureAuth(options = {}, adapter = {}) {
            const normalizeTier = typeof adapter.normalizeTierTag === 'function'
                ? adapter.normalizeTierTag
                : accessUtils.normalizeTierTag;
            const getUserTier = typeof adapter.getUserTier === 'function'
                ? adapter.getUserTier
                : () => 'BASIC';
            const resolvedTier = normalizeTier
                ? normalizeTier(getUserTier())
                : String(getUserTier() || 'BASIC').trim().toUpperCase();
            if (resolvedTier === 'ULTIMATE') return true;

            const isAuthenticated = typeof adapter.isLicenseUserAuthenticated === 'function'
                ? adapter.isLicenseUserAuthenticated
                : accessUtils.isLicenseUserAuthenticated;
            if (typeof isAuthenticated === 'function' && isAuthenticated()) return true;

            const openFeatureModal = typeof adapter.openFeatureAuthModal === 'function'
                ? adapter.openFeatureAuthModal
                : accessUtils.openFeatureAuthModal;
            if (typeof openFeatureModal === 'function') {
                if (openFeatureModal === accessUtils.openFeatureAuthModal) {
                    openFeatureModal(options, adapter);
                } else {
                    openFeatureModal(options);
                }
            }
            return false;
        };
    }

    if (typeof accessUtils.promptProtocolsLogisticsUpgrade !== 'function') {
        accessUtils.promptProtocolsLogisticsUpgrade = function promptProtocolsLogisticsUpgrade(source = 'protocols_logistics_lock', adapter = {}) {
            const getLogisticsStatus = typeof adapter.getProtocolsLogisticsGateStatus === 'function'
                ? adapter.getProtocolsLogisticsGateStatus
                : accessUtils.getProtocolsLogisticsGateStatus;
            const logisticsState = getLogisticsStatus ? getLogisticsStatus() : {};

            const isAuthenticated = typeof adapter.isLicenseUserAuthenticated === 'function'
                ? adapter.isLicenseUserAuthenticated
                : accessUtils.isLicenseUserAuthenticated;
            const openAuthModal = typeof adapter.openProtocolsAuthModal === 'function'
                ? adapter.openProtocolsAuthModal
                : windowObj.openProtocolsAuthModal;
            if (typeof isAuthenticated === 'function' && !isAuthenticated()) {
                if (typeof openAuthModal === 'function') {
                    openAuthModal(logisticsState, source);
                }
                return;
            }

            const promptUpgrade = typeof adapter.promptProtocolsUpgrade === 'function'
                ? adapter.promptProtocolsUpgrade
                : accessUtils.promptProtocolsUpgrade;
            if (typeof promptUpgrade === 'function') {
                if (promptUpgrade === accessUtils.promptProtocolsUpgrade) {
                    promptUpgrade('PROTOCOLS_LOGISTICS_OPTIMIZE', source, adapter);
                } else {
                    promptUpgrade('PROTOCOLS_LOGISTICS_OPTIMIZE', source);
                }
            }
        };
    }

    if (typeof accessUtils.renderProtocolsLogisticsGlassOverlay !== 'function') {
        accessUtils.renderProtocolsLogisticsGlassOverlay = function renderProtocolsLogisticsGlassOverlay(logisticsStatus, adapter = {}) {
            const freeTries = Number.isFinite(adapter.freeTries) ? adapter.freeTries : 3;
            const isAuthenticated = typeof adapter.isLicenseUserAuthenticated === 'function'
                ? adapter.isLicenseUserAuthenticated
                : accessUtils.isLicenseUserAuthenticated;
            const guestLocked = typeof isAuthenticated === 'function' ? !isAuthenticated() : false;
            const limitLabel = Number.isFinite(logisticsStatus?.limit) && logisticsStatus.limit > 0
                ? logisticsStatus.limit
                : freeTries;
            const ctaLabel = guestLocked ? 'Sign In To Continue' : 'Unlock Ultimate Access';
            const message = guestLocked
                ? `You've used your ${limitLabel} free route optimizations. Sign in to sync your profile, then upgrade for unlimited tactical planning.`
                : `You've used your ${limitLabel} free route optimizations. Upgrade to Ultimate for unlimited tactical planning.`;
            return `
        <div id="protocols-logistics-glass-wall" class="absolute inset-0 z-30 flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-black/55" style="backdrop-filter: blur(8px);"></div>
            <div class="relative w-full max-w-sm rounded-sm border border-signal-amber/40 bg-void-950/90 p-4 text-center shadow-[0_0_30px_rgba(245,158,11,0.15)]">
                <p class="text-sm font-heading font-bold text-signal-amber uppercase tracking-wider">&#128274; Tactical Limit Reached</p>
                <p class="mt-2 text-xs text-zinc-300 leading-relaxed">${message}</p>
                <button onclick="window.promptProtocolsLogisticsUpgrade && window.promptProtocolsLogisticsUpgrade('protocols_logistics_glass_wall')" class="mt-4 w-full py-2.5 bg-signal-amber hover:bg-amber-400 text-black text-[11px] font-mono font-bold uppercase tracking-widest rounded-sm transition-colors">
                    ${ctaLabel}
                </button>
            </div>
        </div>
    `;
        };
    }

    if (typeof accessUtils.syncProtocolsLogisticsLockUi !== 'function') {
        accessUtils.syncProtocolsLogisticsLockUi = function syncProtocolsLogisticsLockUi(adapter = {}) {
            const doc = adapter.document || windowObj.document;
            if (!doc) return;

            const getLogisticsStatus = typeof adapter.getProtocolsLogisticsGateStatus === 'function'
                ? adapter.getProtocolsLogisticsGateStatus
                : accessUtils.getProtocolsLogisticsGateStatus;
            const logisticsState = getLogisticsStatus ? getLogisticsStatus() : {};

            const getUsageText = typeof adapter.getProtocolsLogisticsUsageText === 'function'
                ? adapter.getProtocolsLogisticsUsageText
                : accessUtils.getProtocolsLogisticsUsageText;
            const getUsageMeta = typeof adapter.getProtocolsLogisticsUsageMeta === 'function'
                ? adapter.getProtocolsLogisticsUsageMeta
                : accessUtils.getProtocolsLogisticsUsageMeta;

            const usageValue = doc.getElementById('protocols-logistics-usage-value');
            const usageMeta = doc.getElementById('protocols-logistics-usage-meta');
            if (usageValue && typeof getUsageText === 'function') {
                usageValue.textContent = getUsageText(logisticsState, adapter);
            }
            if (usageMeta && typeof getUsageMeta === 'function') {
                usageMeta.textContent = getUsageMeta(logisticsState, adapter);
            }

            const shell = doc.getElementById('route-planner-shell');
            const overlay = doc.getElementById('protocols-logistics-glass-wall');
            if (!logisticsState.locked) {
                if (overlay) overlay.remove();
                return;
            }

            const trackLock = typeof adapter.trackLockImpression === 'function'
                ? adapter.trackLockImpression
                : accessUtils.trackLockImpression;
            if (typeof trackLock === 'function') {
                trackLock('PROTOCOLS_LOGISTICS_OPTIMIZE', 'protocols_logistics_glass_wall');
            }

            const isAuthenticated = typeof adapter.isLicenseUserAuthenticated === 'function'
                ? adapter.isLicenseUserAuthenticated
                : accessUtils.isLicenseUserAuthenticated;
            const guestLocked = typeof isAuthenticated === 'function' ? !isAuthenticated() : false;

            const btn = doc.getElementById('optimize-btn');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = `<span>&#128274;</span> ${guestLocked ? 'Sign In To Continue' : 'Unlock Ultimate Access'}`;
                btn.setAttribute('onclick', "window.promptProtocolsLogisticsUpgrade && window.promptProtocolsLogisticsUpgrade('protocols_logistics_button')");
            }

            const renderOverlay = typeof adapter.renderProtocolsLogisticsGlassOverlay === 'function'
                ? adapter.renderProtocolsLogisticsGlassOverlay
                : accessUtils.renderProtocolsLogisticsGlassOverlay;
            if (shell && !overlay && typeof renderOverlay === 'function') {
                const overlayHtml = renderOverlay === accessUtils.renderProtocolsLogisticsGlassOverlay
                    ? renderOverlay(logisticsState, adapter)
                    : renderOverlay(logisticsState);
                if (overlayHtml) {
                    shell.insertAdjacentHTML('beforeend', overlayHtml);
                }
            }
        };
    }
})(typeof window !== 'undefined' ? window : null);
