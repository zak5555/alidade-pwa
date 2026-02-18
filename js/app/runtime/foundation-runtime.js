// Extracted from app.js (Batch 205): Core foundation runtime stack
// Includes i18n hooks, StateManager, haptics, global error handlers, skeletons, and animation helpers.

/**
 * ALIDADE™ - Main Application
 */

const foundationDebugLog = (...args) => {
    if (window.__ALIDADE_DEBUG_LOGS__ === true) {
        console.log(...args);
    }
};

// ---------------------------------------------------------------
// INTERNATIONALIZATION (i18n) - Multi-Language Support
// ---------------------------------------------------------------
// EMERGENCY FALLBACK: Prevent "i18n is not defined" errors
if (typeof window.i18n === 'undefined') {
    foundationDebugLog('[APP] i18n not yet loaded, creating temporary fallback');
    window.i18n = {
        __ALIDADE_FALLBACK__: true,
        t: (key, vars, defaultValue) => defaultValue || key.split('.').pop() || key,
        getCurrentLanguage: () => 'en',
        init: async () => { },
        setLanguage: async () => { }
    };
    window.t = window.i18n.t;
}

// NOTE: i18n is loaded properly via index.html module script

// ---------------------------------------------------------------
// STATE MANAGEMENT
// ---------------------------------------------------------------

// ---------------------------------------------------------------
// MAIN APPLICATION
// ---------------------------------------------------------------
'use strict';

// ---------------------------------------------------------------
// CORE: STATE MANAGER (PERSISTENCE ENGINE)
// ---------------------------------------------------------------
class StateManager {
    constructor() {
        this.STORAGE_KEY = 'alidade_app_state_v1';
        this._saveTimer = null; // Debouncing timer
        this.defaultState = {
            version: 1,
            currentView: 'HOME',
            lastUpdate: Date.now(),
            modules: {
                calculator: {
                    price: '',
                    qty: 1,
                    offer: '',
                    selectedItem: null
                },
                haggle: {
                    stage: 1,
                    vendorOffer: 0,
                    shockPrice: 0,
                    fairPrice: 0,
                    walkAwayPrice: 0
                },
                defense: { currentTab: 'threats' },
                forensics: { currentTab: 'argan' },
                vector: { solarMode: false },
                protocols: { currentTab: 'missions' },
                map: { recentLocations: [], savedWaypoints: [], currentPosition: null },
                settings: {
                    hapticsEnabled: true,
                    theme: 'dark',
                    language: 'en'
                }
            }
        };
        this.state = this._loadState();

        // Auto-save on critical events
        window.addEventListener('pagehide', () => this._saveState(true));
        window.addEventListener('blur', () => this._saveState(true));
    }

    _loadState() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            const token = localStorage.getItem('sb-tynugwtetlclqowlguai-auth-token'); // Supabase Auth Token (Project Ref)

            // CACHE TRAP FIX:
            // If we have a valid auth token (user logged in/refreshing), DO NOT trust a stale 'demo' state.
            // This prevents the UI from flashing "DEMO" while waiting for the network race.
            if (token && stored && stored.includes('"tier":"demo"')) {
                console.warn('[STATE] CACHE TRAP DETECTED: Found Auth Token but stale DEMO state. Flushing cache.');
                return JSON.parse(JSON.stringify(this.defaultState));
            }

            if (!stored) return JSON.parse(JSON.stringify(this.defaultState));

