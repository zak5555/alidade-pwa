// ---------------------------------------------------------------
// ROUTE PLANNER RUNTIME (Extracted from app.js)
// ---------------------------------------------------------------
// ---------------------------------------------------------------
// ROUTE PLANNER - TSP SOLVER WITH REAL-WORLD CONSTRAINTS
// ---------------------------------------------------------------
// Author: Senior Logistics Algorithmist & Geospatial Engineer
// Philosophy: "Greedy is Good, but 2-Opt is Better"
// ---------------------------------------------------------------

const routePlannerDebugLog = (...args) => {
    if (window.__ALIDADE_DEBUG_LOGS__ === true) {
        console.log(...args);
    }
};

/**
 * MARRAKECH DESTINATIONS DATABASE
 * 50+ pre-loaded destinations with opening hours, visit duration, and crowd data
 */
const MARRAKECH_DESTINATIONS = window.ALIDADE_ROUTE_PLANNER_DESTINATIONS || {
    landmarks: [],
    souks: [],
    restaurants: [],
    experiences: [],
    dayTrips: []
};
const ALL_DESTINATIONS = window.ALIDADE_ROUTE_PLANNER_ALL_DESTINATIONS || [];
routePlannerDebugLog(`[ROUTE-PLANNER] Loaded ${ALL_DESTINATIONS.length} destinations`);

/**
 * HAVERSINE DISTANCE CALCULATION
 * Calculate distance between two lat/lng points in kilometers
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
    const protocolsUtils = window.ALIDADE_PROTOCOLS_UTILS;
    if (protocolsUtils && typeof protocolsUtils.routePlannerHaversineDistanceKm === 'function') {
        return protocolsUtils.routePlannerHaversineDistanceKm(lat1, lng1, lat2, lng2);
    }
    return 0;
}

/**
 * WALKING TIME CALCULATION
 * Includes Medina tortuosity factor (1.3x for winding streets)
 */
function walkingTime(distanceKm, userPace = 4, inMedina = true) {
    const protocolsUtils = window.ALIDADE_PROTOCOLS_UTILS;
    if (protocolsUtils && typeof protocolsUtils.walkingTime === 'function') {
        return protocolsUtils.walkingTime(distanceKm, userPace, inMedina);
    }
    return 0;
}

/**
 * PRAYER TIMES (Marrakech approximations)
 */
const contextMapData = window.ALIDADE_CONTEXT_MAP_DATA || {};
const PRAYER_TIMES = contextMapData.PRAYER_TIMES || {};

function isPrayerTime(timeInMinutes) {
    const protocolsUtils = window.ALIDADE_PROTOCOLS_UTILS;
    if (protocolsUtils && typeof protocolsUtils.isPrayerTime === 'function') {
        return protocolsUtils.isPrayerTime(timeInMinutes);
    }
    return false;
}

/**
 * SUNSET TIMES BY MONTH
 */
function getSunsetTime(month = new Date().getMonth()) {
    const protocolsUtils = window.ALIDADE_PROTOCOLS_UTILS;
    if (protocolsUtils && typeof protocolsUtils.getSunsetTime === 'function') {
        return protocolsUtils.getSunsetTime(month);
    }
    return 0;
}

/**
 * CHECK IF DESTINATION IS OPEN
 */
function isDestinationOpen(destination, timeInMinutes) {
    const protocolsUtils = window.ALIDADE_PROTOCOLS_UTILS;
    if (protocolsUtils && typeof protocolsUtils.isDestinationOpen === 'function') {
        return protocolsUtils.isDestinationOpen(destination, timeInMinutes);
    }
    return true;
}

/**
 * GET CROWD SCORE (0=low, 1=medium, 2=high)
 */
function getCrowdScore(destination, timeInMinutes) {
    const protocolsUtils = window.ALIDADE_PROTOCOLS_UTILS;
    if (protocolsUtils && typeof protocolsUtils.getCrowdScore === 'function') {
        return protocolsUtils.getCrowdScore(destination, timeInMinutes);
    }
    return 0;
}

