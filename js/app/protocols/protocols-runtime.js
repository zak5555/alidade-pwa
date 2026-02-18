// Extracted from app.js: protocols/wallet/settings runtime block (compatibility-first).

const protocolsModulePreviewData = window.ALIDADE_MODULE_PREVIEWS || {};

const BASIC_PROTOCOLS_BRIEFING_PREVIEW = protocolsModulePreviewData.BASIC_PROTOCOLS_BRIEFING_PREVIEW || [];

const BASIC_PROTOCOLS_MISSIONS_PREVIEW = protocolsModulePreviewData.BASIC_PROTOCOLS_MISSIONS_PREVIEW || [];

const BASIC_PROTOCOLS_MISSIONS_FULL = protocolsModulePreviewData.BASIC_PROTOCOLS_MISSIONS_FULL || [];

const protocolsRuntimeDebugLog = (...args) => {
    if (window.__ALIDADE_DEBUG_LOGS__ === true) {
        console.log(...args);
    }
};

let PROTOCOLS_DATA = {
    user_rank: 'TOURIST',
    xp: 0,
    ranks: ['TOURIST', 'NOVICE', 'OPERATIVE', 'INSIDER', 'LOCAL LEGEND'],
    missions: BASIC_PROTOCOLS_MISSIONS_FULL,
    itinerary: [],
    briefing: BASIC_PROTOCOLS_BRIEFING_PREVIEW
};

const ULTIMATE_PROTOCOLS_PACK_SRC = 'js/data/ultimate-protocols-pack.js';
let __ultimateProtocolsPackPromise = null;

function hasUltimateProtocolsPack() {
    return Array.isArray(window.ALIDADE_ULTIMATE_PACK?.protocolsBriefing) &&
        window.ALIDADE_ULTIMATE_PACK.protocolsBriefing.length > 0;
}

function getProtocolsBriefingData() {
    const tier = normalizeTierTag(USER_TIER || window.USER_TIER || 'BASIC');
    if (tier === 'ULTIMATE' && hasUltimateProtocolsPack()) {
        return window.ALIDADE_ULTIMATE_PACK.protocolsBriefing;
    }
    return PROTOCOLS_DATA.briefing || [];
}

function loadUltimateProtocolsPack() {
    if (hasUltimateProtocolsPack()) {
        return Promise.resolve(true);
    }

    if (__ultimateProtocolsPackPromise) {
        return __ultimateProtocolsPackPromise;
    }

    __ultimateProtocolsPackPromise = new Promise((resolve) => {
        const existingScript = document.querySelector('script[data-alidade-pack="ultimate-protocols"]');
        if (existingScript) {
            existingScript.addEventListener('load', () => resolve(hasUltimateProtocolsPack()), { once: true });
            existingScript.addEventListener('error', () => resolve(false), { once: true });
            return;
        }

        const script = document.createElement('script');
        script.src = ULTIMATE_PROTOCOLS_PACK_SRC;
        script.async = true;
        script.defer = true;
        script.dataset.alidadePack = 'ultimate-protocols';
        script.onload = () => resolve(hasUltimateProtocolsPack());
        script.onerror = () => {
            console.warn('[PROTOCOLS] Ultimate data pack failed to load:', ULTIMATE_PROTOCOLS_PACK_SRC);
            resolve(false);
        };
        document.head.appendChild(script);
    });

    return __ultimateProtocolsPackPromise;
}

function ensureProtocolsBriefingData() {
    const tier = normalizeTierTag(USER_TIER || window.USER_TIER || 'BASIC');
    if (tier !== 'ULTIMATE') {
        return Promise.resolve(false);
    }
    return Promise.all([
        ensureUltimateDataPack(),
        loadUltimateProtocolsPack()
    ]).then(([, protocolsPackLoaded]) => protocolsPackLoaded);
}

function renderBriefingLoadingState() {
    return `
        <div class="p-4 rounded-[2px] border border-void-800 bg-void-900/40 text-center">
            <p class="text-xs text-zinc-400 font-mono uppercase tracking-widest">Loading briefing archive...</p>
        </div>
    `;
}

// Protocol state (persisted to localStorage)
let protocolState = JSON.parse(localStorage.getItem('alidadeProtocolState')) || {
    currentTab: 'missions',
    xp: 0,
    completedMissions: [],
    completedWaypoints: [], // Track completed waypoints by wp.id (e.g., "wp_1_1")
    expandedWaypoint: null, // Currently expanded waypoint wp.id
    walletBudget: 400,
    walletExpenses: { food: 0, transport: 0, shopping: 0, other: 0 }
};

// Save state to localStorage
function saveProtocolState() {
    localStorage.setItem('alidadeProtocolState', JSON.stringify(protocolState));
}

// ---------------------------------------------------------------
// SMART WALLET - STATE MANAGEMENT
// ---------------------------------------------------------------

const WALLET_STORAGE_KEY = 'alidade_smart_wallet';

// Load wallet state from localStorage
function loadWalletState() {
    try {
        const saved = localStorage.getItem(WALLET_STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.warn('[WALLET] Failed to load state:', e);
    }

    // Default state
    return {
        initialized: false,
        budget: {
            total: 0,
            days: 5,
            style: 'budget', // backpacker, budget, mid_range, luxury
            startDate: null
        },
        transactions: [],
        categories: {
            food: { total: 0, count: 0 },
            transport: { total: 0, count: 0 },
            shopping: { total: 0, count: 0 },
            activities: { total: 0, count: 0 },
            services: { total: 0, count: 0 },
            other: { total: 0, count: 0 }
        },
        alerts: [], // Scam warnings, tips
        dismissedTips: [] // Tips user has dismissed
    };
}

let walletState = loadWalletState();

function saveWalletState() {
    try {
        localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(walletState));
    } catch (e) {
        console.warn('[WALLET] Failed to save state:', e);
    }
}