            const parsed = JSON.parse(stored);
            // Basic migration check
            if (parsed.version !== this.defaultState.version) {
                console.warn('[STATE] Version mismatch, resetting state.');
                return JSON.parse(JSON.stringify(this.defaultState));
            }
            // Ensure structural integrity
            return this._deepMerge(this.defaultState, parsed);
        } catch (e) {
            console.error('[STATE] Load failed:', e);
            return JSON.parse(JSON.stringify(this.defaultState));
        }
    }

    _saveState(force = false) {
        if (force) {
            if (this.saveTimeout) clearTimeout(this.saveTimeout);
            this._persist();
            return;
        }
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => this._persist(), 500);
    }

    _persist() {
        this.state.lastUpdate = Date.now();
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
        } catch (e) {
            console.error('[STATE] Save failed:', e);
        }
    }

    /**
     * Recursive deep merge to ensure new schema keys (defaultState) 
     * are preserved even if loading an old state object.
     */
    _deepMerge(target, source) {
        const output = { ...target };
        if (isObject(target) && isObject(source)) {
            Object.keys(source).forEach(key => {
                if (isObject(source[key])) {
                    if (!(key in target)) Object.assign(output, { [key]: source[key] });
                    else output[key] = this._deepMerge(target[key], source[key]);
                } else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }
        return output;
    }

    get(path, defaultValue = null) {
        const val = path.split('.').reduce((o, i) => o?.[i], this.state);
        return val !== undefined ? val : defaultValue;
    }

    set(path, value) {
        const keys = path.split('.');
        const last = keys.pop();
        const target = keys.reduce((o, i) => {
            if (!o[i]) o[i] = {};
            return o[i];
        }, this.state);
        if (target) {
            target[last] = value;
            this._saveState();
        }
    }

    // ---------------------------------------------------------------
    // PUBLIC API: ALIDADE INTERFACE
    // ---------------------------------------------------------------
    updateTier(tier) {
        foundationDebugLog(`[STATE] Forcing tier update: ${tier}`);

        // 1. Update Internal State
        // Assuming 'license_tier' is stored in 'settings' or root. 
        // As per user request, we update 'state' variable directly if possible, or specifically wherever 'demo' was coming from.
        // We'll update both a root property and settings just in case.
        this.state.license_tier = tier;
        if (this.state.modules.settings) this.state.modules.settings.tier = tier;

        // 2. Force Immediate Save (Bypass Debounce)
        this._saveState(true);

        // 3. Trigger UI Refresh
        if (typeof window.updateUIByTier === 'function') {
            window.updateUIByTier();
        } else {
            console.warn('[STATE] updateUIByTier not found');
        }
    }

    getModule(moduleName) {
        return this.state.modules[moduleName] || this.defaultState.modules[moduleName];
    }

    setModule(moduleName, data) {
        this.state.modules[moduleName] = { ...this.state.modules[moduleName], ...data };
        this._saveState();
    }
}

// IsObject helper
function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
* ---------------------------------------------------------------
* COMPLETE i18n FIX FOR ALIDADE
* ---------------------------------------------------------------
* 
* YOUR PROBLEM: Language switch doesn't update entire app
* 
* SOLUTION: Replace lines 149-172 in app.js with THIS CODE
* 
* LOCATION: Find this in app.js around line 149:
*     // ---------------------------------------------------------------
*     // i18n INTEGRATION
*     // ---------------------------------------------------------------
* 
* DELETE lines 149-172 and paste THIS instead:
* ---------------------------------------------------------------
*/

// ---------------------------------------------------------------
// i18n INTEGRATION (COMPLETE SOLUTION)
// ---------------------------------------------------------------

window.__ALIDADE_SMOOTH_LANGUAGE_RUNTIME__ = true;

// Placeholder t() function until i18n is ready
window.t = (key, vars, defaultValue) => {
    // Show defaultValue or key name until translations load
    return defaultValue || key.split('.').pop() || key;
};

// When i18n system is ready (triggered from index.html)
window.addEventListener('i18nReady', (event) => {
    if (window.__ALIDADE_I18N_READY_HANDLED__) {
        return;
    }
    window.__ALIDADE_I18N_READY_HANDLED__ = true;

    foundationDebugLog('[APP] i18n ready, language:', event.detail.lang);

    // Expose t() function globally
    window.t = (key, vars, defaultValue) => window.i18n.t(key, vars, defaultValue);

    // Re-render only if the app already painted once with fallback labels.
    const renderedWithRealI18n = window.__ALIDADE_APP_RENDERED_WITH_REAL_I18N__ === true;
    if (window.__ALIDADE_APP_RENDERED__ === true && !renderedWithRealI18n && typeof renderApp === 'function') {
        foundationDebugLog('[APP] Re-rendering with translations...');
        renderApp();
    }
});

// ---------------------------------------------------------------
// SMOOTH LANGUAGE UPDATE (This is what you were missing!)
// ---------------------------------------------------------------

/**
 * Updates language without flickering
 * Only re-renders current view instead of entire app
 */
function updateLanguageInDOM() {
    foundationDebugLog('[i18n] Updating language smoothly...');

    try {
        const currentView = appState?.state?.currentView || appState?.get('currentView') || 'HOME';
        const appContainer = document.querySelector('#app main');

        if (!appContainer) {
            console.warn('[i18n] App container not found, doing full render');
            renderApp();
            return;
        }

        // Save scroll position to restore after update
        const scrollPos = window.scrollY;

        // Re-render only current view (much faster than full app)
        foundationDebugLog('[i18n] Re-rendering view:', currentView);

        switch (currentView) {
            case 'HOME':
                if (typeof renderHome === 'function') {
                    appContainer.innerHTML = renderHome();
                }
                break;
            case 'SHADOW':
                if (typeof renderShadowMeter === 'function') {
                    appContainer.innerHTML = renderShadowMeter();
                }
                break;
            case 'HAGGLE':
                if (typeof renderHaggleWizard === 'function') {
                    appContainer.innerHTML = renderHaggleWizard();
                }
                break;
            case 'DEFENSE':
                if (typeof renderDefenseMatrix === 'function') {
                    appContainer.innerHTML = renderDefenseMatrix();
                }
                break;
            case 'WALLET':
                if (typeof renderWallet === 'function') {
                    appContainer.innerHTML = renderWallet();
                }
                break;
            case 'SETTINGS':
                if (typeof renderSettings === 'function') {
                    appContainer.innerHTML = renderSettings();
                }
                break;
            case 'INTEL':
                if (typeof renderIntel === 'function') {
                    appContainer.innerHTML = renderIntel();
                }
                break;
            case 'FORENSICS':
                if (typeof renderForensics === 'function') {
                    appContainer.innerHTML = renderForensics();
                }
                break;
            case 'VECTOR':
                if (typeof renderVector === 'function') {
                    appContainer.innerHTML = renderVector();
                }
                break;
            case 'PHRASES':
                if (typeof renderPhrases === 'function') {
                    appContainer.innerHTML = renderPhrases();
                }
                break;
            case 'PROTOCOLS':
                if (typeof renderProtocols === 'function') {
                    appContainer.innerHTML = renderProtocols();
                }
                break;
            case 'MAP':
                if (typeof renderMap === 'function') {
                    appContainer.innerHTML = renderMap();
                }
                break;
            case 'SOUK':
                if (typeof renderSouk === 'function') {
                    appContainer.innerHTML = renderSouk();
                }
                break;
            case 'DASHBOARD':
                if (typeof renderDashboard === 'function') {
                    appContainer.innerHTML = renderDashboard();
                }
                break;
            default:
                // Fallback to home
                if (typeof renderHome === 'function') {
                    appContainer.innerHTML = renderHome();
                }
        }

        // Restore scroll position (no jump)
        window.scrollTo(0, scrollPos);

        foundationDebugLog('[i18n] ? Language updated smoothly');

    } catch (err) {
        console.error('[i18n] ? Smooth update failed:', err);
        // Fallback: Full re-render if something goes wrong
        console.warn('[i18n] Falling back to full render...');
        renderApp();
    }
}

// Listen for language changes (triggered by i18n.setLanguage())
window.addEventListener('languagechange', () => {
    foundationDebugLog('[i18n] Language changed event received');

    // Update HTML lang attribute
    const newLang = window.i18n ? window.i18n.getCurrentLanguage() : 'en';
    document.documentElement.lang = newLang;

    // Smooth update (no flicker)
    updateLanguageInDOM();

    // Optional: Show toast notification
    if (typeof showToast === 'function') {
        const langNames = {
            en: 'English',
            fr: 'Français',
            es: 'Español'
        };
        showToast(`${langNames[newLang] || newLang.toUpperCase()} ?`, 'success', 1500);
    }

    // Haptic feedback
    if (window.Haptics?.trigger) {
        window.Haptics.trigger('success');
    }
});

// ---------------------------------------------------------------
// TOAST NOTIFICATIONS (Visual Feedback)
// ---------------------------------------------------------------

function showToast(message, type = 'info', duration = 2000) {
    // Remove existing toast if any
    const existingToast = document.querySelector('.language-toast');
    if (existingToast) {
        existingToast.remove();
    }

    const colors = {
        success: 'bg-signal-emerald',
        info: 'bg-signal-cyan',
        warning: 'bg-signal-amber',
        error: 'bg-signal-crimson'
    };

    const toast = document.createElement('div');
    toast.className = `language-toast fixed bottom-24 left-1/2 transform -translate-x-1/2 
                       ${colors[type] || colors.info} text-void-950 px-6 py-3 rounded-sm 
                       font-mono text-sm font-semibold z-50
                       transition-all duration-300 ease-out`;
    toast.textContent = message;
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, 20px)';

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translate(-50%, 0)';
        }, 10);
    });

    // Animate out and remove
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, 20px)';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}


