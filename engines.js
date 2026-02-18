/**
 * ALIDADE LOGIC ENGINES
 * Extracted from app.js
 */

window.StateManager = class StateManager {
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

    getModule(moduleName) {
        return this.state.modules[moduleName] || this.defaultState.modules[moduleName];
    }

    setModule(moduleName, data) {
        this.state.modules[moduleName] = { ...this.state.modules[moduleName], ...data };
        this._saveState();
    }
};

window.NegotiationContext = class NegotiationContext {
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

        console.log(`[NEGO-AI] Extracted ${features._featureCount} features in ${features._extractionTimeMs.toFixed(2)}ms`);

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
};
window.SmartNegotiator = class SmartNegotiator {
    constructor(context) {
        if (!(context instanceof NegotiationContext)) {
            throw new Error('[NEGO-AI] SmartNegotiator requires NegotiationContext');
        }

        this.context = context;
        this.features = context.features;
        this.vendorOffer = context.vendorOffer;

        // Strategy definitions with base parameters
        this.strategies = {
            aggressive: {
                name: 'AGGRESSIVE',
                emoji: '⚔️',
                color: 'crimson',
                baseShockDiscount: 0.25,  // Offer 25% of asking (75% off)
                baseFairDiscount: 0.35,   // Target 35% of asking
                baseWalkAwayDiscount: 0.45, // Max 45% of asking
                riskLevel: 'high',
                description: 'Maximum pressure for maximum savings'
            },
            balanced: {
                name: 'BALANCED',
                emoji: '⚖️',
                color: 'amber',
                baseShockDiscount: 0.30,  // Offer 30% of asking
                baseFairDiscount: 0.45,   // Target 45% of asking
                baseWalkAwayDiscount: 0.55, // Max 55% of asking
                riskLevel: 'moderate',
                description: 'Optimal balance of savings and success'
            },
            conservative: {
                name: 'CONSERVATIVE',
                emoji: '🛡️',
                color: 'emerald',
                baseShockDiscount: 0.40,  // Offer 40% of asking
                baseFairDiscount: 0.55,   // Target 55% of asking
                baseWalkAwayDiscount: 0.65, // Max 65% of asking
                riskLevel: 'low',
                description: 'Safe approach for guaranteed deals'
            }
        };
    }

    /**
     * Main analysis method - returns complete recommendation
     * Complexity: O(1) - constant time calculations
     */
    analyze() {
        const startTime = performance.now();

        // Step 1: Score each strategy (weighted scoring)
        const strategyScores = this._scoreStrategies();

        // Step 2: Select optimal strategy
        const selectedStrategy = this._selectStrategy(strategyScores);

        // Step 3: Calculate adjusted prices
        const prices = this._calculatePrices(selectedStrategy);

        // Step 4: Calculate confidence score
        const confidence = this._calculateConfidence(selectedStrategy, strategyScores);

        // Step 5: Generate explanation
        const explanation = this._generateExplanation(selectedStrategy, confidence);

        // Step 6: Compile recommendation
        const recommendation = {
            strategy: selectedStrategy,
            prices,
            confidence,
            explanation,
            strategyScores,
            metadata: {
                analysisTimeMs: performance.now() - startTime,
                vendorOffer: this.vendorOffer,
                featureCount: this.features._featureCount,
                timestamp: Date.now()
            }
        };

        console.log(`[NEGO-AI] Analysis complete in ${recommendation.metadata.analysisTimeMs.toFixed(2)}ms`);
        console.log(`[NEGO-AI] Selected strategy: ${selectedStrategy.name} (${(confidence * 100).toFixed(0)}% confidence)`);

        return recommendation;
    }

    /**
     * Score each strategy using weighted feature analysis
     * Returns object with scores 0-10 for each strategy
     */
    _scoreStrategies() {
        const f = this.features;
        const scores = {
            aggressive: 0,
            balanced: 5, // Base score
            conservative: 0
        };

        // --- TIME FACTORS ---
        // Closing time = AGGRESSIVE
        if (f.isClosingTime) {
            scores.aggressive += 3.5;
            scores.balanced += 1;
        } else if (f.timePressureScore > 0.5) {
            scores.aggressive += 2;
            scores.balanced += 0.5;
        }

        // Golden hour (sunset approaching) = slight aggressive lean
        if (f.isGoldenHour) {
            scores.aggressive += 1;
        }

        // Peak hours = harder to negotiate = conservative
        if (f.isPeakHour) {
            scores.conservative += 1.5;
        }

        // Off-peak = easier to negotiate = aggressive
        if (f.isOffPeakHour) {
            scores.aggressive += 1;
        }

        // --- LOCATION FACTORS ---
        // High competition = more aggressive (vendors need sales)
        if (f.competitionLevel > 0.7) {
            scores.aggressive += 2;
        } else if (f.competitionLevel < 0.4) {
            scores.conservative += 1.5;
        }

        // High tourist density = vendors expect haggling = balanced/aggressive
        if (f.touristDensity > 0.8) {
            scores.balanced += 1;
            scores.aggressive += 0.5;
        }

        // --- ITEM FACTORS ---
        // Tourist items have higher markup = more aggressive
        if (f.isTouristItem) {
            scores.aggressive += 1.5;
        }

        // High item markup = room for negotiation = aggressive
        if (f.itemMarkup > 3.5) {
            scores.aggressive += 1.5;
        } else if (f.itemMarkup < 2) {
            scores.conservative += 2;
        }

        // High volatility items (art, antiques) = conservative
        if (f.itemVolatility > 0.4) {
            scores.conservative += 2;
        }

        // --- USER FACTORS ---
        // Experienced users can be more aggressive
        if (f.skillLevel === 'expert') {
            scores.aggressive += 2;
        } else if (f.skillLevel === 'beginner') {
            scores.conservative += 2;
            scores.balanced += 1;
        }

        // High success rate = confidence boost = aggressive
        if (f.successRate > 0.7) {
            scores.aggressive += 1.5;
        } else if (f.successRate < 0.4 && f.totalNegotiations > 3) {
            scores.conservative += 2;
        }

        // --- VENDOR SIGNALS ---
        // Round numbers = arbitrary pricing = aggressive
        if (f.isSuspiciouslyRound) {
            scores.aggressive += 1;
        }

        // High vendor eagerness = aggressive
        if (f.vendorEagernessScore > 0.6) {
            scores.aggressive += 1.5;
        }

        // --- SEASONAL FACTORS ---
        // Low season = vendors more desperate = aggressive
        if (f.isLowSeason) {
            scores.aggressive += 2;
        }

        // High season = busy vendors = balanced/conservative
        if (f.isHighSeason) {
            scores.balanced += 1;
            scores.conservative += 0.5;
        }

        // --- NORMALIZE SCORES ---
        // Clamp to 0-10 range
        Object.keys(scores).forEach(key => {
            scores[key] = Math.max(0, Math.min(10, scores[key]));
        });

        return scores;
    }

    /**
     * Select the optimal strategy based on scores
     */
    _selectStrategy(scores) {
        let maxScore = -1;
        let selectedKey = 'balanced';

        Object.entries(scores).forEach(([key, score]) => {
            if (score > maxScore) {
                maxScore = score;
                selectedKey = key;
            }
        });

        return {
            ...this.strategies[selectedKey],
            key: selectedKey,
            score: maxScore
        };
    }

    /**
     * Calculate adjusted prices based on strategy and features
     */
    _calculatePrices(strategy) {
        const f = this.features;
        const offer = this.vendorOffer;

        // Base discounts from strategy
        let shockMultiplier = strategy.baseShockDiscount;
        let fairMultiplier = strategy.baseFairDiscount;
        let walkAwayMultiplier = strategy.baseWalkAwayDiscount;

        // --- ADJUSTMENTS ---

        // Time pressure adjustment (+5-15% discount if closing)
        if (f.isClosingTime) {
            const timeBonus = 0.05 + (0.10 * (1 - f.minutesUntilClose / 60));
            shockMultiplier -= timeBonus * 0.5;
            fairMultiplier -= timeBonus * 0.3;
        }

        // User experience adjustment (+3-8% if high success rate)
        if (f.skillLevel === 'expert' && f.successRate > 0.7) {
            const expBonus = 0.03 + (f.successRate - 0.7) * 0.1;
            shockMultiplier -= expBonus * 0.5;
            fairMultiplier -= expBonus * 0.3;
        }

        // Item type adjustment (-10% if luxury, +10% if tourist)
        if (f.itemVolatility > 0.4) {
            // Luxury/antique - be more conservative (higher multiplier = pay more)
            shockMultiplier += 0.10;
            fairMultiplier += 0.08;
            walkAwayMultiplier += 0.05;
        } else if (f.isTouristItem && f.itemMarkup > 3) {
            // Tourist trap item - be more aggressive (lower multiplier = pay less)
            shockMultiplier -= 0.05;
            fairMultiplier -= 0.05;
        }

        // Vendor eagerness adjustment (+5-10% if eager)
        if (f.vendorEagernessScore > 0.6) {
            const eagerBonus = (f.vendorEagernessScore - 0.6) * 0.15;
            shockMultiplier -= eagerBonus * 0.5;
            fairMultiplier -= eagerBonus * 0.3;
        }

        // Season adjustment (+5% if low season)
        if (f.isLowSeason) {
            shockMultiplier -= 0.03;
            fairMultiplier -= 0.03;
        }

        // Competition adjustment
        if (f.competitionLevel > 0.7) {
            shockMultiplier -= 0.03;
            fairMultiplier -= 0.02;
        }

        // --- ENSURE VALID RANGES ---
        // Shock: 15-50%, Fair: 30-65%, WalkAway: 45-75%
        shockMultiplier = Math.max(0.15, Math.min(0.50, shockMultiplier));
        fairMultiplier = Math.max(0.30, Math.min(0.65, fairMultiplier));
        walkAwayMultiplier = Math.max(0.45, Math.min(0.75, walkAwayMultiplier));

        // Ensure order: shock < fair < walkaway
        fairMultiplier = Math.max(fairMultiplier, shockMultiplier + 0.05);
        walkAwayMultiplier = Math.max(walkAwayMultiplier, fairMultiplier + 0.05);

        // Calculate final prices (rounded to nearest 5 DH)
        const roundToNearest5 = (val) => Math.round(val / 5) * 5;

        return {
            shock: roundToNearest5(offer * shockMultiplier),
            fair: roundToNearest5(offer * fairMultiplier),
            walkAway: roundToNearest5(offer * walkAwayMultiplier),
            multipliers: {
                shock: shockMultiplier,
                fair: fairMultiplier,
                walkAway: walkAwayMultiplier
            },
            savings: {
                atShock: offer - roundToNearest5(offer * shockMultiplier),
                atFair: offer - roundToNearest5(offer * fairMultiplier),
                atWalkAway: offer - roundToNearest5(offer * walkAwayMultiplier)
            },
            percentages: {
                shockDiscount: Math.round((1 - shockMultiplier) * 100),
                fairDiscount: Math.round((1 - fairMultiplier) * 100),
                walkAwayDiscount: Math.round((1 - walkAwayMultiplier) * 100)
            }
        };
    }

    /**
     * Calculate confidence score (0-100%)
     */
    _calculateConfidence(strategy, scores) {
        const f = this.features;
        let confidence = 0.5; // Base 50%

        // Data availability boost (+15% if has negotiation history)
        if (f.hasHistory && f.totalNegotiations >= 5) {
            confidence += 0.15;
        } else if (f.hasHistory) {
            confidence += 0.08;
        }

        // Clear signals boost (+10-20% for strong signals)
        if (f.isClosingTime) {
            confidence += 0.15; // Very clear signal
        }

        if (f.timePressureScore > 0.6) {
            confidence += 0.10;
        }

        // Experience boost (+10% for experts)
        if (f.skillLevel === 'expert') {
            confidence += 0.10;
        } else if (f.skillLevel === 'intermediate') {
            confidence += 0.05;
        }

        // Strong strategy score boost
        const maxScore = Math.max(scores.aggressive, scores.balanced, scores.conservative);
        const scoreDiff = maxScore - Math.min(scores.aggressive, scores.balanced, scores.conservative);

        if (scoreDiff > 4) {
            confidence += 0.10; // Clear winner
        } else if (scoreDiff < 2) {
            confidence -= 0.10; // Close call
        }

        // Tourist item = more predictable
        if (f.isTouristItem) {
            confidence += 0.05;
        }

        // High volatility item = less predictable
        if (f.itemVolatility > 0.4) {
            confidence -= 0.10;
        }

        // Clamp to valid range
        return Math.max(0.30, Math.min(0.95, confidence));
    }

    /**
     * Generate human-readable explanation
     */
    _generateExplanation(strategy, confidence) {
        const f = this.features;
        const reasons = [];

        // Time-based reasons
        if (f.isClosingTime) {
            reasons.push({
                emoji: '⏰',
                text: 'Closing time soon — vendors want to sell',
                weight: 'high'
            });
        } else if (f.isGoldenHour) {
            reasons.push({
                emoji: '🌅',
                text: 'Sunset approaching — good negotiation window',
                weight: 'medium'
            });
        } else if (f.isPeakHour) {
            reasons.push({
                emoji: '👥',
                text: 'Peak tourist hours — vendors less flexible',
                weight: 'medium'
            });
        }

        // Item-based reasons
        if (f.isTouristItem && f.itemMarkup > 3) {
            reasons.push({
                emoji: '🏷️',
                text: 'Tourist item — expect 50-70% markup',
                weight: 'high'
            });
        }

        if (f.itemVolatility > 0.4) {
            reasons.push({
                emoji: '💎',
                text: 'Luxury/unique item — less predictable pricing',
                weight: 'medium'
            });
        }

        // User experience reasons
        if (f.skillLevel === 'expert') {
            reasons.push({
                emoji: '🧠',
                text: "You're experienced — be confident!",
                weight: 'high'
            });
        } else if (f.skillLevel === 'beginner') {
            reasons.push({
                emoji: '🐣',
                text: 'Building experience — stay flexible',
                weight: 'medium'
            });
        }

        // Location reasons
        if (f.competitionLevel > 0.7) {
            reasons.push({
                emoji: '🏪',
                text: 'Many vendors nearby — you have options',
                weight: 'high'
            });
        }

        if (f.touristDensity > 0.8) {
            reasons.push({
                emoji: '📸',
                text: 'High tourist area — prices heavily inflated',
                weight: 'medium'
            });
        }

        // Vendor signal reasons
        if (f.isSuspiciouslyRound) {
            reasons.push({
                emoji: '🎯',
                text: 'Round number price — room to negotiate',
                weight: 'medium'
            });
        }

        // Seasonal reasons
        if (f.isLowSeason) {
            reasons.push({
                emoji: '📉',
                text: 'Low tourist season — vendors more flexible',
                weight: 'high'
            });
        } else if (f.isHighSeason) {
            reasons.push({
                emoji: '📈',
                text: 'Peak tourist season — expect resistance',
                weight: 'medium'
            });
        }

        // Sort by weight and take top 5
        const weightOrder = { high: 3, medium: 2, low: 1 };
        const sortedReasons = reasons
            .sort((a, b) => weightOrder[b.weight] - weightOrder[a.weight])
            .slice(0, 5);

        // Generate summary
        const summaryPhrases = {
            aggressive: {
                high: "Go hard! Time and conditions favor you.",
                medium: "Push for the deal — odds are in your favor.",
                low: "Be assertive but ready to adapt."
            },
            balanced: {
                high: "Solid position. Play it smart.",
                medium: "Standard approach — stick to the plan.",
                low: "Stay flexible and read the vendor."
            },
            conservative: {
                high: "Play it safe — this is a tricky situation.",
                medium: "Focus on closing the deal over maximum savings.",
                low: "Proceed carefully with this item."
            }
        };

        const confLevel = confidence > 0.75 ? 'high' : (confidence > 0.55 ? 'medium' : 'low');
        const summary = summaryPhrases[strategy.key]?.[confLevel] ||
            "Analyze the vendor's response carefully.";

        return {
            reasons: sortedReasons,
            summary,
            strategyRationale: strategy.description
        };
    }
};

