// ═══════════════════════════════════════════════════════════════
// MODULE: TACTICAL BRIEFING SYSTEM
// Pre-Mission Intel, Vendor Profiling & Negotiation Engine
// ═══════════════════════════════════════════════════════════════

/**
 * EXPANDED NEGOTIATION TACTICS DATABASE
 * 10+ situational tactics with Darija phrases, success rates & risk levels
 */
const NEGOTIATION_TACTICS = {
    gentle_lower: {
        id: 'gentle_lower', name: "Gentle Lower", icon: "🤝",
        darija: "Nqas shwiya a khouya", phonetic: "N-qas shwee-ya a khoo-ya",
        english: "Lower it a bit, brother",
        situation: "Vendor is friendly but price is still high",
        successRate: 0.70, riskLevel: "low"
    },
    not_tourist: {
        id: 'not_tourist', name: "Local Card", icon: "🏠",
        darija: "Machi tourist, ana saken hna", phonetic: "Ma-shee too-reest, a-na sa-ken h-na",
        english: "I'm not a tourist, I live here",
        situation: "Vendor assumes you're a wealthy tourist",
        successRate: 0.65, riskLevel: "low"
    },
    comparison_shop: {
        id: 'comparison_shop', name: "Competitor Price", icon: "🏪",
        darija: "L-magasin l-khor gal-li b ...", phonetic: "El-ma-ga-zeen el-khor gal-lee b ...",
        english: "The other shop told me [price]",
        situation: "You've seen cheaper elsewhere",
        successRate: 0.75, riskLevel: "medium"
    },
    walk_away_threat: {
        id: 'walk_away_threat', name: "Walk Away", icon: "🚶",
        darija: "Safi, ana mashi. Bslama!", phonetic: "Sa-fee, a-na ma-shee. Bs-la-ma!",
        english: "Okay, I'm leaving. Goodbye!",
        situation: "Final pressure — vendor won't budge",
        successRate: 0.80, riskLevel: "high",
        note: "Only use as your FINAL move — you must actually leave"
    },
    bulk_discount: {
        id: 'bulk_discount', name: "Bulk Purchase", icon: "📦",
        darija: "Ila shrit joj, ash t3tini?", phonetic: "Ee-la shreet zhozh, ash ta-tee-nee?",
        english: "If I buy two, what discount?",
        situation: "Buying multiple items from same vendor",
        successRate: 0.85, riskLevel: "low"
    },
    cash_advantage: {
        id: 'cash_advantage', name: "Cash Offer", icon: "💵",
        darija: "N3tik cash daba", phonetic: "Na-teek cash da-ba",
        english: "I'll give you cash right now",
        situation: "Close to agreement — sweeten the deal",
        successRate: 0.70, riskLevel: "low"
    },
    time_pressure: {
        id: 'time_pressure', name: "Time Pressure", icon: "⏰",
        darija: "Ana 3andi waqt qalil", phonetic: "A-na 3an-dee waqt qa-leel",
        english: "I have little time",
        situation: "Vendor is slow-playing or stalling",
        successRate: 0.60, riskLevel: "medium"
    },
    quality_question: {
        id: 'quality_question', name: "Quality Doubt", icon: "🔍",
        darija: "Wash hadi b-ssa7?", phonetic: "Wash ha-dee b-ssa7?",
        english: "Is this really authentic?",
        situation: "Vendor claiming premium quality — challenge it",
        successRate: 0.65, riskLevel: "medium"
    },
    friend_recommendation: {
        id: 'friend_recommendation', name: "Friend Reference", icon: "👥",
        darija: "Sahbi gal-li 3la had l-magasin", phonetic: "Sa7-bee gal-lee 3la had el-ma-ga-zeen",
        english: "My friend told me about this shop",
        situation: "Build rapport and trust first",
        successRate: 0.55, riskLevel: "low"
    },
    final_offer: {
        id: 'final_offer', name: "Final Offer", icon: "⚡",
        darija: "Hadi akher 7aja 3andi", phonetic: "Ha-dee a-kher 7a-zha 3an-dee",
        english: "This is my final offer",
        situation: "End game — you've decided your max price",
        successRate: 0.75, riskLevel: "high"
    }
};


// ---------------------------------------------------------------
// VENDOR PROFILE SYSTEM
// Learns vendor patterns by GPS-hashed location (~100m precision)
// ---------------------------------------------------------------

class VendorProfileDB {
    constructor() {
        this.profiles = this._load();
    }