/**
 * ---------------------------------------------------------------
 * END OF i18n FIX
 * ---------------------------------------------------------------
 * 
 * WHAT TO DO NEXT:
 * 
 * 1. Copy everything above (lines 1-218)
 * 2. Open app.js
 * 3. Find line ~149 (the old i18n section)
 * 4. DELETE lines 149-172
 * 5. PASTE this code instead
 * 6. Save file
 * 
 * THEN ADD LANGUAGE SWITCHER:
 * Continue to next file for Settings integration...
 * ---------------------------------------------------------------
 */
// ---------------------------------------------------------------
// HAPTIC FEEDBACK ENGINE
// ---------------------------------------------------------------

const Haptics = window.Haptics || {
    // Check if vibration is supported
    isSupported: () => 'vibrate' in navigator,
    _userGestureSeen: false,

    // Vibration patterns (milliseconds) - Protocol-7 Specification
    patterns: {
        // Navigation & UI
        light: [10],                    // Quick tap - navigation
        medium: [20],                   // Button press
        heavy: [30],                    // Important action

        // Toggle/switch (double tick)
        double: [10, 50, 10],

        // Protocol-7 Prescribed Patterns
        success: [10],                  // Sharp tick (like watch bezel)
        error: [50, 50, 50],            // Double thud (like mechanism jam)
        warning: [200],                 // Long buzz (attention required)

        // Extended patterns
        confirm: [10, 100, 10, 100, 30], // Confirmation sequence
        alert: [100, 50, 100, 50, 100]   // Alert pattern
    },

    // Trigger haptic feedback
    trigger(type = 'light') {
        // Check if supported
        if (!this.isSupported()) {
            return;
        }

        // Browser blocks vibration until first user interaction
        if (!this._userGestureSeen) {
            return;
        }

        // Check user settings
        const settings = window.appState?.getModule ? window.appState.getModule('settings') : null;
        if (settings && settings.hapticsEnabled === false) {
            return;
        }

        // Trigger vibration
        const pattern = this.patterns[type] || this.patterns.light;
        navigator.vibrate(pattern);

        foundationDebugLog(`[HAPTICS] ${type} feedback`);
    },

    // Cancel all vibrations
    cancel() {
        if (this.isSupported()) {
            navigator.vibrate(0);
        }
    }
};

