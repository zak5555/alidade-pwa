/**
 * ALIDADE Logistics Runtime Utilities
 * Extracted from legacy app.js with adapter hooks.
 */
(function bootstrapLogisticsRuntimeUtils(windowObj) {
    if (!windowObj) return;

    const accessUtils = windowObj.ALIDADE_ACCESS_UTILS || (windowObj.ALIDADE_ACCESS_UTILS = {});

    if (typeof accessUtils.setupProtocolsLogisticsRuntime !== 'function') {
        accessUtils.setupProtocolsLogisticsRuntime = function setupProtocolsLogisticsRuntime(adapter = {}) {
            const target = adapter.windowObj || windowObj;
            if (!target) return;

            if (typeof adapter.promptProtocolsWalletUpgrade === 'function') {
                target.promptProtocolsWalletUpgrade = adapter.promptProtocolsWalletUpgrade;
            }
            if (typeof adapter.promptProtocolsLogisticsUpgrade === 'function') {
                target.promptProtocolsLogisticsUpgrade = adapter.promptProtocolsLogisticsUpgrade;
            }
            if (typeof adapter.openProtocolsAuthModal === 'function') {
                target.openProtocolsAuthModal = adapter.openProtocolsAuthModal;
            }

            if (typeof target.addEventListener !== 'function') return;

            target.addEventListener('alidade:auth-change', () => {
                const licenseManager = typeof adapter.getLicenseManager === 'function'
                    ? adapter.getLicenseManager()
                    : target.licenseManager;
                const refreshUsage = licenseManager?.refreshLogisticsUsage;
                const syncLockUi = typeof adapter.syncProtocolsLogisticsLockUi === 'function'
                    ? adapter.syncProtocolsLogisticsLockUi
                    : accessUtils.syncProtocolsLogisticsLockUi;
                const updateDestinationCount = typeof adapter.updateDestinationCount === 'function'
                    ? adapter.updateDestinationCount
                    : () => { };
                const warn = typeof adapter.warn === 'function'
                    ? adapter.warn
                    : (...args) => console.warn(...args);

                if (typeof refreshUsage === 'function') {
                    refreshUsage.call(licenseManager)
                        .catch((error) => warn('[LOGISTICS] Failed to refresh usage after auth change:', error))
                        .finally(() => {
                            if (typeof syncLockUi === 'function') {
                                syncLockUi();
                            }
                            updateDestinationCount();
                        });
                    return;
                }

                if (typeof syncLockUi === 'function') {
                    syncLockUi();
                }
                updateDestinationCount();
            });
        };
    }
})(typeof window !== 'undefined' ? window : null);
