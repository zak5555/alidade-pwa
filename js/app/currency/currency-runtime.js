// Extracted from app.js: currency converter runtime block (compatibility-first).

// ---------------------------------------------------------------
// OFFLINE-FIRST CURRENCY CONVERTER SYSTEM
// ---------------------------------------------------------------
// Author: Senior PWA Engineer & Reliability Specialist
// Philosophy: "The Network is a Lie" - Always have a fallback
// Performance Target: Conversions <1ms, API with 5s timeout
// ---------------------------------------------------------------

const currencyRuntimeDebugLog = (...args) => {
    if (window.__ALIDADE_DEBUG_LOGS__ === true) {
        console.log(...args);
    }
};

/**
 * ---------------------------------------------------------------
 * CURRENCY CONFIGURATION
 * Supported currencies with metadata
 * ---------------------------------------------------------------
 */
const CURRENCY_CONFIG = marketCurrencyConfig.CURRENCY_CONFIG || {};

/**
 * Hardcoded fallback rates (last resort)
 * These are approximate rates as of 2024 - better than nothing!
 */
const FALLBACK_RATES = marketCurrencyConfig.FALLBACK_RATES || {};

/**
 * ---------------------------------------------------------------
 * CLASS: CurrencyRateProvider
 * Multi-source rate fetching with 3-tier fallback
 * "Never throw errors - always return a rate"
 * ---------------------------------------------------------------
 */
class CurrencyRateProvider {
    constructor() {
        this.STORAGE_KEY = 'alidade_exchange_rates';
        this.CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours in ms
        this.API_TIMEOUT = 5000; // 5 seconds
        this.REQUIRED_CURRENCIES = ['USD', 'EUR', 'GBP'];

        // Rate sanity bounds (MAD to USD should be ~0.08-0.12)
        this.SANITY_BOUNDS = {
            USD: { min: 0.05, max: 0.15 }
        };

        // Current rates (in-memory cache)
        this._rates = null;
        this._rateSource = null;
        this._lastUpdate = null;

        // Load cached rates on init
        this._loadFromCache();

        currencyRuntimeDebugLog('[CURRENCY] Rate provider initialized');
    }

    async getRates(forceRefresh = false) {
        const currencyCoreUtils = window.ALIDADE_CURRENCY_CORE_UTILS;
        if (currencyCoreUtils && typeof currencyCoreUtils.resolveCurrencyProviderGetRates === 'function') {
            return await currencyCoreUtils.resolveCurrencyProviderGetRates(this, forceRefresh, navigator, console);
        }
        return this._getOfflineRates();
    }

    async _tryExchangeRateApi() {
        const currencyCoreUtils = window.ALIDADE_CURRENCY_CORE_UTILS;
        if (currencyCoreUtils && typeof currencyCoreUtils.resolveCurrencyProviderTryExchangeRateApi === 'function') {
            return await currencyCoreUtils.resolveCurrencyProviderTryExchangeRateApi(
                this,
                fetch,
                AbortController,
                setTimeout,
                clearTimeout,
                console
            );
        }
        return null;
    }

    async _tryFawazahmedApi() {
        const currencyCoreUtils = window.ALIDADE_CURRENCY_CORE_UTILS;
        if (currencyCoreUtils && typeof currencyCoreUtils.resolveCurrencyProviderTryFawazahmedApi === 'function') {
            return await currencyCoreUtils.resolveCurrencyProviderTryFawazahmedApi(
                this,
                fetch,
                AbortController,
                setTimeout,
                clearTimeout,
                console
            );
        }
        return null;
    }

    _getOfflineRates() {
        const currencyCoreUtils = window.ALIDADE_CURRENCY_CORE_UTILS;
        if (currencyCoreUtils && typeof currencyCoreUtils.resolveCurrencyProviderGetOfflineRates === 'function') {
            return currencyCoreUtils.resolveCurrencyProviderGetOfflineRates(this, FALLBACK_RATES, console);
        }

        this._rates = { ...FALLBACK_RATES };
        this._rateSource = 'hardcoded';
        this._lastUpdate = null;
        return this._buildResponse();
    }

