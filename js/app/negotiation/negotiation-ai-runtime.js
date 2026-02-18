// Extracted from app.js: negotiation AI core block (compatibility-first).

// ---------------------------------------------------------------
// AI NEGOTIATION SYSTEM - THE "DIGITAL BRAIN"
// ---------------------------------------------------------------
// Author: Senior Product Architect & Game Theory Specialist
// Purpose: Context-aware negotiation AI with 25+ feature extraction
// Performance Target: All calculations < 50ms (O(1) to O(n))
// ---------------------------------------------------------------

const negotiationAiDebugLog = (...args) => {
    if (window.__ALIDADE_DEBUG_LOGS__ === true) {
        console.log(...args);
    }
};

/**
 * ---------------------------------------------------------------
 * MARRAKECH MARKET DATA - Pre-computed Constants
 * "The Souk Psychology" - Environmental intelligence
 * ---------------------------------------------------------------
 */
const marketCurrencyConfig = window.ALIDADE_MARKET_CURRENCY_CONFIG || {};
const MARRAKECH_CONSTANTS = marketCurrencyConfig.MARRAKECH_CONSTANTS || {
    LAT: 31.6295,
    LNG: -7.9811,
    SOUK_OPEN_HOUR: 9,
    SOUK_CLOSE_HOUR: 20,
    PEAK_HOURS: [],
    OFF_PEAK_HOURS: [],
    HIGH_SEASON_MONTHS: [],
    LOW_SEASON_MONTHS: [],
    WEEKEND_DAYS: [],
    ITEM_MARKUPS: {
        other: { markup: 2.5, touristItem: true, volatility: 0.3 }
    },
    SOUK_AREAS: {
        unknown: {
            touristDensity: 0.6,
            competition: 0.5,
            avgMarkup: 3.0,
            description: 'Default souk area'
        }
    }
};

/**
 * ---------------------------------------------------------------
 * CLASS: NegotiationContext
 * Extracts 25+ environmental features from current context
 * All calculations are O(1) - instant feature extraction
 * ---------------------------------------------------------------
 */
class NegotiationContext {
    constructor(vendorOffer, options = {}) {
        // Core input
        this.vendorOffer = vendorOffer || 0;
        this.itemType = options.itemType || 'other';
        this.soukArea = options.soukArea || 'unknown';

        // Timestamps (performance critical - cache once)
        this.now = new Date();
        this.timestamp = this.now.getTime();

        // Extract all features on construction (cached)
        this.features = this._extractAllFeatures();
    }

    /**
     * Master feature extraction - runs once on construction
     * Returns object with all 25+ features
     * Complexity: O(1) - all calculations are constant time
     */
    _extractAllFeatures() {
        const startTime = performance.now();

        const features = {
            // --- TEMPORAL FEATURES (7) ---
            ...this._extractTemporalFeatures(),

            // --- LOCATION FEATURES (4) ---
            ...this._extractLocationFeatures(),

            // --- ITEM FEATURES (5) ---
            ...this._extractItemFeatures(),

            // --- USER HISTORY FEATURES (5) ---
            ...this._extractUserHistoryFeatures(),

            // --- VENDOR SIGNAL FEATURES (3) ---
            ...this._extractVendorSignals(),

            // --- PSYCHOLOGICAL FEATURES (3) ---
            ...this._extractPsychologicalFeatures()
        };

        // Performance tracking
        features._extractionTimeMs = performance.now() - startTime;
        features._featureCount = Object.keys(features).filter(k => !k.startsWith('_')).length;

        negotiationAiDebugLog(`[NEGO-AI] Extracted ${features._featureCount} features in ${features._extractionTimeMs.toFixed(2)}ms`);

        return features;
    }