// Expose globally
window.Haptics = Haptics;

// Unlock haptics after first trusted user action
if (!Haptics._gestureBindingDone) {
    Haptics._gestureBindingDone = true;
    ['pointerdown', 'touchstart', 'keydown'].forEach(evt =>
        window.addEventListener(evt, () => { Haptics._userGestureSeen = true; }, { once: true, passive: true })
    );
}

// ---------------------------------------------------------------
// GLOBAL ERROR HANDLERS - Poka-Yoke Never Fail Silently
// ---------------------------------------------------------------

// List of errors to ignore (already handled locally or benign)
const IGNORED_ERROR_PATTERNS = [
    'ResizeObserver loop',           // Benign browser behavior
    'Script error',                   // Cross-origin scripts
    'VECTOR HUD',                     // Already handled with console.error
    'GPS callback error',             // Handled locally
    'Orientation handler error',      // Handled locally  
    'Solar display error',            // Handled locally
    'Sensor init error',              // Handled locally
    'geolocation',                    // Geolocation permission/timeout
    'deviceorientation',              // Device orientation permission
    'Non-Error promise rejection',    // Benign promise rejections
    'cannot redefine property: ethereum',      // Wallet extensions collision
    'ethereum provider',                        // Wallet injection conflicts
    'channelid missing from script tag',        // Extension script issue
    'could not establish connection',           // Extension background port
    'signal is aborted without reason',         // Aborted network request
];