    _validateRates(rates) {
        const currencyCoreUtils = window.ALIDADE_CURRENCY_CORE_UTILS;
        if (currencyCoreUtils && typeof currencyCoreUtils.resolveCurrencyProviderValidateRates === 'function') {
            return currencyCoreUtils.resolveCurrencyProviderValidateRates(this, rates, console);
        }
        return false;
    }

    _normalizeRates(rawRates) {
        const currencyCoreUtils = window.ALIDADE_CURRENCY_CORE_UTILS;
        if (currencyCoreUtils && typeof currencyCoreUtils.resolveCurrencyProviderNormalizeRates === 'function') {
            return currencyCoreUtils.resolveCurrencyProviderNormalizeRates(rawRates, CURRENCY_CONFIG, FALLBACK_RATES);
        }
        return {};
    }

    _updateRates(rates, source) {
        const currencyCoreUtils = window.ALIDADE_CURRENCY_CORE_UTILS;
        if (currencyCoreUtils && typeof currencyCoreUtils.resolveCurrencyProviderUpdateRates === 'function') {
            return currencyCoreUtils.resolveCurrencyProviderUpdateRates(this, rates, source);
        }
        return false;
    }

    _saveToCache() {
        const currencyCoreUtils = window.ALIDADE_CURRENCY_CORE_UTILS;
        if (currencyCoreUtils && typeof currencyCoreUtils.resolveCurrencyProviderSaveToCache === 'function') {
            return currencyCoreUtils.resolveCurrencyProviderSaveToCache(this, localStorage, console);
        }
        return false;
    }

    _loadFromCache() {
        const currencyCoreUtils = window.ALIDADE_CURRENCY_CORE_UTILS;
        if (currencyCoreUtils && typeof currencyCoreUtils.resolveCurrencyProviderLoadFromCache === 'function') {
            return currencyCoreUtils.resolveCurrencyProviderLoadFromCache(this, localStorage, console);
        }
        return null;
    }

    _isCacheValid() {
        const currencyCoreUtils = window.ALIDADE_CURRENCY_CORE_UTILS;
        if (currencyCoreUtils && typeof currencyCoreUtils.resolveCurrencyProviderIsCacheValid === 'function') {
            return currencyCoreUtils.resolveCurrencyProviderIsCacheValid(this);
        }
        return false;
    }

    _buildResponse() {
        const currencyCoreUtils = window.ALIDADE_CURRENCY_CORE_UTILS;
        if (currencyCoreUtils && typeof currencyCoreUtils.resolveCurrencyProviderBuildResponse === 'function') {
            return currencyCoreUtils.resolveCurrencyProviderBuildResponse(this, navigator);
        }
        return {};
    }

    getRateAge() {
        const currencyCoreUtils = window.ALIDADE_CURRENCY_CORE_UTILS;
        if (currencyCoreUtils && typeof currencyCoreUtils.resolveCurrencyProviderGetRateAge === 'function') {
            return currencyCoreUtils.resolveCurrencyProviderGetRateAge(this);
        }
        return 'Unknown';
    }

    getStatus() {
        const currencyCoreUtils = window.ALIDADE_CURRENCY_CORE_UTILS;
        if (currencyCoreUtils && typeof currencyCoreUtils.resolveCurrencyProviderGetStatus === 'function') {
            return currencyCoreUtils.resolveCurrencyProviderGetStatus(this, navigator);
        }
        return { icon: '[!]', text: 'Unavailable', detail: 'Currency status unavailable', color: 'crimson' };
    }

    async refresh() {
        return this.getRates(true);
    }
}

/**
 * ---------------------------------------------------------------
 * CLASS: CurrencyConverter
 * Conversion engine with user currency detection
 * Performance: <1ms conversions (pre-loaded rates)
 * ---------------------------------------------------------------
 */
class CurrencyConverter {
    constructor(rateProvider) {
        this.provider = rateProvider;
        this.SETTINGS_KEY = 'alidade_user_currency';
        this._userCurrency = this._detectUserCurrency();
        this._rates = null;
        this._initialized = false;
    }

    async init() {
        const currencyCoreUtils = window.ALIDADE_CURRENCY_CORE_UTILS;
        if (currencyCoreUtils && typeof currencyCoreUtils.resolveCurrencyConverterInit === 'function') {
            return await currencyCoreUtils.resolveCurrencyConverterInit(this, FALLBACK_RATES, console);
        }
        return false;
    }