    /**
     * TEMPORAL FEATURES
     * Time-based signals that affect vendor behavior
     */
    _extractTemporalFeatures() {
        const hour = this.now.getHours();
        const minute = this.now.getMinutes();
        const dayOfWeek = this.now.getDay(); // 0 = Sunday
        const month = this.now.getMonth() + 1; // 1-12

        // Calculate minutes until sunset (approximate)
        const sunsetHour = this._calculateSunsetHour(month);
        const minutesUntilSunset = Math.max(0, (sunsetHour * 60) - (hour * 60 + minute));

        // Calculate minutes until closing (8 PM)
        const closeTime = MARRAKECH_CONSTANTS.SOUK_CLOSE_HOUR;
        const minutesUntilClose = Math.max(0, (closeTime * 60) - (hour * 60 + minute));

        // Is it closing time? (last 60 minutes)
        const isClosingTime = minutesUntilClose > 0 && minutesUntilClose <= 60;

        // Is it golden hour? (last 90 minutes before sunset)
        const isGoldenHour = minutesUntilSunset > 0 && minutesUntilSunset <= 90;

        // Peak vs off-peak hours
        const isPeakHour = MARRAKECH_CONSTANTS.PEAK_HOURS.includes(hour);
        const isOffPeakHour = MARRAKECH_CONSTANTS.OFF_PEAK_HOURS.includes(hour);

        // Weekend factor (Friday = holy day)
        const isWeekend = MARRAKECH_CONSTANTS.WEEKEND_DAYS.includes(dayOfWeek);
        const isFriday = dayOfWeek === 5;

        // Season factor
        const isHighSeason = MARRAKECH_CONSTANTS.HIGH_SEASON_MONTHS.includes(month);
        const isLowSeason = MARRAKECH_CONSTANTS.LOW_SEASON_MONTHS.includes(month);

        // Time pressure score (0-1, higher = more pressure on vendor)
        const timePressureScore = this._calculateTimePressure(
            minutesUntilClose,
            minutesUntilSunset,
            isClosingTime
        );

        return {
            currentHour: hour,
            currentMinute: minute,
            dayOfWeek,
            month,
            minutesUntilSunset,
            minutesUntilClose,
            isClosingTime,
            isGoldenHour,
            isPeakHour,
            isOffPeakHour,
            isWeekend,
            isFriday,
            isHighSeason,
            isLowSeason,
            timePressureScore
        };
    }

    /**
     * Calculate approximate sunset hour for Marrakech
     * Uses simplified formula (accurate to ~10 minutes)
     */
    _calculateSunsetHour(month) {
        // Marrakech sunset varies from ~17:30 (Dec) to ~20:30 (June)
        const sunsetTimes = {
            1: 17.75, 2: 18.25, 3: 18.75, 4: 19.25, 5: 19.75, 6: 20.25,
            7: 20.25, 8: 19.75, 9: 19.0, 10: 18.25, 11: 17.5, 12: 17.5
        };
        return sunsetTimes[month] || 19;
    }

    /**
     * Calculate time pressure score for vendor
     * Higher = more pressure = better for buyer
     */
    _calculateTimePressure(minutesUntilClose, minutesUntilSunset, isClosingTime) {
        if (isClosingTime) {
            // Exponential increase in last hour
            const normalizedMinutes = minutesUntilClose / 60;
            return 0.7 + (0.3 * (1 - normalizedMinutes));
        }

        if (minutesUntilClose <= 120) {
            return 0.4 + (0.3 * ((120 - minutesUntilClose) / 120));
        }

        if (minutesUntilSunset <= 60) {
            return 0.3;
        }

        return 0.1; // Low baseline pressure
    }

    /**
     * LOCATION FEATURES
     * Geographic and market context
     */
    _extractLocationFeatures() {
        const areaData = MARRAKECH_CONSTANTS.SOUK_AREAS[this.soukArea] ||
            MARRAKECH_CONSTANTS.SOUK_AREAS.unknown;

        return {
            soukArea: this.soukArea,
            touristDensity: areaData.touristDensity,
            competitionLevel: areaData.competition,
            areaMarkup: areaData.avgMarkup,
            areaDescription: areaData.description
        };
    }

    /**
     * ITEM FEATURES
     * Product category characteristics
     */
    _extractItemFeatures() {
        const itemData = MARRAKECH_CONSTANTS.ITEM_MARKUPS[this.itemType] ||
            MARRAKECH_CONSTANTS.ITEM_MARKUPS.other;

        // Calculate estimated market value
        const estimatedMarketValue = this.vendorOffer > 0 ?
            Math.round(this.vendorOffer / itemData.markup) : 0;

        return {
            itemType: this.itemType,
            isTouristItem: itemData.touristItem,
            itemMarkup: itemData.markup,
            itemVolatility: itemData.volatility,
            estimatedMarketValue,
            priceToValueRatio: this.vendorOffer > 0 ?
                this.vendorOffer / estimatedMarketValue : 0
        };
    }

