// ---------------------------------------------------------------
// INTEL ORGANIC TABS RUNTIME (Extracted from app.js)
// ---------------------------------------------------------------
function renderPharmacyTab() {
    // Attach event listeners after rendering
    setTimeout(() => {
        document.querySelectorAll('.drug-card').forEach(card => {
            card.addEventListener('click', () => {
                const drugName = card.getAttribute('data-drug-name');
                showPharmacyFlashCard(drugName);
            });
        });
    }, 0);

    return `
        <!--INTEL HEADER-->
            <div class="relative p-4 bg-gradient-to-r from-emerald-950/60 to-zinc-950 border-l-[3px] border-signal-emerald mb-6">
                <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px);"></div>
                <div class="relative">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="px-2 py-0.5 bg-signal-emerald/20 border border-signal-emerald/40 text-emerald-400 text-[10px] font-mono font-bold tracking-widest">INTEL BRIEF</span>
                    </div>
                    <p class="text-xs text-zinc-300 leading-relaxed mb-1">
                        <span class="text-white font-bold font-mono">TARGET:</span> Pharmacist (Green Cross sign). Most speak French/English.
                    </p>
                    <p class="text-xs text-emerald-400/80 font-mono tracking-wide">
                        TAP CARD FOR FULL-SCREEN FLASH CARD FOR PHARMACIST
                    </p>
                </div>
            </div>

            <div class="space-y-4">
            
                <!-- SAFE: GREEN -->
                <div class="drug-card group relative overflow-hidden bg-void-950 border border-signal-emerald/30 hover:border-signal-emerald/60 active:scale-[0.98] transition-all cursor-pointer" data-drug-name="SMECTA">
                    <div class="absolute inset-0 opacity-[0.02] pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(16,185,129,0.1) 2px, rgba(16,185,129,0.1) 4px);"></div>
                    <div class="flex items-center justify-between px-4 py-2 bg-signal-emerald/10 border-b border-signal-emerald/20">
                        <div class="flex items-center gap-3">
                            <div class="w-3 h-3 rounded-full bg-signal-emerald shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"></div>
                            <span class="text-[10px] font-mono font-bold text-emerald-400 tracking-[0.2em] uppercase">Classification: SAFE</span>
                        </div>
                        <span class="text-[10px] font-mono text-void-500">Pepto-Bismol Alt.</span>
                    </div>
                    <div class="p-4 space-y-3">
                        <div class="flex items-baseline gap-2">
                            <span class="text-xs font-mono text-void-500 tracking-widest">ASK FOR:</span>
                            <h3 class="font-heading text-xl font-black text-emerald-400 tracking-wide">SMECTA</h3>
                            <span class="text-xs text-void-600 font-mono">(Diosmectite)</span>
                        </div>
                        <p class="text-sm text-zinc-400 leading-relaxed border-l-2 border-signal-emerald/30 pl-3">
                            <span class="text-emerald-400 font-bold">Gold Standard.</span> Natural clay powder coats stomach lining like a bandage.
                        </p>
                        <div class="flex items-start gap-2 p-3 bg-signal-emerald/5 border border-signal-emerald/20">
                            <span class="text-emerald-400 text-sm">*</span>
                            <div>
                                <span class="text-[10px] font-mono font-bold text-emerald-400/80 tracking-widest block mb-1">PROTOCOL</span>
                                <p class="text-xs text-zinc-300 font-mono leading-relaxed">1 sachet in half cup water, 3x daily.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- SAFE: BLUE -->
                <div class="drug-card group relative overflow-hidden bg-void-950 border border-blue-500/30 hover:border-blue-500/60 active:scale-[0.98] transition-all cursor-pointer" data-drug-name="DIARIT">
                    <div class="absolute inset-0 opacity-[0.02] pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(59,130,246,0.1) 2px, rgba(59,130,246,0.1) 4px);"></div>
                    <div class="flex items-center justify-between px-4 py-2 bg-blue-500/10 border-b border-blue-500/20">
                        <div class="flex items-center gap-3">
                            <div class="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse"></div>
                            <span class="text-[10px] font-mono font-bold text-blue-400 tracking-[0.2em] uppercase">Classification: SAFE</span>
                        </div>
                        <span class="text-[10px] font-mono text-void-500">Dioralyte Alt.</span>
                    </div>
                    <div class="p-4 space-y-3">
                        <div class="flex items-baseline gap-2 flex-wrap">
                            <span class="text-xs font-mono text-void-500 tracking-widest">ASK FOR:</span>
                            <h3 class="font-heading text-xl font-black text-blue-400 tracking-wide">DIARIT</h3>
                            <span class="text-xs text-void-500 font-mono">(or ADIARIL for kids)</span>
                        </div>
                        <p class="text-sm text-zinc-400 leading-relaxed border-l-2 border-blue-500/30 pl-3">
                            <span class="text-blue-400 font-bold">"Survival Med".</span> Sodium-Glucose pump rehydrates fast.
                        </p>
                        <div class="flex items-start gap-2 p-3 bg-blue-500/5 border border-blue-500/20">
                            <span class="text-blue-400 text-sm">*</span>
                            <div>
                                <span class="text-[10px] font-mono font-bold text-blue-400/80 tracking-widest block mb-1">PROTOCOL</span>
                                <p class="text-xs text-zinc-300 font-mono leading-relaxed">Mix 1 sachet in 1 Liter of BOTTLED water. Sip slowly.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- CAUTION: AMBER -->
                <div class="drug-card group relative overflow-hidden bg-void-950 border border-signal-amber/30 hover:border-signal-amber/60 active:scale-[0.98] transition-all cursor-pointer" data-drug-name="IMODIUM">
                    <div class="absolute inset-0 opacity-[0.02] pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(245,158,11,0.1) 2px, rgba(245,158,11,0.1) 4px);"></div>
                    <div class="flex items-center justify-between px-4 py-2 bg-signal-amber/10 border-b border-signal-amber/20">
                        <div class="flex items-center gap-3">
                            <div class="w-3 h-3 rounded-full bg-signal-amber shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse"></div>
                            <span class="text-[10px] font-mono font-bold text-signal-amber tracking-[0.2em] uppercase">Classification: CAUTION</span>
                        </div>
                        <span class="text-[10px] font-mono text-void-500">Imodium</span>
                    </div>
                    <div class="p-4 space-y-3">
                        <div class="flex items-baseline gap-2">
                            <span class="text-xs font-mono text-void-500 tracking-widest">ASK FOR:</span>
                            <h3 class="font-heading text-xl font-black text-signal-amber tracking-wide">IMODIUM</h3>
                            <span class="text-xs text-void-600 font-mono">(Loperamide)</span>
                        </div>
                        <p class="text-sm text-zinc-400 leading-relaxed border-l-2 border-signal-amber/30 pl-3">
                            Paralyzes gut. <span class="text-signal-amber font-bold">Emergency use only.</span>
                        </p>
                        <div class="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/40">
                            <span class="text-red-400 text-lg">[!]</span>
                            <div>
                                <span class="text-[10px] font-mono font-bold text-red-400 tracking-widest block mb-1">THREAT ALERT</span>
                                <p class="text-xs text-red-300 font-mono leading-relaxed">Do NOT use if fever/bloody stool. Traps bacteria. <span class="text-white font-bold">USE ONLY FOR FLIGHTS.</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- STANDARD: GRAY -->
                <div class="drug-card group relative overflow-hidden bg-void-950 border border-void-600/30 hover:border-zinc-500/60 active:scale-[0.98] transition-all cursor-pointer" data-drug-name="CHARBON ACTIF">
                    <div class="absolute inset-0 opacity-[0.02] pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(161,161,170,0.1) 2px, rgba(161,161,170,0.1) 4px);"></div>
                    <div class="flex items-center justify-between px-4 py-2 bg-void-800/50 border-b border-void-700/50">
                        <div class="flex items-center gap-3">
                            <div class="w-3 h-3 rounded-full bg-zinc-400 shadow-[0_0_8px_rgba(161,161,170,0.4)]"></div>
                            <span class="text-[10px] font-mono font-bold text-zinc-400 tracking-[0.2em] uppercase">Classification: STANDARD</span>
                        </div>
                        <span class="text-[10px] font-mono text-void-500">Charcoal</span>
                    </div>
                    <div class="p-4 space-y-3">
                        <div class="flex items-baseline gap-2">
                            <span class="text-xs font-mono text-void-500 tracking-widest">ASK FOR:</span>
                            <h3 class="font-heading text-xl font-black text-white tracking-wide">CHARBON ACTIF</h3>
                        </div>
                        <p class="text-sm text-zinc-400 leading-relaxed border-l-2 border-void-600/50 pl-3">
                            Massive porous carbon surface absorbs gas/toxins. <span class="text-zinc-300 font-bold">Excellent for bloating.</span>
                        </p>
                    </div>
                </div>

                <!-- STANDARD: WHITE -->
                <div class="drug-card group relative overflow-hidden bg-void-950 border border-zinc-500/30 hover:border-zinc-400/60 active:scale-[0.98] transition-all cursor-pointer" data-drug-name="RENNIE or GAVISCON">
                    <div class="absolute inset-0 opacity-[0.02] pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px);"></div>
                    <div class="flex items-center justify-between px-4 py-2 bg-void-800/30 border-b border-void-700/30">
                        <div class="flex items-center gap-3">
                            <div class="w-3 h-3 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]"></div>
                            <span class="text-[10px] font-mono font-bold text-zinc-300 tracking-[0.2em] uppercase">Classification: STANDARD</span>
                        </div>
                        <span class="text-[10px] font-mono text-void-500">Tums Alt.</span>
                    </div>
                    <div class="p-4 space-y-3">
                        <div class="flex items-baseline gap-2 flex-wrap">
                            <span class="text-xs font-mono text-void-500 tracking-widest">ASK FOR:</span>
                            <h3 class="font-heading text-xl font-black text-white tracking-wide">RENNIE</h3>
                            <span class="text-xs text-void-500 font-mono">or</span>
                            <h3 class="font-heading text-xl font-black text-white tracking-wide">GAVISCON</h3>
                        </div>
                        <p class="text-sm text-zinc-400 leading-relaxed border-l-2 border-void-600/50 pl-3">
                            Antacid for heartburn relief. Neutralizes stomach acid.
                        </p>
                    </div>
                </div>

                <!-- DANGER: RED -->
                <div class="drug-card group relative overflow-hidden bg-void-950 border border-red-500/40 hover:border-red-500/70 active:scale-[0.98] transition-all cursor-pointer" data-drug-name="CIPOR / ZITROMAX">
                    <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(239,68,68,0.1) 2px, rgba(239,68,68,0.1) 4px);"></div>
                    <div class="flex items-center justify-between px-4 py-2 bg-red-500/15 border-b border-red-500/30">
                        <div class="flex items-center gap-3">
                            <div class="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse"></div>
                            <span class="text-[10px] font-mono font-bold text-red-400 tracking-[0.2em] uppercase">Classification: DANGER</span>
                        </div>
                        <span class="text-[10px] font-mono text-red-400/60">Antibiotics</span>
                    </div>
                    <div class="p-4 space-y-3">
                        <div class="flex items-baseline gap-2">
                            <span class="text-xs font-mono text-void-500 tracking-widest">ASK FOR:</span>
                            <h3 class="font-heading text-xl font-black text-red-400 tracking-wide">CIPOR / ZITROMAX</h3>
                        </div>
                        <div class="flex items-start gap-3 p-3 bg-red-500/15 border-2 border-red-500/50">
                            <span class="text-red-400 text-lg">[!]</span>
                            <div>
                                <span class="text-[10px] font-mono font-bold text-signal-crimson tracking-widest block mb-1 animate-pulse">CRITICAL WARNING</span>
                                <p class="text-xs text-red-300 font-mono leading-relaxed">DO NOT USE without doctor prescription. <span class="text-red-400 font-bold">Misuse destroys gut biome permanently.</span></p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
    `;
}