    _detectUserCurrency() {
        const currencyCoreUtils = window.ALIDADE_CURRENCY_CORE_UTILS;
        if (currencyCoreUtils && typeof currencyCoreUtils.resolveCurrencyConverterDetectUserCurrency === 'function') {
            return currencyCoreUtils.resolveCurrencyConverterDetectUserCurrency(
                this,
                CURRENCY_CONFIG,
                localStorage,
                navigator,
                console
            );
        }
        return 'USD';
    }

    getRate(from, to) {
        const currencyCoreUtils = window.ALIDADE_CURRENCY_CORE_UTILS;
        if (currencyCoreUtils && typeof currencyCoreUtils.resolveCurrencyConverterGetRate === 'function') {
            return currencyCoreUtils.resolveCurrencyConverterGetRate(this, from, to, FALLBACK_RATES, console);
        }
        return from === to ? 1 : 1;
    }

    convert(amount, from = 'MAD', to = null) {
        const currencyCoreUtils = window.ALIDADE_CURRENCY_CORE_UTILS;
        if (currencyCoreUtils && typeof currencyCoreUtils.resolveCurrencyConverterConvert === 'function') {
            return currencyCoreUtils.resolveCurrencyConverterConvert(this, amount, from, to);
        }
        return amount;
    }

    format(amount, currency = null) {
        const currencyCoreUtils = window.ALIDADE_CURRENCY_CORE_UTILS;
        if (currencyCoreUtils && typeof currencyCoreUtils.resolveCurrencyConverterFormat === 'function') {
            return currencyCoreUtils.resolveCurrencyConverterFormat(this, amount, currency, CURRENCY_CONFIG);
        }
        return String(amount);
    }

    getPreview(madAmount, toCurrency = null) {
        const currencyCoreUtils = window.ALIDADE_CURRENCY_CORE_UTILS;
        if (currencyCoreUtils && typeof currencyCoreUtils.resolveCurrencyConverterGetPreview === 'function') {
            return currencyCoreUtils.resolveCurrencyConverterGetPreview(this, madAmount, toCurrency);
        }
        return String(madAmount);
    }

    getSupportedCurrencies() {
        return Object.values(CURRENCY_CONFIG);
    }

    get userCurrency() {
        return this._userCurrency;
    }

    set userCurrency(code) {
        const currencyCoreUtils = window.ALIDADE_CURRENCY_CORE_UTILS;
        if (currencyCoreUtils && typeof currencyCoreUtils.resolveCurrencyConverterSetUserCurrency === 'function') {
            currencyCoreUtils.resolveCurrencyConverterSetUserCurrency(
                this,
                code,
                CURRENCY_CONFIG,
                localStorage,
                console
            );
        }
    }

    getCurrencyConfig(code) {
        return CURRENCY_CONFIG[code] || null;
    }

    async refreshRates() {
        const currencyCoreUtils = window.ALIDADE_CURRENCY_CORE_UTILS;
        if (currencyCoreUtils && typeof currencyCoreUtils.resolveCurrencyConverterRefreshRates === 'function') {
            return await currencyCoreUtils.resolveCurrencyConverterRefreshRates(this, console);
        }
        return null;
    }
}

/**
 * ---------------------------------------------------------------
 * CURRENCY WIDGET UI
 * Floating converter with bidirectional input
 * ---------------------------------------------------------------
 */
class CurrencyWidget {
    constructor(converter) {
        this.converter = converter;
        this.isOpen = false;
        this.debounceTimer = null;
        this.DEBOUNCE_MS = 300;

        // Create widget DOM
        this._createWidget();
        this._attachListeners();

        currencyRuntimeDebugLog('[CURRENCY-WIDGET] Initialized');
    }

    /**
     * Create widget HTML and inject into DOM
     */
    _createWidget() {
        const currencyUiUtils = window.ALIDADE_CURRENCY_UI_UTILS;
        if (currencyUiUtils && typeof currencyUiUtils.resolveCurrencyWidgetCreateWidget === 'function') {
            return currencyUiUtils.resolveCurrencyWidgetCreateWidget(this, document);
        }
        return null;
    }