    /**
     * USER HISTORY FEATURES
     * Learning from past negotiations
     */
    _extractUserHistoryFeatures() {
        // Get stored negotiation stats
        const haggleModule = appState.getModule('haggle') || {};
        const learnerData = this._getLearnerData();

        const totalNegotiations = learnerData.totalNegotiations || 0;
        const successfulDeals = learnerData.successfulDeals || 0;
        const totalDiscountAchieved = learnerData.totalDiscountAchieved || 0;

        // Calculate success rate
        const successRate = totalNegotiations > 0 ?
            successfulDeals / totalNegotiations : 0.5; // Default 50%

        // Calculate average discount achieved
        const avgDiscountAchieved = totalNegotiations > 0 ?
            totalDiscountAchieved / totalNegotiations : 0.45; // Default 45%

        // Determine skill level
        let skillLevel = 'beginner';
        if (totalNegotiations >= 20 && successRate >= 0.7) {
            skillLevel = 'expert';
        } else if (totalNegotiations >= 5 && successRate >= 0.5) {
            skillLevel = 'intermediate';
        }

        // Last negotiation result
        const lastResult = learnerData.lastResult || null;

        return {
            totalNegotiations,
            successfulDeals,
            successRate,
            avgDiscountAchieved,
            skillLevel,
            lastResult,
            hasHistory: totalNegotiations > 0
        };
    }

    /**
     * Get learner data from localStorage
     */
    _getLearnerData() {
        try {
            const data = localStorage.getItem('alidade_nego_learner');
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.warn('[NEGO-AI] Failed to load learner data:', e);
            return {};
        }
    }

    /**
     * VENDOR SIGNAL FEATURES
     * Signals from the vendor's behavior/offer
     */
    _extractVendorSignals() {
        const offer = this.vendorOffer;

        // Is it a round number? (suggests arbitrary pricing)
        const isRoundNumber = offer > 0 && (
            offer % 100 === 0 ||
            offer % 50 === 0 ||
            offer % 500 === 0
        );

        // Is it suspiciously round? (multiple of 100 or 500)
        const isSuspiciouslyRound = offer > 0 && offer % 100 === 0;

        // Calculate vendor eagerness score based on signals
        // (In real usage, this could be enhanced with user input)
        let vendorEagernessScore = 0.5; // Default neutral

        // Round numbers suggest higher starting point = more room to negotiate
        if (isSuspiciouslyRound) {
            vendorEagernessScore += 0.15;
        }

        // Very high offers suggest vendor expects haggling
        const itemData = MARRAKECH_CONSTANTS.ITEM_MARKUPS[this.itemType] ||
            MARRAKECH_CONSTANTS.ITEM_MARKUPS.other;
        if (offer > 0) {
            const expectedMarkup = itemData.markup;
            const actualMarkup = offer / (offer / expectedMarkup);
            if (actualMarkup > expectedMarkup * 1.2) {
                vendorEagernessScore += 0.1;
            }
        }

        return {
            isRoundNumber,
            isSuspiciouslyRound,
            vendorEagernessScore: Math.min(1, vendorEagernessScore),
            priceConfidence: isRoundNumber ? 0.4 : 0.6
        };
    }

