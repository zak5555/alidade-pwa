// Extracted from app.js: negotiation legacy fallback UI block (compatibility-first).

// ---------------------------------------------------------------
// VIEW: NEGOTIATION (MARKET WARFARE) MODULE
// ---------------------------------------------------------------

const negotiationLegacyDebugLog = (...args) => {
    if (window.__ALIDADE_DEBUG_LOGS__ === true) {
        console.log(...args);
    }
};

function renderNegotiation() {
    const app = document.getElementById('app');

    const html = `
        <div class="min-h-screen bg-void-950 pb-20" >
            <!--TACTICAL HEADER-->
            <header class="sticky top-0 z-20 bg-void-950/98 backdrop-blur-md border-b border-signal-amber/40 p-4 mb-6 relative overflow-hidden">
                <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(245,158,11,0.15) 2px, rgba(245,158,11,0.15) 4px);"></div>
                
                <div class="relative flex items-center gap-4">
                    <button onclick="window.alidadeApp.navigateTo('SOUK')" class="p-3 rounded-sm bg-void-900 border border-signal-amber/30 hover:bg-signal-amber/20 hover:border-signal-amber/60 transition-all active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center">
                        ${ICONS.arrowLeft}
                    </button>
                    <div class="flex-1">
                        <p class="text-[10px] text-signal-amber tracking-[0.25em] uppercase font-mono mb-0.5">Market Warfare</p>
                        <div class="flex items-center gap-2">
                            <span class="text-signal-amber/60 font-mono text-lg">[</span>
                            <h1 class="font-sans text-xl font-bold text-white uppercase tracking-wider">NEGOTIATION</h1>
                            <span class="text-signal-amber/60 font-mono text-lg">]</span>
                        </div>
                    </div>
                </div>
            </header>

            <div class="px-4">
                <!-- TACTICAL TAB BAR -->
                <div class="mb-6">
                    <div class="h-[1px] bg-void-800 mb-3"></div>
                    <div class="flex gap-2">
                        <button class="nego-tab flex-1 px-4 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-void-900 text-zinc-400 border border-void-600 transition-all hover:border-signal-amber/50 hover:text-signal-amber" data-tab="calculator">
                            01 CALCULATOR
                        </button>
                        <button class="nego-tab flex-1 px-4 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-void-900 text-zinc-400 border border-void-600 transition-all hover:border-signal-amber/50 hover:text-signal-amber" data-tab="scripts">
                            02 SCRIPTS
                        </button>
                        <button class="nego-tab flex-1 px-4 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-void-900 text-zinc-400 border border-void-600 transition-all hover:border-signal-amber/50 hover:text-signal-amber" data-tab="intel">
                            03 INTEL
                        </button>
                    </div>
                </div>

                <!-- TAB CONTENT -->
                <div id="nego-content"></div>
            </div>
        </div>

        <!--Phrase Modal-->
        <div id="phrase-modal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 hidden">
            <div class="bg-void-900 border border-signal-amber/30 rounded-sm p-6 max-w-sm mx-4">
                <h2 id="modal-phrase" class="font-sans text-3xl font-bold text-white text-center mb-4 uppercase tracking-wider"></h2>
                <p id="modal-meaning" class="text-sm text-zinc-300 text-center mb-6"></p>
                <button onclick="document.getElementById('phrase-modal').classList.add('hidden')" class="w-full py-3 min-h-[44px] bg-signal-amber/20 border border-signal-amber/50 rounded-sm text-signal-amber font-bold transition-all hover:bg-signal-amber/30">
                    CLOSE
                </button>
            </div>
        </div>
    `;

    app.innerHTML = html;
    switchNegoTab('calculator');
    attachNegoListeners();
}

function switchNegoTab(tabName) {
    document.querySelectorAll('.nego-tab').forEach(tab => {
        tab.className = "nego-tab flex-1 px-4 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-void-900 text-zinc-400 border border-void-600 transition-all";
        if (tab.getAttribute('data-tab') === tabName) {
            tab.className = "nego-tab flex-1 px-4 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-signal-amber text-zinc-950 border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-all";
        }
    });

    const content = document.getElementById('nego-content');
    switch (tabName) {
        case 'calculator': content.innerHTML = renderCalculatorTab(); attachCalculatorListeners(); break;
        case 'scripts': content.innerHTML = renderScriptsTab(); attachScriptsListeners(); break;
        case 'intel': content.innerHTML = renderIntelTab(); attachNegoIntelListeners(); break;
    }
}