function generateId() {
    return 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ---------------------------------------------------------------
// SMART WALLET - KNOWLEDGE BASE INTEGRATION
// ---------------------------------------------------------------

function getKB() {
    return window.MARRAKECH_KNOWLEDGE_BASE || {};
}

// Detect potential scams in a transaction
function detectScam(transaction) {
    const kb = getKB();
    if (!kb.scams) return { scam_detected: false };

    const desc = (transaction.description || '').toLowerCase();
    const amount = transaction.amount || 0;
    const category = transaction.category || '';

    const results = [];

    // DCC Scam Detection (ATM/Card with EUR mentioned)
    if (desc.includes('eur') || desc.includes('usd') || desc.includes('gbp') ||
        desc.includes('dcc') || desc.includes('conversion')) {
        const scam = kb.scams.dcc;
        if (scam) {
            const lossRate = scam.typical_loss_pct || 0.08;
            results.push({
                scam_id: 'dcc',
                severity: scam.severity,
                message: scam.user_message,
                potential_loss: Math.round(amount * lossRate),
                source: 'Market research'
            });
        }
    }

    // Taxi Overcharge Detection
    if (category === 'transport' || desc.includes('taxi') || desc.includes('cab')) {
        const scam = kb.scams.taxi_no_meter;
        if (scam && scam.fair_pricing) {
            // Check common routes
            const routes = scam.fair_pricing.examples || [];
            for (const route of routes) {
                const routeName = route.route.toLowerCase();
                if (desc.includes('airport') && routeName.includes('airport')) {
                    if (amount > route.fair_price * 1.5) {
                        results.push({
                            scam_id: 'taxi_overcharge',
                            severity: 'high',
                            message: `[ALERT] TAXI OVERCHARGE\n\nFair price: ${route.fair_price} DH\nYou paid: ${amount} DH\nOvercharged: ${amount - route.fair_price} DH`,
                            fair_price: route.fair_price,
                            difference: amount - route.fair_price,
                            source: 'Market research'
                        });
                    }
                    break;
                }
            }

            // Generic taxi check
            if (results.length === 0 && amount > 150) {
                results.push({
                    scam_id: 'taxi_high',
                    severity: 'medium',
                    message: `[ALERT] HIGH TAXI FARE\n\nMost city rides: 30 - 80 DH\nYou paid: ${amount} DH\n\nTip: Always insist on meter`,
                    source: 'Market research'
                });
            }
        }
    }

    // Restaurant Bill Padding
    if (category === 'food' && amount > 150 &&
        (desc.includes('restaurant') || desc.includes('dinner') || desc.includes('lunch'))) {
        const scam = kb.scams.restaurant_bill_padding;
        if (scam) {
            results.push({
                scam_id: 'bill_reminder',
                severity: 'info',
                message: `[TIP] BILL CHECK REMINDER\n\nCommon extras:\n- Bread (10 DH)\n- Olives (15 DH)\n- Service (10%)\n\nVerify each item!`,
                source: 'Market research'
            });
        }
    }

    return {
        scam_detected: results.length > 0,
        alerts: results
    };
}

// Compare transaction amount to fair prices
function compareFairPrice(description, amount, category) {
    const kb = getKB();
    const desc = description.toLowerCase();
    let matchedPrice = null;
    let matchedItem = null;

    // ---------------------------------------------------------------
    // PRIORITY 1: Category + Threshold Checks (Broad Matching)
    // These trigger IMMEDIATELY for generic terms like "taxi", "juice"
    // ---------------------------------------------------------------

    const categoryThresholds = [
        // Transport
        { keywords: ['taxi', 'cab', 'petit taxi'], threshold: 70, fairPrice: 40, item: 'taxi ride (city)' },
        { keywords: ['airport taxi', 'airport transfer'], threshold: 150, fairPrice: 100, item: 'airport taxi' },
        { keywords: ['carriage', 'caleche'], threshold: 200, fairPrice: 150, item: 'carriage ride' },

        // Food
        { keywords: ['tajine', 'tagine'], threshold: 120, fairPrice: 70, item: 'tajine' },
        { keywords: ['couscous'], threshold: 120, fairPrice: 80, item: 'couscous' },
        { keywords: ['juice', 'orange juice', 'jus'], threshold: 20, fairPrice: 5, item: 'fresh juice' },
        { keywords: ['water', 'eau'], threshold: 15, fairPrice: 5, item: 'bottled water' },
        { keywords: ['coffee', 'cafe', 'café'], threshold: 25, fairPrice: 10, item: 'coffee' },
        { keywords: ['tea', 'mint tea', 'thé'], threshold: 25, fairPrice: 12, item: 'mint tea' },

        // Shopping
        { keywords: ['leather bag', 'bag', 'sac'], threshold: 500, fairPrice: 300, item: 'leather bag' },
        { keywords: ['babouche', 'slippers'], threshold: 200, fairPrice: 120, item: 'babouches' },
        { keywords: ['scarf', 'foulard'], threshold: 150, fairPrice: 60, item: 'scarf' },
        { keywords: ['argan', 'huile'], threshold: 200, fairPrice: 100, item: 'argan oil' },
        { keywords: ['lantern', 'lamp', 'lanterne'], threshold: 400, fairPrice: 200, item: 'lantern' },
        { keywords: ['carpet', 'rug', 'tapis'], threshold: 2000, fairPrice: 800, item: 'carpet' },
        { keywords: ['spice', 'épice'], threshold: 80, fairPrice: 30, item: 'spices' }
    ];

    // Check each threshold rule
    for (const rule of categoryThresholds) {
        const keywordMatch = rule.keywords.some(kw => desc.includes(kw));
        if (keywordMatch) {
            matchedPrice = rule.fairPrice;
            matchedItem = rule.item;

            // If over threshold, definitely flag it
            if (amount > rule.threshold) {
                // Boost severity for extreme overcharges
                const diff = amount - matchedPrice;
                const diffPct = (diff / matchedPrice) * 100;

                let verdict, emoji, severity;
                if (diffPct > 200) {
                    verdict = 'SCAM PRICE';
                    emoji = '[CRIT]';
                    severity = 'critical';
                } else if (diffPct > 100) {
                    verdict = 'SEVERELY OVERPAID';
                    emoji = '[WARN]';
                    severity = 'critical';
                } else if (diffPct > 50) {
                    verdict = 'OVERPAID';
                    emoji = '[HIGH]';
                    severity = 'high';
                } else {
                    verdict = 'SLIGHTLY HIGH';
                    emoji = '[MED]';
                    severity = 'medium';
                }

                return {
                    found: true,
                    item: matchedItem,
                    fair_price: matchedPrice,
                    paid: amount,
                    difference: diff,
                    difference_pct: Math.round(diffPct),
                    verdict: verdict,
                    emoji: emoji,
                    severity: severity,
                    message: `${emoji} ${verdict} \n\nFair price: ${matchedPrice} DH\nYou paid: ${amount} DH\nOvercharged: +${diff} DH(${Math.round(diffPct)} %)`,
                    source: 'Market research'
                };
            }

            // Found a match, continue to calculate verdict even if under threshold
            break;
        }
    }

    // ---------------------------------------------------------------
    // PRIORITY 2: Knowledge Base Deep Search (if no threshold match)
    // ---------------------------------------------------------------

    if (!matchedPrice && kb.fair_prices) {
        const categories = ['shopping', 'food', 'transport', 'activities', 'services'];

        for (const cat of categories) {
            const prices = kb.fair_prices[cat];
            if (!prices) continue;

            for (const [key, value] of Object.entries(prices)) {
                if (typeof value !== 'number') continue;

                const searchKey = key.replace(/_/g, ' ').toLowerCase();
                // More flexible matching: check if any word matches
                const descWords = desc.split(/\s+/);
                const keyWords = searchKey.split(/\s+/);

                const hasMatch = descWords.some(dw =>
                    keyWords.some(kw => kw.includes(dw) || dw.includes(kw))
                );

                if (hasMatch) {
                    matchedPrice = value;
                    matchedItem = key.replace(/_/g, ' ');
                    break;
                }
            }
            if (matchedPrice) break;
        }
    }

    // ---------------------------------------------------------------
    // FALLBACK: No match found
    // ---------------------------------------------------------------

    if (!matchedPrice) {
        return { found: false, message: 'Price not in database' };
    }

    // Calculate verdict
    const diff = amount - matchedPrice;
    const diffPct = (diff / matchedPrice) * 100;

    let verdict, emoji, severity;
    if (diffPct > 200) {
        verdict = 'SCAM PRICE';
        emoji = '[CRIT]';
        severity = 'critical';
    } else if (diffPct > 100) {
        verdict = 'SEVERELY OVERPAID';
        emoji = '[WARN]';
        severity = 'critical';
    } else if (diffPct > 50) {
        verdict = 'OVERPAID';
        emoji = '[HIGH]';
        severity = 'high';
    } else if (diffPct > 20) {
        verdict = 'SLIGHTLY HIGH';
        emoji = '[MED]';
        severity = 'medium';
    } else if (diffPct > -10) {
        verdict = 'FAIR PRICE';
        emoji = '?';
        severity = 'ok';
    } else {
        verdict = 'GREAT DEAL!';
        emoji = '[GOOD]';
        severity = 'good';
    }

    return {
        found: true,
        item: matchedItem,
        fair_price: matchedPrice,
        paid: amount,
        difference: diff,
        difference_pct: Math.round(diffPct),
        verdict: verdict,
        emoji: emoji,
        severity: severity,
        message: `${emoji} ${verdict} \n\nFair price: ${matchedPrice} DH\nYou paid: ${amount} DH\nDifference: ${diff > 0 ? '+' : ''}${diff} DH(${Math.round(diffPct)} %)`,
        source: 'Market research'
    };
}

// Initialize budget with intelligence
function initializeBudget(total, days, style) {
    const kb = getKB();
    const profiles = kb.budget_profiles || {};
    const profile = profiles[style];

    if (!profile) {
        return {
            success: false,
            message: 'Choose: backpacker, budget, mid_range, luxury'
        };
    }

    const dailyAvg = total / days;
    const typicalDaily = profile.daily_total;

    let comparison, message;
    if (dailyAvg < typicalDaily * 0.8) {
        comparison = 'tight';
        const pctBelow = Math.round((1 - dailyAvg / typicalDaily) * 100);
        message = `[INFO] Budget ${pctBelow}% below typical ${style.replace('_', '-')} traveler.\n\nTypical: ${typicalDaily} DH / day\nYours: ${Math.round(dailyAvg)} DH / day`;
    } else if (dailyAvg > typicalDaily * 1.2) {
        comparison = 'generous';
        const pctAbove = Math.round((dailyAvg / typicalDaily - 1) * 100);
        message = `[INFO] Budget ${pctAbove}% above typical. Room for splurges!`;
    } else {
        comparison = 'realistic';
        message = `[OK] Budget matches typical ${style.replace('_', '-')} traveler.`;
    }

    // Calculate allocations based on profile breakdown
    const allocated = {};
    if (profile.breakdown) {
        const dailyTotal = Object.values(profile.breakdown).reduce((a, b) => a + b, 0);
        for (const [cat, amount] of Object.entries(profile.breakdown)) {
            const pct = amount / dailyTotal;
            allocated[cat] = Math.round(total * pct);
        }
    }

    return {
        success: true,
        total: total,
        days: days,
        style: style,
        daily_avg: Math.round(dailyAvg),
        typical_daily: typicalDaily,
        comparison: comparison,
        message: message,
        allocated: allocated,
        source: profile.source || 'Market research'
    };
}

// Analyze current budget status
function analyzeBudgetStatus() {
    if (!walletState.initialized) return null;

    const totalBudget = walletState.budget.total;
    const totalDays = walletState.budget.days;
    const spent = walletState.transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const remaining = totalBudget - spent;

    // Calculate days elapsed
    let daysElapsed = 1;
    if (walletState.budget.startDate) {
        const start = new Date(walletState.budget.startDate);
        const now = new Date();
        daysElapsed = Math.max(1, Math.ceil((now - start) / (1000 * 60 * 60 * 24)));
    }

    const daysRemaining = Math.max(1, totalDays - daysElapsed + 1);
    const dailyBudget = totalBudget / totalDays;
    const dailySpent = spent / daysElapsed;
    const projectedTotal = dailySpent * totalDays;

    let status, emoji;
    if (remaining < 0) {
        status = 'OVER BUDGET';
        emoji = '[ALERT]';
    } else if (dailySpent > dailyBudget * 1.2) {
        status = 'SPENDING FAST';
        emoji = '[FAST]';
    } else if (dailySpent < dailyBudget * 0.8) {
        status = 'UNDER BUDGET';
        emoji = '[SAVE]';
    } else {
        status = 'ON TRACK';
        emoji = '?';
    }

    return {
        total: totalBudget,
        spent: spent,
        remaining: remaining,
        days_elapsed: daysElapsed,
        days_remaining: daysRemaining,
        daily_budget: Math.round(dailyBudget),
        daily_spent: Math.round(dailySpent),
        projected_total: Math.round(projectedTotal),
        daily_remaining_budget: Math.round(remaining / daysRemaining),
        status: status,
        emoji: emoji,
        pct_spent: Math.round((spent / totalBudget) * 100)
    };
}

// Suggest tactical tips based on transactions
function suggestTips() {
    const kb = getKB();
    const tips = kb.tactical_tips || {};
    const transactions = walletState.transactions;
    const suggestions = [];

    // Water bottle pattern
    const waterPurchases = transactions.filter(tx =>
        tx.description.toLowerCase().includes('water') &&
        tx.amount >= 5 && tx.amount <= 15
    );

    if (waterPurchases.length >= 3 && !walletState.dismissedTips.includes('water_economics')) {
        const tip = tips.water_economics;
        if (tip) {
            const totalSpent = waterPurchases.reduce((sum, tx) => sum + tx.amount, 0);
            suggestions.push({
                id: 'water_economics',
                title: '[TIP] WATER',
                message: `You've bought ${waterPurchases.length} water bottles (${totalSpent} DH).\n\nBetter: 5L bottle = 15 DH (lasts 3 days)\nSavings: ~180 DH/week`,
                action: 'Got it!'
            });
        }
    }

    // Short taxi pattern
    const shortTaxis = transactions.filter(tx =>
        tx.category === 'transport' &&
        tx.description.toLowerCase().includes('taxi') &&
        tx.amount <= 40
    );

    if (shortTaxis.length >= 3 && !walletState.dismissedTips.includes('short_taxi_waste')) {
        suggestions.push({
            id: 'short_taxi_waste',
            title: '[TIP] TRANSPORT',
            message: `You've taken ${shortTaxis.length} short taxi rides.\n\nMany Medina destinations are 10-15 min walk.\nUse Shadow Meter for cool routes!`,
            action: 'Got it!'
        });
    }

    return suggestions;
}

function getProtocolRank() {
    const xpPerLevel = 20;
    const rankIndex = Math.min(Math.floor(protocolState.xp / xpPerLevel), PROTOCOLS_DATA.ranks.length - 1);
    return PROTOCOLS_DATA.ranks[rankIndex];
}

function getXPProgress() {
    const xpPerLevel = 20;
    return (protocolState.xp % xpPerLevel) / xpPerLevel * 100;
}

function renderProtocols() {
    if (ensureUltimateViewData('PROTOCOLS', renderProtocols)) {
        return;
    }

    const app = document.getElementById('app');
    const tier = normalizeTierTag(USER_TIER || window.USER_TIER || 'BASIC');
    const walletLocked = tier !== 'ULTIMATE' && !getFeatureUsageStatus(PROTOCOLS_WALLET_EXECUTE_FEATURE).allowed;
    const logisticsState = getProtocolsLogisticsGateStatus();
    const logisticsLocked = logisticsState.locked;

    if (walletLocked) {
        trackLockImpression('PROTOCOLS_WALLET_EXECUTE', 'protocols_wallet_tab');
    }
    if (logisticsLocked) {
        trackLockImpression('PROTOCOLS_LOGISTICS_OPTIMIZE', 'protocols_logistics_tab');
    }

    const html = `
            <div class="min-h-screen bg-void-950 pb-6">
                <!-- HEADER -->
                <header class="sticky top-0 z-20 bg-void-950/95 backdrop-blur-sm border-b border-purple-500/20 p-4">
                    <div class="flex items-center gap-3 mb-3">
                        <button onclick="window.alidadeApp.navigateTo('HOME')" class="p-2 rounded-[2px] bg-void-900/60 border border-void-800 hover:bg-purple-500/10 hover:border-purple-500/30 transition-all active:scale-95">
                            ${ICONS.arrowLeft}
                        </button>
                        <div>
                            <p class="text-[10px] text-purple-400 tracking-widest uppercase font-mono">Insider Code</p>
                            <h1 class="font-heading text-2xl font-bold text-purple-400">PROTOCOLS</h1>
                        </div>
                    </div>

                    <!-- 5-TAB NAVIGATION -->
                    <div class="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        <button class="protocol-tab flex-shrink-0 min-h-[48px] px-5 py-2 rounded-[2px] text-xs font-mono font-bold transition-all whitespace-nowrap flex items-center gap-2" data-protocol-tab="missions">OPS MISSIONS</button>
                        <button class="protocol-tab flex-shrink-0 min-h-[48px] px-5 py-2 rounded-[2px] text-xs font-mono font-bold transition-all whitespace-nowrap flex items-center gap-2" data-protocol-tab="briefing">INTEL BRIEFING</button>
                        <button class="protocol-tab flex-shrink-0 min-h-[48px] px-5 py-2 rounded-[2px] text-xs font-mono font-bold transition-all whitespace-nowrap flex items-center gap-2" data-protocol-tab="wallet">${walletLocked ? '&#128274;' : '&#128176;'} WALLET</button>
                        <button class="protocol-tab flex-shrink-0 min-h-[48px] px-5 py-2 rounded-[2px] text-xs font-mono font-bold transition-all whitespace-nowrap flex items-center gap-2" data-protocol-tab="ROUTE">${logisticsLocked ? '&#128274;' : '&#128666;'} LOGISTICS</button>
                        <button onclick="window.alidadeApp.renderSettingsOverlay()" class="hidden protocol-tab flex-shrink-0 min-h-[48px] px-5 py-2 rounded-[2px] text-xs font-mono font-bold transition-all whitespace-nowrap flex items-center gap-2" data-protocol-tab="settings">SYS SETTINGS</button>
                    </div>
                </header>

                <!-- TAB CONTENT -->
                <div id="protocol-content" class="px-4 pt-4 pb-20">
                    <!-- Rendered by JS -->
                </div>
            </div>
        `;

    app.innerHTML = html;

    // Restore tab state from persistence
    const savedTab = localStorage.getItem('activeProtocolTab');
    if (savedTab) {
        protocolState.currentTab = savedTab;
    }

    switchProtocolTab(protocolState.currentTab);
    attachProtocolListeners();
}

function attachProtocolListeners() {
    document.querySelectorAll('.protocol-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-protocol-tab');
            switchProtocolTab(tabName);
        });
    });
}

