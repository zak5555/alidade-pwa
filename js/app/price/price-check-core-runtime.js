// ---------------------------------------------------------------
// PRICE CHECK CORE RUNTIME (Extracted from app.js)
// ---------------------------------------------------------------

const priceCoreDebugLog = (...args) => {
    if (window.__ALIDADE_DEBUG_LOGS__ === true) {
        console.log(...args);
    }
};

class CrowdPriceDB {
    constructor() {
        this.endpoint = CONFIG.CROWD_PRICE_ENDPOINT;
        this.statsEndpoint = CONFIG.PRICE_STATS_ENDPOINT;
        this.apiKey = CONFIG.SUPABASE_ANON_KEY;
        this._retryQueue = this._loadRetryQueue();
        this._processRetryQueue(); // Process any queued submissions
    }

    /**
     * Submit a price report after a successful haggle
     * @param {Object} data - { itemType, pricePaid, askingPrice, qualityEstimate, area, lat, lng }
     */
    async submitPrice(data) {
        const priceUtils = window.ALIDADE_PRICE_UTILS;
        if (priceUtils && typeof priceUtils.resolveCrowdSubmitPriceFlow === 'function') {
            return await priceUtils.resolveCrowdSubmitPriceFlow(this, data, fetch, console);
        }
        return false;
    }

    /**
     * Get crowd-sourced price data for an item type + area
     * Returns { median, p25, p75, sampleSize, source } or null
     */
    async getCrowdData(itemType, area = 'unknown') {
        const priceUtils = window.ALIDADE_PRICE_UTILS;
        if (priceUtils && typeof priceUtils.resolveCrowdGetDataFlow === 'function') {
            return await priceUtils.resolveCrowdGetDataFlow(this, itemType, area, CONFIG, fetch, console);
        }
        return null;
    }

    /**
     * Fallback: get crowd data across all areas when area-specific is sparse
     */
    async _getCrowdDataAllAreas(itemType, since) {
        const priceUtils = window.ALIDADE_PRICE_UTILS;
        if (priceUtils && typeof priceUtils.resolveCrowdGetDataAllAreasFlow === 'function') {
            return await priceUtils.resolveCrowdGetDataAllAreasFlow(this, itemType, since, CONFIG, fetch);
        }
        return null;
    }

    /**
     * Compute price statistics from raw crowd data
     */
    _computeStats(data, area) {
        const priceUtils = window.ALIDADE_PRICE_UTILS;
        if (priceUtils && typeof priceUtils.resolveCrowdComputeStatsFlow === 'function') {
            return priceUtils.resolveCrowdComputeStatsFlow(data, area, CONFIG, console);
        }
        return null;
    }

    /**
     * Reward user with gamification points (local + UI feedback)
     */
    _rewardUser() {
        const priceUtils = window.ALIDADE_PRICE_UTILS;
        if (priceUtils && typeof priceUtils.resolveCrowdRewardUserFlow === 'function') {
            priceUtils.resolveCrowdRewardUserFlow(localStorage, console);
        }
    }

    /**
     * Queue failed submissions for retry when back online
     */
    _queueForRetry(submission) {
        const priceUtils = window.ALIDADE_PRICE_UTILS;
        if (priceUtils && typeof priceUtils.queueCrowdRetrySubmission === 'function') {
            this._retryQueue = priceUtils.queueCrowdRetrySubmission(this._retryQueue, submission, Date.now());
        } else {
            this._retryQueue.push({ ...submission, _retryAt: Date.now() });
        }
        this._saveRetryQueue();
        priceCoreDebugLog(`[CROWD] Queued for retry (${this._retryQueue.length} pending)`);
    }

    _loadRetryQueue() {
        const priceUtils = window.ALIDADE_PRICE_UTILS;
        if (priceUtils && typeof priceUtils.loadCrowdRetryQueue === 'function') {
            return priceUtils.loadCrowdRetryQueue(localStorage);
        }
        return [];
    }

    _saveRetryQueue() {
        localStorage.setItem('alidade_price_queue', JSON.stringify(this._retryQueue));
    }

    /**
     * Process queued submissions (fires on construction + online event)
     */
    async _processRetryQueue() {
        const priceUtils = window.ALIDADE_PRICE_UTILS;
        if (priceUtils && typeof priceUtils.resolveCrowdProcessRetryQueueFlow === 'function') {
            await priceUtils.resolveCrowdProcessRetryQueueFlow(this, fetch, console, Date.now);
        }
    }

    /**
     * Get user's crowdsource stats (local)
     */
    getUserStats() {
        const priceUtils = window.ALIDADE_PRICE_UTILS;
        if (priceUtils && typeof priceUtils.readCrowdUserStats === 'function') {
            return priceUtils.readCrowdUserStats(localStorage, this._retryQueue.length);
        }

        return {
            contributions: 0,
            points: 0,
            rank: 'Scout',
            pendingQueue: this._retryQueue.length
        };
    }
}

// Initialize global instance
window.crowdPriceDB = new CrowdPriceDB();

// Re-process queue when coming back online
window.addEventListener('online', () => {
    priceCoreDebugLog('[CROWD] Back online, processing retry queue...');
    window.crowdPriceDB._processRetryQueue();
});


// ===============================================================
// HYBRID PRICE CALCULATOR — Local DB + Crowd Data + Quality + Location
// ===============================================================