function renderCalculatorTab() {
    return `
        <div class="space-y-6" >
            
            <div class="p-4 bg-amber-950/20 border border-signal-amber/30 rounded-[2px] relative overflow-hidden">
                <div class="absolute inset-0 opacity-[0.1] pointer-events-none" style="background-image: linear-gradient(0deg, transparent 50%, rgba(245, 158, 11, 0.2) 50%); background-size: 100% 4px;"></div>

                <div class="flex items-start gap-4 relative z-10">
                    <div class="p-3 bg-signal-amber/10 rounded-md border border-signal-amber/50 shadow-[0_0_15px_rgba(245,158,11,0.2)] shrink-0">
                         <span class="text-2xl">!</span>
                    </div>
                    <div>
                        <h2 class="text-base font-bold uppercase tracking-wider mb-1 font-sans" style="color: #fbbf24 !important;">PRICE DECRYPTER SYSTEM</h2>
                        
                        <p class="font-mono text-xs leading-relaxed" style="color: #d4d4d8;">
                            <span style="color: #d97706;">[INSTRUCTION]:</span> Enter the vendor's first offer below to calculate your counter-strategy.
                        </p>
                    </div>
                </div>
            </div>

            <div class="p-6 bg-void-900 border border-void-700 rounded-sm relative overflow-hidden">
                <div class="absolute inset-0 opacity-[0.05] pointer-events-none" style="background-image: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.05) 5px, rgba(255,255,255,0.05) 10px);"></div>
                
                <label class="block text-xs text-signal-amber font-mono uppercase tracking-[0.2em] mb-3">Target Acquisition (Vendor Offer)</label>
                <div class="relative">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-void-500 font-mono text-xl">MAD</span>
                    <input 
                        type="number" 
                        id="vendor-offer" 
                        placeholder="000" 
                        class="w-full pl-16 pr-4 py-4 bg-black border-2 border-void-700 rounded-sm text-signal-amber font-mono text-4xl tracking-widest focus:border-signal-amber focus:shadow-[0_0_30px_rgba(245,158,11,0.2)] focus:outline-none transition-all placeholder-zinc-700"
                    />
                </div>
            </div>

            <div id="calc-results" class="space-y-4 hidden animate-fadeIn">
                <div class="p-6 bg-signal-amber/10 border-l-[4px] border-signal-amber rounded-r-sm backdrop-blur-sm relative">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-[10px] text-signal-amber font-mono uppercase tracking-[0.2em] mb-1">Your Counter Strike</p>
                            <p class="text-xs text-zinc-400 mb-2">Say this immediately to anchor the price.</p>
                        </div>
                        <span class="text-signal-amber text-xs font-mono border border-signal-amber/30 px-2 py-1 rounded-sm">30%</span>
                    </div>
                    <p id="shock-price" class="font-mono text-5xl font-bold text-signal-amber mt-2 tracking-tighter">--</p>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div class="p-4 bg-signal-emerald/10 border-l-[4px] border-signal-emerald rounded-r-sm">
                        <div class="flex justify-between items-center mb-2">
                            <p class="text-[10px] text-signal-emerald font-mono uppercase tracking-wider">Target Deal</p>
                            <span class="text-signal-emerald/50 text-[10px]">45%</span>
                        </div>
                        <p id="target-price" class="font-mono text-2xl font-bold text-emerald-400">--</p>
                    </div>
                    
                    <div class="p-4 bg-signal-crimson/10 border-l-[4px] border-signal-crimson rounded-r-sm">
                        <div class="flex justify-between items-center mb-2">
                            <p class="text-[10px] text-signal-crimson font-mono uppercase tracking-wider">Walk Away</p>
                            <span class="text-signal-crimson/50 text-[10px]">60%</span>
                        </div>
                        <p id="walk-price" class="font-mono text-2xl font-bold text-rose-400">--</p>
                    </div>
                </div>
            </div>

            <div class="pt-4">
                 <button id="reset-calc" class="w-full py-4 bg-void-900 hover:bg-void-800 border border-void-700 text-zinc-400 font-mono text-sm tracking-widest transition-all hidden uppercase hover:text-white hover:border-zinc-500">
                    Reset Operations
                </button>
                <p class="text-[10px] text-zinc-400 text-center font-mono mt-4 uppercase tracking-wider">Algorithm calibrated for Marrakech Souks 2026</p>
            </div>
        </div>
        `;
}
function renderScriptsTab() {
    // 1. DATA: The 7 Tactical Phrases with Audio Links
    const phrases = [
        {
            darija: 'Ghali Bezaf!',
            meaning: 'Too Expensive!',
            usage: 'Use to break the anchor price immediately.',
            audio: 'assets/audio/ghali_bezaf.mp3'
        },
        {
            darija: 'Nqas Shwiya',
            meaning: 'Lower it a bit',
            usage: 'Polite request for a better price.',
            audio: 'assets/audio/nqas_shwiya.mp3'
        },
        {
            darija: 'Ana Mashi Tourist',
            meaning: 'I am not a tourist',
            usage: 'Assert local knowledge (use carefully).',
            audio: 'assets/audio/mashi_tourist.mp3'
        },
        {
            darija: "H'shuma",
            meaning: 'Shame on you',
            usage: 'Nuclear option. Use wisely for egregious scams.',
            audio: 'assets/audio/hshuma.mp3'
        },
        {
            darija: 'Allah Ysahel',
            meaning: 'May God make it easy',
            usage: 'Polite walk-away phrase.',
            audio: 'assets/audio/allah_ysahel.mp3'
        },
        {
            darija: 'Kayna chi Hemza?',
            meaning: 'Is there a deal?',
            usage: 'Signals you want a bargain opportunity.',
            audio: 'assets/audio/hemza.mp3'
        },
        {
            darija: 'A3tini Akhir Taman',
            meaning: 'Give me the last price',
            usage: 'Cuts through the games. Use at the end.',
            audio: 'assets/audio/akhir_taman.mp3'
        }
    ];
    // --- FIX: Add this helper function inside renderNegotiation ---
    window.togglePsychology = () => {
        const content = document.getElementById('psychology-content');
        const icon = document.getElementById('psychology-icon');

        // Toggle visibility
        content.classList.toggle('hidden');

        // Rotate arrow icon
        if (content.classList.contains('hidden')) {
            icon.style.transform = 'rotate(0deg)';
        } else {
            icon.style.transform = 'rotate(180deg)';
        }
    };
    // 2. HELPER: Audio Player (Safe Check)
    window.playScriptAudio = (e, url) => {
        e.stopPropagation(); // Prevent opening modal when clicking audio button
        new Audio(url).play().catch((err) => negotiationLegacyDebugLog('Audio error:', err));
    };

    // 3. HELPER: Modal Opener
    window.openPhraseModal = (index) => {
        const p = phrases[index];
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-void-950/95 backdrop-blur-md p-4 animate-fadeIn';
        modal.innerHTML = `
        <div class="w-full max-w-md bg-void-900 border-2 border-signal-amber rounded-sm p-6 relative shadow-[0_0_30px_rgba(245,158,11,0.2)]" >
                <div class="absolute inset-0 opacity-[0.05] pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(245,158,11,0.2) 2px, rgba(245,158,11,0.2) 4px);"></div>
                
                <button onclick="this.closest('.fixed').remove()" class="absolute top-4 right-4 p-2 text-void-500 hover:text-white transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
                
                <div class="text-center space-y-8 mt-4 relative z-10">
                    <div>
                        <h2 class="font-sans text-4xl font-bold text-white mb-2 tracking-tight">${p.darija}</h2>
                        <div class="inline-block relative">
                            <p class="font-mono text-signal-amber text-lg uppercase tracking-[0.2em] px-4 py-1 border-y border-signal-amber/30">${p.meaning}</p>
                        </div>
                    </div>
                    
                    <div class="bg-black/40 p-4 border-l-2 border-signal-amber text-left">
                        <p class="font-mono text-[10px] text-signal-amber uppercase tracking-wider mb-1">Tactical Usage</p>
                        <p class="text-zinc-300 italic text-sm leading-relaxed">${p.usage}</p>
                    </div>
                    
                    <button onclick="new Audio('${p.audio}').play()" class="w-full py-4 bg-amber-600 hover:bg-signal-amber active:scale-95 transition-all rounded-sm flex items-center justify-center gap-3 font-mono font-bold text-white text-sm tracking-widest shadow-lg uppercase">
                        <span>Play Audio Signal</span>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    };

    // 4. RETURN HTML (The Grid)
    return `
        <div class="space-y-6 animate-fadeIn pb-20" >
        <div class="p-4 bg-signal-amber/10 border-l-[4px] border-signal-amber rounded-r-sm flex items-start gap-4">
            <div class="p-2 bg-signal-amber/10 rounded-sm">
                <span class="text-2xl">*</span>
            </div>
            <div>
                <h2 class="font-mono text-xs font-bold text-signal-amber uppercase tracking-widest mb-1">Linguistic Arsenal</h2>
                <p class="text-xs text-zinc-400 leading-relaxed">Darija power phrases. Tap card for details. Tap icon for quick audio.</p>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            ${phrases.map((p, i) => `
                <div onclick="openPhraseModal(${i})" class="relative group bg-void-900 border border-void-700 hover:border-signal-amber rounded-sm p-5 transition-all active:scale-[0.98] cursor-pointer shadow-sm">
                    <div class="flex justify-between items-center mb-3">
                        <h3 class="font-sans text-lg font-bold text-white group-hover:text-signal-amber transition-colors">${p.darija}</h3>
                        <button onclick="playScriptAudio(event, '${p.audio}')" class="w-10 h-10 flex items-center justify-center bg-void-800 rounded-full text-zinc-400 hover:bg-signal-amber hover:text-void-950 transition-all border border-void-700 hover:border-amber-400 z-10">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                        </button>
                    </div>
                    <div class="h-[1px] bg-void-800 w-full mb-3 group-hover:bg-signal-amber/30 transition-colors"></div>
                    <p class="font-mono text-xs text-signal-amber/80 uppercase tracking-wider">${p.meaning}</p>
                </div>
            `).join('')}
        </div>
    </div>
        `;
}


// Intel Accordion Toggle Helper
window.toggleIntel = function (index) {
    const content = document.getElementById(`content - ${index} `);
    const icon = document.getElementById(`icon - ${index} `);

    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        icon.style.transform = 'rotate(180deg)';
        icon.classList.add('text-signal-amber');
    } else {
        content.classList.add('hidden');
        icon.style.transform = 'rotate(0deg)';
        icon.classList.remove('text-signal-amber');
    }
}

function attachNegoListeners() {
    document.querySelectorAll('.nego-tab').forEach(tab => {
        tab.addEventListener('click', () => switchNegoTab(tab.getAttribute('data-tab')));
    });
}

function attachCalculatorListeners() {
    const input = document.getElementById('vendor-offer');
    const results = document.getElementById('calc-results');
    const resetBtn = document.getElementById('reset-calc');
    const shockEl = document.getElementById('shock-price');
    const targetEl = document.getElementById('target-price');
    const walkEl = document.getElementById('walk-price');

    // ? PRIORITY 1: Load saved calculator state
    const calcState = appState.getModule('calculator');
    if (input && calcState.price) {
        input.value = calcState.price;
        // Trigger calculation display
        const offer = parseFloat(calcState.price);
        if (offer > 0) {
            const shock = Math.floor(offer * 0.30);
            const target = Math.floor(offer * 0.45);
            const walk = Math.floor(offer * 0.50);

            shockEl.textContent = `${shock} DH`;
            targetEl.textContent = `${target} DH`;
            walkEl.textContent = `${walk} DH`;

            results.classList.remove('hidden');
            resetBtn.classList.remove('hidden');
        }
    }

    if (input) {
        input.addEventListener('input', (e) => {
            const offer = parseFloat(e.target.value) || 0;

            // ? PRIORITY 1: Save calculator state
            appState.setModule('calculator', { price: e.target.value });
            if (offer > 0) {
                const shock = Math.floor(offer * 0.30);
                const target = Math.floor(offer * 0.45);
                const walk = Math.floor(offer * 0.50);

                shockEl.textContent = `${shock} DH`;
                targetEl.textContent = `${target} DH`;
                walkEl.textContent = `${walk} DH`;

                results.classList.remove('hidden');
                resetBtn.classList.remove('hidden');
            } else {
                results.classList.add('hidden');
                resetBtn.classList.add('hidden');
            }
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            input.value = '';
            // ? PRIORITY 1: Clear calculator state
            appState.setModule('calculator', { price: '' });
            results.classList.add('hidden');
            resetBtn.classList.add('hidden');
        });
    }
}

function attachScriptsListeners() {
    document.querySelectorAll('.phrase-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const phrase = btn.getAttribute('data-phrase');
            const meaning = btn.getAttribute('data-meaning');
            document.getElementById('modal-phrase').textContent = phrase;
            document.getElementById('modal-meaning').textContent = meaning;
            document.getElementById('phrase-modal').classList.remove('hidden');
        });
    });
}

function attachNegoIntelListeners() {
    // Accordion now handled by inline onclick handlers
}