// Flash Card Modal for Pharmacy
function showPharmacyFlashCard(drugName) {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = 'pharmacy-flash-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black';
    modal.innerHTML = `
        <div class="w-full h-full flex flex-col items-center justify-center p-8 text-center" >
                <h1 class="font-heading text-5xl font-bold text-emerald-400 mb-8">${drugName}</h1>
                <p class="text-2xl text-white mb-12 italic">"Je voudrais ceci, s'il vous plaît."</p>
                <p class="text-lg text-zinc-400 mb-16">(I would like this, please)</p>
                <button id="close-flash-modal" class="px-8 py-4 bg-signal-emerald hover:bg-emerald-400 text-black font-heading font-bold text-xl rounded-[2px] transition-all active:scale-95">
                    CLOSE
                </button>
            </div>
        `;
    document.body.appendChild(modal);

    // Close button handler
    document.getElementById('close-flash-modal').addEventListener('click', () => {
        modal.remove();
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function renderStreetFoodTab() {
    const stalls = [
        { name: 'Mechoui Stall #44', stallNumber: '44', badge: 'ELITE', badgeColor: 'bg-purple-500/30 text-purple-300 border-purple-500/60', borderColor: 'border-l-purple-500', info: 'Slow-Cooked Lamb.' },
        { name: 'Al Hajj Boujemaa', stallNumber: 'Boujemaa', badge: 'GEM', badgeColor: 'bg-blue-500/30 text-blue-300 border-blue-500/60', borderColor: 'border-l-blue-500', info: 'Seafood / Grills.' },
        { name: 'Sfenj Boulabada', stallNumber: 'Boulabada', badge: '? SAFE', badgeColor: 'bg-signal-emerald/30 text-emerald-300 border-signal-emerald/60', borderColor: 'border-l-emerald-500', info: 'Donuts (Sfenj).' },
        { name: 'Madame Fadma', stallNumber: 'Fadma', badge: '? SAFE', badgeColor: 'bg-signal-emerald/30 text-emerald-300 border-signal-emerald/60', borderColor: 'border-l-emerald-500', info: 'Harira Soup.' },
        { name: '#31 & #93', stallNumber: '31', badge: '? SAFE', badgeColor: 'bg-signal-emerald/30 text-emerald-300 border-signal-emerald/60', borderColor: 'border-l-emerald-500', info: 'Grills/Meat.' },
        { name: '#14 (Krit)', stallNumber: '14', badge: '? SAFE', badgeColor: 'bg-signal-emerald/30 text-emerald-300 border-signal-emerald/60', borderColor: 'border-l-emerald-500', info: 'Seafood.' },
        { name: '#1 (Aicha)', stallNumber: '1', badge: '? SAFE', badgeColor: 'bg-signal-emerald/30 text-emerald-300 border-signal-emerald/60', borderColor: 'border-l-emerald-500', info: 'Variety.' }
    ];

    return `
        <!--TACTICAL INTEL BANNER-->
            <div class="relative p-4 bg-gradient-to-r from-amber-950/60 to-zinc-950 border-l-[3px] border-signal-amber mb-6 overflow-hidden">
                <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(245,158,11,0.15) 2px, rgba(245,158,11,0.15) 4px);"></div>
                <div class="relative">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="px-2 py-0.5 bg-signal-amber/20 border border-signal-amber/40 text-signal-amber text-[10px] font-mono font-bold tracking-[0.2em]">INTEL BRIEF</span>
                    </div>
                    <p class="text-sm text-white leading-relaxed mb-1">
                        <span class="text-signal-amber font-bold font-mono">THE MATRIX:</span> Verified Jemaa El-Fna stalls with solid track records.
                    </p>
                    <p class="text-xs text-signal-amber/80 font-mono tracking-wide">
                        TIP: Tap the map icon to find the stall location.
                    </p>
                </div>
            </div>

            <!--STALL LIST-->
        <div class="space-y-3">
            ${stalls.map(stall => `
                    <div class="group relative bg-void-900 border border-void-700/60 border-l-[3px] ${stall.borderColor} rounded-sm hover:border-void-600 transition-all">
                        <div class="p-4 flex items-center justify-between gap-3">
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-2 mb-1">
                                    <h3 class="font-mono text-sm font-bold text-white tracking-wide truncate">${stall.name}</h3>
                                    <a href="https://www.google.com/maps/search/?api=1&query=Jemaa+El-Fna+Stall+${encodeURIComponent(stall.stallNumber)}+Marrakech" 
                                       target="_blank" 
                                       rel="noopener noreferrer"
                                       class="flex items-center justify-center w-8 h-8 min-w-[32px] rounded-sm bg-signal-amber/20 border border-signal-amber/40 text-signal-amber hover:bg-signal-amber/30 hover:border-signal-amber/60 transition-all active:scale-95"
                                       onclick="event.stopPropagation()">
                                        MAP
                                    </a>
                                </div>
                                <p class="text-xs text-void-500 font-mono">${stall.info}</p>
                            </div>
                            <span class="px-3 py-1.5 rounded-sm text-[11px] font-mono font-bold border ${stall.badgeColor} whitespace-nowrap">${stall.badge}</span>
                        </div>
                    </div>
                `).join('')}
        </div>
    `;
}

function renderRecoveryTab() {
    return `
        <!--TACTICAL INTEL BANNER-->
            <div class="relative p-4 bg-gradient-to-r from-emerald-950/60 to-zinc-950 border-l-[3px] border-signal-emerald mb-6 overflow-hidden">
                <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(16,185,129,0.15) 2px, rgba(16,185,129,0.15) 4px);"></div>
                <div class="relative">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="px-2 py-0.5 bg-signal-emerald/20 border border-signal-emerald/40 text-emerald-400 text-[10px] font-mono font-bold tracking-[0.2em]">PROTOCOL</span>
                    </div>
                    <p class="text-sm text-white leading-relaxed">
                        <span class="text-emerald-400 font-bold font-mono">THE DIET:</span> Structured recovery protocol for food-related illness.
                    </p>
                </div>
            </div>

            <!--TACTICAL TIMELINE-->
            <!--Phase 1: CRITICAL-->
            <div class="relative pl-8 pb-6 border-l-2 border-red-500/60">
                <div class="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-red-500 border-2 border-zinc-950 shadow-[0_0_12px_rgba(239,68,68,0.5)]"></div>
                <div class="relative bg-void-900 border border-red-500/40 rounded-sm overflow-hidden">
                    <div class="absolute inset-0 opacity-[0.02] pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(239,68,68,0.1) 2px, rgba(239,68,68,0.1) 4px);"></div>
                    <div class="p-4 relative">
                        <p class="text-[10px] text-red-400 font-mono uppercase tracking-[0.2em] mb-1">Phase 1: 0-24 Hours</p>
                        <h3 class="font-mono text-lg font-bold text-red-400 tracking-wide mb-3">AGGRESSIVE HYDRATION</h3>
                        <div class="space-y-2 text-sm text-zinc-300">
                            <p><span class="font-mono text-void-500">Goal:</span> Stop the crash.</p>
                            <p><span class="font-mono text-void-500">Tool:</span> DIARIT + Bottled Water.</p>
                            <p><span class="font-mono text-void-500">Rule:</span> "One sip every minute."</p>
                        </div>
                        <div class="mt-3 p-2 bg-red-500/15 border border-red-500/30 rounded-sm">
                            <p class="text-xs text-red-300 font-mono"><span class="text-red-400 font-bold">NO-GO:</span> Coffee, Alcohol, Sugary Juice.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!--Phase 2: WARNING-->
            <div class="relative pl-8 pb-6 border-l-2 border-signal-amber/60">
                <div class="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-signal-amber border-2 border-zinc-950 shadow-[0_0_12px_rgba(245,158,11,0.5)]"></div>
                <div class="relative bg-void-900 border border-signal-amber/40 rounded-sm overflow-hidden">
                    <div class="absolute inset-0 opacity-[0.02] pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(245,158,11,0.1) 2px, rgba(245,158,11,0.1) 4px);"></div>
                    <div class="p-4 relative">
                        <p class="text-[10px] text-signal-amber font-mono uppercase tracking-[0.2em] mb-1">Phase 2: 24-48 Hours</p>
                        <h3 class="font-mono text-lg font-bold text-signal-amber tracking-wide mb-3">BINDING FOODS</h3>
                        <p class="text-sm text-zinc-300 mb-3"><span class="font-mono text-void-500">Goal:</span> Solidify.</p>
                        <div class="grid grid-cols-2 gap-2">
                            <div class="p-2.5 bg-void-800 border border-void-700 rounded-sm text-xs text-zinc-300 font-mono">Moroccan Bread ("Khobz")</div>
                            <div class="p-2.5 bg-void-800 border border-void-700 rounded-sm text-xs text-zinc-300 font-mono">Plain Rice ("Rouz Abyad")</div>
                            <div class="p-2.5 bg-void-800 border border-void-700 rounded-sm text-xs text-zinc-300 font-mono">Carrot Soup ("Soupe de Carottes")</div>
                            <div class="p-2.5 bg-void-800 border border-void-700 rounded-sm text-xs text-zinc-300 font-mono">Boiled Potatoes</div>
                        </div>
                    </div>
                </div>
            </div>

            <!--Phase 3: RECOVERY-->
        <div class="relative pl-8">
            <div class="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-signal-emerald border-2 border-zinc-950 shadow-[0_0_12px_rgba(16,185,129,0.5)]"></div>
            <div class="relative bg-void-900 border border-signal-emerald/40 rounded-sm overflow-hidden">
                <div class="absolute inset-0 opacity-[0.02] pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(16,185,129,0.1) 2px, rgba(16,185,129,0.1) 4px);"></div>
                <div class="p-4 relative">
                    <p class="text-[10px] text-emerald-400 font-mono uppercase tracking-[0.2em] mb-1">Phase 3: 48+ Hours</p>
                    <h3 class="font-mono text-lg font-bold text-emerald-400 tracking-wide mb-3">REBOOT</h3>
                    <div class="space-y-2 text-sm text-zinc-300 mb-3">
                        <p><span class="font-mono text-void-500">Goal:</span> Restore Bacteria.</p>
                        <p><span class="font-mono text-void-500">Intel:</span> Need safe Probiotics.</p>
                    </div>
                    <div class="space-y-2 text-sm font-mono">
                        <p class="text-emerald-400"><span class="font-bold">? BUY:</span> <span class="text-zinc-300">Pasteurized yogurt (Activia / Chergui)</span></p>
                        <p class="text-red-400"><span class="font-bold">? AVOID:</span> <span class="text-zinc-300">Street yogurt / unpasteurized dairy</span></p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderMedEvacTab() {
    return `
        <!--TACTICAL INTEL BANNER-->
            <div class="relative p-4 bg-gradient-to-r from-red-950/60 to-zinc-950 border-l-[3px] border-red-500 mb-6 overflow-hidden">
                <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(239,68,68,0.15) 2px, rgba(239,68,68,0.15) 4px);"></div>
                <div class="relative">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="px-2 py-0.5 bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-mono font-bold tracking-[0.2em]">CRITICAL INTEL</span>
                    </div>
                    <p class="text-sm text-white leading-relaxed">
                        <span class="text-red-400 font-bold font-mono">EXTRACTION:</span> Top-tier medical facilities and emergency protocols.
                    </p>
                </div>
            </div>

            <!--SECTION 1: TOP - TIER CLINICS-->
            <div class="relative bg-void-900 border border-blue-500/40 rounded-sm mb-6 overflow-hidden">
                <div class="absolute inset-0 opacity-[0.02] pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(59,130,246,0.1) 2px, rgba(59,130,246,0.1) 4px);"></div>
                
                <!-- Section Header -->
                <div class="px-4 py-3 bg-blue-500/15 border-b border-blue-500/30 relative">
                    <div class="flex items-center gap-3">
                        <span class="text-lg">*</span>
                        <h3 class="font-mono text-sm font-bold text-blue-400 tracking-[0.15em] uppercase">TOP-TIER CLINICS</h3>
                    </div>
                </div>
                
                <div class="p-4 space-y-4 relative">
                    <!-- Clinic 1 -->
                    <div class="p-4 bg-void-950 border border-blue-500/30 border-l-[3px] border-l-blue-500 rounded-sm">
                        <h4 class="font-mono font-bold text-blue-300 text-base tracking-wide mb-1">CIM (The Medical Fortress)</h4>
                        <p class="text-xs text-zinc-400 mb-3 font-mono">Route de l'Aéroport. #1 Hub for Medical Tourism. 24/7 ER, Helipad.</p>
                        <div class="flex flex-wrap gap-2">
                            <a href="tel:+212524369595" class="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-red-500/20 border-2 border-red-500/50 rounded-sm text-sm text-red-400 font-mono font-bold hover:bg-red-500/30 hover:border-red-500/70 transition-all active:scale-95">
                                +212 5 24 36 95 95
                            </a>
                            <a href="tel:+14242834838" class="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-void-800 border border-void-600 rounded-sm text-sm text-zinc-300 font-mono hover:bg-void-700 transition-all active:scale-95">
                                +1 424 283 4838
                            </a>
                        </div>
                    </div>
                    
                    <!-- Clinic 2 -->
                    <div class="p-4 bg-void-950 border border-blue-500/30 border-l-[3px] border-l-blue-500 rounded-sm">
                        <h4 class="font-mono font-bold text-blue-300 text-base tracking-wide mb-1">Polyclinique du Sud (City Center)</h4>
                        <p class="text-xs text-zinc-400 mb-3 font-mono">Gueliz. Best for quick access.</p>
                        <a href="tel:+212524447999" class="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-red-500/20 border-2 border-red-500/50 rounded-sm text-sm text-red-400 font-mono font-bold hover:bg-red-500/30 hover:border-red-500/70 transition-all active:scale-95">
                            +212 5 24 44 79 99
                        </a>
                    </div>
                </div>
            </div>

            <!--SECTION 2: FINANCIAL OPS-->
            <div class="relative bg-void-900 border border-signal-amber/40 rounded-sm mb-6 overflow-hidden">
                <div class="absolute inset-0 opacity-[0.02] pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(245,158,11,0.1) 2px, rgba(245,158,11,0.1) 4px);"></div>
                
                <!-- Section Header -->
                <div class="px-4 py-3 bg-signal-amber/15 border-b border-signal-amber/30 relative">
                    <div class="flex items-center gap-3">
                        <span class="text-lg">*</span>
                        <h3 class="font-mono text-sm font-bold text-signal-amber tracking-[0.15em] uppercase">FINANCIAL OPS</h3>
                    </div>
                </div>
                
                <div class="p-4 space-y-3 text-sm text-zinc-300 relative">
                    <p><span class="font-mono text-signal-amber font-bold">Direct Billing:</span> CIM/Polyclinique work with AXA, Allianz.</p>
                    <p><span class="font-mono text-signal-amber font-bold">Pay & Claim:</span> Outpatient requires Cash/Card upfront. Keep receipts.</p>
                    <p><span class="font-mono text-signal-amber font-bold">G.O.P Protocol:</span> Call insurance BEFORE arriving to avoid deposit.</p>
                </div>
            </div>

            <!--SECTION 3: EXTRACTION(AMBULANCE)-->
        <div class="relative bg-void-900 border border-red-500/40 rounded-sm overflow-hidden">
            <div class="absolute inset-0 opacity-[0.02] pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(239,68,68,0.1) 2px, rgba(239,68,68,0.1) 4px);"></div>

            <!-- Section Header -->
            <div class="px-4 py-3 bg-red-500/15 border-b border-red-500/30 relative">
                <div class="flex items-center gap-3">
                    <span class="text-lg">*</span>
                    <h3 class="font-mono text-sm font-bold text-red-400 tracking-[0.15em] uppercase">EXTRACTION (Ambulance)</h3>
                </div>
            </div>

            <div class="p-4 space-y-4 relative">
                <!-- Green Option: RECOMMENDED -->
                <div class="p-4 bg-void-950 border-2 border-signal-emerald/50 rounded-sm">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs text-emerald-400 font-mono font-bold tracking-[0.1em]">? GREEN OPTION (Private)</span>
                        <span class="px-2 py-1 bg-signal-emerald/30 border border-signal-emerald/50 rounded-sm text-[10px] font-mono font-bold text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]">RECOMMENDED</span>
                    </div>
                    <p class="text-sm text-white mb-3"><span class="font-bold text-white">SOS Ambulance</span> - Private ICU. Fast.</p>
                    <a href="tel:+212650956222" class="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-signal-emerald/20 border-2 border-signal-emerald/50 rounded-sm text-sm text-emerald-400 font-mono font-bold hover:bg-signal-emerald/30 hover:border-signal-emerald/70 transition-all active:scale-95">
                        +212 6 50 95 62 22
                    </a>
                </div>

                <!-- Red Option: AVOID -->
                <div class="p-4 bg-void-950 border border-red-500/30 rounded-sm opacity-70">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs text-red-400 font-mono font-bold tracking-[0.1em]">? RED OPTION (Public)</span>
                        <span class="px-2 py-1 bg-red-500/20 border border-red-500/40 rounded-sm text-[10px] font-mono font-bold text-red-400">AVOID</span>
                    </div>
                    <p class="text-sm text-zinc-400">150 / 141. Slow. Takes you to Public Hospital.</p>
                </div>
            </div>
        </div>
    `;
}
