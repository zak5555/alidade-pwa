/**
 * ALIDADE Route Planner Optimizer Utilities
 * Extracted from IntelligentRoutePlanner with compatibility hooks.
 */
(function bootstrapRoutePlannerOptimizerUtils(windowObj) {
    if (!windowObj) return;

    const protocolsUtils = windowObj.ALIDADE_PROTOCOLS_UTILS || (windowObj.ALIDADE_PROTOCOLS_UTILS = {});

    if (typeof protocolsUtils.routePlannerAnchorReorder !== 'function') {
        protocolsUtils.routePlannerAnchorReorder = function routePlannerAnchorReorder(places) {
            const startNode = places[0];
            const others = places.slice(1);
            // V6.0: Added 'cooking' to morning anchor filter
            const anchors = others.filter(place => /quad|palmeraie|balloon|cooking/i.test((place.id || '') + (place.name || '')));
            const rest = others.filter(place => !anchors.includes(place));
            return {
                orderedPlaces: [startNode, ...anchors, ...rest],
                optStartIndex: 1 + anchors.length // LOCK MORNING
            };
        };
    }

    if (typeof protocolsUtils.routePlannerRunTwoOpt !== 'function') {
        protocolsUtils.routePlannerRunTwoOpt = function routePlannerRunTwoOpt(route, optStartIndex, calculateTotalCost) {
            let improved = true;
            let optimizedRoute = route;

            if (optStartIndex < optimizedRoute.length - 1) {
                while (improved) {
                    improved = false;
                    for (let i = optStartIndex; i < optimizedRoute.length - 2; i++) { // Precise Loop
                        for (let j = i + 1; j < optimizedRoute.length; j++) {
                            const newRoute = [...optimizedRoute];
                            let l = i, r = j;
                            while (l < r) {
                                [newRoute[l], newRoute[r]] = [newRoute[r], newRoute[l]];
                                l++;
                                r--;
                            }
                            if (calculateTotalCost(newRoute) < calculateTotalCost(optimizedRoute)) {
                                optimizedRoute = newRoute;
                                improved = true;
                            }
                        }
                    }
                }
            }

            return optimizedRoute;
        };
    }

    if (typeof protocolsUtils.routePlannerCalculateTotalCost !== 'function') {
        protocolsUtils.routePlannerCalculateTotalCost = function routePlannerCalculateTotalCost(
            routeIndices,
            config,
            places,
            distanceMatrix,
            getPenalty,
            timePenaltyWeight
        ) {
            let time = config.startTime;
            let cost = 0;
            for (let i = 0; i < routeIndices.length; i++) {
                const idx = routeIndices[i];
                const place = places[idx];
                if (i > 0) {
                    const d = distanceMatrix[routeIndices[i - 1]][idx];
                    time += (d === 5.0) ? config.taxiTime : (d / config.walkingSpeed) * 60;
                }
                cost += (getPenalty(place, time) * timePenaltyWeight);
                time += (place.visitDuration || 60);
            }
            return cost;
        };
    }
})(typeof window !== 'undefined' ? window : null);