/**
 * Calculate fair price using hybrid data sources:
 * 1. Local PRICE_DATABASE_V2 (seed data — always available)
 * 2. Crowd-sourced data from Supabase (if available, 2s timeout)
 * 3. Quality multiplier from AI deep analysis
 * 4. Location adjustment based on GPS area
 *
 * @param {Object} deepAnalysis - AI analysis result (quality_multiplier, item, etc.)
 * @param {string} itemCategory - Item type key
 * @param {Object} [location] - { lat, lng } GPS coordinates (optional)
 * @returns {Object} - Comprehensive price assessment
 */
async function calculateHybridPrice(deepAnalysis, itemCategory, location) {
    const priceUtils = window.ALIDADE_PRICE_UTILS;
    const category = itemCategory || deepAnalysis?.item?.item_id || deepAnalysis?.item?.type;

    if (!category || !PRICE_DATABASE_V2[category]) {
        console.warn('[HYBRID_PRICE] No price data for:', category);
        return calculateSmartPrice(deepAnalysis, itemCategory); // Fallback to legacy
    }

    const localData = PRICE_DATABASE_V2[category];
    const qualityMultiplier = Math.max(0.3, Math.min(3.5, deepAnalysis?.quality_multiplier || 1.0));

    // Step 1: Detect location area (prefer shared context, then GPS fallback)
    let area = 'unknown';
    let gpsCoords = null;
    if (priceUtils && typeof priceUtils.resolveHybridAreaContext === 'function') {
        const areaContext = await priceUtils.resolveHybridAreaContext(
            window.contextEngine,
            location,
            () => getCurrentPosition(),
            (lat, lng) => detectSoukArea(lat, lng)
        );
        area = areaContext.area;
        gpsCoords = areaContext.gpsCoords;
    } else {
        area = window.contextEngine?.getContext('price_checker')?.location || 'unknown';
        gpsCoords = location || null;
        if (!gpsCoords && area === 'unknown') {
            try { gpsCoords = await getCurrentPosition(); } catch { /* silent */ }
        }
        if (gpsCoords) {
            area = detectSoukArea(gpsCoords.lat, gpsCoords.lng);
            if (window.contextEngine?.updateLocation) {
                await window.contextEngine.updateLocation(gpsCoords.lat, gpsCoords.lng, {
                    source: 'hybrid_price'
                });
            }
        }
    }

    // Step 2: Fetch crowd data (non-blocking, 2s timeout)
    const crowdData = priceUtils && typeof priceUtils.fetchHybridCrowdData === 'function'
        ? await priceUtils.fetchHybridCrowdData(
            window.crowdPriceDB,
            category,
            area,
            CONFIG.CROWD_DATA_TIMEOUT
        )
        : await (async () => {
            let data = null;
            try {
                data = await Promise.race([
                    window.crowdPriceDB.getCrowdData(category, area),
                    new Promise(resolve => setTimeout(() => resolve(null), CONFIG.CROWD_DATA_TIMEOUT))
                ]);
            } catch (e) {
                console.warn('[HYBRID_PRICE] Crowd fetch error:', e.message);
            }
            return data;
        })();

    // Step 3: Choose primary data source
    const sourceSelection = priceUtils && typeof priceUtils.selectHybridPriceSource === 'function'
        ? priceUtils.selectHybridPriceSource(crowdData, localData, CONFIG.CROWD_MIN_SAMPLES)
        : {
            useCrowd: crowdData && crowdData.sampleSize >= CONFIG.CROWD_MIN_SAMPLES,
            priceSource: crowdData && crowdData.sampleSize >= CONFIG.CROWD_MIN_SAMPLES ? crowdData : localData,
            dataSource: crowdData && crowdData.sampleSize >= CONFIG.CROWD_MIN_SAMPLES ? 'community' : 'database'
        };
    const useCrowd = sourceSelection.useCrowd;
    const priceSource = sourceSelection.priceSource;
    const dataSource = sourceSelection.dataSource;

    priceCoreDebugLog(`[HYBRID_PRICE] Source: ${dataSource} | Samples: ${priceSource.sampleSize}`);

    // Step 4: Determine quality bracket from AI multiplier
    const qualityBracket = priceUtils && typeof priceUtils.determineQualityBracket === 'function'
        ? priceUtils.determineQualityBracket(qualityMultiplier)
        : (() => {
            let bracket = 'medium';
            if (qualityMultiplier < 0.7) bracket = 'low';
            else if (qualityMultiplier >= 0.7 && qualityMultiplier < 1.3) bracket = 'medium';
            else if (qualityMultiplier >= 1.3 && qualityMultiplier < 2.2) bracket = 'high';
            else if (qualityMultiplier >= 2.2) bracket = 'premium';
            return bracket;
        })();

    // Step 5: Apply quality multiplier to base median
    const baseMedian = priceSource.median;
    const qualityAdjusted = Math.round(baseMedian * qualityMultiplier);

    // Step 6: Apply location multiplier
    const contextMultiplier = window.contextEngine?.getContext('price_checker')?.locationMultiplier;
    const locationMultiplier = priceUtils && typeof priceUtils.resolveHybridLocationMultiplier === 'function'
        ? priceUtils.resolveHybridLocationMultiplier(contextMultiplier, area, localData.locationFactors)
        : (typeof contextMultiplier === 'number' && area !== 'unknown')
            ? contextMultiplier
            : (localData.locationFactors?.[area] || 1.0);
    const locationAdjusted = Math.round(qualityAdjusted * locationMultiplier);

    // Step 7: Build full price range
    const prices = priceUtils && typeof priceUtils.buildHybridAdjustedPrices === 'function'
        ? priceUtils.buildHybridAdjustedPrices(priceSource, qualityMultiplier, qualityAdjusted)
        : {
            minimum: Math.round(priceSource.minimum * qualityMultiplier),
            p25: Math.round(priceSource.p25 * qualityMultiplier),
            median: qualityAdjusted,
            p75: Math.round(priceSource.p75 * qualityMultiplier),
            maximum: Math.round(priceSource.maximum * qualityMultiplier),
            mean: Math.round((priceSource.mean || priceSource.median) * qualityMultiplier),
            sampleSize: priceSource.sampleSize
        };

    // Step 8: Confidence calculation
    const totalConfidence = priceUtils && typeof priceUtils.calculateHybridConfidence === 'function'
        ? priceUtils.calculateHybridConfidence(priceSource, useCrowd)
        : (() => {
            const baseConfidence = priceSource.confidence || 0.5;
            const sampleBoost = Math.min(0.15, (priceSource.sampleSize / 200) * 0.15);
            const crowdBoost = useCrowd ? 0.1 : 0;
            return Math.min(0.98, baseConfidence + sampleBoost + crowdBoost);
        })();

    const result = priceUtils && typeof priceUtils.buildHybridPriceResult === 'function'
        ? priceUtils.buildHybridPriceResult({
            category,
            displayNameMap: ITEM_DISPLAY_NAMES,
            prices,
            localData,
            locationAdjusted,
            qualityMultiplier,
            qualityBracket,
            locationMultiplier,
            area,
            soukLandmarks: SOUK_LANDMARKS,
            dataSource,
            useCrowd,
            totalConfidence,
            priceSource,
            crowdData,
            baseMedian,
            qualityAdjusted,
            deepAnalysis
        })
        : {
            category,
            displayName: ITEM_DISPLAY_NAMES[category],
            prices,
            basePrices: localData,
            fairPrice: locationAdjusted,
            priceRange: {
                min: Math.round(locationAdjusted * 0.7),
                max: Math.round(locationAdjusted * 1.3)
            },
            qualityMultiplier,
            qualityBracket,
            locationMultiplier,
            locationFactor: locationMultiplier,
            area,
            areaName: SOUK_LANDMARKS[area]?.name || 'Unknown Area',
            areaMarkup: SOUK_LANDMARKS[area]?.markup || 'UNKNOWN',
            dataSource,
            source: useCrowd ? 'hybrid' : 'local',
            confidence: totalConfidence,
            sampleSize: priceSource.sampleSize,
            crowdData: useCrowd ? {
                median: crowdData.median,
                sampleSize: crowdData.sampleSize,
                avgQuality: crowdData.avgQuality
            } : null,
            breakdown: {
                baseMedian,
                qualityAdjustment: `×${qualityMultiplier.toFixed(1)}`,
                afterQuality: qualityAdjusted,
                locationAdjustment: `×${locationMultiplier.toFixed(1)} (${area})`,
                finalPrice: locationAdjusted
            },
            materialScore: deepAnalysis?.material?.score || 0,
            craftsmanshipScore: deepAnalysis?.craftsmanship?.score || 0,
            conditionScore: deepAnalysis?.condition?.score || 0,
            isHandmade: deepAnalysis?.authenticity?.genuine_handmade ?? null,
            redFlags: deepAnalysis?.authenticity?.red_flags || [],
            lastUpdated: priceSource.lastUpdated || new Date().toISOString(),
            isSimulated: false
        };

    if (window.contextEngine?.recordPriceCheck) {
        const contextPayload = priceUtils && typeof priceUtils.buildHybridContextPayload === 'function'
            ? priceUtils.buildHybridContextPayload(
                category,
                area,
                locationAdjusted,
                qualityMultiplier,
                dataSource,
                priceSource.sampleSize
            )
            : {
                itemType: category,
                area,
                fairPrice: locationAdjusted,
                qualityMultiplier,
                dataSource,
                sampleSize: priceSource.sampleSize
            };
        window.contextEngine.recordPriceCheck(contextPayload);
    }

    if (window.sessionIntel?.logActivity) {
        const sessionPayload = priceUtils && typeof priceUtils.buildHybridSessionActivityPayload === 'function'
            ? priceUtils.buildHybridSessionActivityPayload(
                category,
                locationAdjusted,
                area,
                qualityMultiplier,
                dataSource
            )
            : {
                itemType: category,
                fairPrice: locationAdjusted,
                area,
                qualityMultiplier,
                source: dataSource
            };
        window.sessionIntel.logActivity('price_check', sessionPayload);
    }

    priceCoreDebugLog(`[HYBRID_PRICE] ${category}: ${baseMedian} x${qualityMultiplier.toFixed(1)} x${locationMultiplier.toFixed(1)} -> ${locationAdjusted} DH (${dataSource}, ${qualityBracket})`);

    return result;
}


