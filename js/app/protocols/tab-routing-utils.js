/**
 * ALIDADE Protocols Tab Routing Utilities
 * Extracted from legacy app.js with adapter hooks.
 */
(function bootstrapProtocolsTabRoutingUtils(windowObj) {
    if (!windowObj) return;

    const protocolsUtils = windowObj.ALIDADE_PROTOCOLS_UTILS || (windowObj.ALIDADE_PROTOCOLS_UTILS = {});

    if (typeof protocolsUtils.switchProtocolTab !== 'function') {
        protocolsUtils.switchProtocolTab = function switchProtocolTab(tabName, adapter = {}) {
            if (typeof adapter.setCurrentTab === 'function') {
                adapter.setCurrentTab(tabName);
            } else if (adapter.protocolState) {
                adapter.protocolState.currentTab = tabName;
            }

            // Persist active tab selection
            if (typeof adapter.persistActiveTab === 'function') {
                adapter.persistActiveTab(tabName);
            } else {
                const storage = adapter.localStorage || windowObj.localStorage;
                storage?.setItem('activeProtocolTab', tabName);
            }

            const doc = adapter.document || windowObj.document;

            // Update tab button styles
            doc.querySelectorAll('.protocol-tab').forEach((btn) => {
                if (btn.getAttribute('data-protocol-tab') === tabName) {
                    btn.classList.add('bg-purple-500', 'text-white');
                    btn.classList.remove('bg-void-800', 'text-zinc-400');
                } else {
                    btn.classList.remove('bg-purple-500', 'text-white');
                    btn.classList.add('bg-void-800', 'text-zinc-400');
                }
            });

            const container = doc.getElementById('protocol-content');

            // Reset container classes
            container.className = 'px-4 pt-4 pb-20';

            const renderMissionsTab = typeof adapter.renderMissionsTab === 'function'
                ? adapter.renderMissionsTab
                : () => '';
            const attachMissionListeners = typeof adapter.attachMissionListeners === 'function'
                ? adapter.attachMissionListeners
                : () => { };
            const renderBriefingLoadingState = typeof adapter.renderBriefingLoadingState === 'function'
                ? adapter.renderBriefingLoadingState
                : () => '';
            const ensureProtocolsBriefingData = typeof adapter.ensureProtocolsBriefingData === 'function'
                ? adapter.ensureProtocolsBriefingData
                : () => Promise.resolve();
            const getCurrentTab = typeof adapter.getCurrentTab === 'function'
                ? adapter.getCurrentTab
                : () => adapter.protocolState?.currentTab;
            const renderBriefingTab = typeof adapter.renderBriefingTab === 'function'
                ? adapter.renderBriefingTab
                : () => '';
            const attachBriefingListeners = typeof adapter.attachBriefingListeners === 'function'
                ? adapter.attachBriefingListeners
                : () => { };
            const renderWalletTab = typeof adapter.renderWalletTab === 'function'
                ? adapter.renderWalletTab
                : () => '';
            const attachWalletListeners = typeof adapter.attachWalletListeners === 'function'
                ? adapter.attachWalletListeners
                : () => { };
            const renderRoutePlanner = typeof adapter.renderRoutePlanner === 'function'
                ? adapter.renderRoutePlanner
                : () => { };

            switch (tabName) {
                case 'missions':
                    container.innerHTML = renderMissionsTab();
                    attachMissionListeners();
                    break;
                case 'briefing':
                    container.innerHTML = renderBriefingLoadingState();
                    Promise.resolve(ensureProtocolsBriefingData()).finally(() => {
                        if (getCurrentTab() !== 'briefing') return;
                        container.innerHTML = renderBriefingTab();
                        attachBriefingListeners();
                    });
                    break;
                case 'wallet':
                    container.innerHTML = renderWalletTab();
                    attachWalletListeners();
                    break;
                case 'ROUTE':
                    // Special styling for embedded map (fixed height)
                    container.classList.remove('pb-20');
                    container.classList.add('h-[calc(100vh-160px)]', 'overflow-hidden', 'pb-0');

                    // Embed Route Planner inside the tab container
                    renderRoutePlanner('protocol-content');
                    break;
            }
        };
    }

    if (typeof protocolsUtils.protocolsLoadDayIntoPlannerFlow !== 'function') {
        protocolsUtils.protocolsLoadDayIntoPlannerFlow = function protocolsLoadDayIntoPlannerFlow(options = {}) {
            const dayId = options.dayId;
            const getProtocolsBriefingDataFn = options.getProtocolsBriefingDataFn;
            const allDestinations = options.allDestinations || [];
            const localStorageObj = options.localStorageObj || windowObj.localStorage;
            const setCurrentTabFn = options.setCurrentTabFn;
            const saveProtocolStateFn = options.saveProtocolStateFn;
            const renderProtocolsFn = options.renderProtocolsFn;
            const documentObj = options.documentObj || windowObj.document;
            const setTimeoutFn = options.setTimeoutFn || windowObj.setTimeout;
            const consoleObj = options.consoleObj || windowObj.console;

            if (typeof getProtocolsBriefingDataFn !== 'function') return false;

            const day = getProtocolsBriefingDataFn().find(d => d.id === dayId);
            if (!day) return false;

            consoleObj.log('[BRIDGE] Loading day into planner:', dayId);

            // Map Waypoints to Destination IDs
            const destinationIds = [];
            day.waypoints.forEach(wp => {
                // 1. Precise Match (Name)
                let dest = allDestinations.find(d => d.name === wp.name);

                // 2. Fuzzy/Partial Match
                if (!dest) {
                    dest = allDestinations.find(d =>
                        wp.name.includes(d.name) || d.name.includes(wp.name) ||
                        (d.nameFr && wp.name.includes(d.nameFr))
                    );
                }

                if (dest) {
                    destinationIds.push(dest.id);
                } else {
                    consoleObj.warn('[BRIDGE] Could not find destination for:', wp.name);
                }
            });

            // Save selected IDs to localStorage for the Planner to pick up
            localStorageObj.setItem('routePlannerSelections', JSON.stringify(destinationIds));

            // Switch to ROUTE tab
            if (typeof setCurrentTabFn === 'function') {
                setCurrentTabFn('ROUTE');
            }
            if (typeof saveProtocolStateFn === 'function') {
                saveProtocolStateFn();
            }

            // Force re-render of Protocols to show the new tab
            if (typeof renderProtocolsFn === 'function') {
                renderProtocolsFn();
            }

            // Update tab styling (visual feedback)
            setTimeoutFn(() => {
                documentObj.querySelectorAll('.protocol-tab').forEach(t => {
                    t.classList.remove('bg-purple-500/20', 'text-purple-400');
                    if (t.dataset.protocolTab === 'ROUTE') {
                        t.classList.add('bg-purple-500/20', 'text-purple-400');
                    }
                });
            }, 50);

            return true;
        };
    }

    if (typeof protocolsUtils.protocolsResolveBriefingDayColor !== 'function') {
        protocolsUtils.protocolsResolveBriefingDayColor = function protocolsResolveBriefingDayColor(dayLabel) {
            const dayColors = {
                'DAY 1': 'emerald',
                'DAY 2': 'blue',
                'DAY 3': 'amber',
                'DAY 4': 'purple',
                'DAY 5': 'red'
            };
            return dayColors[dayLabel] || 'amber';
        };
    }

    if (typeof protocolsUtils.protocolsRenderBriefingDayCard !== 'function') {
        protocolsUtils.protocolsRenderBriefingDayCard = function protocolsRenderBriefingDayCard(day, options = {}) {
            const expandedDays = options.expandedDays || {};
            const completedWaypoints = options.completedWaypoints || [];
            const renderWaypointCardFn = options.renderWaypointCardFn || (() => '');

            const dayColor = typeof protocolsUtils.protocolsResolveBriefingDayColor === 'function'
                ? protocolsUtils.protocolsResolveBriefingDayColor(day.day)
                : 'amber';
            const isExpanded = expandedDays[day.day] || false;
            const waypointCount = day.waypoints.length;

            // Calculate progress for this day
            const completedCount = day.waypoints.filter(wp => completedWaypoints.includes(wp.id)).length;
            const progressPercent = waypointCount > 0 ? Math.round((completedCount / waypointCount) * 100) : 0;
            const isAllComplete = completedCount === waypointCount;

            return `
            <div class="relative briefing-day ${isAllComplete ? 'ring-1 ring-emerald-500/30' : ''}" data-day="${day.day}">
                <!-- Day Header (Clickable) -->
                <button 
                    class="day-toggle-btn w-full p-4 bg-gradient-to-r ${isAllComplete ? 'from-emerald-500/20 to-emerald-500/5 border-signal-emerald/40' : `from-${dayColor}-500/20 to-${dayColor}-500/5 border-${dayColor}-500/40`} border rounded-[2px] text-left transition-all hover:from-${dayColor}-500/30 hover:to-${dayColor}-500/10 active:scale-[0.98]"
                    data-day="${day.day}"
                >
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 ${isAllComplete ? 'bg-signal-emerald/30 border-signal-emerald/50' : `bg-${dayColor}-500/30 border-${dayColor}-500/50`} rounded-[2px] flex items-center justify-center ${isAllComplete ? 'text-emerald-400' : `text-${dayColor}-400`} font-heading font-bold text-xl border">
                                ${isAllComplete ? '✅' : day.day.replace('DAY ', '')}
                            </div>
                            <div>
                                <h3 class="font-heading font-bold ${isAllComplete ? 'text-emerald-400' : `text-${dayColor}-400`} text-lg">${day.day}</h3>
                                <p class="text-xs text-zinc-300">${day.title}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            <div class="text-right">
                                <span class="px-2 py-1 bg-black/40 rounded-[2px] text-xs font-mono ${isAllComplete ? 'text-emerald-300' : `text-${dayColor}-300`}">${day.focus}</span>
                                <p class="text-[10px] text-void-500 mt-1">${completedCount}/${waypointCount} OPS</p>
                            </div>
                            <span class="${isAllComplete ? 'text-emerald-400' : `text-${dayColor}-400`} transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                                </svg>
                            </span>
                        </div>
                    </div>
                    
                    <!-- Progress Bar -->
                    <div class="w-full bg-void-800 h-1.5 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r ${isAllComplete ? 'from-emerald-500 to-emerald-400' : `from-${dayColor}-500 to-${dayColor}-400`} transition-all duration-500" style="width: ${progressPercent}%"></div>
                    </div>
                    <div class="flex justify-between mt-1">
                        <span class="text-[9px] text-void-500 font-mono">${completedCount}/${waypointCount} COMPLETE</span>
                        <span class="text-[9px] ${isAllComplete ? 'text-emerald-400' : 'text-void-500'} font-mono">${progressPercent}%</span>
                    </div>
                </button>

                <!-- Waypoints (Collapsible) -->
                <div class="briefing-content overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[5000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}">
                    
                    <!-- OPTIMIZE BUTTON BRIDGE -->
                    <button 
                        class="w-full mb-6 py-3 bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-signal-amber/30 text-amber-400 font-bold text-xs rounded-[2px] hover:bg-signal-amber/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                        onclick="event.stopPropagation(); loadDayIntoPlanner('${day.id}')"
                    >
                        <span>🗺️</span> OPTIMIZE ROUTE (NAVIGATE)
                    </button>

                    <div class="relative pl-6 ml-4">
                        <!-- Continuous Timeline Line -->
                        <div class="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-${dayColor}-500/60 via-${dayColor}-500/30 to-transparent"></div>
                        
                        <div class="space-y-4">
                            ${day.waypoints.map((wp, idx) => renderWaypointCardFn(wp, idx, day.waypoints.length, dayColor)).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        };
    }

    if (typeof protocolsUtils.protocolsResolveWaypointTypeBadgeClass !== 'function') {
        protocolsUtils.protocolsResolveWaypointTypeBadgeClass = function protocolsResolveWaypointTypeBadgeClass(type) {
            const typeBadges = {
                'Landmark': 'bg-signal-emerald/20 text-emerald-400 border-signal-emerald/40',
                'Safe House': 'bg-green-500/20 text-green-400 border-green-500/40',
                'Recon': 'bg-signal-amber/20 text-signal-amber border-signal-amber/40',
                'Target Alpha': 'bg-red-500/20 text-red-400 border-red-500/40',
                'Sanctuary': 'bg-signal-cyan/20 text-cyan-400 border-cyan-500/40',
                'Supply Point': 'bg-blue-500/20 text-blue-400 border-blue-500/40',
                'High Risk': 'bg-red-500/30 text-red-300 border-red-500/50',
                'Observation': 'bg-purple-500/20 text-purple-400 border-purple-500/40',
                'Necropolis': 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40',
                'Ruins': 'bg-stone-500/20 text-stone-400 border-stone-500/40',
                'Royal Complex': 'bg-signal-amber/20 text-amber-300 border-signal-amber/40',
                'Acquisition': 'bg-signal-emerald/20 text-emerald-400 border-signal-emerald/40',
                'Dining': 'bg-orange-500/20 text-orange-400 border-orange-500/40',
                'Humanitarian': 'bg-pink-500/20 text-pink-400 border-pink-500/40',
                'Concept Store': 'bg-violet-500/20 text-violet-400 border-violet-500/40',
                'Gov Depot': 'bg-slate-500/20 text-slate-300 border-slate-500/40',
                'HQ': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40',
                'Protein': 'bg-signal-crimson/20 text-rose-400 border-signal-crimson/40',
                'Coffee': 'bg-amber-600/20 text-amber-300 border-amber-600/40',
                'Decon': 'bg-signal-cyan/20 text-cyan-400 border-cyan-500/40',
                'Depot': 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40',
                'Extraction': 'bg-orange-500/20 text-orange-400 border-orange-500/40',
                'Exfiltration': 'bg-red-600/20 text-red-300 border-red-600/40'
            };
            return typeBadges[type] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/40';
        };
    }

    if (typeof protocolsUtils.protocolsRenderWaypointCard !== 'function') {
        protocolsUtils.protocolsRenderWaypointCard = function protocolsRenderWaypointCard(wp, idx, total, dayColor, options = {}) {
            const getTimeOfDayColorFn = options.getTimeOfDayColorFn || (() => 'blue');
            const completedWaypoints = options.completedWaypoints || [];
            const expandedWaypoint = options.expandedWaypoint;

            const timeColor = getTimeOfDayColorFn(wp.time);
            const waypointKey = wp.id; // Use unique waypoint ID
            const isCompleted = completedWaypoints.includes(waypointKey);
            const isExpanded = expandedWaypoint === waypointKey;

            const typeBadgeClass = typeof protocolsUtils.protocolsResolveWaypointTypeBadgeClass === 'function'
                ? protocolsUtils.protocolsResolveWaypointTypeBadgeClass(wp.type)
                : 'bg-zinc-500/20 text-zinc-400 border-zinc-500/40';

            return `
            <div class="relative waypoint-item" data-waypoint="${waypointKey}">
                <!-- Timeline Dot with Status -->
                <div class="absolute -left-6 top-3 flex items-center justify-center z-10">
                    <button class="waypoint-status-btn w-5 h-5 rounded-full border-2 border-zinc-950 shadow-lg transition-all flex items-center justify-center ${isCompleted
                    ? 'bg-signal-emerald shadow-emerald-500/40'
                    : `bg-${timeColor}-500/50 shadow-${timeColor}-500/30 hover:bg-${timeColor}-500`}" 
                        data-waypoint="${waypointKey}"
                        title="${isCompleted ? 'Mark as pending' : 'Mark as completed'}">
                        ${isCompleted ? '<span class="text-[10px] text-white font-bold">✅</span>' : ''}
                    </button>
                </div>
                
                <!-- Waypoint Card (Clickable Header) -->
                <button class="waypoint-toggle-btn w-full text-left p-3 bg-void-900/80 border ${isCompleted ? 'border-signal-emerald/40 bg-signal-emerald/5' : `border-${timeColor}-500/20`} rounded-[2px] hover:border-${timeColor}-500/40 transition-all active:scale-[0.99]"
                    data-waypoint="${waypointKey}">
                    
                    <!-- Clean Header (Always Visible) -->
                    <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2 flex-1 min-w-0">
                            <span class="flex-shrink-0 px-2 py-1 bg-${timeColor}-500/20 rounded-[2px] text-xs font-mono font-bold text-${timeColor}-400 border border-${timeColor}-500/30">
                                ${wp.time}
                            </span>
                            <h4 class="font-heading font-bold text-white text-sm truncate ${isCompleted ? 'line-through text-void-500' : ''}">${wp.name}</h4>
                        </div>
                        <div class="flex items-center gap-2 flex-shrink-0">
                            <span class="hidden sm:inline px-2 py-0.5 text-[10px] font-mono uppercase rounded border ${typeBadgeClass}">
                                ${wp.type}
                            </span>
                            <span class="text-void-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                                </svg>
                            </span>
                        </div>
                    </div>
                </button>
                
                <!-- Rich Content (Expandable) -->
                <div class="waypoint-content overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}">
                    <div class="p-3 pt-0 bg-void-900/60 border border-t-0 border-${timeColor}-500/20 rounded-b-xl -mt-2">
                        <!-- Type Badge (Mobile) + Status -->
                        <div class="flex justify-between items-center mb-3 pt-3 border-t border-white/5">
                            <span class="px-2 py-0.5 text-[10px] font-mono uppercase rounded border ${typeBadgeClass}">
                                ${wp.type}
                            </span>
                            <span class="text-[10px] font-mono ${isCompleted ? 'text-emerald-400' : 'text-void-500'}">
                                ${isCompleted ? '✅ COMPLETED' : '⏳ PENDING'}
                            </span>
                        </div>
                        
                        <!-- Intel -->
                        <div class="mb-3">
                            <div class="flex items-center gap-1 mb-1">
                                <span class="text-signal-amber text-xs">🤫</span>
                                <span class="text-[10px] font-mono font-bold text-signal-amber/80 uppercase tracking-wide">INTEL</span>
                            </div>
                            <p class="text-xs text-zinc-300 leading-relaxed">${wp.intel}</p>
                        </div>
                        
                        <!-- Tactics -->
                        ${wp.tactics ? `
                            <div class="pt-2 border-t border-void-800">
                                <div class="flex items-center gap-1 mb-2">
                                    <span class="text-emerald-400 text-xs">🛡️</span>
                                    <span class="text-[10px] font-mono font-bold text-emerald-400/80 uppercase tracking-wide">TACTICS</span>
                                </div>
                                <div class="space-y-2 text-xs text-zinc-400 leading-relaxed">
                                    ${Array.isArray(wp.tactics)
                    ? wp.tactics.map(t => `<p class="pl-2 border-l-2 border-signal-emerald/30">${t}</p>`).join('')
                    : `<p>${wp.tactics}</p>`
                }
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        };
    }
})(typeof window !== 'undefined' ? window : null);
