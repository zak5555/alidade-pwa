/**
 * ALIDADE Route Planner UI Utilities
 * Extracted from route planner presentation layer with compatibility hooks.
 */
(function bootstrapRoutePlannerUiUtils(windowObj) {
    if (!windowObj) return;

    const protocolsUtils = windowObj.ALIDADE_PROTOCOLS_UTILS || (windowObj.ALIDADE_PROTOCOLS_UTILS = {});

    if (typeof protocolsUtils.routePlannerBuildHazardsHtml !== 'function') {
        protocolsUtils.routePlannerBuildHazardsHtml = function routePlannerBuildHazardsHtml(routeStops) {
            let hazardsHtml = '';
            const uniqueRisks = new Set();

            routeStops.forEach((stop) => {
                const name = (stop.name || '').toLowerCase();
                let risk = null;

                if (name.includes('jemaa') || name.includes('fnaa')) {
                    risk = { l: 'HIGH', t: 'Peak pickpocket activity after dark', d: 'Keep valuables hidden. Use inner pockets.', loc: 'Jemaa el-Fnaa' };
                } else if (name.includes('tanneries') || name.includes('leather')) {
                    risk = { l: 'MEDIUM', t: 'Fake guides and pressure tactics', d: 'Ignore anyone offering a "free tour".', loc: 'Tanneries' };
                } else if (name.includes('quad') || name.includes('palmeraie') || name.includes('camel')) {
                    risk = { l: 'LOW', t: 'Overpriced camel/quad tours', d: 'Agree on price before starting.', loc: 'Palmeraie' };
                }

                if (risk && !uniqueRisks.has(risk.t)) {
                    uniqueRisks.add(risk.t);
                    let colorClass = 'text-pink-400 border-pink-900/50 bg-pink-950/20';
                    if (risk.l === 'HIGH') colorClass = 'text-rose-400 border-rose-900/50 bg-rose-950/20';
                    else if (risk.l === 'MEDIUM') colorClass = 'text-amber-400 border-amber-900/50 bg-amber-950/20';

                    hazardsHtml += `
                <div class="mb-3 p-4 rounded-xl border ${colorClass} relative overflow-hidden shadow-lg">
                    <div class="flex justify-between items-start mb-2">
                        <div class="flex items-center gap-2">
                            <span class="text-xl">⚠️</span>
                            <span class="text-[10px] font-black tracking-[0.2em] uppercase">TACTICAL ALERT: ${risk.l}</span>
                        </div>
                        <span class="text-[9px] px-2 py-0.5 rounded-full bg-black/40 border border-white/10 opacity-70">${stop.name}</span>
                    </div>
                    <div class="pl-7">
                        <p class="text-sm font-bold mb-1"><span class="opacity-60 font-normal">Threat:</span> ${risk.t}</p>
                        <p class="text-xs font-mono leading-relaxed"><span class="text-emerald-400 font-bold uppercase">Protocol:</span> ${risk.d}</p>
                    </div>
                </div>`;
                }
            });

            return hazardsHtml;
        };
    }

    if (typeof protocolsUtils.routePlannerBuildDroppedHtml !== 'function') {
        protocolsUtils.routePlannerBuildDroppedHtml = function routePlannerBuildDroppedHtml(droppedItems) {
            if (!droppedItems || droppedItems.length === 0) return '';

            return `
             <div class="mb-2">
                 <div class="flex items-center gap-2 mb-2 px-1">
                    <span class="text-zinc-500 text-xs font-bold uppercase tracking-widest">⚠️ Logistics Debrief</span>
                    <div class="h-px bg-zinc-800 flex-1"></div>
                </div>
                ${droppedItems.map((item) => `
                <div class="mb-2 p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
                    <div class="flex items-center gap-2 text-zinc-500">
                        <span class="text-lg">❌</span>
                        <span class="text-xs font-bold line-through">${item.name}</span>
                    </div>
                     <span class="text-[9px] px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-600 font-mono">${item.reason}</span>
                </div>`).join('')}
            </div>`;
        };
    }

    if (typeof protocolsUtils.routePlannerBuildSecuritySection !== 'function') {
        protocolsUtils.routePlannerBuildSecuritySection = function routePlannerBuildSecuritySection(hazardsHtml) {
            return hazardsHtml ? `
            <div class="mb-2">
                 <div class="flex items-center gap-2 mb-3 px-1">
                    <span class="text-rose-500 text-xs font-bold uppercase tracking-widest">Security Intelligence</span>
                    <div class="h-px bg-rose-500/30 flex-1"></div>
                </div>
                ${hazardsHtml}
            </div>` : '';
        };
    }

    if (typeof protocolsUtils.routePlannerBuildSmartRouteHintHtml !== 'function') {
        protocolsUtils.routePlannerBuildSmartRouteHintHtml = function routePlannerBuildSmartRouteHintHtml(payload = {}) {
            const routeHint = payload.routeHint || {};
            const detourSuggested = routeHint.detourSuggested === true;
            const delayMinutes = Number(routeHint.delayMinutes || 0);
            const areaName = routeHint.areaName || 'route sector';
            const reasons = Array.isArray(routeHint.why) ? routeHint.why.slice(0, 2) : [];
            const action = routeHint.action || 'Continue current route with standard caution.';

            let toneClass = 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300';
            let title = 'SMART ROUTE HINT: STABLE';
            if (detourSuggested) {
                toneClass = 'border-amber-500/30 bg-amber-500/10 text-amber-300';
                title = 'SMART ROUTE HINT: SOFT DETOUR';
            } else if (String(routeHint.mode || '').toLowerCase().includes('caution')) {
                toneClass = 'border-zinc-500/40 bg-zinc-800/50 text-zinc-300';
                title = 'SMART ROUTE HINT: CAUTION';
            }

            const etaLine = detourSuggested
                ? `Optional detour latency: +~${Math.max(1, delayMinutes)} min.`
                : 'No detour recommended.';
            const reasonsHtml = reasons.length > 0
                ? `<p class="text-[11px] text-zinc-300 font-mono mt-2 leading-relaxed">${reasons.join(' | ')}</p>`
                : '';

            return `
            <div id="route-smart-hint-card" class="reveal-stagger mb-4 rounded-xl border ${toneClass} p-4" style="animation-delay: 0.25s">
                <div class="flex items-center justify-between gap-2">
                    <p class="text-[10px] font-black tracking-[0.18em] uppercase">${title}</p>
                    <p class="text-[10px] font-mono opacity-80">${areaName}</p>
                </div>
                <p class="text-sm font-semibold mt-2 leading-relaxed">${action}</p>
                <p class="text-[11px] text-zinc-400 font-mono mt-2">${etaLine}</p>
                ${reasonsHtml}
            </div>`;
        };
    }

    if (typeof protocolsUtils.routePlannerBuildTimelineHtml !== 'function') {
        protocolsUtils.routePlannerBuildTimelineHtml = function routePlannerBuildTimelineHtml(stops) {
            return stops.map((stop, index) => {
                const h = Math.floor(stop.arrivalTime / 60).toString().padStart(2, '0');
                const m = Math.round(stop.arrivalTime % 60).toString().padStart(2, '0');
                const isLast = index === stops.length - 1;

                return `
            <div class="flex gap-4 mb-6 relative group">
                <div class="flex flex-col items-end w-12 pt-1">
                    <span class="text-emerald-400 font-mono font-bold text-sm">${h}:${m}</span>
                </div>
                <div class="flex flex-col items-center">
                     <div class="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 group-hover:border-amber-500/50 transition-colors flex items-center justify-center text-lg z-10 relative shadow-lg">
                        ${stop.icon || '📍'}
                    </div>
                    ${!isLast ? '<div class="w-0.5 bg-zinc-800 absolute top-8 bottom-[-24px] z-0"></div>' : ''}
                </div>
                <div class="flex-1 pt-0.5 pb-2">
                    <h4 class="text-white font-bold text-sm leading-tight">${stop.name}</h4>
                    <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span class="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 border border-zinc-700 font-mono">⏱️ ${stop.visitDuration}m</span>
                        ${stop.travelDistance > 0 ? `
                        <span class="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 border border-zinc-700 font-mono">
                            ${stop.transportLabel === 'Taxi' ? '🚕' : '🚶'} ${stop.travelTime}m <span class="opacity-50">(${stop.travelDistance}km)</span>
                        </span>` : ''}
                    </div>
                </div>
            </div>`;
            }).join('');
        };
    }

    if (typeof protocolsUtils.routePlannerBuildGoogleMapsUrl !== 'function') {
        protocolsUtils.routePlannerBuildGoogleMapsUrl = function routePlannerBuildGoogleMapsUrl(stops) {
            if (!stops || !stops.length) return '';

            const coords = stops.map((stop) => `${stop.place.lat},${stop.place.lng}`);
            const origin = coords[0];
            const destination = coords[coords.length - 1];
            const waypoints = coords.slice(1, -1).join('|');
            return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=walking`;
        };
    }

    if (typeof protocolsUtils.routePlannerBuildSimpleShareText !== 'function') {
        protocolsUtils.routePlannerBuildSimpleShareText = function routePlannerBuildSimpleShareText(result) {
            const stops = result.route
                .filter((stop) => stop.type === 'destination')
                .map((stop, index) => `${index + 1}. ${stop.name}`)
                .join('\n');

            return `🗺️ My Marrakech Route\n\n${stops}\n\n📏 ${result.totalDistance.toFixed(1)} km total\n⏱️ ${Math.round(result.totalTime / 60)} hours\n\nOptimized by ALIDADE`;
        };
    }

    if (typeof protocolsUtils.routePlannerResolveOptimizeButtonState !== 'function') {
        protocolsUtils.routePlannerResolveOptimizeButtonState = function routePlannerResolveOptimizeButtonState(
            logisticsAuthRequired,
            isLogisticsLocked,
            isAuthenticated
        ) {
            if (logisticsAuthRequired) {
                return {
                    action: "window.promptProtocolsLogisticsUpgrade && window.promptProtocolsLogisticsUpgrade('protocols_logistics_auth_required')",
                    label: 'Sign In To Optimize',
                    icon: '&#128274;',
                    disabledAttr: ''
                };
            }

            if (isLogisticsLocked) {
                return {
                    action: "window.promptProtocolsLogisticsUpgrade && window.promptProtocolsLogisticsUpgrade('protocols_logistics_button')",
                    label: isAuthenticated ? 'Unlock Ultimate Access' : 'Sign In To Continue',
                    icon: '&#128274;',
                    disabledAttr: ''
                };
            }

            return {
                action: 'runRouteOptimization()',
                label: 'Optimize Route',
                icon: '&#129514;',
                disabledAttr: 'disabled'
            };
        };
    }

    if (typeof protocolsUtils.routePlannerBuildShellHtml !== 'function') {
        protocolsUtils.routePlannerBuildShellHtml = function routePlannerBuildShellHtml(payload) {
            return `
            <div class="${payload.isEmbedded ? 'h-full flex flex-col' : 'p-4 space-y-4 pb-24'}">
                <header class="flex items-center gap-3 mb-6 ${payload.isEmbedded ? 'hidden' : ''}">
                    <button onclick="window.alidadeApp.navigateTo('HOME')" class="p-2 -ml-2 rounded-full hover:bg-void-800 text-zinc-400 hover:text-white transition-colors">
                        ${payload.arrowLeftIcon}
                    </button>
                    <div class="flex-1">
                        <h1 class="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                            <span class="text-signal-amber">🗺️</span> ROUTE OPTIMIZER
                        </h1>
                        <p class="text-zinc-400 text-sm">TSP solver with real-world constraints</p>
                    </div>
                </header>

                <div class="${payload.isEmbedded ? 'flex-1 overflow-y-auto pr-1 space-y-4 pb-20' : 'space-y-4'}">
                <div id="route-planner-shell" class="relative space-y-4">

                <div class="bg-void-900/50 border border-void-800 rounded-machined p-4">
                    <label for="start-location" class="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Starting Point</label>
                    <select id="start-location" name="start_location" class="w-full bg-void-800 border border-void-700 rounded-machined p-3 text-white">
                        <option value="hotel">🏨 My Hotel / Riad</option>
                        <option value="jemaa">🌅 Jemaa el-Fnaa</option>
                        <option value="gueliz">🏙️ Gueliz (New Town)</option>
                        <option value="current">📍 Current Location</option>
                    </select>
                </div>

                <div class="bg-void-900/50 border border-void-800 rounded-machined p-4">
                    <div class="flex justify-between items-center mb-3">
                        <label class="text-zinc-400 text-xs uppercase tracking-wider">Select Destinations</label>
                        <div class="flex items-center gap-3">
                             <button onclick="clearSelections()" class="text-xs text-zinc-500 hover:text-white underline decoration-zinc-700 hover:decoration-white transition-colors">
                                Reset
                            </button>
                            <span id="dest-count" class="text-signal-amber text-sm font-mono">${payload.savedSelectionCount} selected</span>
                        </div>
                    </div>
                    
                    <div class="flex gap-2 overflow-x-auto pb-2 no-scrollbar mb-3">
                        <button class="dest-tab active whitespace-nowrap px-3 py-1.5 rounded-full bg-signal-amber/20 text-amber-400 border border-signal-amber/30 text-xs font-medium" data-cat="landmarks">🏛️ Landmarks</button>
                        <button class="dest-tab whitespace-nowrap px-3 py-1.5 rounded-full bg-void-800/50 text-zinc-400 border border-void-700/30 text-xs font-medium" data-cat="souks">🧥 Souks</button>
                        <button class="dest-tab whitespace-nowrap px-3 py-1.5 rounded-full bg-void-800/50 text-zinc-400 border border-void-700/30 text-xs font-medium" data-cat="restaurants">🍽️ Food</button>
                        <button class="dest-tab whitespace-nowrap px-3 py-1.5 rounded-full bg-void-800/50 text-zinc-400 border border-void-700/30 text-xs font-medium" data-cat="experiences">🧖 Experiences</button>
                    </div>

                    <div id="dest-list" class="space-y-2 max-h-[300px] overflow-y-auto"></div>
                </div>

                <div class="bg-void-900/50 border border-void-800 rounded-machined p-4">
                    <label class="text-zinc-400 text-xs uppercase tracking-wider mb-3 block">Trip Settings</label>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="start-time" class="text-zinc-500 text-xs block mb-1">Start Time</label>
                            <input type="time" id="start-time" name="start_time" value="09:00" class="w-full bg-void-800 border border-void-700 rounded-machined p-2 text-white">
                        </div>
                        <div>
                            <label for="walking-pace" class="text-zinc-500 text-xs block mb-1">Walking Pace</label>
                            <select id="walking-pace" name="walking_pace" class="w-full bg-void-800 border border-void-700 rounded-machined p-2 text-white">
                                <option value="3">🐢 Slow (3 km/h)</option>
                                <option value="4" selected>🚶 Normal (4 km/h)</option>
                                <option value="5">🏃 Fast (5 km/h)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div id="protocols-logistics-usage-indicator" class="px-3 py-2 rounded-machined border border-void-700 bg-void-900/40">
                    <p id="protocols-logistics-usage-value" class="text-signal-amber text-xs font-mono uppercase tracking-widest">${payload.logisticsUsageText}</p>
                    <p id="protocols-logistics-usage-meta" class="text-[10px] text-zinc-500 mt-1 font-mono">${payload.logisticsUsageMeta}</p>
                </div>

                <button id="optimize-btn" onclick="${payload.optimizeButtonAction}" class="w-full py-4 rounded-machined bg-signal-amber text-black font-bold text-lg hover:bg-amber-400 transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(245,158,11,0.3)] disabled:opacity-50 disabled:cursor-not-allowed" ${payload.optimizeButtonDisabled}>
                    <span>${payload.optimizeButtonIcon}</span> ${payload.optimizeButtonLabel}
                </button>

                <div id="route-results" class="hidden"></div>
                ${payload.lockedOverlayHtml}
                </div>
                </div>
            </div>
        `;
        };
    }

    if (typeof protocolsUtils.routePlannerRenderShell !== 'function') {
        protocolsUtils.routePlannerRenderShell = function routePlannerRenderShell(options) {
            const {
                containerId,
                documentObj,
                localStorageObj,
                getProtocolsLogisticsGateStatusFn,
                isProtocolsLogisticsAuthRequiredFn,
                isLicenseUserAuthenticatedFn,
                getProtocolsLogisticsUsageTextFn,
                getProtocolsLogisticsUsageMetaFn,
                renderProtocolsLogisticsGlassOverlayFn,
                trackLockImpressionFn,
                iconsObj,
                renderDestinationListFn,
                setupRoutePlannerListenersFn,
                syncProtocolsLogisticsLockUiFn,
                licenseManagerObj,
                consoleObj
            } = options || {};

            const container = documentObj.getElementById(containerId);
            if (!container) return false;

            const isEmbedded = containerId !== 'app';
            const savedSelections = JSON.parse(localStorageObj.getItem('routePlannerSelections') || '[]');
            const logisticsState = typeof getProtocolsLogisticsGateStatusFn === 'function'
                ? getProtocolsLogisticsGateStatusFn()
                : { locked: false };
            const logisticsAuthRequired = typeof isProtocolsLogisticsAuthRequiredFn === 'function'
                ? isProtocolsLogisticsAuthRequiredFn()
                : false;
            const isLogisticsLocked = !!logisticsState.locked;

            const optimizeButtonState = typeof protocolsUtils.routePlannerResolveOptimizeButtonState === 'function'
                ? protocolsUtils.routePlannerResolveOptimizeButtonState(
                    logisticsAuthRequired,
                    isLogisticsLocked,
                    typeof isLicenseUserAuthenticatedFn === 'function' && isLicenseUserAuthenticatedFn()
                )
                : {
                    action: 'runRouteOptimization()',
                    label: 'Optimize Route',
                    icon: '&#129514;',
                    disabledAttr: 'disabled'
                };

            const logisticsUsageText = typeof getProtocolsLogisticsUsageTextFn === 'function'
                ? getProtocolsLogisticsUsageTextFn(logisticsState)
                : '';
            const logisticsUsageMeta = typeof getProtocolsLogisticsUsageMetaFn === 'function'
                ? getProtocolsLogisticsUsageMetaFn(logisticsState)
                : '';

            if (logisticsAuthRequired && typeof trackLockImpressionFn === 'function') {
                trackLockImpressionFn('LOGISTICS_AUTH', 'protocols_logistics_auth_gate');
            } else if (isLogisticsLocked && typeof trackLockImpressionFn === 'function') {
                trackLockImpressionFn('PROTOCOLS_LOGISTICS_OPTIMIZE', 'protocols_logistics_tab');
            }

            const lockedOverlayHtml = isLogisticsLocked && typeof renderProtocolsLogisticsGlassOverlayFn === 'function'
                ? renderProtocolsLogisticsGlassOverlayFn(logisticsState)
                : '';

            const shellHtml = typeof protocolsUtils.routePlannerBuildShellHtml === 'function'
                ? protocolsUtils.routePlannerBuildShellHtml({
                    isEmbedded,
                    savedSelectionCount: savedSelections.length,
                    arrowLeftIcon: iconsObj?.arrowLeft || '',
                    logisticsUsageText,
                    logisticsUsageMeta,
                    optimizeButtonAction: optimizeButtonState.action,
                    optimizeButtonLabel: optimizeButtonState.label,
                    optimizeButtonIcon: optimizeButtonState.icon,
                    optimizeButtonDisabled: optimizeButtonState.disabledAttr,
                    lockedOverlayHtml
                })
                : '';

            container.innerHTML = shellHtml;

            if (typeof renderDestinationListFn === 'function') {
                renderDestinationListFn('landmarks', savedSelections);
            }
            if (typeof setupRoutePlannerListenersFn === 'function') {
                setupRoutePlannerListenersFn(savedSelections);
            }
            if (typeof syncProtocolsLogisticsLockUiFn === 'function') {
                syncProtocolsLogisticsLockUiFn();
            }

            const refreshUsage = licenseManagerObj?.refreshLogisticsUsage;
            if (typeof refreshUsage === 'function') {
                refreshUsage.call(licenseManagerObj)
                    .catch((error) => {
                        if (consoleObj && typeof consoleObj.warn === 'function') {
                            consoleObj.warn('[LOGISTICS] Failed to refresh usage on render:', error);
                        }
                    })
                    .finally(() => {
                        if (typeof syncProtocolsLogisticsLockUiFn === 'function') {
                            syncProtocolsLogisticsLockUiFn();
                        }
                        if (typeof windowObj.updateDestinationCount === 'function') {
                            windowObj.updateDestinationCount();
                        }
                    });
            }

            return true;
        };
    }

    if (typeof protocolsUtils.routePlannerClearSelectionsFlow !== 'function') {
        protocolsUtils.routePlannerClearSelectionsFlow = function routePlannerClearSelectionsFlow(
            localStorageObj,
            documentObj,
            renderRoutePlannerFn,
            updateDestinationCountFn,
            toggleDestinationSelectionFn
        ) {
            localStorageObj.removeItem('routePlannerSelections');
            if (typeof renderRoutePlannerFn === 'function') {
                renderRoutePlannerFn(documentObj.getElementById('route-planner-container') ? 'route-planner-container' : 'protocol-content');
            }
            if (typeof updateDestinationCountFn === 'function') {
                updateDestinationCountFn();
            }
            documentObj.querySelectorAll('.dest-checkbox').forEach((checkbox) => {
                checkbox.checked = false;
                if (typeof toggleDestinationSelectionFn === 'function') {
                    toggleDestinationSelectionFn(checkbox.dataset.id, false);
                }
            });
            return true;
        };
    }

    if (typeof protocolsUtils.routePlannerSetupListenersFlow !== 'function') {
        protocolsUtils.routePlannerSetupListenersFlow = function routePlannerSetupListenersFlow(
            documentObj,
            renderDestinationListFn,
            updateDestinationCountFn
        ) {
            documentObj.querySelectorAll('.dest-tab').forEach((tab) => {
                tab.addEventListener('click', () => {
                    documentObj.querySelectorAll('.dest-tab').forEach((entry) => {
                        entry.classList.remove('bg-signal-amber/20', 'text-amber-400', 'border-signal-amber/30');
                        entry.classList.add('bg-void-800/50', 'text-zinc-400', 'border-void-700/30');
                    });

                    tab.classList.remove('bg-void-800/50', 'text-zinc-400', 'border-void-700/30');
                    tab.classList.add('bg-signal-amber/20', 'text-amber-400', 'border-signal-amber/30');

                    if (typeof renderDestinationListFn === 'function') {
                        renderDestinationListFn(tab.dataset.cat);
                    }
                });
            });

            if (typeof updateDestinationCountFn === 'function') {
                updateDestinationCountFn();
            }
            return true;
        };
    }
})(typeof window !== 'undefined' ? window : null);
