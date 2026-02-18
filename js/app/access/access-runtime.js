// Extracted from app.js (Batch 203): Access/runtime gate stack
// Preserves legacy globals, listeners, and behavior parity.

// --- CRYPTOGRAPHIC ACCESS SYSTEM (Protocol-7) ---

function accessRuntimeDebugLog(...args) {
    if (window.__ALIDADE_DEBUG_LOGS__ === true) {
        console.log(...args);
    }
}

// Lightweight JWT decoder (no dependencies)
function decodeJWT(token) {
    const extracted = window.ALIDADE_ACCESS_UTILS?.decodeJWT;
    if (typeof extracted === 'function') {
        return extracted(token);
    }
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        // atob() decodes base64
        const payload = JSON.parse(atob(parts[1]));
        return payload;
    } catch (e) {
        console.warn('[ACCESS] Token decode failed:', e);
        return null;
    }
}

function normalizeTierTag(rawTier, fallback = 'BASIC') {
    const extracted = window.ALIDADE_UTILS?.normalizeTierTag;
    if (typeof extracted === 'function') {
        return extracted(rawTier, fallback);
    }
    const tier = String(rawTier || '').trim().toUpperCase();
    if (tier === 'ULTIMATE') return 'ULTIMATE';
    if (tier === 'BASIC' || tier === 'FREE' || tier === 'DEMO' || tier === 'LITE') return 'BASIC';
    return fallback;
}

function validateAccessToken(token) {
    const extracted = window.ALIDADE_ACCESS_UTILS?.validateAccessToken;
    if (typeof extracted === 'function') {
        return extracted(token);
    }
    // FIX: Support raw magic keys (for ?access= links)
    if (token === 'ultimate_10_key') return 'ULTIMATE';
    if (token === 'lite_5_key') return 'BASIC';

    const payload = decodeJWT(token);

    if (!payload) return 'BASIC';
    if (!payload.tier) return 'BASIC';

    // Check expiry if present
    if (payload.exp && Date.now() > payload.exp * 1000) {
        console.warn('[ACCESS] Token expired');
        return 'BASIC';
    }

    return normalizeTierTag(payload.tier);
}

/**
 * TIER RESOLUTION ENGINE (v2 — Supabase-aware)
 * Priority order:
 *   1. LicenseManager (Supabase DB truth) — if already initialized
 *   2. LicenseManager localStorage cache — fast offline
 *   3. URL magic link token (?token=)
 *   4. Legacy access token in localStorage
 *   5. Fallback to BASIC
 */
function resolveUserTier() {
    const extracted = window.ALIDADE_ACCESS_UTILS?.resolveUserTier;
    if (typeof extracted === 'function') {
        return extracted();
    }
    const STORAGE_KEY = 'alidade_access_token';

    // -- SOURCE 1: LicenseManager (Supabase DB truth) --------------
    // The LicenseManager may have loaded the user from Supabase by now.
    // Due to module defer, this often runs BEFORE LicenseManager finishes.
    // So we also check the cache it writes to localStorage.
    if (window.licenseManager?.user?.license_tier) {
        const dbTier = normalizeTierTag(window.licenseManager.user.license_tier);
        if (dbTier === 'ULTIMATE' || dbTier === 'BASIC') {
            accessRuntimeDebugLog(`[ACCESS] Tier from LicenseManager (live): ${dbTier}`);
            return dbTier;
        }
    }

    // -- SOURCE 2: LicenseManager localStorage cache ---------------
    // This survives page reloads and is written by LicenseManager.fetchLatestData()
    try {
        const cachedLicense = localStorage.getItem('alidade_license_cache');
        if (cachedLicense) {
            const parsed = JSON.parse(cachedLicense);
            if (parsed?.license_tier) {
                const cachedTier = normalizeTierTag(parsed.license_tier);
                if (cachedTier === 'ULTIMATE' || cachedTier === 'BASIC') {
                    accessRuntimeDebugLog(`[ACCESS] Tier from LicenseManager cache: ${cachedTier}`);
                    return cachedTier;
                }
            }
        }
    } catch (e) {
        console.warn('[ACCESS] Cache parse error:', e);
    }

    // -- SOURCE 3: URL magic link token ----------------------------
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');

    if (urlToken) {
        const tier = validateAccessToken(urlToken);
        if (tier !== 'BASIC') {
            localStorage.setItem(STORAGE_KEY, urlToken);
            accessRuntimeDebugLog(`[ACCESS] Activated via URL token: ${tier}`);
            const newUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
            return tier;
        } else {
            console.warn('[ACCESS] ? Invalid or expired activation token');
        }
    }

    // -- SOURCE 4: Legacy stored token -----------------------------
    const storedToken = localStorage.getItem(STORAGE_KEY);
    if (storedToken) {
        const tier = validateAccessToken(storedToken);
        if (tier !== 'BASIC') return tier;
        localStorage.removeItem(STORAGE_KEY);
    }

    // -- SOURCE 5: Fallback ----------------------------------------
    accessRuntimeDebugLog('[ACCESS] No valid tier source found, falling back to BASIC');
    return 'BASIC';
}

/**
 * TIER BRIDGE: Sync LicenseManager ? Legacy Global Variables
 * Called on page load, auth state changes, and online events.
 * This BRIDGES the Supabase-aware LicenseManager into the legacy
 * USER_TIER / currentUserPlan / currentTier globals used by the UI.
 */
function syncTierFromLicenseManager() {
    const extracted = window.ALIDADE_ACCESS_UTILS?.syncTierFromLicenseManager;
    if (typeof extracted === 'function') {
        return extracted({
            getLicenseManager: () => window.licenseManager,
            getUserTier: () => USER_TIER,
            setTierState: (tier) => {
                USER_TIER = tier;
                currentUserPlan = tier;
                Reflect.set(window, 'USER_TIER', tier);
            },
            getTierData: () => {
                try {
                    return TIER_DATA;
                } catch (_error) {
                    return null;
                }
            },
            setCurrentTierConfig: (tierConfig) => {
                currentTier = tierConfig;
            },
            onTierSynced: () => {
                if (typeof updateUIForPlan === 'function') {
                    updateUIForPlan();
                }
            }
        });
    }

    const lm = window.licenseManager;
    const managerTier = typeof lm?.getCurrentTier === 'function'
        ? normalizeTierTag(lm.getCurrentTier())
        : normalizeTierTag(lm?.user?.license_tier || USER_TIER || 'BASIC');

    if (!lm?.user?.license_tier) {
        if (managerTier === 'ULTIMATE' && USER_TIER !== 'ULTIMATE') {
            const oldTier = USER_TIER;
            USER_TIER = 'ULTIMATE';
            currentUserPlan = 'ULTIMATE';
            window.USER_TIER = 'ULTIMATE';
            if (typeof TIER_DATA !== 'undefined') {
                currentTier = TIER_DATA.ULTIMATE || TIER_DATA.BASIC;
            }
            accessRuntimeDebugLog(`[TIER_BRIDGE] ${oldTier} -> ULTIMATE (from manager cache)`);
            if (typeof updateUIForPlan === 'function') {
                updateUIForPlan();
            }
            return;
        }
        accessRuntimeDebugLog('[TIER_BRIDGE] No license data available yet');
        return;
    }

    let dbTier = normalizeTierTag(lm.user.license_tier);
    if (dbTier !== 'ULTIMATE' && managerTier === 'ULTIMATE') {
        dbTier = 'ULTIMATE';
    }
    const validTiers = ['ULTIMATE', 'BASIC'];

    if (!validTiers.includes(dbTier)) {
        console.warn(`[TIER_BRIDGE] Unknown tier: "${dbTier}", keeping current: ${USER_TIER}`);
        return;
    }

    if (USER_TIER === dbTier) return; // Already synced

    const oldTier = USER_TIER;
    USER_TIER = dbTier;
    currentUserPlan = dbTier;
    window.USER_TIER = dbTier;

    // Update the TIER_DATA config object used by the UI
    if (typeof TIER_DATA !== 'undefined') {
        currentTier = TIER_DATA[dbTier] || TIER_DATA.BASIC;
    }

    accessRuntimeDebugLog(`[TIER_BRIDGE] ${oldTier} -> ${dbTier} (from Supabase)`);

    // Refresh UI
    if (typeof updateUIForPlan === 'function') {
        updateUIForPlan();
    }
}

