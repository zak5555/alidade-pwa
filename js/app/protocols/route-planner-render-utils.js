/**
 * ALIDADE Route Planner Render Utilities
 * Extracted from route planner rendering helpers.
 */
(function bootstrapRoutePlannerRenderUtils(windowObj) {
    if (!windowObj) return;

    const protocolsUtils = windowObj.ALIDADE_PROTOCOLS_UTILS || (windowObj.ALIDADE_PROTOCOLS_UTILS = {});

    if (typeof protocolsUtils.routePlannerBuildDestinationListHtml !== 'function') {
        protocolsUtils.routePlannerBuildDestinationListHtml = function routePlannerBuildDestinationListHtml(destinations, currentSelections) {
            return destinations.map(dest => {
                const isSelected = currentSelections.includes(dest.id);
                const hours = dest.openingHours ?
                    `${dest.openingHours.open}:00-${dest.openingHours.close}:00` : 'Always';

                return `
                <label class="flex items-start gap-3 p-3 rounded-machined border ${isSelected ? 'bg-signal-amber/10 border-signal-amber/30' : 'bg-void-800/30 border-void-700/30'} cursor-pointer hover:bg-void-800/50 transition-colors">
                    <input type="checkbox" id="dest-${dest.id}" name="route_destination" value="${dest.id}" class="dest-checkbox mt-1 rounded bg-void-700 border-void-600 text-signal-amber focus:ring-amber-500" 
                        data-id="${dest.id}" ${isSelected ? 'checked' : ''}
                        onchange="toggleDestinationSelection('${dest.id}', this.checked)">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                            <span>${dest.icon || '📍'}</span>
                            <span class="text-white font-medium truncate">${dest.name}</span>
                        </div>
                        <div class="text-zinc-500 text-xs mt-1 flex items-center gap-2">
                            <span>⏳ ${dest.visitDuration} min</span>
                            <span>🕘 ${hours}</span>
                            ${dest.ticketPrice ? `<span>💵 ${dest.ticketPrice} DH</span>` : ''}
                        </div>
                    </div>
                </label>
            `;
            }).join('');
        };
    }

    if (typeof protocolsUtils.routePlannerResolveCurrentSelections !== 'function') {
        protocolsUtils.routePlannerResolveCurrentSelections = function routePlannerResolveCurrentSelections(localStorageObj) {
            return JSON.parse(localStorageObj.getItem('routePlannerSelections') || '[]');
        };
    }

    if (typeof protocolsUtils.routePlannerResolveDestinations !== 'function') {
        protocolsUtils.routePlannerResolveDestinations = function routePlannerResolveDestinations(destinationsMap, category) {
            return destinationsMap[category] || [];
        };
    }

    if (typeof protocolsUtils.routePlannerRenderDestinationListFlow !== 'function') {
        protocolsUtils.routePlannerRenderDestinationListFlow = function routePlannerRenderDestinationListFlow(
            documentObj,
            localStorageObj,
            destinationsMap,
            category
        ) {
            const container = documentObj.getElementById('dest-list');
            if (!container) return false;

            const currentSelections = typeof protocolsUtils.routePlannerResolveCurrentSelections === 'function'
                ? protocolsUtils.routePlannerResolveCurrentSelections(localStorageObj)
                : JSON.parse(localStorageObj.getItem('routePlannerSelections') || '[]');

            const destinations = typeof protocolsUtils.routePlannerResolveDestinations === 'function'
                ? protocolsUtils.routePlannerResolveDestinations(destinationsMap, category)
                : (destinationsMap[category] || []);

            if (typeof protocolsUtils.routePlannerBuildDestinationListHtml === 'function') {
                container.innerHTML = protocolsUtils.routePlannerBuildDestinationListHtml(destinations, currentSelections);
                return true;
            }

            container.innerHTML = destinations.map(dest => {
                const isSelected = currentSelections.includes(dest.id);
                const hours = dest.openingHours ?
                    `${dest.openingHours.open}:00-${dest.openingHours.close}:00` : 'Always';

                return `
                <label class="flex items-start gap-3 p-3 rounded-machined border ${isSelected ? 'bg-signal-amber/10 border-signal-amber/30' : 'bg-void-800/30 border-void-700/30'} cursor-pointer hover:bg-void-800/50 transition-colors">
                    <input type="checkbox" id="dest-${dest.id}" name="route_destination" value="${dest.id}" class="dest-checkbox mt-1 rounded bg-void-700 border-void-600 text-signal-amber focus:ring-amber-500" 
                        data-id="${dest.id}" ${isSelected ? 'checked' : ''}
                        onchange="toggleDestinationSelection('${dest.id}', this.checked)">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                            <span>${dest.icon || '📍'}</span>
                            <span class="text-white font-medium truncate">${dest.name}</span>
                        </div>
                        <div class="text-zinc-500 text-xs mt-1 flex items-center gap-2">
                            <span>⏳ ${dest.visitDuration} min</span>
                            <span>🕘 ${hours}</span>
                            ${dest.ticketPrice ? `<span>💵 ${dest.ticketPrice} DH</span>` : ''}
                        </div>
                    </div>
                </label>
            `;
            }).join('');
            return true;
        };
    }
})(typeof window !== 'undefined' ? window : null);
