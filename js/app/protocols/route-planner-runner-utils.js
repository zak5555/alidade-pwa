/**
 * ALIDADE Route Planner Runner Utilities
 * Extracted from route planner runtime optimization flow.
 */
(function bootstrapRoutePlannerRunnerUtils(windowObj) {
    if (!windowObj) return;

    const protocolsUtils = windowObj.ALIDADE_PROTOCOLS_UTILS || (windowObj.ALIDADE_PROTOCOLS_UTILS = {});

    if (typeof protocolsUtils.routePlannerBuildConstraints !== 'function') {
        protocolsUtils.routePlannerBuildConstraints = function routePlannerBuildConstraints(startTimeValue) {
            const startTimeStr = startTimeValue || '09:00';
            const [h, m] = startTimeStr.split(':').map(Number);

            return {
                startTime: (h * 60) + m,
                maxWalkDistance: 3.0,
                taxiTime: 30,
                respectPrayer: true,
                insertBreaks: true,
                finishBeforeSunset: true
            };
        };
    }

    if (typeof protocolsUtils.routePlannerResolveStartNode !== 'function') {
        protocolsUtils.routePlannerResolveStartNode = function routePlannerResolveStartNode(startValue) {
            const startLocations = {
                hotel: { id: 'start', name: 'My Hotel / Riad', lat: 31.6295, lng: -7.9811, icon: '🏨' },
                jemaa: { id: 'start', name: 'Jemaa el-Fnaa', lat: 31.6259, lng: -7.9892, icon: '📍' },
                gueliz: { id: 'start', name: 'Gueliz Center', lat: 31.6358, lng: -8.0103, icon: '🏙️' },
                current: { id: 'start', name: 'Current Location', lat: 31.6295, lng: -7.9811, icon: '📍' }
            };

            return startLocations[startValue] || startLocations.hotel;
        };
    }

    if (typeof protocolsUtils.routePlannerApplyPostRunButtonState !== 'function') {
        protocolsUtils.routePlannerApplyPostRunButtonState = function routePlannerApplyPostRunButtonState(
            buttonEl,
            isAuthRequired,
            latestState,
            isAuthenticated,
            syncProtocolsLogisticsLockUiFn
        ) {
            if (!buttonEl) return false;

            const uiState = typeof protocolsUtils.routePlannerGetPostRunButtonUi === 'function'
                ? protocolsUtils.routePlannerGetPostRunButtonUi(isAuthRequired, !!latestState?.locked, isAuthenticated)
                : null;

            if (uiState) {
                buttonEl.disabled = uiState.disabled;
                buttonEl.innerHTML = uiState.html;
                buttonEl.setAttribute('onclick', uiState.onClick);
                if (uiState.syncLockUi && typeof syncProtocolsLogisticsLockUiFn === 'function') {
                    syncProtocolsLogisticsLockUiFn();
                }
                return true;
            }

            if (isAuthRequired) {
                buttonEl.disabled = false;
                buttonEl.innerHTML = '<span>🔐</span> Sign In To Optimize';
                buttonEl.setAttribute('onclick', "window.promptProtocolsLogisticsUpgrade && window.promptProtocolsLogisticsUpgrade('protocols_logistics_auth_required')");
                if (typeof syncProtocolsLogisticsLockUiFn === 'function') syncProtocolsLogisticsLockUiFn();
                return true;
            }

            if (latestState?.locked) {
                buttonEl.disabled = false;
                buttonEl.innerHTML = `<span>🔒</span> ${isAuthenticated ? 'Unlock Ultimate Access' : 'Sign In To Continue'}`;
                buttonEl.setAttribute('onclick', "window.promptProtocolsLogisticsUpgrade && window.promptProtocolsLogisticsUpgrade('protocols_logistics_button')");
                if (typeof syncProtocolsLogisticsLockUiFn === 'function') syncProtocolsLogisticsLockUiFn();
                return true;
            }

            buttonEl.disabled = false;
            buttonEl.innerHTML = '<span>🧮</span> Optimize Route';
            buttonEl.setAttribute('onclick', 'runRouteOptimization()');
            return true;
        };
    }

    if (typeof protocolsUtils.routePlannerResolveSelectedIds !== 'function') {
        protocolsUtils.routePlannerResolveSelectedIds = function routePlannerResolveSelectedIds(
            getSelectedDestinationIdsFn,
            localStorageObj
        ) {
            if (typeof getSelectedDestinationIdsFn === 'function') {
                return getSelectedDestinationIdsFn() || [];
            }
            return JSON.parse(localStorageObj.getItem('routePlannerSelections') || '[]');
        };
    }

    if (typeof protocolsUtils.routePlannerNormalizeSelectedIds !== 'function') {
        protocolsUtils.routePlannerNormalizeSelectedIds = function routePlannerNormalizeSelectedIds(
            selectedIds,
            allPlaces,
            localStorageObj
        ) {
            if (typeof protocolsUtils.routePlannerEnforceMealSelectionLimit === 'function') {
                const normalized = protocolsUtils.routePlannerEnforceMealSelectionLimit(selectedIds, allPlaces);
                if (normalized.didTrim) {
                    localStorageObj.setItem('routePlannerSelections', JSON.stringify(normalized.selectedIds));
                }
                return normalized.selectedIds;
            }

            const restoSpots = selectedIds.filter((id) => {
                const place = allPlaces.find((entry) => entry.id === id);
                return place && (place.category === 'restaurant' || place.type === 'restaurant' || place.id.includes('dest_2'));
            });

            if (restoSpots.length > 2) {
                const toRemove = restoSpots.slice(2);
                const normalizedIds = selectedIds.filter((id) => !toRemove.includes(id));
                localStorageObj.setItem('routePlannerSelections', JSON.stringify(normalizedIds));
                return normalizedIds;
            }

            return selectedIds;
        };
    }

    if (typeof protocolsUtils.routePlannerResolveConstraints !== 'function') {
        protocolsUtils.routePlannerResolveConstraints = function routePlannerResolveConstraints(startTimeStr) {
            if (typeof protocolsUtils.routePlannerBuildConstraints === 'function') {
                return protocolsUtils.routePlannerBuildConstraints(startTimeStr);
            }
            const [h, m] = (startTimeStr || '09:00').split(':').map(Number);
            return {
                startTime: (h * 60) + m,
                maxWalkDistance: 3.0,
                taxiTime: 30,
                respectPrayer: true,
                insertBreaks: true,
                finishBeforeSunset: true
            };
        };
    }

    if (typeof protocolsUtils.routePlannerResolveStartPoint !== 'function') {
        protocolsUtils.routePlannerResolveStartPoint = function routePlannerResolveStartPoint(startValue) {
            if (typeof protocolsUtils.routePlannerResolveStartNode === 'function') {
                return protocolsUtils.routePlannerResolveStartNode(startValue);
            }
            return { id: 'start', name: 'My Hotel / Riad', lat: 31.6295, lng: -7.9811, icon: '🏨' };
        };
    }

    if (typeof protocolsUtils.routePlannerRenderResultsFlow !== 'function') {
        protocolsUtils.routePlannerRenderResultsFlow = function routePlannerRenderResultsFlow(windowObjParam, documentObj, result) {
            windowObjParam.lastRouteResult = result;

            const resultsContainer = documentObj.getElementById('route-results');
            if (!resultsContainer) return false;

            resultsContainer.classList.remove('hidden');

            if (!documentObj.getElementById('protocol-anim-styles')) {
                const style = documentObj.createElement('style');
                style.id = 'protocol-anim-styles';
                style.textContent = `
                    .reveal-stagger { opacity: 0; transform: translateY(10px); animation: revealUp 0.4s ease forwards; }
                    @keyframes revealUp { to { opacity: 1; transform: translateY(0); } }
                `;
                documentObj.head.appendChild(style);
            }

            const droppedHTML = typeof protocolsUtils.routePlannerBuildDroppedHtml === 'function'
                ? protocolsUtils.routePlannerBuildDroppedHtml(result.dropped)
                : '';
            const hazardsHTML = typeof protocolsUtils.routePlannerBuildHazardsHtml === 'function'
                ? protocolsUtils.routePlannerBuildHazardsHtml(result.route || [])
                : '';
            const securitySection = typeof protocolsUtils.routePlannerBuildSecuritySection === 'function'
                ? protocolsUtils.routePlannerBuildSecuritySection(hazardsHTML)
                : '';
            let vectorContext = null;
            if (windowObjParam?.contextEngine && typeof windowObjParam.contextEngine.getContext === 'function') {
                try {
                    vectorContext = windowObjParam.contextEngine.getContext('vector');
                } catch (_error) {
                    vectorContext = null;
                }
            }
            const smartRouteHintHTML = typeof protocolsUtils.routePlannerBuildSmartRouteHintHtml === 'function'
                ? protocolsUtils.routePlannerBuildSmartRouteHintHtml({
                    routeHint: vectorContext?.routeHint || null,
                    vectorContext,
                    result
                })
                : '';
            const timelineHTML = typeof protocolsUtils.routePlannerBuildTimelineHtml === 'function'
                ? protocolsUtils.routePlannerBuildTimelineHtml(result.stops || [])
                : '';

            resultsContainer.innerHTML = `
            <div class="reveal-stagger bg-zinc-900 border border-amber-500/20 rounded-xl mb-4 overflow-hidden shadow-2xl" style="animation-delay: 0.1s">
                <div class="bg-gradient-to-r from-amber-900/20 to-zinc-900 p-4 flex justify-between items-end">
                    <div>
                        <div class="text-[10px] text-amber-500 font-mono uppercase mb-1">Mission Specs</div>
                        <div class="text-2xl font-bold text-white tracking-tight">
                            ${result.totalDistance.toFixed(1)} <span class="text-sm font-normal text-zinc-500">KM</span>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-xl font-bold text-white">
                            ${Math.floor(result.totalTime / 60)}<span class="text-sm text-zinc-500">h</span>
                            ${Math.round(result.totalTime % 60)}<span class="text-sm text-zinc-500">m</span>
                        </div>
                        <div class="text-[10px] text-zinc-500 font-mono">${result.valid.totalStops} STOPS</div>
                    </div>
                </div>
            </div>

            ${smartRouteHintHTML}

            <div class="reveal-stagger p-5 bg-zinc-900/40 rounded-xl border border-zinc-800 mb-4" style="animation-delay: 0.2s">
                ${timelineHTML}
                <div class="mt-4 pt-3 border-t border-zinc-800 flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                    <span class="flex items-center gap-1 text-emerald-500">✅ OPTIMIZED</span>
                    <span>PROTOCOL-7 v11.0-ACTION</span>
                </div>
            </div>

            ${droppedHTML ? `<div class="reveal-stagger mb-4" style="animation-delay: 0.4s">${droppedHTML}</div>` : ''}
            ${securitySection ? `<div class="reveal-stagger mb-6" style="animation-delay: 0.5s">${securitySection}</div>` : ''}

            <div class="reveal-stagger flex gap-2" style="animation-delay: 0.6s">
                <button onclick="exportToGoogleMaps()" class="flex-1 py-3 rounded-lg bg-zinc-800 text-white font-bold text-sm hover:bg-zinc-700 transition-all border border-zinc-700">🗺️ GOOGLE MAPS</button>
                <button onclick="shareRoute()" class="flex-1 py-3 rounded-lg bg-zinc-800 text-white font-bold text-sm hover:bg-zinc-700 transition-all border border-zinc-700">📤 SHARE MISSION</button>
            </div>
        `;
            return true;
        };
    }

    if (typeof protocolsUtils.routePlannerResolveExportUrl !== 'function') {
        protocolsUtils.routePlannerResolveExportUrl = function routePlannerResolveExportUrl(result) {
            if (!result || !result.stops) return '';
            if (typeof protocolsUtils.routePlannerBuildGoogleMapsUrl === 'function') {
                return protocolsUtils.routePlannerBuildGoogleMapsUrl(result.stops);
            }

            const coords = result.stops.map((stop) => `${stop.place.lat},${stop.place.lng}`);
            const origin = coords[0];
            const destination = coords[coords.length - 1];
            const waypoints = coords.slice(1, -1).join('|');
            return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=walking`;
        };
    }

    if (typeof protocolsUtils.routePlannerResolveShareText !== 'function') {
        protocolsUtils.routePlannerResolveShareText = function routePlannerResolveShareText(result) {
            if (!result) return '';
            if (typeof protocolsUtils.routePlannerBuildSimpleShareText === 'function') {
                return protocolsUtils.routePlannerBuildSimpleShareText(result);
            }

            const stops = (result.route || [])
                .filter((stop) => stop.type === 'destination')
                .map((stop, index) => `${index + 1}. ${stop.name}`)
                .join('\n');
            return `🗺️ My Marrakech Route\n\n${stops}\n\n📏 ${result.totalDistance.toFixed(1)} km total\n⏱️ ${Math.round(result.totalTime / 60)} hours\n\nOptimized by ALIDADE`;
        };
    }

    if (typeof protocolsUtils.routePlannerRunOptimizationFlow !== 'function') {
        protocolsUtils.routePlannerRunOptimizationFlow = function routePlannerRunOptimizationFlow(options) {
            const {
                windowObjParam,
                documentObj,
                localStorageObj,
                setTimeoutFn,
                getProtocolsLogisticsGateStatusFn,
                isProtocolsLogisticsAuthRequiredFn,
                openProtocolsAuthModalFn,
                promptProtocolsLogisticsUpgradeFn,
                getSelectedDestinationIdsFn,
                allDestinations,
                IntelligentRoutePlannerCtor,
                displayRouteResultsFn,
                normalizeTierTagFn,
                userTier,
                consumeFeatureUsageFn,
                optimizeFeatureKey,
                syncProtocolsLogisticsLockUiFn,
                isLicenseUserAuthenticatedFn,
                consoleObj
            } = options || {};

            const logisticsState = typeof getProtocolsLogisticsGateStatusFn === 'function'
                ? getProtocolsLogisticsGateStatusFn()
                : { locked: false };

            if (typeof isProtocolsLogisticsAuthRequiredFn === 'function' && isProtocolsLogisticsAuthRequiredFn()) {
                if (typeof openProtocolsAuthModalFn === 'function') {
                    openProtocolsAuthModalFn(logisticsState, 'protocols_logistics_auth_required');
                }
                return false;
            }

            if (logisticsState.locked) {
                if (typeof promptProtocolsLogisticsUpgradeFn === 'function') {
                    promptProtocolsLogisticsUpgradeFn('protocols_logistics_run_blocked');
                }
                return false;
            }

            const resultsDiv = documentObj.getElementById('route-results');
            const btn = documentObj.getElementById('optimize-btn');
            if (!resultsDiv || !btn) return false;

            btn.disabled = true;
            btn.innerHTML = '<span class="animate-spin">⏳</span> Optimizing...';

            setTimeoutFn(() => {
                try {
                    const allPlaces = allDestinations;
                    if (!allPlaces || !allPlaces.length) {
                        throw new Error('Destination database not loaded.');
                    }

                    const selectedIdsRaw = typeof protocolsUtils.routePlannerResolveSelectedIds === 'function'
                        ? protocolsUtils.routePlannerResolveSelectedIds(getSelectedDestinationIdsFn, localStorageObj)
                        : [];
                    const selectedIds = typeof protocolsUtils.routePlannerNormalizeSelectedIds === 'function'
                        ? protocolsUtils.routePlannerNormalizeSelectedIds(selectedIdsRaw, allPlaces, localStorageObj)
                        : selectedIdsRaw;

                    const selectedDests = allPlaces.filter((dest) => selectedIds.includes(dest.id));
                    const startTimeStr = documentObj.getElementById('start-time')?.value || '09:00';
                    const constraints = typeof protocolsUtils.routePlannerResolveConstraints === 'function'
                        ? protocolsUtils.routePlannerResolveConstraints(startTimeStr)
                        : { startTime: 9 * 60, maxWalkDistance: 3.0, taxiTime: 30 };

                    const startVal = documentObj.getElementById('start-location')?.value || 'hotel';
                    const startNode = typeof protocolsUtils.routePlannerResolveStartPoint === 'function'
                        ? protocolsUtils.routePlannerResolveStartPoint(startVal)
                        : { id: 'start', name: 'My Hotel / Riad', lat: 31.6295, lng: -7.9811, icon: '🏨' };

                    const placesToVisit = [startNode, ...selectedDests];
                    const planner = new IntelligentRoutePlannerCtor(placesToVisit, constraints);
                    const result = planner.optimize();
                    if (typeof displayRouteResultsFn === 'function') {
                        displayRouteResultsFn(result, planner);
                    }

                    const tier = typeof normalizeTierTagFn === 'function'
                        ? normalizeTierTagFn(userTier || windowObjParam.USER_TIER || 'BASIC')
                        : 'BASIC';
                    if (tier !== 'ULTIMATE' && typeof consumeFeatureUsageFn === 'function') {
                        const usage = consumeFeatureUsageFn(optimizeFeatureKey);
                        if (usage.limit !== -1 && usage.count >= usage.limit) {
                            if (typeof syncProtocolsLogisticsLockUiFn === 'function') {
                                syncProtocolsLogisticsLockUiFn();
                            }
                            if (!(typeof isLicenseUserAuthenticatedFn === 'function' && isLicenseUserAuthenticatedFn())) {
                                if (typeof openProtocolsAuthModalFn === 'function' && typeof getProtocolsLogisticsGateStatusFn === 'function') {
                                    openProtocolsAuthModalFn(getProtocolsLogisticsGateStatusFn(), 'protocols_logistics_limit_reached');
                                }
                            }
                        }
                    }
                } catch (error) {
                    if (consoleObj && typeof consoleObj.error === 'function') {
                        consoleObj.error(error);
                    }
                    resultsDiv.innerHTML = `<div class="p-4 text-red-400 border border-red-500 rounded">Error: ${error.message}</div>`;
                    resultsDiv.classList.remove('hidden');
                }

                const latestState = typeof getProtocolsLogisticsGateStatusFn === 'function'
                    ? getProtocolsLogisticsGateStatusFn()
                    : { locked: false };
                const authRequired = typeof isProtocolsLogisticsAuthRequiredFn === 'function'
                    ? isProtocolsLogisticsAuthRequiredFn()
                    : false;
                const isAuthenticated = typeof isLicenseUserAuthenticatedFn === 'function'
                    ? isLicenseUserAuthenticatedFn()
                    : false;

                if (typeof protocolsUtils.routePlannerApplyPostRunButtonState === 'function') {
                    protocolsUtils.routePlannerApplyPostRunButtonState(
                        btn,
                        authRequired,
                        latestState,
                        isAuthenticated,
                        syncProtocolsLogisticsLockUiFn
                    );
                }
            }, 100);

            return true;
        };
    }

    if (typeof protocolsUtils.routePlannerExportToGoogleMapsFlow !== 'function') {
        protocolsUtils.routePlannerExportToGoogleMapsFlow = function routePlannerExportToGoogleMapsFlow(windowObjParam, result) {
            const url = typeof protocolsUtils.routePlannerResolveExportUrl === 'function'
                ? protocolsUtils.routePlannerResolveExportUrl(result)
                : '';
            if (!url) return false;
            windowObjParam.open(url, '_blank');
            return true;
        };
    }

    if (typeof protocolsUtils.routePlannerShareRouteFlow !== 'function') {
        protocolsUtils.routePlannerShareRouteFlow = function routePlannerShareRouteFlow(
            result,
            navigatorObj,
            showToastFn,
            alertFn
        ) {
            const text = typeof protocolsUtils.routePlannerResolveShareText === 'function'
                ? protocolsUtils.routePlannerResolveShareText(result)
                : '';
            if (!text) return false;

            if (navigatorObj.share) {
                navigatorObj.share({ text });
                return true;
            }

            navigatorObj.clipboard.writeText(text);
            if (typeof showToastFn === 'function') {
                showToastFn('Route copied to clipboard!', 'success');
            } else if (typeof alertFn === 'function') {
                alertFn('Route copied to clipboard!');
            }
            return true;
        };
    }
})(typeof window !== 'undefined' ? window : null);
