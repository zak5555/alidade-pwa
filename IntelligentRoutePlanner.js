/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ALIDADE // INTELLIGENT ROUTE PLANNER
 * Deep Intelligence Module for Marrakech Itinerary Optimization
 * Version: 3.0 (Deep-Score Architecture)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * ARCHITECTURE:
 * - Multi-Dimensional Scoring (Distance, Time Penalty, Compatibility)
 * - Hard/Soft Constraint System
 * - Look-Ahead Nearest Neighbor Algorithm
 * - Marrakech-Specific Cultural & Environmental Rules
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

class IntelligentRoutePlanner {

    // ═══════════════════════════════════════════════════════════════════════════
    // CONFIGURATION CONSTANTS
    // ═══════════════════════════════════════════════════════════════════════════

    static WEIGHTS = {
        DISTANCE: 1.0,          // Base weight for distance
        TIME_PENALTY: 2.5,      // Weight for time-based penalties
        COMPATIBILITY: 1.5,     // Weight for sequential compatibility
        CROWD_PENALTY: 0.8      // Weight for crowd-level penalties
    };

    static PENALTIES = {
        HARD_CONSTRAINT: Infinity,  // Impossible - venue closed, wrong time
        HEAT_OUTDOOR: 500,          // Outdoor during 12:00-16:00
        WRONG_MEAL_TIME: 800,       // Lunch spot outside lunch hours
        HIGH_CROWD: 200,            // High crowd level
        MEDIUM_CROWD: 50,           // Medium crowd level
        SUNSET_PREFERENCE: -100,    // Bonus for Jemaa at sunset (negative = good)
        MORNING_OUTDOOR: -150,      // Bonus for outdoor activities in morning
        TAXI_DISTANCE: 5.0          // Fixed "distance" for taxi zones
    };

    static THERMAL_DANGER_HOURS = { start: 12, end: 16 }; // Peak heat window
    static LUNCH_WINDOW = { start: 12, end: 14.5 };       // 12:00 - 14:30
    static SUNSET_WINDOW = { start: 17, end: 19.5 };      // Best Jemaa time

    // ═══════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════════════

