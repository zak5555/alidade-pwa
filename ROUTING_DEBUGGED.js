/**
 * ═══════════════════════════════════════════════════════════════
 * ALIDADE ROUTING ALGORITHM - DEBUG VERSION
 * ═══════════════════════════════════════════════════════════════
 * 
 * هذه النسخة تحتوي على:
 * - Error handling شامل
 * - Console logs للتتبع
 * - Validation checks
 * - تصحيح للأخطاء المحتملة
 */

class RoutePlanner {
    constructor(places, config = {}) {
        console.log('🚀 [RoutePlanner] Initializing...');
        console.log('📍 Places count:', places?.length || 0);
        
        // Validate input
        if (!places || places.length === 0) {
            throw new Error('❌ No places provided!');
        }
        
        this.places = places;
        this.config = {
            startTime: config.startTime || 9.0,
            maxWalkDistance: config.maxWalkDistance || 3.0,
            taxiTime: config.taxiTime || 30,
            walkingSpeed: config.walkingSpeed || 4.0,
            timePenaltyWeight: config.timePenaltyWeight || 2.0,
            ...config
        };
        
        console.log('⚙️ [RoutePlanner] Config:', this.config);
        
        try {
            console.log('📊 [RoutePlanner] Building distance matrix...');
            this.distanceMatrix = this._buildDistanceMatrix();
            console.log('✅ [RoutePlanner] Distance matrix built');
            
            console.log('⏱️ [RoutePlanner] Building time matrix...');
            this.timeMatrix = this._buildTimeMatrix();
            console.log('✅ [RoutePlanner] Time matrix built');
        } catch (error) {
            console.error('❌ [RoutePlanner] Initialization failed:', error);
            throw error;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // DISTANCE MATRIX BUILDER (مع تصحيح الأخطاء)
    // ═══════════════════════════════════════════════════════════════
    
    _buildDistanceMatrix() {
        const n = this.places.length;
        const matrix = Array(n).fill(null).map(() => Array(n).fill(0));
        
        console.log(`📐 Building ${n}x${n} distance matrix...`);
        
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) {
                    matrix[i][j] = 0;
                    continue;
                }
                
                try {
                    const source = this.places[i];
                    const dest = this.places[j];
                    
                    // Validate coordinates
                    if (!source.lat || !source.lng || !dest.lat || !dest.lng) {
                        console.warn(`⚠️ Missing coordinates: ${source.id} → ${dest.id}`);
                        matrix[i][j] = Infinity;
                        continue;
                    }
                    
                    // ✅ FIX: تعريف distance هنا (قبل الاستخدام!)
                    const distance = this._haversineDistance(
                        source.lat, source.lng,
                        dest.lat, dest.lng
                    );
                    
                    // Debug log (فقط للـ iterations الأولى)
                    if (i < 2 && j < 2) {
                        console.log(`  [${i},${j}] ${source.id} → ${dest.id}: ${distance.toFixed(2)} km`);
                    }
                    
                    // Check for transport zones (BOTH directions)
                    if (this._isTransportZone(source.id) || this._isTransportZone(dest.id)) {
                        matrix[i][j] = 0.1; // Taxi route
                        if (i < 2 && j < 2) {
                            console.log(`    🚖 Transport zone detected`);
                        }
                    }
                    // Check walk distance limit
                    else if (distance > this.config.maxWalkDistance) {
                        const isHotelRoute = this._isHotel(source.id) || this._isHotel(dest.id);
                        
                        if (!isHotelRoute) {
                            // Too far to walk, no hotel
                            matrix[i][j] = Infinity;
                            if (i < 2 && j < 2) {
                                console.log(`    ⚠️ Too far (> ${this.config.maxWalkDistance} km)`);
                            }
                        } else {
                            // Hotel route gets taxi
                            matrix[i][j] = 0.1;
                            if (i < 2 && j < 2) {
                                console.log(`    🚖 Hotel route → taxi`);
                            }
                        }
                    }
                    else {
                        // Normal walking distance
                        matrix[i][j] = distance;
                    }
                    
                } catch (error) {
                    console.error(`❌ Error at [${i},${j}]:`, error);
                    matrix[i][j] = Infinity;
                }
            }
        }
        
        console.log('✅ Distance matrix complete');
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
                
                try {
                    const source = this.places[i];
                    const dest = this.places[j];
                    const distance = this.distanceMatrix[i][j];
                    
                    // Transport zone check
                    if (this._isTransportZone(source.id) || this._isTransportZone(dest.id)) {
                        matrix[i][j] = this.config.taxiTime;
                    }
                    else if (distance === Infinity) {
                        matrix[i][j] = Infinity;
                    }
                    else if (distance <= 0.1) {
                        matrix[i][j] = this.config.taxiTime;
                    }
                    else {
                        // Walking time: distance / speed * 60 (to get minutes)
                        matrix[i][j] = (distance / this.config.walkingSpeed) * 60;
                    }
                } catch (error) {
                    console.error(`❌ Time matrix error at [${i},${j}]:`, error);
                    matrix[i][j] = Infinity;
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
        return lowerID.includes('quad') || 
               lowerID.includes('palmeraie') || 
               lowerID.includes('balloon') ||
               lowerID.includes('camel');
    }
    
