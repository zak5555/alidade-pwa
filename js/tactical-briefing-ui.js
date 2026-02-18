// ═══════════════════════════════════════════════════════════════
// MODULE: TACTICAL BRIEFING UI
// Pre-Mission Brief, Quick-Ref Card & Post-Mission Debrief
// ═══════════════════════════════════════════════════════════════

/**
 * ASKING PRICE INPUT (Step between Results → Brief)
 */
window.showHagglePriceInput = function () {
    const deepAnalysis = window._lastDeepAnalysis;
    const hybridPrice = window._lastHybridPrice;
    if (!deepAnalysis || !hybridPrice) {
        showToast('No analysis available. Scan an item first.', 'warning');
        return;
    }
    const resultsView = document.getElementById('price-check-results');
    if (!resultsView) return;

    const item = deepAnalysis.item || {};
    const displayName = (window.ITEM_DISPLAY_NAMES || {})[item.item_id] || item.item_id || 'Unknown Item';
    const fairPrice = hybridPrice?.prices?.median || 0;
    const emoji = (displayName.split(' ')[0]) || '📦';

    resultsView.innerHTML = `
        <div class="space-y-4 animate-[slide-up-fade_0.3s_ease-out]">
            <div class="bg-void-900/60 rounded-machined p-5 border border-signal-amber/30">
                <div class="text-center mb-5">
                    <div class="text-3xl mb-2">⚔️</div>
                    <h2 class="text-xl font-bold text-signal-amber tracking-wide">PRE-MISSION INTEL</h2>
                    <p class="text-[10px] text-zinc-500 font-mono mt-1">ENTER VENDOR'S ASKING PRICE</p>
                </div>
                <div class="bg-void-800/50 rounded-machined p-4 mb-4 border border-void-700/50">
                    <div class="flex items-center gap-3">
                        <div class="text-2xl">${emoji}</div>
                        <div>
                            <div class="font-semibold text-white">${displayName}</div>
                            <div class="text-xs text-zinc-500 font-mono">Fair: ${fairPrice} DH</div>
                        </div>
                    </div>
                </div>
                <div class="mb-4">
                    <label for="haggle-asking-price" class="text-[10px] text-zinc-400 font-mono uppercase tracking-wide block mb-2">
                        What price did the vendor quote?
                    </label>
                    <div class="flex items-center gap-2">
                        <input type="number" id="haggle-asking-price" name="haggle_asking_price" placeholder="e.g. 800"
                            class="flex-1 bg-void-800 border-2 border-signal-amber/30 rounded-machined px-4 py-4 text-2xl font-mono font-bold text-white text-center focus:outline-none focus:border-signal-amber transition-colors"
                            inputmode="numeric" min="1">
                        <span class="text-signal-amber font-mono font-bold text-lg">DH</span>
                    </div>
                </div>
                <button onclick="window.launchTacticalBrief()"
                    class="w-full py-4 bg-signal-amber text-black font-bold text-lg rounded-machined tracking-wide shadow-lg shadow-amber-900/30 active:scale-[0.98] transition-transform">
                    GENERATE TACTICAL BRIEF ⚡
                </button>
                <button onclick="window.backToResults()"
                    class="w-full py-2 mt-2 bg-void-800 text-zinc-500 text-sm rounded-machined">
                    ← Back to Analysis
                </button>
            </div>
        </div>`;
    setTimeout(() => { document.getElementById('haggle-asking-price')?.focus(); }, 300);
};

window.backToResults = function () {
    const da = window._lastDeepAnalysis;
    const hp = window._lastHybridPrice;
    if (da && hp && typeof showDeepResults === 'function') showDeepResults(da, hp);
};

/**
 * LAUNCH TACTICAL BRIEF
 */