    geoHash(lat, lng) {
        if (!lat || !lng) return 'unknown';
        return `${(lat * 1000).toFixed(0)}_${(lng * 1000).toFixed(0)}`;
    }

    getProfile(lat, lng) {
        return this.profiles[this.geoHash(lat, lng)] || null;
    }

    getNearbyProfiles(lat, lng, radius = 2) {
        if (!lat || !lng) return [];
        const bLat = Math.round(lat * 1000);
        const bLng = Math.round(lng * 1000);
        const nearby = [];
        for (let dL = -radius; dL <= radius; dL++) {
            for (let dN = -radius; dN <= radius; dN++) {
                const h = `${bLat + dL}_${bLng + dN}`;
                if (this.profiles[h]) nearby.push(this.profiles[h]);
            }
        }
        return nearby;
    }

    recordInteraction(lat, lng, interaction) {
        const hash = this.geoHash(lat, lng);
        if (!this.profiles[hash]) {
            this.profiles[hash] = {
                id: hash, interactions: [],
                profile: { avgDiscount: 0, style: 'unknown', weakPoints: [], bestTime: null }
            };
        }
        const p = this.profiles[hash];
        p.interactions.push({
            timestamp: Date.now(),
            askingPrice: interaction.asking,
            finalPrice: interaction.paid,
            discount: interaction.asking > 0 ? ((interaction.asking - interaction.paid) / interaction.asking) * 100 : 0,
            tacticsUsed: interaction.tactics || [],
            outcome: interaction.success ? 'success' : 'fail',
            timeOfDay: new Date().getHours()
        });
        if (p.interactions.length > 20) p.interactions = p.interactions.slice(-20);
        this._updateProfile(p);
        this._save();
    }

    _updateProfile(p) {
        const ints = p.interactions;
        if (!ints.length) return;
        const discounts = ints.map(i => i.discount);
        p.profile.avgDiscount = Math.round(discounts.reduce((a, b) => a + b, 0) / discounts.length);

        // Style detection
        const avg = p.profile.avgDiscount;
        if (avg > 30) p.profile.style = 'flexible';
        else if (avg < 10) p.profile.style = 'firm';
        else {
            const wa = ints.filter(i => i.tacticsUsed.includes('walk_away_threat') && i.outcome === 'success').length;
            p.profile.style = wa / ints.length > 0.4 ? 'aggressive' : 'friendly';
        }

        // Best tactics
        const ts = {};
        ints.forEach(i => (i.tacticsUsed || []).forEach(t => {
            if (!ts[t]) ts[t] = { s: 0, n: 0 };
            ts[t].n++;
            if (i.outcome === 'success') ts[t].s++;
        }));
        p.profile.weakPoints = Object.entries(ts)
            .map(([t, v]) => ({ t, r: v.n > 0 ? v.s / v.n : 0 }))
            .sort((a, b) => b.r - a.r).slice(0, 3).map(x => x.t);

        // Best time
        const byH = {};
        ints.forEach(i => { if (!byH[i.timeOfDay]) byH[i.timeOfDay] = []; byH[i.timeOfDay].push(i.discount); });
        let bestH = null, bestD = 0;
        Object.entries(byH).forEach(([h, ds]) => {
            const a = ds.reduce((x, y) => x + y, 0) / ds.length;
            if (a > bestD) { bestD = a; bestH = parseInt(h); }
        });
        p.profile.bestTime = bestH;
    }

    _save() {
        try {
            const sixMo = 6 * 30 * 24 * 3600000;
            Object.keys(this.profiles).forEach(k => {
                const ints = this.profiles[k].interactions;
                if (ints.length && Date.now() - ints[ints.length - 1].timestamp > sixMo) delete this.profiles[k];
            });
            localStorage.setItem('alidade_vendor_profiles', JSON.stringify(this.profiles));
        } catch (e) { console.error('[VENDOR] Save error:', e); }
    }

    _load() {
        try { return JSON.parse(localStorage.getItem('alidade_vendor_profiles') || '{}'); } catch { return {}; }
    }
}


// ---------------------------------------------------------------
// NEGOTIATION LEARNER
// ML from outcomes to improve future tactic suggestions
// ---------------------------------------------------------------

class TacticalNegotiationLearner {
    constructor() {
        this.database = this._load();
        this._applyLearnedRates();
    }

