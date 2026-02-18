/**
 * ALIDADE Map Souk Location Utilities
 * Extracted from legacy app.js with adapter hooks.
 */
(function bootstrapMapSoukLocationUtils(windowObj) {
    if (!windowObj) return;

    const mapUtils = windowObj.ALIDADE_MAP_UTILS || (windowObj.ALIDADE_MAP_UTILS = {});
    const soukLocationUtilsDebugLog = (...args) => {
        if (windowObj.__ALIDADE_DEBUG_LOGS__ === true) {
            console.log(...args);
        }
    };

    if (typeof mapUtils.haversineDistanceMeters !== 'function') {
        mapUtils.haversineDistanceMeters = function haversineDistanceMeters(lat1, lng1, lat2, lng2) {
            const R = 6371000; // Earth radius in meters
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLng = (lng2 - lng1) * Math.PI / 180;
            const a = Math.sin(dLat / 2) ** 2 +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng / 2) ** 2;
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };
    }

    if (typeof mapUtils.detectSoukArea !== 'function') {
        mapUtils.detectSoukArea = function detectSoukArea(lat, lng, adapter = {}) {
            if (!lat || !lng) return 'unknown';

            const landmarks = adapter.landmarks || {};
            const haversineDistance = typeof adapter.haversineDistance === 'function'
                ? adapter.haversineDistance
                : mapUtils.haversineDistanceMeters;
            const log = typeof adapter.log === 'function'
                ? adapter.log
                : (...args) => soukLocationUtilsDebugLog(...args);

            let closestArea = 'unknown';
            let minDistance = Infinity;

            for (const [key, landmark] of Object.entries(landmarks)) {
                const distance = haversineDistance(lat, lng, landmark.lat, landmark.lng);
                if (distance < landmark.radius && distance < minDistance) {
                    minDistance = distance;
                    closestArea = key;
                }
            }

            log(`[LOCATION] Detected area: ${closestArea} (closest: ${Math.round(minDistance)}m)`);
            return closestArea;
        };
    }

    if (typeof mapUtils.getCurrentPosition !== 'function') {
        mapUtils.getCurrentPosition = async function getCurrentPosition(adapter = {}) {
            const geolocation = adapter.geolocation || windowObj.navigator?.geolocation;
            const warn = typeof adapter.warn === 'function'
                ? adapter.warn
                : (...args) => console.warn(...args);
            const updateContextLocation = typeof adapter.updateContextLocation === 'function'
                ? adapter.updateContextLocation
                : null;

            return new Promise((resolve) => {
                if (!geolocation) {
                    warn('[LOCATION] Geolocation not available');
                    resolve(null);
                    return;
                }

                geolocation.getCurrentPosition(
                    (pos) => {
                        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                        if (updateContextLocation) {
                            updateContextLocation(coords.lat, coords.lng, {
                                source: 'gps_lookup',
                                accuracy: pos.coords.accuracy
                            }).catch((e) => warn('[CONTEXT] Location sync failed:', e.message));
                        }
                        resolve(coords);
                    },
                    (err) => {
                        warn('[LOCATION] GPS error:', err.message);
                        resolve(null);
                    },
                    { timeout: 5000, maximumAge: 60000 }
                );
            });
        };
    }
})(typeof window !== 'undefined' ? window : null);