// ===============================================================
// POST-HAGGLE CONTRIBUTION PROMPT
// ===============================================================

/**
 * Show contribution modal after user completes a price check
 * Encourages Waze-style price reporting
 */
function showContributionPrompt(haggledPrice, classification, fairPrice) {
    const savings = fairPrice - haggledPrice;
    const savingsText = savings > 0 ? `${savings} DH saved` : 'No savings';
    const savingsIcon = savings > 0 ? '[+]' : '[=]';
    const userStats = window.crowdPriceDB?.getUserStats() || { contributions: 0, points: 0, rank: 'Scout' };
    const priceUtils = window.ALIDADE_PRICE_UTILS;

    const modalHTML = priceUtils && typeof priceUtils.buildContributionModalHtml === 'function'
        ? priceUtils.buildContributionModalHtml(haggledPrice, savings, savingsText, savingsIcon, userStats)
        : '';
    if (!modalHTML) return;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Contribute button
    document.getElementById('btn-contribute-price')?.addEventListener('click', async () => {
        const btn = document.getElementById('btn-contribute-price');
        if (!priceUtils || typeof priceUtils.setContributionSubmitPending !== 'function') return;
        priceUtils.setContributionSubmitPending(btn);

        const pos = await getCurrentPosition();
        const area = priceUtils && typeof priceUtils.resolveContributionArea === 'function'
            ? priceUtils.resolveContributionArea(pos, detectSoukArea)
            : 'unknown';
        const contributionPayload = typeof priceUtils.buildContributionSubmissionPayload === 'function'
            ? priceUtils.buildContributionSubmissionPayload(classification, haggledPrice, area, pos)
            : null;
        if (!contributionPayload) return;

        await window.crowdPriceDB.submitPrice(contributionPayload);

        if (typeof priceUtils.markContributionSubmitted !== 'function') return;
        priceUtils.markContributionSubmitted(btn);

        if (typeof priceUtils.notifyContributionSuccess === 'function') {
            priceUtils.notifyContributionSuccess(showToast);
        }

        if (typeof priceUtils.scheduleContributionModalClose === 'function') {
            priceUtils.scheduleContributionModalClose(document, 1200);
        }
    });

    // Skip button
    document.getElementById('btn-skip-contribute')?.addEventListener('click', () => {
        if (priceUtils && typeof priceUtils.closeContributionModal === 'function') {
            priceUtils.closeContributionModal(document);
        }
    });
}