    recordOutcome(nego) {
        const outcome = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            timestamp: Date.now(),
            itemType: nego.itemType,
            askingPrice: nego.askingPrice,
            targetPrice: nego.targetPrice,
            finalPrice: nego.finalPrice,
            location: nego.location || 'unknown',
            tacticsUsed: nego.tacticsUsed || [],
            success: nego.success,
            discount: nego.askingPrice > 0 ? ((nego.askingPrice - nego.finalPrice) / nego.askingPrice * 100) : 0,
            satisfaction: nego.satisfaction || 3,
            duration: nego.duration || 0
        };
        this.database.push(outcome);
        this._save();
        this._applyLearnedRates();
        console.log('[LEARNER] 📚 Recorded:', outcome.id, 'Discount:', outcome.discount.toFixed(1) + '%');
    }

    _applyLearnedRates() {
        if (this.database.length < 3) return;
        const stats = {};
        this.database.forEach(r => (r.tacticsUsed || []).forEach(t => {
            if (!stats[t]) stats[t] = { s: 0, n: 0 };
            stats[t].n++;
            if (r.success) stats[t].s++;
        }));
        Object.entries(stats).forEach(([id, v]) => {
            if (NEGOTIATION_TACTICS[id] && v.n >= 2) {
                const learned = v.s / v.n;
                NEGOTIATION_TACTICS[id].successRate = learned * 0.6 + NEGOTIATION_TACTICS[id].successRate * 0.4;
            }
        });
    }

    getRecommendations(ctx) {
        const similar = this.database.filter(r =>
            r.itemType === ctx.itemType && r.success &&
            Math.abs(r.askingPrice - ctx.askingPrice) < ctx.askingPrice * 0.5
        );
        if (similar.length < 2) return null;
        const freq = {};
        similar.forEach(r => (r.tacticsUsed || []).forEach(t => { freq[t] = (freq[t] || 0) + 1; }));
        return {
            recommendations: Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 3)
                .map(([id, c]) => ({ id, frequency: c / similar.length })),
            basedOn: similar.length,
            avgDiscount: similar.reduce((s, r) => s + r.discount, 0) / similar.length
        };
    }

    getStats() {
        if (!this.database.length) return null;
        const ok = this.database.filter(r => r.success);
        return {
            total: this.database.length,
            successRate: ok.length / this.database.length * 100,
            avgDiscount: ok.length ? ok.reduce((s, r) => s + r.discount, 0) / ok.length : 0,
            totalSaved: ok.reduce((s, r) => s + (r.askingPrice - r.finalPrice), 0)
        };
    }

    _save() { localStorage.setItem('alidade_nego_history', JSON.stringify(this.database.slice(-100))); }
    _load() { try { return JSON.parse(localStorage.getItem('alidade_nego_history') || '[]'); } catch { return []; } }
}


// ---------------------------------------------------------------
// TACTIC SELECTION ENGINE
// Rule-based + AI-learned hybrid selection
// ---------------------------------------------------------------

function selectTacticsForSituation(context) {
    const { overpricePercent, area, vendorStyle, timeOfDay, itemType, askingPrice } = context;
    const tactics = [];

    // Area-based
    if (area === 'jemaa') {
        tactics.push(NEGOTIATION_TACTICS.not_tourist);
        tactics.push(NEGOTIATION_TACTICS.walk_away_threat);
    }

    // Price gap
    if (overpricePercent > 80) {
        tactics.push(NEGOTIATION_TACTICS.comparison_shop);
        tactics.push(NEGOTIATION_TACTICS.quality_question);
    } else if (overpricePercent > 40) {
        tactics.push(NEGOTIATION_TACTICS.gentle_lower);
        tactics.push(NEGOTIATION_TACTICS.comparison_shop);
    } else {
        tactics.push(NEGOTIATION_TACTICS.gentle_lower);
        tactics.push(NEGOTIATION_TACTICS.cash_advantage);
    }

    // Vendor style
    if (vendorStyle === 'aggressive' || vendorStyle === 'firm') {
        tactics.push(NEGOTIATION_TACTICS.walk_away_threat);
        tactics.push(NEGOTIATION_TACTICS.final_offer);
    }

    // Time-based
    const hour = timeOfDay || new Date().getHours();
    if (hour > 18) tactics.push(NEGOTIATION_TACTICS.time_pressure);

    // Learning-based
    if (window.tacticalNegoLearner) {
        const learned = window.tacticalNegoLearner.getRecommendations({ itemType, askingPrice });
        if (learned) {
            learned.recommendations.forEach(rec => {
                const t = NEGOTIATION_TACTICS[rec.id];
                if (t && !tactics.find(e => e.id === t.id)) {
                    t._recommended = true;
                    tactics.push(t);
                }
            });
        }
    }

    // Always include gentle option
    if (!tactics.find(t => t.id === 'gentle_lower')) tactics.push(NEGOTIATION_TACTICS.gentle_lower);

    // Deduplicate + limit to 4
    const seen = new Set();
    return tactics.filter(t => { if (seen.has(t.id)) return false; seen.add(t.id); return true; }).slice(0, 4);
}