/**
 * Called by StateManager.updateTier() and auth callbacks
 * to refresh the global tier and re-render the UI.
 */
function updateUIByTier() {
    const extracted = window.ALIDADE_ACCESS_UTILS?.updateUIByTier;
    if (typeof extracted === 'function') {
        return extracted({
            syncTierFromLicenseManager: () => syncTierFromLicenseManager()
        });
    }
    syncTierFromLicenseManager();
}
window.updateUIByTier = updateUIByTier;
window.syncTierFromLicenseManager = syncTierFromLicenseManager;

/**
 * ADMIN HELPER: Token Generator
 * Use in console to create license strings for customers
 */
window.generateAccessToken = function (tier, email) {
    const payload = {
        tier: tier,
        email: email,
        iat: Math.floor(Date.now() / 1000),
        // exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 Year
    };

    const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const body = btoa(JSON.stringify(payload));
    const signature = 'NO_SIGNATURE';

    return `${header}.${body}.${signature}`;
};

/**
 * MAGIC LINK URL PARSER
 * Automatically unlocks tiers based on ?access= key
 */
function checkUrlForMagicLink() {
    const extracted = window.ALIDADE_ACCESS_UTILS?.checkUrlForMagicLink;
    if (typeof extracted === 'function') {
        return extracted({
            validKeys: VALID_KEYS,
            setPlanState: (plan) => {
                currentUserPlan = plan;
                USER_TIER = plan;
                Reflect.set(window, 'USER_TIER', plan);
            },
            updateUIForPlan: () => updateUIForPlan(),
            showToast: (message, type) => {
                if (typeof showToast === 'function') {
                    showToast(message, type);
                }
            }
        });
    }

    const urlParams = new URLSearchParams(window.location.search);
    const accessKey = urlParams.get('access');

    if (accessKey) {
        accessRuntimeDebugLog('[ACCESS] Magic Link detected:', accessKey);
        let detectedPlan = null;

        if (accessKey === VALID_KEYS.ULTIMATE) {
            detectedPlan = 'ULTIMATE';
        } else if (accessKey === VALID_KEYS.BASIC || accessKey === VALID_KEYS.LITE) {
            detectedPlan = 'BASIC';
        }

        if (detectedPlan) {
            // 1. Save State
            localStorage.setItem('user_plan', detectedPlan);
            localStorage.setItem('alidade_access_token', accessKey); // Sync with JWT system if possible
            currentUserPlan = detectedPlan;
            USER_TIER = detectedPlan; // Sync with existing constant turned variable
            window.USER_TIER = detectedPlan;

            // 2. Unlock UI
            updateUIForPlan();

            // 3. Hide Lock Screen
            const lockModal = document.getElementById('lock-modal');
            if (lockModal) lockModal.classList.add('hidden');

            // 4. Clean URL (Remove the key so it doesn't stay in the bar)
            window.history.replaceState({}, document.title, window.location.pathname);

            // 5. Notify
            showToast(`ACCESS GRANTED: ${detectedPlan} MODE ACTIVATED`, 'success');
        }
    }
}

/**
 * Updates the HUD and view based on current plan
 */
function updateUIForPlan() {
    const extracted = window.ALIDADE_ACCESS_UTILS?.updateUIForPlan;
    if (typeof extracted === 'function') {
        return extracted({
            normalizeTierTag,
            getCurrentUserPlan: () => currentUserPlan,
            setCurrentUserPlan: (plan) => {
                currentUserPlan = plan;
            },
            setUserTier: (tier) => {
                USER_TIER = tier;
                Reflect.set(window, 'USER_TIER', tier);
            },
            getTierData: () => {
                try {
                    return TIER_DATA;
                } catch (_error) {
                    return null;
                }
            },
            setCurrentTierConfig: (tierConfig) => {
                currentTier = tierConfig;
            },
            renderApp: () => {
                if (typeof renderApp === 'function') {
                    renderApp();
                }
            }
        });
    }

    currentUserPlan = normalizeTierTag(currentUserPlan);
    USER_TIER = currentUserPlan;
    window.USER_TIER = currentUserPlan;
    if (typeof TIER_DATA !== 'undefined') {
        currentTier = TIER_DATA[currentUserPlan] || TIER_DATA.BASIC;
    }
    accessRuntimeDebugLog(`[ALIDADE] Updating UI for plan: ${currentUserPlan}`);
    // Re-render the app to apply tier-based logic
    if (typeof renderApp === 'function') {
        renderApp();
    }
}

// Expose globally
window.updateUIForPlan = updateUIForPlan;

const tierConfigData = window.ALIDADE_TIER_CONFIG || {};
const VALID_KEYS = tierConfigData.VALID_KEYS || {};

let USER_TIER = resolveUserTier();
let currentUserPlan = USER_TIER;
window.USER_TIER = USER_TIER;
accessRuntimeDebugLog(`[ALIDADE] System Access Level: ${USER_TIER}`);

// -- DEFERRED SUPABASE SYNC -------------------------------------
// Because app.js is a classic script and LicenseManager loads as a
// deferred ES module, the manager may finish AFTER resolveUserTier().
// We poll briefly, then listen for auth state changes.
(function deferredTierSync() {
    let attempts = 0;
    const interval = setInterval(() => {
        attempts++;
        const managerTier = typeof window.licenseManager?.getCurrentTier === 'function'
            ? normalizeTierTag(window.licenseManager.getCurrentTier())
            : normalizeTierTag(window.licenseManager?.user?.license_tier || 'BASIC');

        if (managerTier === 'ULTIMATE' && USER_TIER !== 'ULTIMATE') {
            USER_TIER = 'ULTIMATE';
            currentUserPlan = 'ULTIMATE';
            window.USER_TIER = 'ULTIMATE';
            if (typeof TIER_DATA !== 'undefined') {
                currentTier = TIER_DATA.ULTIMATE || TIER_DATA.BASIC;
            }
            if (typeof updateUIForPlan === 'function') {
                updateUIForPlan();
            }
            clearInterval(interval);
            return;
        }

        if (window.licenseManager?.user?.license_tier) {
            clearInterval(interval);
            syncTierFromLicenseManager();
        } else if (attempts >= 90) { // 90 x 200ms = 18s max wait
            clearInterval(interval);
            accessRuntimeDebugLog('[TIER_BRIDGE] Timeout waiting for LicenseManager');
        }
    }, 200);
})();

// Tier Configuration Data
const TIER_DATA = tierConfigData.TIER_DATA || {};

let currentTier = TIER_DATA[USER_TIER] || TIER_DATA.BASIC;

