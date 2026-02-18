/**
 * ═══════════════════════════════════════════════════════════════
 * ALIDADE ROUTING ALGORITHM - COMPLETE FIX (GOLDEN MASTER)
 * ═══════════════════════════════════════════════════════════════
 * * FIXES IMPLEMENTED:
 * 1. Bidirectional Taxi Logic (Palmeraie/Quad <-> City)
 * 2. Hard MAX_WALK constraint (Block > 3km walks with Infinity)
 * 3. Cost-Aware 2-Opt (Respects time penalties during optimization)
 * 4. Scheduler Logic (Correctly inserts Lunch & Rest breaks)
 */

class RoutePlanner {
    constructor(places, config = {}) {
        this.places = places;
        this.config = {
            startTime: config.startTime || 9.0, // 09:00
            maxWalkDistance: config.maxWalkDistance || 3.0, // 3km hard limit
            taxiTime: config.taxiTime || 30, // 30 min fixed for transport zones
            walkingSpeed: config.walkingSpeed || 4.0, // km/h
            timePenaltyWeight: config.timePenaltyWeight || 2.0,
            ...config
        };

        this.distanceMatrix = this._buildDistanceMatrix();
        this.timeMatrix = this._buildTimeMatrix();
    }

    // ═══════════════════════════════════════════════════════════════
    // FIX 1 & 2: BIDIRECTIONAL TRANSPORT + HARD WALK LIMIT
    // ═══════════════════════════════════════════════════════════════

    _buildDistanceMatrix() {
        const n = this.places.length;
        const matrix = Array(n).fill(null).map(() => Array(n).fill(0));

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) {
                    matrix[i][j] = 0;
                    continue;
                }

                const source = this.places[i];
                const dest = this.places[j];

                // Calculate raw distance
                const distance = this._haversineDistance(
                    source.lat, source.lng,
                    dest.lat, dest.lng
                );