    /**
     * Widget HTML template
     */
    _getWidgetHTML() {
        const currencyUiUtils = window.ALIDADE_CURRENCY_UI_UTILS;
        if (currencyUiUtils && typeof currencyUiUtils.buildCurrencyWidgetHtml === 'function') {
            return currencyUiUtils.buildCurrencyWidgetHtml(this);
        }
        return '';
    }

    /**
     * Widget CSS styles
     */
    _getWidgetCSS() {
        const currencyUiUtils = window.ALIDADE_CURRENCY_UI_UTILS;
        if (currencyUiUtils && typeof currencyUiUtils.buildCurrencyWidgetCss === 'function') {
            return currencyUiUtils.buildCurrencyWidgetCss();
        }
        return '';
    }

    /**
     * Attach event listeners
     */
    _attachListeners() {
        const currencyUiUtils = window.ALIDADE_CURRENCY_UI_UTILS;
        if (currencyUiUtils && typeof currencyUiUtils.resolveCurrencyWidgetAttachListeners === 'function') {
            return currencyUiUtils.resolveCurrencyWidgetAttachListeners(this, document);
        }
        return false;
    }

    /**
     * Handle MAD input change
     */
    _onMadInput(value) {
        const currencyUiUtils = window.ALIDADE_CURRENCY_UI_UTILS;
        if (currencyUiUtils && typeof currencyUiUtils.resolveCurrencyWidgetOnMadInput === 'function') {
            return currencyUiUtils.resolveCurrencyWidgetOnMadInput(this, value, document);
        }
        return false;
    }

    /**
     * Handle foreign input change
     */
    _onForeignInput(value) {
        const currencyUiUtils = window.ALIDADE_CURRENCY_UI_UTILS;
        if (currencyUiUtils && typeof currencyUiUtils.resolveCurrencyWidgetOnForeignInput === 'function') {
            return currencyUiUtils.resolveCurrencyWidgetOnForeignInput(this, value, document);
        }
        return false;
    }

    /**
     * Handle currency change
     */
    _onCurrencyChange(code) {
        const currencyUiUtils = window.ALIDADE_CURRENCY_UI_UTILS;
        if (currencyUiUtils && typeof currencyUiUtils.resolveCurrencyWidgetOnCurrencyChange === 'function') {
            return currencyUiUtils.resolveCurrencyWidgetOnCurrencyChange(this, code, document);
        }
        return false;
    }

    /**
     * Handle swap button
     */
    _onSwap() {
        const currencyUiUtils = window.ALIDADE_CURRENCY_UI_UTILS;
        if (currencyUiUtils && typeof currencyUiUtils.resolveCurrencyWidgetOnSwap === 'function') {
            return currencyUiUtils.resolveCurrencyWidgetOnSwap(document);
        }
        return false;
    }

    /**
     * Update rate display in footer
     */
    _updateRateDisplay() {
        const currencyUiUtils = window.ALIDADE_CURRENCY_UI_UTILS;
        if (currencyUiUtils && typeof currencyUiUtils.resolveCurrencyWidgetUpdateRateDisplay === 'function') {
            return currencyUiUtils.resolveCurrencyWidgetUpdateRateDisplay(this, document);
        }
        return false;
    }

    /**
     * Update status display
     */
    _updateStatus() {
        const currencyUiUtils = window.ALIDADE_CURRENCY_UI_UTILS;
        if (currencyUiUtils && typeof currencyUiUtils.resolveCurrencyWidgetUpdateStatus === 'function') {
            return currencyUiUtils.resolveCurrencyWidgetUpdateStatus(this, document);
        }
        return false;
    }

    /**
     * Open widget with optional amount
     */
    open(madAmount = null) {
        const currencyUiUtils = window.ALIDADE_CURRENCY_UI_UTILS;
        if (currencyUiUtils && typeof currencyUiUtils.resolveCurrencyWidgetOpen === 'function') {
            return currencyUiUtils.resolveCurrencyWidgetOpen(this, madAmount, document, setTimeout, Haptics);
        }
        return false;
    }

    /**
     * Close widget
     */
    close() {
        const currencyUiUtils = window.ALIDADE_CURRENCY_UI_UTILS;
        if (currencyUiUtils && typeof currencyUiUtils.resolveCurrencyWidgetClose === 'function') {
            return currencyUiUtils.resolveCurrencyWidgetClose(this, Haptics);
        }
        return false;
    }