// ---------------------------------------------------------------
// RESCUE PHASE B: TIER DISPLAY LOGIC
// ---------------------------------------------------------------
window.updateTierDisplay = function () {
    const extracted = window.ALIDADE_ACCESS_UTILS?.updateTierDisplay;
    if (typeof extracted === 'function') {
        return extracted({
            normalizeTierTag,
            getUserTier: () => window.USER_TIER || 'BASIC'
        });
    }

    const tier = normalizeTierTag(window.USER_TIER || 'BASIC').toLowerCase();
    const badge = document.getElementById('tier-badge');
    const stats = document.getElementById('usage-stats');
    const countSpan = document.getElementById('usage-count');
    const hint = document.getElementById('upgrade-hint');

    if (!badge) return;

    // 1. Update Badge
    const labels = { basic: 'BASIC', ultimate: 'ULTIMATE' };
    const colors = {
        basic: 'text-zinc-500 border-void-700 bg-void-800',
        ultimate: 'text-signal-amber border-signal-amber/30 bg-signal-amber/10'
    };

    badge.textContent = labels[tier] || labels.basic;
    badge.className = `cursor-pointer px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold tracking-wider transition-colors border ${colors[tier] || colors.basic}`;

    // 2. Update Usage Stats (AI Scanner as primary metric)
    const scanLimits = { basic: 1, ultimate: -1 };
    const limit = scanLimits[tier] ?? 1;

    if (limit === -1) {
        // Ultimate: Hide stats or show infinity
        stats.classList.remove('hidden');
        countSpan.textContent = '8';
        countSpan.className = 'text-signal-emerald';
        hint.classList.add('hidden');
    } else {
        // Basic: Show X/Y
        // Duplicate logic because helper imports in app.js are mixed
        const today = new Date().toISOString().split('T')[0];
        const usageKey = `usage_ai_scanner_${today}`;
        const currentUsage = parseInt(localStorage.getItem(usageKey) || '0', 10);

        stats.classList.remove('hidden');
        countSpan.textContent = `${currentUsage}/${limit}`;

        // Color coding
        const percent = currentUsage / limit;
        if (percent >= 1) countSpan.className = 'text-signal-crimson';
        else if (percent >= 0.8) countSpan.className = 'text-signal-amber';
        else countSpan.className = 'text-signal-emerald';

        // 3. Upgrade Hint
        if (tier !== 'ultimate') {
            hint.classList.remove('hidden');
        } else {
            hint.classList.add('hidden');
        }
    }
};

// Auto-update on load and interactions
document.addEventListener('DOMContentLoaded', () => setTimeout(window.updateTierDisplay, 500));
window.addEventListener('storage', window.updateTierDisplay); // Cross-tab updates

const tierFeatureMapData = window.ALIDADE_TIER_FEATURE_MAP || {};
// Centralized tier requirements for view-level access control.
const VIEW_TIER_REQUIREMENTS = tierFeatureMapData.VIEW_TIER_REQUIREMENTS || Object.freeze({});

function getRequiredTierForView(viewName) {
    const extracted = window.ALIDADE_UTILS?.getRequiredTierForView;
    if (typeof extracted === 'function') {
        return extracted(viewName);
    }
    const key = String(viewName || '').trim().toUpperCase();
    return VIEW_TIER_REQUIREMENTS[key] || 'BASIC';
}

function hasTierAccess(currentTierRaw, requiredTierRaw = 'BASIC') {
    const extracted = window.ALIDADE_UTILS?.hasTierAccess;
    if (typeof extracted === 'function') {
        return extracted(currentTierRaw, requiredTierRaw, USER_TIER || 'BASIC');
    }
    const currentTier = normalizeTierTag(currentTierRaw || USER_TIER || 'BASIC');
    const requiredTier = normalizeTierTag(requiredTierRaw || 'BASIC');
    if (requiredTier === 'BASIC') return true;
    return currentTier === 'ULTIMATE';
}

const TIER_FUNNEL_STORAGE_KEY = 'alidade_tier_funnel_events_v1';
const __seenLockImpressions = new Set();

function trackTierFunnelEvent(eventName, payload = {}) {
    const extracted = window.ALIDADE_ACCESS_UTILS?.trackTierFunnelEvent;
    if (typeof extracted === 'function') {
        return extracted(eventName, payload, {
            markUpgradeAttempted: () => {
                Reflect.set(window, '__alidadeUpgradeAttempted', true);
            },
            getCurrentTier: () => normalizeTierTag(USER_TIER || window.USER_TIER || 'BASIC'),
            logActivity: (activityType, envelope) => {
                if (window.sessionIntel?.logActivity) {
                    window.sessionIntel.logActivity(activityType, envelope);
                }
            }
        });
    }

    const event = String(eventName || '').trim();
    if (!event) return;
    if (event === 'click_upgrade' || event === 'checkout_open') {
        window.__alidadeUpgradeAttempted = true;
    }

    const envelope = {
        event,
        timestamp: Date.now(),
        tier: normalizeTierTag(USER_TIER || window.USER_TIER || 'BASIC'),
        ...payload
    };

    try {
        const raw = localStorage.getItem(TIER_FUNNEL_STORAGE_KEY);
        const current = raw ? JSON.parse(raw) : [];
        current.push(envelope);
        if (current.length > 200) current.splice(0, current.length - 200);
        localStorage.setItem(TIER_FUNNEL_STORAGE_KEY, JSON.stringify(current));
    } catch (error) {
        console.warn('[FUNNEL] Failed to persist event:', error);
    }

    if (window.sessionIntel?.logActivity) {
        window.sessionIntel.logActivity('tier_funnel', envelope);
    }

    accessRuntimeDebugLog('[FUNNEL]', envelope);
}
window.trackTierFunnelEvent = trackTierFunnelEvent;

function escapeHtml(value = '') {
    const extracted = window.ALIDADE_UTILS?.escapeHtml;
    if (typeof extracted === 'function') {
        return extracted(value);
    }
    return String(value).replace(/[&<>"']/g, (char) => {
        return ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            '\'': '&#39;'
        })[char] || char;
    });
}

const UPGRADE_CONTEXT_MAP = tierFeatureMapData.UPGRADE_CONTEXT_MAP || Object.freeze({});

function getUpgradeContext(featureKey = '') {
    const extracted = window.ALIDADE_ACCESS_UTILS?.getUpgradeContext;
    if (typeof extracted === 'function') {
        return extracted(featureKey, { contextMap: UPGRADE_CONTEXT_MAP });
    }

    const normalized = String(featureKey || '').trim().toUpperCase();
    const fromMap = UPGRADE_CONTEXT_MAP[normalized];
    if (fromMap) return fromMap;

    return {
        title: 'Ultimate Clearance',
        label: normalized || 'ULTIMATE',
        preview: 'This module is visible but classified until upgrade.',
        benefits: ['Unlimited scans', 'Full archive access', 'Advanced tactical workflows']
    };
}

function trackLockImpression(featureKey = '', source = 'unknown') {
    const extracted = window.ALIDADE_ACCESS_UTILS?.trackLockImpression;
    if (typeof extracted === 'function') {
        return extracted(featureKey, source, {
            seenLockImpressions: __seenLockImpressions,
            normalizeTierTag,
            getUserTier: () => USER_TIER || 'BASIC',
            trackTierFunnelEvent: (eventName, payload) => trackTierFunnelEvent(eventName, payload)
        });
    }

    const normalizedFeature = String(featureKey || 'unknown').trim().toUpperCase() || 'UNKNOWN';
    const dedupeKey = `${source}:${normalizedFeature}:${normalizeTierTag(USER_TIER || 'BASIC')}`;
    if (__seenLockImpressions.has(dedupeKey)) return;
    __seenLockImpressions.add(dedupeKey);
    trackTierFunnelEvent('view_lock', { source, feature: normalizedFeature });
}

