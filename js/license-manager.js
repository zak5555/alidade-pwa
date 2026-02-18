/**
 * LICENSE MANAGER V2.2
 * - Tier resolution + cache bridge
 * - Feature limits (daily + total)
 * - Supabase-backed logistics usage tracking
 * - Lazy auth helpers (Google + email/password)
 */
export class LicenseManager {
    constructor(supabaseUrl, supabaseKey) {
        this.supabaseUrl = String(supabaseUrl || '').trim();
        this.supabaseAnonKey = String(supabaseKey || '').trim();
        const supabaseFactory = (typeof globalThis !== 'undefined' && globalThis.supabase && typeof globalThis.supabase.createClient === 'function')
            ? globalThis.supabase
            : null;

        if (supabaseFactory && this.supabaseUrl && this.supabaseAnonKey) {
            this.supabase = supabaseFactory.createClient(this.supabaseUrl, this.supabaseAnonKey);
        } else {
            console.error('Supabase client not found or invalid configuration.');
            this.supabase = null;
        }

        this.user = null;
        this.authUser = null;

        this.cacheKey = 'alidade_user_license_v2';
        this.legacyCacheKey = 'alidade_license_cache';
        this.pendingActivationKey = 'alidade_pending_activation_v1';
        this.pendingActivationTtlMs = 24 * 60 * 60 * 1000;
        this.logisticsFeatureName = 'protocols_logistics_optimize';
        this.profileUsage = {
            route_optimizations_count: this._readLocalTotalUsage(this.logisticsFeatureName)
        };
        this.oauthProviderEnabledCache = {};
        this._hydrationPromise = null;
        this._hydrationUserId = null;
        this._lastHydrationAt = 0;
        this._lastAuthChangeKey = null;
        this._lastTierBroadcast = null;
        this._lastTierDisplay = null;
        this._minHydrationIntervalMs = 20000;

        this.tierOrder = ['basic', 'ultimate'];
        this.featureLimits = Object.freeze({
            ai_scanner: {
                basic: { daily_limit: 1 },
                ultimate: { daily_limit: -1 }
            },
            batch_processing: {
                basic: { access: false, max_batch_size: 0 },
                ultimate: { access: true, max_batch_size: -1 }
            },
            advanced_filters: {
                basic: { access: false },
                ultimate: { access: true }
            },
            export: {
                basic: { formats: ['png'] },
                ultimate: { formats: ['png', 'jpg', 'pdf', 'svg', 'raw'] }
            },
            protocols_wallet_execute: {
                basic: { access: false },
                ultimate: { access: true }
            },
            protocols_logistics_optimize: {
                basic: { total_limit: 3 },
                ultimate: { total_limit: -1 }
            }
        });
    }

    async init() {
        console.log('[LICENSE] Initializing manager...');

        if (this.supabase?.auth) {
            this.supabase.auth.onAuthStateChange((_event, session) => {
                Promise.resolve()
                    .then(async () => {
                        if (session?.user) {
                            await this._hydrateAuthenticatedState(session.user);
                        } else {
                            this._resetAuthState();
                        }
                    })
                    .catch((error) => {
                        console.warn('[LICENSE] Auth state change handling degraded:', error);
                    })
                    .finally(() => {
                        this._notifyAuthStateChange();
                    });
            });

            const session = await this._readSessionWithRetry();
            if (session?.user) {
                await this._hydrateAuthenticatedState(session.user);
            } else {
                this._loadFromCache();
            }
            this._notifyAuthStateChange();
            return;
        }

        this._loadFromCache();
    }

