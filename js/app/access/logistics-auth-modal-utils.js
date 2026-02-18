/**
 * ALIDADE Logistics Auth Modal Utilities
 * Extracted from legacy app.js with adapter hooks.
 */
(function bootstrapLogisticsAuthModalUtils(windowObj) {
    if (!windowObj) return;

    const accessUtils = windowObj.ALIDADE_ACCESS_UTILS || (windowObj.ALIDADE_ACCESS_UTILS = {});

    if (typeof accessUtils.ensureProtocolsAuthModal !== 'function') {
        accessUtils.ensureProtocolsAuthModal = function ensureProtocolsAuthModal(adapter = {}) {
            const doc = adapter.document || windowObj.document;
            if (!doc) return null;

            const modalId = String(adapter.modalId || 'protocols-logistics-auth-modal');
            let modal = doc.getElementById(modalId);
            if (modal) return modal;

            modal = doc.createElement('div');
            modal.id = modalId;
            modal.className = 'fixed inset-0 z-[130] hidden opacity-0 transition-opacity duration-200';
            modal.innerHTML = `
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" data-protocols-auth-close="1"></div>
        <div class="absolute inset-0 flex items-center justify-center p-4">
            <div class="w-full max-w-sm bg-void-900 border border-void-700 rounded-sm shadow-2xl relative">
                <div class="p-4 border-b border-void-800">
                    <p class="text-[10px] text-signal-amber font-mono uppercase tracking-widest">Logistics Checkpoint</p>
                    <h3 id="protocols-auth-modal-title" class="text-lg font-heading font-bold text-white mt-1">Authenticate To Continue</h3>
                </div>

                <div class="p-4 space-y-3">
                    <p id="protocols-auth-modal-copy" class="text-xs text-zinc-300 leading-relaxed">
                        Sign in to sync your logistics usage and continue your mission profile.
                    </p>
                    <p id="protocols-auth-modal-tries" class="text-[11px] text-zinc-500 font-mono uppercase tracking-wider"></p>

                    <button id="protocols-auth-google-btn" class="w-full py-2.5 bg-signal-amber text-black font-mono font-bold text-[11px] uppercase tracking-widest rounded-sm hover:bg-amber-400 transition-colors">
                        Continue With Google
                    </button>

                    <div class="pt-2 border-t border-void-800 space-y-2">
                        <input id="protocols-auth-email" name="protocols_auth_email" type="email" placeholder="Email" aria-label="Email" class="w-full bg-void-800 border border-void-700 rounded-sm px-3 py-2 text-sm text-white focus:border-signal-cyan outline-none">
                        <input id="protocols-auth-password" name="protocols_auth_password" type="password" placeholder="Password" aria-label="Password" class="w-full bg-void-800 border border-void-700 rounded-sm px-3 py-2 text-sm text-white focus:border-signal-cyan outline-none">
                        <div class="grid grid-cols-2 gap-2">
                            <button id="protocols-auth-login-btn" class="py-2 bg-void-800 border border-void-700 text-zinc-200 text-[11px] font-mono font-bold uppercase tracking-widest rounded-sm hover:border-signal-cyan/60">
                                Sign In
                            </button>
                            <button id="protocols-auth-signup-btn" class="py-2 bg-void-800 border border-void-700 text-zinc-200 text-[11px] font-mono font-bold uppercase tracking-widest rounded-sm hover:border-signal-cyan/60">
                                Create Account
                            </button>
                        </div>
                    </div>
                    <p id="protocols-auth-modal-status" class="min-h-[16px] text-[11px] text-zinc-500"></p>
                </div>

                <button id="protocols-auth-close-btn" class="absolute top-2 right-2 text-zinc-500 hover:text-white transition-colors p-1" aria-label="Close auth modal">X</button>
            </div>
        </div>
    `;
            if (doc.body) {
                doc.body.appendChild(modal);
            }

            const closeModal = () => {
                modal.classList.add('opacity-0');
                setTimeout(() => modal.classList.add('hidden'), 180);
            };

            const setStatus = (message, tone = 'muted') => {
                const status = doc.getElementById('protocols-auth-modal-status');
                if (!status) return;
                status.textContent = message || '';
                status.className = `min-h-[16px] text-[11px] ${tone === 'error' ? 'text-red-400' : tone === 'success' ? 'text-emerald-400' : 'text-zinc-500'}`;
            };

            modal.querySelectorAll('[data-protocols-auth-close="1"]').forEach((node) => {
                node.addEventListener('click', closeModal);
            });
            const closeBtn = doc.getElementById('protocols-auth-close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', closeModal);
            }

            const withDisabledState = (loading) => {
                ['protocols-auth-google-btn', 'protocols-auth-login-btn', 'protocols-auth-signup-btn'].forEach((id) => {
                    const button = doc.getElementById(id);
                    if (!button) return;
                    button.disabled = loading;
                    button.classList.toggle('opacity-60', loading);
                    button.classList.toggle('cursor-not-allowed', loading);
                });
            };

            const getCredentials = () => {
                const email = String(doc.getElementById('protocols-auth-email')?.value || '').trim();
                const password = String(doc.getElementById('protocols-auth-password')?.value || '');
                return { email, password };
            };

            const resolveLicenseManager = () => adapter.licenseManager || windowObj.licenseManager;

            const googleButton = doc.getElementById('protocols-auth-google-btn');
            if (googleButton) {
                googleButton.addEventListener('click', async () => {
                    const licenseManager = resolveLicenseManager();
                    if (!licenseManager?.signInWithGoogle) return;
                    withDisabledState(true);
                    setStatus('Redirecting to Google...', 'muted');

                    const locationObj = adapter.location || windowObj.location || {};
                    const result = await licenseManager.signInWithGoogle({
                        redirectTo: `${locationObj.origin || ''}${locationObj.pathname || ''}${locationObj.search || ''}${locationObj.hash || ''}`
                    });
                    if (!result?.success) {
                        withDisabledState(false);
                        setStatus(result?.error || 'Google sign-in failed.', 'error');
                    }
                });
            }

            const loginButton = doc.getElementById('protocols-auth-login-btn');
            if (loginButton) {
                loginButton.addEventListener('click', async () => {
                    const { email, password } = getCredentials();
                    if (!email || !password) {
                        setStatus('Email and password are required.', 'error');
                        return;
                    }

                    const licenseManager = resolveLicenseManager();
                    if (!licenseManager?.signInWithPassword) return;

                    withDisabledState(true);
                    setStatus('Signing in...', 'muted');
                    const result = await licenseManager.signInWithPassword(email, password);
                    withDisabledState(false);
                    if (!result?.success) {
                        setStatus(result?.error || 'Sign-in failed.', 'error');
                        return;
                    }
                    setStatus('Signed in successfully.', 'success');
                    closeModal();
                });
            }

            const signupButton = doc.getElementById('protocols-auth-signup-btn');
            if (signupButton) {
                signupButton.addEventListener('click', async () => {
                    const { email, password } = getCredentials();
                    if (!email || !password) {
                        setStatus('Email and password are required.', 'error');
                        return;
                    }
                    if (password.length < 6) {
                        setStatus('Password must be at least 6 characters.', 'error');
                        return;
                    }

                    const licenseManager = resolveLicenseManager();
                    if (!licenseManager?.signUpWithPassword) return;

                    withDisabledState(true);
                    setStatus('Creating account...', 'muted');
                    const result = await licenseManager.signUpWithPassword(email, password);
                    withDisabledState(false);
                    if (!result?.success) {
                        setStatus(result?.error || 'Signup failed.', 'error');
                        return;
                    }
                    if (result.requiresEmailConfirmation) {
                        setStatus('Account created. Check your email to confirm.', 'success');
                        return;
                    }
                    setStatus('Account created and signed in.', 'success');
                    closeModal();
                });
            }

            return modal;
        };
    }

    if (typeof accessUtils.openProtocolsAuthModal !== 'function') {
        accessUtils.openProtocolsAuthModal = function openProtocolsAuthModal(logisticsState = {}, source = 'protocols_logistics_lock', adapter = {}) {
            const doc = adapter.document || windowObj.document;
            if (!doc) return null;

            const ensureModal = typeof adapter.ensureProtocolsAuthModal === 'function'
                ? adapter.ensureProtocolsAuthModal
                : accessUtils.ensureProtocolsAuthModal;
            const modal = ensureModal === accessUtils.ensureProtocolsAuthModal
                ? ensureModal(adapter)
                : ensureModal();
            if (!modal) return null;

            const title = doc.getElementById('protocols-auth-modal-title');
            const copy = doc.getElementById('protocols-auth-modal-copy');
            const tries = doc.getElementById('protocols-auth-modal-tries');
            const status = doc.getElementById('protocols-auth-modal-status');
            const googleBtn = doc.getElementById('protocols-auth-google-btn');

            const isAuthRequired = typeof adapter.isProtocolsLogisticsAuthRequired === 'function'
                ? adapter.isProtocolsLogisticsAuthRequired
                : accessUtils.isProtocolsLogisticsAuthRequired;
            const authRequired = typeof isAuthRequired === 'function' ? isAuthRequired() : false;

            if (title) {
                title.textContent = 'Authenticate To Continue';
            }
            if (copy) {
                if (logisticsState.locked) {
                    copy.textContent = 'Free logistics quota reached. Authenticate to sync your profile and continue to upgrade flow.';
                } else if (authRequired) {
                    copy.textContent = 'Registration is required before your first route optimization. Sign in to unlock your free tries.';
                } else {
                    copy.textContent = 'Authenticate now to sync route optimization usage with your profile.';
                }
            }
            if (tries) {
                const getUsageMeta = typeof adapter.getProtocolsLogisticsUsageMeta === 'function'
                    ? adapter.getProtocolsLogisticsUsageMeta
                    : accessUtils.getProtocolsLogisticsUsageMeta;
                if (typeof getUsageMeta === 'function') {
                    tries.textContent = getUsageMeta === accessUtils.getProtocolsLogisticsUsageMeta
                        ? getUsageMeta(logisticsState, adapter)
                        : getUsageMeta(logisticsState);
                } else {
                    tries.textContent = '';
                }
            }
            if (status) {
                status.textContent = '';
            }
            if (googleBtn) {
                googleBtn.disabled = false;
                googleBtn.textContent = 'Continue With Google';
                googleBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }

            const licenseManager = adapter.licenseManager || windowObj.licenseManager;
            const oauthCheck = licenseManager?.isOAuthProviderEnabled;
            if (googleBtn && typeof oauthCheck === 'function') {
                Promise.resolve(oauthCheck.call(licenseManager, 'google'))
                    .then((enabled) => {
                        if (enabled !== false) return;
                        googleBtn.disabled = true;
                        googleBtn.textContent = 'Google Not Enabled';
                        googleBtn.classList.add('opacity-50', 'cursor-not-allowed');
                        if (status) {
                            status.textContent = 'Google sign-in is disabled in Supabase. Use email/password.';
                            status.className = 'min-h-[16px] text-[11px] text-signal-amber';
                        }
                    })
                    .catch(() => { });
            }

            const trackFunnel = typeof adapter.trackTierFunnelEvent === 'function'
                ? adapter.trackTierFunnelEvent
                : accessUtils.trackTierFunnelEvent;
            if (typeof trackFunnel === 'function') {
                trackFunnel('view_lock', {
                    source,
                    feature: 'LOGISTICS_AUTH'
                });
            }

            modal.classList.remove('hidden');
            const nextFrame = typeof adapter.requestAnimationFrame === 'function'
                ? adapter.requestAnimationFrame
                : windowObj.requestAnimationFrame;
            if (typeof nextFrame === 'function') {
                nextFrame(() => modal.classList.remove('opacity-0'));
            } else {
                setTimeout(() => modal.classList.remove('opacity-0'), 0);
            }

            return modal;
        };
    }
})(typeof window !== 'undefined' ? window : null);
