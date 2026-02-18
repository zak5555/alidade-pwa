/**
 * ALIDADE™ - English Translation (Master Language)
 * ═══════════════════════════════════════════════════════════════
 * Status: 100% Complete (Source of Truth)
 * 
 * Poka-Yoke Rules:
 * - This is the master file - all keys here MUST exist in fr.js and es.js
 * - Use short, nested structure for compactness
 * - Keys follow: module.context.key pattern
 * ═══════════════════════════════════════════════════════════════
 */

export default {
    // ═══════════════════════════════════════════════════════════════
    // COMMON: Shared UI elements across all modules
    // ═══════════════════════════════════════════════════════════════
    common: {
        buttons: {
            calculate: "Calculate",
            reset: "Reset",
            save: "Save",
            cancel: "Cancel",
            close: "Close",
            back: "Back",
            next: "Next",
            confirm: "Confirm",
            start: "Start",
            stop: "Stop",
            submit: "Submit",
            copy: "Copy",
            share: "Share",
            download: "Download"
        },
        labels: {
            price: "Price",
            distance: "Distance",
            time: "Time",
            status: "Status",
            total: "Total",
            average: "Average",
            loading: "Loading...",
            error: "Error",
            success: "Success",
            warning: "Warning",
            info: "Info"
        },
        units: {
            dh: "DH",
            km: "km",
            m: "m",
            min: "min",
            sec: "sec",
            hrs: "hrs"
        },
        messages: {
            no_data: "No data available",
            loading: "Loading...",
            error_generic: "Something went wrong",
            offline: "You're offline",
            online: "Back online"
        }
    },

    // ═══════════════════════════════════════════════════════════════
    // NAV: Main navigation
    // ═══════════════════════════════════════════════════════════════
    nav: {
        home: "Home",
        souk: "Souk Ops",
        defense: "Defense",
        intel: "Intel",
        compass: "Compass",
        phrases: "Phrases",
        protocols: "Protocols",
        settings: "Settings",
        map: "Map"
    },

    // ═══════════════════════════════════════════════════════════════
    // HOME: Dashboard
    // ═══════════════════════════════════════════════════════════════
    home: {
        greeting: "MARHABA",
        subtitle: "OPERATIVE",
        status: {
            online: "System Online",
            offline: "Offline Mode",
            syncing: "Syncing..."
        },
        cards: {
            map: {
                title: "Navigation Matrix",
                subtitle: "FIELD MAP ACCESS",
                desc: "Access your tactical map data. Download for offline operations or connect to live intel feed.",
                download: "DOWNLOAD OFFLINE DATA",
                view: "VIEW MAP"
            },
            souk: {
                title: "Souk Operations",
                subtitle: "MARKET WARFARE",
                desc: "Strategic tools for market navigation. Calculate fair prices and negotiate like a local."
            },
            defense: {
                title: "Defense Matrix",
                subtitle: "THREAT DATABASE",
                desc: "Comprehensive scam database and countermeasures. Know the threats before they know you."
            }
        }
    },

    // ═══════════════════════════════════════════════════════════════
    // SHADOW: Shadow Meter (Taxi Calculator)
    // ═══════════════════════════════════════════════════════════════
    shadow: {
        title: "Shadow Meter",
        subtitle: "Taxi Fare Auditor",
        inputs: {
            distance: "Distance (km)",
            distance_placeholder: "Enter distance"
        },
        results: {
            fair_price: "Fair Price",
            tourist_price: "Tourist Price",
            savings: "You Save",
            formula: "Formula"
        },
        tips: {
            title: "Pro Tips",
            insist_meter: "Always insist on the meter before entering",
            agree_price: "If no meter, agree on price BEFORE entering",
            screenshot: "Take a screenshot of the meter at start",
            exit_safe: "If overcharged, exit at a safe, public location"
        }
    },

    // ═══════════════════════════════════════════════════════════════
    // HAGGLE: Haggle Wizard (Negotiation AI)
    // ═══════════════════════════════════════════════════════════════
    haggle: {
        title: "Haggle Wizard",
        subtitle: "AI Negotiation Engine",
        inputs: {
            vendor_offer: "Vendor's Asking Price",
            vendor_placeholder: "Enter price in DH"
        },
        prices: {
            shock: {
                label: "Shock Price",
                desc: "Your opening offer",
                tip: "Start at 25% of asking to anchor low"
            },
            fair: {
                label: "Fair Target",
                desc: "Realistic final price",
                tip: "Aim for 30-35% of asking"
            },
            walkaway: {
                label: "Walk-Away Threshold",
                desc: "Maximum you'll pay",
                tip: "Leave if they won't go below this"
            }
        },
        stages: {
            title: "Negotiation Stages",
            s1: "Stage 1: Shock Offer",
            s2: "Stage 2: Counter-Negotiate",
            s3: "Stage 3: Walk Away",
            s4: "Stage 4: Final Deal"
        },
        strategies: {
            aggressive: "Aggressive",
            balanced: "Balanced",
            conservative: "Conservative"
        },
        confidence: "Confidence",
        analyze: "Analyze Price",
        recording: "Record Outcome"
    },

    // ═══════════════════════════════════════════════════════════════
    // DEFENSE: Defense Matrix (Scam Database)
    // ═══════════════════════════════════════════════════════════════
    defense: {
        title: "Defense Matrix",
        subtitle: "Scam Intelligence Database",
        header_subtitle: "Defense Module",
        survival_command: "SURVIVAL COMMAND",
        sos_button: "SOS 19/15",
        tabs: {
            threats: "THREATS",
            logistics: "LOGISTICS",
            legal: "LEGAL & SOS",
            protocols: "Protocols",
            phonetics: "Phonetics"
        },
        threat_levels: {
            critical: "Critical",
            high: "High",
            medium: "Medium",
            low: "Low"
        },
        scams: {
            dcc: {
                name: "DCC Currency Trap",
                desc: "ATM/card machine offers to charge in your home currency",
                loss: "Typical loss: 5-8%",
                avoid: "Always press MAD/Dirham option"
            },
            taxi_meter: {
                name: "Broken Meter Scam",
                desc: "Driver claims meter is broken to negotiate inflated fare",
                loss: "Typical overcharge: 2-3×",
                avoid: "Insist on meter or exit immediately"
            },
            guide: {
                name: "Fake Guide Trap",
                desc: "Stranger offers to 'help' then demands payment",
                loss: "Typical demand: 100-500 DH",
                avoid: "Firmly say 'La Shukran' and keep walking"
            },
            spice: {
                name: "Spice Bait & Switch",
                desc: "Quality spices shown, tourist-grade packed",
                loss: "Value: 50-80% less",
                avoid: "Watch them pack YOUR selection"
            },
            leather: {
                name: "Fake Leather",
                desc: "Camel or synthetic sold as genuine leather",
                loss: "Value: 70-90% less",
                avoid: "Burn test, smell test, flex test"
            },
            riad_redirect: {
                name: "Riad Redirect",
                desc: "'Your riad closed' - led to competitor",
                loss: "Commission: 10-20%",
                avoid: "Call your riad directly, ignore 'helpers'"
            }
        },
        protocols: {
            title: "Defense Protocols",
            golden_rules: "Golden Rules",
            emergency: "Emergency Contacts",
            phrases: "Power Phrases"
        }
    },

    // ═══════════════════════════════════════════════════════════════
    // INTEL: Intelligence Hub
    // ═══════════════════════════════════════════════════════════════
    intel: {
        title: "Hidden Gems",
        subtitle: "Local Intelligence",
        header_subtitle: "Intelligence Database",
        header_title: "HIDDEN GEMS",
        tabs: {
            rations: "RATIONS",
            oxygen: "OXYGEN",
            recon: "RECON",
            maze: "THE MAZE",
            elevation: "ELEVATION",
            recovery: "RECOVERY",
            nightlife: "NIGHT OPS"
        },
        scanner: {
            title: "Market Price Analyzer",
            desc: "AI-powered fair price estimation",
            start: "Initialize Scanner"
        },
        categories: {
            food: "Food & Drink",
            shopping: "Shopping",
            culture: "Culture",
            nature: "Nature"
        }
    },

    // ═══════════════════════════════════════════════════════════════
    // FORENSICS: Product Forensics Lab
    // ═══════════════════════════════════════════════════════════════
    forensics: {
        title: "Product Forensics",
        subtitle: "Authenticity Analysis Lab",
        tabs: {
            argan: "Argan",
            saffron: "Saffron",
            ceramics: "Ceramics",
            leather: "Leather",
            textiles: "Textiles",
            jewelry: "Jewelry",
            antiques: "Antiques"
        },
        tests: {
            visual: "Visual Test",
            tactile: "Tactile Test",
            smell: "Smell Test",
            chemical: "Chemical Test"
        },
        results: {
            authentic: "Likely Authentic",
            suspicious: "Suspicious",
            fake: "Likely Fake"
        }
    },

    // ═══════════════════════════════════════════════════════════════
    // VECTOR: Solar Compass
    // ═══════════════════════════════════════════════════════════════
    vector: {
        title: "Vector HUD",
        subtitle: "Solar Navigation",
        compass: {
            title: "Solar Compass",
            calibrate: "Calibrate",
            heading: "Heading",
            north: "N",
            south: "S",
            east: "E",
            west: "W"
        },
        sun: {
            sunrise: "Sunrise",
            sunset: "Sunset",
            golden_hour: "Golden Hour",
            solar_noon: "Solar Noon"
        },
        prayer: {
            title: "Prayer Times",
            fajr: "Fajr",
            dhuhr: "Dhuhr",
            asr: "Asr",
            maghrib: "Maghrib",
            isha: "Isha"
        }
    },

    // ═══════════════════════════════════════════════════════════════
    // PHRASES: Arabic Phrase Assistant
    // ═══════════════════════════════════════════════════════════════
    phrases: {
        title: "Phrase Arsenal",
        subtitle: "Darija Survival Kit",
        categories: {
            greetings: "Greetings",
            shopping: "Shopping",
            directions: "Directions",
            numbers: "Numbers",
            emergency: "Emergency",
            food: "Food & Drink"
        },
        ui: {
            search: "Search phrases...",
            play: "Play audio",
            favorite: "Add to favorites",
            copy: "Copy phrase",
            favorites: "My Favorites",
            recent: "Recently Used"
        },
        difficulty: {
            easy: "Easy",
            medium: "Medium",
            hard: "Hard"
        }
    },

    // ═══════════════════════════════════════════════════════════════
    // PROTOCOLS: Insider Protocols
    // ═══════════════════════════════════════════════════════════════
    protocols: {
        title: "Insider Code",
        subtitle: "5-Day Marrakech Mastery",
        tabs: {
            timeline: "Timeline",
            missions: "Missions",
            intel: "Intel"
        },
        days: {
            day1: "Day 1: Orientation",
            day2: "Day 2: Souk Mastery",
            day3: "Day 3: Hidden Treasures",
            day4: "Day 4: Beyond Walls",
            day5: "Day 5: Expert Level"
        },
        status: {
            locked: "Locked",
            unlocked: "Unlocked",
            completed: "Completed",
            in_progress: "In Progress"
        }
    },

    // ═══════════════════════════════════════════════════════════════
    // SETTINGS: App Settings
    // ═══════════════════════════════════════════════════════════════
    settings: {
        title: "Settings",
        subtitle: "System Configuration",
        sections: {
            appearance: "Appearance",
            language: "Language",
            notifications: "Notifications",
            data: "Data & Storage",
            about: "About"
        },
        language: {
            label: "Interface Language",
            en: "English",
            fr: "Français",
            es: "Español",
            select: "Select language"
        },
        theme: {
            label: "Theme",
            dark: "Dark Mode",
            light: "Light Mode",
            auto: "Auto (System)"
        },
        haptics: {
            label: "Haptic Feedback",
            enabled: "Enabled",
            disabled: "Disabled"
        },
        offline: {
            label: "Offline Data",
            download: "Download for offline use",
            clear: "Clear cached data",
            size: "Cache size",
            last_sync: "Last sync"
        },
        about: {
            version: "Version",
            build: "Build",
            developer: "Developer",
            support: "Support",
            privacy: "Privacy Policy",
            terms: "Terms of Service"
        }
    },

    // ═══════════════════════════════════════════════════════════════
    // MAP: Navigation Map
    // ═══════════════════════════════════════════════════════════════
    map: {
        title: "Tactical Map",
        subtitle: "Navigation System",
        layers: {
            markers: "POI Markers",
            routes: "Routes",
            zones: "Zones",
            heatmap: "Heat Map"
        },
        poi: {
            riad: "Riad/Hotel",
            restaurant: "Restaurant",
            cafe: "Café",
            mosque: "Mosque",
            museum: "Museum",
            market: "Market",
            pharmacy: "Pharmacy",
            atm: "ATM",
            taxi: "Taxi Stand"
        },
        actions: {
            center: "Center on me",
            directions: "Get directions",
            save: "Save location",
            share: "Share location"
        }
    },

    // ═══════════════════════════════════════════════════════════════
    // ERRORS: Error Messages
    // ═══════════════════════════════════════════════════════════════
    errors: {
        network: "Network error. Please check your connection.",
        timeout: "Request timed out. Please try again.",
        not_found: "Resource not found.",
        permission: "Permission denied.",
        generic: "An error occurred. Please try again.",
        offline: "This feature requires an internet connection.",
        camera: "Camera access denied.",
        location: "Location access denied."
    },

    // ═══════════════════════════════════════════════════════════════
    // PRICE CHECKER: AI Price Verification
    // ═══════════════════════════════════════════════════════════════
    price_checker: {
        title: "Price Scanner",
        subtitle: "AI Fair Price Verification",
        scanning: "Scanning...",
        analyzing: "Analyzing price...",
        results: {
            fair: "Fair Price",
            overpriced: "Overpriced",
            deal: "Good Deal",
            scam: "Potential Scam"
        },
        confidence: "Confidence",
        suggested_offer: "Suggested Opening Offer",
        walkaway: "Walk Away Above"
    },

    // ═══════════════════════════════════════════════════════════════
    // CURRENCY: Currency Converter
    // ═══════════════════════════════════════════════════════════════
    currency: {
        title: "Currency Converter",
        from: "From",
        to: "To",
        rate: "Exchange Rate",
        updated: "Last updated",
        offline_rate: "Offline rate (may be outdated)"
    },

    // ═══════════════════════════════════════════════════════════════
    // ONBOARDING: First-time user flow
    // ═══════════════════════════════════════════════════════════════
    onboarding: {
        welcome: "Welcome to ALIDADE",
        tagline: "Your tactical survival companion for Marrakech",
        steps: {
            language: "Choose your language",
            permissions: "Enable features",
            ready: "You're ready!"
        },
        skip: "Skip intro",
        continue: "Continue"
    },

    // ═══════════════════════════════════════════════════════════════
    // WALLET: Smart Wallet
    // ═══════════════════════════════════════════════════════════════
    wallet: {
        title: "SMART WALLET",
        subtitle: "Budget Intelligence • Scam Detection • Fair Prices",
        setup_title: "SMART WALLET SETUP",
        setup_subtitle: "Configure your trip budget for intelligent tracking",
        status: {
            on_track: "ON TRACK",
            spending_fast: "SPENDING FAST",
            under_budget: "UNDER BUDGET",
            over_budget: "OVER BUDGET"
        },
        labels: {
            remaining: "remaining of",
            day: "Day",
            per_day: "DH/day",
            spent: "spent",
            add_expense: "ADD EXPENSE",
            description: "Description",
            description_placeholder: "e.g., taxi, tajine",
            recent_transactions: "RECENT TRANSACTIONS",
            no_transactions: "No transactions yet. Add your first expense above!",
            by_category: "BY CATEGORY",
            reset_wallet: "Reset Wallet",
            total_budget: "Total Budget",
            trip_duration: "Trip Duration",
            days: "days",
            budget_intelligence: "BUDGET INTELLIGENCE",
            start_tracking: "START TRACKING"
        },
        categories: {
            food: "Food",
            transport: "Transport",
            shopping: "Shopping",
            activities: "Activities",
            services: "Services",
            other: "Other"
        },
        profiles: {
            backpacker: "Backpacker",
            budget: "Budget",
            mid_range: "Mid-Range",
            luxury: "Luxury"
        },
        dcc: {
            title: "DCC SHIELD ACTIVE",
            warning: "At ATMs: ALWAYS press MAD. Never EUR/USD.",
            full_title: "THE DCC SHIELD",
            full_desc: "At ATMs and card machines, they may offer to charge you in your home currency (USD/EUR/GBP). This is",
            full_warning: "NEVER USD/EUR. Dynamic Currency Conversion adds 5-10% hidden fees."
        },
        price_check: {
            fair: "Fair Price",
            overpaid: "OVERPAID",
            severely_overpaid: "SEVERELY OVERPAID",
            scam_price: "SCAM PRICE",
            great_deal: "GREAT DEAL!",
            slightly_high: "SLIGHTLY HIGH"
        }
    },

    // ═══════════════════════════════════════════════════════════════
    // SOUK: Souk Operations Module
    // ═══════════════════════════════════════════════════════════════
    souk: {
        title: "SOUK INTELLIGENCE",
        subtitle: "Market Operations",
        header_main: "SOUK",
        header_sub: "INTELLIGENCE",
        category_matrix: "Category Matrix",
        categories: {
            negotiation: "Negotiation",
            negotiation_desc: "Tactical Haggle Script",
            forensics: "Forensics",
            forensics_desc: "Material Authenticity",
            ceramics: "Ceramics",
            ceramics_desc: "Pottery & Glazed Ware",
            leather: "Leather",
            leather_desc: "Bags & Goods",
            rugs: "Rugs",
            rugs_desc: "Carpets & Textiles",
            metals: "Metals",
            metals_desc: "Copper & Brass"
        },
        price_database: {
            title: "FULL PRICE DATABASE",
            desc: "31 Items • All Categories • Search & Filter"
        }
    },

    // ═══════════════════════════════════════════════════════════════
    // DASHBOARD: Home Dashboard Labels
    // ═══════════════════════════════════════════════════════════════
    dashboard: {
        system_status: "System Status",
        navigation_matrix: "Navigation Matrix",
        field_map: "FIELD MAP ACCESS",
        map_desc: "Access your tactical map data. Download for offline operations or connect to live intel feed.",
        download_offline: "DOWNLOAD OFFLINE DATA",
        offline_locked: "OFFLINE DATA LOCKED",
        open_live_map: "OPEN LIVE MAP",
        package: "PACKAGE",
        operations_hub: "Operations Hub",
        menu: {
            souk_ops: "SOUK OPS",
            market_intel: "Market Intel",
            defense: "DEFENSE",
            threat_matrix: "Threat Matrix",
            organic_lab: "ORGANIC LAB",
            food_safety: "Food Safety & Pharmacy Protocols",
            intel: "INTEL",
            hidden_gems: "Hidden Gems",
            fortress: "THE FORTRESS",
            solo_female: "Solo Female Ops",
            protocols: "PROTOCOLS",
            insider_code: "Insider Code",
            vector_hud: "VECTOR HUD",
            compass_distance: "Compass & Distance",
            phrase_assistant: "PHRASE ASSISTANT",
            speak_local: "Speak Local"
        }
    }
};