    /**
     * Toggle widget
     */
    toggle() {
        const currencyUiUtils = window.ALIDADE_CURRENCY_UI_UTILS;
        if (currencyUiUtils && typeof currencyUiUtils.resolveCurrencyWidgetToggle === 'function') {
            return currencyUiUtils.resolveCurrencyWidgetToggle(this);
        }
        return false;
    }

    /**
     * Set amount (for click-to-convert)
     */
    setAmount(madAmount) {
        const currencyUiUtils = window.ALIDADE_CURRENCY_UI_UTILS;
        if (currencyUiUtils && typeof currencyUiUtils.resolveCurrencyWidgetSetAmount === 'function') {
            return currencyUiUtils.resolveCurrencyWidgetSetAmount(this, madAmount, document);
        }
        return false;
    }
}

/**
 * ---------------------------------------------------------------
 * SMART PRICE INTEGRATION
 * Hover previews and click-to-convert on all prices
 * ---------------------------------------------------------------
 */
class PriceIntegration {
    constructor(converter, widget) {
        this.converter = converter;
        this.widget = widget;
        this.tooltip = null;

        this._createTooltip();
        this._attachGlobalListeners();

        currencyRuntimeDebugLog('[PRICE-INTEGRATION] Initialized');
    }

    /**
     * Create hover tooltip element
     */
    _createTooltip() {
        const currencyUiUtils = window.ALIDADE_CURRENCY_UI_UTILS;
        if (currencyUiUtils && typeof currencyUiUtils.resolvePriceIntegrationCreateTooltip === 'function') {
            return currencyUiUtils.resolvePriceIntegrationCreateTooltip(this, document);
        }
        return null;
    }

    /**
     * Attach global event listeners
     */
    _attachGlobalListeners() {
        const currencyUiUtils = window.ALIDADE_CURRENCY_UI_UTILS;
        if (currencyUiUtils && typeof currencyUiUtils.resolvePriceIntegrationAttachGlobalListeners === 'function') {
            return currencyUiUtils.resolvePriceIntegrationAttachGlobalListeners(this, document);
        }
        return false;
    }

    /**
     * Show tooltip with converted price
     */
    _showTooltip(element, madAmount) {
        const currencyUiUtils = window.ALIDADE_CURRENCY_UI_UTILS;
        if (currencyUiUtils && typeof currencyUiUtils.resolvePriceIntegrationShowTooltip === 'function') {
            return currencyUiUtils.resolvePriceIntegrationShowTooltip(this, element, madAmount);
        }
        return false;
    }

    /**
     * Hide tooltip
     */
    _hideTooltip() {
        const currencyUiUtils = window.ALIDADE_CURRENCY_UI_UTILS;
        if (currencyUiUtils && typeof currencyUiUtils.resolvePriceIntegrationHideTooltip === 'function') {
            return currencyUiUtils.resolvePriceIntegrationHideTooltip(this);
        }
        return false;
    }

    /**
     * Enhance price elements with data-price attributes
     * Call this when new price elements are added to DOM
     */
    enhancePrices(container = document) {
        const currencyUiUtils = window.ALIDADE_CURRENCY_UI_UTILS;
        if (currencyUiUtils && typeof currencyUiUtils.resolvePriceIntegrationEnhancePrices === 'function') {
            return currencyUiUtils.resolvePriceIntegrationEnhancePrices(this, container);
        }
        return false;
    }
}

// ---------------------------------------------------------------
// CURRENCY SYSTEM INITIALIZATION
// ---------------------------------------------------------------

// Create instances
const currencyProvider = new CurrencyRateProvider();
const currencyConverter = new CurrencyConverter(currencyProvider);
let currencyWidget = null;
let priceIntegration = null;

// Async initialization
(async function initCurrencySystem() {
    try {
        // Initialize converter (loads rates)
        await currencyConverter.init();

        // Create widget and integration (after DOM ready)
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupCurrencyUI);
        } else {
            setupCurrencyUI();
        }
    } catch (error) {
        console.error('[CURRENCY] Initialization failed:', error);
    }
})();