function switchProtocolTab(tabName) {
    // Update state
    protocolState.currentTab = tabName;
    saveProtocolState();

    // Update UI
    document.querySelectorAll('.protocol-tab').forEach(tab => {
        const isActive = tab.getAttribute('data-protocol-tab') === tabName;
        tab.classList.toggle('bg-purple-500/20', isActive);
        tab.classList.toggle('text-purple-400', isActive);
        if (isActive) {
            tab.classList.add('border', 'border-purple-500/50');
        } else {
            tab.classList.remove('border', 'border-purple-500/50');
        }
    });

    const content = document.getElementById('protocol-content');
    if (!content) return;

    // Render content
    if (tabName === 'missions') {
        renderMissionsTab(content);
    } else if (tabName === 'briefing') {
        content.innerHTML = `
                <div class="p-6 text-center text-zinc-500 font-mono text-sm border-2 border-dashed border-void-800 rounded-[2px]">
                    <p class="mb-2">CLASSIFIED BRIEFING</p>
                    <p>Accessing Intelligence Database...</p>
                </div>
            `;
    } else if (tabName === 'wallet') {
        content.innerHTML = `
                <div class="p-6 text-center text-zinc-500 font-mono text-sm border-2 border-dashed border-void-800 rounded-[2px]">
                    <p class="mb-2">OPERATIONAL FUNDS</p>
                    <p class="text-2xl text-white font-bold mb-1">${protocolState.walletBudget} DH</p>
                    <p>Remaining Budget</p>
                </div>
            `;
    } else if (tabName === 'settings') {
        // Render settings tab with language selector
        const currentLang = window.i18n?.getCurrentLanguage() || 'en';
        const languages = [
            { code: 'en', flag: 'EN', native: 'English' },
            { code: 'fr', flag: 'FR', native: 'Francais' },
            { code: 'es', flag: 'ES', native: 'Espanol' }
        ];

        content.innerHTML = `
                <div class="space-y-6">
                    <!-- LANGUAGE SELECTOR -->
                    <div class="p-4 bg-void-900/60 border border-void-800 rounded-[2px]">
                        <p class="text-xs text-signal-cyan font-mono uppercase mb-3">LANGUAGE / LANGUE / IDIOMA</p>
                        <div class="flex gap-2">
                            ${languages.map(lang => `
                                <button 
                                    class="lang-btn flex-1 py-3 px-2 rounded-[2px] border transition-all duration-200 text-center
                                        ${currentLang === lang.code
                ? 'bg-signal-cyan/20 border-signal-cyan text-white'
                : 'bg-void-800 border-void-700 text-zinc-400 hover:border-void-600'
            }"
                                    data-lang="${lang.code}"
                                >
                                    <span class="text-lg block mb-1">${lang.flag}</span>
                                    <span class="text-[10px] font-mono">${lang.native}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- SYSTEM INFO -->
                    <div class="p-4 bg-void-900/60 border border-void-800 rounded-[2px]">
                        <p class="text-xs text-purple-400 font-mono uppercase mb-3">SYSTEM INFO</p>
                        <div class="space-y-2 text-xs text-zinc-400 font-mono">
                            <div class="flex justify-between">
                                <span>Version</span>
                                <span class="text-white">2.0.0</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Language</span>
                                <span class="text-white uppercase">${currentLang}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Tier</span>
                                <span class="text-signal-amber">${currentTier.label}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- HAPTICS TOGGLE -->
                    <div class="p-4 bg-void-900/60 border border-void-800 rounded-[2px]">
                        <p class="text-xs text-purple-400 font-mono uppercase mb-3">HAPTIC FEEDBACK</p>
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-zinc-300">Vibration on buttons</span>
                            <button id="haptics-toggle" class="w-12 h-6 rounded-full transition-colors duration-200 ${appState.getModule('settings')?.hapticsEnabled !== false ? 'bg-signal-emerald' : 'bg-void-700'}">
                                <div class="w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${appState.getModule('settings')?.hapticsEnabled !== false ? 'translate-x-6' : 'translate-x-0.5'}"></div>
                            </button>
                        </div>
                    </div>
                    <div class="js-sos-settings-card">
                        ${window.renderEmergencySOSSettingsCard ? window.renderEmergencySOSSettingsCard() : ""}
                    </div>
                </div>
            `;

        // Attach language switch listeners
        content.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const lang = btn.getAttribute('data-lang');
                if (window.i18n && lang) {
                    await window.i18n.setLanguage(lang);
                    // Re-render the entire app to apply new language
                    renderApp();
                }
            });
        });

        // Attach haptics toggle listener
        const hapticsToggle = content.querySelector('#haptics-toggle');
        if (hapticsToggle) {
            hapticsToggle.addEventListener('click', () => {
                const settings = appState.getModule('settings') || {};
                settings.hapticsEnabled = settings.hapticsEnabled === false ? true : false;
                appState.setModule('settings', settings);
                // Re-render to update toggle state
                switchProtocolTab('settings');
            });
        }

        if (window.attachEmergencySOSSettingsHandlers) {
            window.attachEmergencySOSSettingsHandlers(content);
        }
    }
}

function renderMissionsTab(container) {
    // Check if we have itinerary data, otherwise fallback to basic missions
    const itinerary = PROTOCOLS_DATA.itinerary || [];

    if (itinerary.length > 0) {
        container.innerHTML = `
                <div class="space-y-8 relative">
                    <!-- TIMELINE LINE (Vertical) -->
                    <div class="absolute left-4 top-4 bottom-4 w-0.5 bg-gradient-to-b from-purple-500/50 via-purple-500/20 to-transparent"></div>

                    ${itinerary.map((day, dayIndex) => `
                        <div class="relative pl-12 timeline-day">
                            <!-- Day Marker -->
                            <div class="absolute left-0 top-0 w-8 h-8 bg-void-900 border-2 border-purple-500 rounded-full flex items-center justify-center z-10">
                                <span class="text-xs font-bold text-purple-400">${dayIndex + 1}</span>
                            </div>

                            <div class="mb-6">
                                <h3 class="font-heading font-bold text-xl text-white mb-1">${day.day}</h3>
                                <p class="text-purple-400 text-sm font-mono uppercase tracking-wider mb-2">${day.title}</p>
                                <div class="p-4 bg-void-900/50 border border-void-800 rounded-[2px]">
                                    <p class="text-zinc-400 text-sm italic">"${day.focus}"</p>
                                </div>
                            </div>

                            <!-- Waypoints -->
                            <div class="space-y-4">
                                ${day.waypoints.map(wp => `
                                    <div 
                                        onclick="trackMapLocation({ name: '${wp.name.replace(/'/g, "\\'")}', type: '${wp.type}', lat: 0, lng: 0 }); Haptics.trigger('light');"
                                        class="group relative bg-void-900/40 hover:bg-void-900/80 border border-white/5 hover:border-purple-500/50 rounded-[2px] p-4 transition-all cursor-pointer active:scale-[0.98]"
                                    >
                                        <div class="flex justify-between items-start mb-2">
                                            <div class="flex flex-col">
                                                <span class="text-xs font-mono text-purple-400 mb-0.5">${wp.time}</span>
                                                <h4 class="font-bold text-white group-hover:text-purple-300 transition-colors">${wp.name}</h4>
                                            </div>
                                            <span class="px-2 py-1 bg-black/30 rounded text-[10px] font-mono text-zinc-400 border border-white/5">${wp.type}</span>
                                        </div>
                                        
                                        <!-- Action Hint -->
                                        <div class="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span class="text-xs text-purple-400 font-mono flex items-center gap-1">
                                                <span>TRACK INTEL</span>
                                                <i class="fas fa-map-marker-alt"></i>
                                            </span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
    } else {
        // Fallback for missions (if itinerary missing)
        container.innerHTML = `<div class="p-8 text-center text-zinc-500">No itinerary data found.</div>`;
    }
}

