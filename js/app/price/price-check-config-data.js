/**
 * ALIDADE Price Check Config + Data
 * Extracted from app.js with compatibility globals.
 */
(function bootstrapPriceCheckConfigData(windowObj) {
    if (!windowObj) return;
const CONFIG = {
    SIMULATION_MODE: false, // ? REAL AI ENABLED
    ONLINE_MODE: true,      // Enable Cloud Recognition

    // -----------------------------------------------------------
    // VISION API CONFIGURATION - CHOOSE ONE (Comment others)
    // -----------------------------------------------------------

    // ? OPTION 1: GEMINI (RECOMMENDED - FREE & RELIABLE)
    VISION_API: 'GEMINI',
    GEMINI_API_KEY: 'AIzaSyBF6QlFAMOiO-ENBhL9PZQ731G4xEmWmig', // Your key
    GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    GEMINI_MODEL: 'gemini-2.5-flash', // ? CORRECT model name

    // OPTION 2: OPENROUTER (FREE FALLBACK)
    // VISION_API: 'OPENROUTER',
    OPENROUTER_API_KEY: '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',
    OPENROUTER_ENDPOINT: 'https://openrouter.ai/api/v1/chat/completions',
    OPENROUTER_MODEL: 'qwen/qwen2-vl-7b-instruct:free', // ? FIXED: Working free vision model

    // OPTION 3: DEEPSEEK (PAID BUT CHEAP)
    // VISION_API: 'DEEPSEEK',
    DEEPSEEK_API_KEY: 'sk-be2f568180b24db2966041ba1f91e1b0',
    DEEPSEEK_ENDPOINT: 'https://api.deepseek.com/v1/chat/completions',
    DEEPSEEK_MODEL: 'deepseek-chat', // ? CORRECT model name (deepseek-vl doesn't exist)

    // Legacy endpoints (kept for fallback)
    MODEL_URL: 'https://api.alidade.app/models/souk-classifier/model.json',
    API_URL: 'https://api.alidade.app/prices',

    // AI Configuration
    CONFIDENCE_THRESHOLD: 0.1,
    ANALYSIS_TIMEOUT: 10000,
    IMAGE_SIZE: 224,
    MAX_RETRIES: 2,
    TIMEOUT: 5000,

    // -----------------------------------------------------------
    // SUPABASE CROWDSOURCE CONFIG
    // -----------------------------------------------------------
    SUPABASE_URL: 'https://tynugwtetlclqowlguai.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5bnVnd3RldGxjbHFvd2xndWFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2ODgwNDQsImV4cCI6MjA4NjI2NDA0NH0.I2QFBzVVMJDzrFbJnPSdqV4dQK-SEKEx7IprdE-vmD0',
    CROWD_PRICE_ENDPOINT: 'https://tynugwtetlclqowlguai.supabase.co/rest/v1/crowd_prices',
    PRICE_STATS_ENDPOINT: 'https://tynugwtetlclqowlguai.supabase.co/rest/v1/price_stats',
    CROWD_DATA_TIMEOUT: 2000,  // ms - don't block UI for crowd data
    CROWD_MIN_SAMPLES: 3,     // Minimum crowd reports to trust crowd data
};

// Item categories the model can recognize
const ITEM_LABELS = [
    // --- Legacy ---
    'leather_bag', 'leather_shoes', 'leather_wallet', 'leather_belt', 'leather_pouf',
    'ceramic_plate', 'ceramic_tagine', 'ceramic_bowl', 'ceramic_tile',
    'rug_small', 'rug_medium', 'rug_large', 'rug_runner',
    'lantern_metal', 'lantern_glass', 'lantern_brass',
    'spices_mixed', 'argan_oil', 'saffron', 'ras_el_hanout',
    'jewelry_silver', 'jewelry_gold', 'jewelry_berber',
    'babouche_plain', 'babouche_embroidered',
    'djellaba', 'kaftan', 'scarf_silk', 'scarf_wool',
    'tagine_pot_large', 'tagine_pot_small', 'teapot_silver', 'tea_glasses',
    // --- Safety Net (Generics) ---
    'generic_leather', 'generic_ceramic', 'generic_rug',
    'generic_metal', 'generic_textile', 'generic_food', 'generic_item'
];

// Human-readable names (FIX 4: Added new Gemini API item IDs)
const ITEM_DISPLAY_NAMES = {
    // === NEW GEMINI SPECIFIC IDs ===
    'tagine_pot_large': '🍲 Tagine Pot (Large)',
    'tagine_pot_small': '🍲 Tagine Pot (Small)',
    'teapot_silver': '🍵 Silver Teapot',
    'tea_glasses': '🍵 Tea Glasses (Set)',
    'leather_pouf': '🛋️ Leather Pouf',

    // === LEGACY IDs (Kept for compatibility) ===
    'leather_bag': '👜 Leather Bag',
    'leather_shoes': '👞 Leather Shoes',
    'leather_wallet': '👝 Leather Wallet',
    'leather_belt': '🧵 Leather Belt',
    'ceramic_plate': '🍽️ Ceramic Plate',
    'ceramic_tagine': '🏺 Ceramic Tagine',
    'ceramic_bowl': '🥣 Ceramic Bowl',
    'ceramic_tile': '🧱 Zellige Tile',
    'rug_small': '🧶 Small Rug (1-2m²)',
    'rug_medium': '🧶 Medium Rug (2-4m²)',
    'rug_large': '🧶 Large Rug (4m²+)',
    'rug_runner': '🧶 Runner Rug',
    'lantern_metal': '🏮 Metal Lantern',
    'lantern_glass': '🏮 Glass Lantern',
    'lantern_brass': '🏮 Brass Lantern',
    'spices_mixed': '🌶️ Mixed Spices',
    'argan_oil': '🧴 Argan Oil',
    'saffron': '🌼 Saffron',
    'ras_el_hanout': '🧂 Ras el Hanout',
    'jewelry_silver': '💍 Silver Jewelry',
    'jewelry_gold': '💍 Gold Jewelry',
    'jewelry_berber': '📿 Berber Jewelry',
    'babouche_plain': '👡 Plain Babouche',
    'babouche_embroidered': '👡 Embroidered Babouche',
    'djellaba': '👘 Djellaba',
    'kaftan': '👗 Kaftan',
    'scarf_silk': '🧣 Silk Scarf',
    'scarf_wool': '🧣 Wool Scarf',

    // === GENERIC SAFETY NET (The Hybrid Net) ===
    'generic_leather': '👜 Leather Item (General)',
    'generic_ceramic': '🏺 Ceramic Item (General)',
    'generic_metal': '⚙️ Metal Handicraft',
    'generic_textile': '🧵 Textile/Fabric',
    'generic_food': '🍯 Food/Consumable',
    'generic_item': '📦 Unidentified Item'
};

// -------------------------------------------------------------------
// PRICE DATABASE V2 - Enhanced with quality brackets + location factors
// Source: Field research, artisan interviews, 2024-2025 market surveys
// -------------------------------------------------------------------

const PRICE_DATABASE_V2 = {
    // -- LEATHER --------------------------------------------------
    'leather_bag': {
        minimum: 400, p25: 600, median: 850, p75: 1100, maximum: 1500, mean: 880,
        sampleSize: 52, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.85,
        qualityBrackets: {
            low: { multiplier: 0.6, median: 510 },
            medium: { multiplier: 1.0, median: 850 },
            high: { multiplier: 1.8, median: 1530 },
            premium: { multiplier: 2.5, median: 2125 }
        },
        locationFactors: { jemaa: 1.4, souks_main: 1.2, souks_interior: 1.0, workshops: 0.7, unknown: 1.0 }
    },
    'leather_shoes': {
        minimum: 200, p25: 350, median: 500, p75: 700, maximum: 1000, mean: 520,
        sampleSize: 38, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.80,
        qualityBrackets: {
            low: { multiplier: 0.6, median: 300 }, medium: { multiplier: 1.0, median: 500 },
            high: { multiplier: 1.6, median: 800 }, premium: { multiplier: 2.2, median: 1100 }
        },
        locationFactors: { jemaa: 1.3, souks_main: 1.15, souks_interior: 1.0, workshops: 0.75, unknown: 1.0 }
    },
    'leather_wallet': {
        minimum: 80, p25: 150, median: 250, p75: 350, maximum: 500, mean: 260,
        sampleSize: 45, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.82,
        qualityBrackets: {
            low: { multiplier: 0.6, median: 150 }, medium: { multiplier: 1.0, median: 250 },
            high: { multiplier: 1.7, median: 425 }, premium: { multiplier: 2.3, median: 575 }
        },
        locationFactors: { jemaa: 1.4, souks_main: 1.2, souks_interior: 1.0, workshops: 0.7, unknown: 1.0 }
    },
    'leather_belt': {
        minimum: 60, p25: 100, median: 180, p75: 250, maximum: 400, mean: 190,
        sampleSize: 30, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.75,
        qualityBrackets: {
            low: { multiplier: 0.6, median: 108 }, medium: { multiplier: 1.0, median: 180 },
            high: { multiplier: 1.6, median: 288 }, premium: { multiplier: 2.0, median: 360 }
        },
        locationFactors: { jemaa: 1.3, souks_main: 1.15, souks_interior: 1.0, workshops: 0.75, unknown: 1.0 }
    },
    'leather_pouf': {
        minimum: 150, p25: 250, median: 350, p75: 500, maximum: 800, mean: 380,
        sampleSize: 60, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.85,
        qualityBrackets: {
            low: { multiplier: 0.6, median: 210 }, medium: { multiplier: 1.0, median: 350 },
            high: { multiplier: 1.6, median: 560 }, premium: { multiplier: 2.2, median: 770 }
        },
        locationFactors: { jemaa: 1.3, souks_main: 1.15, souks_interior: 1.0, workshops: 0.7, unknown: 1.0 }
    },

    // -- CERAMICS --------------------------------------------------
    'ceramic_plate': {
        minimum: 50, p25: 80, median: 120, p75: 180, maximum: 300, mean: 130,
        sampleSize: 67, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.88,
        qualityBrackets: {
            low: { multiplier: 0.5, median: 60 }, medium: { multiplier: 1.0, median: 120 },
            high: { multiplier: 1.8, median: 216 }, premium: { multiplier: 3.0, median: 360 }
        },
        locationFactors: { jemaa: 1.5, souks_main: 1.2, souks_interior: 1.0, workshops: 0.65, unknown: 1.0 }
    },
    'ceramic_tagine': {
        minimum: 80, p25: 150, median: 250, p75: 400, maximum: 800, mean: 280,
        sampleSize: 55, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.83,
        qualityBrackets: {
            low: { multiplier: 0.5, median: 125 }, medium: { multiplier: 1.0, median: 250 },
            high: { multiplier: 1.8, median: 450 }, premium: { multiplier: 2.5, median: 625 }
        },
        locationFactors: { jemaa: 1.4, souks_main: 1.2, souks_interior: 1.0, workshops: 0.7, unknown: 1.0 }
    },
    'ceramic_bowl': {
        minimum: 30, p25: 60, median: 100, p75: 150, maximum: 250, mean: 105,
        sampleSize: 42, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.80,
        qualityBrackets: {
            low: { multiplier: 0.5, median: 50 }, medium: { multiplier: 1.0, median: 100 },
            high: { multiplier: 1.8, median: 180 }, premium: { multiplier: 2.8, median: 280 }
        },
        locationFactors: { jemaa: 1.5, souks_main: 1.2, souks_interior: 1.0, workshops: 0.65, unknown: 1.0 }
    },
    'ceramic_tile': {
        minimum: 20, p25: 40, median: 80, p75: 120, maximum: 200, mean: 85,
        sampleSize: 35, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.78,
        qualityBrackets: {
            low: { multiplier: 0.5, median: 40 }, medium: { multiplier: 1.0, median: 80 },
            high: { multiplier: 2.0, median: 160 }, premium: { multiplier: 3.0, median: 240 }
        },
        locationFactors: { jemaa: 1.3, souks_main: 1.15, souks_interior: 1.0, workshops: 0.7, unknown: 1.0 }
    },

    // -- RUGS -----------------------------------------------------
    'rug_small': {
        minimum: 400, p25: 700, median: 1200, p75: 2000, maximum: 4000, mean: 1350,
        sampleSize: 28, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.72,
        qualityBrackets: {
            low: { multiplier: 0.5, median: 600 }, medium: { multiplier: 1.0, median: 1200 },
            high: { multiplier: 2.0, median: 2400 }, premium: { multiplier: 3.5, median: 4200 }
        },
        locationFactors: { jemaa: 1.5, souks_main: 1.3, souks_interior: 1.0, workshops: 0.6, unknown: 1.0 }
    },
    'rug_medium': {
        minimum: 1500, p25: 2500, median: 4000, p75: 6000, maximum: 12000, mean: 4200,
        sampleSize: 22, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.68,
        qualityBrackets: {
            low: { multiplier: 0.5, median: 2000 }, medium: { multiplier: 1.0, median: 4000 },
            high: { multiplier: 2.0, median: 8000 }, premium: { multiplier: 3.0, median: 12000 }
        },
        locationFactors: { jemaa: 1.5, souks_main: 1.3, souks_interior: 1.0, workshops: 0.6, unknown: 1.0 }
    },
    'rug_large': {
        minimum: 3000, p25: 5000, median: 8000, p75: 12000, maximum: 25000, mean: 8500,
        sampleSize: 15, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.60,
        qualityBrackets: {
            low: { multiplier: 0.5, median: 4000 }, medium: { multiplier: 1.0, median: 8000 },
            high: { multiplier: 2.0, median: 16000 }, premium: { multiplier: 3.0, median: 24000 }
        },
        locationFactors: { jemaa: 1.6, souks_main: 1.3, souks_interior: 1.0, workshops: 0.55, unknown: 1.0 }
    },
    'rug_runner': {
        minimum: 500, p25: 900, median: 1500, p75: 2500, maximum: 5000, mean: 1650,
        sampleSize: 18, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.65,
        qualityBrackets: {
            low: { multiplier: 0.5, median: 750 }, medium: { multiplier: 1.0, median: 1500 },
            high: { multiplier: 2.0, median: 3000 }, premium: { multiplier: 3.0, median: 4500 }
        },
        locationFactors: { jemaa: 1.5, souks_main: 1.3, souks_interior: 1.0, workshops: 0.6, unknown: 1.0 }
    },

    // -- LANTERNS --------------------------------------------------
    'lantern_metal': {
        minimum: 100, p25: 200, median: 350, p75: 500, maximum: 800, mean: 370,
        sampleSize: 40, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.80,
        qualityBrackets: {
            low: { multiplier: 0.5, median: 175 }, medium: { multiplier: 1.0, median: 350 },
            high: { multiplier: 1.8, median: 630 }, premium: { multiplier: 2.5, median: 875 }
        },
        locationFactors: { jemaa: 1.4, souks_main: 1.2, souks_interior: 1.0, workshops: 0.7, unknown: 1.0 }
    },
    'lantern_glass': {
        minimum: 150, p25: 300, median: 500, p75: 750, maximum: 1200, mean: 530,
        sampleSize: 32, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.78,
        qualityBrackets: {
            low: { multiplier: 0.5, median: 250 }, medium: { multiplier: 1.0, median: 500 },
            high: { multiplier: 1.8, median: 900 }, premium: { multiplier: 2.5, median: 1250 }
        },
        locationFactors: { jemaa: 1.4, souks_main: 1.2, souks_interior: 1.0, workshops: 0.7, unknown: 1.0 }
    },
    'lantern_brass': {
        minimum: 300, p25: 600, median: 1000, p75: 1500, maximum: 2500, mean: 1050,
        sampleSize: 25, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.75,
        qualityBrackets: {
            low: { multiplier: 0.5, median: 500 }, medium: { multiplier: 1.0, median: 1000 },
            high: { multiplier: 1.8, median: 1800 }, premium: { multiplier: 2.5, median: 2500 }
        },
        locationFactors: { jemaa: 1.4, souks_main: 1.2, souks_interior: 1.0, workshops: 0.65, unknown: 1.0 }
    },

    // -- SPICES & FOOD ---------------------------------------------
    'spices_mixed': {
        minimum: 20, p25: 40, median: 80, p75: 150, maximum: 300, mean: 95,
        sampleSize: 60, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.85,
        qualityBrackets: {
            low: { multiplier: 0.5, median: 40 }, medium: { multiplier: 1.0, median: 80 },
            high: { multiplier: 1.5, median: 120 }, premium: { multiplier: 2.0, median: 160 }
        },
        locationFactors: { jemaa: 1.5, souks_main: 1.2, souks_interior: 1.0, workshops: 0.8, unknown: 1.0 }
    },
    'argan_oil': {
        minimum: 150, p25: 250, median: 400, p75: 600, maximum: 1000, mean: 420,
        sampleSize: 48, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.82,
        qualityBrackets: {
            low: { multiplier: 0.4, median: 160 }, medium: { multiplier: 1.0, median: 400 },
            high: { multiplier: 1.5, median: 600 }, premium: { multiplier: 2.0, median: 800 }
        },
        locationFactors: { jemaa: 1.6, souks_main: 1.3, souks_interior: 1.0, workshops: 0.7, unknown: 1.0 }
    },
    'saffron': {
        minimum: 30, p25: 60, median: 100, p75: 150, maximum: 300, mean: 110,
        sampleSize: 55, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.80,
        qualityBrackets: {
            low: { multiplier: 0.3, median: 30 }, medium: { multiplier: 1.0, median: 100 },
            high: { multiplier: 2.0, median: 200 }, premium: { multiplier: 3.0, median: 300 }
        },
        locationFactors: { jemaa: 1.8, souks_main: 1.3, souks_interior: 1.0, workshops: 0.7, unknown: 1.0 }
    },
    'ras_el_hanout': {
        minimum: 15, p25: 30, median: 60, p75: 100, maximum: 200, mean: 65,
        sampleSize: 50, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.82,
        qualityBrackets: {
            low: { multiplier: 0.5, median: 30 }, medium: { multiplier: 1.0, median: 60 },
            high: { multiplier: 1.5, median: 90 }, premium: { multiplier: 2.5, median: 150 }
        },
        locationFactors: { jemaa: 1.5, souks_main: 1.2, souks_interior: 1.0, workshops: 0.8, unknown: 1.0 }
    },

    // -- JEWELRY ----------------------------------------------------
    'jewelry_silver': {
        minimum: 100, p25: 250, median: 500, p75: 800, maximum: 2000, mean: 550,
        sampleSize: 38, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.78,
        qualityBrackets: {
            low: { multiplier: 0.5, median: 250 }, medium: { multiplier: 1.0, median: 500 },
            high: { multiplier: 2.0, median: 1000 }, premium: { multiplier: 3.0, median: 1500 }
        },
        locationFactors: { jemaa: 1.5, souks_main: 1.2, souks_interior: 1.0, workshops: 0.7, unknown: 1.0 }
    },
    'jewelry_gold': {
        minimum: 500, p25: 1500, median: 3000, p75: 5000, maximum: 15000, mean: 3500,
        sampleSize: 20, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.65,
        qualityBrackets: {
            low: { multiplier: 0.5, median: 1500 }, medium: { multiplier: 1.0, median: 3000 },
            high: { multiplier: 2.0, median: 6000 }, premium: { multiplier: 3.0, median: 9000 }
        },
        locationFactors: { jemaa: 1.5, souks_main: 1.2, souks_interior: 1.0, workshops: 0.8, unknown: 1.0 }
    },
    'jewelry_berber': {
        minimum: 200, p25: 500, median: 1000, p75: 2000, maximum: 5000, mean: 1150,
        sampleSize: 28, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.72,
        qualityBrackets: {
            low: { multiplier: 0.5, median: 500 }, medium: { multiplier: 1.0, median: 1000 },
            high: { multiplier: 2.0, median: 2000 }, premium: { multiplier: 3.5, median: 3500 }
        },
        locationFactors: { jemaa: 1.5, souks_main: 1.2, souks_interior: 1.0, workshops: 0.65, unknown: 1.0 }
    },

    // -- FOOTWEAR --------------------------------------------------
    'babouche_plain': {
        minimum: 50, p25: 100, median: 180, p75: 280, maximum: 400, mean: 190,
        sampleSize: 65, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.88,
        qualityBrackets: {
            low: { multiplier: 0.5, median: 90 }, medium: { multiplier: 1.0, median: 180 },
            high: { multiplier: 1.5, median: 270 }, premium: { multiplier: 2.0, median: 360 }
        },
        locationFactors: { jemaa: 1.4, souks_main: 1.2, souks_interior: 1.0, workshops: 0.75, unknown: 1.0 }
    },
    'babouche_embroidered': {
        minimum: 100, p25: 200, median: 350, p75: 500, maximum: 800, mean: 370,
        sampleSize: 45, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.82,
        qualityBrackets: {
            low: { multiplier: 0.5, median: 175 }, medium: { multiplier: 1.0, median: 350 },
            high: { multiplier: 1.8, median: 630 }, premium: { multiplier: 2.5, median: 875 }
        },
        locationFactors: { jemaa: 1.4, souks_main: 1.2, souks_interior: 1.0, workshops: 0.7, unknown: 1.0 }
    },

    // -- CLOTHING --------------------------------------------------
    'djellaba': {
        minimum: 200, p25: 400, median: 700, p75: 1200, maximum: 2500, mean: 780,
        sampleSize: 30, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.75,
        qualityBrackets: {
            low: { multiplier: 0.5, median: 350 }, medium: { multiplier: 1.0, median: 700 },
            high: { multiplier: 1.8, median: 1260 }, premium: { multiplier: 2.5, median: 1750 }
        },
        locationFactors: { jemaa: 1.3, souks_main: 1.15, souks_interior: 1.0, workshops: 0.75, unknown: 1.0 }
    },
    'kaftan': {
        minimum: 500, p25: 1000, median: 2000, p75: 4000, maximum: 10000, mean: 2300,
        sampleSize: 22, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.68,
        qualityBrackets: {
            low: { multiplier: 0.5, median: 1000 }, medium: { multiplier: 1.0, median: 2000 },
            high: { multiplier: 2.0, median: 4000 }, premium: { multiplier: 3.0, median: 6000 }
        },
        locationFactors: { jemaa: 1.4, souks_main: 1.2, souks_interior: 1.0, workshops: 0.7, unknown: 1.0 }
    },
    'scarf_silk': {
        minimum: 80, p25: 150, median: 300, p75: 500, maximum: 1000, mean: 330,
        sampleSize: 40, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.80,
        qualityBrackets: {
            low: { multiplier: 0.5, median: 150 }, medium: { multiplier: 1.0, median: 300 },
            high: { multiplier: 1.8, median: 540 }, premium: { multiplier: 2.5, median: 750 }
        },
        locationFactors: { jemaa: 1.4, souks_main: 1.2, souks_interior: 1.0, workshops: 0.7, unknown: 1.0 }
    },
    'scarf_wool': {
        minimum: 50, p25: 100, median: 200, p75: 350, maximum: 600, mean: 220,
        sampleSize: 35, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.78,
        qualityBrackets: {
            low: { multiplier: 0.5, median: 100 }, medium: { multiplier: 1.0, median: 200 },
            high: { multiplier: 1.6, median: 320 }, premium: { multiplier: 2.2, median: 440 }
        },
        locationFactors: { jemaa: 1.3, souks_main: 1.15, souks_interior: 1.0, workshops: 0.75, unknown: 1.0 }
    },

    // -- TEA & TAGINE ----------------------------------------------
    'teapot_silver': {
        minimum: 100, p25: 150, median: 250, p75: 400, maximum: 800, mean: 280,
        sampleSize: 90, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.90,
        qualityBrackets: {
            low: { multiplier: 0.5, median: 125 }, medium: { multiplier: 1.0, median: 250 },
            high: { multiplier: 1.8, median: 450 }, premium: { multiplier: 2.5, median: 625 }
        },
        locationFactors: { jemaa: 1.4, souks_main: 1.2, souks_interior: 1.0, workshops: 0.7, unknown: 1.0 }
    },
    'tea_glasses': {
        minimum: 50, p25: 80, median: 120, p75: 200, maximum: 400, mean: 130,
        sampleSize: 75, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.88,
        qualityBrackets: {
            low: { multiplier: 0.5, median: 60 }, medium: { multiplier: 1.0, median: 120 },
            high: { multiplier: 1.5, median: 180 }, premium: { multiplier: 2.0, median: 240 }
        },
        locationFactors: { jemaa: 1.4, souks_main: 1.2, souks_interior: 1.0, workshops: 0.8, unknown: 1.0 }
    },
    'tagine_pot_large': {
        minimum: 50, p25: 80, median: 150, p75: 250, maximum: 500, mean: 160,
        sampleSize: 100, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.92,
        qualityBrackets: {
            low: { multiplier: 0.5, median: 75 }, medium: { multiplier: 1.0, median: 150 },
            high: { multiplier: 1.8, median: 270 }, premium: { multiplier: 2.5, median: 375 }
        },
        locationFactors: { jemaa: 1.5, souks_main: 1.2, souks_interior: 1.0, workshops: 0.65, unknown: 1.0 }
    },
    'tagine_pot_small': {
        minimum: 20, p25: 40, median: 70, p75: 120, maximum: 200, mean: 80,
        sampleSize: 100, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.92,
        qualityBrackets: {
            low: { multiplier: 0.5, median: 35 }, medium: { multiplier: 1.0, median: 70 },
            high: { multiplier: 1.8, median: 126 }, premium: { multiplier: 2.5, median: 175 }
        },
        locationFactors: { jemaa: 1.5, souks_main: 1.2, souks_interior: 1.0, workshops: 0.65, unknown: 1.0 }
    },

    // -- GENERIC FALLBACKS (Safety Net) -----------------------------
    'generic_leather': {
        minimum: 50, p25: 100, median: 200, p75: 400, maximum: 1000, mean: 250,
        sampleSize: 500, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.50,
        qualityBrackets: {
            low: { multiplier: 0.5, median: 100 }, medium: { multiplier: 1.0, median: 200 },
            high: { multiplier: 1.8, median: 360 }, premium: { multiplier: 2.5, median: 500 }
        },
        locationFactors: { jemaa: 1.4, souks_main: 1.2, souks_interior: 1.0, workshops: 0.7, unknown: 1.0 }
    },
    'generic_ceramic': {
        minimum: 30, p25: 50, median: 80, p75: 150, maximum: 300, mean: 90,
        sampleSize: 500, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.50,
        qualityBrackets: {
            low: { multiplier: 0.5, median: 40 }, medium: { multiplier: 1.0, median: 80 },
            high: { multiplier: 1.8, median: 144 }, premium: { multiplier: 2.5, median: 200 }
        },
        locationFactors: { jemaa: 1.5, souks_main: 1.2, souks_interior: 1.0, workshops: 0.65, unknown: 1.0 }
    },
    'generic_metal': {
        minimum: 50, p25: 100, median: 200, p75: 400, maximum: 1000, mean: 250,
        sampleSize: 500, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.50,
        qualityBrackets: {
            low: { multiplier: 0.5, median: 100 }, medium: { multiplier: 1.0, median: 200 },
            high: { multiplier: 1.8, median: 360 }, premium: { multiplier: 2.5, median: 500 }
        },
        locationFactors: { jemaa: 1.4, souks_main: 1.2, souks_interior: 1.0, workshops: 0.7, unknown: 1.0 }
    },
    'generic_textile': {
        minimum: 40, p25: 80, median: 150, p75: 300, maximum: 600, mean: 180,
        sampleSize: 500, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.50,
        qualityBrackets: {
            low: { multiplier: 0.5, median: 75 }, medium: { multiplier: 1.0, median: 150 },
            high: { multiplier: 1.8, median: 270 }, premium: { multiplier: 2.5, median: 375 }
        },
        locationFactors: { jemaa: 1.4, souks_main: 1.2, souks_interior: 1.0, workshops: 0.7, unknown: 1.0 }
    },
    'generic_food': {
        minimum: 20, p25: 40, median: 70, p75: 120, maximum: 250, mean: 80,
        sampleSize: 500, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.50,
        qualityBrackets: {
            low: { multiplier: 0.5, median: 35 }, medium: { multiplier: 1.0, median: 70 },
            high: { multiplier: 1.5, median: 105 }, premium: { multiplier: 2.0, median: 140 }
        },
        locationFactors: { jemaa: 1.5, souks_main: 1.2, souks_interior: 1.0, workshops: 0.8, unknown: 1.0 }
    },
    'generic_item': {
        minimum: 50, p25: 100, median: 250, p75: 500, maximum: 2000, mean: 300,
        sampleSize: 500, lastUpdated: '2025-01-15', sourceType: 'seed', confidence: 0.40,
        qualityBrackets: {
            low: { multiplier: 0.5, median: 125 }, medium: { multiplier: 1.0, median: 250 },
            high: { multiplier: 1.8, median: 450 }, premium: { multiplier: 2.5, median: 625 }
        },
        locationFactors: { jemaa: 1.4, souks_main: 1.2, souks_interior: 1.0, workshops: 0.7, unknown: 1.0 }
    }
};

// Backward compatibility alias - all existing code uses MOCK_PRICE_DATABASE
const MOCK_PRICE_DATABASE = PRICE_DATABASE_V2;


// ---------------------------------------------------------------
// CLASS: PhotoCapture (Camera Integration)
// ---------------------------------------------------------------


    windowObj.ALIDADE_PRICE_CHECK_CONFIG = CONFIG;
    windowObj.ALIDADE_PRICE_CHECK_ITEM_LABELS = ITEM_LABELS;
    windowObj.ALIDADE_PRICE_CHECK_ITEM_DISPLAY_NAMES = ITEM_DISPLAY_NAMES;
    windowObj.ALIDADE_PRICE_CHECK_PRICE_DATABASE_V2 = PRICE_DATABASE_V2;
})(typeof window !== 'undefined' ? window : null);