/**
 * -------------------------------------------------------------------------------
 * ALIDADE // INTELLIGENT ROUTE PLANNER
 * Deep Intelligence Module for Marrakech Itinerary Optimization
 * Version: 3.1 (Strict Morning-Lock)
 * -------------------------------------------------------------------------------
 */

class IntelligentRoutePlanner {
    static WEIGHTS = { DISTANCE: 1.0, TIME_PENALTY: 15.0 };
    static PENALTIES = { HARD_STOP: 2000000, MISMATCH: 50000, SUNSET_PRIORITY: -10000 };

    constructor(places, config = {}) {
        const protocolsUtils = window.ALIDADE_PROTOCOLS_UTILS;
        if (protocolsUtils && typeof protocolsUtils.routePlannerNormalizePlaces === 'function') {
            this.places = protocolsUtils.routePlannerNormalizePlaces(places);
        } else {
            this.places = places.map((p, idx) => ({
                ...p,
                _index: idx,
                id: p.id || `p${idx}`,
                openingHours: p.openingHours || { open: 8, close: 23 }
            }));
        }

        this.config = Object.assign({
            startTime: 9 * 60,       // 09:00
            walkingSpeed: 4.5,       // km/h
            taxiTime: 30,            // Fixed 30 min for remote legs
            maxWalkDistance: 2.0     // km before suggesting taxi
        }, config);

        this.distanceMatrix = this._buildDistanceMatrix();
    }

    _isTaxiZone(p) {
        const protocolsUtils = window.ALIDADE_PROTOCOLS_UTILS;
        if (protocolsUtils && typeof protocolsUtils.routePlannerIsTaxiZone === 'function') {
            return protocolsUtils.routePlannerIsTaxiZone(p);
        }

        if (!p) return false;
        const txt = ((p.id || '') + (p.name || '')).toLowerCase();
        return /quad|palmeraie|balloon|majorelle|menara|agafay/i.test(txt);
    }

