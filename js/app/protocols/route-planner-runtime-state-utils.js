/**
 * ALIDADE Route Planner Runtime State Utilities
 * Extracted from route planner runtime flow with compatibility hooks.
 */
(function bootstrapRoutePlannerRuntimeStateUtils(windowObj) {
    if (!windowObj) return;

    const protocolsUtils = windowObj.ALIDADE_PROTOCOLS_UTILS || (windowObj.ALIDADE_PROTOCOLS_UTILS = {});

    if (typeof protocolsUtils.routePlannerGetOptimizeButtonUi !== 'function') {
        protocolsUtils.routePlannerGetOptimizeButtonUi = function routePlannerGetOptimizeButtonUi(
            count,
            logisticsAuthRequired,
            isLocked,
            isAuthenticated
        ) {
            if (logisticsAuthRequired) {
                return {
                    disabled: false,
                    html: '<span>🔐</span> Sign In To Optimize',
                    onClick: "window.promptProtocolsLogisticsUpgrade && window.promptProtocolsLogisticsUpgrade('protocols_logistics_auth_required')"
                };
            }

            if (isLocked) {
                return {
                    disabled: false,
                    html: `<span>🔒</span> ${isAuthenticated ? 'Unlock Ultimate Access' : 'Sign In To Continue'}`,
                    onClick: "window.promptProtocolsLogisticsUpgrade && window.promptProtocolsLogisticsUpgrade('protocols_logistics_button')"
                };
            }

            return {
                disabled: count < 2,
                html: '<span>🧮</span> Optimize Route',
                onClick: 'runRouteOptimization()'
            };
        };
    }

    if (typeof protocolsUtils.routePlannerEnforceMealSelectionLimit !== 'function') {
        protocolsUtils.routePlannerEnforceMealSelectionLimit = function routePlannerEnforceMealSelectionLimit(selectedIds, allPlaces) {
            let normalizedIds = Array.isArray(selectedIds) ? [...selectedIds] : [];
            const restoSpots = normalizedIds.filter(id => {
                const place = allPlaces.find(item => item.id === id);
                return place && (place.category === 'restaurant' || place.type === 'restaurant' || place.id.includes('dest_2'));
            });

            if (restoSpots.length > 2) {
                const toRemove = restoSpots.slice(2);
                normalizedIds = normalizedIds.filter(id => !toRemove.includes(id));
                return {
                    selectedIds: normalizedIds,
                    didTrim: true
                };
            }

            return {
                selectedIds: normalizedIds,
                didTrim: false
            };
        };
    }

    if (typeof protocolsUtils.routePlannerGetPostRunButtonUi !== 'function') {
        protocolsUtils.routePlannerGetPostRunButtonUi = function routePlannerGetPostRunButtonUi(
            logisticsAuthRequired,
            isLocked,
            isAuthenticated
        ) {
            if (logisticsAuthRequired) {
                return {
                    disabled: false,
                    html: '<span>🔐</span> Sign In To Optimize',
                    onClick: "window.promptProtocolsLogisticsUpgrade && window.promptProtocolsLogisticsUpgrade('protocols_logistics_auth_required')",
                    syncLockUi: true
                };
            }

            if (isLocked) {
                return {
                    disabled: false,
                    html: `<span>🔒</span> ${isAuthenticated ? 'Unlock Ultimate Access' : 'Sign In To Continue'}`,
                    onClick: "window.promptProtocolsLogisticsUpgrade && window.promptProtocolsLogisticsUpgrade('protocols_logistics_button')",
                    syncLockUi: true
                };
            }

            return {
                disabled: false,
                html: '<span>🧮</span> Optimize Route',
                onClick: 'runRouteOptimization()',
                syncLockUi: false
            };
        };
    }

    if (typeof protocolsUtils.routePlannerUpdateDestinationCountFlow !== 'function') {
        protocolsUtils.routePlannerUpdateDestinationCountFlow = function routePlannerUpdateDestinationCountFlow(options) {
            const {
                localStorageObj,
                documentObj,
                getProtocolsLogisticsGateStatusFn,
                isProtocolsLogisticsAuthRequiredFn,
                isLicenseUserAuthenticatedFn,
                syncProtocolsLogisticsLockUiFn
            } = options || {};

            const selections = JSON.parse(localStorageObj.getItem('routePlannerSelections') || '[]');
            const count = selections.length;
            const countEl = documentObj.getElementById('dest-count');
            const btn = documentObj.getElementById('optimize-btn');
            const logisticsState = typeof getProtocolsLogisticsGateStatusFn === 'function'
                ? getProtocolsLogisticsGateStatusFn()
                : { locked: false };
            const logisticsAuthRequired = typeof isProtocolsLogisticsAuthRequiredFn === 'function'
                ? isProtocolsLogisticsAuthRequiredFn()
                : false;

            if (countEl) countEl.textContent = `${count} selected`;

            if (btn) {
                if (typeof protocolsUtils.routePlannerGetOptimizeButtonUi === 'function') {
                    const state = protocolsUtils.routePlannerGetOptimizeButtonUi(
                        count,
                        logisticsAuthRequired,
                        logisticsState.locked,
                        typeof isLicenseUserAuthenticatedFn === 'function' && isLicenseUserAuthenticatedFn()
                    );
                    btn.disabled = state.disabled;
                    btn.innerHTML = state.html;
                    btn.setAttribute('onclick', state.onClick);
                } else {
                    btn.disabled = count < 2;
                    btn.innerHTML = '<span>🧮</span> Optimize Route';
                    btn.setAttribute('onclick', 'runRouteOptimization()');
                }
            }

            if (typeof syncProtocolsLogisticsLockUiFn === 'function') {
                syncProtocolsLogisticsLockUiFn();
            }

            return count;
        };
    }
})(typeof window !== 'undefined' ? window : null);