// ---------------------------------------------------------------
// SETTINGS MODULE
// ---------------------------------------------------------------

function renderLanguageSwitcher() {
    const current = window.i18n ? window.i18n.getCurrentLanguage() : 'en';

    const languages = [
        { code: 'en', flag: '🇺🇸', name: 'English', native: 'English' },
        { code: 'fr', flag: '🇫🇷', name: 'French', native: 'Français' },
        { code: 'es', flag: '🇪🇸', name: 'Spanish', native: 'Español' }
    ];

    return `
            <div class="ballistic-glass p-4 mb-4">
                <h3 class="text-sm font-mono text-zinc-400 mb-3 uppercase tracking-wider">
                    ${t('settings.sections.language')}
                </h3>
                <div class="flex gap-2">
                    ${languages.map(lang => `
                        <button 
                            onclick="switchLanguage('${lang.code}')"
                            class="flex-1 px-4 py-3 rounded-sm transition-all ${current === lang.code
            ? 'bg-signal-emerald text-void-950 font-semibold'
            : 'bg-void-800 text-zinc-400 hover:bg-void-700'
        }">
                            <div class="text-2xl mb-1">${lang.flag}</div>
                            <div class="text-xs font-mono">${lang.native}</div>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
}

async function switchLanguage(langCode) {
    const extracted = window.ALIDADE_I18N_UTILS?.switchLanguage;
    if (typeof extracted === 'function') {
        return extracted(langCode, {
            i18n: window.i18n,
            setHtmlLang: (lang) => {
                document.documentElement.lang = lang;
            },
            log: (...args) => protocolsRuntimeDebugLog(...args),
            error: (...args) => console.error(...args)
        });
    }

    if (!window.i18n) {
        console.error('[APP] i18n not ready yet');
        return;
    }

    try {
        await window.i18n.setLanguage(langCode);
        protocolsRuntimeDebugLog('[APP] Language switched to:', langCode);

        // Update HTML lang attribute
        document.documentElement.lang = langCode;

        // Fire custom event (i18n controller already fires 'languagechange')
        // No need to call renderApp() here, event listener will handle it
    } catch (err) {
        console.error('[APP] Failed to switch language:', err);
    }
}
// Expose switchLanguage globally
window.switchLanguage = switchLanguage;
function renderSettings() {
    const extracted = window.ALIDADE_SETTINGS_UTILS?.renderSettings;
    if (typeof extracted === 'function') {
        extracted({
            getSettings: () => appState.getModule('settings'),
            document,
            t: (key) => t(key),
            renderLanguageSwitcher: () => renderLanguageSwitcher(),
            arrowLeftIcon: ICONS.arrowLeft,
            renderEmergencySOSSettingsCard: () => window.renderEmergencySOSSettingsCard ? window.renderEmergencySOSSettingsCard() : '',
            attachEmergencySOSSettingsHandlers: (appNode) => {
                if (window.attachEmergencySOSSettingsHandlers) {
                    window.attachEmergencySOSSettingsHandlers(appNode);
                }
            },
            setCurrentView: (viewName) => {
                currentView = viewName;
            }
        });
        return;
    }

    const settings = appState.getModule('settings');
    const app = document.getElementById('app');

    const html = `
            <div class="min-h-screen bg-void-950 p-6 pb-24">
                <header class="mb-8">
                    <div class="flex items-center gap-3 mb-2">
                        <button onclick="window.alidadeApp.navigateTo('HOME')" class="p-2 rounded-[2px] bg-void-800 text-zinc-400 hover:text-white transition-colors">
                            ${ICONS.arrowLeft}
                        </button>
                        <h1 class="font-mono text-2xl font-bold text-signal-emerald uppercase tracking-wider">
                            ${t('settings.title')}
                        </h1>
                    </div>
                </header>

                <div class="settings-container max-w-2xl mx-auto space-y-6">
                    <!-- LANGUAGE SECTION -->
                    ${renderLanguageSwitcher()}

                    <!-- HAPTICS SECTION -->
                    <div class="ballistic-glass p-4">
                        <h3 class="text-sm font-mono text-zinc-400 mb-4 uppercase tracking-wider">
                            ${t('settings.sections.haptics')}
                        </h3>
                        
                        <div class="setting-item flex items-center justify-between p-4 bg-void-800/50 rounded-sm">
                            <div class="setting-info">
                                <div class="setting-label font-bold text-white flex items-center gap-2">
                                    <span class="text-lg">*</span>
                                    ${t('settings.haptics.enable')}
                                </div>
                                <div class="setting-description text-xs text-zinc-500 mt-1">
                                    Adaptive vibration feedback
                                </div>
                            </div>
                            <label class="toggle-switch relative inline-block w-12 h-6">
                                <input 
                                    type="checkbox" 
                                    id="haptics-toggle"
                                    class="peer sr-only"
                                    ${settings.hapticsEnabled ? 'checked' : ''}
                                    onchange="toggleHaptics(this.checked)"
                                >
                                <span class="toggle-slider absolute cursor-pointer inset-0 bg-void-950 border border-void-600 rounded-full transition-all duration-300 peer-checked:bg-signal-emerald/20 peer-checked:border-signal-emerald peer-hover:border-void-500"></span>
                                <span class="absolute content-[''] h-4 w-4 left-1 bottom-1 bg-zinc-500 rounded-full transition-all duration-300 peer-checked:translate-x-6 peer-checked:bg-signal-emerald shadow-sm"></span>
                            </label>
                        </div>
                    </div>

                    <!-- THEME SECTION -->
                    <div class="ballistic-glass p-4">
                        <h3 class="text-sm font-mono text-zinc-400 mb-4 uppercase tracking-wider">
                            ${t('settings.sections.theme')}
                        </h3>
                        <div class="flex gap-2">
                            <button class="flex-1 py-3 rounded-sm bg-signal-emerald text-void-950 font-bold text-xs uppercase font-mono">
                                ${t('settings.theme.dark')}
                            </button>
                            <button class="flex-1 py-3 rounded-sm bg-void-800 text-zinc-500 font-bold text-xs uppercase font-mono opacity-50 cursor-not-allowed">
                                ${t('settings.theme.light')}
                            </button>
                        </div>
                    </div>

                    <div class="js-sos-settings-card">
                        ${window.renderEmergencySOSSettingsCard ? window.renderEmergencySOSSettingsCard() : ""}
                    </div>

                    <!-- ABOUT SECTION -->
                    <div class="text-center pt-8">
                        <p class="text-[10px] text-void-700 font-mono tracking-widest">ALIDADE OS v2.1 // BUILD 2026.02.05</p>
                    </div>
                </div>
            </div>
        `;

    app.innerHTML = html;
    if (window.attachEmergencySOSSettingsHandlers) {
        window.attachEmergencySOSSettingsHandlers(app);
    }
    currentView = 'SETTINGS'; // Ensure state sync if direct called
}