// Expose globally for external access
window.showContributionPrompt = showContributionPrompt;
window.calculateHybridPrice = calculateHybridPrice;
window.detectSoukArea = detectSoukArea;


// ---------------------------------------------------------------
// CLASS: VisionAPIClient (Real AI Image Recognition)
// ---------------------------------------------------------------

/**
 * Vision API Client - Handles real AI image recognition
 * Uses Gemini 2.0 Flash for accurate item detection
 */
class VisionAPIClient {
    constructor() {
        this.provider = CONFIG.VISION_API;
        this.requestCount = 0;
        this.failureCount = 0;
    }

    /**
     * Main entry point - Analyze image and return item category
     */
    async analyzeImage(imageBase64, fallbackToManual = true) {
        const priceUtils = window.ALIDADE_PRICE_UTILS;
        if (priceUtils && typeof priceUtils.resolveVisionAnalyzeImageFlow === 'function') {
            return await priceUtils.resolveVisionAnalyzeImageFlow(
                this,
                imageBase64,
                fallbackToManual,
                CONFIG.VISION_API,
                () => this._callOpenRouter(imageBase64),
                () => this._callDeepSeek(imageBase64),
                () => this._callGemini(imageBase64),
                (base64Value) => this._fallbackToManual(base64Value),
                console
            );
        }

        const provider = priceUtils && typeof priceUtils.resolveVisionProvider === 'function'
            ? priceUtils.resolveVisionProvider(CONFIG.VISION_API)
            : CONFIG.VISION_API || 'GEMINI';

        try {
            if (provider === 'OPENROUTER') {
                return await this._callOpenRouter(imageBase64);
            }
            if (provider === 'DEEPSEEK') {
                return await this._callDeepSeek(imageBase64);
            }
            return await this._callGemini(imageBase64);
        } catch (error) {
            console.error('[VISION API] Error:', error);
            this.failureCount++;
            if (fallbackToManual) {
                return await this._fallbackToManual(imageBase64);
            }
            throw error;
        }
    }

    /**
     * Call Gemini 2.0 Flash API (The Hybrid Net Strategy)
     */
    async _callGemini(imageBase64) {
        const priceUtils = window.ALIDADE_PRICE_UTILS;
        if (priceUtils && typeof priceUtils.resolveGeminiVisionCallFlow === 'function') {
            return await priceUtils.resolveGeminiVisionCallFlow(
                this,
                imageBase64,
                CONFIG,
                ITEM_DISPLAY_NAMES,
                fetch,
                performance,
                console
            );
        }
        throw new Error('resolveGeminiVisionCallFlow is not available');
    }
    /**
     * Call DeepSeek API (OpenAI-compatible format)
     */
    async _callDeepSeek(imageBase64) {
        const priceUtils = window.ALIDADE_PRICE_UTILS;
        if (priceUtils && typeof priceUtils.resolveDeepSeekVisionCallFlow === 'function') {
            return await priceUtils.resolveDeepSeekVisionCallFlow(
                this,
                imageBase64,
                CONFIG,
                ITEM_DISPLAY_NAMES,
                fetch,
                performance,
                console,
                typeof window.alert === 'function' ? window.alert.bind(window) : null
            );
        }
        throw new Error('resolveDeepSeekVisionCallFlow is not available');
    }

    /**
     * Call OpenRouter API (Universal API Gateway with FREE vision models)
     */
    async _callOpenRouter(imageBase64) {
        const priceUtils = window.ALIDADE_PRICE_UTILS;
        if (priceUtils && typeof priceUtils.resolveOpenRouterVisionCallFlow === 'function') {
            return await priceUtils.resolveOpenRouterVisionCallFlow(
                this,
                imageBase64,
                CONFIG,
                ITEM_DISPLAY_NAMES,
                fetch,
                performance,
                console,
                typeof window.alert === 'function' ? window.alert.bind(window) : null
            );
        }
        throw new Error('resolveOpenRouterVisionCallFlow is not available');
    }

