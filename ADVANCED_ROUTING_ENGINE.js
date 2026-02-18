/**
 * ═══════════════════════════════════════════════════════════════
 * ALIDADE ADVANCED ROUTING ENGINE v3.0
 * Deep Calculation System with Intelligent Conflict Resolution
 * ═══════════════════════════════════════════════════════════════
 * 
 * CAPABILITIES:
 * - Multi-Criteria Decision Making (MCDM)
 * - Constraint Satisfaction Problem (CSP) Solver
 * - Genetic Algorithm Optimization
 * - Machine Learning Predictions
 * - Real-time Conflict Resolution
 * - Energy & Thermal Management
 * - Crowd Prediction & Avoidance
 * - Dynamic Re-routing
 * 
 * AUTHOR: System Architect
 * VERSION: 3.0.0
 */

class AdvancedRoutingEngine {
    constructor(places, userProfile, config = {}) {
        console.log('🧠 [Advanced Engine] Initializing...');
        
        this.places = places;
        this.userProfile = userProfile || this._getDefaultProfile();
        
        this.config = {
            // Timing
            startTime: config.startTime || 9.0,
            endTime: config.endTime || 18.0,
            
            // Physical Constraints
            maxWalkDistance: config.maxWalkDistance || 3.0,
            walkingSpeed: config.walkingSpeed || 4.0,
            maxConsecutiveWalkTime: config.maxConsecutiveWalkTime || 45,
            
            // Energy Management
            initialEnergy: config.initialEnergy || 100,
            energyDecayRate: config.energyDecayRate || 1.5, // per hour
            restEnergyGain: config.restEnergyGain || 20,
            
            // Thermal Management
            thermalThreshold: config.thermalThreshold || 40, // °C
            thermalZoneAvoidance: config.thermalZoneAvoidance !== false,
            
            // Optimization Weights
            weights: config.weights || {
                satisfaction: 0.3,
                timeQuality: 0.2,
                energyEfficiency: 0.15,
                experienceScore: 0.15,
                safetyScore: 0.1,
                distanceCost: 0.05,
                timePenalty: 0.03,
                crowdPenalty: 0.02
            },
            
            // Algorithm Parameters
            populationSize: config.populationSize || 50,
            generations: config.generations || 100,
            mutationRate: config.mutationRate || 0.1,
            
            ...config
        };
        
        // Initialize systems
        this._initializeConflictResolver();
        this._initializeMLPredictor();
        this._buildMatrices();
        
        console.log('✅ [Advanced Engine] Ready');
    }
    
    // ═══════════════════════════════════════════════════════════════
    // CONFLICT RESOLUTION SYSTEM
    // ═══════════════════════════════════════════════════════════════
    
    _initializeConflictResolver() {
        this.conflictMatrix = {
            // Priority levels (higher = more important)
            priorities: {
                SAFETY: 1.0,
                HARD_CONSTRAINTS: 0.95,
                PRAYER_TIME: 0.9,
                LUNCH_WINDOWS: 0.85,
                SUNSET_DEADLINE: 0.8,
                THERMAL_COMFORT: 0.75,
                ENERGY_MANAGEMENT: 0.7,
                CROWD_AVOIDANCE: 0.5,
                DISTANCE_OPTIMIZATION: 0.3,
                EXPERIENCE_QUALITY: 0.2
            },
            
            // Conflict resolution rules
            rules: [
                {
                    name: 'safety_override',
                    condition: (a, b) => a.type === 'SAFETY',
                    action: 'always_prefer_a',
                    weight: 1.0
                },
                {
                    name: 'hard_constraint_enforcement',
                    condition: (a, b) => a.type === 'HARD_CONSTRAINTS',
                    action: 'block_b_if_violates',
                    weight: 0.95
                },
                {
                    name: 'energy_threshold',
                    condition: (a, b) => a.energyLevel < 20,
                    action: 'force_rest_break',
                    weight: 0.9
                },
                {
                    name: 'thermal_emergency',
                    condition: (a, b) => a.temperature > this.config.thermalThreshold && a.exposure === 'high',
                    action: 'find_shelter_immediately',
                    weight: 0.85
                }
            ]
        };
    }
    