    _haversineDistance(lat1, lng1, lat2, lng2) {
        const protocolsUtils = window.ALIDADE_PROTOCOLS_UTILS;
        if (protocolsUtils && typeof protocolsUtils.routePlannerHaversineDistanceKm === 'function') {
            return protocolsUtils.routePlannerHaversineDistanceKm(lat1, lng1, lat2, lng2);
        }

        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    _buildDistanceMatrix() {
        const protocolsUtils = window.ALIDADE_PROTOCOLS_UTILS;
        if (protocolsUtils && typeof protocolsUtils.routePlannerBuildDistanceMatrix === 'function') {
            return protocolsUtils.routePlannerBuildDistanceMatrix(
                this.places,
                this.config.maxWalkDistance,
                (place) => this._isTaxiZone(place),
                (lat1, lng1, lat2, lng2) => this._haversineDistance(lat1, lng1, lat2, lng2)
            );
        }
        return [];
    }

    _getPenalty(place, arrivalTimeMinutes) {
        const protocolsUtils = window.ALIDADE_PROTOCOLS_UTILS;
        if (protocolsUtils && typeof protocolsUtils.routePlannerGetPenalty === 'function') {
            return protocolsUtils.routePlannerGetPenalty(place, arrivalTimeMinutes, IntelligentRoutePlanner.PENALTIES);
        }
        return 0;
    }

    optimize() {
        const protocolsUtils = window.ALIDADE_PROTOCOLS_UTILS;
        if (
            protocolsUtils &&
            typeof protocolsUtils.routePlannerAnchorReorder === 'function' &&
            typeof protocolsUtils.routePlannerRunTwoOpt === 'function'
        ) {
            const reordered = protocolsUtils.routePlannerAnchorReorder(this.places);
            this.places = reordered.orderedPlaces;
            this.distanceMatrix = this._buildDistanceMatrix();

            let route = Array.from({ length: this.places.length }, (_, i) => i);
            route = protocolsUtils.routePlannerRunTwoOpt(
                route,
                reordered.optStartIndex,
                (routeIndices) => this._calculateTotalCost(routeIndices)
            );
            return this._generateDetailedOutput(route);
        }
        const route = Array.from({ length: this.places.length }, (_, i) => i);
        return this._generateDetailedOutput(route);
    }

    _calculateTotalCost(routeIndices) {
        const protocolsUtils = window.ALIDADE_PROTOCOLS_UTILS;
        if (protocolsUtils && typeof protocolsUtils.routePlannerCalculateTotalCost === 'function') {
            return protocolsUtils.routePlannerCalculateTotalCost(
                routeIndices,
                this.config,
                this.places,
                this.distanceMatrix,
                (place, arrivalTimeMinutes) => this._getPenalty(place, arrivalTimeMinutes),
                IntelligentRoutePlanner.WEIGHTS.TIME_PENALTY
            );
        }
        return Number.POSITIVE_INFINITY;
    }

    _generateDetailedOutput(route) {
        const protocolsUtils = window.ALIDADE_PROTOCOLS_UTILS;
        if (protocolsUtils && typeof protocolsUtils.routePlannerGenerateDetailedOutputFlow === 'function') {
            return protocolsUtils.routePlannerGenerateDetailedOutputFlow({
                route,
                places: this.places,
                config: this.config,
                distanceMatrix: this.distanceMatrix,
                isTaxiZoneFn: (place) => this._isTaxiZone(place),
                computeTravelLegFn: protocolsUtils.routePlannerComputeTravelLeg,
                resolveStopContextFn: protocolsUtils.routePlannerResolveStopContext,
                finalizeDetailedOutputFn: protocolsUtils.routePlannerFinalizeDetailedOutput
            });
        }
        return false;
    }
}

const RoutePlanner = IntelligentRoutePlanner;

window.IntelligentRoutePlanner = IntelligentRoutePlanner;
window.RoutePlanner = RoutePlanner;
window.MARRAKECH_DESTINATIONS = MARRAKECH_DESTINATIONS;
window.ALL_DESTINATIONS = ALL_DESTINATIONS;
window.haversineDistance = haversineDistance;
window.walkingTime = walkingTime;

/**
 * ---------------------------------------------------------------
 * ROUTE PLANNER UI
 * ---------------------------------------------------------------
 */

function renderRoutePlanner(containerId = 'app') {
    const protocolsUtils = window.ALIDADE_PROTOCOLS_UTILS;
    if (protocolsUtils && typeof protocolsUtils.routePlannerRenderShell === 'function') {
        return protocolsUtils.routePlannerRenderShell({
            containerId,
            documentObj: document,
            localStorageObj: localStorage,
            getProtocolsLogisticsGateStatusFn: getProtocolsLogisticsGateStatus,
            isProtocolsLogisticsAuthRequiredFn: isProtocolsLogisticsAuthRequired,
            isLicenseUserAuthenticatedFn: isLicenseUserAuthenticated,
            getProtocolsLogisticsUsageTextFn: getProtocolsLogisticsUsageText,
            getProtocolsLogisticsUsageMetaFn: getProtocolsLogisticsUsageMeta,
            renderProtocolsLogisticsGlassOverlayFn: renderProtocolsLogisticsGlassOverlay,
            trackLockImpressionFn: trackLockImpression,
            iconsObj: ICONS,
            renderDestinationListFn: renderDestinationList,
            setupRoutePlannerListenersFn: setupRoutePlannerListeners,
            syncProtocolsLogisticsLockUiFn: syncProtocolsLogisticsLockUi,
            licenseManagerObj: window.licenseManager,
            consoleObj: console
        });
    }
    return false;
}

function renderDestinationList(category, selectedIds = []) {
    const protocolsUtils = window.ALIDADE_PROTOCOLS_UTILS;
    if (protocolsUtils && typeof protocolsUtils.routePlannerRenderDestinationListFlow === 'function') {
        return protocolsUtils.routePlannerRenderDestinationListFlow(
            document,
            localStorage,
            MARRAKECH_DESTINATIONS,
            category
        );
    }
    return false;
}

// ---------------------------------------------------------------
// SELECTION STATE MANAGEMENT (Global Fix)
// ---------------------------------------------------------------

// ---------------------------------------------------------------
// SMART SELECTION HANDLER (PREVENTS LOGICAL CONFLICTS)
// ---------------------------------------------------------------

window.toggleDestinationSelection = function (id, isChecked) {
    const protocolsUtils = window.ALIDADE_PROTOCOLS_UTILS;
    if (protocolsUtils && typeof protocolsUtils.routePlannerToggleSelectionFlow === 'function') {
        return protocolsUtils.routePlannerToggleSelectionFlow({
            id,
            isChecked,
            localStorageObj: localStorage,
            allDestinations: window.ALL_DESTINATIONS,
            isLunchPlaceFn: (place) => isLunchPlace(place),
            documentObj: document,
            updateDestinationCountFn: updateDestinationCount
        });
    }

    return false;
};

// Helper function for Lunch/Dinner Logic
function isLunchPlace(place) {
    const protocolsUtils = window.ALIDADE_PROTOCOLS_UTILS;
    if (protocolsUtils && typeof protocolsUtils.routePlannerIsLunchPlace === 'function') {
        return protocolsUtils.routePlannerIsLunchPlace(place);
    }

    if (!place) return false;
    const text = (place.intel || '') + (place.tips || '') + (place.name || '') + (place.category || '');
    return text.toLowerCase().includes('lunch only') ||
        /restaurant|cafe|dining|food|dinner|bistro|terrace|rooftop|nomad|clock|fassia|lamine|amal/i.test(text);
}

window.clearSelections = function () {
    const protocolsUtils = window.ALIDADE_PROTOCOLS_UTILS;
    if (protocolsUtils && typeof protocolsUtils.routePlannerClearSelectionsFlow === 'function') {
        return protocolsUtils.routePlannerClearSelectionsFlow(
            localStorage,
            document,
            renderRoutePlanner,
            updateDestinationCount,
            window.toggleDestinationSelection
        );
    }
    return false;
}

function setupRoutePlannerListeners(savedSelections) {
    const protocolsUtils = window.ALIDADE_PROTOCOLS_UTILS;
    if (protocolsUtils && typeof protocolsUtils.routePlannerSetupListenersFlow === 'function') {
        return protocolsUtils.routePlannerSetupListenersFlow(
            document,
            renderDestinationList,
            updateDestinationCount
        );
    }
    return false;
}

function getSelectedDestinationIds() {
    return JSON.parse(localStorage.getItem('routePlannerSelections') || '[]');
}

function updateDestinationCount() {
    const protocolsUtils = window.ALIDADE_PROTOCOLS_UTILS;
    if (protocolsUtils && typeof protocolsUtils.routePlannerUpdateDestinationCountFlow === 'function') {
        return protocolsUtils.routePlannerUpdateDestinationCountFlow({
            localStorageObj: localStorage,
            documentObj: document,
            getProtocolsLogisticsGateStatusFn: getProtocolsLogisticsGateStatus,
            isProtocolsLogisticsAuthRequiredFn: isProtocolsLogisticsAuthRequired,
            isLicenseUserAuthenticatedFn: isLicenseUserAuthenticated,
            syncProtocolsLogisticsLockUiFn: syncProtocolsLogisticsLockUi
        });
    }
    return 0;
}

// ---------------------------------------------------------------
// UI HANDLER & DISPLAY ENGINE (FINAL INTEGRATION FIX)
// ---------------------------------------------------------------

// 1. The Optimization Handler
window.runRouteOptimization = function () {
    const protocolsUtils = window.ALIDADE_PROTOCOLS_UTILS;
    if (protocolsUtils && typeof protocolsUtils.routePlannerRunOptimizationFlow === 'function') {
        return protocolsUtils.routePlannerRunOptimizationFlow({
            windowObjParam: window,
            documentObj: document,
            localStorageObj: localStorage,
            setTimeoutFn: setTimeout,
            getProtocolsLogisticsGateStatusFn: getProtocolsLogisticsGateStatus,
            isProtocolsLogisticsAuthRequiredFn: isProtocolsLogisticsAuthRequired,
            openProtocolsAuthModalFn: openProtocolsAuthModal,
            promptProtocolsLogisticsUpgradeFn: promptProtocolsLogisticsUpgrade,
            getSelectedDestinationIdsFn: window.getSelectedDestinationIds,
            allDestinations: window.ALL_DESTINATIONS,
            IntelligentRoutePlannerCtor: IntelligentRoutePlanner,
            displayRouteResultsFn: window.displayRouteResults,
            normalizeTierTagFn: normalizeTierTag,
            userTier: USER_TIER,
            consumeFeatureUsageFn: consumeFeatureUsage,
            optimizeFeatureKey: PROTOCOLS_LOGISTICS_OPTIMIZE_FEATURE,
            syncProtocolsLogisticsLockUiFn: syncProtocolsLogisticsLockUi,
            isLicenseUserAuthenticatedFn: isLicenseUserAuthenticated,
            consoleObj: console
        });
    }
    return false;
};

// 2. The Display Engine (Encoding Fix)
window.displayRouteResults = function (res) {
    const protocolsUtils = window.ALIDADE_PROTOCOLS_UTILS;
    if (protocolsUtils && typeof protocolsUtils.routePlannerRenderResultsFlow === 'function') {
        return protocolsUtils.routePlannerRenderResultsFlow(window, document, res);
    }
    window.lastRouteResult = res;
    return false;
}

window.exportToGoogleMaps = function () {
    const result = window.lastRouteResult;
    const protocolsUtils = window.ALIDADE_PROTOCOLS_UTILS;
    if (protocolsUtils && typeof protocolsUtils.routePlannerExportToGoogleMapsFlow === 'function') {
        return protocolsUtils.routePlannerExportToGoogleMapsFlow(window, result);
    }
    return false;
};

window.shareRoute = function () {
    const result = window.lastRouteResult;
    const protocolsUtils = window.ALIDADE_PROTOCOLS_UTILS;
    if (protocolsUtils && typeof protocolsUtils.routePlannerShareRouteFlow === 'function') {
        return protocolsUtils.routePlannerShareRouteFlow(result, navigator, showToast, alert);
    }
    return false;
};
window.shareRoute = window.shareRoute;

// Register route planner in navigation
window.renderRoutePlanner = renderRoutePlanner;


routePlannerDebugLog('[ALIDADE] Route Planner Initialized');

// -------------------------------------------------------------------------------
// ¦¦¦¦¦¦¦+ ¦¦¦¦¦¦+  ¦¦¦¦¦+ ¦¦¦+   ¦¦¦+    ¦¦¦¦¦¦+ ¦¦¦¦¦¦¦+¦¦¦¦¦¦¦+ ¦¦¦¦¦¦+¦¦¦¦¦¦¦¦+
// ¦¦+----+¦¦+----+¦¦+--¦¦+¦¦¦¦+ ¦¦¦¦¦    ¦¦+--¦¦+¦¦+----++--¦¦+--+¦¦+----+¦¦+----++--¦¦+--+
// ¦¦¦¦¦¦¦+¦¦¦     ¦¦¦¦¦¦¦¦¦¦+¦¦¦¦+¦¦¦    ¦¦¦  ¦¦¦¦¦¦¦¦+     ¦¦¦   ¦¦¦¦¦+  ¦¦¦        ¦¦¦   
// +----¦¦¦¦¦¦     ¦¦+--¦¦¦¦¦¦+¦¦++¦¦¦    ¦¦¦  ¦¦¦¦¦+--+     ¦¦¦   ¦¦+--+  ¦¦¦        ¦¦¦   
// ¦¦¦¦¦¦¦¦+¦¦¦¦¦¦+¦¦¦  ¦¦¦¦¦¦ +-+ ¦¦¦    ¦¦¦¦¦¦++¦¦¦¦¦¦¦+   ¦¦¦   ¦¦¦¦¦¦¦++¦¦¦¦¦¦+   ¦¦¦   
// +------+ +-----++-+  +-++-+     +-+    +-----+ +------+   +-+   +------+ +-----+   +-+   
// AI-POWERED PRICE VERIFICATION SYSTEM v1.0
// Edge AI | TensorFlow.js | Scam Detection
// -------------------------------------------------------------------------------