    /**
     * PSYCHOLOGICAL FEATURES
     * Market psychology and behavioral economics signals
     */
    _extractPsychologicalFeatures() {
        const features = this.features || {};

        // Anchor effect score - how strong is the vendor's anchor
        // Higher offer = stronger anchor = need stronger counter
        let anchorEffectScore = 0.5;
        const itemData = MARRAKECH_CONSTANTS.ITEM_MARKUPS[this.itemType] ||
            MARRAKECH_CONSTANTS.ITEM_MARKUPS.other;

        if (this.vendorOffer > 0) {
            const estimatedValue = this.vendorOffer / itemData.markup;
            const markupRatio = this.vendorOffer / estimatedValue;
            anchorEffectScore = Math.min(1, markupRatio / 5); // Normalize to 0-1
        }

        // Seasonal demand (affects vendor's willingness to negotiate)
        const month = this.now.getMonth() + 1;
        const isHighSeason = MARRAKECH_CONSTANTS.HIGH_SEASON_MONTHS.includes(month);
        const isLowSeason = MARRAKECH_CONSTANTS.LOW_SEASON_MONTHS.includes(month);
        const seasonalDemand = isHighSeason ? 0.8 : (isLowSeason ? 0.3 : 0.5);

        // Scarcity signals (item type volatility as proxy)
        const scarcityScore = itemData.volatility;

        return {
            anchorEffectScore,
            seasonalDemand,
            scarcityScore
        };
    }

    /**
     * Get feature summary for debugging
     */
    getSummary() {
        return {
            vendorOffer: this.vendorOffer,
            itemType: this.itemType,
            soukArea: this.soukArea,
            extractionTimeMs: this.features._extractionTimeMs,
            featureCount: this.features._featureCount,
            keySignals: {
                timePressure: this.features.timePressureScore,
                isClosingTime: this.features.isClosingTime,
                isTouristItem: this.features.isTouristItem,
                skillLevel: this.features.skillLevel,
                vendorEagerness: this.features.vendorEagernessScore
            }
        };
    }
}

/**
 * ---------------------------------------------------------------
 * CLASS: SmartNegotiator
 * AI Recommendation Engine with Weighted Strategy Scoring
 * Implements "Mechanical Sympathy" - fast, efficient calculations
 * ---------------------------------------------------------------
 */
class SmartNegotiator {
    constructor(context) {
        if (!(context instanceof NegotiationContext)) {
            throw new Error('[NEGO-AI] SmartNegotiator requires NegotiationContext');
        }

        this.context = context;
        this.features = context.features;
        this.vendorOffer = context.vendorOffer;
        this.strategies = this._buildStrategies();
    }

    _buildStrategies() {
        const negotiationUtils = window.ALIDADE_NEGOTIATION_UTILS;
        if (negotiationUtils && typeof negotiationUtils.resolveSmartNegotiatorBuildStrategies === 'function') {
            return negotiationUtils.resolveSmartNegotiatorBuildStrategies();
        }

        return {
            aggressive: {
                name: 'AGGRESSIVE',
                emoji: '!',
                color: 'crimson',
                baseShockDiscount: 0.25,
                baseFairDiscount: 0.35,
                baseWalkAwayDiscount: 0.45,
                riskLevel: 'high',
                description: 'Maximum pressure for maximum savings'
            },
            balanced: {
                name: 'BALANCED',
                emoji: '=',
                color: 'amber',
                baseShockDiscount: 0.30,
                baseFairDiscount: 0.45,
                baseWalkAwayDiscount: 0.55,
                riskLevel: 'moderate',
                description: 'Optimal balance of savings and success'
            },
            conservative: {
                name: 'CONSERVATIVE',
                emoji: '+',
                color: 'emerald',
                baseShockDiscount: 0.40,
                baseFairDiscount: 0.55,
                baseWalkAwayDiscount: 0.65,
                riskLevel: 'low',
                description: 'Safe approach for guaranteed deals'
            }
        };
    }

    analyze() {
        const negotiationUtils = window.ALIDADE_NEGOTIATION_UTILS;
        if (negotiationUtils && typeof negotiationUtils.resolveSmartNegotiatorAnalyze === 'function') {
            return negotiationUtils.resolveSmartNegotiatorAnalyze(this, performance, Date, console);
        }

        const startTime = performance.now();
        const strategyScores = this._scoreStrategies();
        const selectedStrategy = this._selectStrategy(strategyScores);
        const prices = this._calculatePrices(selectedStrategy);
        const confidence = this._calculateConfidence(selectedStrategy, strategyScores);
        const explanation = this._generateExplanation(selectedStrategy, confidence);

        return {
            strategy: selectedStrategy,
            prices,
            confidence,
            explanation,
            strategyScores,
            metadata: {
                analysisTimeMs: performance.now() - startTime,
                vendorOffer: this.vendorOffer,
                featureCount: this.features?._featureCount,
                timestamp: Date.now()
            }
        };
    }