// Expose toggle function globally
window.toggleHaptics = function (enabled) {
    const extracted = window.ALIDADE_SETTINGS_UTILS?.toggleHaptics;
    if (typeof extracted === 'function') {
        extracted(enabled, {
            setSettingsModule: (patch) => appState.setModule('settings', patch),
            triggerHaptics: (level) => Haptics.trigger(level),
            log: (...args) => protocolsRuntimeDebugLog(...args)
        });
        return;
    }

    appState.setModule('settings', { hapticsEnabled: enabled });

    if (enabled) {
        Haptics.trigger('double');
    }

    protocolsRuntimeDebugLog('[SETTINGS] Haptics:', enabled ? 'enabled' : 'disabled');
};


function switchProtocolTab(tabName) {
    const extracted = window.ALIDADE_PROTOCOLS_UTILS?.switchProtocolTab;
    if (typeof extracted === 'function') {
        extracted(tabName, {
            document,
            protocolState,
            setCurrentTab: (nextTab) => { protocolState.currentTab = nextTab; },
            persistActiveTab: (nextTab) => localStorage.setItem('activeProtocolTab', nextTab),
            getCurrentTab: () => protocolState.currentTab,
            renderMissionsTab: () => renderMissionsTab(),
            attachMissionListeners: () => attachMissionListeners(),
            renderBriefingLoadingState: () => renderBriefingLoadingState(),
            ensureProtocolsBriefingData: () => ensureProtocolsBriefingData(),
            renderBriefingTab: () => renderBriefingTab(),
            attachBriefingListeners: () => attachBriefingListeners(),
            renderWalletTab: () => renderWalletTab(),
            attachWalletListeners: () => attachWalletListeners(),
            renderRoutePlanner: (containerId) => renderRoutePlanner(containerId)
        });
        return;
    }

    protocolState.currentTab = tabName;
    // Persist active tab selection
    localStorage.setItem('activeProtocolTab', tabName);

    // Update tab button styles
    document.querySelectorAll('.protocol-tab').forEach(btn => {
        if (btn.getAttribute('data-protocol-tab') === tabName) {
            btn.classList.add('bg-purple-500', 'text-white');
            btn.classList.remove('bg-void-800', 'text-zinc-400');
        } else {
            btn.classList.remove('bg-purple-500', 'text-white');
            btn.classList.add('bg-void-800', 'text-zinc-400');
        }
    });

    const container = document.getElementById('protocol-content');

    // Reset container classes
    container.className = 'px-4 pt-4 pb-20';

    switch (tabName) {
        case 'missions':
            container.innerHTML = renderMissionsTab();
            attachMissionListeners();
            break;
        case 'briefing':
            container.innerHTML = renderBriefingLoadingState();
            ensureProtocolsBriefingData().finally(() => {
                if (protocolState.currentTab !== 'briefing') return;
                container.innerHTML = renderBriefingTab();
                attachBriefingListeners();
            });
            break;
        case 'wallet':
            container.innerHTML = renderWalletTab();
            attachWalletListeners();
            break;
        case 'ROUTE':
            // Special styling for embedded map (fixed height)
            container.classList.remove('pb-20');
            container.classList.add('h-[calc(100vh-160px)]', 'overflow-hidden', 'pb-0');

            // Embed Route Planner inside the tab container
            renderRoutePlanner('protocol-content');
            break;
    }
}

// ---------------------------------------------------------------
// MISSIONS TAB (Gamified)
// ---------------------------------------------------------------

// ---------------------------------------------------------------
// MISSIONS TAB (Gamified & Fixed)
// ---------------------------------------------------------------

