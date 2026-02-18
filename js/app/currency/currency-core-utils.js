(function initAlidadeCurrencyCoreUtils(windowObj) {
    if (!windowObj) return;

    const currencyCoreUtils = windowObj.ALIDADE_CURRENCY_CORE_UTILS || {};

    if (typeof currencyCoreUtils.resolveCurrencyProviderGetRates !== 'function') {
        currencyCoreUtils.resolveCurrencyProviderGetRates = async function resolveCurrencyProviderGetRates(
            provider,
            forceRefresh,
            navigatorObj,
            consoleObj
        ) {
            try {
                if (!forceRefresh && provider._rates && provider._isCacheValid()) {
                    consoleObj.log('[CURRENCY] Using in-memory cache');
                    return provider._buildResponse();
                }

                if (!navigatorObj.onLine) {
                    consoleObj.log('[CURRENCY] Offline - using cached/fallback');
                    return provider._getOfflineRates();
                }

                let rates = null;

                rates = await provider._tryExchangeRateApi();
                if (rates) {
                    provider._updateRates(rates, 'exchangerate-api');
                    return provider._buildResponse();
                }

                rates = await provider._tryFawazahmedApi();
                if (rates) {
                    provider._updateRates(rates, 'fawazahmed0');
                    return provider._buildResponse();
                }

                consoleObj.warn('[CURRENCY] All APIs failed, using fallback');
                return provider._getOfflineRates();
            } catch (error) {
                consoleObj.error('[CURRENCY] Critical error:', error);
                return provider._getOfflineRates();
            }
        };
    }

    if (typeof currencyCoreUtils.resolveCurrencyProviderTryExchangeRateApi !== 'function') {
        currencyCoreUtils.resolveCurrencyProviderTryExchangeRateApi = async function resolveCurrencyProviderTryExchangeRateApi(
            provider,
            fetchFn,
            AbortControllerCtor,
            setTimeoutFn,
            clearTimeoutFn,
            consoleObj
        ) {
            try {
                consoleObj.log('[CURRENCY] Trying exchangerate-api.com...');

                const controller = new AbortControllerCtor();
                const timeout = setTimeoutFn(() => controller.abort(), provider.API_TIMEOUT);

                const response = await fetchFn(
                    'https://api.exchangerate-api.com/v4/latest/MAD',
                    { signal: controller.signal }
                );

                clearTimeoutFn(timeout);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();

                if (!data.rates || typeof data.rates !== 'object') {
                    throw new Error('Invalid response structure');
                }

                if (!provider._validateRates(data.rates)) {
                    throw new Error('Rates failed sanity check');
                }

                consoleObj.log('[CURRENCY] ? exchangerate-api.com success');
                return provider._normalizeRates(data.rates);
            } catch (error) {
                consoleObj.warn('[CURRENCY] exchangerate-api.com failed:', error.message);
                return null;
            }
        };
    }

    if (typeof currencyCoreUtils.resolveCurrencyProviderTryFawazahmedApi !== 'function') {
        currencyCoreUtils.resolveCurrencyProviderTryFawazahmedApi = async function resolveCurrencyProviderTryFawazahmedApi(
            provider,
            fetchFn,
            AbortControllerCtor,
            setTimeoutFn,
            clearTimeoutFn,
            consoleObj
        ) {
            try {
                consoleObj.log('[CURRENCY] Trying fawazahmed0 CDN...');

                const controller = new AbortControllerCtor();
                const timeout = setTimeoutFn(() => controller.abort(), provider.API_TIMEOUT);

                const response = await fetchFn(
                    'https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/mad.json',
                    { signal: controller.signal }
                );

                clearTimeoutFn(timeout);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();

                if (!data.mad || typeof data.mad !== 'object') {
                    throw new Error('Invalid response structure');
                }

                const normalizedRates = {};
                for (const [key, value] of Object.entries(data.mad)) {
                    normalizedRates[key.toUpperCase()] = value;
                }

                if (!provider._validateRates(normalizedRates)) {
                    throw new Error('Rates failed sanity check');
                }

                consoleObj.log('[CURRENCY] ? fawazahmed0 success');
                return provider._normalizeRates(normalizedRates);
            } catch (error) {
                consoleObj.warn('[CURRENCY] fawazahmed0 failed:', error.message);
                return null;
            }
        };
    }

    if (typeof currencyCoreUtils.resolveCurrencyProviderGetOfflineRates !== 'function') {
        currencyCoreUtils.resolveCurrencyProviderGetOfflineRates = function resolveCurrencyProviderGetOfflineRates(
            provider,
            fallbackRates,
            consoleObj
        ) {
            const cached = provider._loadFromCache();
            if (cached && cached.rates) {
                provider._rates = cached.rates;
                provider._rateSource = cached.cacheAge < provider.CACHE_TTL ? 'cached' : 'stale-cache';
                provider._lastUpdate = cached.timestamp;
                consoleObj.log(`[CURRENCY] Using ${provider._rateSource} rates`);
                return provider._buildResponse();
            }

            consoleObj.log('[CURRENCY] Using hardcoded fallback rates');
            provider._rates = { ...fallbackRates };
            provider._rateSource = 'hardcoded';
            provider._lastUpdate = null;
            return provider._buildResponse();
        };
    }

    if (typeof currencyCoreUtils.resolveCurrencyProviderValidateRates !== 'function') {
        currencyCoreUtils.resolveCurrencyProviderValidateRates = function resolveCurrencyProviderValidateRates(
            provider,
            rates,
            consoleObj
        ) {
            for (const curr of provider.REQUIRED_CURRENCIES) {
                if (typeof rates[curr] !== 'number' || rates[curr] <= 0) {
                    consoleObj.warn(`[CURRENCY] Missing/invalid ${curr} rate`);
                    return false;
                }
            }

            const usdRate = rates.USD;
            const bounds = provider.SANITY_BOUNDS.USD;
            if (usdRate < bounds.min || usdRate > bounds.max) {
                consoleObj.warn(`[CURRENCY] USD rate ${usdRate} outside sanity bounds [${bounds.min}, ${bounds.max}]`);
                return false;
            }

            return true;
        };
    }

    if (typeof currencyCoreUtils.resolveCurrencyProviderNormalizeRates !== 'function') {
        currencyCoreUtils.resolveCurrencyProviderNormalizeRates = function resolveCurrencyProviderNormalizeRates(
            rawRates,
            currencyConfig,
            fallbackRates
        ) {
            const normalized = {};
            for (const code of Object.keys(currencyConfig)) {
                if (code === 'MAD') continue;
                if (rawRates[code] !== undefined) {
                    normalized[code] = rawRates[code];
                } else if (fallbackRates[code] !== undefined) {
                    normalized[code] = fallbackRates[code];
                }
            }
            return normalized;
        };
    }

    if (typeof currencyCoreUtils.resolveCurrencyProviderUpdateRates !== 'function') {
        currencyCoreUtils.resolveCurrencyProviderUpdateRates = function resolveCurrencyProviderUpdateRates(provider, rates, source) {
            provider._rates = rates;
            provider._rateSource = source;
            provider._lastUpdate = Date.now();
            provider._saveToCache();
            return true;
        };
    }

    if (typeof currencyCoreUtils.resolveCurrencyProviderSaveToCache !== 'function') {
        currencyCoreUtils.resolveCurrencyProviderSaveToCache = function resolveCurrencyProviderSaveToCache(
            provider,
            localStorageObj,
            consoleObj
        ) {
            try {
                const cacheData = {
                    rates: provider._rates,
                    source: provider._rateSource,
                    timestamp: provider._lastUpdate
                };
                localStorageObj.setItem(provider.STORAGE_KEY, JSON.stringify(cacheData));
                consoleObj.log('[CURRENCY] Rates cached to localStorage');
                return true;
            } catch (error) {
                consoleObj.warn('[CURRENCY] Cache save failed:', error);
                return false;
            }
        };
    }

    if (typeof currencyCoreUtils.resolveCurrencyProviderLoadFromCache !== 'function') {
        currencyCoreUtils.resolveCurrencyProviderLoadFromCache = function resolveCurrencyProviderLoadFromCache(
            provider,
            localStorageObj,
            consoleObj
        ) {
            try {
                const cached = localStorageObj.getItem(provider.STORAGE_KEY);
                if (!cached) return null;

                const data = JSON.parse(cached);
                if (!data.rates || !data.timestamp) return null;

                const cacheAge = Date.now() - data.timestamp;

                if (cacheAge < provider.CACHE_TTL) {
                    provider._rates = data.rates;
                    provider._rateSource = 'cached';
                    provider._lastUpdate = data.timestamp;
                }

                return { ...data, cacheAge };
            } catch (error) {
                consoleObj.warn('[CURRENCY] Cache load failed:', error);
                return null;
            }
        };
    }

    if (typeof currencyCoreUtils.resolveCurrencyProviderIsCacheValid !== 'function') {
        currencyCoreUtils.resolveCurrencyProviderIsCacheValid = function resolveCurrencyProviderIsCacheValid(provider) {
            if (!provider._lastUpdate) return false;
            return (Date.now() - provider._lastUpdate) < provider.CACHE_TTL;
        };
    }

    if (typeof currencyCoreUtils.resolveCurrencyProviderBuildResponse !== 'function') {
        currencyCoreUtils.resolveCurrencyProviderBuildResponse = function resolveCurrencyProviderBuildResponse(provider, navigatorObj) {
            return {
                rates: provider._rates,
                source: provider._rateSource,
                timestamp: provider._lastUpdate,
                isStale: provider._rateSource === 'stale-cache' || provider._rateSource === 'hardcoded',
                isOffline: !navigatorObj.onLine
            };
        };
    }

    if (typeof currencyCoreUtils.resolveCurrencyProviderGetRateAge !== 'function') {
        currencyCoreUtils.resolveCurrencyProviderGetRateAge = function resolveCurrencyProviderGetRateAge(provider) {
            if (!provider._lastUpdate) return 'Unknown';

            const ageMs = Date.now() - provider._lastUpdate;
            const ageMinutes = Math.floor(ageMs / 60000);
            const ageHours = Math.floor(ageMinutes / 60);

            if (ageMinutes < 1) return 'Just now';
            if (ageMinutes < 60) return `${ageMinutes}m ago`;
            if (ageHours < 24) return `${ageHours}h ago`;
            return `${Math.floor(ageHours / 24)}d ago`;
        };
    }

    if (typeof currencyCoreUtils.resolveCurrencyProviderGetStatus !== 'function') {
        currencyCoreUtils.resolveCurrencyProviderGetStatus = function resolveCurrencyProviderGetStatus(provider, navigatorObj) {
            if (!navigatorObj.onLine) {
                return {
                    icon: '🔌',
                    text: 'Offline',
                    detail: provider._rateSource === 'stale-cache'
                        ? `Cached rates (${provider.getRateAge()})`
                        : 'Using backup rates',
                    color: 'amber'
                };
            }

            if (provider._rateSource === 'hardcoded') {
                return {
                    icon: '⚠️',
                    text: 'Backup Rates',
                    detail: 'Refresh when online',
                    color: 'crimson'
                };
            }

            if (provider._rateSource === 'stale-cache') {
                return {
                    icon: '🕰️',
                    text: 'Stale Cache',
                    detail: `${provider.getRateAge()}, refreshing...`,
                    color: 'amber'
                };
            }

            return {
                icon: '🟢',
                text: 'Live Rates',
                detail: `Updated ${provider.getRateAge()}`,
                color: 'emerald'
            };
        };
    }

    if (typeof currencyCoreUtils.resolveCurrencyConverterInit !== 'function') {
        currencyCoreUtils.resolveCurrencyConverterInit = async function resolveCurrencyConverterInit(
            converter,
            fallbackRates,
            consoleObj
        ) {
            try {
                const result = await converter.provider.getRates();
                converter._rates = result.rates;
                converter._initialized = true;
                consoleObj.log('[CONVERTER] Initialized with rates from:', result.source);
                return true;
            } catch (error) {
                consoleObj.error('[CONVERTER] Init failed:', error);
                converter._rates = { ...fallbackRates };
                converter._initialized = true;
                return false;
            }
        };
    }

    if (typeof currencyCoreUtils.resolveCurrencyConverterDetectUserCurrency !== 'function') {
        currencyCoreUtils.resolveCurrencyConverterDetectUserCurrency = function resolveCurrencyConverterDetectUserCurrency(
            converter,
            currencyConfig,
            localStorageObj,
            navigatorObj,
            consoleObj
        ) {
            try {
                const saved = localStorageObj.getItem(converter.SETTINGS_KEY);
                if (saved && currencyConfig[saved]) {
                    consoleObj.log('[CONVERTER] Using saved currency:', saved);
                    return saved;
                }
            } catch (e) {
                void e;
            }

            try {
                const locale = navigatorObj.language || navigatorObj.userLanguage || 'en-US';
                const regionCode = locale.split('-')[1];

                const regionToCurrency = {
                    US: 'USD', GB: 'GBP', UK: 'GBP',
                    FR: 'EUR', DE: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR',
                    BE: 'EUR', AT: 'EUR', IE: 'EUR', PT: 'EUR', FI: 'EUR',
                    JP: 'JPY', CN: 'CNY', AU: 'AUD', CA: 'CAD', CH: 'CHF'
                };

                if (regionCode && regionToCurrency[regionCode]) {
                    consoleObj.log('[CONVERTER] Auto-detected currency:', regionToCurrency[regionCode]);
                    return regionToCurrency[regionCode];
                }
            } catch (e) {
                void e;
            }

            consoleObj.log('[CONVERTER] Defaulting to USD');
            return 'USD';
        };
    }

    if (typeof currencyCoreUtils.resolveCurrencyConverterGetRate !== 'function') {
        currencyCoreUtils.resolveCurrencyConverterGetRate = function resolveCurrencyConverterGetRate(
            converter,
            from,
            to,
            fallbackRates,
            consoleObj
        ) {
            if (from === to) return 1;

            if (!converter._rates) {
                converter._rates = { ...fallbackRates };
            }

            if (from === 'MAD' && converter._rates[to]) {
                return converter._rates[to];
            }

            if (to === 'MAD' && converter._rates[from]) {
                return 1 / converter._rates[from];
            }

            if (converter._rates[from] && converter._rates[to]) {
                const madPerFrom = 1 / converter._rates[from];
                return madPerFrom * converter._rates[to];
            }

            consoleObj.warn(`[CONVERTER] No rate for ${from}?${to}`);
            return 1;
        };
    }

    if (typeof currencyCoreUtils.resolveCurrencyConverterConvert !== 'function') {
        currencyCoreUtils.resolveCurrencyConverterConvert = function resolveCurrencyConverterConvert(converter, amount, from, to) {
            const target = to || converter._userCurrency;
            const rate = converter.getRate(from, target);
            const result = amount * rate;
            if (target === 'JPY') {
                return Math.round(result);
            }
            return Math.round(result * 100) / 100;
        };
    }

    if (typeof currencyCoreUtils.resolveCurrencyConverterFormat !== 'function') {
        currencyCoreUtils.resolveCurrencyConverterFormat = function resolveCurrencyConverterFormat(
            converter,
            amount,
            currency,
            currencyConfig
        ) {
            const target = currency || converter._userCurrency;
            const config = currencyConfig[target] || currencyConfig.USD;
            const converted = typeof amount === 'number'
                ? (target === 'JPY' ? Math.round(amount) : amount.toFixed(2))
                : amount;

            if (target === 'EUR') {
                return `€${converted}`;
            }
            if (target === 'JPY' || target === 'CNY') {
                return `¥${converted}`;
            }
            return `${config.symbol}${converted}`;
        };
    }

    if (typeof currencyCoreUtils.resolveCurrencyConverterGetPreview !== 'function') {
        currencyCoreUtils.resolveCurrencyConverterGetPreview = function resolveCurrencyConverterGetPreview(converter, madAmount, toCurrency) {
            const target = toCurrency || converter._userCurrency;
            const converted = converter.convert(madAmount, 'MAD', target);
            return `˜ ${converter.format(converted, target)}`;
        };
    }

    if (typeof currencyCoreUtils.resolveCurrencyConverterSetUserCurrency !== 'function') {
        currencyCoreUtils.resolveCurrencyConverterSetUserCurrency = function resolveCurrencyConverterSetUserCurrency(
            converter,
            code,
            currencyConfig,
            localStorageObj,
            consoleObj
        ) {
            if (currencyConfig[code]) {
                converter._userCurrency = code;
                try {
                    localStorageObj.setItem(converter.SETTINGS_KEY, code);
                } catch (e) {
                    void e;
                }
                consoleObj.log('[CONVERTER] User currency set to:', code);
                return true;
            }
            return false;
        };
    }

    if (typeof currencyCoreUtils.resolveCurrencyConverterRefreshRates !== 'function') {
        currencyCoreUtils.resolveCurrencyConverterRefreshRates = async function resolveCurrencyConverterRefreshRates(converter, consoleObj) {
            try {
                const result = await converter.provider.refresh();
                converter._rates = result.rates;
                return result;
            } catch (error) {
                consoleObj.error('[CONVERTER] Refresh failed:', error);
                return null;
            }
        };
    }

    windowObj.ALIDADE_CURRENCY_CORE_UTILS = currencyCoreUtils;
})(typeof window !== 'undefined' ? window : null);
