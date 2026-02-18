/**
 * ALIDADE Map Recent Locations Utilities
 * Extracted from legacy app.js with adapter hooks.
 */
(function bootstrapMapRecentLocationsUtils(windowObj) {
    if (!windowObj) return;

    const mapUtils = windowObj.ALIDADE_MAP_UTILS || (windowObj.ALIDADE_MAP_UTILS = {});
    const mapRecentLocationsDebugLog = (...args) => {
        if (windowObj.__ALIDADE_DEBUG_LOGS__ === true) {
            console.log(...args);
        }
    };

    if (typeof mapUtils.trackMapLocation !== 'function') {
        mapUtils.trackMapLocation = function trackMapLocation(location, adapter = {}) {
            if (!location || !location.name) {
                return;
            }

            const getMapState = typeof adapter.getMapState === 'function'
                ? adapter.getMapState
                : () => ({ recentLocations: [] });
            const setMapState = typeof adapter.setMapState === 'function'
                ? adapter.setMapState
                : () => { };
            const mapState = getMapState() || { recentLocations: [] };
            const recent = mapState.recentLocations || [];

            // Create location entry
            const now = typeof adapter.now === 'function' ? adapter.now() : Date.now();
            const entry = {
                id: location.id || String(location.name).toLowerCase().replace(/\s+/g, '_'),
                name: location.name,
                lat: location.lat,
                lng: location.lng,
                type: location.type || 'generic', // 'hotel', 'restaurant', 'souk', etc.
                timestamp: now,
                visits: 1
            };

            // Check if location already exists
            const existingIndex = recent.findIndex((loc) =>
                loc.name === entry.name ||
                (loc.lat && loc.lng && Math.abs(loc.lat - entry.lat) < 0.0001 && Math.abs(loc.lng - entry.lng) < 0.0001)
            );

            let updated;
            if (existingIndex !== -1) {
                // Update existing location
                entry.visits = (recent[existingIndex].visits || 1) + 1;
                updated = [
                    entry,
                    ...recent.filter((_, i) => i !== existingIndex)
                ];
            } else {
                // Add new location
                updated = [entry, ...recent];
            }

            // Keep only last 10
            const trimmed = updated.slice(0, 10);

            // Save
            setMapState({ ...mapState, recentLocations: trimmed });

            const recordVisitedPOI = typeof adapter.recordVisitedPOI === 'function'
                ? adapter.recordVisitedPOI
                : null;
            if (recordVisitedPOI) {
                recordVisitedPOI({
                    id: entry.id,
                    name: entry.name,
                    type: entry.type,
                    lat: entry.lat,
                    lng: entry.lng
                });
            }

            const log = typeof adapter.log === 'function'
                ? adapter.log
                : (...args) => mapRecentLocationsDebugLog(...args);
            log('[MAP] Location tracked:', entry.name);
        };
    }

    if (typeof mapUtils.formatTimeAgo !== 'function') {
        mapUtils.formatTimeAgo = function formatTimeAgo(timestamp, adapter = {}) {
            const now = typeof adapter.now === 'function' ? adapter.now() : Date.now();
            const seconds = Math.floor((now - timestamp) / 1000);

            if (seconds < 60) return 'Just now';
            if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
            if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
            if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
            return new Date(timestamp).toLocaleDateString();
        };
    }

    if (typeof mapUtils.clearRecentLocations !== 'function') {
        mapUtils.clearRecentLocations = function clearRecentLocations(adapter = {}) {
            const confirmFn = typeof adapter.confirm === 'function'
                ? adapter.confirm
                : windowObj.confirm;
            if (!confirmFn('Clear all recent locations?')) return;

            const getMapState = typeof adapter.getMapState === 'function'
                ? adapter.getMapState
                : () => ({});
            const setMapState = typeof adapter.setMapState === 'function'
                ? adapter.setMapState
                : () => { };
            const mapState = getMapState() || {};
            setMapState({ ...mapState, recentLocations: [] });

            // Re-render
            const renderVectorModule = typeof adapter.renderVectorModule === 'function'
                ? adapter.renderVectorModule
                : null;
            if (renderVectorModule) {
                renderVectorModule(); // Re-render the map module to update the list
            }

            const log = typeof adapter.log === 'function'
                ? adapter.log
                : (...args) => mapRecentLocationsDebugLog(...args);
            log('[MAP] Recent locations cleared');
        };
    }

    if (typeof mapUtils.jumpToLocation !== 'function') {
        mapUtils.jumpToLocation = function jumpToLocation(lat, lng, name, adapter = {}) {
            const triggerHaptics = typeof adapter.triggerHaptics === 'function'
                ? adapter.triggerHaptics
                : () => { };
            triggerHaptics('light');

            // Logic to center map would go here.
            // For now, since we don't have a real interactive map engine exposed in this file yet (it's mostly placeholders),
            // we'll just log and show toast.
            const log = typeof adapter.log === 'function'
                ? adapter.log
                : (...args) => mapRecentLocationsDebugLog(...args);
            log(`[MAP] Jumping to: ${name} (${lat}, ${lng})`);

            const showToast = typeof adapter.showToast === 'function'
                ? adapter.showToast
                : null;
            if (showToast) {
                showToast(`Navigating to ${name}`);
            }

            // Scroll to top to see map (simulator)
            const scrollTo = typeof adapter.scrollTo === 'function'
                ? adapter.scrollTo
                : windowObj.scrollTo;
            if (typeof scrollTo === 'function') {
                scrollTo({ top: 0, behavior: 'smooth' });
            }
        };
    }
})(typeof window !== 'undefined' ? window : null);