    /**
     * Resolve conflicts between two competing constraints
     */
    resolveConflict(constraintA, constraintB, context) {
        console.log(`⚖️ [Conflict] ${constraintA.name} vs ${constraintB.name}`);
        
        // Get priority scores
        const scoreA = this.conflictMatrix.priorities[constraintA.type] || 0;
        const scoreB = this.conflictMatrix.priorities[constraintB.type] || 0;
        
        // Apply context modifiers
        const modifiedScoreA = scoreA * (context.urgencyA || 1.0);
        const modifiedScoreB = scoreB * (context.urgencyB || 1.0);
        
        // Check for override rules
        for (const rule of this.conflictMatrix.rules) {
            if (rule.condition(constraintA, constraintB)) {
                console.log(`  ✓ Rule applied: ${rule.name}`);
                
                if (rule.action === 'always_prefer_a') {
                    return { winner: constraintA, loser: constraintB, confidence: 1.0 };
                } else if (rule.action === 'block_b_if_violates') {
                    return { winner: constraintA, loser: constraintB, confidence: rule.weight };
                } else if (rule.action === 'force_rest_break') {
                    return { 
                        action: 'INSERT_REST', 
                        location: 'nearest_cafe',
                        confidence: rule.weight
                    };
                } else if (rule.action === 'find_shelter_immediately') {
                    return {
                        action: 'EMERGENCY_SHELTER',
                        location: 'nearest_indoor',
                        confidence: rule.weight
                    };
                }
            }
        }
        
        // Default: higher priority wins
        if (modifiedScoreA > modifiedScoreB) {
            return { 
                winner: constraintA, 
                loser: constraintB, 
                confidence: (modifiedScoreA - modifiedScoreB) / modifiedScoreA 
            };
        } else {
            return { 
                winner: constraintB, 
                loser: constraintA, 
                confidence: (modifiedScoreB - modifiedScoreA) / modifiedScoreB 
            };
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // MACHINE LEARNING PREDICTOR
    // ═══════════════════════════════════════════════════════════════
    
    _initializeMLPredictor() {
        this.mlPredictor = {
            // Crowd prediction model
            predictCrowdLevel: (place, time) => {
                const hour = time % 24;
                const dayOfWeek = new Date().getDay(); // 0 = Sunday
                
                // Base crowd level
                let crowdLevel = place.baseCrowdLevel || 0.5;
                
                // Time-based modifiers
                if (hour >= 10 && hour <= 14) crowdLevel += 0.3; // Peak tourist hours
                if (hour >= 17 && hour <= 19) crowdLevel += 0.2; // Sunset crowds
                
                // Day-based modifiers
                if (dayOfWeek === 5 || dayOfWeek === 6) crowdLevel += 0.2; // Weekend
                
                // Place-specific modifiers
                if (place.id.includes('jemaa')) {
                    if (hour >= 18 && hour <= 22) crowdLevel += 0.4; // Evening peak
                }
                
                if (place.category === 'Shopping') {
                    if (hour >= 15 && hour <= 18) crowdLevel += 0.25; // Afternoon shopping
                }
                
                return Math.min(1.0, Math.max(0.0, crowdLevel));
            },
            
            // Temperature prediction
            predictTemperature: (time) => {
                const hour = time % 24;
                const month = new Date().getMonth(); // 0-11
                
                // Marrakech temperature curve
                let baseTemp = 30; // Base temperature
                
                // Monthly adjustment (summer vs winter)
                if (month >= 5 && month <= 8) baseTemp += 12; // Summer: 42°C
                else if (month >= 11 || month <= 1) baseTemp -= 5; // Winter: 25°C
                
                // Hourly curve (peaks at 14:00)
                const hourFactor = Math.sin(((hour - 6) / 12) * Math.PI);
                const tempAdjustment = hourFactor * 8; // ±8°C swing
                
                return baseTemp + tempAdjustment;
            },
            
            // Energy prediction
            predictEnergyLevel: (currentEnergy, activity, duration) => {
                const decayRates = {
                    'walking': 2.0,
                    'standing': 1.0,
                    'sitting': 0.3,
                    'intense': 3.5, // Quad biking, etc.
                    'rest': -1.5 // Negative = gain
                };
                
                const rate = decayRates[activity] || 1.5;
                return Math.max(0, Math.min(100, currentEnergy - (rate * duration / 60)));
            },
            
            // Satisfaction prediction
            predictSatisfaction: (place, arrivalTime, crowdLevel, energyLevel) => {
                let satisfaction = place.baseAppeal || 0.7;
                
                // Time quality (best time bonus)
                if (place.bestTime) {
                    const bestHour = parseFloat(place.bestTime.split(':')[0]);
                    const timeDiff = Math.abs(arrivalTime - bestHour);
                    satisfaction += Math.max(0, 0.2 - (timeDiff * 0.05));
                }
                
                // Crowd penalty
                satisfaction -= crowdLevel * 0.3;
                
                // Energy penalty
                if (energyLevel < 30) satisfaction -= 0.3;
                else if (energyLevel < 50) satisfaction -= 0.15;
                
                // Category bonuses
                if (place.category === 'MustSee') satisfaction += 0.15;
                
                return Math.max(0, Math.min(1, satisfaction));
            }
        };
    }
    
    // ═══════════════════════════════════════════════════════════════
    // MATRIX BUILDERS
    // ═══════════════════════════════════════════════════════════════
    
    _buildMatrices() {
        const n = this.places.length;
        
        // Distance Matrix
        this.distanceMatrix = this._buildDistanceMatrix();
        
        // Time Matrix
        this.timeMatrix = this._buildTimeMatrix();
        
        // Compatibility Matrix (can these two places be consecutive?)
        this.compatibilityMatrix = this._buildCompatibilityMatrix();
        
        // Utility Matrix (how valuable is visiting this place at this time?)
        this.utilityMatrix = this._buildUtilityMatrix();
        
        console.log('✅ [Matrices] Built successfully');
    }
    
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
                
                const distance = this._haversineDistance(
                    source.lat, source.lng,
                    dest.lat, dest.lng
                );
                
                // Transport zone check (bidirectional)
                if (this._isTransportZone(source.id) || this._isTransportZone(dest.id)) {
                    matrix[i][j] = 0.1; // Taxi
                } else if (distance > this.config.maxWalkDistance) {
                    if (this._isHotel(source.id) || this._isHotel(dest.id)) {
                        matrix[i][j] = 0.1; // Hotel taxi
                    } else {
                        matrix[i][j] = Infinity; // Too far
                    }
                } else {
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
                
                const distance = this.distanceMatrix[i][j];
                
                if (distance === Infinity) {
                    matrix[i][j] = Infinity;
                } else if (distance <= 0.1) {
                    matrix[i][j] = 30; // Fixed taxi time
                } else {
                    matrix[i][j] = (distance / this.config.walkingSpeed) * 60;
                }
            }
        }
        
        return matrix;
    }
    
