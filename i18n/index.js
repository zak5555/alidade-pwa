/**
 * ALIDADE i18n Controller
 * ═══════════════════════════════════════════════════════════════
 * Poka-Yoke Multi-Language System
 * 
 * Principles Applied:
 * 1. Lazy loading (no upfront cost)
 * 2. Fail-safe fallbacks (never crash)
 * 3. Performance cache (O(1) lookups)
 * 4. Auto-detection (smart defaults)
 * 
 * Bundle Impact: ~8KB (controller only)
 * Language Files: ~45KB each (loaded on demand)
 * ═══════════════════════════════════════════════════════════════
 */

const i18nDebugLog = (...args) => {
    if (typeof window !== 'undefined' && window.__ALIDADE_DEBUG_LOGS__ === true) {
        console.log(...args);
    }
};

class I18n {
    constructor() {
        this.currentLang = null;
        this.translations = {};
        this.cache = {}; // Flattened key cache for O(1) lookup
        this.fallbackLang = 'en';
        this.STORAGE_KEY = 'alidade_language';
        this.SUPPORTED = ['en', 'fr', 'es'];
        this._initialized = false;
        this._initPromise = null;

        i18nDebugLog('[i18n] Controller initialized');
    }

    /**
     * Initialize the i18n system
     * Call this once on app startup
     */
    async init() {
        if (this._initialized) return;
        if (this._initPromise) return this._initPromise;

        this._initPromise = this._doInit();
        return this._initPromise;
    }

    async _doInit() {
        try {
            // Always load English first (fallback)
            await this._loadLanguageFile('en');

            // Detect and load user's preferred language
            const detectedLang = this._detectLanguage();

            if (detectedLang !== 'en') {
                await this._loadLanguageFile(detectedLang);
            }

            this.currentLang = detectedLang;
            this._rebuildCache();
            this._initialized = true;

            i18nDebugLog(`[i18n] ✅ Initialized with ${this.currentLang} (${Object.keys(this.cache).length} keys)`);

            return true;
        } catch (error) {
            console.error('[i18n] ❌ Initialization failed:', error);
            // Poka-Yoke: Even on failure, we can work with hardcoded English
            this.currentLang = 'en';
            this._initialized = true;
            return false;
        }
    }

    /**
     * Poka-Yoke: Multi-source detection with priority
     * 1. localStorage (user preference)
     * 2. URL param (?lang=fr)
     * 3. Browser language
     * 4. Fallback to English
     */
    _detectLanguage() {
        let lang = null;

        // Priority 1: Saved preference
        try {
            lang = localStorage.getItem(this.STORAGE_KEY);
            if (lang && this.SUPPORTED.includes(lang)) {
                i18nDebugLog('[i18n] Using saved preference:', lang);
                return lang;
            }
        } catch (e) { /* localStorage may be blocked */ }

        // Priority 2: URL parameter
        try {
            const urlParams = new URLSearchParams(window.location.search);
            lang = urlParams.get('lang');
            if (lang && this.SUPPORTED.includes(lang)) {
                i18nDebugLog('[i18n] Using URL param:', lang);
                return lang;
            }
        } catch (e) { /* URL parsing failed */ }

        // Priority 3: Browser language
        try {
            const browserLang = (navigator.language || navigator.userLanguage || 'en').split('-')[0];
            if (this.SUPPORTED.includes(browserLang)) {
                i18nDebugLog('[i18n] Using browser language:', browserLang);
                return browserLang;
            }
        } catch (e) { /* Navigator not available */ }

        // Priority 4: Fallback
        i18nDebugLog('[i18n] Using fallback:', this.fallbackLang);
        return this.fallbackLang;
    }

    /**
     * Load a language file dynamically
     * Poka-Yoke: Never fails - returns empty object on error
     */
    async _loadLanguageFile(lang) {
        if (this.translations[lang]) {
            return this.translations[lang];
        }

        try {
            i18nDebugLog(`[i18n] Loading ${lang}.js...`);

            // Dynamic import for lazy loading
            const module = await import(`./${lang}.js`);
            this.translations[lang] = module.default;

            i18nDebugLog(`[i18n] ✅ Loaded ${lang}.js`);
            return this.translations[lang];

        } catch (error) {
            console.error(`[i18n] ❌ Failed to load ${lang}.js:`, error);

            // Poka-Yoke: Return empty object, don't crash
            this.translations[lang] = {};
            return {};
        }
    }

    /**
     * Poka-Yoke: Set language with lazy load + cache + fallback
     */
    async setLanguage(lang) {
        // Validate language
        if (!this.SUPPORTED.includes(lang)) {
            console.warn(`[i18n] Unsupported language: ${lang}, using ${this.fallbackLang}`);
            lang = this.fallbackLang;
        }

        // Skip if same language
        if (lang === this.currentLang) {
            return;
        }

        try {
            // Load language file if not cached
            if (!this.translations[lang]) {
                await this._loadLanguageFile(lang);
            }

            // Set as current
            this.currentLang = lang;
            this._rebuildCache();

            // Persist choice
            try {
                localStorage.setItem(this.STORAGE_KEY, lang);
            } catch (e) { /* localStorage may be blocked */ }

            i18nDebugLog(`[i18n] ✅ Switched to ${lang}`);

            // Trigger re-render
            this._onLanguageChange();

        } catch (error) {
            console.error(`[i18n] ❌ Failed to set ${lang}:`, error);

            // Poka-Yoke: Fallback to English
            if (lang !== this.fallbackLang) {
                console.warn(`[i18n] Falling back to ${this.fallbackLang}`);
                await this.setLanguage(this.fallbackLang);
            }
        }
    }