window.launchTacticalBrief = function () {
    const priceInput = document.getElementById('haggle-asking-price');
    const askingPrice = parseInt(priceInput?.value);
    if (!askingPrice || askingPrice <= 0) {
        showToast("Enter the vendor's asking price", 'warning');
        priceInput?.focus();
        return;
    }
    const deepAnalysis = window._lastDeepAnalysis;
    const hybridPrice = window._lastHybridPrice;
    const itemType = deepAnalysis?.item?.item_id || 'generic_item';
    const fairPrice = hybridPrice?.prices?.median || 0;
    const area = hybridPrice?.area || 'unknown';

    const brief = window.generateTacticalBrief({
        itemType, askingPrice, fairPrice, area,
        timeOfDay: new Date().getHours()
    });

    window._haggleState = {
        brief, missionStartTime: null, tacticsUsed: [],
        askingPrice, targetPrice: fairPrice, itemType, area
    };

    _renderTacticalBriefUI(brief, deepAnalysis, hybridPrice, askingPrice);
};

/**
 * TACTICAL BRIEF UI — Full screen briefing
 */
function _renderTacticalBriefUI(brief, deepAnalysis, hybridPrice, askingPrice) {
    const resultsView = document.getElementById('price-check-results');
    if (!resultsView) return;

    const item = deepAnalysis?.item || {};
    const displayName = (window.ITEM_DISPLAY_NAMES || {})[item.item_id] || item.item_id || 'Unknown';

    const tc = {
        EXTREME: { border: 'border-red-500', text: 'text-red-500', badge: 'bg-red-500 text-white' },
        HIGH: { border: 'border-signal-amber', text: 'text-signal-amber', badge: 'bg-signal-amber text-black' },
        MODERATE: { border: 'border-yellow-500', text: 'text-yellow-500', badge: 'bg-yellow-500 text-black' },
        FAIR: { border: 'border-signal-emerald', text: 'text-signal-emerald', badge: 'bg-signal-emerald text-black' }
    }[brief.situation.scamLevel] || { border: 'border-zinc-500', text: 'text-zinc-400', badge: 'bg-zinc-600 text-white' };

    const riskColor = { low: 'text-signal-emerald', medium: 'text-signal-amber', high: 'text-signal-crimson' };

    const tacticsHTML = brief.tactics.map((t, i) => `
        <div class="bg-void-800 p-3 rounded-machined ${t._recommended ? 'border border-signal-cyan/30' : ''}">
            <div class="flex items-start gap-3">
                <div class="w-7 h-7 rounded-full bg-signal-amber/20 text-signal-amber flex items-center justify-center text-sm font-bold flex-shrink-0">${t.icon}</div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1 flex-wrap">
                        <span class="text-sm font-bold text-white">${t.name}</span>
                        ${t._recommended ? '<span class="text-[8px] px-1.5 py-0.5 bg-signal-cyan/20 text-signal-cyan rounded font-mono">⭐ AI PICK</span>' : ''}
                        <span class="text-[8px] px-1.5 py-0.5 ${riskColor[t.riskLevel] || ''} font-mono ml-auto">${Math.round(t.successRate * 100)}%</span>
                    </div>
                    <div class="text-[10px] text-zinc-500 mb-2">${t.situation}</div>
                    <div class="bg-void-900/50 p-2 rounded border-l-2 border-signal-emerald/50">
                        <div class="text-xs text-signal-emerald font-mono font-bold">"${t.darija}"</div>
                        <div class="text-[9px] text-zinc-500 mt-0.5">${t.phonetic} — ${t.english}</div>
                    </div>
                    ${t.note ? `<div class="text-[9px] text-signal-amber mt-1.5 font-mono">⚠️ ${t.note}</div>` : ''}
                </div>
            </div>
        </div>`).join('');

    const vendorHTML = brief.vendorIntel ? `
        <div class="bg-signal-cyan/5 border border-signal-cyan/20 rounded-machined p-4">
            <h3 class="text-signal-cyan font-bold text-xs font-mono mb-3 tracking-wider">🕵️ VENDOR INTEL</h3>
            <div class="space-y-1.5 text-xs text-zinc-300">
                <p>• Style: <strong class="text-white">${brief.vendorIntel.style}</strong></p>
                <p>• Typical discount: <strong class="text-signal-emerald">${brief.vendorIntel.avgDiscount}%</strong></p>
                ${brief.vendorIntel.weakPoints?.length ? `<p>• Best tactics: <strong class="text-signal-amber">${brief.vendorIntel.weakPoints.map(w => (window.NEGOTIATION_TACTICS[w]?.name || w)).join(', ')}</strong></p>` : ''}
                ${brief.vendorIntel.bestTime !== null ? `<p>• Best time: <strong class="text-signal-cyan">${brief.vendorIntel.bestTime}:00</strong></p>` : ''}
            </div>
        </div>` : '';

    const warningsHTML = brief.warnings.length ? `
        <div class="bg-red-900/10 border border-red-500/20 rounded-machined p-4">
            <h3 class="text-red-400 font-bold text-xs font-mono mb-2 tracking-wider">⚠️ WARNINGS</h3>
            <div class="space-y-1">${brief.warnings.map(w => `<p class="text-[10px] text-zinc-400">• ${w}</p>`).join('')}</div>
        </div>` : '';

    // Learner stats badge
    const stats = window.tacticalNegoLearner?.getStats();
    const statsHTML = stats ? `
        <div class="bg-void-800/50 rounded-machined p-3 border border-void-700/30">
            <div class="flex items-center justify-between text-[9px] font-mono text-zinc-500">
                <span>YOUR RECORD</span>
                <span>${stats.total} negotiations | ${stats.avgDiscount.toFixed(0)}% avg discount | ${stats.totalSaved.toFixed(0)} DH saved</span>
            </div>
        </div>` : '';

    resultsView.innerHTML = `
        <div class="space-y-3 animate-[slide-up-fade_0.4s_ease-out]">
            <!-- HEADER -->
            <div class="bg-void-900 ${tc.border} border-2 rounded-machined p-4">
                <div class="flex items-center justify-between mb-2">
                    <h2 class="${tc.text} font-bold text-lg font-mono tracking-wide">⚡ TACTICAL BRIEF</h2>
                    <span class="text-[9px] text-zinc-600 font-mono">PRE-MISSION INTEL</span>
                </div>
                <p class="text-[10px] text-zinc-500 font-mono">
                    Read BEFORE entering the shop. Memorize key numbers & tactics.
                </p>
            </div>

            <!-- THREAT ASSESSMENT -->
            <div class="bg-void-900 ${tc.border} border rounded-machined p-4">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Threat Level</span>
                    <span class="px-3 py-1 rounded text-[10px] font-bold font-mono ${tc.badge}">${brief.situation.scamLevel}</span>
                </div>
                <div class="grid grid-cols-3 gap-2 text-center">
                    <div class="bg-void-800 p-2 rounded-machined">
                        <div class="text-xl font-mono font-bold text-red-400">+${brief.situation.overprice}%</div>
                        <div class="text-[8px] text-zinc-600 mt-1 font-mono">OVERPRICE</div>
                    </div>
                    <div class="bg-void-800 p-2 rounded-machined">
                        <div class="text-xl font-mono font-bold text-signal-amber">${brief.gameplan.estimatedRounds}</div>
                        <div class="text-[8px] text-zinc-600 mt-1 font-mono">ROUNDS</div>
                    </div>
                    <div class="bg-void-800 p-2 rounded-machined">
                        <div class="text-xl font-mono font-bold text-signal-cyan">${brief.gameplan.estimatedDuration}</div>
                        <div class="text-[8px] text-zinc-600 mt-1 font-mono">EST. TIME</div>
                    </div>
                </div>
            </div>

            <!-- MISSION PARAMETERS -->
            <div class="bg-void-900 border border-signal-emerald/30 rounded-machined p-4">
                <h3 class="text-signal-emerald font-bold text-xs font-mono mb-3 tracking-wider">🎯 MISSION PARAMETERS</h3>
                <div class="space-y-2">
                    <div class="flex items-center justify-between p-3 bg-red-900/20 border border-red-500/20 rounded-machined">
                        <div><div class="text-[9px] text-red-400 font-mono uppercase">VENDOR ASK</div><div class="text-[9px] text-zinc-500 mt-0.5">Their opening price</div></div>
                        <div class="text-xl font-mono font-bold text-red-400">${askingPrice} DH</div>
                    </div>
                    <div class="flex items-center justify-between p-3 bg-void-800 rounded-machined">
                        <div><div class="text-[9px] text-signal-cyan font-mono uppercase">YOUR OPENING</div><div class="text-[9px] text-zinc-500 mt-0.5">Start here, go up slowly</div></div>
                        <div class="text-xl font-mono font-bold text-signal-cyan">${brief.gameplan.opening} DH</div>
                    </div>
                    <div class="flex items-center justify-between p-3 bg-signal-emerald/10 border border-signal-emerald/30 rounded-machined">
                        <div><div class="text-[9px] text-signal-emerald font-mono font-bold uppercase">⭐ TARGET PRICE</div><div class="text-[9px] text-zinc-400 mt-0.5">Fair market value</div></div>
                        <div class="text-2xl font-mono font-bold text-signal-emerald">${brief.gameplan.target} DH</div>
                    </div>
                    <div class="flex items-center justify-between p-3 bg-void-800 rounded-machined">
                        <div><div class="text-[9px] text-signal-crimson font-mono uppercase">🚫 WALK AWAY</div><div class="text-[9px] text-zinc-500 mt-0.5">Do NOT pay more</div></div>
                        <div class="text-xl font-mono font-bold text-signal-crimson">${brief.gameplan.walkAway} DH</div>
                    </div>
                </div>
            </div>

            <!-- APPROVED TACTICS -->
            <div class="bg-void-900 border border-void-700 rounded-machined p-4">
                <h3 class="text-zinc-400 font-bold text-xs font-mono mb-3 tracking-wider">🎭 APPROVED TACTICS</h3>
                <div class="space-y-2">${tacticsHTML}</div>
            </div>

            ${vendorHTML}
            ${warningsHTML}
            ${statsHTML}

            <!-- ACTION BUTTONS -->
            <div class="sticky bottom-4 space-y-2">
                <button onclick="window.startMission()"
                    class="w-full py-4 bg-signal-emerald text-black font-bold text-lg rounded-machined active:scale-[0.98] transition-transform shadow-lg shadow-emerald-900/30">
                    ✓ READY — START MISSION
                </button>
                <button onclick="window.showHagglePriceInput()"
                    class="w-full py-2 bg-void-800 text-zinc-500 text-sm rounded-machined">
                    ← Change Asking Price
                </button>
            </div>
        </div>`;
}


