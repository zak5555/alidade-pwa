/**
 * ALIDADE Route Planner Core Utilities
 * Extracted from IntelligentRoutePlanner with compatibility hooks.
 */
(function bootstrapRoutePlannerCoreUtils(windowObj) {
    if (!windowObj) return;

    const protocolsUtils = windowObj.ALIDADE_PROTOCOLS_UTILS || (windowObj.ALIDADE_PROTOCOLS_UTILS = {});

    if (typeof protocolsUtils.routePlannerIsTaxiZone !== 'function') {
        protocolsUtils.routePlannerIsTaxiZone = function routePlannerIsTaxiZone(place) {
            if (!place) return false;
            const txt = ((place.id || '') + (place.name || '')).toLowerCase();
            return /quad|palmeraie|balloon|majorelle|menara|agafay/i.test(txt);
        };
    }

    if (typeof protocolsUtils.routePlannerHaversineDistanceKm !== 'function') {
        protocolsUtils.routePlannerHaversineDistanceKm = function routePlannerHaversineDistanceKm(lat1, lng1, lat2, lng2) {
            const R = 6371;
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLng = (lng2 - lng1) * Math.PI / 180;
            const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };
    }

    if (typeof protocolsUtils.routePlannerNormalizePlaces !== 'function') {
        protocolsUtils.routePlannerNormalizePlaces = function routePlannerNormalizePlaces(places) {
            return places.map((place, idx) => {
                const name = (place.name || '').toLowerCase();
                let openingHours = place.openingHours || { open: 8, close: 23 };

                // 1. HARD-CODE DATA FIXES (V6.0 Control)
                if (name.includes('cooking')) {
                    openingHours = { open: 10, close: 14 };
                } else if (name.includes('mouassine')) {
                    openingHours = { open: 9, close: 21 };
                } else if (name.includes('fassia')) {
                    openingHours = { open: 12, close: 22 };
                }

                return {
                    ...place,
                    _index: idx,
                    id: place.id || `p${idx}`,
                    openingHours
                };
            });
        };
    }
})(typeof window !== 'undefined' ? window : null);