                // ✅ FIX 1: CHECK BOTH SOURCE & DEST for transport zones
                if (this._isTransportZone(source.id) || this._isTransportZone(dest.id)) {
                    // This is a TAXI trip (bidirectional!)
                    matrix[i][j] = 0.1; // Small value (not zero to avoid division errors)
                }
                // ✅ FIX 2: HARD WALK LIMIT
                else if (distance > this.config.maxWalkDistance) {
                    // Check if either is hotel (always accessible)
                    const isHotelRoute = this._isHotel(source.id) || this._isHotel(dest.id);

                    if (!isHotelRoute) {
                        // BLOCK this route (too far to walk)
                        matrix[i][j] = Infinity;
                    } else {
                        // Hotel routes get taxi automatically
                        matrix[i][j] = 0.1;
                    }
                }
                else {
                    // Normal walking distance
                    matrix[i][j] = distance;
                }
            }
        }

        return matrix;
    }

    _buildTimeMatrix() {
        const n = this.places.length;
        const matrix = Array(n).fill(null).map(() => Array(n).fill(0));

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) {
                    matrix[i][j] = 0;
                    continue;
                }

                const source = this.places[i];
                const dest = this.places[j];
                const distance = this.distanceMatrix[i][j];

                // ✅ FIX 1: BIDIRECTIONAL TAXI TIME
                if (this._isTransportZone(source.id) || this._isTransportZone(dest.id)) {
                    // Fixed taxi time (30 min) BOTH directions
                    matrix[i][j] = this.config.taxiTime;
                }
                else if (distance === Infinity) {
                    // Blocked route
                    matrix[i][j] = Infinity;
                }
                else if (distance <= 0.1) {
                    // Taxi route (from hotel, etc)
                    matrix[i][j] = this.config.taxiTime;
                }
                else {
                    // Walking time
                    matrix[i][j] = (distance / this.config.walkingSpeed) * 60; // minutes
                }
            }
        }

        return matrix;
    }

    // ═══════════════════════════════════════════════════════════════
    // HELPER FUNCTIONS
    // ═══════════════════════════════════════════════════════════════

    _isTransportZone(id) {
        if (!id) return false;
        const lowerID = id.toLowerCase();
        return lowerID.includes('quad') || lowerID.includes('palmeraie') || lowerID.includes('balloon') || lowerID.includes('camel');
    }

    _isHotel(id) {
        if (!id) return false;
        const lowerID = id.toLowerCase();
        return lowerID.includes('hotel') || lowerID.includes('riad') || id === 'start' || id === 'end';
    }

    _haversineDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    // ═══════════════════════════════════════════════════════════════
    // TIME PENALTY LOGIC
    // ═══════════════════════════════════════════════════════════════

    calculateTimePenalty(place, arrivalTime) {
        let penalty = 0;
        const arrivalHour = arrivalTime % 24;

        // NUCLEAR PENALTY 1: Lunch Only venues after 14:00
        if (place.intel && place.intel.toLowerCase().includes('lunch only')) {
            if (arrivalHour > 14.0) {
                return 100000; // IMPOSSIBLE - door locked
            }
        }

        // NUCLEAR PENALTY 2: Closed venues
        if (place.openingHours) {
            if (arrivalHour < place.openingHours.open || arrivalHour > place.openingHours.close) {
                return 100000; // IMPOSSIBLE - closed
            }
        }

        // THERMAL TRAP: High exposure zones 12:00-16:00
        const thermalZones = ['jemaa', 'badi', 'menara', 'square'];
        const isThermalZone = thermalZones.some(zone => place.id && place.id.toLowerCase().includes(zone));

        if (isThermalZone && arrivalHour >= 12.0 && arrivalHour <= 16.0) {
            penalty += 500; // High friction
        }

        // MORNING ANCHOR: Best visited early
        if (place.bestTime && place.bestTime.includes('09:00')) {
            if (arrivalHour > 10.0) {
                penalty += 200; // Prefer morning
            }
        }

        // ACTIVITY LOGIC: Adventures before sunset
        if (place.category === 'Adventure' && arrivalHour > 18.0) {
            return 10000; // Too late
        }

        return penalty;
    }

    // ═══════════════════════════════════════════════════════════════
    // NEAREST NEIGHBOR (With Time Penalties)
    // ═══════════════════════════════════════════════════════════════

    nearestNeighbor() {
        const n = this.places.length;
        const visited = new Array(n).fill(false);
        const route = [];

        // Start at index 0 (hotel)
        let current = 0;
        visited[0] = true;
        route.push(current);

        let currentTime = this.config.startTime;

        for (let i = 1; i < n; i++) {
            let bestNext = -1;
            let bestCost = Infinity;

            for (let j = 0; j < n; j++) {
                if (visited[j]) continue;

                const distance = this.distanceMatrix[current][j];
                const travelTime = this.timeMatrix[current][j];

                if (distance === Infinity) continue; // Skip blocked routes

                // Calculate arrival time at j
                const arrivalTime = currentTime + (travelTime / 60); // Convert to hours

                // Calculate time penalty
                const timePenalty = this.calculateTimePenalty(this.places[j], arrivalTime);

                // TOTAL COST = Distance + (Time Penalty * Weight)
                const totalCost = distance + (timePenalty * this.config.timePenaltyWeight);

                if (totalCost < bestCost) {
                    bestCost = totalCost;
                    bestNext = j;
                }
            }

            if (bestNext === -1) break;

            visited[bestNext] = true;
            route.push(bestNext);

            // Update current time
            const travelTime = this.timeMatrix[current][bestNext];
            const visitDuration = this.places[bestNext].visitDuration || 60;
            currentTime += (travelTime / 60) + (visitDuration / 60);

            current = bestNext;
        }

        return route;
    }

    // ═══════════════════════════════════════════════════════════════
    // FIX 3: 2-OPT WITH TOTAL COST
    // ═══════════════════════════════════════════════════════════════

    twoOptimize(initialRoute, maxIterations = 100) {
        let route = [...initialRoute];
        let improved = true;
        let iterations = 0;

        while (improved && iterations < maxIterations) {
            improved = false;
            iterations++;

            for (let i = 1; i < route.length - 2; i++) {
                for (let j = i + 1; j < route.length - 1; j++) {
                    const newRoute = [
                        ...route.slice(0, i),
                        ...route.slice(i, j + 1).reverse(),
                        ...route.slice(j + 1)
                    ];

                    // ✅ FIX 3: Compare TOTAL COST (not just distance!)
                    const currentCost = this._calculateTotalCost(route);
                    const newCost = this._calculateTotalCost(newRoute);

                    if (newCost < currentCost) {
                        route = newRoute;
                        improved = true;
                    }
                }
            }
        }
        return route;
    }

    _calculateTotalCost(route) {
        let totalDistance = 0;
        let totalPenalty = 0;
        let currentTime = this.config.startTime;

        for (let i = 0; i < route.length - 1; i++) {
            const from = route[i];
            const to = route[i + 1];

            const distance = this.distanceMatrix[from][to];
            if (distance === Infinity) return Infinity; // Invalid route
            totalDistance += distance;

            const travelTime = this.timeMatrix[from][to];
            currentTime += (travelTime / 60);

            const penalty = this.calculateTimePenalty(this.places[to], currentTime);
            totalPenalty += penalty;

            const visitDuration = this.places[to].visitDuration || 60;
            currentTime += (visitDuration / 60);
        }

        return totalDistance + (totalPenalty * this.config.timePenaltyWeight);
    }

    // ═══════════════════════════════════════════════════════════════
    // FIX 4: FINAL SCHEDULER (With Breaks & Labels)
    // ═══════════════════════════════════════════════════════════════

    optimize() {
        // Step 1: Nearest Neighbor
        const initialRoute = this.nearestNeighbor();

        // Step 2: 2-Opt
        const optimizedRoute = this.twoOptimize(initialRoute);

        // Step 3: Generate output with breaks
        return this._generateOutput(optimizedRoute);
    }

    _generateOutput(route) {
        const stops = [];
        let currentTime = this.config.startTime;
        let lastBreakTime = currentTime;
        let lunchScheduled = false;

        // Add Start Point
        const startPlace = this.places[route[0]];
        stops.push({
            type: 'start',
            place: startPlace,
            arrivalTime: currentTime,
            transportMode: 'start'
        });

        for (let i = 1; i < route.length; i++) {
            const prevIndex = route[i - 1];
            const currIndex = route[i];
            const place = this.places[currIndex];

            // 1. Calculate Travel Logic
            const matrixDist = this.distanceMatrix[prevIndex][currIndex];
            let travelTime = this.timeMatrix[prevIndex][currIndex]; // minutes
            let travelDist = 0;
            let transportMode = 'walk';

            // Detect Transport Mode (Taxi vs Walk)
            if (this._isTransportZone(this.places[prevIndex].id) || this._isTransportZone(place.id)) {
                transportMode = 'taxi';
                travelDist = 0.1; // Visual distance
            } else if (matrixDist === Infinity) {
                transportMode = 'impossible';
            } else {
                // Real walking distance for UI
                travelDist = this._haversineDistance(
                    this.places[prevIndex].lat, this.places[prevIndex].lng,
                    place.lat, place.lng
                );
            }

            // 2. Add Travel Time
            currentTime += (travelTime / 60);

            // 3. INSERT BREAKS LOGIC
            const hour = currentTime % 24;

            // A. Lunch Break (12:00 - 14:00)
            if (!lunchScheduled && hour >= 12.0 && hour < 14.0) {
                stops.push({
                    type: 'lunch',
                    name: 'Lunch Break',
                    arrivalTime: currentTime,
                    duration: 60,
                    icon: '🍽️'
                });
                currentTime += 1.0; // +60 mins
                lunchScheduled = true;
                lastBreakTime = currentTime;
            }

            // B. Rest Break (Every 2.5 hours)
            else if ((currentTime - lastBreakTime) > 2.5) {
                stops.push({
                    type: 'break',
                    name: 'Rest & Hydration',
                    arrivalTime: currentTime,
                    duration: 15,
                    icon: '☕'
                });
                currentTime += 0.25; // +15 mins
                lastBreakTime = currentTime;
            }

            // 4. Add Destination
            stops.push({
                type: 'destination',
                place: place,
                arrivalTime: currentTime,
                travelDistance: travelDist,
                travelTime: travelTime,
                transportMode: transportMode
            });

            // 5. Add Visit Duration
            const visitDuration = place.visitDuration || 60;
            currentTime += (visitDuration / 60);
        }

        return {
            route: route,
            stops: stops,
            totalDistance: stops.reduce((sum, s) => sum + (s.travelDistance || 0), 0),
            totalDuration: (currentTime - this.config.startTime) * 60,
            endTime: currentTime
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = RoutePlanner;
}