function renderMissionsTab() {
    const currentRank = getProtocolRank();
    const missions = Array.isArray(PROTOCOLS_DATA.missions) ? PROTOCOLS_DATA.missions : [];
    const missionIds = new Set(missions.map((mission) => mission.id));
    const completedCount = protocolState.completedMissions.filter((missionId) => missionIds.has(missionId)).length;
    const totalMissions = missions.length;
    const xpProgress = totalMissions > 0 ? (completedCount / totalMissions) * 100 : 0;

    // -----------------------------------------------------------
    // LOGIC PRESERVED ( DO NOT TOUCH )
    // -----------------------------------------------------------
    const rankIndex = PROTOCOLS_DATA.ranks.indexOf(currentRank);
    const nextRank = PROTOCOLS_DATA.ranks[Math.min(rankIndex + 1, PROTOCOLS_DATA.ranks.length - 1)];
    // -----------------------------------------------------------

    return `
        <!-- ELITE RANK DISPLAY: HOLOGRAPHIC PROJECTION -->
        <div class="relative overflow-hidden rounded-lg mb-8 group perspective-1000">
            <!-- HOLOGRAPHIC CONTAINER -->
            <div class="relative bg-void-950 border border-purple-500/30 rounded-lg overflow-hidden shadow-[0_0_40px_rgba(168,85,247,0.15)] transition-all duration-500 hover:shadow-[0_0_60px_rgba(168,85,247,0.3)] hover:border-purple-500/60">
                
                <!-- ANIMATED SCANLINES BACKGROUND -->
                <div class="absolute inset-0 opacity-30 pointer-events-none" 
                     style="background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(168, 85, 247, 0.05) 2px, rgba(168, 85, 247, 0.05) 4px); animation: scrollScanlines 20s linear infinite;">
                </div>
                
                <!-- HEX MESH OVERLAY -->
                <div class="absolute inset-0 opacity-10 pointer-events-none" 
                     style="background-image: radial-gradient(circle at 50% 50%, rgba(168,85,247,0.2) 1px, transparent 1px); background-size: 20px 20px;">
                </div>

                <!-- GLOW ORB -->
                <div class="absolute top-[-50%] right-[-20%] w-[300px] h-[300px] bg-purple-600/20 rounded-full blur-[80px] animate-pulse-slow pointer-events-none"></div>

                <div class="relative p-7 z-10 flex flex-col h-full justify-between">
                    <!-- HEADER -->
                    <div class="flex items-start justify-between mb-8">
                        <div>
                            <div class="flex items-center gap-3 mb-2">
                                <div class="flex gap-1">
                                    <span class="w-1 h-1 bg-purple-500 rounded-full animate-ping"></span>
                                    <span class="w-1 h-1 bg-purple-500 rounded-full"></span>
                                    <span class="w-1 h-1 bg-purple-500 rounded-full"></span>
                                </div>
                                <p class="text-[9px] text-purple-300 font-mono tracking-[0.3em] uppercase opacity-80">Operative Clearance Level</p>
                            </div>
                            <!-- GLITCH TEXT TITLE -->
                            <h2 class="font-heading text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-purple-400 tracking-wider filter drop-shadow-[0_2px_10px_rgba(168,85,247,0.3)]">
                                ${currentRank}
                            </h2>
                        </div>
                        <!-- 3D RANK ICON -->
                        <div class="relative group-hover:scale-110 transition-transform duration-500 ease-out">
                            <div class="absolute inset-0 bg-purple-500/30 blur-xl rounded-full"></div>
                            <div class="text-5xl relative z-10 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">#</div>
                        </div>
                    </div>

                    <!-- REACTOR PROGRESS BAR -->
                    <div>
                        <div class="flex justify-between items-end mb-3">
                            <div class="flex flex-col">
                                <span class="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-0.5">Mission Synchronization</span>
                                <span class="text-xl font-bold text-white font-mono tracking-tight text-shadow-glow">${Math.round(xpProgress)}<span class="text-purple-500 text-sm">%</span></span>
                            </div>
                            <div class="text-right">
                                <span class="text-[10px] text-purple-400 font-bold font-mono bg-purple-500/10 px-2 py-1 rounded border border-purple-500/30">
                                    ${completedCount} / ${totalMissions} PROTOCOLS
                                </span>
                            </div>
                        </div>
                        
                        <div class="h-3 bg-black/60 rounded-sm overflow-hidden border border-white/10 relative p-[2px]">
                            <!-- Progress Fill -->
                            <div class="h-full bg-gradient-to-r from-purple-700 via-purple-500 to-fuchsia-400 shadow-[0_0_20px_rgba(168,85,247,0.8)] relative transition-all duration-1000 ease-out flex items-center" 
                                 style="width: ${xpProgress}%">
                                 <!-- Reactor Core Effect -->
                                 <div class="absolute inset-0 opacity-50" style="background-image: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent); animation: reactorFlow 2s infinite ease-in-out;"></div>
                            </div>
                            <!-- Tick Marks Overlay -->
                            <div class="absolute inset-0 flex justify-between px-[1px]">
                                ${Array(10).fill(0).map(() => `<div class="w-[1px] h-full bg-black/50"></div>`).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- MISSION INTEL PACKETS -->
        <div class="space-y-5 pb-10">
            ${missions.map((mission, index) => renderMissionCard(mission, index)).join('')}
        </div>
    `;
}

// Mission card renderer