window.NegotiationLearner = class NegotiationLearner {
    constructor() {
        this.STORAGE_KEY = 'alidade_nego_learner';
        this.MAX_HISTORY = 100;
        this.data = this._loadData();
    }

    /**
     * Load learner data from localStorage
     */
    _loadData() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (!stored) {
                return this._getDefaultData();
            }
            return JSON.parse(stored);
        } catch (e) {
            console.warn('[NEGO-LEARNER] Failed to load data:', e);
            return this._getDefaultData();
        }
    }

    /**
     * Get default learner data structure
     */
    _getDefaultData() {
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

    /**
     * Save data to localStorage
     */
    _saveData() {
        try {
            this.data.updatedAt = Date.now();
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
            console.log('[NEGO-LEARNER] Data saved successfully');
        } catch (e) {
            console.error('[NEGO-LEARNER] Failed to save data:', e);
        }
    }

    /**
     * Record a negotiation outcome
     */
    recordNegotiation(params) {
        const {
            vendorOffer,
            recommendation,
            finalPrice,
            result, // 'success' | 'failed' | 'walked_away'
            itemType = 'other',
            soukArea = 'unknown'
        } = params;

        // Create history entry
        const entry = {
            id: `nego_${Date.now()}`,
            timestamp: Date.now(),
            vendorOffer,
            finalPrice: finalPrice || recommendation?.prices?.fair || 0,
            result,
            itemType,
            soukArea,
            strategy: recommendation?.strategy?.key || 'balanced',
            recommendedPrices: recommendation?.prices || null,
            confidence: recommendation?.confidence || 0.5,
            discountAchieved: vendorOffer > 0 ?
                1 - (finalPrice / vendorOffer) : 0,
            savings: vendorOffer - (finalPrice || 0)
        };

        // Update totals
        this.data.totalNegotiations++;

        if (result === 'success') {
            this.data.successfulDeals++;
            this.data.totalDiscountAchieved += entry.discountAchieved;
            this.data.totalSavings += entry.savings;
            this.data.strategyPerformance[entry.strategy].success++;
        } else {
            this.data.failedDeals++;
        }

        this.data.strategyPerformance[entry.strategy].used++;
        this.data.lastResult = result;

        // Add to history (keep max 100)
        this.data.history.unshift(entry);
        if (this.data.history.length > this.MAX_HISTORY) {
            this.data.history = this.data.history.slice(0, this.MAX_HISTORY);
        }

        // Persist
        this._saveData();

        console.log(`[NEGO-LEARNER] Recorded: ${result} (${entry.strategy})`);
        console.log(`[NEGO-LEARNER] Total: ${this.data.totalNegotiations}, Success rate: ${this.getSuccessRate().toFixed(1)}%`);

        return entry;
    }

    /**
     * Get current success rate
     */
    getSuccessRate() {
        if (this.data.totalNegotiations === 0) return 50;
        return (this.data.successfulDeals / this.data.totalNegotiations) * 100;
    }

    /**
     * Get average discount achieved
     */
    getAverageDiscount() {
        if (this.data.successfulDeals === 0) return 45;
        return (this.data.totalDiscountAchieved / this.data.successfulDeals) * 100;
    }

    /**
     * Get total savings
     */
    getTotalSavings() {
        return this.data.totalSavings;
    }

    /**
     * Get strategy performance stats
     */
    getStrategyPerformance() {
        const perf = this.data.strategyPerformance;
        return Object.entries(perf).reduce((acc, [key, val]) => {
            acc[key] = {
                ...val,
                successRate: val.used > 0 ? (val.success / val.used) * 100 : 0
            };
            return acc;
        }, {});
    }

    /**
     * Get recent history
     */
    getRecentHistory(limit = 10) {
        return this.data.history.slice(0, limit);
    }

    /**
     * Get stats summary
     */
    getStats() {
        return {
            totalNegotiations: this.data.totalNegotiations,
            successfulDeals: this.data.successfulDeals,
            failedDeals: this.data.failedDeals,
            successRate: this.getSuccessRate(),
            avgDiscount: this.getAverageDiscount(),
            totalSavings: this.getTotalSavings(),
            strategyPerformance: this.getStrategyPerformance(),
            lastResult: this.data.lastResult
        };
    }

    /**
     * Reset all learning data
     */
    reset() {
        if (confirm('⚠️ Reset all negotiation history? This cannot be undone.')) {
            this.data = this._getDefaultData();
            this._saveData();
            console.log('[NEGO-LEARNER] Data reset');
            return true;
        }
        return false;
    }
};
window.CurrencyRateProvider = class CurrencyRateProvider {
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

        console.log('[CURRENCY] Rate provider initialized');
    }

    /**
     * -----------------------------------------------------------
     * MAIN: Get current rates (tries all sources)
     * Returns: { rates: {...}, source: string, timestamp: number }
     * -----------------------------------------------------------
     */
    async getRates(forceRefresh = false) {
        try {
            // If we have fresh cached rates and not forcing refresh, return them
            if (!forceRefresh && this._rates && this._isCacheValid()) {
                console.log('[CURRENCY] Using in-memory cache');
                return this._buildResponse();
            }

            // If offline, try localStorage cache
            if (!navigator.onLine) {
                console.log('[CURRENCY] Offline - using cached/fallback');
                return this._getOfflineRates();
            }

            // Try APIs in order
            let rates = null;

            // === API 1: exchangerate-api.com ===
            rates = await this._tryExchangeRateApi();
            if (rates) {
                this._updateRates(rates, 'exchangerate-api');
                return this._buildResponse();
            }

            // === API 2: fawazahmed0 CDN ===
            rates = await this._tryFawazahmedApi();
            if (rates) {
                this._updateRates(rates, 'fawazahmed0');
                return this._buildResponse();
            }

            // === Fallback: Cached or Hardcoded ===
            console.warn('[CURRENCY] All APIs failed, using fallback');
            return this._getOfflineRates();

        } catch (error) {
            // Ultimate safety net - NEVER crash
            console.error('[CURRENCY] Critical error:', error);
            return this._getOfflineRates();
        }
    }

    /**
     * Try exchangerate-api.com (Primary)
     */
    async _tryExchangeRateApi() {
        try {
            console.log('[CURRENCY] Trying exchangerate-api.com...');

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), this.API_TIMEOUT);

            const response = await fetch(
                'https://api.exchangerate-api.com/v4/latest/MAD',
                { signal: controller.signal }
            );

            clearTimeout(timeout);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            // Validate response structure
            if (!data.rates || typeof data.rates !== 'object') {
                throw new Error('Invalid response structure');
            }

            // Validate rates
            if (!this._validateRates(data.rates)) {
                throw new Error('Rates failed sanity check');
            }

            console.log('[CURRENCY] ? exchangerate-api.com success');
            return this._normalizeRates(data.rates);

        } catch (error) {
            console.warn('[CURRENCY] exchangerate-api.com failed:', error.message);
            return null;
        }
    }

    /**
     * Try fawazahmed0 CDN (Fallback 1)
     */
    async _tryFawazahmedApi() {
        try {
            console.log('[CURRENCY] Trying fawazahmed0 CDN...');

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), this.API_TIMEOUT);

            const response = await fetch(
                'https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/mad.json',
                { signal: controller.signal }
            );

            clearTimeout(timeout);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            // This API uses lowercase keys
            if (!data.mad || typeof data.mad !== 'object') {
                throw new Error('Invalid response structure');
            }

            // Convert to uppercase keys
            const normalizedRates = {};
            for (const [key, value] of Object.entries(data.mad)) {
                normalizedRates[key.toUpperCase()] = value;
            }

            // Validate rates
            if (!this._validateRates(normalizedRates)) {
                throw new Error('Rates failed sanity check');
            }

            console.log('[CURRENCY] ? fawazahmed0 success');
            return this._normalizeRates(normalizedRates);

        } catch (error) {
            console.warn('[CURRENCY] fawazahmed0 failed:', error.message);
            return null;
        }
    }

    /**
     * Get offline rates (cached or hardcoded)
     */
    _getOfflineRates() {
        // Try localStorage cache first
        const cached = this._loadFromCache();
        if (cached && cached.rates) {
            this._rates = cached.rates;
            this._rateSource = cached.cacheAge < this.CACHE_TTL ? 'cached' : 'stale-cache';
            this._lastUpdate = cached.timestamp;
            console.log(`[CURRENCY] Using ${this._rateSource} rates`);
            return this._buildResponse();
        }

        // Last resort: hardcoded fallback
        console.log('[CURRENCY] Using hardcoded fallback rates');
        this._rates = { ...FALLBACK_RATES };
        this._rateSource = 'hardcoded';
        this._lastUpdate = null;
        return this._buildResponse();
    }

    /**
     * Validate rates with sanity checks
     */
    _validateRates(rates) {
        // Check required currencies exist
        for (const curr of this.REQUIRED_CURRENCIES) {
            if (typeof rates[curr] !== 'number' || rates[curr] <= 0) {
                console.warn(`[CURRENCY] Missing/invalid ${curr} rate`);
                return false;
            }
        }

        // Sanity check: USD/MAD should be ~0.08-0.12
        const usdRate = rates['USD'];
        const bounds = this.SANITY_BOUNDS.USD;
        if (usdRate < bounds.min || usdRate > bounds.max) {
            console.warn(`[CURRENCY] USD rate ${usdRate} outside sanity bounds [${bounds.min}, ${bounds.max}]`);
            return false;
        }

        return true;
    }

    /**
     * Normalize rates to only include supported currencies
     */
    _normalizeRates(rawRates) {
        const normalized = {};
        for (const code of Object.keys(CURRENCY_CONFIG)) {
            if (code === 'MAD') continue; // Skip base currency
            if (rawRates[code] !== undefined) {
                normalized[code] = rawRates[code];
            } else if (FALLBACK_RATES[code] !== undefined) {
                // Use fallback for missing currencies
                normalized[code] = FALLBACK_RATES[code];
            }
        }
        return normalized;
    }

    /**
     * Update in-memory rates and cache
     */
    _updateRates(rates, source) {
        this._rates = rates;
        this._rateSource = source;
        this._lastUpdate = Date.now();
        this._saveToCache();
    }

    /**
     * Save rates to localStorage
     */
    _saveToCache() {
        try {
            const cacheData = {
                rates: this._rates,
                source: this._rateSource,
                timestamp: this._lastUpdate
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cacheData));
            console.log('[CURRENCY] Rates cached to localStorage');
        } catch (error) {
            console.warn('[CURRENCY] Cache save failed:', error);
        }
    }

    /**
     * Load rates from localStorage
     */
    _loadFromCache() {
        try {
            const cached = localStorage.getItem(this.STORAGE_KEY);
            if (!cached) return null;

            const data = JSON.parse(cached);
            if (!data.rates || !data.timestamp) return null;

            const cacheAge = Date.now() - data.timestamp;

            // If cache is fresh, use it immediately
            if (cacheAge < this.CACHE_TTL) {
                this._rates = data.rates;
                this._rateSource = 'cached';
                this._lastUpdate = data.timestamp;
            }

            return { ...data, cacheAge };

        } catch (error) {
            console.warn('[CURRENCY] Cache load failed:', error);
            return null;
        }
    }

    /**
     * Check if in-memory cache is still valid
     */
    _isCacheValid() {
        if (!this._lastUpdate) return false;
        return (Date.now() - this._lastUpdate) < this.CACHE_TTL;
    }

    /**
     * Build response object
     */
    _buildResponse() {
        return {
            rates: this._rates,
            source: this._rateSource,
            timestamp: this._lastUpdate,
            isStale: this._rateSource === 'stale-cache' || this._rateSource === 'hardcoded',
            isOffline: !navigator.onLine
        };
    }

    /**
     * Get rate age as human-readable string
     */
    getRateAge() {
        if (!this._lastUpdate) return 'Unknown';

        const ageMs = Date.now() - this._lastUpdate;
        const ageMinutes = Math.floor(ageMs / 60000);
        const ageHours = Math.floor(ageMinutes / 60);

        if (ageMinutes < 1) return 'Just now';
        if (ageMinutes < 60) return `${ageMinutes}m ago`;
        if (ageHours < 24) return `${ageHours}h ago`;
        return `${Math.floor(ageHours / 24)}d ago`;
    }

    /**
     * Get status for UI display
     */
    getStatus() {
        if (!navigator.onLine) {
            return {
                icon: '🔌',
                text: 'Offline',
                detail: this._rateSource === 'stale-cache'
                    ? `Cached rates (${this.getRateAge()})`
                    : 'Using backup rates',
                color: 'amber'
            };
        }

        if (this._rateSource === 'hardcoded') {
            return {
                icon: '⚠️',
                text: 'Backup Rates',
                detail: 'Refresh when online',
                color: 'crimson'
            };
        }

        if (this._rateSource === 'stale-cache') {
            return {
                icon: '🕰️',
                text: 'Stale Cache',
                detail: `${this.getRateAge()}, refreshing...`,
                color: 'amber'
            };
        }

        return {
            icon: '🟢',
            text: 'Live Rates',
            detail: `Updated ${this.getRateAge()}`,
            color: 'emerald'
        };
    }

    /**
     * Force refresh rates (call when back online)
     */
    async refresh() {
        return this.getRates(true);
    }
};