    // ... (Keep _fallbackToManual, _base64ToBlob, getStats as they are)

    async _fallbackToManual(imageBase64) {
        const priceUtils = window.ALIDADE_PRICE_UTILS;
        if (priceUtils && typeof priceUtils.runVisionManualFallback === 'function') {
            return priceUtils.runVisionManualFallback(
                imageBase64,
                (b64) => this._base64ToBlob(b64),
                ItemClassifier,
                URL
            );
        }

        // Get the classifier instance to access showCategorySelector
        const classifier = new ItemClassifier();
        const blob = await this._base64ToBlob(imageBase64);
        const imageURL = URL.createObjectURL(blob);
        return await classifier.showCategorySelector(imageURL);
    }

    async _base64ToBlob(base64) {
        const response = await fetch(base64);
        return await response.blob();
    }

    getStats() {
        const priceUtils = window.ALIDADE_PRICE_UTILS;
        if (priceUtils && typeof priceUtils.buildVisionStats === 'function') {
            return priceUtils.buildVisionStats(this.requestCount, this.failureCount);
        }
        return {
            requestCount: this.requestCount,
            failureCount: this.failureCount
        };
    }

    /**
     * DEEP ANALYSIS: Multi-zone Gemini call with craftsmanship + material + authenticity prompt
     * Sends 3 image zones in ONE request for comprehensive appraisal
     */
    async callGeminiDeep(zones) {
        const priceUtils = window.ALIDADE_PRICE_UTILS;
        if (priceUtils && typeof priceUtils.resolveGeminiDeepCallFlow === 'function') {
            return await priceUtils.resolveGeminiDeepCallFlow(
                this,
                zones,
                CONFIG,
                fetch,
                performance,
                console
            );
        }
        throw new Error('resolveGeminiDeepCallFlow is not available');
    }
}


// ---------------------------------------------------------------
// DEEP ANALYSIS: Orchestrator & Smart Price Calculator
// ---------------------------------------------------------------

/**
 * ONE SHOT, DEEP ANALYSIS Pipeline
 * 1. Extract 3 zones from single photo (DeepImageAnalyzer)
 * 2. Send all zones to Gemini in ONE request
 * 3. Return comprehensive appraisal with quality multiplier
 */
async function analyzeSingleShotDeep(imageSource) {
    const priceUtils = window.ALIDADE_PRICE_UTILS;
    if (priceUtils && typeof priceUtils.runSingleShotDeepAnalysis === 'function') {
        return priceUtils.runSingleShotDeepAnalysis(imageSource, DeepImageAnalyzer, VisionAPIClient);
    }

    const deepAnalyzer = new DeepImageAnalyzer();
    const visionClient = new VisionAPIClient();

    // Step 1: Extract intelligent zones
    const zones = await deepAnalyzer.extractZones(imageSource);

    // Step 2: Send to Gemini for multi-zone analysis
    const analysis = await visionClient.callGeminiDeep(zones);

    return analysis;
}

/**
 * Calculate fair price adjusted by quality multiplier
 * Uses base price data + AI quality assessment
 */
function calculateSmartPrice(deepAnalysis, itemCategory) {
    const priceUtils = window.ALIDADE_PRICE_UTILS;
    if (priceUtils && typeof priceUtils.calculateSmartPriceResult === 'function') {
        return priceUtils.calculateSmartPriceResult(
            deepAnalysis,
            itemCategory,
            MOCK_PRICE_DATABASE,
            ITEM_DISPLAY_NAMES
        );
    }

    const category = itemCategory || deepAnalysis.item?.item_id;

    if (!category || !MOCK_PRICE_DATABASE[category]) {
        console.warn('[SMART_PRICE] No price data for:', category);
        return null;
    }

    const baseData = MOCK_PRICE_DATABASE[category];
    const multiplier = Math.max(0.3, Math.min(3.5, deepAnalysis.quality_multiplier || 1.0));

    // Apply quality multiplier to price range
    const adjustedPrices = {
        minimum: Math.round(baseData.minimum * multiplier),
        p25: Math.round(baseData.p25 * multiplier),
        median: Math.round(baseData.median * multiplier),
        p75: Math.round(baseData.p75 * multiplier),
        maximum: Math.round(baseData.maximum * multiplier),
        mean: Math.round(baseData.mean * multiplier),
        sampleSize: baseData.sampleSize
    };

    priceCoreDebugLog('[SMART_PRICE] Quality multiplier:', multiplier.toFixed(2),
        '| Base median:', baseData.median, '-> Adjusted:', adjustedPrices.median);

    return {
        category,
        displayName: ITEM_DISPLAY_NAMES[category],
        prices: adjustedPrices,
        basePrices: baseData,
        qualityMultiplier: multiplier,
        materialScore: deepAnalysis.material?.score || 0,
        craftsmanshipScore: deepAnalysis.craftsmanship?.score || 0,
        conditionScore: deepAnalysis.condition?.score || 0,
        isHandmade: deepAnalysis.authenticity?.genuine_handmade ?? null,
        redFlags: deepAnalysis.authenticity?.red_flags || [],
        lastUpdated: new Date().toISOString(),
        isSimulated: false
    };
}

// ---------------------------------------------------------------
// CLASS: ItemClassifier (TensorFlow.js + Mock Mode)
// ---------------------------------------------------------------

class ItemClassifier {
    constructor() {
        this.model = null;
        this.labels = ITEM_LABELS;
        this.isLoaded = false;
        this.visionAPI = new VisionAPIClient(); // NEW: Add API client
    }

