/**
 * ALIDADE Tier Config Data
 * Extracted static tier/auth constants from app.js.
 */
(function registerAlidadeTierConfig(windowObj) {
    if (!windowObj) return;

    const VALID_KEYS = {
        ULTIMATE: 'ultimate_10_key',
        BASIC: 'basic_free_key',
        LITE: 'lite_5_key' // Legacy alias
    };

    const TIER_DATA = {
        BASIC: {
            label: 'BASIC',
            badgeColor: 'bg-void-800',
            badgeTextColor: 'text-zinc-400',
            accentColor: 'void-700',
            accentColorHover: 'void-600',
            systemStatus: 'SYSTEM: BASIC MODE',
            statusColor: 'text-zinc-400',
            googleMapsLink: '#',
            offlineFile: 'assets/lite.kmz',
            offlineLabel: 'LITE ARCHIVE',
            intelUnlocked: false,
            fortressUnlocked: false,
            protocolsUnlocked: false
        },
        ULTIMATE: {
            label: 'ULTIMATE',
            badgeColor: 'bg-signal-amber/10',
            badgeTextColor: 'text-signal-amber',
            accentColor: 'signal-amber',
            accentColorHover: 'signal-amber',
            systemStatus: 'SYSTEM: UNRESTRICTED',
            statusColor: 'text-signal-amber',
            googleMapsLink: 'https://www.google.com/maps/d/edit?mid=1sEbJdSv-yY95y62vJUxVo-wOTjNdUkM&usp=sharing',
            offlineFile: 'assets/ultimate.kmz',
            offlineLabel: 'FULL ARCHIVE',
            intelUnlocked: true,
            fortressUnlocked: true,
            protocolsUnlocked: true
        }
    };

    windowObj.ALIDADE_TIER_CONFIG = windowObj.ALIDADE_TIER_CONFIG || {};
    windowObj.ALIDADE_TIER_CONFIG.VALID_KEYS = VALID_KEYS;
    windowObj.ALIDADE_TIER_CONFIG.TIER_DATA = TIER_DATA;
})(typeof window !== 'undefined' ? window : null);