function shouldShowGlobalError(errorMessage) {
    if (!errorMessage) return false;
    const msg = String(errorMessage).toLowerCase();
    return !IGNORED_ERROR_PATTERNS.some(pattern =>
        msg.includes(pattern.toLowerCase())
    );
}

// Catch uncaught runtime errors
window.addEventListener('error', (event) => {
    const errorMsg = event.error?.message || event.message || '';
    console.error('[ERROR] Uncaught:', event.error || event.message);

    // Only show toast for unhandled/unexpected errors
    if (shouldShowGlobalError(errorMsg)) {
        showErrorToast(
            t('errors.generic', {}, 'An error occurred'),
            'error'
        );
    }

    // Prevent default browser error UI
    event.preventDefault();
});

// Catch unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason?.message || String(event.reason) || '';
    console.error('[ERROR] Unhandled promise:', event.reason);

    // Only show toast for unhandled/unexpected errors
    if (shouldShowGlobalError(reason)) {
        showErrorToast(
            t('errors.generic', {}, 'An error occurred'),
            'error'
        );
    }

    // Prevent browser console warning
    event.preventDefault();
});

// Catch Service Worker errors
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('error', (event) => {
        console.error('[SW ERROR]:', event);
        showErrorToast(
            t('errors.offline', {}, 'Offline functionality unavailable'),
            'warning'
        );
    });
}

// ---------------------------------------------------------------
// ERROR TOAST UI
// ---------------------------------------------------------------

