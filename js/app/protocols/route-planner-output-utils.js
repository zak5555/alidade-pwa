/**
 * ALIDADE Route Planner Output Utilities
 * Extracted from IntelligentRoutePlanner with compatibility hooks.
 */
(function bootstrapRoutePlannerOutputUtils(windowObj) {
    if (!windowObj) return;

    const protocolsUtils = windowObj.ALIDADE_PROTOCOLS_UTILS || (windowObj.ALIDADE_PROTOCOLS_UTILS = {});

    if (typeof protocolsUtils.routePlannerComputeTravelLeg !== 'function') {
        protocolsUtils.routePlannerComputeTravelLeg = function routePlannerComputeTravelLeg(
            route,
            index,
            places,
            distanceMatrix,
            walkingSpeed,
            isTaxiZone
        ) {
            let distance = 0;
            let travelTime = 0;
            let mode = 'Walk';

            if (index > 0) {
                const prevIdx = route[index - 1];
                const prevPlace = places[prevIdx];
                const place = places[route[index]];
                // TAXI ENFORCEMENT
                const isRemote = isTaxiZone(place) || isTaxiZone(prevPlace);
                if (isRemote) {
                    mode = 'Taxi';
                    distance = 5.0;
                    travelTime = 30;
                } else {
                    const matrixDistance = distanceMatrix[prevIdx][route[index]];
                    if (matrixDistance === 5.0) {
                        mode = 'Taxi';
                        distance = 5.0;
                        travelTime = 30;
                    } else {
                        distance = matrixDistance;
                        travelTime = (distance / walkingSpeed) * 60;
                    }
                }
            }

            return { distance, travelTime, mode };
        };
    }

    if (typeof protocolsUtils.routePlannerResolveStopContext !== 'function') {
        protocolsUtils.routePlannerResolveStopContext = function routePlannerResolveStopContext(place, index, arrivalTimeMinutes) {
            let context = 'destination';
            const hour = arrivalTimeMinutes / 60;

            if (/amal|lamine|fassia/i.test(place.name)) {
                if (hour >= 12 && hour < 16) {
                    context = 'lunch';
                } else if (hour >= 19) {
                    context = 'dinner';
                }
            } else if (index === 0) {
                context = 'start';
            }

            return context;
        };
    }

    if (typeof protocolsUtils.routePlannerFinalizeDetailedOutput !== 'function') {
        protocolsUtils.routePlannerFinalizeDetailedOutput = function routePlannerFinalizeDetailedOutput(
            rawStops,
            startTimeMinutes,
            dropped,
            hazards
        ) {
            // RECALCULATE STATS
            const finalStops = rawStops;
            const totalDist = finalStops.reduce((acc, stop) => acc + stop.travelDistance, 0);

            let totalDuration = 0;
            let lastEndTimeHours = 0;

            if (finalStops.length > 0) {
                const lastStop = finalStops[finalStops.length - 1];
                const endTime = lastStop.arrivalTime + lastStop.visitDuration;
                totalDuration = endTime - startTimeMinutes;
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
        };
    }

    if (typeof protocolsUtils.routePlannerGenerateDetailedOutputFlow !== 'function') {
        protocolsUtils.routePlannerGenerateDetailedOutputFlow = function routePlannerGenerateDetailedOutputFlow(options = {}) {
            const route = Array.isArray(options.route) ? options.route : [];
            const places = Array.isArray(options.places) ? options.places : [];
            const config = options.config || {};
            const distanceMatrix = options.distanceMatrix || [];

            const isTaxiZoneFn = typeof options.isTaxiZoneFn === 'function'
                ? options.isTaxiZoneFn
                : () => false;
            const computeTravelLegFn = typeof options.computeTravelLegFn === 'function'
                ? options.computeTravelLegFn
                : protocolsUtils.routePlannerComputeTravelLeg;
            const resolveStopContextFn = typeof options.resolveStopContextFn === 'function'
                ? options.resolveStopContextFn
                : protocolsUtils.routePlannerResolveStopContext;
            const finalizeDetailedOutputFn = typeof options.finalizeDetailedOutputFn === 'function'
                ? options.finalizeDetailedOutputFn
                : protocolsUtils.routePlannerFinalizeDetailedOutput;

            const dropped = [];
            const hazards = [];
            const rawStops = [];
            let currentTime = config.startTime || 0;
            let missionAborted = false;

            route.forEach((idx, i) => {
                const place = places[idx];

                // MISSION ABORT: Check if we are already past limit
                if (currentTime > 20.5 * 60) missionAborted = true;

                if (missionAborted) {
                    dropped.push({ name: place.name, reason: 'Mission Fatigue (Time Limit)' });
                    return;
                }

                let distance = 0;
                let travelTime = 0;
                let mode = 'Walk';

                if (i > 0) {
                    if (typeof computeTravelLegFn === 'function') {
                        const leg = computeTravelLegFn(
                            route,
                            i,
                            places,
                            distanceMatrix,
                            config.walkingSpeed,
                            isTaxiZoneFn
                        );
                        mode = leg.mode;
                        distance = leg.distance;
                        travelTime = leg.travelTime;
                    } else {
                        const prevIdx = route[i - 1];
                        const prevPlace = places[prevIdx];
                        // TAXI ENFORCEMENT
                        const isRemote = isTaxiZoneFn(place) || isTaxiZoneFn(prevPlace);
                        if (isRemote) {
                            mode = 'Taxi';
                            distance = 5.0;
                            travelTime = 30;
                        } else {
                            const matrixDistance = distanceMatrix[prevIdx][idx];
                            if (matrixDistance === 5.0) {
                                mode = 'Taxi';
                                distance = 5.0;
                                travelTime = 30;
                            } else {
                                distance = matrixDistance;
                                travelTime = (distance / config.walkingSpeed) * 60;
                            }
                        }
                    }
                    currentTime += travelTime;
                }

                // DOUBLE CHECK TIMELINE POST-TRAVEL
                if (currentTime > 20.5 * 60) {
                    missionAborted = true;
                    dropped.push({ name: place.name, reason: 'Mission Fatigue (Time Limit)' });
                    return;
                }

                const duration = place.visitDuration || 60;

                let context = 'destination';
                if (typeof resolveStopContextFn === 'function') {
                    context = resolveStopContextFn(place, i, currentTime);
                } else {
                    const hour = currentTime / 60;
                    if (/amal|lamine|fassia/i.test(place.name)) {
                        if (hour >= 12 && hour < 16) {
                            context = 'lunch';
                        } else if (hour >= 19) {
                            context = 'dinner';
                        }
                    } else if (i === 0) {
                        context = 'start';
                    }
                }

                rawStops.push({
                    type: context,
                    place: place,
                    name: place.name,
                    arrivalTime: currentTime,
                    visitDuration: duration,
                    transportLabel: mode,
                    travelDistance: Number(distance.toFixed(1)),
                    travelTime: Math.round(travelTime),
                    icon: place.icon || '📍',
                    crowdLevel: 'Medium'
                });

                if (i > 0) currentTime += duration;
            });

            if (typeof finalizeDetailedOutputFn === 'function') {
                return finalizeDetailedOutputFn(rawStops, config.startTime || 0, dropped, hazards);
            }

            const totalDistance = rawStops.reduce((acc, stop) => acc + stop.travelDistance, 0);
            let totalTime = 0;
            let withinDaylight = true;

            if (rawStops.length > 0) {
                const lastStop = rawStops[rawStops.length - 1];
                const endTime = lastStop.arrivalTime + lastStop.visitDuration;
                totalTime = endTime - (config.startTime || 0);
                withinDaylight = (endTime / 60) < 20.5;
            }

            return {
                stops: rawStops,
                route: rawStops,
                dropped: dropped,
                totalDistance: Number(totalDistance.toFixed(1)),
                totalTime: totalTime,
                valid: {
                    totalStops: rawStops.length,
                    withinDaylight: withinDaylight
                },
                hazards: hazards
            };
        };
    }
})(typeof window !== 'undefined' ? window : null);
