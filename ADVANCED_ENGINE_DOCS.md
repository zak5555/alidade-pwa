# 🧠 ALIDADE Advanced Routing Engine v3.0 - Documentation

## 📚 Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Conflict Resolution Matrix](#conflict-resolution-matrix)
4. [Deep Calculation Models](#deep-calculation-models)
5. [Usage Examples](#usage-examples)
6. [Performance Optimization](#performance-optimization)

---

## 🎯 Overview

النظام المتقدم للتوجيه يستخدم **4 تقنيات ذكاء صناعي** لحل مشكلة التوجيه:

### **1. Multi-Criteria Decision Making (MCDM)**
- يحسب **10 معايير** مختلفة لكل قرار
- يوازن بين المعايير المتضاربة بذكاء
- يستخدم **weighted scoring** لترتيب الخيارات

### **2. Constraint Satisfaction Problem (CSP) Solver**
- يتحقق من **Hard Constraints** (ممنوع كسرها)
- يحاول تحسين **Soft Constraints** (يُفضل احترامها)
- يكتشف التضاربات قبل حدوثها

### **3. Genetic Algorithm Optimization**
- يجرب **50 حل مختلف** في كل جيل
- يحسّن الحلول عبر **100 جيل**
- يستخدم **Crossover & Mutation** لاستكشاف حلول جديدة

### **4. Machine Learning Predictions**
- يتنبأ بـ **مستوى الزحام** في كل وقت
- يحسب **درجة الحرارة** المتوقعة
- يتوقع **مستوى الطاقة** و **الرضا**

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Input (Places + Preferences)        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Advanced Routing Engine v3.0                    │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Conflict     │  │ ML           │  │ Genetic      │      │
│  │ Resolver     │  │ Predictor    │  │ Algorithm    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                         │                                     │
│                         ▼                                     │
│         ┌───────────────────────────────┐                    │
│         │  Constraint Checker            │                    │
│         │  - Hard Constraints            │                    │
│         │  - Soft Constraints            │                    │
│         └───────────────────────────────┘                    │
│                         │                                     │
│                         ▼                                     │
│         ┌───────────────────────────────┐                    │
│         │  Fitness Evaluator             │                    │
│         │  - Utility Calculation         │                    │
│         │  - Penalty Calculation         │                    │
│         └───────────────────────────────┘                    │
│                         │                                     │
└─────────────────────────┼─────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                 Optimized Route + Timeline                   │
│                                                               │
│  - Stop 1: Bahia Palace (09:00) - Energy: 95%               │
│  - Stop 2: Jemaa el-Fnaa (11:30) - Crowd: Low               │
│  - Stop 3: Amal Center (13:00) - Satisfaction: 0.9          │
│  ...                                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚖️ Conflict Resolution Matrix

### **Priority Levels (من الأهم إلى الأقل)**

```javascript
1. SAFETY (1.0)
   - Female traveler alone after dark
   - Unsafe areas
   - Emergency situations
   
2. HARD_CONSTRAINTS (0.95)
   - Opening hours
   - Physical impossibilities (distance > max walk)
   - Lunch-only windows
   
3. PRAYER_TIME (0.9)
   - Cultural/religious obligations
   - Fixed timing (e.g., 13:00 Friday)
   
4. LUNCH_WINDOWS (0.85)
   - Restaurants that serve lunch only
   - Time window: 12:00-14:30
   
5. SUNSET_DEADLINE (0.8)
   - Safety concerns after dark
   - Venue closures
   
6. THERMAL_COMFORT (0.75)
   - Heat > 40°C
   - Outdoor exposure during midday
   
7. ENERGY_MANAGEMENT (0.7)
   - User exhaustion
   - Need for rest breaks
   
8. CROWD_AVOIDANCE (0.5)
   - Peak tourist hours
   - Jemaa el-Fnaa at sunset
   
9. DISTANCE_OPTIMIZATION (0.3)
   - Walking distance
   - Travel time
   
10. EXPERIENCE_QUALITY (0.2)
    - Best time to visit
    - Photography lighting
```

---

### **Conflict Resolution Examples**

#### **Example 1: Safety vs Distance**

```javascript
Scenario:
- Option A: Walk 2km through safe area (15 min)
- Option B: Walk 0.5km through risky area (5 min)

Conflict:
- Safety (priority 1.0) vs Distance (priority 0.3)

Resolution:
→ Choose Option A (Safety wins)
→ Confidence: 100%
```

#### **Example 2: Lunch Window vs Crowd Avoidance**

```javascript
Scenario:
- Amal Center (lunch only, closes 14:30)
- Arrival option A: 13:00 (high crowd)
- Arrival option B: 14:45 (low crowd, but TOO LATE!)

Conflict:
- Lunch Window (priority 0.85) vs Crowd (priority 0.5)

Resolution:
→ Choose Option A at 13:00
→ Confidence: 70%
→ Reasoning: "Door will be locked at 14:30"
```

#### **Example 3: Thermal Comfort vs Distance**

```javascript
Scenario:
- Current time: 13:00 (temperature: 43°C)
- Option A: Visit Jemaa (outdoor, 0.5km away)
- Option B: Visit Museum (indoor, 2km away)

Conflict:
- Thermal Comfort (priority 0.75) vs Distance (priority 0.3)

Resolution:
→ Choose Option B (Museum)
→ Confidence: 85%
→ Reasoning: "Health risk in 43°C heat"
→ Action: "Force thermal refuge"
```

---

## 🧮 Deep Calculation Models

### **1. Utility Function**

```javascript
U(place, time) = Σ [
    w1 * Satisfaction(place, time, crowd, energy)
    + w2 * TimeQuality(place, time)
    + w3 * EnergyEfficiency(place, activity)
    + w4 * ExperienceScore(place, weather, lighting)
    + w5 * SafetyScore(place, time, gender)
]
```

**Où:**
- `Satisfaction`: 0.0 - 1.0 (predicted user satisfaction)
- `TimeQuality`: How close to "best time" (e.g., Bahia at 09:00)
- `EnergyEfficiency`: Energy cost vs gain
- `ExperienceScore`: Quality of experience (photos, ambiance)
- `SafetyScore`: Safety level at this time

**Weights (par défaut):**
```javascript
w1 = 0.30  // Satisfaction
w2 = 0.20  // Time Quality
w3 = 0.15  // Energy Efficiency
w4 = 0.15  // Experience Score
w5 = 0.10  // Safety Score
```

---

### **2. Cost Function**

```javascript
C(route) = Σ [
    w6 * TotalDistance
    + w7 * Σ TimePenalty[i]
    + w8 * Σ CrowdPenalty[i]
    + w9 * Σ ThermalPenalty[i]
]
```

**Où:**
- `TotalDistance`: Sum of all walking distances
- `TimePenalty`: Penalty for visiting at wrong time
- `CrowdPenalty`: Penalty for high crowd levels
- `ThermalPenalty`: Penalty for extreme heat exposure

**Weights (par défaut):**
```javascript
w6 = 0.05  // Distance Cost
w7 = 0.03  // Time Penalty
w8 = 0.02  // Crowd Penalty
w9 = 0.05  // Thermal Penalty (higher because health risk)
```

---

### **3. Final Score**

```javascript
FinalScore(route) = U(route) - C(route)

// Hard constraint check:
if (HardConstraintViolated) {
    FinalScore = -10000 * NumViolations
}
```

---

### **4. Energy Calculation Model**

```javascript
// Energy at arrival
E(arrival) = E(previous) - DecayCost(activity, duration)

// Decay rates (per hour):
DecayRates = {
    'walking': 2.0,      // Walking drains energy
    'standing': 1.0,     // Normal visit
    'sitting': 0.3,      // Café/restaurant
    'intense': 3.5,      // Quad biking, camel ride
    'rest': -1.5         // Rest GAINS energy (negative = gain)
}

// Example:
E(start) = 100
Activity: Walking 30 min
E(after_walk) = 100 - (2.0 * 0.5) = 99

Activity: Visit Bahia 45 min
E(after_visit) = 99 - (1.0 * 0.75) = 98.25

Activity: Rest at café 15 min
E(after_rest) = 98.25 - (-1.5 * 0.25) = 98.625 (GAIN!)
```

**Energy Thresholds:**
```javascript
E > 70:  Optimal (green zone)
E > 50:  Good (yellow zone)
E > 30:  Tired (orange zone)
E > 10:  Exhausted (red zone) → Force rest!
E < 10:  Critical (must rest immediately)
```

---

### **5. Crowd Prediction Model**

```javascript
CrowdLevel(place, time) = BaseCrowd + TimeModifier + DayModifier + EventModifier

// Base Crowd (from data):
BaseCrowd[Jemaa] = 0.6
BaseCrowd[Bahia] = 0.4
BaseCrowd[Museum] = 0.3

// Time Modifiers:
if (10:00 <= time <= 14:00): +0.3  // Peak tourist hours
if (17:00 <= time <= 19:00): +0.2  // Sunset crowds
if (time < 09:00): -0.2             // Early bird discount

// Day Modifiers:
if (Friday or Saturday): +0.2       // Weekend
if (Public Holiday): +0.4           // Major events

// Event Modifiers:
if (Ramadan && time == 19:00): +0.5  // Iftar rush
if (Festival): +0.3                  // Cultural events

// Final Crowd Level (clamped 0.0 - 1.0)
CrowdLevel = clamp(BaseCrowd + Modifiers, 0.0, 1.0)
```

**Example:**
```javascript
Place: Jemaa el-Fnaa
Time: 18:30 (sunset)
Day: Saturday

BaseCrowd = 0.6
+ TimeModifier (sunset) = +0.2
+ DayModifier (weekend) = +0.2
= 1.0 (VERY HIGH!)

Recommendation: Avoid or accept high crowds
```

---

### **6. Temperature Prediction Model**

```javascript
Temp(time) = BaseTemp + MonthAdjustment + HourlyCurve

// Base Temperature (Marrakech):
BaseTemp = 30°C (annual average)

// Monthly Adjustments:
MonthlyAdj = {
    Jun-Aug: +12°C  // Summer: 42°C
    Dec-Feb: -5°C   // Winter: 25°C
    Mar-May: +5°C   // Spring: 35°C
    Sep-Nov: +3°C   // Fall: 33°C
}

// Hourly Curve (sine wave, peaks at 14:00):
HourlyCurve = sin((hour - 6) / 12 * π) * 8°C

// Example:
Month: July (summer)
Time: 14:00 (peak)

BaseTemp = 30
+ MonthlyAdj = +12
+ HourlyCurve(14:00) = +8
= 50°C (EXTREME!)

Thermal Warning: AVOID outdoor activities!
```

---

### **7. Satisfaction Prediction Model**

```javascript
Satisfaction(place, time, crowd, energy) = 
    BaseAppeal
    + TimeBonus
    - CrowdPenalty
    - EnergyPenalty
    + CategoryBonus

// Base Appeal (0.0 - 1.0):
BaseAppeal[Bahia] = 0.8     // Must-see
BaseAppeal[Museum] = 0.6    // Moderate interest
BaseAppeal[Souk] = 0.5      // Depends on user

// Time Bonus:
if (time == BestTime):
    TimeBonus = +0.25
else:
    TimeBonus = max(0, 0.25 - |time - BestTime| * 0.05)

// Crowd Penalty:
CrowdPenalty = CrowdLevel * 0.3

// Energy Penalty:
if (energy < 30): EnergyPenalty = 0.3
elif (energy < 50): EnergyPenalty = 0.15
else: EnergyPenalty = 0

// Category Bonus:
if (category == 'MustSee'): CategoryBonus = +0.15

// Final (clamped 0.0 - 1.0)
Satisfaction = clamp(
    BaseAppeal + TimeBonus - CrowdPenalty - EnergyPenalty + CategoryBonus,
    0.0, 1.0
)
```

**Example:**
```javascript
Place: Bahia Palace
Time: 09:30 (best time: 09:00)
Crowd: 0.2 (low)
Energy: 95%

BaseAppeal = 0.8
+ TimeBonus (30 min late) = 0.25 - (0.5 * 0.05) = +0.225
- CrowdPenalty = 0.2 * 0.3 = -0.06
- EnergyPenalty = 0 (energy > 70)
+ CategoryBonus = +0.15 (MustSee)
= 1.115 → clamped to 1.0

Result: Maximum satisfaction!
```

---

## 💻 Usage Examples

### **Example 1: Basic Usage**

```javascript
// Define places
const places = [
    { 
        id: 'hotel', 
        lat: 31.6295, 
        lng: -7.9811, 
        visitDuration: 0,
        name: 'My Hotel'
    },
    { 
        id: 'bahia', 
        lat: 31.6210, 
        lng: -7.9830, 
        visitDuration: 45,
        name: 'Bahia Palace',
        openingHours: { open: 9, close: 17 },
        bestTime: '09:00',
        category: 'MustSee',
        baseAppeal: 0.8,
        exposure: 'low',
        baseCrowdLevel: 0.4
    },
    { 
        id: 'jemaa', 
        lat: 31.6258, 
        lng: -7.9890, 
        visitDuration: 60,
        name: 'Jemaa el-Fnaa',
        openingHours: { open: 0, close: 24 },
        category: 'MustSee',
        baseAppeal: 0.9,
        exposure: 'high',
        baseCrowdLevel: 0.7
    },
    { 
        id: 'amal', 
        lat: 31.6200, 
        lng: -8.0000, 
        visitDuration: 60,
        name: 'Amal Training Centre',
        intel: 'Lunch only. Book Fridays for couscous.',
        openingHours: { open: 12, close: 15 },
        category: 'Food',
        baseAppeal: 0.7
    }
];

// User profile
const userProfile = {
    fitnessLevel: 'normal',
    heatTolerance: 'medium',
    crowdTolerance: 'low',      // Prefers avoiding crowds
    interests: ['culture', 'photography'],
    walkingPace: 'normal',
    budget: 'medium'
};

// Configuration
const config = {
    startTime: 9.0,              // 09:00 AM
    endTime: 18.0,               // 06:00 PM
    maxWalkDistance: 3.0,        // 3km max walk
    populationSize: 50,          // Genetic algorithm population
    generations: 100,            // Genetic algorithm generations
    weights: {
        satisfaction: 0.3,
        energyEfficiency: 0.2,
        crowdPenalty: 0.15       // Higher weight = more crowd avoidance
    }
};

// Run optimization
const engine = new AdvancedRoutingEngine(places, userProfile, config);
const result = engine.optimize();

// Display result
console.log('🎯 Optimized Route:');
console.log(`📊 Score: ${result.score.toFixed(2)}`);
console.log(`📍 Distance: ${result.totalDistance.toFixed(2)} km`);
console.log(`⏱️  Duration: ${Math.floor(result.totalDuration / 60)}h ${result.totalDuration % 60}m`);
console.log(`⚡ Final Energy: ${result.finalEnergy.toFixed(0)}%`);

result.stops.forEach((stop, i) => {
    const hour = Math.floor(stop.arrivalTime);
    const min = Math.floor((stop.arrivalTime % 1) * 60);
    console.log(`
${i + 1}. ${stop.place.name}
   📅 Arrival: ${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}
   👥 Crowd: ${(stop.metrics.crowdLevel * 100).toFixed(0)}%
   🌡️  Temp: ${stop.metrics.temperature.toFixed(1)}°C
   ⚡ Energy: ${stop.metrics.energyLevel.toFixed(0)}%
   😊 Satisfaction: ${(stop.metrics.satisfaction * 100).toFixed(0)}%
    `);
});
```

---

### **Example 2: Handling Conflicts**

```javascript
// Scenario: Two places want the same time slot

const constraint1 = {
    name: 'Amal Lunch Window',
    type: 'LUNCH_WINDOWS',
    place: 'amal',
    timeWindow: [12.0, 14.5],
    importance: 0.85
};

const constraint2 = {
    name: 'Bahia Best Time',
    type: 'EXPERIENCE_QUALITY',
    place: 'bahia',
    bestTime: 13.0,
    importance: 0.2
};

const context = {
    urgencyA: 1.0,  // Amal MUST be visited during lunch
    urgencyB: 0.8   // Bahia can be visited any time
};

// Resolve conflict
const resolution = engine.resolveConflict(constraint1, constraint2, context);

console.log(`⚖️ Conflict Resolution:`);
console.log(`Winner: ${resolution.winner.name}`);
console.log(`Confidence: ${(resolution.confidence * 100).toFixed(0)}%`);

// Result:
// Winner: Amal Lunch Window
// Confidence: 81%
// Reasoning: Lunch window is harder constraint (0.85 vs 0.2)
```

---

### **Example 3: Dynamic Re-routing (If user takes longer)**

```javascript
// Original plan: Bahia 09:00-09:45, Jemaa 10:30-11:30
// Reality: User spent 90 min at Bahia (instead of 45)

const actualDeparture = 10.5; // 10:30 AM (instead of 09:45)
const delay = 45; // minutes

// Re-optimize remaining route
const remainingPlaces = places.slice(2); // Everything after Bahia

const updatedConfig = {
    ...config,
    startTime: actualDeparture,
    initialEnergy: 85 // User is a bit tired
};

const reoptimizedRoute = new AdvancedRoutingEngine(
    remainingPlaces,
    userProfile,
    updatedConfig
).optimize();

console.log('🔄 Re-optimized route after delay:');
// New timeline adjusts to accommodate the delay
```

---

## ⚡ Performance Optimization

### **1. Matrix Caching**

```javascript
// Cache distance & time matrices for reuse
const cacheKey = places.map(p => p.id).join('-');
const cachedMatrices = localStorage.getItem(`matrices_${cacheKey}`);

if (cachedMatrices) {
    const { distance, time } = JSON.parse(cachedMatrices);
    engine.distanceMatrix = distance;
    engine.timeMatrix = time;
} else {
    engine._buildMatrices();
    localStorage.setItem(`matrices_${cacheKey}`, JSON.stringify({
        distance: engine.distanceMatrix,
        time: engine.timeMatrix
    }));
}
```

---

### **2. Adaptive Genetic Algorithm**

```javascript
// Start with small population, increase if no improvement
let populationSize = 30;
let bestFitness = -Infinity;
let noImprovementCount = 0;

for (let gen = 0; gen < maxGenerations; gen++) {
    const fitness = runGeneration(populationSize);
    
    if (fitness > bestFitness) {
        bestFitness = fitness;
        noImprovementCount = 0;
    } else {
        noImprovementCount++;
    }
    
    // Increase population if stuck
    if (noImprovementCount > 10) {
        populationSize += 10;
        noImprovementCount = 0;
        console.log(`📈 Increased population to ${populationSize}`);
    }
}
```

---

### **3. Early Termination**

```javascript
// Stop if solution is good enough
const TARGET_SCORE = 0.9;

for (let gen = 0; gen < maxGenerations; gen++) {
    const normalizedScore = fitness / maxPossibleScore;
    
    if (normalizedScore >= TARGET_SCORE) {
        console.log(`✅ Target score reached at generation ${gen}`);
        break;
    }
}
```

---

## 🎓 Summary

هذا النظام المتقدم يستخدم:

1. **10 أولويات** مختلفة لحل التضاربات
2. **5 نماذج تنبؤ** (Crowd, Temp, Energy, Satisfaction, Time Quality)
3. **Genetic Algorithm** مع 50-100 حل في كل جيل
4. **Multi-Criteria Optimization** يوازن بين 8 أهداف
5. **Dynamic Conflict Resolution** يتعامل مع الحالات الحرجة

**النتيجة:** روت ذكي يحترم **كل** القيود و يعظم **رضا المستخدم**! 🚀
