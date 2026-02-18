// ---------------------------------------------------------------
// SOUK LOCATION RUNTIME (Extracted from app.js)
// ---------------------------------------------------------------
/**
 * Souk landmark reference points (Marrakech Medina)
 * Each has a radius within which transactions are tagged
 */
const soukLocationDebugLog = (...args) => {
    if (window.__ALIDADE_DEBUG_LOGS__ === true) {
        console.log(...args);
    }
};

const SOUK_LANDMARKS = contextMapData.SOUK_LANDMARKS || {};

/**
 * Haversine distance in meters between two GPS coordinates
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
    const extracted = window.ALIDADE_MAP_UTILS?.haversineDistanceMeters;
    if (typeof extracted === 'function') {
        return extracted(lat1, lng1, lat2, lng2);
    }

    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Detect which souk area the user is in based on GPS coordinates
 * Returns area key ('jemaa', 'souks_main', etc.) or 'unknown'
 */
function detectSoukArea(lat, lng) {
    const extracted = window.ALIDADE_MAP_UTILS?.detectSoukArea;
    if (typeof extracted === 'function') {
        return extracted(lat, lng, {
            landmarks: SOUK_LANDMARKS,
            haversineDistance: (a, b, c, d) => haversineDistance(a, b, c, d),
            log: (...args) => soukLocationDebugLog(...args)
        });
    }

    if (!lat || !lng) return 'unknown';

    let closestArea = 'unknown';
    let minDistance = Infinity;

    for (const [key, landmark] of Object.entries(SOUK_LANDMARKS)) {
        const distance = haversineDistance(lat, lng, landmark.lat, landmark.lng);
        if (distance < landmark.radius && distance < minDistance) {
            minDistance = distance;
            closestArea = key;
        }
    }

    soukLocationDebugLog(`[LOCATION] Detected area: ${closestArea} (closest: ${Math.round(minDistance)}m)`);
    return closestArea;
}

/**
 * Get current GPS position (returns {lat, lng} or null)
 */
async function getCurrentPosition() {
    const extracted = window.ALIDADE_MAP_UTILS?.getCurrentPosition;
    if (typeof extracted === 'function') {
        return extracted({
            geolocation: navigator.geolocation,
            updateContextLocation: window.contextEngine?.updateLocation
                ? (lat, lng, meta) => window.contextEngine.updateLocation(lat, lng, meta)
                : null,
            warn: (...args) => console.warn(...args)
        });
    }

    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            console.warn('[LOCATION] Geolocation not available');
            resolve(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                if (window.contextEngine?.updateLocation) {
                    window.contextEngine.updateLocation(coords.lat, coords.lng, {
                        source: 'gps_lookup',
                        accuracy: pos.coords.accuracy
                    }).catch((e) => console.warn('[CONTEXT] Location sync failed:', e.message));
                }
                resolve(coords);
            },
            (err) => {
                console.warn('[LOCATION] GPS error:', err.message);
                resolve(null);
            },
            { timeout: 5000, maximumAge: 60000 }
        );
    });
}

