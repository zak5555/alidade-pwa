/**
 * ALIDADE Module Preview Data
 * Extracted static preview datasets from app.js.
 */
(function registerAlidadeModulePreviewData(windowObj) {
    if (!windowObj) return;

const BASIC_THREAT_PREVIEW = [
    {
        id: 'monkey_snake_ambush',
        category: 'jemaa',
        title: 'Monkey/Snake Ambush',
        risk: 'HIGH',
        loss: '100-500 DH',
        description: "- The ambush: handlers place animals on you, then pressure for payment.\n- The squeeze: fee can jump fast if you're hesitant.",
        counter_measure: "- Keep a 2-meter distance.\n- Never accept photo contact without a clear price first (10-20 DH).",
        verbal_nuke: {
            phrase: 'Sir Fhal-ek',
            phonetic: 'Sir Fhal-ek',
            meaning: 'Go away',
            audio: 'assets/audio/sir_b7alak.mp3'
        }
    },
    {
        id: 'orange_juice_roulette',
        category: 'jemaa',
        title: 'Orange Juice Roulette',
        risk: 'HIGH',
        loss: '<50 DH',
        description: "- Juice can be diluted and overloaded with unsafe ice.\n- Low loss, high risk for stomach disruption.",
        counter_measure: "- Ask for no ice.\n- Watch oranges being squeezed before you pay.",
        verbal_nuke: {
            phrase: 'L-3assir Bou-hdou',
            phonetic: 'L-3a-ssir Bou-hdou',
            meaning: 'Just orange juice (no mix)',
            audio: 'assets/audio/3assir.mp3'
        }
    },
    {
        id: 'the_henna_grab',
        category: 'jemaa',
        title: 'The Henna Grab',
        risk: 'HIGH',
        loss: '100-500 DH',
        description: "- Forced henna application then demand for payment.\n- Black henna can include harmful chemicals.",
        counter_measure: "- Keep hands in pockets in high-pressure zones.\n- Pull away immediately and keep moving.",
        verbal_nuke: {
            phrase: 'La chok-ran',
            phonetic: 'La chok-ran',
            meaning: 'No thanks',
            audio: 'assets/audio/g06_la_shukran.mp3'
        }
    },
    {
        id: 'billShockStandoff',
        category: 'restaurants',
        title: 'Bill Shock Standoff',
        risk: 'HIGH',
        loss: '600+ DH',
        description: "- Bill inflates 3x-4x after service.\n- Staff pressure is used to force fast payment.",
        counter_measure: "- Show menu photo proof.\n- Calculate line by line.\n- Pay exact fair amount and leave.",
        verbal_nuke: {
            phrase: "Ay-yet l'Boul-ice",
            phonetic: "Ay-yet l'Boul-ice",
            meaning: 'Call the police',
            audio: 'assets/audio/n3ayat_poulice.mp3'
        }
    },
    {
        id: 'entrapment',
        category: 'restaurants',
        title: 'Entrapment',
        risk: 'MEDIUM',
        loss: '100-500 DH',
        description: "- Bread, olives, and water are dropped on table as if free.\n- Charges appear on final bill.",
        counter_measure: "- Refuse immediately.\n- Return untouched extras before ordering.",
        verbal_nuke: {
            phrase: 'Blach',
            phonetic: 'Blach',
            meaning: 'No need',
            audio: 'assets/audio/blach.mp3'
        }
    },
    {
        id: 'phantomBillTouts',
        category: 'restaurants',
        title: 'Phantom Bill & Touts',
        risk: 'MEDIUM',
        loss: '100-500 DH',
        description: "- Menu switches and hidden unit pricing tricks.\n- Touts direct you to higher-risk stalls.",
        counter_measure: "- Photograph menu before ordering.\n- Confirm every price item by item.",
        verbal_nuke: {
            phrase: 'Ma-talabt-sh had-shi',
            phonetic: 'Ma-talabt-sh had-shi',
            meaning: "I didn't order this",
            audio: 'assets/audio/s14_matlabtch_hadchi.mp3'
        }
    },
    {
        id: 'carpetCooperative',
        category: 'souk',
        title: "Carpet 'Cooperative'",
        risk: 'MEDIUM',
        loss: '600+ DH',
        description: "- Fake 'government cooperative' credibility play.\n- Emotional pressure after your first low offer.",
        counter_measure: "- Reset anchor aggressively.\n- Walk away to force true market pricing.",
        verbal_nuke: {
            phrase: 'Ghali Bezaf!',
            phonetic: 'Gha-li Bez-zaf!',
            meaning: 'Too expensive',
            audio: 'assets/audio/s02_ghali_bezaf.mp3'
        }
    },
    {
        id: 'theMoneyMagician',
        category: 'souk',
        title: 'The Money Magician',
        risk: 'MEDIUM',
        loss: '100-500 DH',
        description: "- Bill fold-under while counting.\n- Currency unit switch at payment.",
        counter_measure: "- Count change yourself slowly.\n- Confirm amount and currency aloud.",
        verbal_nuke: {
            phrase: 'Machi Euro',
            phonetic: 'Machi Euro',
            meaning: 'Not euro',
            audio: 'assets/audio/s09_machi_euro.mp3'
        }
    },
    {
        id: 'governmentShopLie',
        category: 'souk',
        title: "'Government Shop' Lie",
        risk: 'MEDIUM',
        loss: '600+ DH',
        description: "- Claim: fixed state pricing.\n- Reality: souk negotiation still applies.",
        counter_measure: "- Ignore authority framing.\n- Negotiate or leave.",
        verbal_nuke: {
            phrase: 'Ana fa-hem',
            phonetic: 'Ana fa-hem',
            meaning: 'I understand the game',
            audio: 'assets/audio/g08_ana_fahem.mp3'
        }
    },
    {
        id: 'theCalculatorShift',
        category: 'souk',
        title: 'The Calculator Shift',
        risk: 'MEDIUM',
        loss: '100-500 DH',
        description: "- Number appears normal on calculator but unit changes later.\n- Decimal and zero-button trick raises final total.",
        counter_measure: "- State currency every time.\n- Verify display before paying.",
        verbal_nuke: {
            phrase: 'Dirham, Machi Euro!',
            phonetic: 'Dirham, Machi Euro!',
            meaning: 'Dirham, not euro',
            audio: 'assets/audio/s09_machi_euro.mp3'
        }
    },
    {
        id: 'theSaffronScam',
        category: 'souk',
        title: 'The Saffron Scam',
        risk: 'MEDIUM',
        loss: '100-500 DH',
        description: "- Fake saffron made from dyed fillers.\n- Color release is too fast.",
        counter_measure: "- Water test: real saffron colors water slowly yellow.",
        verbal_nuke: {
            phrase: 'Hada M-zou-wer',
            phonetic: 'HA-DA M-ZOO-WER',
            meaning: 'This is fake',
            audio: 'assets/audio/s08_hada_mzawer.mp3'
        }
    },
    {
        id: 'fakeArgan',
        category: 'souk',
        title: 'Fake Argan',
        risk: 'MEDIUM',
        loss: '100-500 DH',
        description: "- Culinary oil sold as cosmetic argan.\n- Perfumed blends in clear bottles.",
        counter_measure: "- Cosmetic argan is light-gold and stored in dark glass.",
        verbal_nuke: {
            phrase: null,
            phonetic: null,
            meaning: null
        }
    },
    {
        id: 'roadClosedTrap',
        category: 'streets',
        title: 'Road Closed Trap',
        risk: 'HIGH',
        loss: '100-500 DH',
        description: "- Fake closure/festival claims to break your route confidence.\n- Goal is to redirect you into paid guidance.",
        counter_measure: "- Keep moving.\n- Trust verified map direction, not random intercepts.",
        verbal_nuke: {
            phrase: 'Ana Sa-ken Hna',
            phonetic: 'Ana Sa-ken Hna',
            meaning: 'I live here',
            audio: 'assets/audio/s12_ana_saken_hna.mp3'
        }
    },
    {
        id: 'theTanneryRelay',
        category: 'streets',
        title: 'The Tannery Relay',
        risk: 'HIGH',
        loss: '100-500 DH',
        description: "- You are handed from one tout to another.\n- Mint under nose tactic creates fake obligation.",
        counter_measure: "- Do not follow solo.\n- Use licensed guide only.",
        verbal_nuke: {
            phrase: 'Ma-bghit Wa-lou',
            phonetic: 'Ma-bghit Wa-lou',
            meaning: "I don't want anything",
            audio: 'assets/audio/s05_ma_bghit_walo.mp3'
        }
    },
    {
        id: 'theMellahTrap',
        category: 'streets',
        title: 'The Mellah Trap',
        risk: 'MEDIUM',
        loss: '<50 DH',
        description: "- Fake closure claim for cemetery/museum.\n- Redirect toward affiliate shop path.",
        counter_measure: "- Verify on map and continue independently.",
        verbal_nuke: {
            phrase: 'La, Shuk-ran',
            phonetic: 'La, Shuk-ran',
            meaning: 'No thanks',
            audio: 'assets/audio/g06_la_shukran.mp3'
        }
    },
    {
        id: 'theHotelStaffImpostor',
        category: 'streets',
        title: 'Hotel Staff Impostor',
        risk: 'MEDIUM',
        loss: '100-500 DH',
        description: "- Stranger claims hotel affiliation to gain trust.\n- Then pushes you toward controlled route or purchase.",
        counter_measure: "- Ask for your room number or staff details.\n- Disengage if answer is vague.",
        verbal_nuke: {
            phrase: 'Ana 3aref Staff',
            phonetic: 'Ana 3aref Staff',
            meaning: 'I know the staff',
            audio: 'assets/audio/e06_ana_3araf_staff.mp3'
        }
    },
    {
        id: 'theBillSwitch',
        category: 'transport',
        title: 'The Bill Switch',
        risk: 'MEDIUM',
        loss: '100-500 DH',
        description: "- Driver swaps your high-value bill after receiving it.\n- Claims you paid a smaller note.",
        counter_measure: "- Announce denomination out loud.\n- Use phone light and handover visibly.",
        verbal_nuke: {
            phrase: 'Ha Me-ten Der-ham',
            phonetic: 'Ha Me-ten Der-ham',
            meaning: 'Here is 200',
            audio: 'assets/audio/s10_ha_200dh.mp3'
        }
    },
    {
        id: 'beforeRiding',
        category: 'transport',
        title: 'Meter Check',
        risk: 'MEDIUM',
        loss: '100-500 DH',
        description: "- 'Meter broken' claim before trip start.\n- Fixed inflated fare is proposed.",
        counter_measure: "- Demand meter activation before entering.\n- Leave immediately if refused.",
        verbal_nuke: {
            phrase: 'Kh-dem Comp-teur',
            phonetic: 'Kh-dem Comp-teur',
            meaning: 'Turn on meter',
            audio: 'assets/audio/t02_khdem_compteur.mp3'
        }
    },
    {
        id: 'noChangeTrap',
        category: 'transport',
        title: 'No Change Trap',
        risk: 'MEDIUM',
        loss: '<50 DH',
        description: "- Driver claims no change for larger bills.\n- Pressure tactic to force overpay.",
        counter_measure: "- Keep small notes/coins ready.\n- Pay exact whenever possible.",
        verbal_nuke: {
            phrase: null,
            phonetic: null,
            meaning: null
        }
    }
];

const BASIC_INTEL_PREVIEW = {
    page_desc: 'High-trust mode: Gardens and Street Food stay visible. Strategic intel remains classified until Ultimate clearance.',
    categories: {
        rations: { title: 'RATIONS', subtitle: 'Classified', targets: [] },
        oxygen: { title: 'OXYGEN', subtitle: 'Classified', targets: [] },
        recon: { title: 'RECON', subtitle: 'Classified', targets: [] },
        maze: { title: 'THE MAZE', subtitle: 'Classified', targets: [] },
        elevation: { title: 'ELEVATION', subtitle: 'Classified', targets: [] },
        recovery: { title: 'RECOVERY', subtitle: 'Classified', targets: [] },
        nightlife: { title: 'NIGHT OPS', subtitle: 'Classified', safety: [], quiet: [], party: [] }
    }
};

const BASIC_INTEL_OXYGEN_TARGETS = Object.freeze([
    {
        id: 'majorelle_preview',
        name: 'Jardin Majorelle',
        type: 'Garden',
        window: '08:30 AM',
        vibe: 'Iconic & Busy',
        item: 'Blue Villa',
        intel: 'Book early slot online to avoid crowd pressure.',
        price: 'CLASSIFIED',
        protocol: 'Book online first',
        link: '#',
        map: 'https://maps.google.com/?q=31.6414,-8.0031'
    },
    {
        id: 'jardin_secret_preview',
        name: 'Le Jardin Secret',
        type: 'Garden',
        window: 'Noon / Sunset',
        vibe: 'Quiet Oasis',
        item: 'Tower View',
        intel: 'Add tower ticket for one of the best Medina top views.',
        price: 'CLASSIFIED',
        protocol: 'Walk-in friendly',
        link: '#',
        map: 'https://maps.google.com/?q=31.630710978312184,-7.989527808546041'
    },
    {
        id: 'cyber_park_preview',
        name: 'Cyber Park Arsat Moulay Abdeslam',
        type: 'Garden',
        window: 'Late Afternoon',
        vibe: 'Recovery & Shade',
        item: 'Quiet Benches',
        intel: 'Safe decompression stop with open paths and central position.',
        price: 'Free',
        protocol: 'Direct entry',
        link: '#',
        map: 'https://maps.google.com/?q=31.62893,-7.99964'
    }
]);

const BASIC_INTEL_RATIONS_STREET_TARGETS = Object.freeze([
    {
        id: 'street_bissara',
        name: 'Bissara Protocol',
        type: 'Street Food',
        window: '07:00-10:30',
        vibe: 'Local Breakfast',
        item: 'Bissara + Olive Oil',
        intel: 'Choose stalls with high morning turnover and fresh bread queue.',
        price: '20-35 DH',
        protocol: 'Cash + small notes',
        link: '#',
        map: 'https://maps.google.com/?q=31.6277,-7.9890'
    },
    {
        id: 'street_sfenj',
        name: 'Sfenj Quick Stop',
        type: 'Street Food',
        window: '08:00-11:00',
        vibe: 'Fast & Cheap',
        item: 'Fresh Sfenj',
        intel: 'Take only from fryer-to-paper service. Avoid pre-stacked trays.',
        price: '2-5 DH / piece',
        protocol: 'Eat hot, avoid leftovers',
        link: '#',
        map: 'https://maps.google.com/?q=31.6269,-7.9882'
    }
]);

const BASIC_INTEL_RATIONS_LOCKED_TARGETS = Object.freeze([
    {
        id: 'locked_barometre',
        name: 'Le Barometre',
        type: 'Fine Dining',
        window: 'Evening',
        vibe: 'Underground',
        item: 'Classified Signature',
        intel: 'Classified',
        price: 'CLASSIFIED',
        protocol: 'Classified',
        link: '#',
        map: '#'
    },
    {
        id: 'locked_al_fassia',
        name: 'Al Fassia',
        type: 'Fine Dining',
        window: 'Dinner',
        vibe: 'Aristocratic',
        item: 'Classified Signature',
        intel: 'Classified',
        price: 'CLASSIFIED',
        protocol: 'Classified',
        link: '#',
        map: '#'
    },
    {
        id: 'locked_rooftop_nomad',
        name: 'Nomad Rooftop',
        type: 'Rooftop',
        window: 'Sunset',
        vibe: 'Boho',
        item: 'Classified Signature',
        intel: 'Classified',
        price: 'CLASSIFIED',
        protocol: 'Classified',
        link: '#',
        map: '#'
    }
]);

const BASIC_FORTRESS_PREVIEW = {
    mission_statement: 'Classified Fortress playbooks load only after Ultimate clearance verification.',
    modules: [
        {
            id: 'mod_1',
            title: 'MODULE 1: NAVIGATION & ZONING',
            content: [
                { title: 'Preview', text: 'Core navigation preview is active. Full zoning intelligence requires Ultimate.' }
            ],
            scam: {
                title: 'CLASSIFIED',
                lie: 'Advanced scripts are hidden in Basic mode.',
                counter: 'Unlock Ultimate to reveal the complete counter-playbook.'
            },
            zones: { green: ['Core safe zones (preview)'], red: ['High-risk routes (classified)'] }
        },
        {
            id: 'mod_2',
            title: 'MODULE 2: THE VERBAL SHIELD',
            levels: [
                { level: 1, name: 'PREVIEW', use: 'Baseline', script: 'La, Shukran', meaning: 'No, thanks' }
            ]
        },
        {
            id: 'mod_3',
            title: 'MODULE 3: VISUAL CAMOUFLAGE',
            blocks: [
                { title: 'Preview', do: 'Conservative neutral outfit.', avoid: 'Flashy tourist signals.' },
                { title: 'CLASSIFIED HACK', text: 'Ultimate unlocks the full camouflage matrix.' },
                { title: 'TACTICAL LOADOUT', items: ['Sunglasses', 'Cross-body bag'] }
            ]
        },
        {
            id: 'mod_4',
            title: 'MODULE 4: SAFE HAVENS',
            locations: [
                { name: 'Safe Haven Preview', type: 'Quiet', note: 'Full vetted list is Ultimate-only.' }
            ]
        }
    ]
};

const BASIC_PROTOCOLS_BRIEFING_PREVIEW = [
    {
        day: 'DAY 1',
        id: 'day_1_preview',
        title: 'PHASE 01: INFILTRATION PREVIEW',
        focus: 'Medina Core',
        waypoints: [
            {
                id: 'p_wp_1',
                time: '15:00',
                name: 'Koutoubia Mosque',
                type: 'Landmark',
                intel: 'Preview intel available. Ultimate unlock provides full route logic, anti-scam tactics, and detailed extraction paths.',
                tactics: [
                    'Use daylight for first entry and keep high-visibility routes.',
                    'Unlock Ultimate for full waypoint-by-waypoint protocol trees.'
                ]
            },
            {
                id: 'p_wp_2',
                time: '20:30',
                name: 'Jemaa el-Fnaa',
                type: 'Recon',
                intel: 'Basic preview exposes perimeter-only guidance.',
                tactics: [
                    'Maintain spacing and keep valuables in front pockets.',
                    'Ultimate includes threat-specific micro-protocols and timing windows.'
                ]
            }
        ]
    },
    {
        day: 'DAY 2',
        id: 'day_2_preview',
        title: 'PHASE 02: RECON PREVIEW',
        focus: 'Souk Network',
        waypoints: [
            {
                id: 'p_wp_3',
                time: '10:00',
                name: 'Souk Semmarine',
                type: 'Market',
                intel: 'Basic gives a limited operation window with safety baseline.',
                tactics: [
                    'Run low-value recon only during first pass.',
                    'Ultimate unlocks full pricing traps map and escalation playbooks.'
                ]
            }
        ]
    }
];

const BASIC_PROTOCOLS_MISSIONS_PREVIEW = [
    {
        id: 'mission_preview_1',
        title: 'Arrival Recon',
        image: 'R',
        meta: 'Day Zero',
        context: 'Build baseline situational awareness around your riad and nearest safe corridors before peak traffic hours.',
        steps: [
            'Mark 2 fallback exits from your lodging.',
            'Walk your first route in daylight before sunset.',
            'Store one emergency landmark in memory for fast orientation.'
        ],
        tip: 'Stay in observer mode. First-day mission is visibility, not speed.'
    },
    {
        id: 'mission_preview_2',
        title: 'Souk Pattern Check',
        image: 'S',
        meta: 'Market Drill',
        context: 'Run a low-risk pass in the souk to map pressure zones and identify clean vendor behavior.',
        steps: [
            'Do one no-buy loop to read flow and crowd density.',
            'Log one fair-price anchor before engaging any purchase.',
            'Abort fast if a deal becomes rushed or emotionally pressured.'
        ],
        tip: 'A controlled retreat is a tactical win, not a failed mission.'
    },
    {
        id: 'mission_preview_3',
        title: 'Night Exit Protocol',
        image: 'N',
        meta: 'After Dark',
        context: 'Prepare a clean return path before night activity ramps up.',
        steps: [
            'Set a fixed exfiltration time before leaving.',
            'Keep one transport fallback option ready.',
            'Use high-visibility streets for the final segment.'
        ],
        tip: 'Predictability beats improvisation at night in dense sectors.'
    }
];

const BASIC_PROTOCOLS_MISSIONS_FULL = [
    {
        id: 'bread',
        title: 'THE BREAD PROTOCOL',
        image: 'B',
        meta: '1 Hour | ~3 DH | Medium',
        context: "Bread is sacred ('Niama'). Locals do not bake at home; they send dough to the Ferran (wood-fired oven) for a smoky taste you cannot buy in stores.",
        steps: [
            'Prep and mark the dough before drop-off so the baker can identify it.',
            "Carry it on a Wossla and tell the Maalem: 'Afak tayeb liya had lkhobz'.",
            'Return after around 45 minutes, pay the small fee, and carry it back while hot.'
        ],
        tip: 'Never throw bread on the floor. If it falls, pick it up respectfully.'
    },
    {
        id: 'hammam',
        title: 'THE HAMMAM PROTOCOL',
        image: 'H',
        meta: '2-3 Hours | ~150 DH | High',
        context: 'This is not a spa. It is a purification ritual where social classes mix and the full scrub process is part of local culture.',
        steps: [
            'Bring black soap (saboun beldi), a rough glove (kess), and ghassoul clay.',
            'Start in the warm room, apply black soap, and wait around 15 minutes.',
            'Rinse, then complete the gommage scrub with an experienced kessal.'
        ],
        tip: 'Do not waste water and keep underwear on; both are local etiquette norms.'
    },
    {
        id: 'tangia',
        title: 'THE TANGIA PROTOCOL',
        image: 'T',
        meta: '4-6 Hours | ~150 DH | Medium',
        context: 'Tangia is a traditional dish cooked in hammam ash heat, not in a regular kitchen. It is a craft workflow more than a standard meal.',
        steps: [
            'Start with quality cuts and add garlic, cumin, saffron, smen, and preserved lemon.',
            'Seal the clay pot and hand it to the fernatchi to bury in hot ashes.',
            'Collect after 4-6 hours when meat is confit and ready for shared eating.'
        ],
        tip: 'Do not add water; the moisture comes from the meat and fats.'
    },
    {
        id: 'tailor',
        title: 'THE TAILOR PROTOCOL',
        image: 'L',
        meta: '24-48 Hours | 400+ DH | Medium',
        context: 'Commissioning a gandoura means selecting fabric, sfifa details, and cut with a local maalem instead of buying tourist fast-fashion.',
        steps: [
            'Choose fabric type by season and prepare around 3 meters.',
            'Pick sfifa color and request the traditional makhzania cut.',
            'Give enough time (24-48h) for proper finishing and fit.'
        ],
        tip: "Trust the tailor's palette suggestions; color matching is part of the craft."
    },
    {
        id: 'scent',
        title: 'THE SCENT PROTOCOL',
        image: 'S',
        meta: '45 Mins | 100+ DH | Easy',
        context: 'In the attarine souk, fragrance is blended from memory and notes, not picked from a fixed brand shelf.',
        steps: [
            'Anchor with a base note such as musk, amber, or oud.',
            'Layer heart and top notes like rose, jasmine, or neroli.',
            'Ask for the blend recipe card so you can reproduce it later.'
        ],
        tip: 'Smell coffee beans between trials to reset your nose.'
    }
];

    windowObj.ALIDADE_MODULE_PREVIEWS = windowObj.ALIDADE_MODULE_PREVIEWS || {};
    windowObj.ALIDADE_MODULE_PREVIEWS.BASIC_THREAT_PREVIEW = BASIC_THREAT_PREVIEW;
    windowObj.ALIDADE_MODULE_PREVIEWS.BASIC_INTEL_PREVIEW = BASIC_INTEL_PREVIEW;
    windowObj.ALIDADE_MODULE_PREVIEWS.BASIC_INTEL_OXYGEN_TARGETS = BASIC_INTEL_OXYGEN_TARGETS;
    windowObj.ALIDADE_MODULE_PREVIEWS.BASIC_INTEL_RATIONS_STREET_TARGETS = BASIC_INTEL_RATIONS_STREET_TARGETS;
    windowObj.ALIDADE_MODULE_PREVIEWS.BASIC_INTEL_RATIONS_LOCKED_TARGETS = BASIC_INTEL_RATIONS_LOCKED_TARGETS;
    windowObj.ALIDADE_MODULE_PREVIEWS.BASIC_FORTRESS_PREVIEW = BASIC_FORTRESS_PREVIEW;
    windowObj.ALIDADE_MODULE_PREVIEWS.BASIC_PROTOCOLS_BRIEFING_PREVIEW = BASIC_PROTOCOLS_BRIEFING_PREVIEW;
    windowObj.ALIDADE_MODULE_PREVIEWS.BASIC_PROTOCOLS_MISSIONS_PREVIEW = BASIC_PROTOCOLS_MISSIONS_PREVIEW;
    windowObj.ALIDADE_MODULE_PREVIEWS.BASIC_PROTOCOLS_MISSIONS_FULL = BASIC_PROTOCOLS_MISSIONS_FULL;
})(typeof window !== 'undefined' ? window : null);