function renderMissionCard(mission, index) {
    const isCompleted = protocolState.completedMissions.includes(mission.id);

    // ELITE STYLES
    const borderColor = isCompleted ? 'border-emerald-500' : 'border-void-700';
    const glowColor = isCompleted ? 'shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'shadow-none';
    const cardBg = isCompleted ? 'bg-void-950' : 'bg-black';
    const accentText = isCompleted ? 'text-emerald-400' : 'text-zinc-400';

    return `
        <div class="mission-card group relative overflow-visible transition-all duration-500 hover:z-20 transform hover:-translate-y-1" style="animation-delay: ${index * 50}ms">
            <!-- DECORATIVE CONNECTORS -->
            <div class="absolute -left-[1px] top-1/2 -translate-y-1/2 w-1 h-8 bg-void-800 group-hover:bg-white transition-colors duration-300"></div>
            
            <!-- CARD CONTAINER -->
            <div class="relative rounded-sm border ${borderColor} ${cardBg} ${glowColor} transition-all duration-300 group-hover:border-opacity-100 group-hover:shadow-[0_5px_30px_rgba(0,0,0,0.5)]">
                
                <!-- HEADER (ALWAYS VISIBLE) -->
                <button class="w-full relative z-10 flex flex-col items-stretch text-left outline-none group-focus:ring-2 ring-purple-500/50"
                        data-mission-id="${mission.id}"
                        onclick="toggleMissionContent('${mission.id}')">
                    
                    <div class="p-5 flex items-center justify-between gap-5 relative overflow-hidden">
                         <!-- COMPLETED OVERLAY FLASH -->
                        ${isCompleted ? '<div class="absolute inset-0 bg-emerald-500/5 pointer-events-none"></div>' : ''}
                        
                        <!-- LEFT: ICON & IDENTITY -->
                        <div class="flex items-center gap-5 z-10">
                             <!-- TACTICAL ICON BOX -->
                            <div class="w-14 h-14 flex flex-col items-center justify-center bg-void-900 border border-white/5 rounded-sm relative overflow-hidden group-hover:border-white/20 transition-all duration-300">
                                <div class="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-600"></div>
                                <div class="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-zinc-600"></div>
                                <span class="text-3xl filter drop-shadow-md transform group-hover:scale-110 transition-transform duration-300 relative z-10">${mission.image}</span>
                                ${isCompleted ? '<div class="absolute inset-0 bg-emerald-500/10 animate-pulse-slow"></div>' : ''}
                            </div>
                            
                            <div>
                                <div class="flex items-center gap-2 mb-1">
                                    <h3 class="font-heading font-black text-white text-base tracking-wider group-hover:text-purple-300 transition-colors uppercase">
                                        ${mission.title}
                                    </h3>
                                    ${isCompleted ? `
                                        <span class="flex items-center gap-1 text-[0.6rem] px-2 py-0.5 bg-emerald-950 border border-emerald-500/30 text-emerald-400 rounded-sm font-mono tracking-widest uppercase shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                            <span class="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span> DONE
                                        </span>
                                    ` : ''}
                                </div>
                                <p class="text-[10px] ${accentText} font-mono uppercase tracking-[0.15em] opacity-70 group-hover:opacity-100 transition-opacity">
                                    <span class="text-void-500 mr-2">/// ID: ${mission.id.toUpperCase().slice(0, 6)}</span> ${mission.meta}
                                </p>
                            </div>
                        </div>

                        <!-- RIGHT: INTERACTION -->
                        <div class="flex items-center gap-4 z-10">
                            <span class="text-[9px] text-zinc-600 font-mono tracking-widest hidden sm:block group-hover:text-purple-400 transition-colors">
                                ${isCompleted ? 'ARCHIVED' : 'ACCESS INTEL'}
                            </span>
                            <div class="w-8 h-8 rounded-full border border-void-700 flex items-center justify-center group-hover:bg-purple-500 group-hover:border-purple-500 group-hover:text-white transition-all duration-300 shadow-lg text-zinc-500" id="chevron-${mission.id}">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="stroke-current stroke-[3]"><path d="M6 9l6 6 6-6"/></svg>
                            </div>
                        </div>
                    </div>
                </button>

                <!-- EXPANDED CONTENT (THE PAYLOAD) -->
                <div class="hidden" id="mission-${mission.id}">
                    <div class="border-t border-dashed border-void-700 mx-5"></div>
                    
                    <div class="p-6 bg-void-950/50 backdrop-blur-sm space-y-6 relative">
                        <!-- DECORATIVE GRID BG -->
                        <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: radial-gradient(circle, #fff 1px, transparent 1px); background-size: 10px 10px;"></div>

                        <!-- 1. CONTEXT TERMINAL -->
                        <div class="relative group/ctx">
                            <div class="absolute -left-3 top-0 bottom-0 w-[2px] bg-purple-500/20 group-hover/ctx:bg-purple-500 transition-colors"></div>
                            <p class="text-[9px] text-purple-500 font-mono uppercase mb-2 tracking-[0.25em] flex items-center gap-2">
                                <span class="w-2 h-[1px] bg-purple-500"></span> TARGET_BRIEFING
                            </p>
                            <p class="text-sm text-zinc-300 leading-7 font-sans font-light tracking-wide">
                                ${mission.context}
                            </p>
                        </div>

                        <!-- 2. STEPS MATRIX -->
                        <div class="space-y-3">
                             <div class="flex items-center gap-2 mb-2">
                                <span class="text-purple-500">></span>
                                <p class="text-[9px] text-zinc-400 font-mono uppercase tracking-[0.25em]">EXECUTION_STEPS</p>
                             </div>
                             
                            <div class="grid gap-2">
                                ${mission.steps.map((step, i) => `
                                    <div class="flex items-start gap-4 p-3 rounded-sm hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group/step">
                                        <div class="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-void-900 border border-void-700 rounded-sm text-[10px] font-mono text-purple-400 group-hover/step:text-white group-hover/step:border-purple-500 transition-all font-bold">
                                            0${i + 1}
                                        </div>
                                        <p class="text-[13px] text-zinc-400 font-mono leading-relaxed group-hover/step:text-zinc-200 transition-colors pt-0.5">${step}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- 3. INTEL ALERT -->
                        <div class="p-4 bg-amber-950/20 border border-amber-500/30 rounded-r-lg border-l-4 border-l-amber-500 relative overflow-hidden">
                             <div class="absolute top-0 right-0 p-2 opacity-10 text-4xl text-amber-500">!</div>
                             <p class="text-[9px] text-amber-500 font-mono uppercase mb-1 tracking-[0.2em] font-bold">/// CLASSIFIED_INTEL_TIP</p>
                             <p class="text-xs text-amber-200/90 font-medium leading-relaxed font-sans">${mission.tip}</p>
                        </div>

                        <!-- 4. ACTION CONTROLS -->
                        <div class="pt-2">
                            ${!isCompleted ? `
                                <button class="complete-mission-btn w-full relative overflow-hidden group/btn py-4 bg-emerald-600 rounded-sm shadow-[0_5px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_10px_30px_rgba(16,185,129,0.5)] transition-all active:scale-[0.99] active:translate-y-1" data-mission-id="${mission.id}">
                                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                                    <div class="flex items-center justify-center gap-3 relative z-10">
                                        <span class="text-white font-heading font-black text-sm uppercase tracking-[0.25em]">Mission Complete</span>
                                        <span class="bg-black/30 text-emerald-100 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-white/10">+20 XP</span>
                                    </div>
                                </button>
                            ` : `
                                <button class="undo-mission-btn w-full py-4 border border-zinc-800 text-zinc-600 hover:text-red-400 hover:border-red-900/50 hover:bg-red-950/10 font-mono text-[10px] uppercase tracking-[0.25em] rounded-sm transition-all flex items-center justify-center gap-2 group/undo" data-mission-id="${mission.id}">
                                    <span class="group-hover/undo:opacity-100 opacity-50 transition-opacity">REVERT STATUS</span>
                                    <svg class="w-3 h-3 group-hover/undo:animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
}

// Toggle Helper
window.toggleMissionContent = function (id) {
    const content = document.getElementById(`mission-${id}`);
    const chevron = document.getElementById(`chevron-${id}`);

    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        if (chevron) chevron.style.transform = 'rotate(180deg)';
    } else {
        content.classList.add('hidden');
        if (chevron) chevron.style.transform = 'rotate(0deg)';
    }
};

function attachMissionListeners() {
    // Complete buttons
    document.querySelectorAll('.complete-mission-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const missionId = btn.getAttribute('data-mission-id');
            completeMission(missionId);
        });
    });


    // Undo buttons
    document.querySelectorAll('.undo-mission-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const missionId = btn.getAttribute('data-mission-id');
            undoMission(missionId);
        });
    });
}

function completeMission(missionId) {
    if (!protocolState.completedMissions.includes(missionId)) {
        const oldRank = getProtocolRank();

        protocolState.completedMissions.push(missionId);
        protocolState.xp += 20;

        // Force update the XP bar directly before re-render
        const xpBar = document.querySelector('.xp-progress-bar');
        if (xpBar) {
            // Recalculate based on NEW count
            const total = PROTOCOLS_DATA.missions.length;
            const current = protocolState.completedMissions.length;
            const pct = total > 0 ? (current / total) * 100 : 0;
            xpBar.style.width = `${pct}%`;
        }

        // Save to localStorage
        saveProtocolState();

        // Re-render missions
        const container = document.getElementById('protocol-content');
        container.innerHTML = renderMissionsTab();
        attachMissionListeners();

        // Show celebration
        showCelebration(missionId, oldRank);
    }
}

function undoMission(missionId) {
    const index = protocolState.completedMissions.indexOf(missionId);
    if (index > -1) {
        protocolState.completedMissions.splice(index, 1);
        protocolState.xp = Math.max(0, protocolState.xp - 20);

        // Save to localStorage
        saveProtocolState();

        // Re-render missions
        const container = document.getElementById('protocol-content');
        container.innerHTML = renderMissionsTab();
        attachMissionListeners();
    }
}

function showCelebration(missionId, oldRank) {
    const newRank = getProtocolRank();
    const rankedUp = newRank !== oldRank;

    const modal = document.createElement('div');
    modal.id = 'celebration-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-fade-in';
    modal.innerHTML = `
        <div class="text-center p-8 animate-bounce-in">
            <div class="text-6xl mb-4">${rankedUp ? '🎖️' : '✅'}</div>
            <h2 class="font-heading text-2xl font-bold text-emerald-400 mb-2">
                ${rankedUp ? 'RANK UP!' : 'MISSION COMPLETE!'}
            </h2>
            ${rankedUp ? `
                <p class="text-xl text-purple-400 font-bold mb-4">${oldRank} → ${newRank}</p>
            ` : ''}
            <p class="text-zinc-400 mb-6">+20 XP Earned</p>
            <button id="close-celebration" class="px-6 py-3 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-[2px] transition-all active:scale-95">
                CONTINUE
            </button>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('close-celebration').addEventListener('click', () => {
        modal.remove();
    });

    // Auto-close after 3s
    setTimeout(() => {
        if (document.getElementById('celebration-modal')) {
            modal.remove();
        }
    }, 3000);
}
// ---------------------------------------------------------------
// BRIEFING TAB (5-Day Tactical Itinerary)
// ---------------------------------------------------------------

// Track expanded days state
let expandedDays = { 'DAY 1': true }; // Day 1 expanded by default

function toggleDay(dayId) {
    expandedDays[dayId] = !expandedDays[dayId];
    // Re-render the briefing content
    const container = document.getElementById('protocol-content');
    container.innerHTML = renderBriefingTab();
    attachBriefingListeners();
}

function attachBriefingListeners() {
    document.querySelectorAll('.day-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const dayId = btn.dataset.day;
            toggleDay(dayId);
        });
    });

    // Waypoint toggle (expand/collapse)
    document.querySelectorAll('.waypoint-toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const waypointKey = btn.dataset.waypoint;
            toggleWaypoint(waypointKey);
        });
    });

    // Waypoint status (complete/uncomplete)
    document.querySelectorAll('.waypoint-status-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const waypointKey = btn.dataset.waypoint;
            toggleWaypointStatus(waypointKey);
        });
    });
}

function toggleWaypoint(waypointKey) {
    // Toggle expanded state (only one at a time)
    if (protocolState.expandedWaypoint === waypointKey) {
        protocolState.expandedWaypoint = null;
    } else {
        protocolState.expandedWaypoint = waypointKey;
    }
    // Re-render
    const container = document.getElementById('protocol-content');
    container.innerHTML = renderBriefingTab();
    attachBriefingListeners();
}

