// Extracted from app.js: organic lab shell runtime block (compatibility-first).

// ---------------------------------------------------------------
// VIEW: ORGANIC LAB (PHARMACY, FOOD SAFETY, RECOVERY, MED-EVAC)
// ---------------------------------------------------------------

function renderOrganicLabPlaceholder() {
    const app = document.getElementById('app');

    app.innerHTML = `
        <div class="min-h-screen bg-void-950 pb-20" >
                <!--TACTICAL HEADER with Scanline Overlay-->
                <header class="sticky top-0 z-20 bg-void-950/98 backdrop-blur-md border-b border-signal-emerald/40 p-4 mb-6 relative overflow-hidden">
                    <!-- Scanline Texture -->
                    <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(16,185,129,0.15) 2px, rgba(16,185,129,0.15) 4px);"></div>
                    
                    <div class="relative flex items-center gap-4">
                        <button onclick="window.alidadeApp.navigateTo('HOME')" class="p-3 rounded-sm bg-void-900 border border-signal-emerald/30 hover:bg-signal-emerald/20 hover:border-signal-emerald/60 transition-all active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center">
                            ${ICONS.arrowLeft}
                        </button>
                        <div class="flex-1">
                            <p class="text-[10px] text-signal-emerald tracking-[0.25em] uppercase font-mono mb-0.5">Medical & Food Intel</p>
                            <!-- HUD-Style Title with Corner Brackets -->
                            <div class="flex items-center gap-2">
                                <span class="text-signal-emerald/60 font-mono text-lg">[</span>
                                <h1 class="font-heading text-2xl font-black text-emerald-400 tracking-wide">ORGANIC LAB</h1>
                                <span class="text-signal-emerald/60 font-mono text-lg">]</span>
                            </div>
                        </div>
                    </div>
                </header>

                <!--TACTICAL TAB BAR-->
                <div class="px-4 mb-6 overflow-x-auto no-scrollbar">
                    <!-- Scrollbar Track Indicator -->
                    <div class="h-[2px] bg-void-800 mb-3 relative">
                        <div class="absolute left-0 top-0 h-full w-1/4 bg-gradient-to-r from-emerald-500 to-emerald-500/30"></div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="switchOrganicTab('pharmacy')" id="org-tab-pharmacy" class="organic-tab px-5 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-signal-emerald text-zinc-950 border-2 border-emerald-400 whitespace-nowrap transition-all hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]">01 PHARMACY</button>
                        <button onclick="switchOrganicTab('streetfood')" id="org-tab-streetfood" class="organic-tab px-5 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-void-900 text-zinc-400 border border-void-600 whitespace-nowrap transition-all hover:border-signal-amber/50 hover:text-signal-amber">02 STREET FOOD</button>
                        <button onclick="switchOrganicTab('recovery')" id="org-tab-recovery" class="organic-tab px-5 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-void-900 text-zinc-400 border border-void-600 whitespace-nowrap transition-all hover:border-signal-emerald/50 hover:text-emerald-400">03 RECOVERY</button>
                        <button onclick="switchOrganicTab('medevac')" id="org-tab-medevac" class="organic-tab px-5 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-void-900 text-zinc-400 border border-void-600 whitespace-nowrap transition-all hover:border-red-500/50 hover:text-red-400">04 MED-EVAC</button>
                    </div>
                </div>

                <div id="organic-display" class="px-4 space-y-6"></div>
            </div>
        `;

    switchOrganicTab('pharmacy');
}

window.switchOrganicTab = function (tab) {
    // Update tab buttons with new tactical styling
    document.querySelectorAll('.organic-tab').forEach(btn => {
        btn.className = "organic-tab px-5 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-void-900 text-zinc-400 border border-void-600 whitespace-nowrap transition-all";
    });
    const activeBtn = document.getElementById(`org-tab-${tab}`);
    if (activeBtn) {
        // Active tab styling based on tab type
        const tabColors = {
            pharmacy: 'bg-signal-emerald text-zinc-950 border-2 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]',
            streetfood: 'bg-signal-amber text-zinc-950 border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]',
            recovery: 'bg-signal-emerald text-zinc-950 border-2 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]',
            medevac: 'bg-red-500 text-zinc-950 border-2 border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.25)]'
        };
        activeBtn.className = `organic-tab px-5 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider ${tabColors[tab]} whitespace-nowrap transition-all`;
    }

    const container = document.getElementById('organic-display');

    if (tab === 'pharmacy') {
        container.innerHTML = renderPharmacyTab();
    } else if (tab === 'streetfood') {
        container.innerHTML = renderStreetFoodTab();
    } else if (tab === 'recovery') {
        container.innerHTML = renderRecoveryTab();
    } else if (tab === 'medevac') {
        container.innerHTML = renderMedEvacTab();
    }
}