window.CurrencyConverter = class CurrencyConverter {
    constructor(rateProvider) {
        this.provider = rateProvider;
        this.SETTINGS_KEY = 'alidade_user_currency';
        this._userCurrency = this._detectUserCurrency();
        this._rates = null;
        this._initialized = false;
    }

    /**
     * Initialize converter (load rates)
     */
    async init() {
        try {
            const result = await this.provider.getRates();
            this._rates = result.rates;
            this._initialized = true;
            console.log('[CONVERTER] Initialized with rates from:', result.source);
            return true;
        } catch (error) {
            console.error('[CONVERTER] Init failed:', error);
            // Use fallback rates
            this._rates = { ...FALLBACK_RATES };
            this._initialized = true;
            return false;
        }
    }

    /**
     * Detect user's preferred currency
     */
    _detectUserCurrency() {
        // 1. Check saved settings
        try {
            const saved = localStorage.getItem(this.SETTINGS_KEY);
            if (saved && CURRENCY_CONFIG[saved]) {
                console.log('[CONVERTER] Using saved currency:', saved);
                return saved;
            }
        } catch (e) { }

        // 2. Auto-detect from browser locale
        try {
            const locale = navigator.language || navigator.userLanguage || 'en-US';
            const regionCode = locale.split('-')[1];

            const regionToCurrency = {
                'US': 'USD', 'GB': 'GBP', 'UK': 'GBP',
                'FR': 'EUR', 'DE': 'EUR', 'ES': 'EUR', 'IT': 'EUR', 'NL': 'EUR',
                'BE': 'EUR', 'AT': 'EUR', 'IE': 'EUR', 'PT': 'EUR', 'FI': 'EUR',
                'JP': 'JPY', 'CN': 'CNY', 'AU': 'AUD', 'CA': 'CAD', 'CH': 'CHF'
            };

            if (regionCode && regionToCurrency[regionCode]) {
                console.log('[CONVERTER] Auto-detected currency:', regionToCurrency[regionCode]);
                return regionToCurrency[regionCode];
            }
        } catch (e) { }

        // 3. Default to USD
        console.log('[CONVERTER] Defaulting to USD');
        return 'USD';
    }

    /**
     * Get exchange rate between two currencies
     */
    getRate(from, to) {
        if (from === to) return 1;

        // Ensure rates are loaded
        if (!this._rates) {
            this._rates = { ...FALLBACK_RATES };
        }

        // Direct MAD -> Foreign
        if (from === 'MAD' && this._rates[to]) {
            return this._rates[to];
        }

        // Foreign -> MAD (inverse)
        if (to === 'MAD' && this._rates[from]) {
            return 1 / this._rates[from];
        }

        // Cross-rate (Foreign1 -> MAD -> Foreign2)
        if (this._rates[from] && this._rates[to]) {
            const madPerFrom = 1 / this._rates[from];
            return madPerFrom * this._rates[to];
        }

        // Fallback: return 1 (no conversion)
        console.warn(`[CONVERTER] No rate for ${from}?${to}`);
        return 1;
    }

    /**
     * Convert amount between currencies
     * Returns: number (2 decimal places)
     */
    convert(amount, from = 'MAD', to = null) {
        to = to || this._userCurrency;
        const rate = this.getRate(from, to);
        const result = amount * rate;

        // JPY uses no decimals, others use 2
        if (to === 'JPY') {
            return Math.round(result);
        }
        return Math.round(result * 100) / 100;
    }

    /**
     * Format converted amount with symbol
     */
    format(amount, currency = null) {
        currency = currency || this._userCurrency;
        const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.USD;
        const converted = typeof amount === 'number'
            ? (currency === 'JPY' ? Math.round(amount) : amount.toFixed(2))
            : amount;

        // Different formatting for different currencies
        if (currency === 'EUR') {
            return `€${converted}`;
        }
        if (currency === 'JPY' || currency === 'CNY') {
            return `¥${converted}`;
        }
        return `${config.symbol}${converted}`;
    }

    /**
     * Get quick preview text (for hover)
     */
    getPreview(madAmount, toCurrency = null) {
        toCurrency = toCurrency || this._userCurrency;
        const converted = this.convert(madAmount, 'MAD', toCurrency);
        return `˜ ${this.format(converted, toCurrency)}`;
    }

    /**
     * Get supported currencies list
     */
    getSupportedCurrencies() {
        return Object.values(CURRENCY_CONFIG);
    }

    /**
     * Get/Set user's preferred currency
     */
    get userCurrency() {
        return this._userCurrency;
    }

    set userCurrency(code) {
        if (CURRENCY_CONFIG[code]) {
            this._userCurrency = code;
            try {
                localStorage.setItem(this.SETTINGS_KEY, code);
            } catch (e) { }
            console.log('[CONVERTER] User currency set to:', code);
        }
    }

    /**
     * Get currency config
     */
    getCurrencyConfig(code) {
        return CURRENCY_CONFIG[code] || null;
    }

    /**
     * Refresh rates from provider
     */
    async refreshRates() {
        try {
            const result = await this.provider.refresh();
            this._rates = result.rates;
            return result;
        } catch (error) {
            console.error('[CONVERTER] Refresh failed:', error);
            return null;
        }
    }
};
window.IntelligentRoutePlanner = class IntelligentRoutePlanner {
    static WEIGHTS = { DISTANCE: 1.0, TIME_PENALTY: 15.0 };
    static PENALTIES = { HARD_STOP: 2000000, MISMATCH: 50000, SUNSET_PRIORITY: -10000 };

    constructor(places, config = {}) {
        this.places = places.map((p, idx) => {
            const name = (p.name || '').toLowerCase();
            let ops = p.openingHours || { open: 8, close: 23 };

            // 1. HARD-CODE DATA FIXES (V6.0 Control)
            if (name.includes('cooking')) {
                ops = { open: 10, close: 14 };
            }
            else if (name.includes('mouassine')) {
                ops = { open: 9, close: 21 };
            }
            else if (name.includes('fassia')) {
                ops = { open: 12, close: 22 };
            }

            return {
                ...p,
                _index: idx,
                id: p.id || `p${idx}`,
                openingHours: ops
            };
        });

        this.config = Object.assign({
            startTime: 9 * 60,       // 09:00
            walkingSpeed: 4.5,       // km/h
            taxiTime: 30,            // Fixed 30 min for remote legs
            maxWalkDistance: 2.0     // km before suggesting taxi
        }, config);

        this.distanceMatrix = this._buildDistanceMatrix();
    }

    _isTaxiZone(p) {
        if (!p) return false;
        const txt = ((p.id || '') + (p.name || '')).toLowerCase();
        return /quad|palmeraie|balloon|majorelle|menara|agafay/i.test(txt);
    }

    _haversineDistance(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    _buildDistanceMatrix() {
        const n = this.places.length;
        const matrix = Array(n).fill(null).map(() => Array(n).fill(0));

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) continue;
                const from = this.places[i];
                const to = this.places[j];
                const d = this._haversineDistance(from.lat, from.lng, to.lat, to.lng);

                // Bidirectional Taxi Logic
                if (this._isTaxiZone(from) || this._isTaxiZone(to) || d > this.config.maxWalkDistance) {
                    matrix[i][j] = 5.0; // Virtual distance
                } else {
                    matrix[i][j] = d;
                }
            }
        }
        return matrix;
    }

    _getPenalty(place, arrivalTimeMinutes) {
        const hour = arrivalTimeMinutes / 60;
        const name = (place.name || '').toLowerCase();
        const closeTime = place.openingHours ? place.openingHours.close : 23;

        // 1. GLOBAL EXECUTIONER: If arriving after close -> INSTANT DEATH
        if (hour >= closeTime) return IntelligentRoutePlanner.PENALTIES.HARD_STOP;

        // 2. ABSOLUTE TIME LOCKS (V6.0)

        // Jemaa el-Fnaa: Strict < 17:30
        if ((name.includes('jemaa') || name.includes('fnaa')) && hour < 17.5) {
            return 2000000; // INSTANT FAIL - Must be Sunset
        }

        // Cooking Class: Strict Start < 11.00 (Morning Anchor)
        if (name.includes('cooking') && hour > 11.0) return 2000000;

        // Hammam Mouassine: Strict Start < 19.00
        if (name.includes('mouassine') && hour > 19.0) return 1000000;

        // Saadian Tombs: Strict Finish < 17:00 (Start < 16:00)
        if (name.includes('saadian') && hour > 16.0) return 1500000;

        // Operational Cut-off (V6.0) - Any start > 20:00
        if (hour > 20.0) return 3000000;


        // 3. MEAL LOGIC & DEAD ZONES (15:30 - 18:30)
        const isResto = /restaurant|cafe|food|nomad|clock|fassia|lamine|amal/i.test(name + (place.category || ''));
        let penalty = 0;

        if (isResto) {
            // RESTAURANT DEAD ZONE (15:30 - 18:30)
            if (hour >= 15.5 && hour <= 18.5) {
                penalty += 500000; // Force into Lunch or Dinner
            }

            // Al Fassia Specific Lunch Window (12:30 - 15:00)
            if (name.includes('fassia')) {
                if (hour < 16.0 && (hour < 12.5 || hour > 15.0)) return 500000;
            }

            // General Lunch/Dinner Preferences
            const inLunch = (hour >= 12 && hour <= 15.5);
            const inDinner = (hour >= 19 && hour <= 22.5);

            // Lunch Only check
            if ((/lamine|amal/i.test(name)) && hour > 16.0) {
                return IntelligentRoutePlanner.PENALTIES.HARD_STOP;
            }

            if (!inLunch && !inDinner) penalty += 30000;
        }

        // Sunset Priority (if passed Jemaa check)
        // Even if late enough, incentivize exactly 17:30 - 18:30
        if (name.includes('jemaa') || name.includes('fnaa')) {
            if (hour >= 17.5 && hour <= 19.0) {
                penalty -= 5000; // Bonus
            }
        }

        return penalty;
    }

    optimize() {
        const startNode = this.places[0];
        const others = this.places.slice(1);
        // V6.0: Added 'cooking' to morning anchor filter
        const anchors = others.filter(p => /quad|palmeraie|balloon|cooking/i.test((p.id || '') + (p.name || '')));
        const rest = others.filter(p => !anchors.includes(p));
        this.places = [startNode, ...anchors, ...rest];
        this.distanceMatrix = this._buildDistanceMatrix();

        let route = Array.from({ length: this.places.length }, (_, i) => i);
        const optStartIndex = 1 + anchors.length; // LOCK MORNING

        let improved = true;
        if (optStartIndex < route.length - 1) {
            while (improved) {
                improved = false;
                for (let i = optStartIndex; i < route.length - 2; i++) { // Precise Loop
                    for (let j = i + 1; j < route.length; j++) {
                        const newRoute = [...route];
                        let l = i, r = j;
                        while (l < r) {
                            [newRoute[l], newRoute[r]] = [newRoute[r], newRoute[l]];
                            l++; r--;
                        }
                        if (this._calculateTotalCost(newRoute) < this._calculateTotalCost(route)) {
                            route = newRoute;
                            improved = true;
                        }
                    }
                }
            }
        }
        return this._generateDetailedOutput(route);
    }

    _calculateTotalCost(routeIndices) {
        let time = this.config.startTime;
        let cost = 0;
        for (let i = 0; i < routeIndices.length; i++) {
            const idx = routeIndices[i];
            const p = this.places[idx];
            if (i > 0) {
                const d = this.distanceMatrix[routeIndices[i - 1]][idx];
                time += (d === 5.0) ? this.config.taxiTime : (d / this.config.walkingSpeed) * 60;
            }
            cost += (this._getPenalty(p, time) * IntelligentRoutePlanner.WEIGHTS.TIME_PENALTY);
            time += (p.visitDuration || 60);
        }
        return cost;
    }

    _generateDetailedOutput(route) {
        const stops = [];
        const dropped = []; // TRACK DROPS
        let currentTime = this.config.startTime;

        // Temporary storage for stops to recalculate stats at end
        let rawStops = [];
        let hazards = [];
        let missionAborted = false;

        route.forEach((idx, i) => {
            const p = this.places[idx];

            // MISSION ABORT: Check if we are already past limit
            if (currentTime > 20.5 * 60) missionAborted = true;

            if (missionAborted) {
                dropped.push({ name: p.name, reason: 'Mission Fatigue (Time Limit)' });
                return;
            }

            let d = 0, t = 0, mode = 'Walk';

            if (i > 0) {
                const prevIdx = route[i - 1];
                const prevPlace = this.places[prevIdx];
                // TAXI ENFORCEMENT
                const isRemote = this._isTaxiZone(p) || this._isTaxiZone(prevPlace);
                if (isRemote) {
                    mode = 'Taxi'; d = 5.0; t = 30;
                } else {
                    const mDist = this.distanceMatrix[prevIdx][idx];
                    if (mDist === 5.0) { mode = 'Taxi'; d = 5.0; t = 30; }
                    else { d = mDist; t = (d / this.config.walkingSpeed) * 60; }
                }
                currentTime += t;
            }

            // DOUBLE CHECK TIMELINE POST-TRAVEL
            if (currentTime > 20.5 * 60) {
                missionAborted = true;
                dropped.push({ name: p.name, reason: 'Mission Fatigue (Time Limit)' });
                return;
            }

            const duration = p.visitDuration || 60;

            let context = 'destination';
            const hour = currentTime / 60;
            if (/amal|lamine|fassia/i.test(p.name)) {
                if (hour >= 12 && hour < 16) context = 'lunch';
                else if (hour >= 19) context = 'dinner';
            } else if (i === 0) context = 'start';

            rawStops.push({
                type: context,
                place: p,
                name: p.name,
                arrivalTime: currentTime,
                visitDuration: duration,
                transportLabel: mode,
                travelDistance: Number(d.toFixed(1)), // Leg distance
                travelTime: Math.round(t),             // Leg time
                icon: p.icon || '📍',
                crowdLevel: 'Medium'
            });

            if (i > 0) currentTime += duration;
        });

        // RECALCULATE STATS
        const finalStops = rawStops;
        const totalDist = finalStops.reduce((acc, s) => acc + s.travelDistance, 0);

        let totalDuration = 0;
        let lastEndTimeHours = 0;

        if (finalStops.length > 0) {
            const lastStop = finalStops[finalStops.length - 1];
            const endTime = lastStop.arrivalTime + lastStop.visitDuration;
            totalDuration = endTime - this.config.startTime;
            lastEndTimeHours = endTime / 60;
        }

        return {
            stops: finalStops,
            route: finalStops,
            dropped: dropped, // RETURN DROPPED INTEL
            totalDistance: Number(totalDist.toFixed(1)),
            totalTime: totalDuration,
            valid: {
                totalStops: finalStops.length,
                withinDaylight: lastEndTimeHours < 20.5
            },
            hazards: hazards
        };
    }
};