    async _hydrateAuthenticatedState(authUser) {
        if (!authUser?.id) return;

        const userId = authUser.id;
        const now = Date.now();
        this.authUser = authUser;

        if (this._hydrationPromise && this._hydrationUserId === userId) {
            return this._hydrationPromise;
        }
        if (this._hydrationUserId === userId && (now - this._lastHydrationAt) < this._minHydrationIntervalMs) {
            return;
        }

        this._hydrationUserId = userId;
        this._hydrationPromise = (async () => {
            let hasFreshProfile = false;
            const currentTier = this.getCurrentTier();
            const shouldForceSync = currentTier !== 'ultimate';

            try {
                const finalizeResult = await this.finalizePendingActivation({ silent: true });
                hasFreshProfile = Boolean(finalizeResult?.success) || hasFreshProfile;
            } catch (error) {
                console.warn('[LICENSE] finalizePendingActivation degraded:', error);
            }

            try {
                const syncResult = await this.syncLicenseByEmail({ silent: true, force: shouldForceSync });
                if (syncResult?.success) {
                    hasFreshProfile = true;
                }
            } catch (error) {
                console.warn('[LICENSE] syncLicenseByEmail degraded:', error);
            }

            if (!hasFreshProfile || !this.user?.license_tier) {
                try {
                    await this.loadUserLicense(authUser.id, authUser);
                } catch (error) {
                    console.warn('[LICENSE] loadUserLicense degraded:', error);
                }
            }
        })().finally(() => {
            this._lastHydrationAt = Date.now();
            this._hydrationPromise = null;
        });

        return this._hydrationPromise;
    }

    _resetAuthState() {
        this.authUser = null;
        this.user = null;
        localStorage.removeItem(this.cacheKey);
        localStorage.removeItem(this.legacyCacheKey);
        this.profileUsage.route_optimizations_count = this._readLocalTotalUsage(this.logisticsFeatureName);
    }

    async _readSessionWithRetry(maxAttempts = 3) {
        if (!this.supabase?.auth?.getSession) return null;

        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
            try {
                const { data, error } = await this.supabase.auth.getSession();
                if (!error) return data?.session || null;

                if (attempt < maxAttempts && this._isRetryableAuthError(error)) {
                    await this._delay(200 * attempt);
                    continue;
                }
                console.warn('[LICENSE] getSession returned error:', error);
                return null;
            } catch (error) {
                if (attempt < maxAttempts && this._isRetryableAuthError(error)) {
                    await this._delay(200 * attempt);
                    continue;
                }
                console.warn('[LICENSE] getSession exception:', error);
                return null;
            }
        }