function getFeatureUsageStatus(featureName) {
    const extracted = window.ALIDADE_ACCESS_UTILS?.getFeatureUsageStatus;
    if (typeof extracted === 'function') {
        return extracted(featureName, {
            licenseManager: window.licenseManager,
            checkFeatureAccess: window.checkFeatureAccess
        });
    }

    const normalizedFeature = String(featureName || '').trim();
    if (!normalizedFeature) {
        return {
            allowed: true,
            reason: null,
            current_usage: 0,
            limit: -1
        };
    }

    if (window.licenseManager && typeof window.licenseManager.canUseFeature === 'function') {
        return window.licenseManager.canUseFeature(normalizedFeature);
    }

    if (typeof window.checkFeatureAccess === 'function') {
        const fallback = window.checkFeatureAccess(normalizedFeature) || {};
        return {
            allowed: Boolean(fallback.allowed),
            reason: fallback.reason || null,
            upgrade_to: fallback.upgradeNeeded || (fallback.allowed ? null : 'ultimate'),
            current_usage: fallback.current_usage ?? 0,
            limit: fallback.limit ?? -1
        };
    }

    return {
        allowed: true,
        reason: null,
        current_usage: 0,
        limit: -1
    };
}

function ensureAiScannerAccess(source = 'souk_scanner') {
    const extracted = window.ALIDADE_ACCESS_UTILS?.ensureAiScannerAccess;
    if (typeof extracted === 'function') {
        return extracted(source, {
            getFeatureUsageStatus: (featureName) => getFeatureUsageStatus(featureName),
            trackLockImpression: (feature, lockSource) => trackLockImpression(feature, lockSource),
            showAccessDeniedModal: (requiredTier, featureName) => showAccessDeniedModal(requiredTier, featureName)
        });
    }

    const scannerStatus = getFeatureUsageStatus('ai_scanner');
    if (scannerStatus.allowed) return true;

    trackLockImpression('MARKET', source);
    showAccessDeniedModal('ULTIMATE', 'MARKET');
    return false;
}

const PROTOCOLS_WALLET_EXECUTE_FEATURE = 'protocols_wallet_execute';
const PROTOCOLS_LOGISTICS_OPTIMIZE_FEATURE = 'protocols_logistics_optimize';
const PROTOCOLS_LOGISTICS_FREE_TRIES = 3;
const PROTOCOLS_AUTH_MODAL_ID = 'protocols-logistics-auth-modal';

function isLicenseUserAuthenticated() {
    const extracted = window.ALIDADE_ACCESS_UTILS?.isLicenseUserAuthenticated;
    if (typeof extracted === 'function') {
        return extracted({
            licenseManager: window.licenseManager
        });
    }

    return Boolean(
        window.licenseManager &&
        typeof window.licenseManager.isAuthenticated === 'function' &&
        window.licenseManager.isAuthenticated()
    );
}

function isProtocolsLogisticsAuthRequired() {
    const extracted = window.ALIDADE_ACCESS_UTILS?.isProtocolsLogisticsAuthRequired;
    if (typeof extracted === 'function') {
        return extracted({
            isLicenseUserAuthenticated: () => Boolean(
                window.licenseManager &&
                typeof window.licenseManager.isAuthenticated === 'function' &&
                window.licenseManager.isAuthenticated()
            )
        });
    }

    return !isLicenseUserAuthenticated();
}

function consumeFeatureUsage(featureName) {
    const extracted = window.ALIDADE_ACCESS_UTILS?.consumeFeatureUsage;
    if (typeof extracted === 'function') {
        return extracted(featureName, {
            licenseManager: window.licenseManager,
            incrementUsage: window.incrementUsage,
            updateTierDisplay: window.updateTierDisplay
        });
    }

    const normalizedFeature = String(featureName || '').trim();
    if (!normalizedFeature) {
        return { count: 0, limit: -1, remaining: -1 };
    }

    let status;
    if (window.licenseManager && typeof window.licenseManager.incrementFeatureUsage === 'function') {
        status = window.licenseManager.incrementFeatureUsage(normalizedFeature);
    } else if (typeof window.incrementUsage === 'function') {
        status = window.incrementUsage(normalizedFeature);
    } else {
        status = { count: 0, limit: -1, remaining: -1 };
    }
    if (typeof window.updateTierDisplay === 'function') {
        window.updateTierDisplay();
    }
    return status;
}

function consumeAiScannerUsage() {
    const extracted = window.ALIDADE_ACCESS_UTILS?.consumeAiScannerUsage;
    if (typeof extracted === 'function') {
        return extracted({
            consumeFeatureUsage: (featureName) => consumeFeatureUsage(featureName)
        });
    }

    return consumeFeatureUsage('ai_scanner');
}

function getProtocolsLogisticsGateStatus() {
    const extracted = window.ALIDADE_ACCESS_UTILS?.getProtocolsLogisticsGateStatus;
    if (typeof extracted === 'function') {
        return extracted({
            normalizeTierTag,
            getUserTier: () => USER_TIER || window.USER_TIER || 'BASIC',
            getFeatureUsageStatus: (featureName) => getFeatureUsageStatus(featureName),
            featureName: PROTOCOLS_LOGISTICS_OPTIMIZE_FEATURE,
            freeTries: PROTOCOLS_LOGISTICS_FREE_TRIES
        });
    }

    const tier = normalizeTierTag(USER_TIER || window.USER_TIER || 'BASIC');
    const status = getFeatureUsageStatus(PROTOCOLS_LOGISTICS_OPTIMIZE_FEATURE);
    const baseLimit = Number.isFinite(status.limit) ? status.limit : (status.limit ?? -1);
    const limit = (tier === 'ULTIMATE')
        ? -1
        : (baseLimit === -1 ? PROTOCOLS_LOGISTICS_FREE_TRIES : Number(baseLimit));
    const used = Number(status.current_usage || 0);
    const allowed = tier === 'ULTIMATE'
        ? true
        : (Boolean(status.allowed) && (limit === -1 || used < limit));

    return {
        tier,
        limit,
        used,
        remaining: limit === -1 ? -1 : Math.max(0, limit - used),
        allowed,
        locked: !allowed
    };
}

function getProtocolsLogisticsUsageText(logisticsState = getProtocolsLogisticsGateStatus()) {
    const extracted = window.ALIDADE_ACCESS_UTILS?.getProtocolsLogisticsUsageText;
    if (typeof extracted === 'function') {
        return extracted(logisticsState, {
            isProtocolsLogisticsAuthRequired: () => isProtocolsLogisticsAuthRequired()
        });
    }

    if (isProtocolsLogisticsAuthRequired()) {
        return 'Registration required before optimization';
    }
    if (!logisticsState || logisticsState.limit === -1) {
        return 'Unlimited route optimizations available';
    }
    return `${logisticsState.remaining}/${logisticsState.limit} tries left`;
}

function getProtocolsLogisticsUsageMeta(logisticsState = getProtocolsLogisticsGateStatus()) {
    const extracted = window.ALIDADE_ACCESS_UTILS?.getProtocolsLogisticsUsageMeta;
    if (typeof extracted === 'function') {
        return extracted(logisticsState, {
            isProtocolsLogisticsAuthRequired: () => isProtocolsLogisticsAuthRequired()
        });
    }

    if (isProtocolsLogisticsAuthRequired()) {
        return 'Sign in to unlock your 3 free route optimizations on this profile';
    }
    if (!logisticsState || logisticsState.limit === -1) {
        return 'ULTIMATE: unlimited tactical planning';
    }
    return `Used ${logisticsState.used} of ${logisticsState.limit} free route optimizations`;
}

