/**
 * ALIDADE Runtime Interaction Wiring Utilities
 * Extracted from legacy app.js with adapter hooks.
 */
(function bootstrapRuntimeInteractionUtils(windowObj) {
    if (!windowObj) return;

    const runtimeUtils = windowObj.ALIDADE_RUNTIME_UTILS || (windowObj.ALIDADE_RUNTIME_UTILS = {});

    if (typeof runtimeUtils.initializeInteractionRuntime !== 'function') {
        runtimeUtils.initializeInteractionRuntime = function initializeInteractionRuntime(adapter = {}) {
            const target = adapter.windowObj || windowObj;
            const doc = adapter.document || target.document;
            if (!target || !doc) return;

            const triggerHaptics = typeof adapter.triggerHaptics === 'function'
                ? adapter.triggerHaptics
                : () => { };
            const navigateTo = typeof adapter.navigateTo === 'function'
                ? adapter.navigateTo
                : () => { };
            const getRequiredTierForView = typeof adapter.getRequiredTierForView === 'function'
                ? adapter.getRequiredTierForView
                : () => 'BASIC';
            const checkAccess = typeof adapter.checkAccess === 'function'
                ? adapter.checkAccess
                : null;
            const getCurrentView = typeof adapter.getCurrentView === 'function'
                ? adapter.getCurrentView
                : () => 'HOME';
            const log = typeof adapter.log === 'function'
                ? adapter.log
                : (...args) => console.log(...args);

            const KEYBOARD_SHORTCUTS = {
                // Number keys for quick module access
                '1': 'SOUK',
                '2': 'DEFENSE',
                '3': 'ORGANIC_LAB',
                '4': 'INTEL',
                '5': 'FORTRESS',
                '6': 'PROTOCOLS',
                '7': 'VECTOR',
                '8': 'PHRASES'
            };

            function handleKeyboardShortcuts(event) {
                // Don't trigger if user is typing in an input
                const active = doc.activeElement;
                if (active?.tagName === 'INPUT' ||
                    active?.tagName === 'TEXTAREA' ||
                    active?.isContentEditable) {
                    return;
                }

                // Escape - Go back to home
                if (event.key === 'Escape') {
                    event.preventDefault();
                    triggerHaptics('light');
                    navigateTo('HOME');
                    return;
                }

                // Ctrl/Cmd + H - Go home
                if ((event.ctrlKey || event.metaKey) && event.key === 'h') {
                    event.preventDefault();
                    triggerHaptics('light');
                    navigateTo('HOME');
                    return;
                }

                // Number keys for quick navigation (when not holding modifier)
                if (!event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
                    const targetView = KEYBOARD_SHORTCUTS[event.key];
                    if (targetView) {
                        event.preventDefault();
                        triggerHaptics('medium');

                        const requiredTier = getRequiredTierForView(targetView);
                        if (requiredTier !== 'BASIC' && typeof checkAccess === 'function') {
                            checkAccess(requiredTier, () => navigateTo(targetView), targetView);
                        } else {
                            navigateTo(targetView);
                        }
                        return;
                    }
                }

                // Ctrl/Cmd + B - Toggle back (if not on home)
                if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
                    event.preventDefault();
                    if (getCurrentView() !== 'HOME') {
                        triggerHaptics('light');
                        navigateTo('HOME');
                    }
                }
            }

            // Register keyboard listener
            doc.addEventListener('keydown', handleKeyboardShortcuts);
            log('[ALIDADE] \u2328\uFE0F Keyboard shortcuts initialized');

            // Apply view-enter animation to app container on each render
            const originalNavigateTo = navigateTo;
            target.alidadeApp = target.alidadeApp || {};
            target.alidadeApp.navigateTo = function (view) {
                const app = doc.getElementById('app');
                if (app) {
                    // Remove existing animation classes
                    app.classList.remove('view-enter', 'view-exit');
                    // Trigger reflow
                    void app.offsetWidth;
                    // Add enter animation
                    app.classList.add('view-enter');
                }
                originalNavigateTo(view);
            };
        };
    }
})(typeof window !== 'undefined' ? window : null);
