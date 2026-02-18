/**
 * ALIDADE Route Planner Selection Utilities
 * Extracted from route planner selection flow with compatibility hooks.
 */
(function bootstrapRoutePlannerSelectionUtils(windowObj) {
    if (!windowObj) return;

    const protocolsUtils = windowObj.ALIDADE_PROTOCOLS_UTILS || (windowObj.ALIDADE_PROTOCOLS_UTILS = {});

    if (typeof protocolsUtils.routePlannerIsLunchPlace !== 'function') {
        protocolsUtils.routePlannerIsLunchPlace = function routePlannerIsLunchPlace(place) {
            if (!place) return false;
            const text = (place.intel || '') + (place.tips || '') + (place.name || '') + (place.category || '');
            return text.toLowerCase().includes('lunch only') ||
                /restaurant|cafe|dining|food|dinner|bistro|terrace|rooftop|nomad|clock|fassia|lamine|amal/i.test(text);
        };
    }

    if (typeof protocolsUtils.routePlannerResolveSelectionToggle !== 'function') {
        protocolsUtils.routePlannerResolveSelectionToggle = function routePlannerResolveSelectionToggle(
            selections,
            id,
            isChecked,
            allDestinations,
            isLunchPlace
        ) {
            let nextSelections = Array.isArray(selections) ? [...selections] : [];
            let replacedLunchId = null;

            const clickedPlace = allDestinations.find(place => place.id === id);

            if (isChecked) {
                // 🛑 CONFLICT CHECK 1: LUNCH SPOTS
                // If picking a lunch place, remove any existing lunch place
                if (isLunchPlace(clickedPlace)) {
                    const currentLunch = nextSelections.find(selectedId => {
                        const place = allDestinations.find(item => item.id === selectedId);
                        return isLunchPlace(place);
                    });

                    if (currentLunch) {
                        replacedLunchId = currentLunch;
                        nextSelections = nextSelections.filter(selectedId => selectedId !== currentLunch);
                    }
                }

                // Add new selection
                if (!nextSelections.includes(id)) nextSelections.push(id);
            } else {
                // Remove selection
                nextSelections = nextSelections.filter(itemId => itemId !== id);
            }

            return {
                selections: nextSelections,
                replacedLunchId
            };
        };
    }

    if (typeof protocolsUtils.routePlannerApplyReplacedLunchVisual !== 'function') {
        protocolsUtils.routePlannerApplyReplacedLunchVisual = function routePlannerApplyReplacedLunchVisual(
            documentObj,
            replacedLunchId
        ) {
            if (!replacedLunchId) return false;

            const oldCheckbox = documentObj.querySelector(`input[data-id="${replacedLunchId}"]`);
            if (oldCheckbox) {
                oldCheckbox.checked = false;
                const card = oldCheckbox.closest('label');
                if (card) {
                    card.classList.remove('bg-signal-amber/10', 'border-signal-amber/30');
                    card.classList.add('bg-void-800/30', 'border-void-700/30');
                }
            }
            return true;
        };
    }

    if (typeof protocolsUtils.routePlannerApplySelectionCardVisual !== 'function') {
        protocolsUtils.routePlannerApplySelectionCardVisual = function routePlannerApplySelectionCardVisual(
            documentObj,
            id,
            isChecked
        ) {
            const checkbox = documentObj.querySelector(`input[data-id="${id}"]`);
            if (!checkbox) return false;

            const card = checkbox.closest('label');
            if (!card) return false;

            if (isChecked) {
                card.classList.remove('bg-void-800/30', 'border-void-700/30');
                card.classList.add('bg-signal-amber/10', 'border-signal-amber/30');
            } else {
                card.classList.remove('bg-signal-amber/10', 'border-signal-amber/30');
                card.classList.add('bg-void-800/30', 'border-void-700/30');
            }
            return true;
        };
    }

    if (typeof protocolsUtils.routePlannerToggleSelectionFlow !== 'function') {
        protocolsUtils.routePlannerToggleSelectionFlow = function routePlannerToggleSelectionFlow(options) {
            const {
                id,
                isChecked,
                localStorageObj,
                allDestinations,
                isLunchPlaceFn,
                documentObj,
                updateDestinationCountFn
            } = options || {};

            let selections = JSON.parse(localStorageObj.getItem('routePlannerSelections') || '[]');
            let replacedLunchId = null;

            if (typeof protocolsUtils.routePlannerResolveSelectionToggle === 'function') {
                const nextState = protocolsUtils.routePlannerResolveSelectionToggle(
                    selections,
                    id,
                    isChecked,
                    allDestinations,
                    isLunchPlaceFn
                );
                selections = nextState.selections;
                replacedLunchId = nextState.replacedLunchId;
            }

            if (typeof protocolsUtils.routePlannerApplyReplacedLunchVisual === 'function') {
                protocolsUtils.routePlannerApplyReplacedLunchVisual(documentObj, replacedLunchId);
            }

            localStorageObj.setItem('routePlannerSelections', JSON.stringify(selections));

            if (typeof updateDestinationCountFn === 'function') {
                updateDestinationCountFn();
            }

            if (typeof protocolsUtils.routePlannerApplySelectionCardVisual === 'function') {
                protocolsUtils.routePlannerApplySelectionCardVisual(documentObj, id, isChecked);
            }

            return {
                selections,
                replacedLunchId
            };
        };
    }
})(typeof window !== 'undefined' ? window : null);