function promptProtocolsUpgrade(featureKey, source) {
    const extracted = window.ALIDADE_ACCESS_UTILS?.promptProtocolsUpgrade;
    if (typeof extracted === 'function') {
        extracted(featureKey, source, {
            trackLockImpression: (feature, lockSource) => trackLockImpression(feature, lockSource),
            trackTierFunnelEvent: (eventName, payload) => trackTierFunnelEvent(eventName, payload),
            showUpgradeModal: (requiredTier, featureName) => window.showUpgradeModal?.(requiredTier, featureName)
        });
        return;
    }

    const normalizedFeature = String(featureKey || 'PROTOCOLS').trim().toUpperCase();
    const normalizedSource = String(source || 'protocols_lock').trim();
    trackLockImpression(normalizedFeature, normalizedSource);
    trackTierFunnelEvent('click_upgrade', {
        source: normalizedSource,
        feature: normalizedFeature
    });
    window.showUpgradeModal?.('ultimate', normalizedFeature);
}

function promptProtocolsWalletUpgrade(source = 'protocols_wallet_execute') {
    const extracted = window.ALIDADE_ACCESS_UTILS?.promptProtocolsWalletUpgrade;
    if (typeof extracted === 'function') {
        extracted(source, {
            promptProtocolsUpgrade: (featureKey, walletSource) => promptProtocolsUpgrade(featureKey, walletSource)
        });
        return;
    }

    promptProtocolsUpgrade('PROTOCOLS_WALLET_EXECUTE', source);
}

function ensureProtocolsAuthModal() {
    const extracted = window.ALIDADE_ACCESS_UTILS?.ensureProtocolsAuthModal;
    if (typeof extracted === 'function') {
        return extracted({
            document,
            modalId: PROTOCOLS_AUTH_MODAL_ID,
            licenseManager: window.licenseManager,
            location: window.location
        });
    }

    let modal = document.getElementById(PROTOCOLS_AUTH_MODAL_ID);
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = PROTOCOLS_AUTH_MODAL_ID;
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
    document.body.appendChild(modal);

    const closeModal = () => {
        modal.classList.add('opacity-0');
        setTimeout(() => modal.classList.add('hidden'), 180);
    };

    const setStatus = (message, tone = 'muted') => {
        const status = document.getElementById('protocols-auth-modal-status');
        if (!status) return;
        status.textContent = message || '';
        status.className = `min-h-[16px] text-[11px] ${tone === 'error' ? 'text-red-400' : tone === 'success' ? 'text-emerald-400' : 'text-zinc-500'}`;
    };

    modal.querySelectorAll('[data-protocols-auth-close="1"]').forEach((node) => {
        node.addEventListener('click', closeModal);
    });
    const closeBtn = document.getElementById('protocols-auth-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    const withDisabledState = (loading) => {
        ['protocols-auth-google-btn', 'protocols-auth-login-btn', 'protocols-auth-signup-btn'].forEach((id) => {
            const button = document.getElementById(id);
            if (!button) return;
            button.disabled = loading;
            button.classList.toggle('opacity-60', loading);
            button.classList.toggle('cursor-not-allowed', loading);
        });
    };

    const getCredentials = () => {
        const email = String(document.getElementById('protocols-auth-email')?.value || '').trim();
        const password = String(document.getElementById('protocols-auth-password')?.value || '');
        return { email, password };
    };

    const googleButton = document.getElementById('protocols-auth-google-btn');
    if (googleButton) {
        googleButton.addEventListener('click', async () => {
            if (!window.licenseManager?.signInWithGoogle) return;
            withDisabledState(true);
            setStatus('Redirecting to Google...', 'muted');
            const result = await window.licenseManager.signInWithGoogle({
                redirectTo: `${window.location.origin}${window.location.pathname}${window.location.search}${window.location.hash}`
            });
            if (!result?.success) {
                withDisabledState(false);
                setStatus(result?.error || 'Google sign-in failed.', 'error');
            }
        });
    }

    const loginButton = document.getElementById('protocols-auth-login-btn');
    if (loginButton) {
        loginButton.addEventListener('click', async () => {
            const { email, password } = getCredentials();
            if (!email || !password) {
                setStatus('Email and password are required.', 'error');
                return;
            }
            if (!window.licenseManager?.signInWithPassword) return;

            withDisabledState(true);
            setStatus('Signing in...', 'muted');
            const result = await window.licenseManager.signInWithPassword(email, password);
            withDisabledState(false);
            if (!result?.success) {
                setStatus(result?.error || 'Sign-in failed.', 'error');
                return;
            }
            setStatus('Signed in successfully.', 'success');
            closeModal();
        });
    }

    const signupButton = document.getElementById('protocols-auth-signup-btn');
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
            if (!window.licenseManager?.signUpWithPassword) return;

            withDisabledState(true);
            setStatus('Creating account...', 'muted');
            const result = await window.licenseManager.signUpWithPassword(email, password);
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
}

function openProtocolsAuthModal(logisticsState = getProtocolsLogisticsGateStatus(), source = 'protocols_logistics_lock') {
    const extracted = window.ALIDADE_ACCESS_UTILS?.openProtocolsAuthModal;
    if (typeof extracted === 'function') {
        extracted(logisticsState, source, {
            document,
            ensureProtocolsAuthModal: () => ensureProtocolsAuthModal(),
            isProtocolsLogisticsAuthRequired: () => isProtocolsLogisticsAuthRequired(),
            getProtocolsLogisticsUsageMeta: (state) => getProtocolsLogisticsUsageMeta(state),
            licenseManager: window.licenseManager,
            trackTierFunnelEvent: (eventName, payload) => trackTierFunnelEvent(eventName, payload),
            requestAnimationFrame: (callback) => requestAnimationFrame(callback)
        });
        return;
    }

    const modal = ensureProtocolsAuthModal();
    const title = document.getElementById('protocols-auth-modal-title');
    const copy = document.getElementById('protocols-auth-modal-copy');
    const tries = document.getElementById('protocols-auth-modal-tries');
    const status = document.getElementById('protocols-auth-modal-status');
    const googleBtn = document.getElementById('protocols-auth-google-btn');
    const authRequired = isProtocolsLogisticsAuthRequired();

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
        tries.textContent = getProtocolsLogisticsUsageMeta(logisticsState);
    }
    if (status) {
        status.textContent = '';
    }
    if (googleBtn) {
        googleBtn.disabled = false;
        googleBtn.textContent = 'Continue With Google';
        googleBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }

    const oauthCheck = window.licenseManager?.isOAuthProviderEnabled;
    if (googleBtn && typeof oauthCheck === 'function') {
        Promise.resolve(oauthCheck.call(window.licenseManager, 'google'))
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

    trackTierFunnelEvent('view_lock', {
        source,
        feature: 'LOGISTICS_AUTH'
    });

    modal.classList.remove('hidden');
    requestAnimationFrame(() => modal.classList.remove('opacity-0'));
}

function openFeatureAuthModal({
    source = 'feature_auth_gate',
    title = 'Authenticate To Continue',
    copy = 'Registration is required before continuing this action.',
    meta = 'Sign in once to continue on this profile.'
} = {}) {
    const extracted = window.ALIDADE_ACCESS_UTILS?.openFeatureAuthModal;
    if (typeof extracted === 'function') {
        extracted({ source, title, copy, meta }, {
            document,
            getProtocolsLogisticsGateStatus: () => getProtocolsLogisticsGateStatus(),
            openProtocolsAuthModal: (logisticsState, modalSource) => openProtocolsAuthModal(logisticsState, modalSource)
        });
        return;
    }

    openProtocolsAuthModal(getProtocolsLogisticsGateStatus(), source);

    const titleNode = document.getElementById('protocols-auth-modal-title');
    const copyNode = document.getElementById('protocols-auth-modal-copy');
    const metaNode = document.getElementById('protocols-auth-modal-tries');

    if (titleNode) titleNode.textContent = String(title || 'Authenticate To Continue');
    if (copyNode) copyNode.textContent = String(copy || '');
    if (metaNode) metaNode.textContent = String(meta || '');
}

