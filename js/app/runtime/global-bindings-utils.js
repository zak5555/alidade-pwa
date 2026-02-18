/**
 * ALIDADE Runtime Global Bindings Utilities
 * Extracted from legacy app.js with adapter hooks.
 */
(function bootstrapRuntimeGlobalBindingsUtils(windowObj) {
    if (!windowObj) return;

    const runtimeUtils = windowObj.ALIDADE_RUNTIME_UTILS || (windowObj.ALIDADE_RUNTIME_UTILS = {});

    if (typeof runtimeUtils.initializeAppGlobalBindings !== 'function') {
        runtimeUtils.initializeAppGlobalBindings = function initializeAppGlobalBindings(adapter = {}) {
            const target = adapter.windowObj || windowObj;
            if (!target) return;

            const navigateTo = typeof adapter.navigateTo === 'function'
                ? adapter.navigateTo
                : () => { };
            const renderSettingsOverlay = typeof adapter.renderSettingsOverlay === 'function'
                ? adapter.renderSettingsOverlay
                : () => { };
            const closeSettingsOverlay = typeof adapter.closeSettingsOverlay === 'function'
                ? adapter.closeSettingsOverlay
                : () => { };
            const renderApp = typeof adapter.renderApp === 'function'
                ? adapter.renderApp
                : () => { };
            const checkAccess = typeof adapter.checkAccess === 'function'
                ? adapter.checkAccess
                : null;
            const showAccessDeniedModal = typeof adapter.showAccessDeniedModal === 'function'
                ? adapter.showAccessDeniedModal
                : null;
            const getI18n = typeof adapter.getI18n === 'function'
                ? adapter.getI18n
                : () => target.i18n;

            // Expose navigation function globally for inline onclick handlers
            target.alidadeApp = {
                navigateTo,
                renderSettingsOverlay,
                closeSettingsOverlay,
                render: renderApp,
                setLanguage: async function (lang) {
                    const i18n = getI18n();
                    if (i18n) {
                        await i18n.setLanguage(lang);
                        closeSettingsOverlay();
                        renderApp();
                    }
                }
            };
            if (checkAccess) {
                target.checkAccess = checkAccess;
            }
            if (showAccessDeniedModal) {
                target.showAccessDeniedModal = showAccessDeniedModal;
            }
        };
    }
})(typeof window !== 'undefined' ? window : null);