// ---------------------------------------------------------------
// QUICK REFERENCE CARD (Floating mini-card during negotiation)
// ---------------------------------------------------------------

function showQuickRefCard(brief) {
    // Remove existing
    const existing = document.getElementById('quick-ref-card');
    if (existing) existing.remove();

    const card = document.createElement('div');
    card.id = 'quick-ref-card';
    card.className = 'fixed bottom-20 right-4 bg-void-900/95 backdrop-blur-lg border border-signal-emerald/30 rounded-machined p-3 shadow-lg shadow-emerald-900/20 z-40 max-w-[200px]';
    card.style.animation = 'slide-up-fade 0.3s ease-out';
    card.innerHTML = `
        <div class="flex items-center justify-between mb-2">
            <span class="text-[9px] text-signal-emerald font-mono uppercase tracking-wider">Quick Ref</span>
            <button onclick="document.getElementById('quick-ref-card').remove()" class="text-zinc-600 text-xs hover:text-white">✕</button>
        </div>
        <div class="space-y-1.5 text-xs">
            <div class="flex justify-between">
                <span class="text-zinc-500 font-mono">Open:</span>
                <span class="text-signal-cyan font-mono font-bold">${brief.gameplan.opening} DH</span>
            </div>
            <div class="flex justify-between border-y border-void-700 py-1.5">
                <span class="text-signal-emerald font-mono font-bold">Target:</span>
                <span class="text-signal-emerald font-mono font-bold">${brief.gameplan.target} DH</span>
            </div>
            <div class="flex justify-between">
                <span class="text-zinc-500 font-mono">Max:</span>
                <span class="text-signal-crimson font-mono font-bold">${brief.gameplan.walkAway} DH</span>
            </div>
        </div>
        <div class="mt-2 pt-2 border-t border-void-700">
            <button onclick="window.completeMission()"
                class="w-full py-1.5 bg-signal-emerald/20 text-signal-emerald text-[10px] font-bold rounded-machined hover:bg-signal-emerald/30 transition-colors font-mono">
                ✓ MISSION COMPLETE
            </button>
        </div>`;
    document.body.appendChild(card);
}