function ensureBasicFeatureAuth(options = {}) {
    const extracted = window.ALIDADE_ACCESS_UTILS?.ensureBasicFeatureAuth;
    if (typeof extracted === 'function') {
        return extracted(options, {
            normalizeTierTag,
            getUserTier: () => USER_TIER || window.USER_TIER || 'BASIC',
            isLicenseUserAuthenticated: () => isLicenseUserAuthenticated(),
            openFeatureAuthModal: (modalOptions) => openFeatureAuthModal(modalOptions)
        });
    }

    const tier = normalizeTierTag(USER_TIER || window.USER_TIER || 'BASIC');
    if (tier === 'ULTIMATE') return true;
    if (isLicenseUserAuthenticated()) return true;
    openFeatureAuthModal(options);
    return false;
}

function promptProtocolsLogisticsUpgrade(source = 'protocols_logistics_lock') {
    const extracted = window.ALIDADE_ACCESS_UTILS?.promptProtocolsLogisticsUpgrade;
    if (typeof extracted === 'function') {
        extracted(source, {
            getProtocolsLogisticsGateStatus: () => getProtocolsLogisticsGateStatus(),
            isLicenseUserAuthenticated: () => isLicenseUserAuthenticated(),
            openProtocolsAuthModal: (logisticsState, modalSource) => openProtocolsAuthModal(logisticsState, modalSource),
            promptProtocolsUpgrade: (featureKey, upgradeSource) => promptProtocolsUpgrade(featureKey, upgradeSource)
        });
        return;
    }

    const logisticsState = getProtocolsLogisticsGateStatus();
    if (!isLicenseUserAuthenticated()) {
        openProtocolsAuthModal(logisticsState, source);
        return;
    }
    promptProtocolsUpgrade('PROTOCOLS_LOGISTICS_OPTIMIZE', source);
}

function renderProtocolsLogisticsGlassOverlay(logisticsStatus) {
    const extracted = window.ALIDADE_ACCESS_UTILS?.renderProtocolsLogisticsGlassOverlay;
    if (typeof extracted === 'function') {
        return extracted(logisticsStatus, {
            freeTries: PROTOCOLS_LOGISTICS_FREE_TRIES,
            isLicenseUserAuthenticated: () => isLicenseUserAuthenticated()
        });
    }

    const limitLabel = Number.isFinite(logisticsStatus?.limit) && logisticsStatus.limit > 0
        ? logisticsStatus.limit
        : PROTOCOLS_LOGISTICS_FREE_TRIES;
    const guestLocked = !isLicenseUserAuthenticated();
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
}