    /**
     * Poka-Yoke: Flatten nested translations for O(1) lookup
     * Input:  { haggle: { shock: { label: "Price" } } }
     * Output: { "haggle.shock.label": "Price" }
     */
    _rebuildCache() {
        this.cache = {};

        const flatten = (obj, prefix = '') => {
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    const newKey = prefix ? `${prefix}.${key}` : key;
                    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                        flatten(obj[key], newKey);
                    } else {
                        this.cache[newKey] = obj[key];
                    }
                }
            }
        };

        if (this.translations[this.currentLang]) {
            flatten(this.translations[this.currentLang]);
        }
    }

    /**
     * Build fallback cache for English
     */
    _getFallbackCache() {
        if (!this.translations[this.fallbackLang]) {
            return {};
        }

        const cache = {};
        const flatten = (obj, prefix = '') => {
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    const newKey = prefix ? `${prefix}.${key}` : key;
                    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                        flatten(obj[key], newKey);
                    } else {
                        cache[newKey] = obj[key];
                    }
                }
            }
        };

        flatten(this.translations[this.fallbackLang]);
        return cache;
    }

    /**
     * Poka-Yoke: 3-tier fallback translation function
     * t('haggle.shock.label') -> 
     *   1. Try current language
     *   2. Try English
     *   3. Return defaultValue (if provided)
     *   4. Return key suffix (last resort)
     */
    t(key, vars = {}, defaultValue = null) {
        const debugLogs = typeof window !== 'undefined' && window.__ALIDADE_DEBUG_LOGS__ === true;
        // Tier 1: Current language
        let text = this.cache[key];

        // Tier 2: Fallback to English
        if (text === undefined && this.currentLang !== this.fallbackLang) {
            const fallbackCache = this._getFallbackCache();
            text = fallbackCache[key];

            if (text !== undefined) {
                // Log missing translation (dev mode hint)
                if (debugLogs) {
                    console.debug(`[i18n] Using fallback for: ${key}`);
                }
            }
        }

        // Tier 3: Default Value or Error state
        if (text === undefined) {
            // If a specific default value is provided (e.g. for error messages), use it
            if (defaultValue) return defaultValue;

            // Fail-safe for critical errors
            if (key === 'errors.generic') {
                return "An error occurred. Please try again.";
            }

            // Development: show visible error
            const isDev = window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1';

            if (isDev) {
                if (debugLogs) {
                    console.warn(`[i18n] ⚠️ Missing translation: ${key}`);
                }
                return `[MISSING: ${key}]`;
            }

            // Production: return key as-is (better than nothing)
            return key.split('.').pop() || key;
        }

        // Variable interpolation: "Hello {name}" + {name: "Ali"} -> "Hello Ali"
        return this._interpolate(text, vars);
    }

    /**
     * Poka-Yoke: Safe variable interpolation
     * Input:  ("Price: {amount} DH", {amount: 350})
     * Output: "Price: 350 DH"
     */
    _interpolate(text, vars) {
        if (!text || typeof text !== 'string') return text;
        if (!vars || Object.keys(vars).length === 0) return text;

        return text.replace(/\{(\w+)\}/g, (match, key) => {
            return vars[key] !== undefined ? vars[key] : match;
        });
    }

    /**
     * Hook for UI updates when language changes
     */
    _onLanguageChange() {
        // Haptic feedback
        if (window.Haptics) {
            window.Haptics.trigger('success');
        }

        // Dispatch event for components to re-render
        window.dispatchEvent(new CustomEvent('languagechange', {
            detail: { lang: this.currentLang }
        }));

        // Update HTML lang attribute
        document.documentElement.lang = this.currentLang;
    }

    /**
     * Public API: Get current language
     */
    getCurrentLanguage() {
        return this.currentLang || this.fallbackLang;
    }

    /**
     * Public API: Get available languages with metadata
     */
    getAvailableLanguages() {
        return [
            { code: 'en', name: 'English', flag: '🇬🇧', native: 'English' },
            { code: 'fr', name: 'French', flag: '🇫🇷', native: 'Français' },
            { code: 'es', name: 'Spanish', flag: '🇪🇸', native: 'Español' }
        ];
    }

    /**
     * Public API: Check if language is supported
     */
    isSupported(lang) {
        return this.SUPPORTED.includes(lang);
    }

    /**
     * Public API: Get translation count for current language
     */
    getKeyCount() {
        return Object.keys(this.cache).length;
    }

    /**
     * Public API: Check if a key exists
     */
    hasKey(key) {
        return this.cache[key] !== undefined;
    }

    /**
     * Debug: Get all keys
     */
    getAllKeys() {
        return Object.keys(this.cache);
    }

    /**
     * Debug: Get translation stats
     */
    getStats() {
        const enKeys = this._getFallbackCache();
        const currentKeys = this.cache;

        const enCount = Object.keys(enKeys).length;
        const currentCount = Object.keys(currentKeys).length;
        const coverage = enCount > 0 ? Math.round((currentCount / enCount) * 100) : 100;

        return {
            currentLang: this.currentLang,
            keyCount: currentCount,
            masterKeyCount: enCount,
            coverage: `${coverage}%`,
            loadedLanguages: Object.keys(this.translations)
        };
    }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON INSTANCE & GLOBAL EXPORTS
// ═══════════════════════════════════════════════════════════════

const i18n = new I18n();

// Expose globally for use in HTML and JS
window.i18n = i18n;

// Shorthand translation function
window.t = function (key, vars) {
    return i18n.t(key, vars);
};

// Export for module usage
export default i18n;
export { i18n, I18n };
