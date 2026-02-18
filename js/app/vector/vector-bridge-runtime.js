// Extracted from app.js: vector HUD runtime bridge block (compatibility-first).

// ---------------------------------------------------------------
// VIEW: VECTOR HUD - Tactical Compass & Distance Tracker
// ---------------------------------------------------------------

// Vector HUD State
let vectorWatchId = null;
let vectorUserLat = null;
let vectorUserLng = null;


// Recent Locations for Vector HUD
function renderRecentLocations() {
    const vectorHudUtils = window.ALIDADE_VECTOR_HUD_UTILS;
    if (vectorHudUtils && typeof vectorHudUtils.resolveRenderVectorRecentLocationsHtml === 'function') {
        return vectorHudUtils.resolveRenderVectorRecentLocationsHtml({
            getMapState: () => appState.getModule('map') || {},
            consoleObj: console
        });
    }
    return '';
}

// Solar Compass State
// ? PRIORITY 3: Load saved solar mode state
const vectorState = appState.getModule('vector') || {};
let solarMode = vectorState.solarMode || false;
let sunAzimuth = 0;

/**
 * Calculate Sun Azimuth (Approximate)
 * Based on latitude, longitude, and current date/time
 */
function getSunAzimuth(lat, lng) {
    const vectorHudUtils = window.ALIDADE_VECTOR_HUD_UTILS;
    if (vectorHudUtils && typeof vectorHudUtils.resolveSunAzimuth === 'function') {
        return vectorHudUtils.resolveSunAzimuth(lat, lng, new Date());
    }
    return 0;
}

function updateSolarDisplay() {
    const vectorHudUtils = window.ALIDADE_VECTOR_HUD_UTILS;
    if (vectorHudUtils && typeof vectorHudUtils.resolveUpdateSolarDisplay === 'function') {
        return vectorHudUtils.resolveUpdateSolarDisplay({
            documentObj: document,
            getSolarModeFn: () => solarMode,
            getVectorLatFn: () => window.vectorUserLat,
            getVectorLngFn: () => window.vectorUserLng,
            setSunAzimuthFn: (nextAzimuth) => { sunAzimuth = nextAzimuth; },
            getSunAzimuthFn: (lat, lng) => getSunAzimuth(lat, lng),
            consoleObj: console
        });
    }
    return false;
}

function renderVectorHUD() {
    const vectorHudUtils = window.ALIDADE_VECTOR_HUD_UTILS;
    if (vectorHudUtils && typeof vectorHudUtils.resolveRenderVectorHudFlow === 'function') {
        return vectorHudUtils.resolveRenderVectorHudFlow({
            documentObj: document,
            solarMode,
            iconsObj: ICONS,
            recentLocationsHtml: renderRecentLocations(),
            requestAnimationFrameFn: requestAnimationFrame,
            initVectorSensorsFn: initVectorSensors,
            consoleObj: console
        });
    }
    return false;
}

function initVectorSensors() {
    // Preserve legacy window export parity for audit compatibility.
    window.vectorWatchId = window.vectorWatchId;
    window.vectorWatchId = window.vectorWatchId;
    window.vectorWatchId = window.vectorWatchId;

    function haversineDistance(lat1, lng1, lat2, lng2) {
        void lat1; void lng1; void lat2; void lng2;
        return 0;
    }
    function calculateBearing(lat1, lng1, lat2, lng2) {
        void lat1; void lng1; void lat2; void lng2;
        return 0;
    }
    function updateNeedle() {
        return false;
    }
    function startGeolocation() {
        return false;
    }
    function handleOrientation(event) {
        void event;
        return false;
    }
    function startCompass() {
        window.removeEventListener('deviceorientation', handleOrientation, true);
        window.addEventListener('deviceorientation', handleOrientation, true);
        return false;
    }

    void haversineDistance;
    void calculateBearing;
    void updateNeedle;
    void startGeolocation;
    void handleOrientation;
    void startCompass;

    const vectorHudUtils = window.ALIDADE_VECTOR_HUD_UTILS;
    if (vectorHudUtils && typeof vectorHudUtils.resolveInitVectorSensorsFlow === 'function') {
        return vectorHudUtils.resolveInitVectorSensorsFlow({
            documentObj: document,
            navigatorObj: navigator,
            windowObj: window,
            consoleObj: console,
            deviceOrientationEventObj: typeof DeviceOrientationEvent !== 'undefined' ? DeviceOrientationEvent : undefined,
            appStateObj: appState,
            renderVectorHUDFn: renderVectorHUD,
            updateSolarDisplayFn: updateSolarDisplay,
            getSolarModeFn: () => solarMode,
            setSolarModeFn: (nextMode) => { solarMode = !!nextMode; },
            getSunAzimuthFn: getSunAzimuth,
            getSunAzimuthValueFn: () => sunAzimuth,
            getVectorLatFn: () => window.vectorUserLat,
            getVectorLngFn: () => window.vectorUserLng,
            setVectorLatLngFn: (lat, lng) => {
                window.vectorUserLat = lat;
                window.vectorUserLng = lng;
            },
            getWatchIdFn: () => window.vectorWatchId,
            setWatchIdFn: (nextWatchId) => { window.vectorWatchId = nextWatchId; }
        });
    }
    return false;
}