function syncProtocolsLogisticsLockUi() {
    const extracted = window.ALIDADE_ACCESS_UTILS?.syncProtocolsLogisticsLockUi;
    if (typeof extracted === 'function') {
        extracted({
            document,
            getProtocolsLogisticsGateStatus: () => getProtocolsLogisticsGateStatus(),
            getProtocolsLogisticsUsageText: (logisticsState) => getProtocolsLogisticsUsageText(logisticsState),
            getProtocolsLogisticsUsageMeta: (logisticsState) => getProtocolsLogisticsUsageMeta(logisticsState),
            trackLockImpression: (featureKey, source) => trackLockImpression(featureKey, source),
            isLicenseUserAuthenticated: () => isLicenseUserAuthenticated(),
            renderProtocolsLogisticsGlassOverlay: (logisticsState) => renderProtocolsLogisticsGlassOverlay(logisticsState)
        });
        return;
    }

    const logisticsState = getProtocolsLogisticsGateStatus();
    const usageValue = document.getElementById('protocols-logistics-usage-value');
    const usageMeta = document.getElementById('protocols-logistics-usage-meta');
    if (usageValue) usageValue.textContent = getProtocolsLogisticsUsageText(logisticsState);
    if (usageMeta) usageMeta.textContent = getProtocolsLogisticsUsageMeta(logisticsState);
    const shell = document.getElementById('route-planner-shell');
    const overlay = document.getElementById('protocols-logistics-glass-wall');
    if (!logisticsState.locked) {
        if (overlay) overlay.remove();
        return;
    }

    trackLockImpression('PROTOCOLS_LOGISTICS_OPTIMIZE', 'protocols_logistics_glass_wall');

    const btn = document.getElementById('optimize-btn');
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span>[LOCK]</span> ${isLicenseUserAuthenticated() ? 'Unlock Ultimate Access' : 'Sign In To Continue'}`;
        btn.setAttribute('onclick', "window.promptProtocolsLogisticsUpgrade && window.promptProtocolsLogisticsUpgrade('protocols_logistics_button')");
    }

    if (shell && !overlay) {
        shell.insertAdjacentHTML('beforeend', renderProtocolsLogisticsGlassOverlay(logisticsState));
    }
}

if (typeof window !== 'undefined') {
    const extractedRuntime = window.ALIDADE_ACCESS_UTILS?.setupProtocolsLogisticsRuntime;
    if (typeof extractedRuntime === 'function') {
        extractedRuntime({
            windowObj: window,
            promptProtocolsWalletUpgrade: (source) => promptProtocolsWalletUpgrade(source),
            promptProtocolsLogisticsUpgrade: (source) => promptProtocolsLogisticsUpgrade(source),
            openProtocolsAuthModal: (logisticsState, source) => openProtocolsAuthModal(logisticsState, source),
            getLicenseManager: () => window.licenseManager,
            syncProtocolsLogisticsLockUi: () => syncProtocolsLogisticsLockUi(),
            updateDestinationCount: () => updateDestinationCount(),
            warn: (...args) => console.warn(...args)
        });
    } else {
        window.promptProtocolsWalletUpgrade = promptProtocolsWalletUpgrade;
        window.promptProtocolsLogisticsUpgrade = promptProtocolsLogisticsUpgrade;
        window.openProtocolsAuthModal = openProtocolsAuthModal;

        window.addEventListener('alidade:auth-change', () => {
            const refreshUsage = window.licenseManager?.refreshLogisticsUsage;
            if (typeof refreshUsage === 'function') {
                refreshUsage.call(window.licenseManager)
                    .catch((error) => console.warn('[LOGISTICS] Failed to refresh usage after auth change:', error))
                    .finally(() => {
                        syncProtocolsLogisticsLockUi();
                        updateDestinationCount();
                    });
                return;
            }
            syncProtocolsLogisticsLockUi();
            updateDestinationCount();
        });
    }
}

// Keep plan badge/runtime gates in sync whenever auth state changes.
if (typeof window !== 'undefined' && !window.__alidadeAuthTierBridgeBound) {
    window.__alidadeAuthTierBridgeBound = true;
    window.__alidadeAuthTierSyncInFlight = false;
    window.__alidadeAuthTierLastSyncAt = 0;
    window.addEventListener('alidade:auth-change', async () => {
        if (window.__alidadeAuthTierSyncInFlight) return;
        const now = Date.now();
        if ((now - (window.__alidadeAuthTierLastSyncAt || 0)) < 3000) {
            if (typeof syncTierFromLicenseManager === 'function') {
                syncTierFromLicenseManager();
            }
            return;
        }

        window.__alidadeAuthTierSyncInFlight = true;
        const lm = window.licenseManager;
        try {
            if (lm?.isAuthenticated?.() && lm?.authUser?.id) {
                const currentLmTier = String(lm.getCurrentTier?.() || 'basic').toLowerCase();
                if (currentLmTier !== 'ultimate') {
                    try {
                        await lm.syncLicenseByEmail?.({ silent: true, force: true });
                        await lm.loadUserLicense?.(lm.authUser.id, lm.authUser);
                    } catch (_error) {
                        // Non-blocking: fallback to whatever tier is currently available.
                    }
                }
            }
            if (typeof syncTierFromLicenseManager === 'function') {
                syncTierFromLicenseManager();
            }
            if (typeof window.updateUIByTier === 'function') {
                window.updateUIByTier();
            }
        } finally {
            window.__alidadeAuthTierLastSyncAt = Date.now();
            window.__alidadeAuthTierSyncInFlight = false;
        }
    });
}

if (typeof window !== 'undefined' && !window.__alidadeInitialTierReconcileDone) {
    window.__alidadeInitialTierReconcileDone = true;
    setTimeout(() => {
        if (typeof syncTierFromLicenseManager === 'function') {
            syncTierFromLicenseManager();
        }
        if (typeof window.updateUIByTier === 'function') {
            window.updateUIByTier();
        }
    }, 200);
}

const ULTIMATE_DATA_PACK_URL = 'assets/data/data-ultimate.json';
let __ultimateDataPack = null;
let __ultimateDataPackPromise = null;
let __ultimateDataPackFailed = false;
const BASIC_MEDEVAC_CONTACTS_PREVIEW = Object.freeze({
    cim: { local: 'CLASSIFIED', intl: 'CLASSIFIED' },
    polyclinique: { local: 'CLASSIFIED' },
    sosAmbulance: { direct: 'CLASSIFIED' }
});
let MEDEVAC_CONTACTS = BASIC_MEDEVAC_CONTACTS_PREVIEW;

function hasUltimateDataPackLoaded() {
    const extracted = window.ALIDADE_DATA_UTILS?.hasUltimateDataPackLoaded;
    if (typeof extracted === 'function') {
        return extracted({
            getUltimateDataPack: () => __ultimateDataPack
        });
    }

    return Boolean(__ultimateDataPack);
}

function applyUltimateDataPack(pack = {}) {
    const extracted = window.ALIDADE_DATA_UTILS?.applyUltimateDataPack;
    if (typeof extracted === 'function') {
        extracted(pack, {
            setThreatData: (next) => { THREAT_DATA = next; },
            setIntelData: (next) => { INTEL_DATA = next; },
            setFortressData: (next) => { FORTRESS_DATA = next; },
            getProtocolsData: () => PROTOCOLS_DATA,
            setProtocolsData: (next) => { PROTOCOLS_DATA = next; },
            getMedevacContacts: () => MEDEVAC_CONTACTS,
            setMedevacContacts: (next) => { MEDEVAC_CONTACTS = next; }
        });
        return;
    }

    if (!pack || typeof pack !== 'object') return;

    if (Array.isArray(pack.threatData) && pack.threatData.length > 0) {
        THREAT_DATA = pack.threatData;
    }

    if (pack.intelData && typeof pack.intelData === 'object') {
        INTEL_DATA = pack.intelData;
    }

    if (pack.fortressData && typeof pack.fortressData === 'object') {
        FORTRESS_DATA = pack.fortressData;
    }

    if (pack.protocolsData && typeof pack.protocolsData === 'object') {
        const merged = { ...PROTOCOLS_DATA, ...pack.protocolsData };
        // Briefing stays on the dedicated pack loader path.
        merged.briefing = PROTOCOLS_DATA.briefing;
        PROTOCOLS_DATA = merged;
    }

    if (pack.medEvacContacts && typeof pack.medEvacContacts === 'object') {
        MEDEVAC_CONTACTS = {
            ...MEDEVAC_CONTACTS,
            ...pack.medEvacContacts
        };
    }
}

function ensureUltimateDataPack() {
    const extracted = window.ALIDADE_DATA_UTILS?.ensureUltimateDataPack;
    if (typeof extracted === 'function') {
        return extracted({
            normalizeTierTag,
            getUserTier: () => USER_TIER || window.USER_TIER || 'BASIC',
            hasUltimateDataPackLoaded: () => hasUltimateDataPackLoaded(),
            getUltimateDataPackPromise: () => __ultimateDataPackPromise,
            setUltimateDataPackPromise: (next) => { __ultimateDataPackPromise = next; },
            setUltimateDataPack: (next) => { __ultimateDataPack = next; },
            setUltimateDataPackFailed: (next) => { __ultimateDataPackFailed = next; },
            applyUltimateDataPack: (pack) => applyUltimateDataPack(pack),
            fetch: (...args) => fetch(...args),
            ultimateDataPackUrl: ULTIMATE_DATA_PACK_URL,
            warn: (...args) => console.warn(...args)
        });
    }

    const tier = normalizeTierTag(USER_TIER || window.USER_TIER || 'BASIC');
    if (tier !== 'ULTIMATE') {
        return Promise.resolve(false);
    }

    if (hasUltimateDataPackLoaded()) {
        return Promise.resolve(true);
    }

    if (__ultimateDataPackPromise) {
        return __ultimateDataPackPromise;
    }

    __ultimateDataPackPromise = fetch(ULTIMATE_DATA_PACK_URL)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
        })
        .then((payload) => {
            __ultimateDataPack = payload;
            __ultimateDataPackFailed = false;
            applyUltimateDataPack(payload);
            return true;
        })
        .catch((error) => {
            __ultimateDataPackFailed = true;
            console.warn('[ULTIMATE_DATA] Failed to load pack:', error);
            return false;
        })
        .finally(() => {
            __ultimateDataPackPromise = null;
        });

    return __ultimateDataPackPromise;
}

function ensureUltimateViewData(viewKey, rerender) {
    const extracted = window.ALIDADE_DATA_UTILS?.ensureUltimateViewData;
    if (typeof extracted === 'function') {
        return extracted(viewKey, rerender, {
            normalizeTierTag,
            getUserTier: () => USER_TIER || window.USER_TIER || 'BASIC',
            hasUltimateDataPackLoaded: () => hasUltimateDataPackLoaded(),
            getUltimateDataPackFailed: () => __ultimateDataPackFailed,
            document,
            ensureUltimateDataPack: () => ensureUltimateDataPack(),
            getCurrentView: () => currentView
        });
    }

    const tier = normalizeTierTag(USER_TIER || window.USER_TIER || 'BASIC');
    if (tier !== 'ULTIMATE' || hasUltimateDataPackLoaded() || __ultimateDataPackFailed) {
        return false;
    }

    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = `
            <div class="min-h-screen bg-void-950 flex items-center justify-center p-6">
                <div class="p-4 rounded-[2px] border border-void-800 bg-void-900/50 text-center">
                    <p class="text-xs text-zinc-400 font-mono uppercase tracking-widest">Loading classified archive...</p>
                </div>
            </div>
        `;
    }

    ensureUltimateDataPack().finally(() => {
        const current = String(currentView || '').trim().toUpperCase();
        if (current === String(viewKey || '').toUpperCase() && typeof rerender === 'function') {
            rerender();
        }
    });
    return true;
}

if (typeof window !== 'undefined') {
    window.ensureUltimateDataPack = ensureUltimateDataPack;
}

// --- GATEKEEPER LOGIC ---
function checkAccess(requiredTier, actionCallback, featureKey = '') {
    const extracted = window.ALIDADE_ACCESS_UTILS?.checkAccess;
    if (typeof extracted === 'function') {
        return extracted(requiredTier, actionCallback, featureKey, {
            normalizeTierTag,
            hasTierAccess,
            getUserTier: () => USER_TIER || 'BASIC',
            showAccessDeniedModal: (tier, key) => showAccessDeniedModal(tier, key)
        });
    }

    const tier = normalizeTierTag(USER_TIER || 'BASIC');
    const requiredRaw = (requiredTier || 'BASIC').toUpperCase();
    const required = requiredRaw === 'LITE' ? 'ULTIMATE' : normalizeTierTag(requiredRaw);

    if (hasTierAccess(tier, required)) {
        if (typeof actionCallback === 'function') {
            actionCallback();
        }
        return;
    }

    showAccessDeniedModal(required, featureKey);
}
// Expose checkAccess globally for onclick handlers
window.checkAccess = checkAccess;

function showAccessDeniedModal(requiredTier = 'ULTIMATE', featureKey = '') {
    const extracted = window.ALIDADE_ACCESS_UTILS?.showAccessDeniedModal;
    if (typeof extracted === 'function') {
        extracted(requiredTier, featureKey, {
            normalizeTierTag,
            getUserTier: () => USER_TIER || 'BASIC',
            getUpgradeContext: (key) => getUpgradeContext(key),
            escapeHtml: (value) => escapeHtml(value),
            trackLockImpression: (feature, source) => trackLockImpression(feature, source),
            trackTierFunnelEvent: (eventName, payload) => trackTierFunnelEvent(eventName, payload),
            showUpgradeModal: (tier, feature) => window.showUpgradeModal?.(tier, feature),
            getLockIcon: () => ICONS.lock,
            document,
            localStorage
        });
        return;
    }

    const modalId = 'access-denied-modal';
    const required = normalizeTierTag(requiredTier || 'ULTIMATE');
    const current = normalizeTierTag(USER_TIER || 'BASIC');
    const context = getUpgradeContext(featureKey || required);
    const benefitsHtml = (context.benefits || []).map((item) => `
        <li class="text-[11px] font-mono text-zinc-300 flex items-start gap-2">
            <span class="text-signal-amber mt-[1px]">+</span>
            <span>${escapeHtml(item)}</span>
        </li>
    `).join('');

    // Prevent duplicate modals
    document.getElementById(modalId)?.remove();

    // ---------------------------------------------------------------
    // RESCUE PHASE B: FEATURE GATING DEBUG
    // ---------------------------------------------------------------
    window.testFeatureGate = {
        // 1. Simulate using a feature
        useScanner: () => {
            const feature = 'ai_scanner';

            // Check Limit
            if (!window.enforceLimit(feature, (reason, tier) => {
                console.warn(`[BLOCK] ${reason}`);
                window.openUpgradeModal(reason);
            })) {
                return "BLOCKED";
            }

            // Increment Usage
            const status = window.incrementUsage(feature);
            accessRuntimeDebugLog(`[SUCCESS] Scan used. Remaining: ${status.remaining}`);
            return "SUCCESS";
        },

        // 2. Reset limits
        resetLimits: () => {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('usage_')) localStorage.removeItem(key);
            });
            accessRuntimeDebugLog('Limits reset.');
        }
    };
    accessRuntimeDebugLog('[DEBUG] Feature Gate Tests Ready: Run window.testFeatureGate.useScanner()');

    trackLockImpression(context.label || featureKey || required, 'access_denied_modal');

    const modalHtml = `
            <div id="${modalId}" class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fadeIn">
                <div class="w-full max-w-md bg-void-950 border-2 border-signal-amber/50 rounded-sm relative overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.2)]">
                    <!-- Scanlines -->
                    <div class="absolute inset-0 opacity-[0.05] pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(245,158,11,0.5) 2px, rgba(245,158,11,0.5) 4px);"></div>
                    
                    <div class="p-6 relative z-10 text-center">
                        <div class="text-signal-amber mb-4 animate-pulse">
                            ${ICONS.lock}
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
                            <span>${escapeHtml(context.title)}</span>
                        </div>

                        <p class="text-xs text-zinc-300 mb-4 leading-relaxed">
                            ${escapeHtml(context.preview)}
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
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const upgradeBtn = document.getElementById(`${modalId}-upgrade`);
    if (upgradeBtn) {
        upgradeBtn.addEventListener('click', () => {
            trackTierFunnelEvent('click_upgrade', {
                source: 'access_denied_modal',
                feature: context.label || String(featureKey || '').toUpperCase() || 'UNKNOWN'
            });
            window.showUpgradeModal?.('ultimate', context.label || context.title || 'Ultimate');
            document.getElementById(modalId)?.remove();
        });
    }
}

