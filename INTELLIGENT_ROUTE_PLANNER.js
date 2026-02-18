/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ALIDADE DEEP INTELLIGENCE SYSTEM v3.0
 * Advanced Multi-Constraint Route Optimizer with Conflict Resolution
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * FEATURES:
 * - Multi-dimensional conflict detection
 * - Weighted priority system (7 dimensions)
 * - Predictive constraint satisfaction
 * - Dynamic penalty calculation
 * - Intelligent fallback strategies
 * - Real-time feasibility scoring
 * 
 * ARCHITECT: System-level conflict resolution with mathematical rigor
 */

class IntelligentRoutePlanner {
    constructor(places, userPreferences = {}, constraints = {}) {
        console.log('🧠 [Deep Intelligence] Initializing Advanced Optimizer...');
        
        this.places = places;
        
        // ═══════════════════════════════════════════════════════════════
        // CONFIGURATION MATRIX
        // ═══════════════════════════════════════════════════════════════
        
        this.config = {
            // Time Configuration
            startTime: constraints.startTime || 9.0,
            endTime: constraints.endTime || 20.0,
            maxDayDuration: constraints.maxDayDuration || 12.0, // hours
            
            // Physical Constraints
            maxWalkDistance: constraints.maxWalkDistance || 3.0, // km
            maxConsecutiveWalks: constraints.maxConsecutiveWalks || 3,
            walkingSpeed: constraints.walkingSpeed || 4.0, // km/h
            fatigueThreshold: constraints.fatigueThreshold || 6.0, // hours of walking
            
            // Transport Configuration
            taxiTime: constraints.taxiTime || 30, // minutes
            taxiCost: constraints.taxiCost || 50, // DH per trip
            
            // Cultural Constraints
            prayerDuration: constraints.prayerDuration || 20, // minutes
            breakDuration: constraints.breakDuration || 15, // minutes
            lunchDuration: constraints.lunchDuration || 60, // minutes
            
            // Environmental Constraints
            thermalDangerStart: constraints.thermalDangerStart || 12.0,
            thermalDangerEnd: constraints.thermalDangerEnd || 16.0,
            sunsetBuffer: constraints.sunsetBuffer || 1.0, // hours before sunset
            
            ...constraints
        };
        
        // ═══════════════════════════════════════════════════════════════
        // USER PREFERENCES (WEIGHTS)
        // ═══════════════════════════════════════════════════════════════
        
        this.weights = {
            // Priority Weights (0-10 scale)
            timingAccuracy: userPreferences.timingAccuracy || 10,      // Must arrive on time
            distanceEfficiency: userPreferences.distanceEfficiency || 7, // Minimize walking
            costOptimization: userPreferences.costOptimization || 5,    // Save money
            comfortLevel: userPreferences.comfortLevel || 8,           // Avoid heat/crowds
            culturalRespect: userPreferences.culturalRespect || 10,    // Honor prayer/lunch
            safetyPriority: userPreferences.safetyPriority || 10,      // Female safety, etc.
            experienceQuality: userPreferences.experienceQuality || 9,  // Best time to visit
            
            ...userPreferences
        };
        
        // ═══════════════════════════════════════════════════════════════
        // PENALTY MATRIX (Mathematical Constants)
        // ═══════════════════════════════════════════════════════════════
        
        this.penalties = {
            // HARD CONSTRAINTS (Impossible = Infinity)
            IMPOSSIBLE: Infinity,
            CLOSED_VENUE: 1000000,
            LUNCH_MISS: 500000,
            PRAYER_CONFLICT: 500000,
            POST_SUNSET: 300000,
            PHYSICAL_LIMIT: 200000,
            
            // SOFT CONSTRAINTS (Discouraged but possible)
            THERMAL_DANGER: 5000,
            CROWD_PEAK: 2000,
            SUBOPTIMAL_TIME: 1000,
            LONG_WALK: 500,
            BACKTRACKING: 300,
            COST_PENALTY: 100,
            
            // MICRO PENALTIES (Fine-tuning)
            MINOR_DELAY: 50,
            SLIGHT_DETOUR: 20,
            PREFERENCE_MISMATCH: 10
        };
        
        // Build matrices
        this._initialize();
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════
    
    _initialize() {
        console.log('📊 [Deep Intelligence] Building constraint matrices...');
        
        // 1. Distance Matrix (with transport intelligence)
        this.distanceMatrix = this._buildDistanceMatrix();
        
        // 2. Time Matrix (multi-modal transport)
        this.timeMatrix = this._buildTimeMatrix();
        
        // 3. Compatibility Matrix (can these be sequential?)
        this.compatibilityMatrix = this._buildCompatibilityMatrix();
        
        // 4. Feasibility Scores (pre-calculated penalties)
        this.feasibilityScores = this._calculateFeasibilityScores();
        
        console.log('✅ [Deep Intelligence] Matrices built successfully');
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // DISTANCE MATRIX (Enhanced with Transport Logic)
    // ═══════════════════════════════════════════════════════════════════
    
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
                    source.lat, source.lng, dest.lat, dest.lng
                );
                
                // Transport zone detection (BIDIRECTIONAL)
                if (this._isTransportZone(source.id) || this._isTransportZone(dest.id)) {
                    matrix[i][j] = 0.1; // Taxi (minimal distance cost)
                }
                // Hotel routes always get taxi
                else if (this._isHotel(source.id) || this._isHotel(dest.id)) {
                    if (distance > 2.0) {
                        matrix[i][j] = 0.1; // Taxi
                    } else {
                        matrix[i][j] = distance; // Walkable from hotel
                    }
                }
                // Hard walk limit
                else if (distance > this.config.maxWalkDistance) {
                    matrix[i][j] = Infinity; // Impossible to walk
                }
                else {
                    matrix[i][j] = distance; // Normal walk
                }
            }
        }
        
        return matrix;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // TIME MATRIX (Multi-Modal Transport)
    // ═══════════════════════════════════════════════════════════════════
    
    _buildTimeMatrix() {
        const n = this.places.length;
        const matrix = Array(n).fill(null).map(() => Array(n).fill(0));
        
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) {
                    matrix[i][j] = 0;
                    continue;
                }
                
                const distance = this.distanceMatrix[i][j];
                const source = this.places[i];
                const dest = this.places[j];
                
                // Transport zone or hotel → Taxi
                if (this._isTransportZone(source.id) || 
                    this._isTransportZone(dest.id) ||
                    distance <= 0.1) {
                    matrix[i][j] = this.config.taxiTime;
                }
                // Blocked route
                else if (distance === Infinity) {
                    matrix[i][j] = Infinity;
                }
                // Walking
                else {
                    matrix[i][j] = (distance / this.config.walkingSpeed) * 60; // minutes
                }
            }
        }
        
        return matrix;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // COMPATIBILITY MATRIX (Can i follow j?)
    // ═══════════════════════════════════════════════════════════════════
    
    _buildCompatibilityMatrix() {
        const n = this.places.length;
        const matrix = Array(n).fill(null).map(() => Array(n).fill(true));
        
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) {
                    matrix[i][j] = false;
                    continue;
                }
                
                const source = this.places[i];
                const dest = this.places[j];
                
                // INCOMPATIBILITY RULES
                
                // 1. Lunch can't follow dinner
                if (this._isLunchVenue(source) && this._isDinnerVenue(dest)) {
                    matrix[i][j] = false;
                }
                
                // 2. Indoor can't directly follow outdoor in thermal danger hours
                // (needs rest break)
                if (this._isOutdoor(source) && this._isIndoor(dest)) {
                    // This is actually GOOD (thermal refuge), so compatible
                    matrix[i][j] = true;
                } else if (this._isOutdoor(source) && this._isOutdoor(dest)) {
                    // Two outdoor in a row during heat = dangerous
                    matrix[i][j] = 'conditional'; // Depends on time
                }
                
                // 3. High-energy activity can't follow another high-energy
                if (this._isHighEnergy(source) && this._isHighEnergy(dest)) {
                    matrix[i][j] = false;
                }
                
                // 4. Can't visit same category twice in a row (boring)
                if (source.category === dest.category && 
                    source.category !== 'Landmark') {
                    matrix[i][j] = false;
                }
            }
        }
        
        return matrix;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // FEASIBILITY SCORES (Pre-calculated time-based penalties)
    // ═══════════════════════════════════════════════════════════════════
    
    _calculateFeasibilityScores() {
        const n = this.places.length;
        const scores = Array(n).fill(null).map(() => ({}));
        
        for (let i = 0; i < n; i++) {
            const place = this.places[i];
            
            // Calculate score for each hour of the day
            for (let hour = 6; hour <= 22; hour += 0.5) {
                scores[i][hour] = this._calculateTimeFeasibility(place, hour);
            }
        }
        
        return scores;
    }
    
    _calculateTimeFeasibility(place, arrivalTime) {
        let score = 0; // Lower is better
        const hour = arrivalTime % 24;
        
        // ═══════════════════════════════════════════════════════════════
        // HARD CONSTRAINTS (IMPOSSIBLE)
        // ═══════════════════════════════════════════════════════════════
        
        // 1. CLOSED VENUE
        if (place.openingHours) {
            const { open, close } = place.openingHours;
            if (hour < open || hour > close) {
                return this.penalties.CLOSED_VENUE;
            }
        }
        
        // 2. LUNCH ONLY (after 14:30)
        if (this._isLunchOnly(place) && hour > 14.5) {
            return this.penalties.LUNCH_MISS;
        }
        
        // 3. DINNER ONLY (before 19:00)
        if (this._isDinnerOnly(place) && hour < 19.0) {
            return this.penalties.LUNCH_MISS; // Same severity
        }
        
        // 4. ADVENTURE ACTIVITIES (after sunset)
        if (place.category === 'Adventure' && hour > 18.0) {
            return this.penalties.POST_SUNSET;
        }
        
        // 5. OUTDOOR SITES (after sunset)
        if (this._isOutdoor(place) && hour > 19.0) {
            return this.penalties.POST_SUNSET;
        }
        
        // ═══════════════════════════════════════════════════════════════
        // SOFT CONSTRAINTS (DISCOURAGED)
        // ═══════════════════════════════════════════════════════════════
        
        // 6. THERMAL DANGER (12:00-16:00 for outdoor sites)
        const thermalZones = ['jemaa', 'badi', 'menara', 'square'];
        const isThermalZone = thermalZones.some(z => 
            place.id.toLowerCase().includes(z)
        );
        
        if (isThermalZone && 
            hour >= this.config.thermalDangerStart && 
            hour <= this.config.thermalDangerEnd) {
            score += this.penalties.THERMAL_DANGER * this.weights.comfortLevel / 10;
        }
        
        // 7. CROWD PENALTY (peak hours)
        if (place.crowdLevel === 'High') {
            if (hour >= 10.0 && hour <= 14.0) {
                score += this.penalties.CROWD_PEAK * this.weights.comfortLevel / 10;
            }
        }
        
        // 8. SUBOPTIMAL TIME (not the "best time")
        if (place.bestTime) {
            const bestHour = this._parseTime(place.bestTime);
            const deviation = Math.abs(hour - bestHour);
            
            if (deviation > 1.0) {
                score += this.penalties.SUBOPTIMAL_TIME * 
                         deviation * 
                         this.weights.experienceQuality / 10;
            }
        }
        
        // 9. MORNING PREFERENCE (some places best early)
        const morningPlaces = ['bahia', 'majorelle', 'saadian'];
        const isMorningPlace = morningPlaces.some(p => 
            place.id.toLowerCase().includes(p)
        );
        
        if (isMorningPlace && hour > 11.0) {
            score += this.penalties.SUBOPTIMAL_TIME * 
                     (hour - 11.0) * 
                     this.weights.experienceQuality / 10;
        }
        
        // 10. EVENING PREFERENCE (Jemaa, night markets)
        const eveningPlaces = ['jemaa', 'night_market'];
        const isEveningPlace = eveningPlaces.some(p => 
            place.id.toLowerCase().includes(p)
        );
        
        if (isEveningPlace && hour < 17.0) {
            score += this.penalties.SUBOPTIMAL_TIME * 
                     (17.0 - hour) * 
                     this.weights.experienceQuality / 10;
        }
        
        return score;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // MULTI-DIMENSIONAL COST FUNCTION
    // ═══════════════════════════════════════════════════════════════════
    
    calculateTotalCost(route, simulationMode = false) {
        let costs = {
            distance: 0,
            time: 0,
            timingPenalty: 0,
            distancePenalty: 0,
            comfortPenalty: 0,
            costPenalty: 0,
            culturalPenalty: 0,
            safetyPenalty: 0,
            experiencePenalty: 0,
            total: 0
        };
        
        let currentTime = this.config.startTime;
        let cumulativeWalkDistance = 0;
        let consecutiveWalks = 0;
        let fatigueAccumulator = 0;
        
        // Simulation state
        let dayEnded = false;
        
        for (let i = 0; i < route.length - 1; i++) {
            const from = route[i];
            const to = route[i + 1];
            const fromPlace = this.places[from];
            const toPlace = this.places[to];
            
            // ═══════════════════════════════════════════════════════════
            // 1. DISTANCE COST
            // ═══════════════════════════════════════════════════════════
            
            const distance = this.distanceMatrix[from][to];
            if (distance === Infinity) {
                return { ...costs, total: Infinity, reason: 'Impossible route segment' };
            }
            
            costs.distance += distance;
            
            // ═══════════════════════════════════════════════════════════
            // 2. TRAVEL TIME
            // ═══════════════════════════════════════════════════════════
            
            const travelTime = this.timeMatrix[from][to]; // minutes
            currentTime += travelTime / 60; // hours
            
            // Check if it's a walk or taxi
            const isWalk = distance > 0.1;
            
            if (isWalk) {
                cumulativeWalkDistance += distance;
                consecutiveWalks += 1;
                fatigueAccumulator += travelTime / 60;
                
                // DISTANCE PENALTY: Long walks
                if (distance > 2.0) {
                    costs.distancePenalty += this.penalties.LONG_WALK * 
                                            (distance - 2.0) * 
                                            this.weights.distanceEfficiency / 10;
                }
                
                // COMFORT PENALTY: Too many consecutive walks
                if (consecutiveWalks > this.config.maxConsecutiveWalks) {
                    costs.comfortPenalty += this.penalties.THERMAL_DANGER * 
                                           this.weights.comfortLevel / 10;
                }
                
                // COMFORT PENALTY: Fatigue threshold
                if (fatigueAccumulator > this.config.fatigueThreshold) {
                    costs.comfortPenalty += this.penalties.PHYSICAL_LIMIT * 
                                           this.weights.comfortLevel / 10;
                }
            } else {
                // Taxi - reset walk counters
                consecutiveWalks = 0;
                
                // COST PENALTY: Taxi fare
                costs.costPenalty += this.config.taxiCost * 
                                    this.weights.costOptimization / 10;
            }
            
            // ═══════════════════════════════════════════════════════════
            // 3. PRAYER TIME CHECK
            // ═══════════════════════════════════════════════════════════
            
            const prayerTimes = [13.0, 16.5, 19.0]; // Dhuhr, Asr, Maghrib
            
            for (const prayerTime of prayerTimes) {
                if (currentTime >= prayerTime && currentTime < prayerTime + 0.5) {
                    // Add prayer duration
                    currentTime += this.config.prayerDuration / 60;
                    
                    // CULTURAL PENALTY if we had to skip due to schedule
                    // (we'll detect this if arrival would conflict)
                }
            }
            
            // ═══════════════════════════════════════════════════════════
            // 4. ARRIVAL TIME FEASIBILITY
            // ═══════════════════════════════════════════════════════════
            
            const arrivalFeasibility = this._calculateTimeFeasibility(toPlace, currentTime);
            
            // Add to timing penalty (weighted)
            costs.timingPenalty += arrivalFeasibility * 
                                   this.weights.timingAccuracy / 10;
            
            // CRITICAL: If impossible, return immediately
            if (arrivalFeasibility >= this.penalties.CLOSED_VENUE) {
                return { 
                    ...costs, 
                    total: Infinity, 
                    reason: `${toPlace.id} impossible at ${currentTime.toFixed(2)}` 
                };
            }
            
            // ═══════════════════════════════════════════════════════════
            // 5. COMPATIBILITY CHECK
            // ═══════════════════════════════════════════════════════════
            
            const compatible = this.compatibilityMatrix[from][to];
            
            if (compatible === false) {
                costs.experiencePenalty += this.penalties.SUBOPTIMAL_TIME * 
                                          this.weights.experienceQuality / 10;
            } else if (compatible === 'conditional') {
                // Check thermal conditions
                if (currentTime >= this.config.thermalDangerStart && 
                    currentTime <= this.config.thermalDangerEnd) {
                    costs.comfortPenalty += this.penalties.THERMAL_DANGER * 
                                           this.weights.comfortLevel / 10;
                }
            }
            
            // ═══════════════════════════════════════════════════════════
            // 6. VISIT DURATION
            // ═══════════════════════════════════════════════════════════
            
            const visitDuration = toPlace.visitDuration || 60;
            currentTime += visitDuration / 60;
            
            // ═══════════════════════════════════════════════════════════
            // 7. LUNCH/BREAK INSERTION
            // ═══════════════════════════════════════════════════════════
            
            // If it's lunch time and not at a lunch venue, add break
            if (currentTime >= 12.5 && currentTime < 14.5 && !this._isLunchVenue(toPlace)) {
                // Check if we NEED lunch (haven't had it)
                const hadLunch = route.slice(0, i+1).some(idx => 
                    this._isLunchVenue(this.places[idx])
                );
                
                if (!hadLunch) {
                    // CULTURAL PENALTY: Missing lunch
                    costs.culturalPenalty += this.penalties.LUNCH_MISS * 0.5 * 
                                            this.weights.culturalRespect / 10;
                }
            }
            
            // ═══════════════════════════════════════════════════════════
            // 8. DAY END CHECK
            // ═══════════════════════════════════════════════════════════
            
            if (currentTime > this.config.endTime) {
                dayEnded = true;
                
                // TIMING PENALTY: Exceeded day limit
                const overtime = currentTime - this.config.endTime;
                costs.timingPenalty += this.penalties.POST_SUNSET * 
                                      overtime * 
                                      this.weights.timingAccuracy / 10;
            }
        }
        
        // ═══════════════════════════════════════════════════════════════
        // FINAL COST AGGREGATION
        // ═══════════════════════════════════════════════════════════════
        
        costs.total = costs.distance + 
                     costs.timingPenalty + 
                     costs.distancePenalty + 
                     costs.comfortPenalty + 
                     costs.costPenalty + 
                     costs.culturalPenalty + 
                     costs.safetyPenalty + 
                     costs.experiencePenalty;
        
        if (simulationMode) {
            costs.endTime = currentTime;
            costs.totalDuration = (currentTime - this.config.startTime) * 60;
            costs.totalWalkDistance = cumulativeWalkDistance;
            costs.dayEnded = dayEnded;
        }
        
        return costs;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // INTELLIGENT NEAREST NEIGHBOR (Conflict-Aware)
    // ═══════════════════════════════════════════════════════════════════
    
    intelligentNearestNeighbor() {
        console.log('🧠 [Intelligent NN] Starting conflict-aware routing...');
        
        const n = this.places.length;
        const visited = new Array(n).fill(false);
        const route = [];
        
        let current = 0; // Start at hotel
        visited[0] = true;
        route.push(current);
        
        let currentTime = this.config.startTime;
        let iterationLog = [];
        
        for (let iteration = 1; iteration < n; iteration++) {
            let candidates = [];
            
            // Evaluate ALL unvisited places
            for (let j = 0; j < n; j++) {
                if (visited[j]) continue;
                
                const distance = this.distanceMatrix[current][j];
                const travelTime = this.timeMatrix[current][j];
                
                if (distance === Infinity) continue;
                
                // Projected arrival time
                const arrivalTime = currentTime + (travelTime / 60);
                
                // Get feasibility score
                const feasibility = this._calculateTimeFeasibility(
                    this.places[j], 
                    arrivalTime
                );
                
                // Check compatibility
                const compatible = this.compatibilityMatrix[current][j];
                let compatibilityPenalty = 0;
                
                if (compatible === false) {
                    compatibilityPenalty = this.penalties.SUBOPTIMAL_TIME;
                } else if (compatible === 'conditional') {
                    if (arrivalTime >= this.config.thermalDangerStart && 
                        arrivalTime <= this.config.thermalDangerEnd) {
                        compatibilityPenalty = this.penalties.THERMAL_DANGER;
                    }
                }
                
                // MULTI-DIMENSIONAL SCORE
                const score = {
                    distance: distance * this.weights.distanceEfficiency,
                    timing: feasibility * this.weights.timingAccuracy / 10,
                    compatibility: compatibilityPenalty * this.weights.experienceQuality / 10,
                    total: 0
                };
                
                score.total = score.distance + score.timing + score.compatibility;
                
                candidates.push({
                    index: j,
                    score: score,
                    arrivalTime: arrivalTime,
                    feasibility: feasibility
                });
            }
            
            if (candidates.length === 0) {
                console.error(`❌ [NN] No candidates at iteration ${iteration}`);
                break;
            }
            
            // Sort by total score (lower is better)
            candidates.sort((a, b) => a.score.total - b.score.total);
            
            // Select best candidate
            const best = candidates[0];
            
            // Log decision
            iterationLog.push({
                iteration: iteration,
                selected: this.places[best.index].id,
                arrivalTime: best.arrivalTime.toFixed(2),
                score: best.score.total.toFixed(2),
                topCandidates: candidates.slice(0, 3).map(c => ({
                    id: this.places[c.index].id,
                    score: c.score.total.toFixed(2)
                }))
            });
            
            // Update state
            visited[best.index] = true;
            route.push(best.index);
            
            const travelTime = this.timeMatrix[current][best.index];
            const visitDuration = this.places[best.index].visitDuration || 60;
            currentTime += (travelTime / 60) + (visitDuration / 60);
            
            current = best.index;
            
            console.log(`  [${iteration}] → ${this.places[best.index].id} (score: ${best.score.total.toFixed(2)})`);
        }
        
        console.log('✅ [Intelligent NN] Route complete');
        
        // Return route + metadata
        return {
            route: route,
            log: iterationLog,
            endTime: currentTime
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // ADVANCED 2-OPT (Multi-Dimensional)
    // ═══════════════════════════════════════════════════════════════════
    
    advanced2Opt(initialRoute, maxIterations = 100) {
        console.log('🔧 [Advanced 2-Opt] Starting multi-dimensional optimization...');
        
        let route = [...initialRoute];
        let improved = true;
        let iterations = 0;
        let bestCost = this.calculateTotalCost(route);
        
        console.log(`  Initial cost: ${bestCost.total.toFixed(2)}`);
        
        while (improved && iterations < maxIterations) {
            improved = false;
            iterations++;
            
            for (let i = 1; i < route.length - 2; i++) {
                for (let j = i + 1; j < route.length - 1; j++) {
                    // Generate new route
                    const newRoute = [
                        ...route.slice(0, i),
                        ...route.slice(i, j + 1).reverse(),
                        ...route.slice(j + 1)
                    ];
                    
                    // Calculate new cost
                    const newCost = this.calculateTotalCost(newRoute);
                    
                    // Compare TOTAL multi-dimensional cost
                    if (newCost.total < bestCost.total) {
                        route = newRoute;
                        bestCost = newCost;
                        improved = true;
                        
                        console.log(`  ✓ Improvement: ${newCost.total.toFixed(2)} (iteration ${iterations})`);
                    }
                }
            }
        }
        
        console.log(`✅ [Advanced 2-Opt] Complete in ${iterations} iterations`);
        console.log(`  Final cost: ${bestCost.total.toFixed(2)}`);
        
        return route;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // MAIN OPTIMIZATION FUNCTION
    // ═══════════════════════════════════════════════════════════════════
    
    optimize() {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('🧠 DEEP INTELLIGENCE OPTIMIZATION START');
        console.log('═══════════════════════════════════════════════════════════');
        
        try {
            // Step 1: Intelligent Nearest Neighbor
            const nnResult = this.intelligentNearestNeighbor();
            const initialRoute = nnResult.route;
            
            console.log('\n📊 [Phase 1] Intelligent NN Results:');
            console.log(`  Route length: ${initialRoute.length}`);
            console.log(`  End time: ${nnResult.endTime.toFixed(2)}`);
            
            // Step 2: Advanced 2-Opt
            const optimizedRoute = this.advanced2Opt(initialRoute);
            
            // Step 3: Generate output with full analysis
            const output = this._generateDetailedOutput(optimizedRoute, nnResult.log);
            
            console.log('\n═══════════════════════════════════════════════════════════');
            console.log('✅ DEEP INTELLIGENCE OPTIMIZATION COMPLETE');
            console.log(`📊 Total Distance: ${output.totalDistance.toFixed(2)} km`);
            console.log(`⏱️  Total Duration: ${Math.floor(output.totalDuration / 60)}h ${Math.floor(output.totalDuration % 60)}m`);
            console.log(`💰 Total Cost: ${output.costs.total.toFixed(2)}`);
            console.log('═══════════════════════════════════════════════════════════\n');
            
            return output;
            
        } catch (error) {
            console.error('═══════════════════════════════════════════════════════════');
            console.error('❌ OPTIMIZATION FAILED');
            console.error('Error:', error.message);
            console.error('═══════════════════════════════════════════════════════════');
            throw error;
        }
    }
    
    _generateDetailedOutput(route, decisionLog) {
        const costs = this.calculateTotalCost(route, true);
        let currentTime = this.config.startTime;
        const stops = [];
        
        for (let i = 0; i < route.length; i++) {
            const placeIndex = route[i];
            const place = this.places[placeIndex];
            
            let travelInfo = null;
            
            if (i > 0) {
                const prevIndex = route[i - 1];
                const distance = this.distanceMatrix[prevIndex][placeIndex];
                const travelTime = this.timeMatrix[prevIndex][placeIndex];
                const mode = distance <= 0.1 ? 'taxi' : 'walk';
                
                currentTime += travelTime / 60;
                
                travelInfo = {
                    distance: distance,
                    duration: travelTime,
                    mode: mode,
                    cost: mode === 'taxi' ? this.config.taxiCost : 0
                };
            }
            
            // Feasibility at arrival
            const feasibility = this._calculateTimeFeasibility(place, currentTime);
            
            stops.push({
                place: place,
                arrivalTime: currentTime,
                travel: travelInfo,
                feasibilityScore: feasibility,
                warnings: this._generateWarnings(place, currentTime)
            });
            
            const visitDuration = place.visitDuration || 60;
            currentTime += visitDuration / 60;
        }
        
        return {
            route: route,
            stops: stops,
            totalDistance: costs.distance,
            totalDuration: costs.totalDuration,
            endTime: costs.endTime,
            costs: costs,
            decisionLog: decisionLog,
            conflicts: this._analyzeConflicts(stops),
            recommendations: this._generateRecommendations(stops, costs)
        };
    }
    
    _generateWarnings(place, arrivalTime) {
        const warnings = [];
        const hour = arrivalTime % 24;
        
        // Thermal warning
        if (this._isOutdoor(place) && 
            hour >= this.config.thermalDangerStart && 
            hour <= this.config.thermalDangerEnd) {
            warnings.push({
                type: 'thermal',
                severity: 'high',
                message: '🌡️ Thermal danger zone - bring water & shade'
            });
        }
        
        // Crowd warning
        if (place.crowdLevel === 'High' && hour >= 10 && hour <= 14) {
            warnings.push({
                type: 'crowd',
                severity: 'medium',
                message: '👥 Peak crowd expected - arrive early for photos'
            });
        }
        
        // Closing soon
        if (place.openingHours) {
            const { close } = place.openingHours;
            if (hour > close - 1.0 && hour < close) {
                warnings.push({
                    type: 'timing',
                    severity: 'high',
                    message: `⏰ Closes at ${close}:00 - limited time`
                });
            }
        }
        
        return warnings;
    }
    
    _analyzeConflicts(stops) {
        const conflicts = [];
        
        for (let i = 0; i < stops.length; i++) {
            const stop = stops[i];
            
            if (stop.feasibilityScore >= this.penalties.THERMAL_DANGER) {
                conflicts.push({
                    stop: stop.place.id,
                    type: 'feasibility',
                    severity: stop.feasibilityScore >= this.penalties.CLOSED_VENUE ? 'critical' : 'warning',
                    message: `Suboptimal timing at ${stop.arrivalTime.toFixed(2)}`
                });
            }
        }
        
        return conflicts;
    }
    
    _generateRecommendations(stops, costs) {
        const recommendations = [];
        
        // High cost recommendation
        if (costs.costPenalty > 500) {
            recommendations.push({
                type: 'cost',
                message: '💰 Consider walking more to reduce taxi costs',
                impact: 'Save ~' + (costs.costPenalty / 10).toFixed(0) + ' DH'
            });
        }
        
        // Thermal recommendations
        if (costs.comfortPenalty > 2000) {
            recommendations.push({
                type: 'comfort',
                message: '🌡️ Schedule includes thermal danger zones - bring extra water',
                impact: 'Health & safety'
            });
        }
        
        // Timing recommendations
        if (costs.timingPenalty > 1000) {
            recommendations.push({
                type: 'timing',
                message: '⏰ Some stops at suboptimal times - consider different start time',
                impact: 'Better experience'
            });
        }
        
        return recommendations;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // HELPER FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════
    
    _haversineDistance(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    _isTransportZone(id) {
        if (!id) return false;
        return id.toLowerCase().includes('quad') || 
               id.toLowerCase().includes('palmeraie') || 
               id.toLowerCase().includes('balloon');
    }
    
    _isHotel(id) {
        if (!id) return false;
        return id.toLowerCase().includes('hotel') || 
               id.toLowerCase().includes('riad');
    }
    
    _isLunchVenue(place) {
        return place.intel && place.intel.toLowerCase().includes('lunch');
    }
    
    _isLunchOnly(place) {
        return place.intel && place.intel.toLowerCase().includes('lunch only');
    }
    
    _isDinnerVenue(place) {
        return place.intel && place.intel.toLowerCase().includes('dinner');
    }
    
    _isDinnerOnly(place) {
        return place.intel && place.intel.toLowerCase().includes('dinner only');
    }
    
    _isOutdoor(place) {
        const outdoorCategories = ['Garden', 'Adventure', 'Landmark'];
        return outdoorCategories.includes(place.category) || 
               place.id.toLowerCase().includes('garden') ||
               place.id.toLowerCase().includes('square');
    }
    
    _isIndoor(place) {
        const indoorCategories = ['Museum', 'Palace', 'Shopping'];
        return indoorCategories.includes(place.category) || 
               place.id.toLowerCase().includes('palace') ||
               place.id.toLowerCase().includes('museum');
    }
    
    _isHighEnergy(place) {
        return place.category === 'Adventure' || 
               place.visitDuration > 120;
    }
    
    _parseTime(timeStr) {
        const match = timeStr.match(/(\d+):(\d+)/);
        if (match) {
            return parseFloat(match[1]) + parseFloat(match[2]) / 60;
        }
        return 9.0; // Default
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
    module.exports = IntelligentRoutePlanner;
}
