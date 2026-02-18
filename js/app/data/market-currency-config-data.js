/**
 * ALIDADE Market + Currency Config Data
 * Extracted static config constants from app.js.
 */
(function registerAlidadeMarketCurrencyConfig(windowObj) {
    if (!windowObj) return;

    const MARRAKECH_CONSTANTS = {
        // Marrakech coordinates for sunset calculation
        LAT: 31.6295,
        LNG: -7.9811,

        // Souk operating hours (shops typically close ~8-9 PM)
        SOUK_OPEN_HOUR: 9,
        SOUK_CLOSE_HOUR: 20,

        // Peak tourist hours (highest markup)
        PEAK_HOURS: [10, 11, 14, 15, 16],
        OFF_PEAK_HOURS: [9, 12, 13, 18, 19],

        // Tourist seasons (markup multiplier)
        HIGH_SEASON_MONTHS: [3, 4, 10, 11, 12], // March-April, Oct-Dec
        LOW_SEASON_MONTHS: [1, 6, 7, 8], // Jan, June-Aug (too hot)

        // Day of week impact (Friday = holy day, less commerce)
        WEEKEND_DAYS: [5, 6], // Friday, Saturday

        // Item category markups (typical tourist markup)
        ITEM_MARKUPS: {
            leather: { markup: 3.5, touristItem: true, volatility: 0.3 },
            ceramics: { markup: 3.0, touristItem: true, volatility: 0.25 },
            spices: { markup: 2.5, touristItem: true, volatility: 0.2 },
            rugs: { markup: 4.0, touristItem: true, volatility: 0.4 },
            textiles: { markup: 2.8, touristItem: true, volatility: 0.25 },
            jewelry: { markup: 3.5, touristItem: true, volatility: 0.35 },
            lamps: { markup: 3.2, touristItem: true, volatility: 0.3 },
            art: { markup: 4.0, touristItem: false, volatility: 0.5 },
            antiques: { markup: 5.0, touristItem: false, volatility: 0.6 },
            food: { markup: 1.5, touristItem: false, volatility: 0.1 },
            other: { markup: 2.5, touristItem: true, volatility: 0.3 }
        },

        // Souk area characteristics
        SOUK_AREAS: {
            jemaa: {
                touristDensity: 0.95,
                competition: 0.4,
                avgMarkup: 4.0,
                description: 'Main square - highest tourist traffic'
            },
            medina: {
                touristDensity: 0.7,
                competition: 0.8,
                avgMarkup: 2.8,
                description: 'Deep souk - more competition, better deals'
            },
            mellah: {
                touristDensity: 0.5,
                competition: 0.6,
                avgMarkup: 2.5,
                description: 'Jewish quarter - less touristy, authentic'
            },
            gueliz: {
                touristDensity: 0.3,
                competition: 0.3,
                avgMarkup: 1.8,
                description: 'Modern area - fixed prices more common'
            },
            unknown: {
                touristDensity: 0.6,
                competition: 0.5,
                avgMarkup: 3.0,
                description: 'Default souk area'
            }
        }
    };

    const CURRENCY_CONFIG = {
        MAD: { code: 'MAD', name: 'Moroccan Dirham', symbol: 'DH', flag: '🇲🇦' },
        USD: { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
        EUR: { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
        GBP: { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
        JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
        CNY: { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
        AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
        CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
        CHF: { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭' }
    };

    const FALLBACK_RATES = {
        USD: 0.098,  // 1 MAD = ~$0.098
        EUR: 0.091,  // 1 MAD = ~€0.091
        GBP: 0.078,  // 1 MAD = ~£0.078
        JPY: 14.5,   // 1 MAD = ~¥14.5
        CNY: 0.71,   // 1 MAD = ~¥0.71
        AUD: 0.155,  // 1 MAD = ~A$0.155
        CAD: 0.139,  // 1 MAD = ~C$0.139
        CHF: 0.088   // 1 MAD = ~CHF 0.088
    };

    windowObj.ALIDADE_MARKET_CURRENCY_CONFIG = windowObj.ALIDADE_MARKET_CURRENCY_CONFIG || {};
    windowObj.ALIDADE_MARKET_CURRENCY_CONFIG.MARRAKECH_CONSTANTS = MARRAKECH_CONSTANTS;
    windowObj.ALIDADE_MARKET_CURRENCY_CONFIG.CURRENCY_CONFIG = CURRENCY_CONFIG;
    windowObj.ALIDADE_MARKET_CURRENCY_CONFIG.FALLBACK_RATES = FALLBACK_RATES;
})(typeof window !== 'undefined' ? window : null);
