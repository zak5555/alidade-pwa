/**
 * ALIDADE Access Action Utilities
 * Extracted from legacy app.js with adapter hooks.
 */
(function bootstrapAccessActionUtils(windowObj) {
    if (!windowObj) return;

    const accessUtils = windowObj.ALIDADE_ACCESS_UTILS || (windowObj.ALIDADE_ACCESS_UTILS = {});

    if (typeof accessUtils.ensureAiScannerAccess !== 'function') {
        accessUtils.ensureAiScannerAccess = function ensureAiScannerAccess(source = 'souk_scanner', adapter = {}) {
            const getFeatureUsageStatus = typeof adapter.getFeatureUsageStatus === 'function'
                ? adapter.getFeatureUsageStatus
                : accessUtils.getFeatureUsageStatus;
            const scannerStatus = getFeatureUsageStatus ? getFeatureUsageStatus('ai_scanner') : { allowed: true };
            if (scannerStatus.allowed) return true;

            if (typeof adapter.trackLockImpression === 'function') {
                adapter.trackLockImpression('MARKET', source);
            } else if (typeof accessUtils.trackLockImpression === 'function') {
                accessUtils.trackLockImpression('MARKET', source);
            }

            if (typeof adapter.showAccessDeniedModal === 'function') {
                adapter.showAccessDeniedModal('ULTIMATE', 'MARKET');
            } else if (typeof windowObj.showAccessDeniedModal === 'function') {
                windowObj.showAccessDeniedModal('ULTIMATE', 'MARKET');
            }

            return false;
        };
    }

    if (typeof accessUtils.promptProtocolsUpgrade !== 'function') {
        accessUtils.promptProtocolsUpgrade = function promptProtocolsUpgrade(featureKey, source, adapter = {}) {
            const normalizedFeature = String(featureKey || 'PROTOCOLS').trim().toUpperCase();
            const normalizedSource = String(source || 'protocols_lock').trim();

            if (typeof adapter.trackLockImpression === 'function') {
                adapter.trackLockImpression(normalizedFeature, normalizedSource);
            } else if (typeof accessUtils.trackLockImpression === 'function') {
                accessUtils.trackLockImpression(normalizedFeature, normalizedSource);
            }

            if (typeof adapter.trackTierFunnelEvent === 'function') {
                adapter.trackTierFunnelEvent('click_upgrade', {
                    source: normalizedSource,
                    feature: normalizedFeature
                });
            } else if (typeof accessUtils.trackTierFunnelEvent === 'function') {
                accessUtils.trackTierFunnelEvent('click_upgrade', {
                    source: normalizedSource,
                    feature: normalizedFeature
                });
            }

            if (typeof adapter.showUpgradeModal === 'function') {
                adapter.showUpgradeModal('ultimate', normalizedFeature);
            } else if (typeof windowObj.showUpgradeModal === 'function') {
                windowObj.showUpgradeModal('ultimate', normalizedFeature);
            }

            return normalizedFeature;
        };
    }

    if (typeof accessUtils.promptProtocolsWalletUpgrade !== 'function') {
        accessUtils.promptProtocolsWalletUpgrade = function promptProtocolsWalletUpgrade(source = 'protocols_wallet_execute', adapter = {}) {
            const promptUpgrade = typeof adapter.promptProtocolsUpgrade === 'function'
                ? adapter.promptProtocolsUpgrade
                : accessUtils.promptProtocolsUpgrade;
            return promptUpgrade('PROTOCOLS_WALLET_EXECUTE', source);
        };
    }
})(typeof window !== 'undefined' ? window : null);
