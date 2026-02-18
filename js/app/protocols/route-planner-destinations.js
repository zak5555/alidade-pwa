/**
 * ALIDADE Route Planner Destinations
 * Extracted from app.js with compatibility globals.
 */
(function bootstrapRoutePlannerDestinations(windowObj) {
    if (!windowObj) return;
    const routePlannerDestinationsDebugLog = (...args) => {
        if (windowObj.__ALIDADE_DEBUG_LOGS__ === true) {
            console.log(...args);
        }
    };
const MARRAKECH_DESTINATIONS = {
    landmarks: [
        {
            id: 'dest_001',
            name: 'Jemaa el-Fnaa',
            nameFr: 'Place Jemaa el-Fnaa',
            lat: 31.6259,
            lng: -7.9892,
            type: 'landmark',
            icon: '🏛️',
            openingHours: { open: 0, close: 24 },
            visitDuration: 60,
            bestTime: 'sunset',
            crowd: { low: [[6, 10]], medium: [[10, 18]], high: [[18, 23]] },
            description: 'Main square, food stalls, snake charmers, storytellers',
            tips: 'Come at sunset for the best atmosphere. Beware of scams.'
        },
        {
            id: 'dest_002',
            name: 'Bahia Palace',
            nameFr: 'Palais de la Bahia',
            lat: 31.6214,
            lng: -7.9838,
            type: 'palace',
            icon: '🏰',
            openingHours: { open: 9, close: 17 },
            visitDuration: 45,
            bestTime: 'morning',
            ticketPrice: 70,
            crowd: { low: [[9, 10]], medium: [[10, 15]], high: [[15, 17]] },
            description: '19th century palace with stunning courtyards and mosaics',
            tips: 'Go early to avoid tour groups. Photography allowed.'
        },
        {
            id: 'dest_003',
            name: 'Majorelle Garden',
            nameFr: 'Jardin Majorelle',
            lat: 31.6415,
            lng: -8.0033,
            type: 'garden',
            icon: '🌿',
            openingHours: { open: 8, close: 18 },
            visitDuration: 90,
            bestTime: 'early_morning',
            ticketPrice: 150,
            crowd: { low: [[8, 9]], medium: [[9, 11], [15, 18]], high: [[11, 15]] },
            description: 'Cobalt blue villa, botanical garden, YSL museum',
            tips: 'Book online to skip queues. Combine with YSL museum.'
        },
        {
            id: 'dest_004',
            name: 'Koutoubia Mosque',
            nameFr: 'Mosquée Koutoubia',
            lat: 31.6238,
            lng: -7.9933,
            type: 'mosque',
            icon: '🕌',
            openingHours: { open: 0, close: 24 },
            visitDuration: 20,
            bestTime: 'any',
            ticketPrice: 0,
            description: 'Iconic 12th century minaret, visible from across the city',
            tips: 'Non-Muslims cannot enter. Admire from the gardens.'
        },
        {
            id: 'dest_005',
            name: 'Saadian Tombs',
            nameFr: 'Tombeaux Saadiens',
            lat: 31.6173, lng: -7.9889,
            type: 'historical',
            icon: '🏺',
            openingHours: { open: 9, close: 17 },
            visitDuration: 45,
            bestTime: 'morning',
            ticketPrice: 70,
            priorityScore: 8,
            crowd: { low: [[9, 10]], medium: [[10, 12], [14, 17]], high: [[12, 14]] },
            queueLatency: 45, // Main Chamber bottleneck
            description: '16th century royal necropolis. Main draw: Chamber of Twelve Columns.',
            tips: 'QUEUE HACK: If line is 30+ mins, view the garden tombs (beautiful) and skip the main chamber. 09:00 sharp is essential.'
        },
        {
            id: 'dest_006',
            name: 'El Badi Palace',
            nameFr: 'Palais El Badi',
            lat: 31.6189, lng: -7.9856,
            type: 'palace',
            icon: '🏰',
            openingHours: { open: 9, close: 17 },
            visitDuration: 60,
            bestTime: 'late_afternoon',
            ticketPrice: 70,
            priorityScore: 7,
            avoidTime: [12, 16], // HIGH THERMAL EXPOSURE
            thermalRisk: 'CRITICAL',
            description: 'Vast sunken ruin. Zero shade. "Red sandstone oven."',
            tips: 'THERMAL WARNING: Do NOT visit 12-4 PM. Schedule for late afternoon when walls cast shadows. See the storks!'
        },
        {
            id: 'dest_007',
            name: 'Ben Youssef Madrasa',
            nameFr: 'Medersa Ben Youssef',
            lat: 31.6317, lng: -7.9855,
            type: 'historical',
            icon: '🏺',
            openingHours: { open: 9, close: 18 },
            visitDuration: 45,
            bestTime: 'opening',
            ticketPrice: 50,
            priorityScore: 10,
            queueLatency: 20,
            crowd: { low: [[9, 10]], medium: [[10, 12], [16, 18]], high: [[12, 16]] },
            description: 'Architectural Apex. Post-reno, it is THE premier site.',
            tips: 'CRITICAL: 09:00 AM slot ONLY for the empty courtyard shot. After 10:00, it becomes a "selfie trap." Cash for tickets.'
        },
        {
            id: 'dest_008',
            name: 'Menara Gardens',
            nameFr: 'Jardins de la Ménara',
            lat: 31.6186, lng: -8.0221,
            type: 'garden',
            icon: '🌿',
            openingHours: { open: 8, close: 17 },
            visitDuration: 45,
            bestTime: 'sunset',
            ticketPrice: 0,
            priorityScore: 4, // Low value
            avoidTime: [11, 16], // HIGH THERMAL EXPOSURE
            thermalRisk: 'HIGH',
            description: 'The "Mirage". Long dusty walk (~1km) with no flowers - just olive trees.',
            tips: 'REALITY CHECK: Often underwhelming for tourists. Only visit for the iconic Atlas photo on a clear day. Le Jardin Secret is a better Medina alternative.'
        },
        {
            id: 'dest_009',
            name: 'Dar Si Said Museum',
            nameFr: 'Musée Dar Si Said',
            lat: 31.6223, lng: -7.9828,
            type: 'museum',
            icon: '🖼️',
            openingHours: { open: 9, close: 17 },
            visitDuration: 60,
            bestTime: 'afternoon',
            ticketPrice: 30,
            priorityScore: 7,
            closedDays: ['Tuesday'], // HARD CONSTRAINT
            thermalRefuge: true,
            description: 'Hidden Gem. Comparable to Bahia but a fraction of the crowds.',
            tips: 'CLOSED TUESDAYS. The "Strategic Alternative" - prioritize over Bahia if short on time.'
        },
        {
            id: 'dest_010',
            name: 'Le Jardin Secret',
            nameFr: 'Le Jardin Secret',
            lat: 31.6303, lng: -7.9865,
            type: 'garden',
            icon: '🌿',
            openingHours: { open: 9, close: 18 },
            visitDuration: 60,
            bestTime: 'midday',
            ticketPrice: 80,
            priorityScore: 8,
            thermalRefuge: true,
            description: 'The Medina Sanctuary. Antithesis of Majorelle: no booking, rarely crowded.',
            tips: 'THE DECOMPRESSION CHAMBER. Perfect halfway point in a souk tour. Clean toilets, rooftop cafe, shaded benches. Prioritize over Menara.'
        }
    ],
    souks: [
        {
            id: 'dest_101',
            name: 'Place des Épices (Rahba Kedima)',
            nameFr: 'Place des Épices',
            lat: 31.6293,
            lng: -7.9868,
            type: 'souk',
            icon: '🛍️',
            openingHours: { open: 9, close: 20 },
            visitDuration: 45,
            bestTime: 'morning',
            priorityScore: 8,
            description: 'Spice Square. Spices, woven hats, chameleons.',
            tips: 'Café des Épices is good for a break.'
        },
        {
            id: 'dest_102',
            name: 'Souk Semmarine',
            lat: 31.6275,
            lng: -7.9892,
            type: 'souk',
            icon: '🛍️',
            openingHours: { open: 9, close: 21 },
            visitDuration: 60,
            priorityScore: 7,
            description: 'Main artery of the souks. Touristy but impressive.',
            tips: 'Most expensive prices. Look, don\'t buy (unless you haggle hard).'
        },
        {
            id: 'dest_103',
            name: 'Souk Haddadine (Blacksmiths)',
            lat: 31.6300,
            lng: -7.9870,
            type: 'souk',
            icon: '🛍️',
            openingHours: { open: 9, close: 19 },
            visitDuration: 30,
            description: 'Sounds of metal striking metal. Authentic vibes.',
            tips: 'Noisy and fascinating. Watch them work.'
        },
        {
            id: 'dest_104',
            name: 'Tanneries (Bab Debbagh)',
            lat: 31.6345,
            lng: -7.9790,
            type: 'souk',
            icon: '🛍️',
            openingHours: { open: 9, close: 17 },
            visitDuration: 60,
            priorityScore: 5, // High scam risk
            scamRisk: 'high',
            description: 'Leather processing pits. Smell is intense.',
            tips: 'SCAM WARNING. Do not follow "guides". Pay small fee to guardian only. carry mint.'
        }
    ],
    restaurants: [
        {
            id: 'dest_200',
            name: 'Chez Chegrouni',
            lat: 31.6262, lng: -7.9888,
            type: 'restaurant',
            icon: '🍽️',
            openingHours: { open: 11, close: 22 },
            visitDuration: 60,
            cuisine: 'moroccan',
            priceRange: '$',
            description: 'Authentic, no-nonsense tagines right on the square.',
            tips: 'No reservations. Terrace has great view.'
        },
        {
            id: 'dest_201',
            name: 'Le Salama',
            lat: 31.6260, lng: -7.9880,
            type: 'restaurant',
            icon: '🍽️',
            openingHours: { open: 12, close: 0 },
            visitDuration: 90,
            cuisine: 'fusion',
            priceRange: '$$$',
            alcoholServed: true,
            description: 'Colonial style, happy hour, belly dancers.',
            tips: 'Good for a drink (alcohol served). Touristy but fun.'
        },
        {
            id: 'dest_202',
            name: 'Café des Épices',
            lat: 31.6293, lng: -7.9868,
            type: 'restaurant',
            icon: '🍽️',
            openingHours: { open: 9, close: 22 },
            visitDuration: 60,
            cuisine: 'fusion',
            priceRange: '$$',
            description: 'Iconic cafe, rooftop terrace, camel burgers',
            tips: 'Good wifi. Weekly storytelling nights.'
        },
        {
            id: 'dest_203',
            name: 'Nomad',
            lat: 31.6302, lng: -7.9862,
            type: 'restaurant',
            icon: '🍽️',
            openingHours: { open: 12, close: 23 },
            visitDuration: 75,
            cuisine: 'modern_moroccan',
            priceRange: '$$',
            alcoholServed: false,
            reservationRequired: true,
            priorityScore: 9,
            description: 'Modern Moroccan. Sunset terrace is most contested real estate in the Medina.',
            tips: 'BOOK WEEKS AHEAD for terrace edge at sunset. NO alcohol served.'
        },
        {
            id: 'dest_204',
            name: 'Al Fassia',
            lat: 31.6368, lng: -8.0122,
            type: 'restaurant',
            icon: '🍽️',
            openingHours: { open: 12, close: 14.5, dinnerOpen: 19, dinnerClose: 22 },
            visitDuration: 90,
            cuisine: 'moroccan',
            priceRange: '$$$',
            alcoholServed: false,
            reservationRequired: true,
            priorityScore: 9,
            description: 'Women-run cooperative. Famous for Mechoui (lamb shoulder).',
            tips: 'CRITICAL: Mechoui must be PRE-ORDERED 24h ahead or it sells out. Reservations essential.'
        },
        {
            id: 'dest_205',
            name: 'Terrasse des Épices',
            lat: 31.6305,
            lng: -7.9863,
            type: 'restaurant',
            icon: '🍽️',
            openingHours: { open: 10, close: 23 },
            visitDuration: 60,
            cuisine: 'moroccan',
            priceRange: '$$',
            description: 'Rooftop views over the medina',
            tips: 'Come for mint tea and sunset.'
        },
        {
            id: 'dest_206',
            name: 'Fine Mama',
            lat: 31.6256,
            lng: -7.9890,
            type: 'restaurant',
            icon: '🍽️',
            openingHours: { open: 12, close: 22 },
            visitDuration: 45,
            cuisine: 'moroccan',
            priceRange: '$',
            description: 'Traditional food, safe hygiene, rooftop',
            tips: 'Good first meal. Safe landing spot.'
        },
        {
            id: 'dest_207',
            name: 'Café de France',
            lat: 31.6260, lng: -7.9890,
            type: 'restaurant',
            icon: '🍽️',
            openingHours: { open: 8, close: 23 },
            visitDuration: 30,
            cuisine: 'cafe',
            priceRange: '$',
            alcoholServed: false,
            priorityScore: 8,
            description: 'The "View Tax". Poor food, indifferent service, but THE Jemaa el-Fnaa view.',
            tips: 'USE STRICTLY AS PHOTO STOP. Buy a mint tea (the "View Tax"), spend 30 mins on the upper terrace at sunset, then leave to eat elsewhere.'
        },
        {
            id: 'dest_208',
            name: 'Kasbah Café',
            lat: 31.6175,
            lng: -7.9890,
            type: 'restaurant',
            icon: '🍽️',
            openingHours: { open: 9, close: 22 },
            visitDuration: 60,
            cuisine: 'moroccan',
            priceRange: '$$',
            description: 'Terrace facing the mosque',
            tips: 'Fair prices, good lunch spot near tombs.'
        },
        {
            id: 'dest_209',
            name: 'Amal Training Centre',
            lat: 31.6380,
            lng: -8.0100,
            type: 'restaurant',
            icon: '🍽️',
            openingHours: { open: 12, close: 15 },
            visitDuration: 60,
            cuisine: 'moroccan',
            priceRange: '$',
            description: 'Non-profit training centre, excellent food',
            tips: 'Lunch only. Book Fridays for couscous.'
        },
        {
            id: 'dest_210',
            name: 'Chez Lamine',
            lat: 31.6270, lng: -7.9880,
            type: 'restaurant',
            icon: '🍽️',
            openingHours: { open: 11, close: 15 }, // LUNCH ONLY
            visitDuration: 45,
            cuisine: 'mechoui',
            priceRange: '$$',
            priorityScore: 8,
            description: 'LUNCH-ONLY. Mechoui Alley institution. Tangia and slow-roasted lamb.',
            tips: 'TIMING CRITICAL: Mechoui roasted in the morning. Best cuts gone by 14:00. NOT a dinner destination. Go to permanent shop, not square stalls.'
        },
        {
            id: 'dest_211',
            name: 'Dar El Bacha (Bacha Coffee)',
            lat: 31.6320, lng: -7.9900,
            type: 'restaurant',
            icon: '🍽️',
            openingHours: { open: 10, close: 18 },
            visitDuration: 90,
            cuisine: 'cafe',
            priceRange: '$$$',
            priorityScore: 9,
            queueLatency: 180, // 1.5-3+ hours typical
            thermalRefuge: true,
            description: 'The most "viral" venue. EXTREME wait times (1.5-3 hours).',
            tips: 'THE MUSEUM HACK: Pay museum fee (60 MAD) at the SEPARATE museum entrance (no line). Enter complex. Put name on coffee list with maître d\'. TOUR THE MUSEUM while you wait. Converts dead wait into cultural activity.'
        },
        {
            id: 'dest_212',
            name: 'Kosybar',
            lat: 31.6200,
            lng: -7.9850,
            type: 'restaurant',
            icon: '🍽️',
            openingHours: { open: 12, close: 24 },
            visitDuration: 90,
            cuisine: 'international',
            priceRange: '$$$',
            description: 'Sunset views over Storks',
            tips: 'Golden hour spot. Sushi available.'
        },
        {
            id: 'dest_213',
            name: 'La Trattoria',
            lat: 31.6360,
            lng: -8.0110,
            type: 'restaurant',
            icon: '🍽️',
            openingHours: { open: 19, close: 23 },
            visitDuration: 90,
            cuisine: 'italian',
            priceRange: '$$$',
            description: 'Romantic poolside dining',
            tips: 'Dinner HQ. Reservation mandatory.'
        }
    ],
    experiences: [
        {
            id: 'dest_301',
            name: 'Hammam de la Rose',
            lat: 31.6267,
            lng: -7.9847,
            type: 'hammam',
            icon: '🛁',
            openingHours: { open: 9, close: 20 },
            visitDuration: 120,
            bestTime: 'afternoon',
            ticketPrice: 250,
            description: 'Traditional bathhouse experience',
            tips: 'Book treatments in advance. Bring swimwear.'
        },
        {
            id: 'dest_302',
            name: 'Cooking Class (La Maison Arabe)',
            lat: 31.6298,
            lng: -7.9915,
            type: 'class',
            icon: '👩‍🍳',
            openingHours: { open: 10, close: 14 },
            visitDuration: 180,
            bestTime: 'morning',
            ticketPrice: 500,
            description: 'Learn to cook tagine and couscous',
            tips: 'Book 48 hours ahead. Includes market visit.'
        },
        {
            id: 'dest_303',
            name: 'Quad Biking (Palmeraie)',
            lat: 31.6692, lng: -7.9512,
            type: 'activity',
            icon: '🎯',
            openingHours: { open: 9, close: 18 },
            visitDuration: 180,
            bestTime: 'morning',
            ticketPrice: 400,
            priorityScore: 6,
            avoidTime: [12, 16], // Heat + dust stifling
            thermalRisk: 'HIGH',
            description: 'ENVIRONMENTAL WARNING: Palmeraie is semi-arid scrubland, not a lush jungle. Extremely dusty.',
            tips: 'MANDATORY GEAR: Sunglasses + scarf (often provided). Heat + dust combo is stifling in summer.'
        },
        {
            id: 'dest_304',
            name: 'Hot Air Balloon',
            lat: 31.6000, lng: -8.0500,
            type: 'activity',
            icon: '🎯',
            openingHours: { open: 4, close: 11 }, // Total logistical footprint
            visitDuration: 300, // 5 HOURS total
            bestTime: 'sunrise',
            ticketPrice: 2000,
            priorityScore: 10,
            description: 'Logistically Heavy. Flight is 1h, but total commitment is 5 HOURS.',
            tips: 'TIME COST WARNING: Pickup 04:00-05:00 AM. Return 10-11 AM. This DELETES your morning. Clients return tired. DO NOT schedule heavy souk tour immediately after. Follow with pool or leisurely lunch.'
        },
        {
            id: 'dest_305',
            name: 'Hammam Mouassine (Historic)',
            lat: 31.6290, lng: -7.9860,
            type: 'hammam',
            icon: '🛁',
            openingHours: { open: 9, close: 21 },
            visitDuration: 90,
            bestTime: 'any',
            ticketPrice: 150,
            priorityScore: 8,
            experienceType: 'authentic',
            description: 'Dating to 1562. AUTHENTIC public bathhouse, NOT a spa.',
            tips: 'CULTURAL ADVISORY: Communal nudity (gender-separated). Vigorous scrubbing by attendant. Bucket-washing. Intense and authentic. For "adventurers," not luxury seekers. Bring own soap/towel or buy there.'
        },
    ],
    dayTrips: [
        {
            id: 'dest_401',
            name: 'Ourika Valley',
            lat: 31.3658,
            lng: -7.7969,
            type: 'daytrip',
            icon: '🧭',
            openingHours: { open: 0, close: 24 },
            visitDuration: 360,
            bestTime: 'morning',
            description: 'Atlas mountains, waterfalls, Berber villages',
            tips: 'Hire a driver. Best in spring/summer.'
        },
        {
            id: 'dest_402',
            name: 'Essaouira',
            lat: 31.5086,
            lng: -9.7595,
            type: 'daytrip',
            icon: '🧭',
            openingHours: { open: 0, close: 24 },
            visitDuration: 600,
            bestTime: 'full_day',
            description: 'Coastal town, blue boats, windsurfing',
            tips: '2.5 hour drive. Stay overnight if possible.'
        },
        {
            id: 'dest_403',
            name: 'Ait Benhaddou',
            lat: 31.0472,
            lng: -7.1299,
            type: 'daytrip',
            icon: '🧭',
            openingHours: { open: 0, close: 24 },
            visitDuration: 480,
            bestTime: 'full_day',
            description: 'UNESCO kasbah, Game of Thrones filming location',
            tips: '3 hour drive each way. Very hot in summer.'
        }
    ]
};

// Flatten destinations for easy access
const ALL_DESTINATIONS = [
    ...MARRAKECH_DESTINATIONS.landmarks,
    ...MARRAKECH_DESTINATIONS.souks,
    ...MARRAKECH_DESTINATIONS.restaurants,
    ...MARRAKECH_DESTINATIONS.experiences,
    ...MARRAKECH_DESTINATIONS.dayTrips
];


    windowObj.ALIDADE_ROUTE_PLANNER_DESTINATIONS = MARRAKECH_DESTINATIONS;
    windowObj.ALIDADE_ROUTE_PLANNER_ALL_DESTINATIONS = ALL_DESTINATIONS;
    routePlannerDestinationsDebugLog(`[ROUTE-PLANNER] Loaded ${ALL_DESTINATIONS.length} destinations`);
})(typeof window !== 'undefined' ? window : null);
