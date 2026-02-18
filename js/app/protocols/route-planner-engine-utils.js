/**
 * ALIDADE Route Planner Engine Utilities
 * Extracted from IntelligentRoutePlanner with compatibility hooks.
 */
(function bootstrapRoutePlannerEngineUtils(windowObj) {
    if (!windowObj) return;

    const protocolsUtils = windowObj.ALIDADE_PROTOCOLS_UTILS || (windowObj.ALIDADE_PROTOCOLS_UTILS = {});

    if (typeof protocolsUtils.routePlannerBuildDistanceMatrix !== 'function') {
        protocolsUtils.routePlannerBuildDistanceMatrix = function routePlannerBuildDistanceMatrix(
            places,
            maxWalkDistance,
            isTaxiZone,
            haversineDistanceKm
        ) {
            const n = places.length;
            const matrix = Array(n).fill(null).map(() => Array(n).fill(0));

            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    if (i === j) continue;
                    const from = places[i];
                    const to = places[j];
                    const d = haversineDistanceKm(from.lat, from.lng, to.lat, to.lng);

                    // Bidirectional Taxi Logic
                    if (isTaxiZone(from) || isTaxiZone(to) || d > maxWalkDistance) {
                        matrix[i][j] = 5.0; // Virtual distance
                    } else {
                        matrix[i][j] = d;
                    }
                }
            }

            return matrix;
        };
    }

    if (typeof protocolsUtils.routePlannerGetPenalty !== 'function') {
        protocolsUtils.routePlannerGetPenalty = function routePlannerGetPenalty(place, arrivalTimeMinutes, penalties) {
            const hour = arrivalTimeMinutes / 60;
            const name = (place.name || '').toLowerCase();
            const closeTime = place.openingHours ? place.openingHours.close : 23;

            // 1. GLOBAL EXECUTIONER: If arriving after close -> INSTANT DEATH
            if (hour >= closeTime) return penalties.HARD_STOP;

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
                    return penalties.HARD_STOP;
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
        };
    }
})(typeof window !== 'undefined' ? window : null);
