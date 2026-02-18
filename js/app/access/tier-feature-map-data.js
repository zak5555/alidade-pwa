/**
 * ALIDADE Tier Feature Map Data
 * Extracted static tier requirement and upgrade context maps from app.js.
 */
(function registerAlidadeTierFeatureMaps(windowObj) {
    if (!windowObj) return;

    const VIEW_TIER_REQUIREMENTS = Object.freeze({
        HOME: 'BASIC',
        SOUK: 'BASIC',
        NEGOTIATION: 'BASIC',
        PRODUCT_FORENSICS: 'BASIC',
        CERAMICS: 'BASIC',
        LEATHER: 'BASIC',
        RUGS: 'BASIC',
        METALS: 'BASIC',
        TRANSPORT: 'BASIC',
        DEFENSE: 'BASIC',
        ORGANIC_LAB: 'ULTIMATE',
        INTEL: 'BASIC',
        FORTRESS: 'ULTIMATE',
        PROTOCOLS: 'BASIC',
        VECTOR: 'ULTIMATE',
        PHRASES: 'BASIC',
        MARKET: 'ULTIMATE'
    });

    const UPGRADE_CONTEXT_MAP = Object.freeze({
        DEFENSE: {
            title: 'Threat Matrix Pro',
            label: 'DEFENSE',
            preview: 'Preview mode shows baseline safety only. Ultimate adds full trap archetypes and escalation scripts.',
            benefits: ['Advanced SOS workflows', 'Deep threat playbooks', 'Faster danger recognition']
        },
        ORGANIC_LAB: {
            title: 'Organic Lab Full',
            label: 'ORGANIC_LAB',
            preview: 'Preview mode gives a limited food safety baseline.',
            benefits: ['Premium datasets', 'Advanced contamination checks', 'High-confidence tactical filters']
        },
        INTEL: {
            title: 'Intel Full Archive',
            label: 'INTEL',
            preview: 'Preview mode reveals only high-level scouting information.',
            benefits: ['Hidden gems full index', 'Risk-tagged location notes', 'Priority extraction routes']
        },
        FORTRESS: {
            title: 'Fortress Full Protocols',
            label: 'FORTRESS',
            preview: 'Preview mode keeps only a minimal personal safety baseline.',
            benefits: ['Solo safety playbooks', 'Contextual threat responses', 'Expanded rapid-exit routines']
        },
        PROTOCOLS: {
            title: 'Classified Briefing Archive',
            label: 'PROTOCOLS',
            preview: 'Basic reveals only 15-20% itinerary preview. Ultimate unlocks full daily waypoints and route tactics.',
            benefits: ['Full 5-day tactical archive', 'Waypoint-by-waypoint anti-scam tactics', 'Live tactical planner handoff']
        },
        VECTOR: {
            title: 'Vector HUD Advanced',
            label: 'VECTOR',
            preview: 'Preview mode is navigation baseline only.',
            benefits: ['Advanced route overlays', 'Live tactical map workflows', 'Enhanced orientation tools']
        },
        MARKET: {
            title: 'Market Intelligence Pro',
            label: 'MARKET',
            preview: 'Preview mode limits market intelligence depth.',
            benefits: ['Premium datasets', 'Advanced filters', 'Batch tactical operations']
        },
        LIVE_TACTICAL_MAP: {
            title: 'Live Tactical Map',
            label: 'LIVE_TACTICAL_MAP',
            preview: 'Basic includes offline Lite archive only.',
            benefits: ['Live map coordinates', 'Dynamic route updates', 'Full tactical overlays']
        },
        OFFLINE_ARCHIVE: {
            title: 'Offline Full Archive',
            label: 'OFFLINE_ARCHIVE',
            preview: 'Basic receives Lite pack. Full archive is Ultimate-only.',
            benefits: ['Complete offline dossier', 'Expanded point-of-interest coverage', 'Higher-value mission layers']
        },
        PHRASES_FULL_ARCHIVE: {
            title: 'Language Bridge Full Archive',
            label: 'PHRASES_FULL_ARCHIVE',
            preview: 'Basic includes critical phrase subset only.',
            benefits: ['Full phrase catalog', 'All categories unlocked', 'Advanced practice coverage']
        },
        PROTOCOLS_WALLET_EXECUTE: {
            title: 'Smart Wallet Execute',
            label: 'PROTOCOLS_WALLET_EXECUTE',
            preview: 'Wallet intelligence remains visible in Basic. Transaction execution is Ultimate-only.',
            benefits: ['Live transaction execution', 'Full spend tracking workflows', 'Advanced anti-overpay alerts']
        },
        PROTOCOLS_LOGISTICS_OPTIMIZE: {
            title: 'Logistics Optimizer Unlimited',
            label: 'PROTOCOLS_LOGISTICS_OPTIMIZE',
            preview: 'Basic includes 3 free route optimizations. Ultimate unlocks unlimited tactical planning.',
            benefits: ['Unlimited route optimizations', 'Continuous tactical replanning', 'Advanced itinerary stress tests']
        }
    });

    windowObj.ALIDADE_TIER_FEATURE_MAP = windowObj.ALIDADE_TIER_FEATURE_MAP || {};
    windowObj.ALIDADE_TIER_FEATURE_MAP.VIEW_TIER_REQUIREMENTS = VIEW_TIER_REQUIREMENTS;
    windowObj.ALIDADE_TIER_FEATURE_MAP.UPGRADE_CONTEXT_MAP = UPGRADE_CONTEXT_MAP;
})(typeof window !== 'undefined' ? window : null);