    _scoreStrategies() {
        const negotiationUtils = window.ALIDADE_NEGOTIATION_UTILS;
        if (negotiationUtils && typeof negotiationUtils.resolveSmartNegotiatorScoreStrategies === 'function') {
            return negotiationUtils.resolveSmartNegotiatorScoreStrategies(this);
        }
        return { aggressive: 0, balanced: 5, conservative: 0 };
    }

    _selectStrategy(scores) {
        const negotiationUtils = window.ALIDADE_NEGOTIATION_UTILS;
        if (negotiationUtils && typeof negotiationUtils.resolveSmartNegotiatorSelectStrategy === 'function') {
            return negotiationUtils.resolveSmartNegotiatorSelectStrategy(this, scores);
        }
        const fallback = this.strategies?.balanced || {};
        return { ...fallback, key: 'balanced', score: scores?.balanced ?? 5 };
    }

    _calculatePrices(strategy) {
        const negotiationUtils = window.ALIDADE_NEGOTIATION_UTILS;
        if (negotiationUtils && typeof negotiationUtils.resolveSmartNegotiatorCalculatePrices === 'function') {
            return negotiationUtils.resolveSmartNegotiatorCalculatePrices(this, strategy);
        }

        const offer = this.vendorOffer || 0;
        const shock = Math.floor(offer * 0.3);
        const fair = Math.floor(offer * 0.45);
        const walkAway = Math.floor(offer * 0.6);
        return {
            shock,
            fair,
            walkAway,
            multipliers: { shock: 0.3, fair: 0.45, walkAway: 0.6 },
            savings: {
                atShock: offer - shock,
                atFair: offer - fair,
                atWalkAway: offer - walkAway
            },
            percentages: { shockDiscount: 70, fairDiscount: 55, walkAwayDiscount: 40 }
        };
    }

    _calculateConfidence(strategy, scores) {
        const negotiationUtils = window.ALIDADE_NEGOTIATION_UTILS;
        if (negotiationUtils && typeof negotiationUtils.resolveSmartNegotiatorCalculateConfidence === 'function') {
            return negotiationUtils.resolveSmartNegotiatorCalculateConfidence(this, strategy, scores);
        }
        return 0.5;
    }

    _generateExplanation(strategy, confidence) {
        const negotiationUtils = window.ALIDADE_NEGOTIATION_UTILS;
        if (negotiationUtils && typeof negotiationUtils.resolveSmartNegotiatorGenerateExplanation === 'function') {
            return negotiationUtils.resolveSmartNegotiatorGenerateExplanation(this, strategy, confidence);
        }
        return {
            reasons: [],
            summary: "Analyze the vendor's response carefully.",
            strategyRationale: strategy?.description || ''
        };
    }
}

/**
 * ---------------------------------------------------------------
 * CLASS: NegotiationLearner
 * Learning system that tracks outcomes and improves over time
 * Stores data in localStorage (max 100 negotiations)
 * ---------------------------------------------------------------
 */
class NegotiationLearner {
    constructor() {
        this.STORAGE_KEY = 'alidade_nego_learner';
        this.MAX_HISTORY = 100;
        this.data = this._loadData();
    }

    _loadData() {
        const negotiationUtils = window.ALIDADE_NEGOTIATION_UTILS;
        if (negotiationUtils && typeof negotiationUtils.resolveNegotiationLearnerLoadData === 'function') {
            return negotiationUtils.resolveNegotiationLearnerLoadData(this, localStorage, JSON, console);
        }
        return this._getDefaultData();
    }

