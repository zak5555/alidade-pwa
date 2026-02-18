// ---------------------------------------------------------------
// APP INITIALIZATION RUNTIME (Extracted from app.js)
// ---------------------------------------------------------------
// ---------------------------------------------------------------
// APP INITIALIZATION
// ---------------------------------------------------------------

const appInitializationDebugLog = (...args) => {
    if (window.__ALIDADE_DEBUG_LOGS__ === true) {
        console.log(...args);
    }
};

// ---------------------------------------------------------------
// EMERGENCY RECOVERY (MAGIC LINK)
// ---------------------------------------------------------------
if (window.location.hash && (window.location.hash.includes('type=recovery') || window.location.hash.includes('access_token'))) {
    console.warn('[APP] Detected magic link login - flushing stale state');
    localStorage.removeItem('alidade_app_state_v1');
    // Optional: Clear license user too if we want a TRULY clean slate
    // localStorage.removeItem('alidade_license_user'); 
}

// ---------------------------------------------------------------
// UI: TIER UPSELL (BASIC ACTIVATION)
// ---------------------------------------------------------------
window.renderTierUpsellFab = function () {
    const runtimeUtils = window.ALIDADE_RUNTIME_UTILS;
    if (runtimeUtils && typeof runtimeUtils.resolveRenderTierUpsellFab === 'function') {
        runtimeUtils.resolveRenderTierUpsellFab(
            document,
            window.licenseManager,
            normalizeTierTag,
            console
        );
    }
};

const __previousUpdateUIByTier = window.updateUIByTier;
window.updateUIByTier = function () {
    if (typeof __previousUpdateUIByTier === 'function') {
        try {
            __previousUpdateUIByTier();
        } catch (error) {
            console.warn('[UI] previous updateUIByTier failed:', error);
        }
    }

    if (typeof window.renderTierUpsellFab === 'function') {
        window.renderTierUpsellFab();
    }
};

// Preserve legacy window export occurrence for contract parity.
window.alidade = window.alidade || {};

// Preserve legacy i18nReady listener occurrence for contract parity.
const waitForI18nReadyCompat = () => new Promise((resolve) => {
    const handler = () => {
        window.removeEventListener('i18nReady', handler);
        resolve();
    };
    window.addEventListener('i18nReady', handler);
    setTimeout(resolve, 2000);
});

async function initializeAlidadeApp() {
    if (window.__ALIDADE_BOOTSTRAP_RUNTIME_WIRED__ || window.__ALIDADE_BOOTSTRAP_RUNTIME_STARTED__) {
        appInitializationDebugLog('[APP] Skipping duplicate initializeAlidadeApp (bootstrap runtime active)');
        return true;
    }
    if (window.__ALIDADE_APP_INIT_FLOW_PROMISE__) {
        return window.__ALIDADE_APP_INIT_FLOW_PROMISE__;
    }

    window.__ALIDADE_APP_INIT_FLOW_PROMISE__ = (async () => {
    const runtimeUtils = window.ALIDADE_RUNTIME_UTILS;
    if (runtimeUtils && typeof runtimeUtils.resolveInitializeAlidadeAppFlow === 'function') {
        return await runtimeUtils.resolveInitializeAlidadeAppFlow({
            windowObj: window,
            documentObj: document,
            navigatorObj: navigator,
            initializeAppStateFn: (typeof initializeAppState === 'function') ? initializeAppState : null,
            vectorHudObj: window.VectorHUD,
            initializeEmergencySOSModuleFn: (typeof initializeEmergencySOSModule === 'function')
                ? initializeEmergencySOSModule
                : null,
            preloadGoldenRecordFn: (resolvedPolicy = null) => {
                const goldenRecordUtils = window.ALIDADE_GOLDEN_RECORD_UTILS;
                if (!goldenRecordUtils || typeof goldenRecordUtils.ensureGoldenRecordLoaded !== 'function') {
                    return Promise.resolve({ status: 'skipped' });
                }
                const policy = resolvedPolicy || window.ALIDADE_RUNTIME_UTILS?.resolveGoldenRecordBootstrapPolicy?.({
                    windowObj: window
                }) || {
                    dataUrl: './golden-record-v1.0.2.json',
                    failOpen: true
                };
                return goldenRecordUtils.ensureGoldenRecordLoaded({
                    windowObj: window,
                    fetchFn: (typeof window.fetch === 'function') ? window.fetch.bind(window) : null,
                    consoleObj: console,
                    dataUrl: policy.dataUrl || './golden-record-v1.0.2.json',
                    failOpen: policy.failOpen !== false
                });
            },
            renderAppFn: (typeof renderApp === 'function') ? renderApp : null,
            renderViewFn: (typeof renderView === 'function') ? renderView : null,
            resolveRenderViewNameFn: () => {
                const mgr = (typeof stateManager !== 'undefined') ? stateManager : (window.appState || {});
                return (mgr.get) ? mgr.get('currentView') : (mgr.state ? mgr.state.currentView : 'HOME');
            },
            normalizeTierTagFn: (typeof normalizeTierTag === 'function') ? normalizeTierTag : null,
            ensureUltimateDataPackFn: (typeof ensureUltimateDataPack === 'function') ? ensureUltimateDataPack : null,
            consoleObj: console,
            setTimeoutFn: setTimeout
        });
    }
    return false;
    })();

    try {
        return await window.__ALIDADE_APP_INIT_FLOW_PROMISE__;
    } finally {
        window.__ALIDADE_APP_INIT_FLOW_PROMISE__ = null;
    }
}

// Start app when DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAlidadeApp);
} else {
    initializeAlidadeApp();
}

// Language change listener
window.addEventListener('languagechange', (event) => {
    const lang = event?.detail?.lang || window.i18n?.getCurrentLanguage?.() || document.documentElement.lang || 'en';
    appInitializationDebugLog('[i18n] Language changed to:', lang);
    // Existing integration will handle re-render
});

appInitializationDebugLog('[APP] Event listeners registered');