/**
 * START MISSION — User taps "READY"
 */
window.startMission = function () {
    const state = window._haggleState;
    if (!state?.brief) { showToast('No brief loaded', 'warning'); return; }

    state.missionStartTime = Date.now();

    // Show quick ref card
    showQuickRefCard(state.brief);

    // Minimize the briefing UI
    window.cancelPriceCheck();
    showToast('Mission started! Quick-ref card active ⚡', 'success');

    // Haptic feedback
    if (window.Haptics) window.Haptics.trigger('medium');
};

/**
 * COMPLETE MISSION — Post-negotiation debrief
 */
window.completeMission = function () {
    // Remove quick ref card
    const card = document.getElementById('quick-ref-card');
    if (card) card.remove();

    _showMissionDebrief();
};

/**
 * POST-MISSION DEBRIEF UI
 */
function _showMissionDebrief() {
    const state = window._haggleState;
    if (!state) return;

    const duration = state.missionStartTime ? Math.round((Date.now() - state.missionStartTime) / 1000) : 0;
    const durationMin = Math.floor(duration / 60);
    const durationSec = duration % 60;

    const allTactics = window.NEGOTIATION_TACTICS || {};
    const tacticCheckboxes = Object.values(allTactics).map(t => `
        <label class="flex items-center gap-2 p-2 bg-void-800 rounded-machined cursor-pointer hover:bg-void-700 transition-colors">
            <input type="checkbox" name="debrief_tactics" value="${t.id}" class="debrief-tactic accent-emerald-500">
            <span class="text-sm">${t.icon}</span>
            <span class="text-xs text-zinc-300">${t.name}</span>
        </label>`).join('');

    const modal = document.createElement('div');
    modal.id = 'mission-debrief-modal';
    modal.className = 'fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4';
    modal.style.animation = 'slide-up-fade 0.3s ease-out';
    modal.innerHTML = `
        <div class="bg-void-900 border border-signal-emerald/30 rounded-machined p-5 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 class="text-signal-emerald font-bold text-xl font-mono mb-1 tracking-wide">📋 MISSION DEBRIEF</h2>
            <p class="text-[10px] text-zinc-500 font-mono mb-4">Duration: ${durationMin}m ${durationSec}s</p>

            <!-- Final Price -->
            <div class="mb-4">
                <label for="debrief-final-price" class="text-[10px] text-zinc-400 font-mono uppercase block mb-1">Final price you paid (0 if no deal)</label>
                <div class="flex items-center gap-2">
                    <input type="number" id="debrief-final-price" name="debrief_final_price" placeholder="e.g. 350" inputmode="numeric"
                        class="flex-1 bg-void-800 border border-void-600 rounded-machined px-3 py-3 text-xl font-mono font-bold text-white text-center focus:outline-none focus:border-signal-emerald">
                    <span class="text-signal-emerald font-mono font-bold">DH</span>
                </div>
            </div>

            <!-- Tactics Used -->
            <div class="mb-4">
                <label class="text-[10px] text-zinc-400 font-mono uppercase block mb-2">Tactics you used (select all)</label>
                <div class="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">${tacticCheckboxes}</div>
            </div>

            <!-- Satisfaction -->
            <div class="mb-5">
                <label class="text-[10px] text-zinc-400 font-mono uppercase block mb-2">Satisfaction (1-5)</label>
                <div class="flex gap-2 justify-center" id="debrief-satisfaction">
                    ${[1, 2, 3, 4, 5].map(n => `
                        <button onclick="document.querySelectorAll('#debrief-satisfaction button').forEach(b=>b.classList.remove('bg-signal-amber','text-black'));this.classList.add('bg-signal-amber','text-black');this.dataset.selected='true';window._debriefSatisfaction=${n}"
                            class="w-12 h-12 bg-void-800 hover:bg-signal-amber/30 text-zinc-300 rounded-machined font-bold text-lg transition-colors">
                            ${n}
                        </button>`).join('')}
                </div>
            </div>

            <!-- Submit -->
            <button onclick="window.submitDebrief()"
                class="w-full py-4 bg-signal-emerald text-black font-bold text-lg rounded-machined active:scale-[0.98] transition-transform mb-2">
                SUBMIT DEBRIEF
            </button>
            <button onclick="document.getElementById('mission-debrief-modal').remove()"
                class="w-full py-2 bg-void-800 text-zinc-500 text-sm rounded-machined">
                Skip
            </button>
        </div>`;
    document.body.appendChild(modal);
}

