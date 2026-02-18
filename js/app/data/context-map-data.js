/**
 * ALIDADE Context + Map Data
 * Extracted static map/context constants from app.js.
 */
(function registerAlidadeContextMapData(windowObj) {
    if (!windowObj) return;

    const PRAYER_TIMES = {
        fajr: { start: 6, end: 7 },
        dhuhr: { start: 13, end: 14 },  // Main constraint
        asr: { start: 16, end: 17 },
        maghrib: { start: 19, end: 20 },
        isha: { start: 21, end: 22 }
    };

    const SOUK_LANDMARKS = {
        jemaa: { lat: 31.6259, lng: -7.9893, radius: 250, name: 'Jemaa el-Fnaa', markup: 'HIGH' },
        souks_main: { lat: 31.6285, lng: -7.9868, radius: 300, name: 'Main Souks', markup: 'MEDIUM' },
        souks_interior: { lat: 31.6310, lng: -7.9855, radius: 250, name: 'Inner Souks', markup: 'LOW' },
        workshops: { lat: 31.6340, lng: -7.9830, radius: 350, name: 'Artisan Workshops', markup: 'NONE' },
        gueliz: { lat: 31.6345, lng: -7.9997, radius: 400, name: 'Gueliz (Modern)', markup: 'LOW' },
        mellah: { lat: 31.6215, lng: -7.9850, radius: 200, name: 'Mellah (Jewish Quarter)', markup: 'MEDIUM' }
    };

    const CONTEXT_NEGOTIATION_TACTICS = Object.freeze({
        not_tourist: {
            id: 'not_tourist',
            label: 'Signal local familiarity',
            hint: 'Use local references and neutral body language.'
        },
        walk_away_threat: {
            id: 'walk_away_threat',
            label: 'Controlled walk-away',
            hint: 'Pause the deal and step back to reset leverage.'
        },
        comparison_shop: {
            id: 'comparison_shop',
            label: 'Reference nearby options',
            hint: 'Mention comparable stalls before countering.'
        },
        gentle_lower: {
            id: 'gentle_lower',
            label: 'Gentle incremental drop',
            hint: 'Use small counter-offers to keep rapport.'
        },
        bulk_discount: {
            id: 'bulk_discount',
            label: 'Bundle discount angle',
            hint: 'Anchor lower by offering multi-item purchase.'
        },
        quality_question: {
            id: 'quality_question',
            label: 'Challenge quality details',
            hint: 'Ask about origin, material, and workmanship.'
        },
        friend_recommendation: {
            id: 'friend_recommendation',
            label: 'Leverage referral framing',
            hint: 'Frame as a recommendation-based purchase.'
        }
    });

    const CONTEXT_AREA_BOUNDS = [
        { name: 'jemaa', bounds: { north: 31.6270, south: 31.6250, east: -7.9870, west: -7.9910 } },
        { name: 'souks_main', bounds: { north: 31.6320, south: 31.6260, east: -7.9840, west: -7.9900 } },
        { name: 'souks_interior', bounds: { north: 31.6338, south: 31.6290, east: -7.9820, west: -7.9880 } },
        { name: 'workshops', bounds: { north: 31.6360, south: 31.6310, east: -7.9800, west: -7.9860 } },
        { name: 'mellah', bounds: { north: 31.6230, south: 31.6200, east: -7.9820, west: -7.9885 } },
        { name: 'gueliz', bounds: { north: 31.6370, south: 31.6310, east: -7.9960, west: -8.0040 } }
    ];

    windowObj.ALIDADE_CONTEXT_MAP_DATA = windowObj.ALIDADE_CONTEXT_MAP_DATA || {};
    windowObj.ALIDADE_CONTEXT_MAP_DATA.PRAYER_TIMES = PRAYER_TIMES;
    windowObj.ALIDADE_CONTEXT_MAP_DATA.SOUK_LANDMARKS = SOUK_LANDMARKS;
    windowObj.ALIDADE_CONTEXT_MAP_DATA.CONTEXT_NEGOTIATION_TACTICS = CONTEXT_NEGOTIATION_TACTICS;
    windowObj.ALIDADE_CONTEXT_MAP_DATA.CONTEXT_AREA_BOUNDS = CONTEXT_AREA_BOUNDS;
})(typeof window !== 'undefined' ? window : null);