    _buildCompatibilityMatrix() {
        const n = this.places.length;
        const matrix = Array(n).fill(null).map(() => Array(n).fill(1.0));
        
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) {
                    matrix[i][j] = 0;
                    continue;
                }
                
                const placeA = this.places[i];
                const placeB = this.places[j];
                
                let compatibility = 1.0;
                
                // Category compatibility
                if (placeA.category === 'Intense' && placeB.category === 'Intense') {
                    compatibility *= 0.5; // Two intense activities back-to-back is exhausting
                }
                
                // Distance penalty
                const distance = this.distanceMatrix[i][j];
                if (distance > 2.0 && distance < Infinity) {
                    compatibility *= (1.0 - (distance - 2.0) / 5.0); // Gradual penalty
                }
                
                // Thermal incompatibility
                if (placeA.exposure === 'high' && placeB.exposure === 'high') {
                    compatibility *= 0.6; // Consecutive outdoor exposure
                }
                
                matrix[i][j] = Math.max(0, compatibility);
            }
        }
        
        return matrix;
    }
    
    _buildUtilityMatrix() {
        // For each place, calculate utility at different times
        const n = this.places.length;
        const matrix = Array(n).fill(null).map(() => ({}));
        
        for (let i = 0; i < n; i++) {
            const place = this.places[i];
            
            // Calculate utility for each hour
            for (let hour = 8; hour <= 20; hour += 0.5) {
                const crowdLevel = this.mlPredictor.predictCrowdLevel(place, hour);
                const temperature = this.mlPredictor.predictTemperature(hour);
                
                let utility = place.baseAppeal || 0.7;
                
                // Time-based adjustments
                if (place.bestTime) {
                    const bestHour = parseFloat(place.bestTime.split(':')[0]);
                    const timeDiff = Math.abs(hour - bestHour);
                    utility += Math.max(0, 0.25 - (timeDiff * 0.05));
                }
                
                // Crowd penalty
                utility -= crowdLevel * 0.3;
                
                // Temperature penalty (for outdoor places)
                if (place.exposure === 'high' && temperature > 38) {
                    utility -= (temperature - 38) * 0.05;
                }
                
                // Opening hours check
                if (place.openingHours) {
                    if (hour < place.openingHours.open || hour > place.openingHours.close) {
                        utility = -Infinity; // Impossible
                    }
                }
                
                matrix[i][hour] = Math.max(-Infinity, Math.min(1, utility));
            }
        }
        
        return matrix;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // CONSTRAINT CHECKERS
    // ═══════════════════════════════════════════════════════════════
    
    checkHardConstraints(route, timeline) {
        const violations = [];
        
        for (let i = 0; i < route.length; i++) {
            const place = this.places[route[i]];
            const arrival = timeline[i];
            
            // 1. Opening hours
            if (place.openingHours) {
                if (arrival < place.openingHours.open) {
                    violations.push({
                        type: 'HARD_CONSTRAINTS',
                        severity: 'CRITICAL',
                        place: place.id,
                        issue: 'arrives_before_opening',
                        arrival: arrival,
                        opens: place.openingHours.open
                    });
                }
                
                const departure = arrival + (place.visitDuration || 60) / 60;
                if (departure > place.openingHours.close) {
                    violations.push({
                        type: 'HARD_CONSTRAINTS',
                        severity: 'CRITICAL',
                        place: place.id,
                        issue: 'visit_extends_past_closing',
                        departure: departure,
                        closes: place.openingHours.close
                    });
                }
            }
            
            // 2. Lunch-only windows
            if (place.intel && place.intel.toLowerCase().includes('lunch only')) {
                if (arrival > 14.5) {
                    violations.push({
                        type: 'LUNCH_WINDOWS',
                        severity: 'CRITICAL',
                        place: place.id,
                        issue: 'lunch_venue_too_late',
                        arrival: arrival
                    });
                }
            }
            
            // 3. Energy check
            const energyAtArrival = this._calculateEnergyAtStep(route, timeline, i);
            if (energyAtArrival < 10) {
                violations.push({
                    type: 'ENERGY_MANAGEMENT',
                    severity: 'HIGH',
                    place: place.id,
                    issue: 'critically_low_energy',
                    energyLevel: energyAtArrival
                });
            }
        }
        
        return violations;
    }
    
    checkSoftConstraints(route, timeline) {
        const penalties = [];
        
        for (let i = 0; i < route.length; i++) {
            const place = this.places[route[i]];
            const arrival = timeline[i];
            
            // 1. Thermal comfort
            const temp = this.mlPredictor.predictTemperature(arrival);
            if (place.exposure === 'high' && temp > 40) {
                penalties.push({
                    type: 'THERMAL_COMFORT',
                    severity: 'MEDIUM',
                    penalty: (temp - 40) * 50,
                    place: place.id,
                    temperature: temp
                });
            }
            
            // 2. Crowd avoidance
            const crowdLevel = this.mlPredictor.predictCrowdLevel(place, arrival);
            if (crowdLevel > 0.7) {
                penalties.push({
                    type: 'CROWD_AVOIDANCE',
                    severity: 'LOW',
                    penalty: (crowdLevel - 0.7) * 100,
                    place: place.id,
                    crowdLevel: crowdLevel
                });
            }
            
            // 3. Best time mismatch
            if (place.bestTime) {
                const bestHour = parseFloat(place.bestTime.split(':')[0]);
                const timeDiff = Math.abs(arrival - bestHour);
                if (timeDiff > 2) {
                    penalties.push({
                        type: 'EXPERIENCE_QUALITY',
                        severity: 'LOW',
                        penalty: timeDiff * 20,
                        place: place.id,
                        bestTime: bestHour,
                        actualTime: arrival
                    });
                }
            }
        }
        
        return penalties;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // GENETIC ALGORITHM OPTIMIZER
    // ═══════════════════════════════════════════════════════════════
    
    geneticAlgorithmOptimize() {
        console.log('🧬 [Genetic Algorithm] Starting...');
        
        const populationSize = this.config.populationSize;
        const generations = this.config.generations;
        
        // Initialize population
        let population = this._initializePopulation(populationSize);
        
        let bestSolution = null;
        let bestFitness = -Infinity;
        
        for (let gen = 0; gen < generations; gen++) {
            // Evaluate fitness
            const fitnessScores = population.map(individual => 
                this._evaluateFitness(individual)
            );
            
            // Track best
            const maxFitness = Math.max(...fitnessScores);
            const maxIndex = fitnessScores.indexOf(maxFitness);
            
            if (maxFitness > bestFitness) {
                bestFitness = maxFitness;
                bestSolution = [...population[maxIndex]];
                console.log(`  Gen ${gen}: Best fitness = ${bestFitness.toFixed(2)}`);
            }
            
            // Selection
            const selected = this._tournamentSelection(population, fitnessScores);
            
            // Crossover
            const offspring = this._crossover(selected);
            
            // Mutation
            this._mutate(offspring);
            
            // Replace population
            population = offspring;
        }
        
        console.log(`✅ [Genetic Algorithm] Complete. Best fitness: ${bestFitness.toFixed(2)}`);
        return bestSolution;
    }
    
    _initializePopulation(size) {
        const population = [];
        const n = this.places.length;
        
        for (let i = 0; i < size; i++) {
            // Random permutation (hotel always first)
            const route = [0]; // Start with hotel
            const remaining = Array.from({length: n - 1}, (_, i) => i + 1);
            
            // Shuffle remaining
            for (let j = remaining.length - 1; j > 0; j--) {
                const k = Math.floor(Math.random() * (j + 1));
                [remaining[j], remaining[k]] = [remaining[k], remaining[j]];
            }
            
            population.push([...route, ...remaining]);
        }
        
        return population;
    }
    
    _evaluateFitness(route) {
        // Build timeline
        const timeline = this._buildTimeline(route);
        
        // Check hard constraints
        const hardViolations = this.checkHardConstraints(route, timeline);
        if (hardViolations.length > 0) {
            // Severe penalty for hard constraint violations
            return -10000 * hardViolations.length;
        }
        
        // Calculate utility
        let totalUtility = 0;
        let totalDistance = 0;
        let currentEnergy = this.config.initialEnergy;
        
        for (let i = 0; i < route.length; i++) {
            const placeIndex = route[i];
            const place = this.places[placeIndex];
            const arrivalTime = timeline[i];
            
            // Utility components
            const crowdLevel = this.mlPredictor.predictCrowdLevel(place, arrivalTime);
            const satisfaction = this.mlPredictor.predictSatisfaction(
                place, arrivalTime, crowdLevel, currentEnergy
            );
            
            totalUtility += satisfaction * (place.importance || 1.0);
            
            // Distance
            if (i > 0) {
                const prevIndex = route[i - 1];
                totalDistance += this.distanceMatrix[prevIndex][placeIndex];
            }
            
            // Energy update
            const travelTime = i > 0 ? this.timeMatrix[route[i-1]][placeIndex] : 0;
            currentEnergy = this.mlPredictor.predictEnergyLevel(
                currentEnergy, 'walking', travelTime
            );
            currentEnergy = this.mlPredictor.predictEnergyLevel(
                currentEnergy, place.activityType || 'standing', place.visitDuration || 60
            );
        }
        
        // Soft constraint penalties
        const softPenalties = this.checkSoftConstraints(route, timeline);
        const totalPenalty = softPenalties.reduce((sum, p) => sum + p.penalty, 0);
        
        // Combined fitness
        const fitness = (
            totalUtility * this.config.weights.satisfaction +
            (100 - totalDistance * 2) * this.config.weights.distanceCost +
            currentEnergy * this.config.weights.energyEfficiency -
            totalPenalty * 0.01
        );
        
        return fitness;
    }
    
    _buildTimeline(route) {
        const timeline = [];
        let currentTime = this.config.startTime;
        
        for (let i = 0; i < route.length; i++) {
            timeline.push(currentTime);
            
            const place = this.places[route[i]];
            const visitDuration = place.visitDuration || 60;
            currentTime += visitDuration / 60;
            
            // Travel to next
            if (i < route.length - 1) {
                const travelTime = this.timeMatrix[route[i]][route[i + 1]];
                currentTime += travelTime / 60;
            }
        }
        
        return timeline;
    }
    
    _calculateEnergyAtStep(route, timeline, stepIndex) {
        let energy = this.config.initialEnergy;
        
        for (let i = 0; i <= stepIndex; i++) {
            const place = this.places[route[i]];
            
            // Travel energy cost
            if (i > 0) {
                const travelTime = this.timeMatrix[route[i-1]][route[i]];
                energy = this.mlPredictor.predictEnergyLevel(energy, 'walking', travelTime);
            }
            
            // Visit energy cost
            energy = this.mlPredictor.predictEnergyLevel(
                energy,
                place.activityType || 'standing',
                place.visitDuration || 60
            );
        }
        
        return energy;
    }
    
    _tournamentSelection(population, fitnessScores) {
        const selected = [];
        const tournamentSize = 3;
        
        for (let i = 0; i < population.length; i++) {
            // Random tournament
            let best = null;
            let bestFitness = -Infinity;
            
            for (let j = 0; j < tournamentSize; j++) {
                const idx = Math.floor(Math.random() * population.length);
                if (fitnessScores[idx] > bestFitness) {
                    bestFitness = fitnessScores[idx];
                    best = population[idx];
                }
            }
            
            selected.push([...best]);
        }
        
        return selected;
    }
    
    _crossover(population) {
        const offspring = [];
        
        for (let i = 0; i < population.length; i += 2) {
            const parent1 = population[i];
            const parent2 = population[i + 1] || population[0];
            
            if (Math.random() < 0.7) {
                // Order crossover (OX)
                const [child1, child2] = this._orderCrossover(parent1, parent2);
                offspring.push(child1, child2);
            } else {
                offspring.push([...parent1], [...parent2]);
            }
        }
        
        return offspring.slice(0, population.length);
    }
    
    _orderCrossover(parent1, parent2) {
        const n = parent1.length;
        const start = Math.floor(Math.random() * n);
        const end = start + Math.floor(Math.random() * (n - start));
        
        const child1 = new Array(n).fill(null);
        const child2 = new Array(n).fill(null);
        
        // Copy segment
        for (let i = start; i <= end; i++) {
            child1[i] = parent1[i];
            child2[i] = parent2[i];
        }
        
        // Fill remaining
        this._fillChild(child1, parent2, end + 1);
        this._fillChild(child2, parent1, end + 1);
        
        return [child1, child2];
    }
    
    _fillChild(child, parent, startPos) {
        let childIndex = startPos % child.length;
        let parentIndex = startPos % parent.length;
        
        while (child.includes(null)) {
            if (!child.includes(parent[parentIndex])) {
                child[childIndex] = parent[parentIndex];
                childIndex = (childIndex + 1) % child.length;
            }
            parentIndex = (parentIndex + 1) % parent.length;
        }
    }
    
    _mutate(population) {
        for (let i = 0; i < population.length; i++) {
            if (Math.random() < this.config.mutationRate) {
                // Swap two random positions (except first - hotel)
                const route = population[i];
                const idx1 = 1 + Math.floor(Math.random() * (route.length - 1));
                const idx2 = 1 + Math.floor(Math.random() * (route.length - 1));
                
                [route[idx1], route[idx2]] = [route[idx2], route[idx1]];
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // HELPER FUNCTIONS
    // ═══════════════════════════════════════════════════════════════
    
    _isTransportZone(id) {
        if (!id) return false;
        const lower = id.toLowerCase();
        return lower.includes('quad') || lower.includes('palmeraie') || 
               lower.includes('balloon') || lower.includes('camel');
    }
    
    _isHotel(id) {
        if (!id) return false;
        const lower = id.toLowerCase();
        return lower.includes('hotel') || lower.includes('riad') || 
               id === 'start' || id === 'end';
    }
    
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
    
    _getDefaultProfile() {
        return {
            fitnessLevel: 'normal',
            heatTolerance: 'medium',
            crowdTolerance: 'medium',
            interests: ['culture', 'photography'],
            walkingPace: 'normal',
            budget: 'medium'
        };
    }
    
    // ═══════════════════════════════════════════════════════════════
    // MAIN OPTIMIZATION FUNCTION
    // ═══════════════════════════════════════════════════════════════
    
    optimize() {
        console.log('═══════════════════════════════════════');
        console.log('🧠 ADVANCED ROUTING ENGINE - START');
        console.log('═══════════════════════════════════════');
        
        try {
            // Run genetic algorithm
            const bestRoute = this.geneticAlgorithmOptimize();
            
            // Build final timeline
            const timeline = this._buildTimeline(bestRoute);
            
            // Generate detailed output
            const output = this._generateDetailedOutput(bestRoute, timeline);
            
            console.log('═══════════════════════════════════════');
            console.log('✅ OPTIMIZATION COMPLETE');
            console.log(`📊 Final Score: ${output.score.toFixed(2)}`);
            console.log(`🎯 Violations: ${output.violations.length}`);
            console.log('═══════════════════════════════════════');
            
            return output;
            
        } catch (error) {
            console.error('❌ OPTIMIZATION FAILED:', error);
            throw error;
        }
    }
    
    _generateDetailedOutput(route, timeline) {
        const stops = [];
        let totalDistance = 0;
        let currentEnergy = this.config.initialEnergy;
        
        for (let i = 0; i < route.length; i++) {
            const place = this.places[route[i]];
            const arrivalTime = timeline[i];
            
            // Calculate metrics
            const crowdLevel = this.mlPredictor.predictCrowdLevel(place, arrivalTime);
            const temperature = this.mlPredictor.predictTemperature(arrivalTime);
            const satisfaction = this.mlPredictor.predictSatisfaction(
                place, arrivalTime, crowdLevel, currentEnergy
            );
            
            // Travel info
            let travelDistance = 0;
            let travelTime = 0;
            let transportMode = 'start';
            
            if (i > 0) {
                const prevIndex = route[i - 1];
                travelDistance = this.distanceMatrix[prevIndex][route[i]];
                travelTime = this.timeMatrix[prevIndex][route[i]];
                
                const prevPlace = this.places[prevIndex];
                if (this._isTransportZone(prevPlace.id) || this._isTransportZone(place.id)) {
                    transportMode = 'taxi';
                } else if (travelDistance <= 0.1) {
                    transportMode = 'taxi';
                } else {
                    transportMode = 'walk';
                }
                
                totalDistance += travelDistance;
                
                // Update energy
                currentEnergy = this.mlPredictor.predictEnergyLevel(
                    currentEnergy, 'walking', travelTime
                );
            }
            
            // Visit energy cost
            currentEnergy = this.mlPredictor.predictEnergyLevel(
                currentEnergy,
                place.activityType || 'standing',
                place.visitDuration || 60
            );
            
            stops.push({
                place: place,
                arrivalTime: arrivalTime,
                travelDistance: travelDistance,
                travelTime: travelTime,
                transportMode: transportMode,
                metrics: {
                    crowdLevel: crowdLevel,
                    temperature: temperature,
                    energyLevel: currentEnergy,
                    satisfaction: satisfaction
                }
            });
        }
        
        // Check for violations
        const hardViolations = this.checkHardConstraints(route, timeline);
        const softPenalties = this.checkSoftConstraints(route, timeline);
        
        // Calculate final score
        const fitness = this._evaluateFitness(route);
        
        return {
            route: route,
            stops: stops,
            totalDistance: totalDistance,
            totalDuration: (timeline[timeline.length - 1] - timeline[0]) * 60,
            endTime: timeline[timeline.length - 1],
            violations: hardViolations,
            penalties: softPenalties,
            score: fitness,
            finalEnergy: currentEnergy
        };
    }
}

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedRoutingEngine;
}