    _isHotel(id) {
        if (!id) return false;
        const lowerID = id.toLowerCase();
        return lowerID.includes('hotel') || 
               lowerID.includes('riad') || 
               id === 'start' || 
               id === 'end';
    }
    
    _haversineDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // TIME PENALTY CALCULATION
    // ═══════════════════════════════════════════════════════════════
    
    calculateTimePenalty(place, arrivalTime) {
        if (!place) return 0;
        
        let penalty = 0;
        const arrivalHour = arrivalTime % 24;
        
        try {
            // NUCLEAR PENALTY 1: Lunch only after 14:00
            if (place.intel && typeof place.intel === 'string') {
                if (place.intel.toLowerCase().includes('lunch only') && arrivalHour > 14.0) {
                    return 100000;
                }
            }
            
            // NUCLEAR PENALTY 2: Closed venues
            if (place.openingHours) {
                const { open, close } = place.openingHours;
                if (arrivalHour < open || arrivalHour > close) {
                    return 100000;
                }
            }
            
            // THERMAL TRAP: 12:00-16:00
            const thermalZones = ['jemaa', 'badi', 'menara', 'square'];
            const isThermalZone = thermalZones.some(zone => 
                place.id && place.id.toLowerCase().includes(zone)
            );
            
            if (isThermalZone && arrivalHour >= 12.0 && arrivalHour <= 16.0) {
                penalty += 500;
            }
            
            // MORNING ANCHOR
            if (place.bestTime && place.bestTime.includes('09:00')) {
                if (arrivalHour > 10.0) {
                    penalty += 200;
                }
            }
            
            // ACTIVITY TIMING
            if (place.category === 'Adventure' && arrivalHour > 18.0) {
                return 10000;
            }
            
            // CROWD PENALTY
            if (place.crowdLevel === 'High' && arrivalHour >= 10.0 && arrivalHour <= 14.0) {
                penalty += 100;
            }
            
        } catch (error) {
            console.error('❌ Penalty calculation error:', error);
        }
        
        return penalty;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // NEAREST NEIGHBOR ALGORITHM
    // ═══════════════════════════════════════════════════════════════
    
    nearestNeighbor() {
        console.log('🧭 [Nearest Neighbor] Starting...');
        
        const n = this.places.length;
        const visited = new Array(n).fill(false);
        const route = [];
        
        let current = 0; // Start at hotel
        visited[0] = true;
        route.push(current);
        
        let currentTime = this.config.startTime;
        console.log(`📍 Starting at: ${this.places[0].id} (${currentTime}:00)`);
        
        for (let iteration = 1; iteration < n; iteration++) {
            let bestNext = -1;
            let bestCost = Infinity;
            
            for (let j = 0; j < n; j++) {
                if (visited[j]) continue;
                
                try {
                    // ✅ FIX: تعريف distance محلياً في الـ loop
                    const distance = this.distanceMatrix[current][j];
                    const travelTime = this.timeMatrix[current][j];
                    
                    if (distance === Infinity) continue;
                    
                    const arrivalTime = currentTime + (travelTime / 60);
                    const timePenalty = this.calculateTimePenalty(this.places[j], arrivalTime);
                    const totalCost = distance + (timePenalty * this.config.timePenaltyWeight);
                    
                    if (totalCost < bestCost) {
                        bestCost = totalCost;
                        bestNext = j;
                    }
                } catch (error) {
                    console.error(`❌ NN error at iteration ${iteration}, checking ${j}:`, error);
                }
            }
            
            if (bestNext === -1) {
                console.error(`❌ [NN] No valid next stop at iteration ${iteration}!`);
                console.log('Current route:', route.map(i => this.places[i].id));
                console.log('Visited:', visited);
                break;
            }
            
            visited[bestNext] = true;
            route.push(bestNext);
            
            const travelTime = this.timeMatrix[current][bestNext];
            const visitDuration = this.places[bestNext].visitDuration || 60;
            currentTime += (travelTime / 60) + (visitDuration / 60);
            
            console.log(`  → ${this.places[bestNext].id} (arrival: ${currentTime.toFixed(2)})`);
            
            current = bestNext;
        }
        
        console.log('✅ [NN] Route complete');
        return route;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // 2-OPT OPTIMIZATION
    // ═══════════════════════════════════════════════════════════════
    
    twoOptimize(initialRoute, maxIterations = 100) {
        console.log('🔧 [2-Opt] Starting optimization...');
        
        let route = [...initialRoute];
        let improved = true;
        let iterations = 0;
        
        while (improved && iterations < maxIterations) {
            improved = false;
            iterations++;
            
            for (let i = 1; i < route.length - 2; i++) {
                for (let j = i + 1; j < route.length - 1; j++) {
                    try {
                        const newRoute = [
                            ...route.slice(0, i),
                            ...route.slice(i, j + 1).reverse(),
                            ...route.slice(j + 1)
                        ];
                        
                        const currentCost = this._calculateTotalCost(route);
                        const newCost = this._calculateTotalCost(newRoute);
                        
                        if (newCost < currentCost) {
                            route = newRoute;
                            improved = true;
                            console.log(`  ✓ Improvement at iteration ${iterations}`);
                        }
                    } catch (error) {
                        console.error(`❌ 2-Opt error at [${i},${j}]:`, error);
                    }
                }
            }
        }
        
        console.log(`✅ [2-Opt] Complete in ${iterations} iterations`);
        return route;
    }
    
    _calculateTotalCost(route) {
        let totalDistance = 0;
        let totalPenalty = 0;
        let currentTime = this.config.startTime;
        
        try {
            for (let i = 0; i < route.length - 1; i++) {
                const from = route[i];
                const to = route[i + 1];
                
                // ✅ FIX: تعريف distance محلياً
                const distance = this.distanceMatrix[from][to];
                if (distance === Infinity) {
                    return Infinity;
                }
                totalDistance += distance;
                
                const travelTime = this.timeMatrix[from][to];
                currentTime += (travelTime / 60);
                
                const penalty = this.calculateTimePenalty(this.places[to], currentTime);
                totalPenalty += penalty;
                
                const visitDuration = this.places[to].visitDuration || 60;
                currentTime += (visitDuration / 60);
            }
        } catch (error) {
            console.error('❌ Total cost calculation error:', error);
            return Infinity;
        }
        
        return totalDistance + (totalPenalty * this.config.timePenaltyWeight);
    }
    
    // ═══════════════════════════════════════════════════════════════
    // MAIN OPTIMIZATION FUNCTION
    // ═══════════════════════════════════════════════════════════════
    
    optimize() {
        console.log('═══════════════════════════════════════');
        console.log('🚀 ALIDADE ROUTE OPTIMIZATION START');
        console.log('═══════════════════════════════════════');
        
        try {
            const initialRoute = this.nearestNeighbor();
            const optimizedRoute = this.twoOptimize(initialRoute);
            const output = this._generateOutput(optimizedRoute);
            
            console.log('═══════════════════════════════════════');
            console.log('✅ OPTIMIZATION COMPLETE');
            console.log(`📊 Total Distance: ${output.totalDistance.toFixed(2)} km`);
            console.log(`⏱️  Total Duration: ${Math.floor(output.totalDuration / 60)}h ${Math.floor(output.totalDuration % 60)}m`);
            console.log('═══════════════════════════════════════');
            
            return output;
            
        } catch (error) {
            console.error('═══════════════════════════════════════');
            console.error('❌ OPTIMIZATION FAILED');
            console.error('Error:', error.message);
            console.error('Stack:', error.stack);
            console.error('═══════════════════════════════════════');
            throw error;
        }
    }
    
    _generateOutput(route) {
        let totalDistance = 0;
        let currentTime = this.config.startTime;
        const stops = [];
        
        for (let i = 0; i < route.length; i++) {
            const placeIndex = route[i];
            const place = this.places[placeIndex];
            
            let travelDistance = 0;
            let travelTime = 0;
            let transportMode = 'start';
            
            if (i > 0) {
                const prevIndex = route[i - 1];
                const prevPlace = this.places[prevIndex];
                
                // ✅ FIX: تعريف distance محلياً
                travelDistance = this.distanceMatrix[prevIndex][placeIndex];
                travelTime = this.timeMatrix[prevIndex][placeIndex];
                
                if (this._isTransportZone(prevPlace.id) || this._isTransportZone(place.id)) {
                    transportMode = 'taxi';
                } else if (travelDistance <= 0.1) {
                    transportMode = 'taxi';
                } else {
                    transportMode = 'walk';
                }
                
                totalDistance += travelDistance;
                currentTime += (travelTime / 60);
            }
            
            stops.push({
                place: place,
                arrivalTime: currentTime,
                travelDistance: travelDistance,
                travelTime: travelTime,
                transportMode: transportMode
            });
            
            const visitDuration = place.visitDuration || 60;
            currentTime += (visitDuration / 60);
        }
        
        return {
            route: route,
            stops: stops,
            totalDistance: totalDistance,
            totalDuration: (currentTime - this.config.startTime) * 60,
            endTime: currentTime
        };
    }
}

// ═══════════════════════════════════════════════════════════════
// WRAPPER FUNCTION للاستخدام في UI
// ═══════════════════════════════════════════════════════════════

function optimizeRoute(places, config) {
    console.log('🎯 [optimizeRoute] Called with', places?.length, 'places');
    
    try {
        // Validate input
        if (!places || !Array.isArray(places) || places.length === 0) {
            throw new Error('Invalid places array');
        }
        
        // Create planner
        const planner = new RoutePlanner(places, config);
        
        // Run optimization
        const result = planner.optimize();
        
        return {
            success: true,
            result: result
        };
        
    } catch (error) {
        console.error('❌ [optimizeRoute] Failed:', error);
        return {
            success: false,
            error: error.message,
            stack: error.stack
        };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RoutePlanner, optimizeRoute };
}
