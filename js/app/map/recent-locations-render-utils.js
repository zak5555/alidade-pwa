/**
 * ALIDADE Map Recent Locations Render Utilities
 * Extracted from legacy app.js with adapter hooks.
 */
(function bootstrapMapRecentLocationsRenderUtils(windowObj) {
    if (!windowObj) return;

    const mapUtils = windowObj.ALIDADE_MAP_UTILS || (windowObj.ALIDADE_MAP_UTILS = {});

    if (typeof mapUtils.renderRecentLocations !== 'function') {
        mapUtils.renderRecentLocations = function renderRecentLocations(adapter = {}) {
            const getMapState = typeof adapter.getMapState === 'function'
                ? adapter.getMapState
                : () => ({});
            const recent = (getMapState() || {}).recentLocations || [];

            if (recent.length === 0) {
                return `
                <div class="recent-locations-empty">
                    <div class="text-4xl text-zinc-600 mb-2">📍</div>
                    <p class="text-zinc-500 text-sm">No recent locations</p>
                    <p class="text-zinc-600 text-xs">Places you visit will appear here</p>
                </div>
            `;
            }

            // Icon mapping
            const getIcon = (type) => {
                // Using emoji for now to match app style, or FontAwesome classes if we had them loaded.
                // The prompt requested FA, let's assume they might be available or fallback to emoji if not.
                // Actually, looking at index.html, FontAwesome IS loaded.

                const typeLower = (type || '').toLowerCase();
                const icons = {
                    hotel: 'fa-hotel',
                    restaurant: 'fa-utensils',
                    souk: 'fa-store',
                    mosque: 'fa-mosque',
                    taxi: 'fa-taxi',
                    monument: 'fa-landmark',
                    landmark: 'fa-landmark',
                    garden: 'fa-tree',
                    generic: 'fa-map-marker-alt'
                };

                // Simple fuzzy match or default
                let icon = icons.generic;
                for (const key in icons) {
                    if (typeLower.includes(key)) {
                        icon = icons[key];
                        break;
                    }
                }
                return icon;
            };

            const formatTimeAgo = typeof adapter.formatTimeAgo === 'function'
                ? adapter.formatTimeAgo
                : ((timestamp) => String(timestamp || ''));

            return `
            <div class="recent-locations">
                <div class="recent-header">
                    <h3 class="recent-title">
                        <i class="fas fa-history text-signal-cyan"></i>
                        RECENT LOCATIONS
                    </h3>
                    <button 
                        onclick="clearRecentLocations()" 
                        class="btn-clear-recent"
                        title="Clear history"
                    >
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
                
                <div class="recent-list">
                    ${recent.map((loc) => `
                        <div 
                            class="recent-item" 
                            onclick="jumpToLocation(${loc.lat}, ${loc.lng}, '${String(loc.name || '').replace(/'/g, "\\'")}')"
                        >
                            <div class="recent-icon">
                                <i class="fas ${getIcon(loc.type)}"></i>
                            </div>
                            <div class="recent-details">
                                <div class="recent-name">${loc.name}</div>
                                <div class="recent-meta">
                                    <span class="recent-time">${formatTimeAgo(loc.timestamp)}</span>
                                    ${loc.visits > 1 ? `<span class="recent-visits">• ${loc.visits} visits</span>` : ''}
                                </div>
                            </div>
                            <div class="recent-arrow">
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                ${recent.length >= 10 ? `
                    <div class="recent-footer">
                        <small>Showing last 10 locations</small>
                    </div>
                ` : ''}
            </div>
        `;
        };
    }
})(typeof window !== 'undefined' ? window : null);