window.RoutePlanner = window.IntelligentRoutePlanner;

window.PhraseLibrary = class PhraseLibrary {
    constructor() {
        this.FAVORITES_KEY = 'alidade_phrase_favorites';
        this.USAGE_KEY = 'alidade_phrase_usage';
        this.audioCache = new Map();
        this.favorites = this._loadFavorites();
        this.usage = this._loadUsage();
        this.currentAudio = null;
        console.log('[PHRASE-LIB] Initialized');
    }

    /** Get all phrases in a category */
    getByCategory(category) {
        return ARABIC_PHRASES[category] || [];
    }

    /** Get all categories with counts */
    getCategories() {
        return Object.entries(ARABIC_PHRASES).map(([key, phrases]) => ({
            key,
            name: this._formatCategoryName(key),
            count: phrases.length,
            icon: this._getCategoryIcon(key)
        }));
    }

    _formatCategoryName(key) {
        const names = {
            greetings: 'Greetings',
            shopping: 'Shopping',
            directions: 'Directions',
            numbers: 'Numbers',
            emergency: 'Emergency',
            food: 'Food & Drink'
        };
        return names[key] || key;
    }

    _getCategoryIcon(key) {
        const icons = {
            greetings: '👋',
            shopping: '🛍️',
            directions: '🗺️',
            numbers: '🔢',
            emergency: '🚨',
            food: '🍽️'
        };
        return icons[key] || '??';
    }

    /** Search phrases by English, Arabic, or phonetic */
    search(query) {
        if (!query || query.length < 2) return [];
        const q = query.toLowerCase();
        return ALL_PHRASES.filter(p =>
            p.english.toLowerCase().includes(q) ||
            p.darija.toLowerCase().includes(q) ||
            p.phonetic.toLowerCase().includes(q) ||
            p.arabic.includes(query)
        ).slice(0, 20);
    }

    /** Play audio for a phrase */
    async playPhrase(phraseId) {
        const phrase = ALL_PHRASES.find(p => p.id === phraseId);
        if (!phrase) return false;

        // Track usage
        this._trackUsage(phraseId);

        // Stop any currently playing audio
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
        }

        try {
            // Check cache first
            if (this.audioCache.has(phrase.audio)) {
                this.currentAudio = this.audioCache.get(phrase.audio);
                this.currentAudio.currentTime = 0;
                await this.currentAudio.play();
                return true;
            }

            // Load and play
            const audio = new Audio(phrase.audio);
            audio.preload = 'auto';

            await new Promise((resolve, reject) => {
                audio.oncanplaythrough = resolve;
                audio.onerror = () => reject(new Error('Audio load failed'));
                setTimeout(() => reject(new Error('Audio timeout')), 5000);
            });

            this.audioCache.set(phrase.audio, audio);
            this.currentAudio = audio;
            await audio.play();
            Haptics?.trigger('light');
            return true;

        } catch (error) {
            console.warn('[PHRASE-LIB] Audio failed:', error);
            // Fallback: use Web Speech API
            return this._speakFallback(phrase.darija);
        }
    }

    /** Fallback speech synthesis */
    _speakFallback(text) {
        if (!('speechSynthesis' in window)) return false;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-MA';
        utterance.rate = 0.8;
        speechSynthesis.speak(utterance);
        return true;
    }

    /** Toggle favorite status */
    toggleFavorite(phraseId) {
        if (this.favorites.has(phraseId)) {
            this.favorites.delete(phraseId);
        } else {
            this.favorites.add(phraseId);
        }
        this._saveFavorites();
        Haptics?.trigger('light');
        return this.favorites.has(phraseId);
    }

    isFavorite(phraseId) {
        return this.favorites.has(phraseId);
    }

    getFavorites() {
        return ALL_PHRASES.filter(p => this.favorites.has(p.id));
    }

    /** Get most used phrases */
    getMostUsed(limit = 10) {
        const sorted = [...this.usage.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([id]) => ALL_PHRASES.find(p => p.id === id))
            .filter(Boolean);
        return sorted;
    }

    _trackUsage(phraseId) {
        const count = this.usage.get(phraseId) || 0;
        this.usage.set(phraseId, count + 1);
        this._saveUsage();
    }

    _loadFavorites() {
        try {
            const data = localStorage.getItem(this.FAVORITES_KEY);
            return new Set(data ? JSON.parse(data) : []);
        } catch { return new Set(); }
    }

    _saveFavorites() {
        try {
            localStorage.setItem(this.FAVORITES_KEY, JSON.stringify([...this.favorites]));
        } catch { }
    }

    _loadUsage() {
        try {
            const data = localStorage.getItem(this.USAGE_KEY);
            return new Map(data ? JSON.parse(data) : []);
        } catch { return new Map(); }
    }

    _saveUsage() {
        try {
            localStorage.setItem(this.USAGE_KEY, JSON.stringify([...this.usage]));
        } catch { }
    }

    /** Pre-cache audio for a category */
    async preloadCategory(category) {
        const phrases = this.getByCategory(category);
        for (const phrase of phrases.slice(0, 5)) {
            try {
                if (!this.audioCache.has(phrase.audio)) {
                    const audio = new Audio();
                    audio.preload = 'auto';
                    audio.src = phrase.audio;
                    this.audioCache.set(phrase.audio, audio);
                }
            } catch { }
        }
    }
};