function toggleWaypointStatus(waypointKey) {
    const index = protocolState.completedWaypoints.indexOf(waypointKey);
    if (index > -1) {
        // Remove from completed
        protocolState.completedWaypoints.splice(index, 1);
    } else {
        // Add to completed
        protocolState.completedWaypoints.push(waypointKey);
    }
    // Save to localStorage
    saveProtocolState();
    // Re-render
    const container = document.getElementById('protocol-content');
    container.innerHTML = renderBriefingTab();
    attachBriefingListeners();
}

// Determine time-of-day color based on hour
function getTimeOfDayColor(timeStr) {
    const hour = parseInt(timeStr.split(':')[0], 10);
    if (hour >= 6 && hour < 12) return 'blue';        // Morning
    if (hour >= 12 && hour < 17) return 'emerald';    // Afternoon  
    if (hour >= 17 && hour < 20) return 'amber';      // Sunset
    return 'purple';                                   // Night
}

function renderBriefingTab() {
    const briefingData = getProtocolsBriefingData();
    const hasUltimateBriefing = normalizeTierTag(USER_TIER || window.USER_TIER || 'BASIC') === 'ULTIMATE' && hasUltimateProtocolsPack();

    if (!hasUltimateBriefing) {
        trackLockImpression('PROTOCOLS', 'protocols_briefing_preview');
    }

    return `
            <div class="mb-6">
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-xs px-2 py-1 rounded-sm border border-blue-400/40 text-blue-300 font-mono tracking-widest">BRF</span>
                    <h2 class="font-heading text-xl font-bold text-blue-400">TACTICAL BRIEFING</h2>
                </div>
                <p class="text-xs text-void-500 font-mono">5-Day Mission Itinerary - Tap Day to Expand</p>
                ${hasUltimateBriefing ? '' : `
                <div class="mt-3 p-3 rounded-[2px] border border-signal-amber/30 bg-signal-amber/5">
                    <p class="text-[10px] font-mono uppercase tracking-widest text-signal-amber">Classified Preview</p>
                    <p class="text-xs text-zinc-300 mt-1">This is a preview briefing. Upgrade to unlock full 5-day classified itinerary and live tactical handoff.</p>
                    <button
                        onclick="window.trackTierFunnelEvent && window.trackTierFunnelEvent('click_upgrade', { source: 'protocols_briefing_preview', feature: 'PROTOCOLS' }); window.showUpgradeModal && window.showUpgradeModal('ultimate', 'PROTOCOLS')"
                        class="mt-3 px-3 py-2 bg-signal-amber text-black text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm hover:bg-amber-400 transition-colors"
                    >
                        UNLOCK FULL BRIEFING
                    </button>
                </div>
                `}
                
                <!-- Time Legend -->
                <div class="flex flex-wrap gap-2 mt-3">
                    <span class="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-mono rounded">MORNING</span>
                    <span class="px-2 py-0.5 bg-signal-emerald/20 text-emerald-400 text-[10px] font-mono rounded">AFTERNOON</span>
                    <span class="px-2 py-0.5 bg-signal-amber/20 text-signal-amber text-[10px] font-mono rounded">SUNSET</span>
                    <span class="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] font-mono rounded">NIGHT</span>
                </div>
            </div>

            <div class="space-y-4">
                ${briefingData.map(day => renderBriefingDay(day)).join('')}
            </div>
        `;
}

window.loadDayIntoPlanner = function (dayId) {
    const protocolsUtils = window.ALIDADE_PROTOCOLS_UTILS;
    if (protocolsUtils && typeof protocolsUtils.protocolsLoadDayIntoPlannerFlow === 'function') {
        return protocolsUtils.protocolsLoadDayIntoPlannerFlow({
            dayId,
            getProtocolsBriefingDataFn: getProtocolsBriefingData,
            allDestinations: ALL_DESTINATIONS,
            localStorageObj: localStorage,
            setCurrentTabFn: (nextTab) => { protocolState.currentTab = nextTab; },
            saveProtocolStateFn: saveProtocolState,
            renderProtocolsFn: renderProtocols,
            documentObj: document,
            setTimeoutFn: setTimeout,
            consoleObj: console
        });
    }
    return false;
}

function renderBriefingDay(day) {
    const protocolsUtils = window.ALIDADE_PROTOCOLS_UTILS;
    if (protocolsUtils && typeof protocolsUtils.protocolsRenderBriefingDayCard === 'function') {
        return protocolsUtils.protocolsRenderBriefingDayCard(day, {
            expandedDays,
            completedWaypoints: protocolState.completedWaypoints,
            renderWaypointCardFn: renderWaypointCard
        });
    }
    return '';
}

function renderWaypointCard(wp, idx, total, dayColor) {
    const protocolsUtils = window.ALIDADE_PROTOCOLS_UTILS;
    if (protocolsUtils && typeof protocolsUtils.protocolsRenderWaypointCard === 'function') {
        return protocolsUtils.protocolsRenderWaypointCard(wp, idx, total, dayColor, {
            getTimeOfDayColorFn: getTimeOfDayColor,
            completedWaypoints: protocolState.completedWaypoints,
            expandedWaypoint: protocolState.expandedWaypoint
        });
    }
    return '';
}

// ---------------------------------------------------------------
// WALLET TAB (Smart Wallet with Knowledge Base Intelligence)
// ---------------------------------------------------------------

function renderWalletTab() {
    const protocolsUtils = window.ALIDADE_PROTOCOLS_UTILS;
    if (protocolsUtils && typeof protocolsUtils.protocolsRenderWalletTabFlow === 'function') {
        return protocolsUtils.protocolsRenderWalletTabFlow({
            walletState,
            userTier: USER_TIER || window.USER_TIER || 'BASIC',
            protocolsWalletExecuteFeature: PROTOCOLS_WALLET_EXECUTE_FEATURE,
            renderWalletSetupFn: renderWalletSetup,
            analyzeBudgetStatusFn: analyzeBudgetStatus,
            suggestTipsFn: suggestTips,
            normalizeTierTagFn: normalizeTierTag,
            getFeatureUsageStatusFn: getFeatureUsageStatus,
            trackLockImpressionFn: trackLockImpression,
            getCategoryEmojiFn: getCategoryEmoji,
            formatTimeFn: formatTime,
            translateFn: t
        });
    }
    return '';
}

function renderWalletSetup() {
    const protocolsUtils = window.ALIDADE_PROTOCOLS_UTILS;
    if (protocolsUtils && typeof protocolsUtils.protocolsRenderWalletSetup === 'function') {
        return protocolsUtils.protocolsRenderWalletSetup({
            getKBFn: getKB,
            translateFn: t
        });
    }
    return '';
}

function getCategoryEmoji(category) {
    const emojis = {
        food: '🍽️',
        transport: '🚕',
        shopping: '🛍️',
        activities: '🎯',
        services: '🧾',
        other: '📦'
    };
    return emojis[category] || '📦';
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function attachWalletListeners() {
    const protocolsUtils = window.ALIDADE_PROTOCOLS_UTILS;
    if (protocolsUtils && typeof protocolsUtils.protocolsAttachWalletListenersFlow === 'function') {
        return protocolsUtils.protocolsAttachWalletListenersFlow({
            documentObj: document,
            getKBFn: getKB,
            updateBudgetPreviewFn: updateBudgetPreview,
            getWalletStateFn: () => walletState,
            setWalletStateFn: (nextState) => { walletState = nextState; },
            saveWalletStateFn: saveWalletState,
            renderWalletTabFn: renderWalletTab,
            attachWalletListenersFn: attachWalletListeners,
            promptProtocolsWalletUpgradeFn: promptProtocolsWalletUpgrade,
            generateIdFn: generateId,
            detectScamFn: detectScam,
            compareFairPriceFn: compareFairPrice,
            alertFn: window.alert,
            setTimeoutFn: setTimeout,
            loadWalletStateFn: loadWalletState,
            confirmFn: confirm
        });
    }
    return false;
}

function updateBudgetPreview() {
    const total = parseInt(document.getElementById('setup-total')?.value) || 0;
    const days = parseInt(document.getElementById('setup-days')?.value) || 5;
    const profileBtn = document.querySelector('.profile-btn.bg-signal-emerald\\/20');
    const profile = profileBtn?.dataset.profile || 'budget';

    const preview = document.getElementById('budget-preview');
    const previewText = document.getElementById('budget-preview-text');

    if (total > 0 && preview && previewText) {
        const result = initializeBudget(total, days, profile);
        if (result.success) {
            preview.classList.remove('hidden');
            previewText.textContent = result.message;
        }
    }
}