    _getDefaultData() {
        const negotiationUtils = window.ALIDADE_NEGOTIATION_UTILS;
        if (negotiationUtils && typeof negotiationUtils.resolveNegotiationLearnerGetDefaultData === 'function') {
            return negotiationUtils.resolveNegotiationLearnerGetDefaultData(Date);
        }

        return {
            totalNegotiations: 0,
            successfulDeals: 0,
            failedDeals: 0,
            totalDiscountAchieved: 0,
            totalSavings: 0,
            history: [],
            lastResult: null,
            strategyPerformance: {
                aggressive: { used: 0, success: 0 },
                balanced: { used: 0, success: 0 },
                conservative: { used: 0, success: 0 }
            },
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
    }

    _saveData() {
        const negotiationUtils = window.ALIDADE_NEGOTIATION_UTILS;
        if (negotiationUtils && typeof negotiationUtils.resolveNegotiationLearnerSaveData === 'function') {
            return negotiationUtils.resolveNegotiationLearnerSaveData(this, localStorage, JSON, Date, console);
        }
        return false;
    }

    recordNegotiation(params) {
        const negotiationUtils = window.ALIDADE_NEGOTIATION_UTILS;
        if (negotiationUtils && typeof negotiationUtils.resolveNegotiationLearnerRecordNegotiation === 'function') {
            return negotiationUtils.resolveNegotiationLearnerRecordNegotiation(this, params, Date, console);
        }
        return null;
    }

    getSuccessRate() {
        const negotiationUtils = window.ALIDADE_NEGOTIATION_UTILS;
        if (negotiationUtils && typeof negotiationUtils.resolveNegotiationLearnerGetSuccessRate === 'function') {
            return negotiationUtils.resolveNegotiationLearnerGetSuccessRate(this);
        }
        return 50;
    }

    getAverageDiscount() {
        const negotiationUtils = window.ALIDADE_NEGOTIATION_UTILS;
        if (negotiationUtils && typeof negotiationUtils.resolveNegotiationLearnerGetAverageDiscount === 'function') {
            return negotiationUtils.resolveNegotiationLearnerGetAverageDiscount(this);
        }
        return 45;
    }

    getTotalSavings() {
        const negotiationUtils = window.ALIDADE_NEGOTIATION_UTILS;
        if (negotiationUtils && typeof negotiationUtils.resolveNegotiationLearnerGetTotalSavings === 'function') {
            return negotiationUtils.resolveNegotiationLearnerGetTotalSavings(this);
        }
        return 0;
    }

    getStrategyPerformance() {
        const negotiationUtils = window.ALIDADE_NEGOTIATION_UTILS;
        if (negotiationUtils && typeof negotiationUtils.resolveNegotiationLearnerGetStrategyPerformance === 'function') {
            return negotiationUtils.resolveNegotiationLearnerGetStrategyPerformance(this);
        }
        return {};
    }

    getRecentHistory(limit = 10) {
        const negotiationUtils = window.ALIDADE_NEGOTIATION_UTILS;
        if (negotiationUtils && typeof negotiationUtils.resolveNegotiationLearnerGetRecentHistory === 'function') {
            return negotiationUtils.resolveNegotiationLearnerGetRecentHistory(this, limit);
        }
        return [];
    }

    getStats() {
        const negotiationUtils = window.ALIDADE_NEGOTIATION_UTILS;
        if (negotiationUtils && typeof negotiationUtils.resolveNegotiationLearnerGetStats === 'function') {
            return negotiationUtils.resolveNegotiationLearnerGetStats(this);
        }
        return {
            totalNegotiations: 0,
            successfulDeals: 0,
            failedDeals: 0,
            successRate: 50,
            avgDiscount: 45,
            totalSavings: 0,
            strategyPerformance: {},
            lastResult: null
        };
    }

    reset() {
        const negotiationUtils = window.ALIDADE_NEGOTIATION_UTILS;
        if (negotiationUtils && typeof negotiationUtils.resolveNegotiationLearnerReset === 'function') {
            return negotiationUtils.resolveNegotiationLearnerReset(this, confirm, console);
        }
        return false;
    }
}

// ---------------------------------------------------------------
// GLOBAL AI INSTANCES
// ---------------------------------------------------------------

const negoLearner = new NegotiationLearner();
negotiationAiDebugLog('[ALIDADE] Negotiation AI System Initialized');
negotiationAiDebugLog(`[ALIDADE] Historical negotiations: ${negoLearner.data.totalNegotiations}`);

// Expose AI classes globally for debugging and testing
window.NegotiationContext = NegotiationContext;
window.SmartNegotiator = SmartNegotiator;
window.NegotiationLearner = NegotiationLearner;
window.negoLearner = negoLearner;
window.MARRAKECH_CONSTANTS = MARRAKECH_CONSTANTS;