function setupCurrencyUI() {
    // Create widget
    currencyWidget = new CurrencyWidget(currencyConverter);

    // Create FAB button
    if (!document.getElementById('currency-fab')) {
        const fab = document.createElement('button');
        fab.id = 'currency-fab';
        fab.className = 'currency-fab';
        fab.innerHTML = '💱';
        fab.setAttribute('aria-label', 'Open currency converter');
        fab.addEventListener('click', () => currencyWidget.toggle());
        document.body.appendChild(fab);
    }

    // Create price integration
    priceIntegration = new PriceIntegration(currencyConverter, currencyWidget);

    // Initial enhancement of prices
    priceIntegration.enhancePrices();

    // Auto-refresh rates when coming back online
    window.addEventListener('online', async () => {
        currencyRuntimeDebugLog('[CURRENCY] Back online - refreshing rates');
        await currencyConverter.refreshRates();
        if (currencyWidget) currencyWidget._updateStatus();
    });

    currencyRuntimeDebugLog('[CURRENCY] UI setup complete');
}

// Global utility function
window.convertPrice = function (madAmount, toCurrency = null) {
    if (!currencyConverter) return madAmount;
    return currencyConverter.convert(madAmount, 'MAD', toCurrency || currencyConverter.userCurrency);
};

// Expose currency system globally
window.CurrencyRateProvider = CurrencyRateProvider;
window.CurrencyConverter = CurrencyConverter;
window.currencyProvider = currencyProvider;
window.currencyConverter = currencyConverter;
window.getCurrencyWidget = () => currencyWidget;
window.enhancePrices = (container) => priceIntegration?.enhancePrices(container);

currencyRuntimeDebugLog('[ALIDADE] Currency Converter System Initialized');

// ---------------------------------------------------------------
// INTERACTIVE ARABIC PHRASE ASSISTANT
// ---------------------------------------------------------------
// Author: Lead EdTech Engineer & Computational Linguist
// Philosophy: "Language Bridges" - Every pronunciation is a victory
// Offline-First: 90% functional without network
// ---------------------------------------------------------------

/**
 * ARABIC_PHRASES - 50+ Essential Darija Phrases
 * Refactored with Protocol-7 Standardized Audio Paths (ID_KEYWORD format)
 */
const phraseConfigData = window.ALIDADE_PHRASE_CONFIG || {};
const ARABIC_PHRASES = phraseConfigData.ARABIC_PHRASES || {};

// Flatten phrases for easy search
const ALL_PHRASES = Object.entries(ARABIC_PHRASES).flatMap(([category, phrases]) =>
    phrases.map(p => ({ ...p, category }))
);

currencyRuntimeDebugLog(`[PHRASES] Loaded ${ALL_PHRASES.length} Arabic phrases`);

const BASIC_PHRASE_CATEGORY_KEYS = Object.freeze(['greetings', 'emergency']);
const BASIC_GREETING_FLUENCY_OPEN_IDS = Object.freeze(['g01', 'g04', 'g10']); // Salam, Chukran, Labas-like check-in

function isUltimateTierActive() {
    return normalizeTierTag(USER_TIER || window.USER_TIER || 'BASIC') === 'ULTIMATE';
}

function isGreetingFluencyLocked(phrase) {
    if (isUltimateTierActive()) return false;
    if (!phrase || String(phrase.category || '') !== 'greetings') return false;
    return !BASIC_GREETING_FLUENCY_OPEN_IDS.includes(String(phrase.id || ''));
}

function isPhraseCategoryUnlocked(categoryKey = '') {
    const key = String(categoryKey || '').trim();
    if (!key) return false;
    if (isUltimateTierActive()) return true;
    return BASIC_PHRASE_CATEGORY_KEYS.includes(key);
}

function getAccessiblePhrases() {
    if (isUltimateTierActive()) return ALL_PHRASES;
    return ALL_PHRASES.filter((phrase) => BASIC_PHRASE_CATEGORY_KEYS.includes(phrase.category));
}

function getUnlockedPhraseCategories() {
    return phraseLibrary.getCategories().filter((cat) => isPhraseCategoryUnlocked(cat.key));
}

function getLockedPhraseCategories() {
    return phraseLibrary.getCategories().filter((cat) => !isPhraseCategoryUnlocked(cat.key));
}