// Backward-compatible upgrade entrypoint used across legacy/new modules.
if (typeof window !== 'undefined') {
    const extractedBridge = window.ALIDADE_ACCESS_UTILS?.ensureUpgradeModalBridge;
    if (typeof extractedBridge === 'function') {
        extractedBridge({
            windowObj: window,
            getLicenseManager: () => window.licenseManager,
            openUpgradeModal: (tier, feature) => {
                if (typeof window.openUpgradeModal === 'function') {
                    window.openUpgradeModal(String(tier || 'ultimate'), String(feature || ''));
                }
            },
            activateUrl: 'activate.html'
        });
    } else if (typeof window.showUpgradeModal !== 'function') {
        window.showUpgradeModal = function (targetTier = 'ultimate', featureName = '') {
            if (window.licenseManager && typeof window.licenseManager.showUpgradeModal === 'function') {
                window.licenseManager.showUpgradeModal(targetTier, featureName);
                return;
            }

            if (typeof window.openUpgradeModal === 'function') {
                window.openUpgradeModal(String(targetTier || 'ultimate'), String(featureName || ''));
                return;
            }

            window.location.href = 'activate.html';
        };
    }
}

// Keep UI in sync when tier changes asynchronously (auth sync / cache load).
if (typeof window !== 'undefined') {
    const extractedBind = window.ALIDADE_ACCESS_UTILS?.bindTierChangeSync;
    if (typeof extractedBind === 'function') {
        extractedBind({
            windowObj: window,
            normalizeTierTag,
            getUserTier: () => USER_TIER || 'BASIC',
            setUserTier: (tier) => {
                const normalizedTier = normalizeTierTag(tier || USER_TIER || 'BASIC');
                USER_TIER = normalizedTier;
                currentUserPlan = normalizedTier;
                window.USER_TIER = normalizedTier;
                if (typeof TIER_DATA !== 'undefined') {
                    currentTier = TIER_DATA[normalizedTier] || TIER_DATA.BASIC;
                }
            },
            trackTierFunnelEvent: (eventName, payload) => trackTierFunnelEvent(eventName, payload),
            ensureUltimateDataPack: () => ensureUltimateDataPack(),
            updateUIByTier: () => {
                if (typeof window.updateUIByTier === 'function') {
                    window.updateUIByTier();
                }
            },
            renderApp: () => {
                if (typeof renderApp === 'function') {
                    renderApp();
                }
            }
        });
    } else if (!window.__alidadeTierChangeBound) {
        window.__alidadeTierChangeBound = true;
        window.addEventListener('alidade:tier-change', (event) => {
            const changedTier = normalizeTierTag(event?.detail?.tier || USER_TIER || 'BASIC');
            USER_TIER = changedTier;
            currentUserPlan = changedTier;
            window.USER_TIER = changedTier;
            if (typeof TIER_DATA !== 'undefined') {
                currentTier = TIER_DATA[changedTier] || TIER_DATA.BASIC;
            }
            if (changedTier === 'ULTIMATE' && window.__alidadeUpgradeAttempted && !window.__alidadeUpgradeSuccessTracked) {
                window.__alidadeUpgradeSuccessTracked = true;
                trackTierFunnelEvent('success', { source: 'tier_change_event', feature: 'UPGRADE' });
            }
            if (changedTier === 'ULTIMATE') {
                ensureUltimateDataPack();
            }
            if (typeof window.updateUIByTier === 'function') {
                window.updateUIByTier();
            }
            if (typeof renderApp === 'function') {
                renderApp();
            }
        });
    }
}
