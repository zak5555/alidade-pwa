/**
 * ALIDADE Route Planner Helper Utilities
 * Extracted from legacy app.js with adapter hooks.
 */
(function bootstrapRoutePlannerHelperUtils(windowObj) {
    if (!windowObj) return;

    const protocolsUtils = windowObj.ALIDADE_PROTOCOLS_UTILS || (windowObj.ALIDADE_PROTOCOLS_UTILS = {});

    if (typeof protocolsUtils.walkingTime !== 'function') {
        protocolsUtils.walkingTime = function walkingTime(distanceKm, userPace = 4, inMedina = true) {
            const TORTUOSITY_FACTOR = inMedina ? 1.3 : 1.0;
            const adjustedDistance = distanceKm * TORTUOSITY_FACTOR;
            return (adjustedDistance / userPace) * 60; // minutes
        };
    }

    if (typeof protocolsUtils.isPrayerTime !== 'function') {
        protocolsUtils.isPrayerTime = function isPrayerTime(timeInMinutes) {
            const hour = timeInMinutes / 60;
            return hour >= 13 && hour < 14; // Dhuhr is main concern
        };
    }

    if (typeof protocolsUtils.getSunsetTime !== 'function') {
        protocolsUtils.getSunsetTime = function getSunsetTime(month = new Date().getMonth()) {
            const sunsets = {
                0: 17.5, 1: 18.0, 2: 18.5, 3: 19.0, 4: 19.5, 5: 20.0,
                6: 20.0, 7: 19.5, 8: 19.0, 9: 18.5, 10: 17.5, 11: 17.0
            };
            return (sunsets[month] || 18) * 60;
        };
    }

    if (typeof protocolsUtils.isDestinationOpen !== 'function') {
        protocolsUtils.isDestinationOpen = function isDestinationOpen(destination, timeInMinutes) {
            const hour = timeInMinutes / 60;
            if (!destination.openingHours) return true;

            // Handle split hours (e.g., lunch closed)
            if (destination.openingHours.dinnerOpen) {
                return (hour >= destination.openingHours.open && hour < destination.openingHours.close) ||
                    (hour >= destination.openingHours.dinnerOpen && hour < destination.openingHours.dinnerClose);
            }

            return hour >= destination.openingHours.open && hour < destination.openingHours.close;
        };
    }

    if (typeof protocolsUtils.getCrowdScore !== 'function') {
        protocolsUtils.getCrowdScore = function getCrowdScore(destination, timeInMinutes) {
            const hour = Math.floor(timeInMinutes / 60);
            if (!destination.crowd) return 0;

            if (destination.crowd.high) {
                for (const [start, end] of destination.crowd.high) {
                    if (hour >= start && hour < end) return 2;
                }
            }
            if (destination.crowd.medium) {
                for (const [start, end] of destination.crowd.medium) {
                    if (hour >= start && hour < end) return 1;
                }
            }
            return 0;
        };
    }
})(typeof window !== 'undefined' ? window : null);