function getContextualWarnings(area, itemType) {
    const w = [];
    if (area === 'jemaa') {
        w.push('Jemaa el-Fnaa has the highest tourist markup (2-5x typical)');
        w.push('Vendors here are experienced — stay firm on your target');
    }
    if (area === 'souks_main') w.push('Main souks: moderate markup — better deals in side alleys');
    if (itemType?.includes('leather')) {
        w.push('Check leather: genuine has natural grain texture, not uniform');
        w.push('Smell test — real leather has a distinct earthy scent');
    }
    if (itemType?.includes('rug')) {
        w.push('Rug negotiation takes 30-60min for premium pieces — be patient');
        w.push('Ask knot count and whether dyes are natural vs synthetic');
    }
    if (itemType?.includes('saffron')) {
        w.push('⚠️ HIGH SCAM RISK: Much "saffron" is fake (safflower/turmeric)');
        w.push('Real saffron: deep red threads, bitter taste, yellow dye in water');
    }
    if (itemType?.includes('argan')) w.push('Verify cosmetic-grade (pure) vs cooking-grade (roasted)');
    const hour = new Date().getHours();
    if (hour < 10) w.push('Early morning: vendors may inflate to "start the day well"');
    if (hour > 20) w.push('Late evening: vendors may be more flexible to close');
    return w.slice(0, 4);
}


// ---------------------------------------------------------------
// TACTICAL BRIEF GENERATOR
// ---------------------------------------------------------------

function generateTacticalBrief(context) {
    const { itemType, askingPrice, fairPrice, area, timeOfDay } = context;
    const overpricePercent = fairPrice > 0 ? Math.round(((askingPrice - fairPrice) / fairPrice) * 100) : 0;
    const opening = Math.round(fairPrice * 0.4);
    const walkAway = Math.round(fairPrice * 1.2);

    // Try to get vendor profile
    let vendorIntel = null;
    try {
        const pos = window._lastPosition;
        if (pos && window.vendorProfileDB) {
            const nearby = window.vendorProfileDB.getNearbyProfiles(pos.lat, pos.lng);
            if (nearby.length > 0) vendorIntel = nearby[0].profile;
        }
    } catch (e) { /* no location */ }

    const tactics = selectTacticsForSituation({
        overpricePercent, area, vendorStyle: vendorIntel?.style,
        timeOfDay, itemType, askingPrice
    });

    return {
        situation: {
            scamLevel: overpricePercent > 100 ? 'EXTREME' : overpricePercent > 50 ? 'HIGH' : overpricePercent > 20 ? 'MODERATE' : 'FAIR',
            overprice: overpricePercent, area, timeOfDay
        },
        gameplan: {
            opening, target: fairPrice, walkAway,
            estimatedRounds: Math.max(1, Math.ceil(overpricePercent / 30)),
            estimatedDuration: overpricePercent > 60 ? '8-15 min' : '3-8 min'
        },
        tactics,
        vendorIntel,
        warnings: getContextualWarnings(area, itemType)
    };
}


// ---------------------------------------------------------------
// EXPOSE GLOBALLY
// ---------------------------------------------------------------
window.NEGOTIATION_TACTICS = NEGOTIATION_TACTICS;
window.VendorProfileDB = VendorProfileDB;
window.TacticalNegotiationLearner = TacticalNegotiationLearner;
window.generateTacticalBrief = generateTacticalBrief;
window.selectTacticsForSituation = selectTacticsForSituation;
window.tacticalNegoLearner = window.tacticalNegoLearner || new TacticalNegotiationLearner();
window.vendorProfileDB = new VendorProfileDB();

// Haggle state tracking
window._haggleState = {
    brief: null, missionStartTime: null, tacticsUsed: [],
    askingPrice: 0, targetPrice: 0, itemType: null, area: null
};

console.log('[TACTICAL] ⚔️ Briefing System Initialized | Tactics:', Object.keys(NEGOTIATION_TACTICS).length, '| History:', window.tacticalNegoLearner.database.length);