window.PronunciationTrainer = class PronunciationTrainer {
    constructor() {
        this.isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
        this.recognition = null;
        this.isListening = false;
        this.currentPhrase = null;
        this.onResult = null;
        this.onError = null;
        console.log(`[PRONUNCIATION] Supported: ${this.isSupported}`);
    }

    _createInstance() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'ar-MA';
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 3;

        recognition.onresult = (event) => {
            let targetResult = null;

            // 1. Loop to find final result
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    targetResult = event.results[i];
                    break;
                }
            }

            // Fallback: Take last result if no final one found
            if (!targetResult && event.results.length > 0) {
                targetResult = event.results[event.results.length - 1];
            }

            if (!targetResult || targetResult.length === 0) {
                console.warn('[PRONUNCIATION] No valid results found');
                return;
            }

            // 2. Extract transcript for logging
            const transcript = targetResult[0].transcript;
            console.log("?? EXTRACTED TEXT:", transcript);

            // 3. Prepare results for processing (passing all alternatives)
            const processingResults = [];
            for (let i = 0; i < targetResult.length; i++) {
                processingResults.push({
                    transcript: targetResult[i].transcript,
                    confidence: targetResult[i].confidence
                });
            }

            this._processResults(processingResults);
        };

        recognition.onerror = (event) => {
            console.warn('[PRONUNCIATION] Error:', event.error);
            this.isListening = false;

            // Detailed error mapping
            const errorMap = {
                'no-speech': 'No speech detected. Please try again.',
                'audio-capture': 'No microphone found. Check your settings.',
                'not-allowed': 'Microphone permission denied.',
                'network': 'Network error. Check connection.',
                'aborted': 'Listening stopped.',
                'service-not-allowed': 'Voice service not allowed.'
            };

            const errorMessage = errorMap[event.error] || `Error: ${event.error}`;
            if (this.onError) this.onError(errorMessage);
        };

        recognition.onend = () => {
            this.isListening = false;
        };

        return recognition;
    }

    /** Start listening for pronunciation */
    async startPractice(phrase, onResult, onError) {
        if (!this.isSupported) {
            if (onError) onError('not_supported');
            return false;
        }

        if (!navigator.onLine) {
            if (onError) onError('offline');
            return false;
        }

        // 1. Stop Audio Conflict (Stop-Wait-Start Protocol)
        if (typeof phraseLibrary !== 'undefined' && phraseLibrary.currentAudio) {
            phraseLibrary.currentAudio.pause();
        }

        this.currentPhrase = phrase;
        this.onResult = onResult;
        this.onError = onError;

        try {
            // 2. Stop Recognition Conflict & Cleanup
            if (this.recognition) {
                // Unbind listeners to prevent phantom callbacks
                this.recognition.onresult = null;
                this.recognition.onerror = null;
                this.recognition.onend = null;
                try {
                    this.recognition.abort();
                } catch (e) {
                    console.warn('[PRONUNCIATION] Abort error:', e);
                }
                this.recognition = null;
            }

            // 3. Cool-down Delay (300ms) to release microphone lock
            await new Promise(resolve => setTimeout(resolve, 300));

            // 4. Create fresh instance
            this.recognition = this._createInstance();

            this.isListening = true;
            this.recognition.start();
            Haptics?.trigger('medium');

            // Auto-stop after 5 seconds (Internal Logic)
            setTimeout(() => {
                if (this.isListening) {
                    this.stopPractice();
                }
            }, 5000);

            return true;
        } catch (error) {
            console.error('[PRONUNCIATION] Start failed:', error);
            this.isListening = false;
            if (onError) onError('start_failed');
            return false;
        }
    }

    stopPractice() {
        if (this.recognition && this.isListening) {
            try {
                this.recognition.stop();
            } catch (e) {
                console.warn('[PRONUNCIATION] Stop error:', e);
            }
            this.isListening = false;
        }
    }

    _processResults(results) {
        console.log('[PRONUNCIATION] Raw Results:', results); // Debug log
        if (!this.currentPhrase || !this.onResult) return;

        let bestScore = -1;
        let bestTranscript = results[0]?.transcript || '';
        let usedTarget = '';

        for (const result of results) {
            // Pass the whole phrase to allow dual-script checking
            const { score, usedTarget: target } = this._calculateScore(this.currentPhrase, result.transcript, result.confidence);

            if (score > bestScore) {
                bestScore = score;
                bestTranscript = result.transcript;
                usedTarget = target;
            }
        }

        // Ensure we have a valid score (at least 0)
        bestScore = Math.max(0, bestScore);

        const feedback = this._generateFeedback(bestScore, usedTarget || this.currentPhrase.darija, bestTranscript);

        this.onResult({
            score: Math.round(bestScore),
            spoken: bestTranscript,
            target: usedTarget || this.currentPhrase.darija,
            feedback
        });
    }

    _normalize(text) {
        return text.toLowerCase()
            .replace(/[\u0600-\u06FF]/g, '') // Remove Arabic script
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    _normalizeArabic(text) {
        if (!text) return '';
        return text
            .replace(/[\u064B-\u065F]/g, '') // Remove Tashkeel (diacritics)
            .replace(/[أإآ]/g, 'ا')          // Normalize Alefs
            .replace(/[ى]/g, 'ي')            // Normalize Alef Maqsura
            .replace(/[ة]/g, 'ه')            // Normalize Taa Marbuta
            .replace(/[^\u0600-\u06FF\s0-9]/g, '') // Remove punctuation
            .replace(/\s+/g, ' ')
            .trim();
    }

    /** Dual-Script Scoring Logic */
    _calculateScore(phrase, spoken, confidence = 0.8) {
        if (!spoken) return { score: 0, usedTarget: '' };

        const isArabic = /[\u0600-\u06FF]/.test(spoken);
        let target = '';
        let normalizedSpoken = '';

        if (isArabic) {
            // Arabic Matching
            target = this._normalizeArabic(phrase.arabic);
            normalizedSpoken = this._normalizeArabic(spoken);
            console.log(`[SCORING] Mode: ARABIC | Target: ${target} | Spoken: ${normalizedSpoken}`);
        } else {
            // Latin/Darija Matching
            target = this._normalize(phrase.darija);
            normalizedSpoken = this._normalize(spoken);
            console.log(`[SCORING] Mode: LATIN | Target: ${target} | Spoken: ${normalizedSpoken}`);
        }

        // Exact match
        if (target === normalizedSpoken) return { score: 100, usedTarget: target };

        // Calculate Levenshtein distance
        const distance = this._levenshtein(target, normalizedSpoken);
        const maxLen = Math.max(target.length, normalizedSpoken.length);

        if (maxLen === 0) return { score: 100, usedTarget: target };

        // Base score from edit distance
        let score = (1 - distance / maxLen) * 100;

        // Apply fuzzy matching bonuses
        if (!isArabic) {
            score = this._applyFuzzyBonus(target, normalizedSpoken, score);
        } else {
            // Simple loose matching for Arabic if close enough
            if (score > 80) score += 5;
        }

        // Adjust for speech recognition confidence
        score = score * (0.5 + confidence * 0.5);

        return {
            score: Math.max(0, Math.min(100, score)),
            usedTarget: target
        };
    }

    _levenshtein(a, b) {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    }

    /** Fuzzy matching for Darija variations */
    _applyFuzzyBonus(target, spoken, baseScore) {
        const equivalents = [
            ['kh', 'ch', 'h'],
            ['gh', 'r'],
            ['q', 'k', 'g'],
            ['3', 'a', 'aa'],
            ['7', 'h'],
            ['th', 't'],
            ['dh', 'd'],
            ['ou', 'u', 'oo'],
            ['ay', 'ai', 'ei'],
            ['sh', 'ch']
        ];

        let normalizedTarget = target;
        let normalizedSpoken = spoken;

        for (const group of equivalents) {
            for (const variant of group) {
                normalizedTarget = normalizedTarget.replace(new RegExp(variant, 'g'), group[0]);
                normalizedSpoken = normalizedSpoken.replace(new RegExp(variant, 'g'), group[0]);
            }
        }

        if (normalizedTarget === normalizedSpoken) {
            return Math.min(100, baseScore + 20);
        }

        const newDistance = this._levenshtein(normalizedTarget, normalizedSpoken);
        const maxLen = Math.max(normalizedTarget.length, normalizedSpoken.length);
        const newScore = (1 - newDistance / maxLen) * 100;

        return Math.max(baseScore, (baseScore + newScore) / 2 + 5);
    }

    _generateFeedback(score, target, spoken) {
        const tips = [];

        // Check for difficult sounds
        if (target.includes('kh') && !spoken.toLowerCase().includes('kh')) {
            tips.push({ sound: 'kh', tip: "The 'kh' sound is like Scottish 'loch'" });
        }
        if (target.includes('gh') && !spoken.toLowerCase().includes('gh')) {
            tips.push({ sound: 'gh', tip: "The 'gh' is a guttural sound, like French 'r'" });
        }
        if (target.includes('3') || target.includes('ayn')) {
            tips.push({ sound: "'ayn", tip: "The 'ayn is pharyngeal - tighten your throat" });
        }
        if (target.includes('q') && !spoken.toLowerCase().includes('q')) {
            tips.push({ sound: 'q', tip: "The 'q' is a deep 'k' from the throat" });
        }

        let message, emoji;
        if (score >= 90) {
            message = "Excellent! Native-like pronunciation!";
            emoji = "🎉";
        } else if (score >= 75) {
            message = "Great job! Very clear.";
            emoji = "👍";
        } else if (score >= 60) {
            message = "Good effort! Keep practicing.";
            emoji = "💪";
        } else if (score >= 40) {
            message = "Needs work. Focus on the sounds.";
            emoji = "🤔";
        } else {
            message = "Try again. Listen carefully first.";
            emoji = "🔁";
        }

        return { message, emoji, tips };
    }

    /** Get phonetic breakdown for offline practice */
    getPhoneticBreakdown(phrase) {
        const syllables = phrase.phonetic.split('-');
        const breakdown = syllables.map(s => {
            const approximations = {
                'LAM': "'lam' as in 'llama'",
                'CHHAL': "'chhal' rhymes with 'shall'",
                'KHEER': "'kheer' with throaty 'kh'",
                'ZAF': "'zaf' as in 'staff'",
                'SHOO': "'shoo' as in 'shoe'",
                'BGHIT': "soft 'b', silent 'gh'"
            };
            return {
                syllable: s,
                approximation: approximations[s.toUpperCase()] || null
            };
        });

        return {
            syllables: breakdown,
            tips: [
                '🎧 Listen to audio carefully',
                '🔁 Repeat slowly, then faster',
                '✍️ Write it phonetically',
                '🎤 Record yourself and compare'
            ]
        };
    }
};
