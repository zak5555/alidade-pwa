/**
 * ALIDADE Access Token Utilities
 * Extracted from legacy app.js with strict behavior parity.
 */
(function bootstrapAccessTokenUtils(windowObj) {
    if (!windowObj) return;

    const accessUtils = windowObj.ALIDADE_ACCESS_UTILS || (windowObj.ALIDADE_ACCESS_UTILS = {});
    const commonUtils = windowObj.ALIDADE_UTILS || null;
    const debugLog = (...args) => {
        if (windowObj.__ALIDADE_DEBUG_LOGS__ === true) {
            console.log(...args);
        }
    };

    if (typeof accessUtils.decodeJWT !== 'function') {
        accessUtils.decodeJWT = function decodeJWT(token) {
            try {
                const parts = token.split('.');
                if (parts.length !== 3) return null;

                const payload = JSON.parse(atob(parts[1]));
                return payload;
            } catch (e) {
                console.warn('[ACCESS] Token decode failed:', e);
                return null;
            }
        };
    }

    if (typeof accessUtils.validateAccessToken !== 'function') {
        accessUtils.validateAccessToken = function validateAccessToken(token) {
            if (token === 'ultimate_10_key') return 'ULTIMATE';
            if (token === 'lite_5_key') return 'BASIC';

            const payload = accessUtils.decodeJWT(token);
            if (!payload) return 'BASIC';
            if (!payload.tier) return 'BASIC';

            if (payload.exp && Date.now() > payload.exp * 1000) {
                console.warn('[ACCESS] Token expired');
                return 'BASIC';
            }

            if (typeof commonUtils?.normalizeTierTag === 'function') {
                return commonUtils.normalizeTierTag(payload.tier);
            }

            const tier = String(payload.tier || '').trim().toUpperCase();
            if (tier === 'ULTIMATE') return 'ULTIMATE';
            if (tier === 'BASIC' || tier === 'FREE' || tier === 'DEMO' || tier === 'LITE') return 'BASIC';
            return 'BASIC';
        };
    }

    if (typeof accessUtils.resolveUserTier !== 'function') {
        accessUtils.resolveUserTier = function resolveUserTier() {
            const STORAGE_KEY = 'alidade_access_token';
            const normalizeTier = typeof commonUtils?.normalizeTierTag === 'function'
                ? commonUtils.normalizeTierTag
                : (value) => {
                    const tier = String(value || '').trim().toUpperCase();
                    if (tier === 'ULTIMATE') return 'ULTIMATE';
                    if (tier === 'BASIC' || tier === 'FREE' || tier === 'DEMO' || tier === 'LITE') return 'BASIC';
                    return 'BASIC';
                };

            if (windowObj.licenseManager?.user?.license_tier) {
                const dbTier = normalizeTier(windowObj.licenseManager.user.license_tier);
                if (dbTier === 'ULTIMATE' || dbTier === 'BASIC') {
                    debugLog(`[ACCESS] Tier from LicenseManager (live): ${dbTier}`);
                    return dbTier;
                }
            }

            try {
                const cachedLicense = localStorage.getItem('alidade_license_cache');
                if (cachedLicense) {
                    const parsed = JSON.parse(cachedLicense);
                    if (parsed?.license_tier) {
                        const cachedTier = normalizeTier(parsed.license_tier);
                        if (cachedTier === 'ULTIMATE' || cachedTier === 'BASIC') {
                            debugLog(`[ACCESS] Tier from LicenseManager cache: ${cachedTier}`);
                            return cachedTier;
                        }
                    }
                }
            } catch (e) {
                console.warn('[ACCESS] Cache parse error:', e);
            }

            const urlParams = new URLSearchParams(window.location.search);
            const urlToken = urlParams.get('token');
            if (urlToken) {
                const tier = accessUtils.validateAccessToken(urlToken);
                if (tier !== 'BASIC') {
                    localStorage.setItem(STORAGE_KEY, urlToken);
                    debugLog(`[ACCESS] Activated via URL token: ${tier}`);
                    const newUrl = window.location.origin + window.location.pathname;
                    window.history.replaceState({}, document.title, newUrl);
                    return tier;
                }
                console.warn('[ACCESS] ❌ Invalid or expired activation token');
            }

            const storedToken = localStorage.getItem(STORAGE_KEY);
            if (storedToken) {
                const tier = accessUtils.validateAccessToken(storedToken);
                if (tier !== 'BASIC') return tier;
                localStorage.removeItem(STORAGE_KEY);
            }

            debugLog('[ACCESS] No valid tier source found, falling back to BASIC');
            return 'BASIC';
        };
    }
})(typeof window !== 'undefined' ? window : null);