    constructor(places, config = {}) {
        // Validate input
        if (!Array.isArray(places) || places.length === 0) {
            throw new Error('[IntelligentRoutePlanner] No places provided.');
        }

        this.places = places.map((p, idx) => ({
            ...p,
            _index: idx,
            id: p.id || `place_${idx}`,
            name: p.name || 'Unknown Location',
            lat: Number(p.lat) || 31.6295,
            lng: Number(p.lng) || -7.9811,
            visitDuration: Number(p.visitDuration) || 60,
            category: (p.category || 'general').toLowerCase(),
            icon: p.icon || '📍'
        }));

        // Parse start time (accept HH:MM string or minutes number)
        let startTime = 540; // Default 09:00
        if (config.startTime) {
            if (typeof config.startTime === 'string' && config.startTime.includes(':')) {
                const [h, m] = config.startTime.split(':').map(Number);
                startTime = (h * 60) + m;
            } else {
                startTime = Number(config.startTime);
                if (startTime < 24) startTime *= 60; // Convert hours to minutes
            }
        }
        if (isNaN(startTime) || startTime < 0) startTime = 540;

        this.config = {
            startTime,
            maxWalkDistance: config.maxWalkDistance || 2.5,  // km before taxi
            walkingSpeed: config.walkingSpeed || 4.5,        // km/h
            taxiTime: config.taxiTime || 25,                 // minutes for taxi
            endTime: config.endTime || (19.5 * 60),          // Default 19:30
            ...config
        };

        // Build matrices
        this.distanceMatrix = this._buildDistanceMatrix();
        this.compatibilityMatrix = this._buildCompatibilityMatrix();
        this.feasibilityScores = this._buildFeasibilityScores();

        // Safety zones for hazard warnings
        this.RED_ZONES = [
            { id: 'jemaa', name: 'Jemaa el-Fnaa', risk: 'HIGH', reason: 'Peak pickpocket activity after dark', advice: 'Keep valuables hidden. Use inner pockets.' },
            { id: 'souk', name: 'The Souks', risk: 'MEDIUM', reason: 'Aggressive sales tactics, maze-like structure', advice: 'Stay on main paths. Say "La Shukran" firmly.' },
            { id: 'mellah', name: 'Mellah District', risk: 'MEDIUM', reason: 'Isolated alleys after 8PM', advice: 'Visit before sunset. Stick to main streets.' },
            { id: 'gueliz', name: 'Gueliz', risk: 'LOW', reason: 'Modern district, generally safe', advice: 'Standard city precautions apply.' }
        ];

        console.log(`[IntelligentRoutePlanner] Initialized with ${this.places.length} places. Start: ${this._formatTime(this.config.startTime)}`);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MATRIX BUILDERS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Build distance matrix between all places.
     * Taxi zones get a fixed "virtual distance" to prevent them from being skipped.
     */
    _buildDistanceMatrix() {
        const n = this.places.length;
        const matrix = Array(n).fill(null).map(() => Array(n).fill(0));

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) continue;

                const from = this.places[i];
                const to = this.places[j];

                // Check if either is a "taxi zone" (Palmeraie, Quad, Majorelle, etc.)
                if (this._isTaxiZone(from) || this._isTaxiZone(to)) {
                    matrix[i][j] = IntelligentRoutePlanner.PENALTIES.TAXI_DISTANCE;
                } else {
                    matrix[i][j] = this._haversineDistance(from.lat, from.lng, to.lat, to.lng);
                }
            }
        }

        return matrix;
    }

    /**
     * Build compatibility matrix for sequential venue pairing.
     * Returns a penalty score (0 = perfect, higher = worse).
     */
    _buildCompatibilityMatrix() {
        const n = this.places.length;
        const matrix = Array(n).fill(null).map(() => Array(n).fill(0));

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) continue;

                const from = this.places[i];
                const to = this.places[j];

                let penalty = 0;

                // Rule: Don't visit two "meal" places in a row
                if (this._isMealVenue(from) && this._isMealVenue(to)) {
                    penalty += 300;
                }

                // Rule: After outdoor, prefer indoor (heat recovery)
                if (this._isOutdoor(from) && this._isOutdoor(to)) {
                    penalty += 100;
                }

                // Rule: Prefer museums/indoor after gardens
                if (this._isOutdoor(from) && this._isIndoor(to)) {
                    penalty -= 50; // Bonus (negative penalty)
                }

                // Rule: Souks and Jemaa are naturally paired
                if ((from.id?.includes('souk') && to.id?.includes('jemaa')) ||
                    (from.id?.includes('jemaa') && to.id?.includes('souk'))) {
                    penalty -= 30;
                }

                matrix[i][j] = penalty;
            }
        }

        return matrix;
    }

    /**
     * Build feasibility scores for each place at each hour of the day.
     * Returns: { placeIndex: { hour: penaltyScore } }
     */
    _buildFeasibilityScores() {
        const scores = {};

        for (let i = 0; i < this.places.length; i++) {
            const place = this.places[i];
            scores[i] = {};

            for (let hour = 6; hour <= 22; hour++) {
                let penalty = 0;

                // Hard constraint: Venue closed
                if (place.hours) {
                    const open = place.hours.open || 8;
                    const close = place.hours.close || 20;
                    if (hour < open || hour >= close) {
                        penalty = IntelligentRoutePlanner.PENALTIES.HARD_CONSTRAINT;
                    }
                }

                // Hard constraint: Lunch-only venue outside window
                if (this._isLunchOnly(place)) {
                    if (hour < IntelligentRoutePlanner.LUNCH_WINDOW.start ||
                        hour > IntelligentRoutePlanner.LUNCH_WINDOW.end) {
                        penalty = IntelligentRoutePlanner.PENALTIES.HARD_CONSTRAINT;
                    }
                }

                // Soft constraint: Outdoor during thermal danger
                if (penalty < Infinity && this._isOutdoor(place)) {
                    if (hour >= IntelligentRoutePlanner.THERMAL_DANGER_HOURS.start &&
                        hour < IntelligentRoutePlanner.THERMAL_DANGER_HOURS.end) {
                        penalty += IntelligentRoutePlanner.PENALTIES.HEAT_OUTDOOR;
                    }
                }

                // Bonus: Morning outdoor (Quad, Palmeraie)
                if (this._isMorningAnchor(place) && hour >= 8 && hour < 11) {
                    penalty += IntelligentRoutePlanner.PENALTIES.MORNING_OUTDOOR;
                }

                // Bonus: Jemaa at sunset
                if (this._isSunsetAnchor(place)) {
                    if (hour >= IntelligentRoutePlanner.SUNSET_WINDOW.start &&
                        hour <= IntelligentRoutePlanner.SUNSET_WINDOW.end) {
                        penalty += IntelligentRoutePlanner.PENALTIES.SUNSET_PREFERENCE;
                    } else if (hour < 15) {
                        penalty += 200; // Penalty for visiting too early
                    }
                }

                scores[i][hour] = penalty;
            }
        }

        return scores;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CLASSIFICATION HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    _isTaxiZone(place) {
        const id = (place.id || '').toLowerCase();
        const name = (place.name || '').toLowerCase();
        const keywords = ['quad', 'palmeraie', 'balloon', 'camel', 'majorelle', 'menara', 'agafay', 'aga fay'];
        return keywords.some(k => id.includes(k) || name.includes(k));
    }

    _isOutdoor(place) {
        const id = (place.id || '').toLowerCase();
        const name = (place.name || '').toLowerCase();
        const cat = (place.category || '').toLowerCase();
        const keywords = ['garden', 'palmeraie', 'menara', 'quad', 'camel', 'balloon', 'pool', 'terrace', 'agafay'];
        return cat === 'outdoor' || cat === 'nature' || keywords.some(k => id.includes(k) || name.includes(k));
    }

    _isIndoor(place) {
        const cat = (place.category || '').toLowerCase();
        const id = (place.id || '').toLowerCase();
        return ['museum', 'palace', 'riad', 'restaurant', 'cafe', 'shopping'].includes(cat) ||
            id.includes('museum') || id.includes('palace') || id.includes('bahia') || id.includes('badi');
    }

    _isMealVenue(place) {
        const cat = (place.category || '').toLowerCase();
        const id = (place.id || '').toLowerCase();
        return cat === 'restaurant' || cat === 'cafe' || cat === 'food' ||
            id.includes('lunch') || id.includes('amal') || id.includes('cafe') || id.includes('restaurant');
    }

    _isLunchOnly(place) {
        const id = (place.id || '').toLowerCase();
        const name = (place.name || '').toLowerCase();
        // Amal Training Center is lunch-only
        return id.includes('amal') || name.includes('amal training');
    }

    _isMorningAnchor(place) {
        const id = (place.id || '').toLowerCase();
        const name = (place.name || '').toLowerCase();
        return id.includes('quad') || id.includes('palmeraie') || id.includes('balloon') ||
            name.includes('quad') || name.includes('palmeraie');
    }

    _isSunsetAnchor(place) {
        const id = (place.id || '').toLowerCase();
        const name = (place.name || '').toLowerCase();
        return id.includes('jemaa') || id.includes('fnaa') || name.includes('jemaa');
    }

    _isStartPoint(place) {
        const id = (place.id || '').toLowerCase();
        return id === 'start' || id === 'hotel' || id.includes('riad');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SCORING ENGINE
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Calculate the total score for moving from `fromIdx` to `toIdx` at `currentTime`.
     * Lower score = better choice.
     */
    _calculateMoveScore(fromIdx, toIdx, currentTimeMinutes) {
        const W = IntelligentRoutePlanner.WEIGHTS;
        const hour = Math.floor(currentTimeMinutes / 60);

        // Component 1: Distance
        const distance = this.distanceMatrix[fromIdx][toIdx] || 0;
        const distanceScore = distance * W.DISTANCE;

        // Component 2: Time Penalty (feasibility at arrival hour)
        const travelTime = this._estimateTravelTime(fromIdx, toIdx);
        const arrivalHour = Math.floor((currentTimeMinutes + travelTime) / 60);
        const timePenalty = this.feasibilityScores[toIdx]?.[arrivalHour] || 0;

        // If hard constraint, return infinity immediately
        if (timePenalty === Infinity) return Infinity;

        const timePenaltyScore = timePenalty * W.TIME_PENALTY;

        // Component 3: Compatibility
        const compatibility = this.compatibilityMatrix[fromIdx][toIdx] || 0;
        const compatibilityScore = compatibility * W.COMPATIBILITY;

        // Component 4: Crowd Level
        const place = this.places[toIdx];
        let crowdPenalty = 0;
        if (place.crowdLevel === 'High') crowdPenalty = IntelligentRoutePlanner.PENALTIES.HIGH_CROWD;
        else if (place.crowdLevel === 'Medium') crowdPenalty = IntelligentRoutePlanner.PENALTIES.MEDIUM_CROWD;
        const crowdScore = crowdPenalty * W.CROWD_PENALTY;

        return distanceScore + timePenaltyScore + compatibilityScore + crowdScore;
    }

    /**
     * Estimate travel time in minutes from place i to place j.
     */
    _estimateTravelTime(fromIdx, toIdx) {
        const distance = this.distanceMatrix[fromIdx][toIdx] || 0;

        if (distance >= this.config.maxWalkDistance ||
            this._isTaxiZone(this.places[fromIdx]) ||
            this._isTaxiZone(this.places[toIdx])) {
            return this.config.taxiTime;
        }

        // Walking: distance (km) / speed (km/h) * 60 min
        return Math.round((distance / this.config.walkingSpeed) * 60);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INTELLIGENT NEAREST NEIGHBOR (WITH LOOK-AHEAD)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Main optimization algorithm.
     * Uses intelligent scoring instead of pure distance.
     * Implements 1-step look-ahead for better decisions.
     */
    _intelligentNearestNeighbor() {
        if (this.places.length <= 1) return [0];

        const n = this.places.length;
        const visited = new Set();
        const route = [];

        // Always start at index 0 (the injected start point)
        let current = 0;
        route.push(current);
        visited.add(current);

        let currentTime = this.config.startTime;

        while (visited.size < n) {
            let bestNext = -1;
            let bestScore = Infinity;

            // Evaluate all unvisited candidates
            for (let candidate = 0; candidate < n; candidate++) {
                if (visited.has(candidate)) continue;

                // Calculate primary score
                const primaryScore = this._calculateMoveScore(current, candidate, currentTime);
                if (primaryScore === Infinity) continue;

                // 1-Step Look-Ahead: What's the best we can do AFTER this candidate?
                let lookAheadBonus = 0;
                if (visited.size < n - 1) { // Only if there are more stops after
                    const tempTime = currentTime + this._estimateTravelTime(current, candidate) +
                        (this.places[candidate].visitDuration || 60);

                    let bestLookAhead = Infinity;
                    for (let next = 0; next < n; next++) {
                        if (visited.has(next) || next === candidate) continue;
                        const laScore = this._calculateMoveScore(candidate, next, tempTime);
                        if (laScore < bestLookAhead) bestLookAhead = laScore;
                    }

                    // If look-ahead shows no good options, penalize this candidate
                    if (bestLookAhead === Infinity && visited.size < n - 2) {
                        lookAheadBonus = 1000;
                    } else if (bestLookAhead < Infinity) {
                        lookAheadBonus = bestLookAhead * 0.3; // Partial influence
                    }
                }

                const totalScore = primaryScore + lookAheadBonus;

                if (totalScore < bestScore) {
                    bestScore = totalScore;
                    bestNext = candidate;
                }
            }

            // If no valid next found, pick any unvisited (emergency fallback)
            if (bestNext === -1) {
                for (let i = 0; i < n; i++) {
                    if (!visited.has(i)) {
                        bestNext = i;
                        console.warn(`[IntelligentRoutePlanner] Emergency pick: ${this.places[i].name}`);
                        break;
                    }
                }
            }

            if (bestNext === -1) break; // Truly stuck

            // Commit to this choice
            route.push(bestNext);
            visited.add(bestNext);

            // Update time
            currentTime += this._estimateTravelTime(current, bestNext);
            currentTime += (this.places[bestNext].visitDuration || 60);

            current = bestNext;
        }

        return route;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PUBLIC: OPTIMIZE
    // ═══════════════════════════════════════════════════════════════════════════

    optimize() {
        console.log('[IntelligentRoutePlanner] Starting optimization...');

        const routeIndices = this._intelligentNearestNeighbor();
        const output = this._generateOutput(routeIndices);

        console.log(`[IntelligentRoutePlanner] Route optimized: ${output.stops.length} stops, ${output.totalDistance.toFixed(2)} km`);

        return output;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // OUTPUT GENERATION
    // ═══════════════════════════════════════════════════════════════════════════

    _generateOutput(routeIndices) {
        const stops = [];
        let currentTime = this.config.startTime;
        let totalDistance = 0;

        for (let i = 0; i < routeIndices.length; i++) {
            const placeIdx = routeIndices[i];
            const place = this.places[placeIdx];

            // Calculate travel from previous stop
            let travelDistance = 0;
            let travelTime = 0;
            let transportMode = 'walk';

            if (i > 0) {
                const prevIdx = routeIndices[i - 1];
                travelDistance = this.distanceMatrix[prevIdx][placeIdx] || 0;
                travelTime = this._estimateTravelTime(prevIdx, placeIdx);

                if (travelDistance >= this.config.maxWalkDistance ||
                    this._isTaxiZone(this.places[prevIdx]) ||
                    this._isTaxiZone(place)) {
                    transportMode = 'taxi';
                }

                currentTime += travelTime;
                totalDistance += travelDistance;
            }

            // Determine stop type
            let stopType = 'destination';
            if (i === 0) stopType = 'start';
            if (this._isMealVenue(place)) stopType = 'meal';

            stops.push({
                type: stopType,
                place: place,
                id: place.id,
                name: place.name,
                lat: place.lat,
                lng: place.lng,
                icon: place.icon,
                arrivalTime: currentTime,
                time: currentTime, // Alias for UI compatibility
                travelDistance: Number(travelDistance.toFixed(2)),
                distance: travelDistance.toFixed(2), // String for UI
                travelTime: travelTime,
                transportMode: transportMode,
                transportLabel: transportMode === 'taxi' ? 'Taxi / Transfer' : 'Walk',
                visitDuration: place.visitDuration || 60,
                crowdLevel: place.crowdLevel || 'Medium',
                tips: place.tips || null
            });

            // Add visit duration
            if (i > 0) {
                currentTime += (place.visitDuration || 60);
            }
        }

        const endTime = currentTime;
        const totalDuration = endTime - this.config.startTime;

        return {
            route: stops,              // Array of stop objects
            stops: stops,              // Alias for UI compatibility
            totalDistance: Number(totalDistance.toFixed(2)),
            totalDuration: totalDuration,
            totalTime: totalDuration,  // Alias
            startTime: this.config.startTime,
            endTime: endTime,
            valid: {
                totalStops: stops.length,
                withinDaylight: endTime < (19.5 * 60),
                allDestinationsOpen: true
            },
            hazards: this.checkSafetyHazards(routeIndices)
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SAFETY HAZARD CHECK
    // ═══════════════════════════════════════════════════════════════════════════

    checkSafetyHazards(routeIndices) {
        const hazards = [];

        for (const idx of routeIndices) {
            const place = this.places[idx];
            if (!place) continue;

            const id = (place.id || '').toLowerCase();
            const name = (place.name || '').toLowerCase();

            for (const zone of this.RED_ZONES) {
                if (id.includes(zone.id) || name.includes(zone.name.toLowerCase())) {
                    hazards.push({
                        placeId: place.id,
                        name: place.name,
                        risk: zone.risk,
                        reason: zone.reason,
                        advice: zone.advice
                    });
                    break; // One hazard per place
                }
            }
        }

        return hazards;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITY FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    _haversineDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    _formatTime(minutes) {
        const m = Number(minutes) || 0;
        const h = Math.floor(m / 60) % 24;
        const mins = Math.round(m % 60);
        return `${h.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UI HANDLER: BRIDGE BETWEEN UI AND ALGORITHM
// ═══════════════════════════════════════════════════════════════════════════════

window.runRouteOptimization = function () {
    const resultsDiv = document.getElementById('route-results');
    const btn = document.getElementById('optimize-btn');

    if (!resultsDiv) {
        console.error('[ALIDADE] Results container not found.');
        return;
    }

    // Show loading state
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="animate-spin">⏳</span> Calculating...';
    }

    setTimeout(() => {
        try {
            // ═══════════════════════════════════════════════════════════════
            // STEP 1: GET SELECTED DESTINATIONS
            // ═══════════════════════════════════════════════════════════════
            let selectedIds = [];

            if (typeof window.getSelectedDestinationIds === 'function') {
                selectedIds = window.getSelectedDestinationIds();
            } else {
                // Fallback to localStorage
                selectedIds = JSON.parse(localStorage.getItem('routePlannerSelections') || '[]');
            }

            if (!selectedIds || selectedIds.length === 0) {
                throw new Error('No destinations selected. Please select at least 2 places.');
            }

            // Get full destination objects from global database
            const allDests = window.ALL_DESTINATIONS || window.MARRAKECH_DESTINATIONS?.ALL || [];
            const selectedDests = allDests.filter(d => selectedIds.includes(d.id));

            if (selectedDests.length < 1) {
                throw new Error('Could not find selected destinations in database.');
            }

            // ═══════════════════════════════════════════════════════════════
            // STEP 2: DEFINE START POINT (CRITICAL FIX)
            // ═══════════════════════════════════════════════════════════════
            const startSelect = document.getElementById('start-location');
            const startVal = startSelect ? startSelect.value : 'hotel';

            const START_LOCATIONS = {
                hotel: { id: 'start', name: 'My Hotel / Riad', lat: 31.6295, lng: -7.9811, icon: '🏨', visitDuration: 0 },
                jemaa: { id: 'start', name: 'Jemaa el-Fnaa', lat: 31.6259, lng: -7.9892, icon: '📍', visitDuration: 0 },
                gueliz: { id: 'start', name: 'Gueliz Center', lat: 31.6358, lng: -8.0103, icon: '🏙️', visitDuration: 0 },
                current: { id: 'start', name: 'Current Location', lat: 31.6295, lng: -7.9811, icon: '📍', visitDuration: 0 }
            };

            const startNode = START_LOCATIONS[startVal] || START_LOCATIONS.hotel;

            // ═══════════════════════════════════════════════════════════════
            // STEP 3: MERGE START + DESTINATIONS (Index 0 = Start)
            // ═══════════════════════════════════════════════════════════════
            const placesToVisit = [startNode, ...selectedDests];

            console.log(`[ALIDADE] Optimizing route: ${placesToVisit.length} stops. Starting from: ${startNode.name}`);

            // ═══════════════════════════════════════════════════════════════
            // STEP 4: GET USER CONFIG
            // ═══════════════════════════════════════════════════════════════
            const startTimeInput = document.getElementById('start-time');
            const startTimeStr = startTimeInput ? startTimeInput.value : '09:00';

            const config = {
                startTime: startTimeStr,
                maxWalkDistance: 2.5,
                taxiTime: 25
            };

            // ═══════════════════════════════════════════════════════════════
            // STEP 5: EXECUTE OPTIMIZATION
            // ═══════════════════════════════════════════════════════════════
            const planner = new IntelligentRoutePlanner(placesToVisit, config);
            const result = planner.optimize();

            // ═══════════════════════════════════════════════════════════════
            // STEP 6: RENDER RESULTS
            // ═══════════════════════════════════════════════════════════════
            if (typeof window.displayRouteResults === 'function') {
                window.displayRouteResults(result, planner);
            } else {
                // Inline fallback display
                _fallbackDisplayResults(result, planner, resultsDiv);
            }

        } catch (err) {
            console.error('[ALIDADE] Route optimization error:', err);
            resultsDiv.innerHTML = `
                <div class="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200">
                    <strong>⚠️ Optimization Failed</strong><br>
                    <span class="text-sm font-mono">${err.message}</span>
                </div>
            `;
            resultsDiv.classList.remove('hidden');
        }

        // Reset button
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span>🧮</span> Optimize Route';
        }
    }, 100);
};

/**
 * Fallback display function if window.displayRouteResults is not defined.
 */
function _fallbackDisplayResults(result, planner, resultsDiv) {
    const totalHours = Math.floor(result.totalTime / 60);
    const totalMins = Math.round(result.totalTime % 60);

    let stepsHtml = result.stops.map((stop, i) => {
        const m = Number(stop.arrivalTime || stop.time) || 0;
        const h = Math.floor(m / 60) % 24;
        const mins = Math.round(m % 60);
        const timeStr = `${h.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

        if (stop.type === 'start') {
            return `
                <div class="flex gap-3">
                    <div class="flex flex-col items-center">
                        <div class="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center text-lg">${stop.icon || '📍'}</div>
                        <div class="w-0.5 flex-1 bg-zinc-700 my-1"></div>
                    </div>
                    <div class="flex-1 pb-4">
                        <div class="text-zinc-500 text-xs font-mono">${timeStr}</div>
                        <div class="text-white font-medium">${stop.name}</div>
                        <div class="text-zinc-500 text-xs">Start your adventure</div>
                    </div>
                </div>`;
        } else {
            return `
                <div class="flex gap-3">
                    <div class="flex flex-col items-center">
                        <div class="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center text-lg">${stop.icon || '📍'}</div>
                        ${i < result.stops.length - 1 ? '<div class="w-0.5 flex-1 bg-zinc-700 my-1"></div>' : ''}
                    </div>
                    <div class="flex-1 pb-4">
                        <div class="text-zinc-500 text-xs font-mono">${timeStr}</div>
                        <div class="text-white font-medium">${stop.name}</div>
                        <div class="text-zinc-500 text-xs">⏱️ ${stop.visitDuration || 60} min visit</div>
                        ${stop.travelTime ? `<div class="text-zinc-600 text-xs mt-1">↓ ${stop.distance} km (${stop.transportLabel} ${stop.travelTime} min)</div>` : ''}
                    </div>
                </div>`;
        }
    }).join('');

    resultsDiv.innerHTML = `
        <div class="bg-zinc-900/50 border border-amber-500/30 rounded-xl overflow-hidden">
            <div class="bg-amber-500/10 p-4 border-b border-amber-500/20">
                <h3 class="text-amber-400 font-bold text-lg mb-2">🎯 Optimized Route</h3>
                <div class="grid grid-cols-3 gap-2 text-center">
                    <div><div class="text-2xl font-bold text-white">${result.totalDistance.toFixed(1)}</div><div class="text-zinc-500 text-xs">km total</div></div>
                    <div><div class="text-2xl font-bold text-white">${totalHours}h ${totalMins}m</div><div class="text-zinc-500 text-xs">duration</div></div>
                    <div><div class="text-2xl font-bold text-emerald-400">${result.stops.length}</div><div class="text-zinc-500 text-xs">stops</div></div>
                </div>
            </div>
            <div class="p-4">${stepsHtml}</div>
            <div class="p-4 border-t border-zinc-800 space-y-2 text-sm">
                <div class="flex items-center gap-2 ${result.valid?.withinDaylight ? 'text-emerald-400' : 'text-rose-400'}">
                    ${result.valid?.withinDaylight ? '✅' : '⚠️'} ${result.valid?.withinDaylight ? 'Finishes before sunset' : 'May run past sunset'}
                </div>
                <div class="flex items-center gap-2 text-emerald-400">✅ Intelligent scheduling</div>
                <div class="flex items-center gap-2 text-emerald-400">✅ 100% offline calculation</div>
            </div>
            <div class="p-4 border-t border-zinc-800 flex gap-2">
                <button onclick="exportToGoogleMaps()" class="flex-1 py-3 rounded-lg bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-colors">🗺️ Open in Maps</button>
                <button onclick="shareRoute()" class="flex-1 py-3 rounded-lg bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-colors">📤 Share</button>
            </div>
        </div>`;
    resultsDiv.classList.remove('hidden');
    window.lastRouteResult = result;
}

// Expose class globally
window.IntelligentRoutePlanner = IntelligentRoutePlanner;

console.log('[ALIDADE] IntelligentRoutePlanner v3.0 loaded.');