    async loadModel() {
        if (CONFIG.SIMULATION_MODE) {
            priceCoreDebugLog('[ML] SIMULATION MODE - Skipping model load');
            this.isLoaded = true;
            return;
        }

        // No longer needed with API, but keep for compatibility
        priceCoreDebugLog('[ML] Using cloud vision API instead of local model');
        this.isLoaded = true;
    }

    async classify(imageTensor, imageBlob) {
        const priceUtils = window.ALIDADE_PRICE_UTILS;
        // FIX: Only use simulation mode if explicitly set in CONFIG
        // The camera.simulationMode flag is for camera access, NOT for AI detection
        // When AI is enabled (SIMULATION_MODE = false), always try Gemini first
        if (CONFIG.SIMULATION_MODE) {
            priceCoreDebugLog('[CLASSIFIER] SIMULATION_MODE enabled - using manual selection');
            const imageURL = priceUtils && typeof priceUtils.resolveClassifierPreviewUrl === 'function'
                ? priceUtils.resolveClassifierPreviewUrl(imageBlob, URL)
                : imageBlob ? URL.createObjectURL(imageBlob) : null;
            return await this.showCategorySelector(imageURL);
        }

        // NEW: Convert to base64 and call Vision API
        const imageBase64 = priceUtils && typeof priceUtils.prepareClassifierInputBase64 === 'function'
            ? await priceUtils.prepareClassifierInputBase64(
                imageTensor,
                imageBlob,
                (blob) => this._blobToBase64(blob),
                tf,
                document
            )
            : await (async () => {
                let prepared = null;
                if (imageBlob) {
                    // Convert blob to base64
                    prepared = await this._blobToBase64(imageBlob);
                } else if (imageTensor && imageTensor.shape) {
                    // Convert TensorFlow tensor to base64
                    const canvas = document.createElement('canvas');
                    canvas.width = imageTensor.shape[1];
                    canvas.height = imageTensor.shape[0];

                    await tf.browser.toPixels(imageTensor, canvas);
                    prepared = canvas.toDataURL('image/jpeg', 0.8);
                } else if (typeof imageTensor === 'string') {
                    // Already base64
                    prepared = imageTensor;
                } else {
                    throw new Error('Invalid image format');
                }
                return prepared;
            })();

        // Call Vision API
        try {
            priceCoreDebugLog('[CLASSIFIER] Calling Vision API for real AI detection...');
            const result = await this.visionAPI.analyzeImage(imageBase64, false); // FIX: Don't fallback to manual - let caller handle that

            if (priceUtils && typeof priceUtils.logClassifierResultSummary === 'function') {
                priceUtils.logClassifierResultSummary(result);
            } else {
                priceCoreDebugLog('[CLASSIFIER] ----------------------------------------');
                priceCoreDebugLog('[CLASSIFIER] ? AI DETECTION RESULT:');
                priceCoreDebugLog('[CLASSIFIER]    Item:', result.topPrediction?.label);
                priceCoreDebugLog('[CLASSIFIER]    Confidence:', result.confidence);
                priceCoreDebugLog('[CLASSIFIER]    Reasoning:', result.reasoning);
                priceCoreDebugLog('[CLASSIFIER] ----------------------------------------');
            }

            // Verify result has required format
            const hasValidResult = priceUtils && typeof priceUtils.hasValidClassifierResult === 'function'
                ? priceUtils.hasValidClassifierResult(result)
                : !!(result.topPrediction && result.topPrediction.label);
            if (!hasValidResult) {
                console.error('[CLASSIFIER] ? Invalid API response:', result);
                throw new Error('Invalid response format');
            }

            return result;

        } catch (error) {
            console.error('[CLASSIFIER] Vision API failed:', error);

            // Final fallback: manual selection
            if (priceUtils && typeof priceUtils.runClassifierManualFallback === 'function') {
                return priceUtils.runClassifierManualFallback(
                    imageBase64,
                    (base64) => this._base64ToBlob(base64),
                    (imageURL) => this.showCategorySelector(imageURL),
                    URL
                );
            }
            const blob = await this._base64ToBlob(imageBase64);
            const imageURL = URL.createObjectURL(blob);
            return await this.showCategorySelector(imageURL);
        }
    }