function showErrorToast(message, type = 'error') {
    // Remove existing toast
    const existing = document.getElementById('error-toast');
    if (existing) existing.remove();

    // Create toast
    const colors = {
        error: 'bg-signal-crimson text-white',
        warning: 'bg-signal-amber text-black',
        info: 'bg-signal-cyan text-white',
        success: 'bg-signal-emerald text-black'
    };

    const icons = {
        error: '[X]',
        warning: '[!]',
        info: '[i]',
        success: '[OK]'
    };

    const toast = document.createElement('div');
    toast.id = 'error-toast';
    toast.className = `fixed bottom-4 left-1/2 -translate-x-1/2 z-50 ${colors[type]} px-6 py-4 rounded-machined shadow-void-lg animate-slideUp max-w-md w-[calc(100%-2rem)] md:w-auto`;
    toast.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-2xl">${icons[type]}</span>
                <span class="font-mono text-sm font-medium">${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" 
                        class="ml-auto text-current/60 hover:text-current p-1">
                    x
                </button>
            </div>
        `;

    document.body.appendChild(toast);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('animate-slideDown');
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);

    // Haptic feedback
    if (window.Haptics && type === 'error') {
        window.Haptics.trigger('error');
    }
}

// Expose globally
window.showErrorToast = showErrorToast;

// Initialize Global State
const appState = new StateManager();
window.appState = appState;
foundationDebugLog('[ALIDADE] State Manager Initialized v1');

function initializeAppState() {
    try {
        const savedLang = window.appState?.getModule?.('settings')?.language;
        if (savedLang) {
            document.documentElement.lang = savedLang;
        }
    } catch (e) {
        console.warn('[APP] initializeAppState failed:', e);
    }
}

// Negotiation AI runtime extracted to js/app/negotiation/negotiation-ai-runtime.js

// Currency runtime extracted to js/app/currency/currency-runtime.js

// Phrases runtime extracted to js/app/phrases/phrases-runtime.js
// Backward Compatibility Init
let currentView = appState.get('currentView') || 'HOME';

// ---------------------------------------------------------------
// SKELETON SCREENS (Loading States)
// ---------------------------------------------------------------

const SkeletonScreens = {
    // Generic card skeleton
    card: () => `
            <div class="skeleton-card">
                <div class="skeleton-header"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text short"></div>
            </div>
        `,

    // Map skeleton
    map: () => `
            <div class="skeleton-map">
                <div class="skeleton-map-controls"></div>
                <div class="skeleton-map-canvas"></div>
            </div>
        `,

    // Protocol skeleton
    protocol: () => `
            <div class="skeleton-protocol">
                <div class="skeleton-header large"></div>
                ${Array(5).fill(null).map(() => SkeletonScreens.card()).join('')}
            </div>
        `,

    // Generic list skeleton
    list: () => `
            <div class="skeleton-list">
                ${Array(8).fill(null).map(() => `
                    <div class="skeleton-list-item">
                        <div class="skeleton-icon"></div>
                        <div class="skeleton-text"></div>
                    </div>
                `).join('')}
            </div>
        `
};

function showSkeletonFor(view) {
    const app = document.getElementById('app');

    const skeletons = {
        'HOME': SkeletonScreens.list(),
        'VECTOR': SkeletonScreens.map(),
        'PROTOCOLS': SkeletonScreens.protocol(),
        'NEGOTIATION': SkeletonScreens.card(),
        'DEFENSE': SkeletonScreens.list(),
        'FORENSICS': SkeletonScreens.list(),
        'SETTINGS': SkeletonScreens.list(),
        'PHRASES': SkeletonScreens.list(),
        'DEFAULT': SkeletonScreens.list()
    };

    app.innerHTML = skeletons[view] || skeletons['DEFAULT'];
}

// ---------------------------------------------------------------
// TACTICAL ANIMATION ENGINE - Decrypt Effect (RESTORED)
// ---------------------------------------------------------------

/**
 * Animate value with "decrypt" scramble effect
 */
function animateValue(element, start, end, duration = 500, prefix = '', suffix = '') {
    if (!element) return;

    const scrambleDuration = 500;
    const lockDuration = duration - scrambleDuration;
    const startTime = performance.now();
    const scrambleChars = '0123456789';

    function updateScramble(currentTime) {
        const elapsed = currentTime - startTime;

        if (elapsed < scrambleDuration) {
            const progress = elapsed / scrambleDuration;
            const currentValue = Math.floor(start + (end - start) * progress);
            const valueStr = currentValue.toString();
            let scrambledStr = '';

            for (let i = 0; i < valueStr.length; i++) {
                if (Math.random() > 0.3) {
                    scrambledStr += scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
                } else {
                    scrambledStr += valueStr[i];
                }
            }

            element.textContent = prefix + scrambledStr + suffix;
            element.classList.add('decrypt-text', 'scrambling');
            requestAnimationFrame(updateScramble);
        } else if (elapsed < duration) {
            const lockProgress = (elapsed - scrambleDuration) / lockDuration;
            const currentValue = Math.floor(start + (end - start) * lockProgress);
            element.textContent = prefix + currentValue + suffix;
            requestAnimationFrame(updateScramble);
        } else {
            element.textContent = prefix + end + suffix;
            element.classList.remove('scrambling');
        }
    }

    requestAnimationFrame(updateScramble);
}

/**
 * Animate price range with decrypt effect
 */
function animatePriceDecrypt(element, finalPriceText, duration = 600) {
    if (!element) return;

    const startTime = performance.now();
    const scrambleChars = '0123456789';
    const numbers = finalPriceText.match(/[\d,]+/g) || [];
    const parts = finalPriceText.split(/[\d,]+/);

    function updatePriceDecrypt(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        if (progress < 1) {
            let result = '';
            for (let i = 0; i < parts.length; i++) {
                result += parts[i];
                if (i < numbers.length) {
                    const numStr = numbers[i];
                    let scrambledNum = '';
                    for (let j = 0; j < numStr.length; j++) {
                        if (numStr[j] === ',') {
                            scrambledNum += ',';
                        } else if (Math.random() > 0.4) {
                            scrambledNum += scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
                        } else {
                            scrambledNum += numStr[j];
                        }
                    }
                    result += scrambledNum;
                }
            }
            element.textContent = result;
            element.classList.add('decrypt-text', 'scrambling');
            requestAnimationFrame(updatePriceDecrypt);
        } else {
            element.textContent = finalPriceText;
            element.classList.remove('scrambling');
        }
    }

    requestAnimationFrame(updatePriceDecrypt);
}