        return null;
    }

    /**
     * Load user license from Supabase and cache it.
     * Falls back to BASIC if users row does not exist.
     */
    async loadUserLicense(userId, authUser = null) {
        if (!this.supabase || !userId) return;

        try {
            const effectiveAuth = authUser || this.authUser || null;
            this.authUser = effectiveAuth;
            const cachedTier = this._readCachedTier();

            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (error) {
                console.error('[LICENSE] Error fetching users row:', error);
            }

            const metaTier = this._normalizeTier(
                effectiveAuth?.user_metadata?.license_tier
                || effectiveAuth?.user_metadata?.tier
                || null
            );
            let tier = this._normalizeTier(data?.license_tier || metaTier || cachedTier || 'basic');

            // Never downgrade an already-cached ULTIMATE user during transient fetch failures.
            if ((error || !data) && cachedTier === 'ultimate') {
                tier = 'ultimate';
            }

            this.user = {
                ...(data || {}),
                id: userId,
                email: data?.email || effectiveAuth?.email || null,
                license_tier: tier
            };

            this._updateGlobalState(tier);
            this._saveToCache(tier);
            await this._loadProfileUsage(userId);
            console.log(`[LICENSE] User loaded: ${(this.user.email || 'anonymous')} [${tier.toUpperCase()}]`);
        } catch (err) {
            console.error('[LICENSE] Unexpected error loading license:', err);
        }
    }

    /**
     * Verify a license key and return its tier.
     */
    async verifyLicense(licenseKey) {
        if (!licenseKey) return { valid: false, reason: 'Empty key' };

        const key = String(licenseKey).trim().toUpperCase();
        const compactKey = key.replace(/[\s-]/g, '');
        let tierHint = null;

        if (!compactKey || compactKey.length < 8 || !/^[A-Z0-9]+$/.test(compactKey)) {
            return {
                valid: false,
                reason: 'Invalid key format (Use BASIC-/ULTI- prefix or a valid key like XXXX-XXXX-XXXX-XXXX)'
            };
        }

        if (key.startsWith('BASIC-') || key.startsWith('LITE-')) {
            tierHint = 'basic';
        } else if (key.startsWith('ULTI-') || key.startsWith('ULTIMATE-')) {
            tierHint = 'ultimate';
        }

        try {
            const attempts = [
                { p_license_key: key }, // Current RPC signature
                { key_input: key } // Legacy compatibility
            ];
            let data = null;
            let error = null;

            for (const payload of attempts) {
                const result = await this._rpcWithTimeout('verify_license_public', payload, 8000);
                data = result?.data ?? null;
                error = result?.error ?? null;
                if (!error) break;
            }

            if (error) {
                console.warn('[LICENSE] RPC verification failed, fallback to format:', error.message);
                if (tierHint) {
                    return { valid: true, tier: tierHint, expiresAt: null };
                }
                return {
                    valid: false,
                    reason: 'License verification unavailable. Please retry in a moment.'
                };
            }

            if (data && data.valid) {
                return {
                    valid: true,
                    tier: this._normalizeTier(data.tier || tierHint || 'basic'),
                    expiresAt: data.expires_at
                };
            }

            return { valid: false, reason: 'Key invalid or already used' };
        } catch (err) {
            console.error('[LICENSE] Verification exception:', err);
            if (tierHint) {
                return { valid: true, tier: tierHint, expiresAt: null };
            }
            return {
                valid: false,
                reason: 'License verification unavailable. Please retry in a moment.'
            };
        }
    }

    /**
     * Activate license (legacy flow used by existing UI).
     */
    async activateLicense(licenseKey, email) {
        const normalizedKey = String(licenseKey || '').trim().toUpperCase();
        const normalizedEmail = this._normalizeEmail(email);
        console.log(`[LICENSE] Activating key for ${normalizedEmail}`);

        if (this.isAuthenticated() && this.authUser?.id) {
            const authEmail = this._normalizeEmail(this.authUser.email);
            if (!normalizedEmail || !authEmail || authEmail !== normalizedEmail) {
                return {
                    success: false,
                    error: 'Purchase email must match signed-in account email'
                };
            }

            try {
                const { data, error } = await this._rpcWithTimeout('activate_license_for_current_user', {
                    key_input: normalizedKey,
                    purchase_email_input: normalizedEmail
                }, 10000);

                if (error) {
                    return { success: false, error: error.message };
                }
                if (!data?.success) {
                    return { success: false, error: data?.error || 'Activation failed' };
                }

                this._clearPendingActivation();
                await this.loadUserLicense(this.authUser.id, this.authUser);
                this._applyTierFallbackFromRpc(data?.tier, this.authUser.email);
                return {
                    success: true,
                    tier: this.getCurrentTier(),
                    requiresMagicLink: false
                };
            } catch (err) {
                return { success: false, error: err.message };
            }
        }

        const verification = await this.verifyLicense(normalizedKey);
        const verificationReason = String(verification?.reason || '');
        const verificationUnavailable = !verification?.valid
            && verificationReason.toLowerCase().includes('verification unavailable');

        if (!verification?.valid && !verificationUnavailable) {
            return { success: false, error: verificationReason || 'Activation failed' };
        }

        const tier = verification?.valid
            ? verification.tier
            : this._inferTierFromKey(normalizedKey);

        this._setPendingActivation({
            licenseKey: normalizedKey,
            email: normalizedEmail,
            createdAt: Date.now()
        });

        try {
            const timeoutMs = 15000;
            const otpPromise = this.supabase.auth.signInWithOtp({
                email: normalizedEmail,
                options: {
                    emailRedirectTo: window.location.origin + '/index.html',
                    data: {
                        license_key: normalizedKey,
                        license_tier: tier,
                        tier
                    }
                }
            });
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error('Activation request timed out. Please retry.'));
                }, timeoutMs);
            });
            const { error } = await Promise.race([otpPromise, timeoutPromise]);

            if (error) {
                this._clearPendingActivation();
                return { success: false, error: error.message };
            }

            return { success: true, requiresMagicLink: true };
        } catch (err) {
            this._clearPendingActivation();
            return { success: false, error: err.message };
        }
    }

    getCurrentTier() {
        if (this.user?.license_tier) return this._normalizeTier(this.user.license_tier);
        const cachedTier = this._readCachedTier();
        if (cachedTier) return cachedTier;
        return 'basic';
    }

    upgradeTier(_fromTier, toTier) {
        const userEmail = this.user?.email || '';
        const links = {
            ultimate: 'https://alidade.gumroad.com/l/srdcyy'
        };
        const targetUrl = links[this._normalizeTier(toTier)];
        if (!targetUrl) return;

        let finalUrl = targetUrl;
        if (userEmail) finalUrl += `?email=${encodeURIComponent(userEmail)}`;

        console.log(`[LICENSE] Redirecting to upgrade: ${toTier}`);
        window.open(finalUrl, '_blank');
    }

    /**
     * Compatibility API used by app.js.
     */
    canUseFeature(featureName) {
        const normalizedFeature = String(featureName || '').trim();
        const tier = this.getCurrentTier();
        const feature = this.featureLimits[normalizedFeature];

        if (!feature) {
            return {
                allowed: true,
                reason: 'Unrestricted',
                tier,
                current_usage: 0,
                limit: -1
            };
        }

        const config = feature[tier] || feature.basic || {};
        const hasTotalLimit = Object.prototype.hasOwnProperty.call(config, 'total_limit');
        const dailyLimit = Number.isFinite(config.daily_limit) ? config.daily_limit : (config.daily_limit ?? -1);
        const totalLimit = Number.isFinite(config.total_limit) ? config.total_limit : (config.total_limit ?? -1);
        const limit = hasTotalLimit ? totalLimit : dailyLimit;
        const currentUsage = this._getFeatureUsage(normalizedFeature, hasTotalLimit);
        const maxBatchSize = Number.isFinite(config.max_batch_size) ? config.max_batch_size : (config.max_batch_size ?? -1);

        if (config.access === false) {
            return {
                allowed: false,
                reason: 'Upgrade required',
                tier,
                current_usage: currentUsage,
                limit,
                limit_scope: hasTotalLimit ? 'total' : 'daily',
                upgrade_to: 'ultimate'
            };
        }

        if (normalizedFeature === 'batch_processing' && maxBatchSize === 0) {
            return {
                allowed: false,
                reason: 'Upgrade required',
                tier,
                current_usage: currentUsage,
                limit,
                limit_scope: hasTotalLimit ? 'total' : 'daily',
                max_batch_size: maxBatchSize,
                upgrade_to: 'ultimate'
            };
        }

        if (hasTotalLimit && totalLimit !== -1 && currentUsage >= totalLimit) {
            return {
                allowed: false,
                reason: 'Limit reached',
                tier,
                current_usage: currentUsage,
                limit,
                limit_scope: 'total',
                upgrade_to: 'ultimate'
            };
        }

        if (!hasTotalLimit && dailyLimit !== -1 && currentUsage >= dailyLimit) {
            return {
                allowed: false,
                reason: 'Daily limit reached',
                tier,
                current_usage: currentUsage,
                limit,
                limit_scope: 'daily',
                upgrade_to: 'ultimate'
            };
        }

        return {
            allowed: true,
            reason: 'Allowed',
            tier,
            current_usage: currentUsage,
            limit,
            limit_scope: hasTotalLimit ? 'total' : 'daily',
            max_batch_size: maxBatchSize
        };
    }

    incrementFeatureUsage(featureName) {
        const normalizedFeature = String(featureName || '').trim();
        if (!normalizedFeature) {
            return { count: 0, limit: -1, remaining: -1 };
        }

        const tier = this.getCurrentTier();
        const feature = this.featureLimits[normalizedFeature];
        const config = feature ? (feature[tier] || feature.basic || {}) : {};
        const hasTotalLimit = Object.prototype.hasOwnProperty.call(config, 'total_limit');

        const next = (hasTotalLimit && normalizedFeature === this.logisticsFeatureName)
            ? this._incrementLogisticsUsage()
            : (() => {
                const current = hasTotalLimit
                    ? this._getTotalUsage(normalizedFeature)
                    : this._getDailyUsage(normalizedFeature);
                const value = current + 1;
                const key = hasTotalLimit
                    ? this._getTotalUsageStorageKey(normalizedFeature)
                    : this._getUsageStorageKey(normalizedFeature);
                localStorage.setItem(key, String(value));
                return value;
            })();

        const status = this.canUseFeature(normalizedFeature);
        const limit = Number.isFinite(status.limit) ? status.limit : -1;
        return {
            count: next,
            limit,
            remaining: limit === -1 ? -1 : Math.max(0, limit - next),
            scope: hasTotalLimit ? 'total' : 'daily'
        };
    }

    getTierSummary() {
        const tier = this.getCurrentTier();
        return {
            tier,
            label: tier.toUpperCase(),
            isUltimate: tier === 'ultimate',
            isBasic: tier === 'basic'
        };
    }

    showUpgradeModal(targetTier = 'ultimate', featureName = '') {
        if (typeof window.openUpgradeModal === 'function') {
            window.openUpgradeModal(String(targetTier || 'ultimate'), String(featureName || ''));
            return;
        }
        this.upgradeTier(this.getCurrentTier(), targetTier);
    }

    isAuthenticated() {
        return Boolean(this.authUser?.id);
    }

    getAuthUser() {
        return this.authUser || null;
    }

    hasPendingActivation() {
        return Boolean(this._getPendingActivation());
    }

    async signInWithGoogle(options = {}) {
        if (!this.supabase?.auth) {
            return { success: false, error: 'Supabase auth unavailable' };
        }

        const googleEnabled = await this.isOAuthProviderEnabled('google');
        if (googleEnabled === false) {
            return {
                success: false,
                error: 'Google sign-in is not enabled in Supabase Auth providers. Use email/password for now.'
            };
        }

        const redirectTo = options.redirectTo || `${window.location.origin}${window.location.pathname}${window.location.search}${window.location.hash}`;
        const { data, error } = await this.supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo,
                queryParams: {
                    prompt: 'select_account'
                }
            }
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data };
    }

    async isOAuthProviderEnabled(provider = 'google') {
        const providerKey = String(provider || '').trim().toLowerCase();
        if (!providerKey) return null;

        if (Object.prototype.hasOwnProperty.call(this.oauthProviderEnabledCache, providerKey)) {
            return this.oauthProviderEnabledCache[providerKey];
        }

        if (!this.supabaseUrl || !this.supabaseAnonKey || typeof fetch !== 'function') {
            return null;
        }

        const settingsUrl = `${this.supabaseUrl.replace(/\/$/, '')}/auth/v1/settings`;
        try {
            const response = await fetch(settingsUrl, {
                headers: {
                    apikey: this.supabaseAnonKey,
                    Authorization: `Bearer ${this.supabaseAnonKey}`
                }
            });
            if (!response.ok) {
                this.oauthProviderEnabledCache[providerKey] = null;
                return null;
            }

            const settings = await response.json();
            const externalConfig = settings?.external?.[providerKey];
            let enabled = null;

            if (typeof externalConfig === 'boolean') {
                enabled = externalConfig;
            } else if (externalConfig && typeof externalConfig === 'object') {
                if (typeof externalConfig.enabled === 'boolean') {
                    enabled = externalConfig.enabled;
                } else if (typeof externalConfig.client_id === 'string') {
                    enabled = externalConfig.client_id.trim().length > 0;
                } else {
                    enabled = null;
                }
            }

            this.oauthProviderEnabledCache[providerKey] = enabled;
            return enabled;
        } catch (_error) {
            this.oauthProviderEnabledCache[providerKey] = null;
            return null;
        }
    }

    async signInWithPassword(email, password) {
        if (!this.supabase?.auth) {
            return { success: false, error: 'Supabase auth unavailable' };
        }

        const { data, error } = await this.supabase.auth.signInWithPassword({
            email: String(email || '').trim(),
            password: String(password || '')
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data };
    }

    async signUpWithPassword(email, password) {
        if (!this.supabase?.auth) {
            return { success: false, error: 'Supabase auth unavailable' };
        }

        const { data, error } = await this.supabase.auth.signUp({
            email: String(email || '').trim(),
            password: String(password || ''),
            options: {
                emailRedirectTo: `${window.location.origin}${window.location.pathname}`
            }
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return {
            success: true,
            data,
            requiresEmailConfirmation: Boolean(data?.user && !data?.session)
        };
    }

    async finalizePendingActivation(options = {}) {
        const { silent = false } = options || {};
        const pending = this._getPendingActivation();
        if (!pending) return { success: false, skipped: true, reason: 'no_pending_activation' };
        if (!this.isAuthenticated() || !this.authUser?.id) {
            return { success: false, skipped: true, reason: 'not_authenticated' };
        }

        const authEmail = this._normalizeEmail(this.authUser.email);
        const pendingEmail = this._normalizeEmail(pending.email);
        if (!authEmail || !pendingEmail || authEmail !== pendingEmail) {
            if (!silent) {
                console.warn('[LICENSE] Pending activation email mismatch:', { authEmail, pendingEmail });
            }
            return { success: false, skipped: true, reason: 'email_mismatch' };
        }

        try {
            const { data, error } = await this._rpcWithTimeout('activate_license_for_current_user', {
                key_input: pending.licenseKey,
                purchase_email_input: pendingEmail
            }, 10000);

            if (error) {
                if (!silent) console.error('[LICENSE] Activation finalize RPC failed:', error);
                return { success: false, error: error.message };
            }

            if (!data?.success) {
                if (!silent) console.warn('[LICENSE] Activation finalize rejected:', data);
                return { success: false, error: data?.error || 'Activation finalize failed' };
            }

            this._clearPendingActivation();
            await this.loadUserLicense(this.authUser.id, this.authUser);
            this._applyTierFallbackFromRpc(data?.tier, this.authUser.email);
            return {
                success: true,
                tier: this.getCurrentTier()
            };
        } catch (err) {
            if (!silent) console.error('[LICENSE] Activation finalize exception:', err);
            return { success: false, error: err.message };
        }
    }

    async syncLicenseByEmail(options = {}) {
        const { silent = false, force = false } = options || {};

        if (!this.supabase?.auth) {
            return { success: false, skipped: true, reason: 'auth_unavailable' };
        }
        if (!this.isAuthenticated() || !this.authUser?.id) {
            return { success: false, skipped: true, reason: 'not_authenticated' };
        }
        if (!force && this.getCurrentTier() === 'ultimate') {
            return { success: true, skipped: true, tier: 'ultimate', reason: 'already_ultimate' };
        }

        try {
            const { data, error } = await this._rpcWithTimeout('sync_license_for_current_user_by_email', {}, 10000);

            if (error) {
                if (!silent) console.error('[LICENSE] Email sync RPC failed:', error);
                return { success: false, error: error.message };
            }

            if (!data?.success) {
                if (!silent) console.warn('[LICENSE] Email sync rejected:', data);
                return { success: false, error: data?.error || 'Email sync failed' };
            }

            await this.loadUserLicense(this.authUser.id, this.authUser);
            this._applyTierFallbackFromRpc(data?.tier, this.authUser.email);
            return {
                success: true,
                tier: this.getCurrentTier(),
                sourceFound: Boolean(data?.source_found)
            };
        } catch (err) {
            if (!silent) console.error('[LICENSE] Email sync exception:', err);
            return { success: false, error: err.message };
        }
    }

    async refreshLogisticsUsage() {
        if (!this.isAuthenticated() || !this.authUser?.id) {
            return this._getTotalUsage(this.logisticsFeatureName);
        }
        return this._loadProfileUsage(this.authUser.id);
    }

    // --- INTERNAL HELPERS ---

    _updateGlobalState(tier) {
        const normalized = this._normalizeTier(tier).toUpperCase();
        const previousTier = String(window.USER_TIER || '').toUpperCase();
        window.USER_TIER = normalized;
        window.currentUserPlan = normalized;
        const shouldBroadcast = this._lastTierBroadcast !== normalized || previousTier !== normalized;
        if (shouldBroadcast) {
            this._lastTierBroadcast = normalized;
            window.dispatchEvent(new CustomEvent('alidade:tier-change', {
                detail: { tier: normalized }
            }));
        }
        const shouldUpdateTierDisplay = this._lastTierDisplay !== normalized;
        if (shouldUpdateTierDisplay && typeof window.updateTierDisplay === 'function') {
            this._lastTierDisplay = normalized;
            window.updateTierDisplay();
        }
    }

    _applyTierFallbackFromRpc(rpcTier, email = null) {
        const targetTier = this._normalizeTier(rpcTier);
        if (targetTier !== 'ultimate') return;

        const currentTier = this._normalizeTier(this.user?.license_tier || this._readCachedTier() || 'basic');
        if (currentTier === 'ultimate') return;

        this.user = {
            ...(this.user || {}),
            id: this.authUser?.id || this.user?.id || null,
            email: email || this.authUser?.email || this.user?.email || null,
            license_tier: 'ultimate'
        };
        this._updateGlobalState('ultimate');
        this._saveToCache('ultimate');
    }

    async _rpcWithTimeout(functionName, params = {}, timeoutMs = 10000) {
        if (!this.supabase || typeof this.supabase.rpc !== 'function') {
            return { data: null, error: { message: 'Supabase RPC unavailable' } };
        }

        let timeoutHandle = null;
        try {
            const rpcPromise = this.supabase.rpc(functionName, params);
            const timeoutPromise = new Promise((resolve) => {
                timeoutHandle = setTimeout(() => {
                    resolve({
                        data: null,
                        error: { message: `RPC ${functionName} timed out. Please retry.` }
                    });
                }, timeoutMs);
            });

            return await Promise.race([rpcPromise, timeoutPromise]);
        } catch (error) {
            return { data: null, error: { message: error?.message || String(error) } };
        } finally {
            if (timeoutHandle) clearTimeout(timeoutHandle);
        }
    }

    _saveToCache(tier) {
        const normalized = this._normalizeTier(tier);
        const timestamp = Date.now();
        localStorage.setItem(this.cacheKey, JSON.stringify({
            tier: normalized,
            timestamp
        }));
        localStorage.setItem(this.legacyCacheKey, JSON.stringify({
            license_tier: normalized,
            tier: normalized,
            timestamp
        }));
    }

    _loadFromCache() {
        const cachedTier = this._readCachedTier();
        if (cachedTier) this._updateGlobalState(cachedTier);
    }

    _readCachedTier() {
        const keys = [this.cacheKey, this.legacyCacheKey];
        for (const key of keys) {
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            try {
                const data = JSON.parse(raw);
                const tier = this._normalizeTier(data?.license_tier || data?.tier);
                if (tier) return tier;
            } catch (e) {
                console.warn('[LICENSE] Failed to parse cache key:', key, e);
            }
        }
        return null;
    }

    _getUsageStorageKey(featureName) {
        const today = new Date().toISOString().split('T')[0];
        return `usage_${featureName}_${today}`;
    }

    _getDailyUsage(featureName) {
        const key = this._getUsageStorageKey(featureName);
        const raw = localStorage.getItem(key);
        return parseInt(raw || '0', 10) || 0;
    }

    _getTotalUsageStorageKey(featureName) {
        return `usage_total_${featureName}`;
    }

    _readLocalTotalUsage(featureName) {
        const key = this._getTotalUsageStorageKey(featureName);
        const raw = localStorage.getItem(key);
        return parseInt(raw || '0', 10) || 0;
    }

    _writeLocalTotalUsage(featureName, value) {
        const key = this._getTotalUsageStorageKey(featureName);
        localStorage.setItem(key, String(Math.max(0, Number(value) || 0)));
    }

    _getTotalUsage(featureName) {
        if (featureName === this.logisticsFeatureName) {
            const tracked = Number(this.profileUsage?.route_optimizations_count);
            if (Number.isFinite(tracked) && tracked >= 0) return tracked;
        }
        return this._readLocalTotalUsage(featureName);
    }

    _getFeatureUsage(featureName, hasTotalLimit) {
        return hasTotalLimit
            ? this._getTotalUsage(featureName)
            : this._getDailyUsage(featureName);
    }

    _incrementLogisticsUsage() {
        const current = this._getTotalUsage(this.logisticsFeatureName);
        const next = current + 1;
        this.profileUsage.route_optimizations_count = next;
        this._writeLocalTotalUsage(this.logisticsFeatureName, next);

        if (this.isAuthenticated()) {
            this._persistRouteOptimizationCount(next).catch((error) => {
                console.warn('[LICENSE] Failed to persist route optimization usage:', error);
            });
        }

        return next;
    }

    async _loadProfileUsage(userId) {
        if (!this.supabase || !userId) {
            return this._getTotalUsage(this.logisticsFeatureName);
        }

        const localCount = this._readLocalTotalUsage(this.logisticsFeatureName);
        try {
            const { data, error } = await this.supabase
                .from('profiles')
                .select('id, route_optimizations_count')
                .eq('id', userId)
                .maybeSingle();

            if (error) {
                throw error;
            }

            const remoteCount = Number(data?.route_optimizations_count || 0);
            const merged = Math.max(localCount, remoteCount);
            this.profileUsage.route_optimizations_count = merged;
            this._writeLocalTotalUsage(this.logisticsFeatureName, merged);

            if (!data || remoteCount !== merged) {
                await this._persistRouteOptimizationCount(merged);
            }

            return merged;
        } catch (error) {
            console.warn('[LICENSE] Failed to load profile usage:', error);
            this.profileUsage.route_optimizations_count = localCount;
            return localCount;
        }
    }

    async _persistRouteOptimizationCount(count) {
        const userId = this.authUser?.id || this.user?.id || null;
        if (!this.supabase || !userId) return;

        const safeCount = Math.max(0, Number(count) || 0);
        const payload = {
            id: userId,
            route_optimizations_count: safeCount,
            updated_at: new Date().toISOString()
        };

        const { error } = await this.supabase
            .from('profiles')
            .upsert(payload, { onConflict: 'id' });

        if (error) throw error;
    }

    _notifyAuthStateChange(force = false) {
        if (typeof window === 'undefined') return;
        const detail = {
            isAuthenticated: this.isAuthenticated(),
            userId: this.authUser?.id || null,
            email: this.authUser?.email || null
        };
        const nextKey = `${detail.isAuthenticated ? 1 : 0}:${detail.userId || ''}:${detail.email || ''}`;
        if (!force && this._lastAuthChangeKey === nextKey) {
            return;
        }
        this._lastAuthChangeKey = nextKey;
        window.dispatchEvent(new CustomEvent('alidade:auth-change', { detail }));
    }

    _isRetryableAuthError(error) {
        const message = String(error?.message || error || '').toLowerCase();
        return (
            message.includes('abort') ||
            message.includes('timed out') ||
            message.includes('timeout') ||
            message.includes('failed to fetch') ||
            message.includes('network')
        );
    }

    _delay(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, Math.max(0, Number(ms) || 0));
        });
    }

    _normalizeTier(rawTier) {
        const tier = String(rawTier || '').trim().toLowerCase();
        if (tier === 'ultimate') return 'ultimate';
        if (tier === 'basic' || tier === 'free' || tier === 'lite' || tier === 'demo') return 'basic';
        return 'basic';
    }

    _normalizeEmail(email) {
        return String(email || '').trim().toLowerCase();
    }

    _inferTierFromKey(licenseKey) {
        const key = String(licenseKey || '').trim().toUpperCase();
        if (key.startsWith('ULTI-') || key.startsWith('ULTIMATE-')) return 'ultimate';
        return 'basic';
    }

    _setPendingActivation(payload) {
        if (!payload || typeof payload !== 'object') return;
        const normalized = {
            licenseKey: String(payload.licenseKey || '').trim().toUpperCase(),
            email: this._normalizeEmail(payload.email),
            createdAt: Number(payload.createdAt || Date.now())
        };
        if (!normalized.licenseKey || !normalized.email) return;
        localStorage.setItem(this.pendingActivationKey, JSON.stringify(normalized));
    }

    _clearPendingActivation() {
        localStorage.removeItem(this.pendingActivationKey);
    }

    _getPendingActivation() {
        try {
            const raw = localStorage.getItem(this.pendingActivationKey);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            const createdAt = Number(parsed?.createdAt || 0);
            if (!Number.isFinite(createdAt) || (Date.now() - createdAt) > this.pendingActivationTtlMs) {
                this._clearPendingActivation();
                return null;
            }

            const licenseKey = String(parsed?.licenseKey || '').trim().toUpperCase();
            const email = this._normalizeEmail(parsed?.email);
            if (!licenseKey || !email) {
                this._clearPendingActivation();
                return null;
            }
            return { licenseKey, email, createdAt };
        } catch (_error) {
            this._clearPendingActivation();
            return null;
        }
    }

    isUltimate() { return this.getCurrentTier() === 'ultimate'; }
    isBasic() { return this.getCurrentTier() === 'basic'; }
}

if (typeof window !== 'undefined') {
    window.LicenseManager = LicenseManager;
}