    _blobToBase64(blob) {
        const priceUtils = window.ALIDADE_PRICE_UTILS;
        if (priceUtils && typeof priceUtils.blobToBase64 === 'function') {
            return priceUtils.blobToBase64(blob);
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    async _base64ToBlob(base64) {
        const priceUtils = window.ALIDADE_PRICE_UTILS;
        if (priceUtils && typeof priceUtils.base64ToBlob === 'function') {
            return priceUtils.base64ToBlob(base64);
        }

        const response = await fetch(base64);
        return await response.blob();
    }

    async showCategorySelector(imagePreview) {
        return new Promise((resolve) => {
            const priceUtils = window.ALIDADE_PRICE_UTILS;
            const categories = resolveItemClassifierCategorySelectorCategoriesCompat(priceUtils);
            const modalHTML = buildItemClassifierCategorySelectorModalCompat(priceUtils, categories, imagePreview);
            openItemClassifierCategorySelectorModalCompat(priceUtils, modalHTML, resolve);
        });
    }

    _getTopPredictions(probabilities, k) {
        const indexed = Array.from(probabilities)
            .map((p, i) => ({
                label: this.labels[i],
                displayName: ITEM_DISPLAY_NAMES[this.labels[i]] || this.labels[i],
                confidence: p
            }))
            .sort((a, b) => b.confidence - a.confidence);

        const top = indexed.slice(0, k);

        return {
            topPrediction: top[0],
            alternatives: top.slice(1),
            confidence: top[0].confidence
        };
    }
}


// ---------------------------------------------------------------
// CLASS: PriceDatabase (API + Mock Mode + Offline Cache)
// ---------------------------------------------------------------

class PriceDatabase {
    constructor() {
        this.apiUrl = CONFIG.API_URL;
        this.cache = this._loadCache();
    }

    async lookupPrice(itemCategory, attributes = {}) {
        // Semantic Mapping: If category is unknown or low confidence, check for material fallback
        let targetCategory = itemCategory;

        if (!MOCK_PRICE_DATABASE[targetCategory]) {
            console.warn('[PRICE] Unknown category:', targetCategory, 'Searching for semantic parent...');
            if (targetCategory.includes('leather')) targetCategory = 'generic_leather';
            else if (targetCategory.includes('ceramic')) targetCategory = 'generic_ceramic';
            else if (targetCategory.includes('rug')) targetCategory = 'generic_rug';
            else if (targetCategory.includes('lantern')) targetCategory = 'generic_metal';
            else targetCategory = 'generic_item';
        }

        // SIMULATION MODE: Use mock database
        if (CONFIG.SIMULATION_MODE) {
            return this._mockLookup(targetCategory);
        }

        // Try cache first (offline support)
        const cacheKey = this._getCacheKey(targetCategory, attributes);
        if (this.cache[cacheKey]) {
            priceCoreDebugLog('[PRICE] Cache hit:', cacheKey);
            return { ...this.cache[cacheKey], fromCache: true };
        }

        // Fetch from API
        try {
            const response = await fetch(`${this.apiUrl}/lookup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category: itemCategory, attributes })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();

            // Cache result
            this.cache[cacheKey] = data;
            this._saveCache();

            return data;
        } catch (error) {
            console.error('[PRICE] API lookup failed:', error);

            // Fallback to mock data if available
            if (MOCK_PRICE_DATABASE[itemCategory]) {
                priceCoreDebugLog('[PRICE] Using offline fallback');
                return this._mockLookup(itemCategory, true);
            }

            throw new Error('Price lookup failed. Check internet connection.');
        }
    }

    _mockLookup(itemCategory, isOffline = false) {
        const prices = MOCK_PRICE_DATABASE[itemCategory];

        if (!prices) {
            return {
                category: itemCategory,
                error: 'No price data available for this item',
                prices: null
            };
        }

        priceCoreDebugLog('[PRICE] Mock lookup:', itemCategory);

        return {
            category: itemCategory,
            displayName: ITEM_DISPLAY_NAMES[itemCategory],
            prices: prices,
            lastUpdated: new Date().toISOString(),
            fromCache: isOffline,
            isSimulated: CONFIG.SIMULATION_MODE
        };
    }

    _getCacheKey(category, attrs) {
        return `${category}_${JSON.stringify(attrs)}`;
    }

    _loadCache() {
        try {
            const saved = localStorage.getItem('alidade_price_cache');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    }

    _saveCache() {
        try {
            localStorage.setItem('alidade_price_cache', JSON.stringify(this.cache));
        } catch (e) {
            console.warn('[PRICE] Cache save failed:', e);
        }
    }
}


// ---------------------------------------------------------------
// CLASS: ScamDetector (Analysis Engine)
// ---------------------------------------------------------------

class ScamDetector {
    analyze(vendorPrice, priceData) {
        if (!priceData || !priceData.prices) {
            return {
                verdict: 'unknown',
                level: 'neutral',
                message: '[INFO] No price data available for this item.',
                recommendation: 'We don\'t have enough data. Use general bargaining rules.',
                confidence: 0,
                details: { vendorPrice }
            };
        }

        const fairPrice = priceData.prices.median;
        const upperBound = priceData.prices.p75;
        const lowerBound = priceData.prices.p25;

        // Calculate markup percentage
        const markup = (vendorPrice - fairPrice) / fairPrice;

        let verdict, level, message, recommendation;

        if (markup > 1.5) {
            // 150%+ markup
            verdict = 'scam';
            level = 'danger';
            message = '[ALERT] SCAM ALERT! Price is 150%+ above fair value!';
            recommendation = `Walk away immediately. Fair price: ${fairPrice} DH. They're trying to scam you.`;

        } else if (markup > 1.0) {
            // 100-150% markup
            verdict = 'tourist_trap';
            level = 'warning';
            message = '[WARN] SEVERE tourist markup! Negotiation essential.';
            recommendation = `Start at ${Math.round(fairPrice * 0.7)} DH, be willing to walk at ${Math.round(fairPrice * 1.1)} DH.`;

        } else if (markup > 0.5) {
            // 50-100% markup
            verdict = 'high_markup';
            level = 'caution';
            message = '[WARN] High markup. Significant room to negotiate.';
            recommendation = `Offer ${Math.round(fairPrice * 0.8)} DH, accept up to ${upperBound} DH.`;

        } else if (markup > 0.2) {
            // 20-50% markup
            verdict = 'reasonable';
            level = 'ok';
            message = '[OK] Within reasonable range. Light negotiation possible.';
            recommendation = `Fair price. Try ${Math.round(vendorPrice * 0.9)} DH for a small discount.`;

        } else if (markup >= 0) {
            // 0-20% markup
            verdict = 'good_deal';
            level = 'success';
            message = '[GOOD] Good deal! Close to or at fair price.';
            recommendation = `Accept this price or offer ${Math.round(vendorPrice * 0.95)} DH.`;

        } else if (markup >= -0.3) {
            // 0-30% below fair price
            verdict = 'great_deal';
            level = 'success';
            message = '[GOOD] GREAT deal! Below typical market price.';
            recommendation = 'Buy it! This is a genuinely good price.';

        } else {
            // 30%+ below fair price
            verdict = 'suspicious';
            level = 'warning';
            message = '[WARN] Suspiciously cheap. Inspect quality carefully!';
            recommendation = 'Check for fakes, defects, or low-quality materials. If genuine, it\'s a steal.';
        }

        // Confidence based on sample size
        const confidence = this._calculateConfidence(priceData.prices.sampleSize);

        return {
            verdict,
            level,
            message,
            recommendation,
            confidence,
            details: {
                vendorPrice,
                fairPrice,
                priceRange: { min: lowerBound, max: upperBound },
                markup: Math.round(markup * 100),
                sampleSize: priceData.prices.sampleSize
            }
        };
    }

    _calculateConfidence(sampleSize) {
        if (sampleSize >= 50) return 95;
        if (sampleSize >= 30) return 85;
        if (sampleSize >= 20) return 75;
        if (sampleSize >= 10) return 65;
        return 50;
    }
}


// ---------------------------------------------------------------
// MAIN: PriceChecker Controller
// ---------------------------------------------------------------

class PriceChecker {
    constructor() {
        this.camera = new PhotoCapture();
        this.processor = new ImageProcessor();
        this.classifier = new ItemClassifier();
        this.priceDB = new PriceDatabase();
        this.scamDetector = new ScamDetector();

        this.currentClassification = null;
        this.currentPhotoBlob = null;
        this.state = 'idle'; // idle, camera, analyzing, results, manual
        this.scanQuotaConsumed = false;
    }

    async startCamera(containerEl) {
        const priceUtils = window.ALIDADE_PRICE_UTILS;
        if (priceUtils && typeof priceUtils.resolvePriceCheckerStartCamera === 'function') {
            return await priceUtils.resolvePriceCheckerStartCamera(this, containerEl, console);
        }

        const stream = await this.camera.requestCamera();
        const videoEl = containerEl.querySelector('#price-check-video');
        if (videoEl) {
            videoEl.srcObject = stream;
            videoEl.setAttribute('playsinline', 'true');
            videoEl.muted = true;
            await videoEl.play();
            priceCoreDebugLog('[CAMERA] Video element playing');
        }
        this.scanQuotaConsumed = false;
        this.state = 'camera';
        return true;
    }

    stopCamera() {
        const priceUtils = window.ALIDADE_PRICE_UTILS;
        if (priceUtils && typeof priceUtils.resolvePriceCheckerStopCamera === 'function') {
            return priceUtils.resolvePriceCheckerStopCamera(this);
        }
        this.camera.stopCamera();
        this.state = 'idle';
        return true;
    }

    async captureAndAnalyze(videoEl) {
        const priceUtils = window.ALIDADE_PRICE_UTILS;
        if (priceUtils && typeof priceUtils.resolvePriceCheckerCaptureAndAnalyze === 'function') {
            return await priceUtils.resolvePriceCheckerCaptureAndAnalyze(this, videoEl, console);
        }

        this.state = 'analyzing';
        const photoBlob = await this.camera.capturePhoto(videoEl);
        this.currentPhotoBlob = photoBlob;
        this.stopCamera();

        const tensor = await this.processor.preprocessImage(photoBlob);
        const classification = await this.classifier.classify(tensor, photoBlob);
        if (!classification) {
            this.state = 'idle';
            return {
                needsManualSelection: false,
                classification: null,
                cancelled: true
            };
        }

        this.currentClassification = classification;
        return {
            needsManualSelection: false,
            classification
        };
    }

    async callVisionAPI(imageBlob) {
        const priceUtils = window.ALIDADE_PRICE_UTILS;
        if (priceUtils && typeof priceUtils.resolvePriceCheckerCallVisionApi === 'function') {
            return await priceUtils.resolvePriceCheckerCallVisionApi(setTimeout, console);
        }
        return null;
    }

    async analyzePrice(itemCategory, vendorPrice) {
        const priceUtils = window.ALIDADE_PRICE_UTILS;
        if (priceUtils && typeof priceUtils.resolvePriceCheckerAnalyzePrice === 'function') {
            return await priceUtils.resolvePriceCheckerAnalyzePrice(
                this,
                itemCategory,
                vendorPrice,
                ITEM_DISPLAY_NAMES,
                console
            );
        }

        const priceData = await this.priceDB.lookupPrice(itemCategory);
        const analysis = this.scamDetector.analyze(vendorPrice, priceData);
        this.state = 'results';
        return {
            item: {
                category: itemCategory,
                displayName: ITEM_DISPLAY_NAMES[itemCategory] || itemCategory
            },
            priceData,
            analysis,
            verdict: analysis.verdict,
            recommendation: analysis.recommendation
        };
    }

    reset() {
        const priceUtils = window.ALIDADE_PRICE_UTILS;
        if (priceUtils && typeof priceUtils.resolvePriceCheckerReset === 'function') {
            return priceUtils.resolvePriceCheckerReset(this);
        }
        this.stopCamera();
        this.currentClassification = null;
        this.currentPhotoBlob = null;
        this.state = 'idle';
        this.scanQuotaConsumed = false;
        return true;
    }
}