/**
 * SUBMIT DEBRIEF — Record outcome to learner + vendor profile
 */
window.submitDebrief = function () {
    const state = window._haggleState;
    const finalPrice = parseInt(document.getElementById('debrief-final-price')?.value) || 0;
    const satisfaction = window._debriefSatisfaction || 3;
    const tacticsUsed = Array.from(document.querySelectorAll('.debrief-tactic:checked')).map(cb => cb.value);
    const success = finalPrice > 0 && finalPrice <= (state?.brief?.gameplan?.walkAway || Infinity);

    // Remove modal
    const modal = document.getElementById('mission-debrief-modal');
    if (modal) modal.remove();

    if (!state) { showToast('No mission data', 'warning'); return; }

    const duration = state.missionStartTime ? Date.now() - state.missionStartTime : 0;
    const discount = state.askingPrice > 0 ? ((state.askingPrice - finalPrice) / state.askingPrice * 100) : 0;

    // Record to TacticalNegotiationLearner
    if (window.tacticalNegoLearner) {
        window.tacticalNegoLearner.recordOutcome({
            itemType: state.itemType,
            askingPrice: state.askingPrice,
            targetPrice: state.targetPrice,
            finalPrice: finalPrice,
            location: state.area,
            tacticsUsed: tacticsUsed,
            success: success,
            satisfaction: satisfaction,
            duration: duration
        });
    }

    // Record to VendorProfileDB
    if (window.vendorProfileDB && window._lastPosition) {
        window.vendorProfileDB.recordInteraction(
            window._lastPosition.lat, window._lastPosition.lng,
            { asking: state.askingPrice, paid: finalPrice, tactics: tacticsUsed, success: success }
        );
    }

    // Show result toast
    if (finalPrice > 0) {
        const savedDH = state.askingPrice - finalPrice;
        const emoji = discount >= 30 ? '🏆' : discount >= 15 ? '✅' : '👍';
        showToast(`${emoji} Saved ${savedDH} DH (${discount.toFixed(0)}% off) — Data recorded!`, 'success');
    } else {
        showToast('No deal — data recorded for future intel', 'info');
    }

    // Reset state
    window._haggleState = { brief: null, missionStartTime: null, tacticsUsed: [], askingPrice: 0, targetPrice: 0, itemType: null, area: null };
    window._debriefSatisfaction = 3;
};

console.log('[TACTICAL-UI] 🎯 Briefing UI System Loaded');
