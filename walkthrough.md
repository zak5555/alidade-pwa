Route Planner Fix - Final Deployment
Overview
We have completely refactored the 
RoutePlanner
 class to enforce strict "Physics" and logic.

Key Fixes Deployed
1. Bi-Directional Taxi Logic
Problem: Return trip from Palmeraie was treated as a walk. Solution: 
_buildDistanceMatrix
 sets distance to 0.1 for Transport Zones. Optimization forces 30-min taxi time.

2. Infinity Block
Problem: Algorithm scheduled long walks. Solution: Walks > 3km are penalized with 9999 cost.

3. Nuclear Penalties
Problem: Time constraints were ignored. Solution:

Door Locked: +100,000
Lunch Deadline: +10,000
Activity Window: +10,000
4. Cost-Aware Optimization
Solution: 
twoOptimize
 now uses 
_calculateTotalCost
 to respect time penalties.

5. UI Updates
Turn-by-Turn: Transport legs labeled "Take a Taxi" with 🚕 icon.
Distance: Real distance shown for context.