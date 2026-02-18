(function initAlidadeNegotiationUtils(windowObj) {
    if (!windowObj) return;

    const negotiationUtils = windowObj.ALIDADE_NEGOTIATION_UTILS || {};

    if (typeof negotiationUtils.resolveSmartNegotiatorBuildStrategies !== 'function') {
        negotiationUtils.resolveSmartNegotiatorBuildStrategies = function resolveSmartNegotiatorBuildStrategies() {
            return {
                aggressive: {
                    name: 'AGGRESSIVE',
                    emoji: '⚔️',
                    color: 'crimson',
                    baseShockDiscount: 0.25,
                    baseFairDiscount: 0.35,
                    baseWalkAwayDiscount: 0.45,
                    riskLevel: 'high',
                    description: 'Maximum pressure for maximum savings'
                },
                balanced: {
                    name: 'BALANCED',
                    emoji: '⚖️',
                    color: 'amber',
                    baseShockDiscount: 0.30,
                    baseFairDiscount: 0.45,
                    baseWalkAwayDiscount: 0.55,
                    riskLevel: 'moderate',
                    description: 'Optimal balance of savings and success'
                },
                conservative: {
                    name: 'CONSERVATIVE',
                    emoji: '🛡️',
                    color: 'emerald',
                    baseShockDiscount: 0.40,
                    baseFairDiscount: 0.55,
                    baseWalkAwayDiscount: 0.65,
                    riskLevel: 'low',
                    description: 'Safe approach for guaranteed deals'
                }
            };
        };
    }

    if (typeof negotiationUtils.resolveRenderNegotiationHtml !== 'function') {
        negotiationUtils.resolveRenderNegotiationHtml = function resolveRenderNegotiationHtml(iconsObj) {
            return `
            <!-- INJECTED STYLES FOR NEGOTIATION MODULE -->


            <div class="min-h-screen bg-void-950 relative overflow-hidden pb-40">
                <!-- Scanline Overlay (Optimized) -->
                <div class="absolute inset-0 pointer-events-none opacity-[0.03] bg-grid-pattern"></div>
                
                <!-- Ascended Header (Performance Optimized) -->
                <header class="relative p-4 mb-6 animate-[slide-up-fade_0.6s_ease-out]">
                    <div class="absolute inset-0 bg-void-900/90 border-b border-signal-amber/20"></div>
                    <div class="relative flex items-center gap-4 mb-6">
                        <button onclick="window.alidadeApp.navigateTo('HOME')" class="group relative w-12 h-12 flex items-center justify-center rounded-full bg-void-900 border border-void-700 hover:border-signal-amber transition-all shadow-lg active:scale-95">
                             <div class="absolute inset-0 bg-signal-amber/10 scale-0 group-hover:scale-100 transition-transform rounded-full"></div>
                             ${iconsObj.arrowLeft}
                        </button>
                        <div class="flex-1">
                             <div class="flex items-center gap-2 mb-1">
                                 <span class="w-1.5 h-1.5 bg-signal-amber animate-pulse rounded-full"></span>
                                 <p class="text-[9px] text-zinc-500 tracking-[0.3em] uppercase font-mono">TACTICAL NEGOTIATION</p>
                             </div>
                             <h1 class="font-sans text-2xl font-black text-white tracking-wide uppercase leading-none">
                                MARKET <span class="text-signal-amber drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">WARFARE</span>
                             </h1>
                        </div>
                    </div>

                    <!-- Circuit Tab Navigation -->
                    <div class="grid grid-cols-3 gap-2">
                        <button onclick="switchNegoTab('calculator')" 
                            class="nego-tab group relative py-3 px-2 rounded-lg border border-void-700 bg-void-900/50 overflow-hidden transition-all active:scale-95 text-center"
                            data-tab="calculator">
                            <div class="absolute inset-0 opacity-0 group-hover:opacity-10 bg-signal-amber transition-opacity"></div>
                            <span class="relative z-10 block text-xl mb-1 group-hover:scale-110 transition-transform">🧙</span>
                            <span class="relative z-10 block text-[9px] font-mono font-bold tracking-widest uppercase text-zinc-500 group-hover:text-signal-amber transition-colors">WIZARD</span>
                        </button>

                        <button onclick="switchNegoTab('scripts')" 
                            class="nego-tab group relative py-3 px-2 rounded-lg border border-void-700 bg-void-900/50 overflow-hidden transition-all active:scale-95 text-center"
                            data-tab="scripts">
                            <div class="absolute inset-0 opacity-0 group-hover:opacity-10 bg-signal-amber transition-opacity"></div>
                            <span class="relative z-10 block text-xl mb-1 group-hover:scale-110 transition-transform">📜</span>
                            <span class="relative z-10 block text-[9px] font-mono font-bold tracking-widest uppercase text-zinc-500 group-hover:text-signal-amber transition-colors">SCRIPTS</span>
                        </button>

                        <button onclick="switchNegoTab('intel')" 
                            class="nego-tab group relative py-3 px-2 rounded-lg border border-void-700 bg-void-900/50 overflow-hidden transition-all active:scale-95 text-center"
                            data-tab="intel">
                            <div class="absolute inset-0 opacity-0 group-hover:opacity-10 bg-signal-amber transition-opacity"></div>
                            <span class="relative z-10 block text-xl mb-1 group-hover:scale-110 transition-transform">🤫</span>
                            <span class="relative z-10 block text-[9px] font-mono font-bold tracking-widest uppercase text-zinc-500 group-hover:text-signal-amber transition-colors">INTEL</span>
                        </button>
                    </div>
                </header>

                <!-- Content Container -->
                <div class="px-4" id="nego-content">
                    <!-- Tab content will be injected here -->
                </div>
            </div>
        `;
        };
    }

    if (typeof negotiationUtils.resolveSwitchNegoTabFlow !== 'function') {
        negotiationUtils.resolveSwitchNegoTabFlow = function resolveSwitchNegoTabFlow(options = {}) {
            const tabName = options.tabName || 'calculator';
            const setCurrentNegoTabFn = options.setCurrentNegoTabFn || (() => { });
            const persistTabFn = options.persistTabFn || (() => { });
            const documentObj = options.documentObj || windowObj.document;
            const renderCalculatorTabFn = options.renderCalculatorTabFn || (() => '');
            const attachCalculatorLogicFn = options.attachCalculatorLogicFn || (() => { });
            const renderScriptsTabFn = options.renderScriptsTabFn || (() => '');
            const renderIntelTabFn = options.renderIntelTabFn || (() => '');

            setCurrentNegoTabFn(tabName);
            persistTabFn(tabName);

            documentObj.querySelectorAll('.nego-tab').forEach(btn => {
                const label = btn.querySelector('span:last-child');
                const icon = btn.querySelector('span:first-child');
                void icon;

                if (btn.getAttribute('data-tab') === tabName) {
                    btn.classList.add('border-signal-amber', 'bg-void-800', 'shadow-[0_0_15px_rgba(245,158,11,0.15)]');
                    btn.classList.remove('border-void-700', 'bg-void-900/50');
                    if (label) {
                        label.classList.add('text-signal-amber');
                        label.classList.remove('text-zinc-500');
                    }
                } else {
                    btn.classList.remove('border-signal-amber', 'bg-void-800', 'shadow-[0_0_15px_rgba(245,158,11,0.15)]');
                    btn.classList.add('border-void-700', 'bg-void-900/50');
                    if (label) {
                        label.classList.remove('text-signal-amber');
                        label.classList.add('text-zinc-500');
                    }
                }
            });

            const container = documentObj.getElementById('nego-content');
            if (!container) return false;

            switch (tabName) {
                case 'calculator':
                    container.innerHTML = renderCalculatorTabFn();
                    attachCalculatorLogicFn();
                    break;
                case 'scripts':
                    container.innerHTML = renderScriptsTabFn();
                    break;
                case 'intel':
                    container.innerHTML = renderIntelTabFn();
                    break;
            }
            return true;
        };
    }

    if (typeof negotiationUtils.resolveScriptsCatalog !== 'function') {
        negotiationUtils.resolveScriptsCatalog = function resolveScriptsCatalog() {
            return [
                { title: 'Inquiry', text: 'Shhal hada?', sub: 'How much is this?', file: 'shhal_hada.mp3', color: 'emerald' },
                { title: 'Price Shock', text: 'Ghali Bezaf!', sub: 'Too Expensive!', file: 'ghali_bezaf.mp3', color: 'red' },
                { title: 'Soft Neg', text: 'Nqas Shwiya', sub: 'Lower it a bit', file: 'nqas_shwiya.mp3', color: 'amber' },
                { title: 'Identity', text: 'Ana Machi Tourist', sub: 'I am not a tourist', file: 'machi_tourist.mp3', color: 'blue' },
                { title: 'Confusion', text: 'Machi Euro', sub: 'Not Euro', file: 'machi_euro.mp3', color: 'purple' },
                { title: 'Refusal', text: 'La Shukran', sub: 'No Thank you', file: 'la_shukran.mp3', color: 'zinc' },
                { title: 'Firm No', text: 'Ma Bghit Walo', sub: "I don't want anything", file: 'mabghit_walo.mp3', color: 'red' },
                { title: 'Closing', text: 'A3tini Akhir Taman', sub: 'Last Price', file: 'akhir_taman.mp3', color: 'emerald' },
                { title: 'Walk Away', text: 'Allah Ysahel', sub: 'God make it easy', file: 'allah_ysahel.mp3', color: 'zinc' }
            ];
        };
    }

    if (typeof negotiationUtils.resolveRenderScriptsTabHtml !== 'function') {
        negotiationUtils.resolveRenderScriptsTabHtml = function resolveRenderScriptsTabHtml(scripts) {
            return `
        <div class="space-y-6 animate-[slide-up-fade_0.4s_ease-out] pb-24">
            <!-- Header Info -->
            <div class="relative p-4 bg-void-900/40 rounded-xl border border-void-700 flex gap-4 items-center overflow-hidden">
                <div class="absolute inset-0 opacity-[0.03] pointer-events-none bg-grid-pattern"></div>
                <div class="p-2 bg-void-800 rounded-lg border border-void-600">
                    <span class="text-xl">🤫</span>
                </div>
                <p class="text-xs text-zinc-400 font-mono leading-relaxed relative z-10">
                    <strong class="text-white">SILENT MODE:</strong> Tap card to flash message. Tap <span class="text-signal-amber">🔊</span> for audio.
                </p>
            </div>

            <!-- Scripts Grid -->
            <div class="grid grid-cols-1 gap-3">
                ${scripts.map((s, index) => {
                    const safeText = s.text.replace(/'/g, "\\'");
                    const safeSub = s.sub.replace(/'/g, "\\'");

                    return `
                <div class="flex gap-2 group animate-[slide-up-fade_0.5s_ease-out_both] delay-${index * 100}">
                    
                    <!-- Flash Card Button -->
                    <button onclick="window.openFlashCard('${safeText}', '${safeSub}', '${s.color}')" 
                        class="relative flex-1 p-5 bg-void-900/80 border border-void-700 border-l-4 border-l-${s.color}-500/80 rounded-r-xl rounded-l-sm flex items-center justify-between hover:bg-void-800 hover:border-void-500 active:scale-[0.98] transition-all text-left overflow-hidden shadow-sm group-hover:shadow-[0_0_15px_rgba(0,0,0,0.3)]">
                        
                        <!-- Circuit BG (Optimized: No Inline SVG) -->
                        <div class="absolute inset-0 opacity-[0.05] group-hover:opacity-[0.08] transition-opacity bg-grid-pattern">
                        </div>

                        <div class="relative z-10">
                            <h3 class="font-sans font-bold text-white text-lg tracking-wide group-hover:text-${s.color}-400 transition-colors">${s.text}</h3>
                            <p class="text-[10px] text-void-500 font-mono uppercase tracking-widest mt-1">${s.sub}</p>
                        </div>
                        <div class="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300 text-void-500">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
                        </div>
                    </button>
                    
                    <!-- Audio Button -->
                    <button onclick="window.playNegoAudio('${s.file}')" 
                        class="w-16 bg-void-900/80 border border-void-700 rounded-xl flex items-center justify-center text-void-500 hover:text-${s.color}-400 hover:bg-void-800 hover:border-${s.color}-500/50 active:scale-90 transition-all shadow-sm">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>
                    </button>
                </div>
                `;
                }).join('')}
            </div>
        </div>`;
        };
    }

    if (typeof negotiationUtils.resolveRenderHaggleStageFlow !== 'function') {
        negotiationUtils.resolveRenderHaggleStageFlow = function resolveRenderHaggleStageFlow(options = {}) {
            const haggleState = options.haggleState || {};
            const persistHaggleStateFn = options.persistHaggleStateFn || (() => { });
            const documentObj = options.documentObj || windowObj.document;
            const renderStage1Fn = options.renderStage1Fn || (() => '');
            const renderStage2Fn = options.renderStage2Fn || (() => '');
            const renderStage3Fn = options.renderStage3Fn || (() => '');
            const renderStage4Fn = options.renderStage4Fn || (() => '');
            const renderStage5Fn = options.renderStage5Fn || (() => '');
            const renderNegotiationHistoryFn = options.renderNegotiationHistoryFn || (() => '');
            const attachHaggleListenersFn = options.attachHaggleListenersFn || (() => { });
            const animateValueFn = options.animateValueFn || (() => { });

            persistHaggleStateFn(haggleState);

            const container = documentObj.getElementById('haggle-container');
            if (!container) return false;

            let stageHtml = '';
            switch (haggleState.stage) {
                case 1:
                    stageHtml = renderStage1Fn();
                    break;
                case 2:
                    stageHtml = renderStage2Fn();
                    break;
                case 3:
                    stageHtml = renderStage3Fn();
                    break;
                case 4:
                    stageHtml = renderStage4Fn();
                    break;
                case 5:
                    stageHtml = renderStage5Fn();
                    break;
                default:
                    stageHtml = renderStage1Fn();
            }

            container.innerHTML = stageHtml + renderNegotiationHistoryFn();
            attachHaggleListenersFn();

            // TACTICAL ANIMATIONS (Decrypt Effect)
            if (haggleState.stage === 2) {
                const shockEl = documentObj.getElementById('shock-price-display');
                if (shockEl) {
                    shockEl.textContent = '000';
                    animateValueFn(shockEl, 0, haggleState.shockPrice, 800, '', ' DH');
                }
            } else if (haggleState.stage === 4) {
                const fairEl = documentObj.getElementById('fair-price-display');
                if (fairEl) {
                    fairEl.textContent = '000';
                    animateValueFn(fairEl, 0, haggleState.fairPrice, 1000, '', ' DH');
                }
            }

            return true;
        };
    }

    // Negotiation compatibility render helpers.
    if (typeof negotiationUtils.resolveRenderIntelTabHtml !== 'function') {
        negotiationUtils.resolveRenderIntelTabHtml = function resolveRenderIntelTabHtml() {
            return `
    <div class="space-y-6 animate-[slide-up-fade_0.4s_ease-out] pb-24">
        <!-- Header Card -->
        <div class="relative p-6 bg-void-900/40 rounded-xl border border-purple-500/20 overflow-hidden group">
            <div class="absolute inset-0 opacity-[0.05] bg-grid-pattern"></div>
            
            <div class="relative z-10 flex items-start gap-4">
                <div class="p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
                     <span class="text-3xl">🧠</span>
                </div>
                <div>
                     <h2 class="text-purple-400 font-bold font-sans text-lg tracking-wide mb-1 uppercase">PSY OP INTELLIGENCE</h2>
                     <p class="text-xs text-zinc-400 leading-relaxed font-mono">The Souk is a theater. Understand the roles to win the game.</p>
                </div>
            </div>
        </div>

        <div class="space-y-4">
            <div class="flex items-center gap-2 mb-2">
                 <div class="h-[1px] flex-1 bg-void-800"></div>
                 <p class="text-[9px] text-zinc-500 font-mono uppercase tracking-[0.3em]">CORE PROTOCOLS</p>
                 <div class="h-[1px] flex-1 bg-void-800"></div>
            </div>
            
            <!-- Intel Cards -->
            <div class="bg-void-900/80 border border-red-500/30 overflow-hidden rounded-xl group transition-all hover:border-red-500/60">
                <div class="flex items-start gap-4 p-5 relative">
                     <div class="absolute inset-0 opacity-[0.05] bg-red-500/10"></div>
                     <div class="text-2xl mt-1 relative z-10">🛑</div>
                     <div class="relative z-10">
                         <h3 class="text-white font-bold text-sm mb-1 uppercase tracking-wide">RULE #1: NEVER FALL IN LOVE</h3>
                         <p class="text-xs text-zinc-400 leading-relaxed">If you show desire, you lose leverage. Be ready to walk away at any moment.</p>
                     </div>
                </div>
            </div>

            <div class="bg-void-900/80 border border-signal-amber/30 overflow-hidden rounded-xl group transition-all hover:border-signal-amber/60">
                 <div class="flex items-start gap-4 p-5 relative">
                     <div class="absolute inset-0 opacity-[0.05] bg-signal-amber/10"></div>
                     <div class="text-2xl mt-1 relative z-10">😐</div>
                     <div class="relative z-10">
                         <h3 class="text-white font-bold text-sm mb-1 uppercase tracking-wide">RULE #2: THE POKER FACE</h3>
                         <p class="text-xs text-zinc-400 leading-relaxed">Show zero emotion. Inspect limits. Flinch at the first price.</p>
                     </div>
                 </div>
            </div>

            <div class="bg-void-900/80 border border-signal-emerald/30 overflow-hidden rounded-xl group transition-all hover:border-signal-emerald/60">
                 <div class="flex items-start gap-4 p-5 relative">
                     <div class="absolute inset-0 opacity-[0.05] bg-signal-emerald/10"></div>
                     <div class="text-2xl mt-1 relative z-10">🤝</div>
                     <div class="relative z-10">
                         <h3 class="text-white font-bold text-sm mb-1 uppercase tracking-wide">RULE #3: THE WIN-WIN ILLUSION</h3>
                         <p class="text-xs text-zinc-400 leading-relaxed">The vendor needs to feel like they won. Be gracious at the end.</p>
                     </div>
                 </div>
            </div>
        </div>
        
        <div class="space-y-3">
             <div class="flex items-center gap-2 mb-2">
                 <div class="h-[1px] flex-1 bg-void-800"></div>
                 <p class="text-[9px] text-zinc-500 font-mono uppercase tracking-[0.3em]">KNOW YOUR OPPONENT</p>
                 <div class="h-[1px] flex-1 bg-void-800"></div>
            </div>

            <div class="grid grid-cols-1 gap-3">
                <div class="p-4 bg-void-900/40 rounded-xl border border-void-700">
                    <div class="flex justify-between mb-1">
                        <span class="font-bold text-blue-400 text-sm font-mono">🎭 THE ACTOR</span>
                        <span class="text-[9px] bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded tracking-wider uppercase">Common</span>
                    </div>
                    <p class="text-xs text-zinc-500 leading-relaxed">Pretends to be insulted by your offer. Tells you he has "children to feed". It's all part of the script. Smile and hold firm.</p>
                </div>

                <div class="p-4 bg-void-900/40 rounded-xl border border-void-700">
                    <div class="flex justify-between mb-1">
                        <span class="font-bold text-emerald-400 text-sm font-mono">🤝 THE BEST FRIEND</span>
                        <span class="text-[9px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded tracking-wider uppercase">Dangerous</span>
                    </div>
                    <p class="text-xs text-zinc-500 leading-relaxed">"Berber Whiskey" (Tea), compliments, "Special price for you my friend". Creates a guilt-trap so you buy.</p>
                </div>

                 <div class="p-4 bg-void-900/40 rounded-xl border border-void-700">
                    <div class="flex justify-between mb-1">
                        <span class="font-bold text-red-400 text-sm font-mono">🦈 THE SHARK</span>
                        <span class="text-[9px] bg-red-500/10 text-red-300 px-2 py-0.5 rounded tracking-wider uppercase">Avoid</span>
                    </div>
                    <p class="text-xs text-zinc-500 leading-relaxed">Aggressive. Blocks your exit. Demands money for "looking". Do not engage. Walk away fast.</p>
                </div>
            </div>
        </div>

        <div class="p-5 bg-void-900/60 border border-signal-amber/30 rounded-xl text-center relative overflow-hidden">
             <div class="absolute inset-0 opacity-[0.05] bg-signal-amber/10"></div>
            <span class="text-2xl mb-2 block relative z-10">💡</span>
            <p class="text-sm font-bold text-signal-amber mb-1 relative z-10">THE "HIGHER AUTHORITY"</p>
            <p class="text-xs text-zinc-400 relative z-10">Don't say "I don't have money." Say "My husband/wife has the money and said NO." <br>It shifts the blame to someone else.</p>
        </div>
    </div>
        `;
        };
    }

    if (typeof negotiationUtils.resolveRenderHaggleStage1Html !== 'function') {
        negotiationUtils.resolveRenderHaggleStage1Html = function resolveRenderHaggleStage1Html(haggleState, stats, hasHistory) {
            return `
            <div class="space-y-8 animate-[slide-up-fade_0.4s_ease-out]">
                <!-- Progress Indicator -->
                <div class="flex items-center justify-center gap-2">
                    <div class="w-8 h-1 rounded-full bg-signal-amber shadow-[0_0_8px_rgba(245,158,11,0.6)]"></div>
                    <div class="w-8 h-1 rounded-full bg-void-800 border border-void-700"></div>
                    <div class="w-8 h-1 rounded-full bg-void-800 border border-void-700"></div>
                    <div class="w-8 h-1 rounded-full bg-void-800 border border-void-700"></div>
                    <div class="w-8 h-1 rounded-full bg-void-800 border border-void-700"></div>
                </div>

                <!-- Stage Header -->
                <div class="text-center space-y-2">
                    <p class="text-[10px] text-signal-amber font-mono tracking-widest uppercase">STAGE 1 // INITIAL CONTACT</p>
                    <h2 class="font-sans text-2xl font-black text-white tracking-wide uppercase">TARGET ACQUISITION</h2>
                    <div class="inline-flex items-center gap-2 px-3 py-1 bg-signal-cyan/10 border border-signal-cyan/20 rounded-full mt-2">
                        <span class="w-1.5 h-1.5 bg-signal-cyan rounded-full animate-pulse"></span>
                        <p class="text-[9px] text-signal-cyan font-mono tracking-widest uppercase">AI-POWERED ANALYSIS</p>
                    </div>
                </div>

                <!-- AI Stats Panel (if has history) -->
                ${hasHistory ? `
                <div class="bg-void-900/60 border border-void-700 rounded-xl p-4 backdrop-blur-md">
                    <div class="flex items-center justify-between mb-3 pb-2 border-b border-void-800">
                        <span class="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">PERFORMANCE METRICS</span>
                        <span class="text-[10px] text-signal-cyan font-mono">${stats.totalNegotiations} OPS COMPLETED</span>
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                        <div class="text-center p-2 bg-void-800/50 rounded-lg">
                            <p class="text-lg font-mono font-bold ${stats.successRate >= 60 ? 'text-signal-emerald' : stats.successRate >= 40 ? 'text-signal-amber' : 'text-signal-crimson'}">${stats.successRate.toFixed(0)}%</p>
                            <p class="text-[9px] text-zinc-500 uppercase tracking-wide">Success Rate</p>
                        </div>
                        <div class="text-center p-2 bg-void-800/50 rounded-lg">
                            <p class="text-lg font-mono font-bold text-signal-amber">${stats.avgDiscount.toFixed(0)}%</p>
                            <p class="text-[9px] text-zinc-500 uppercase tracking-wide">Avg Discount</p>
                        </div>
                        <div class="text-center p-2 bg-void-800/50 rounded-lg">
                            <p class="text-lg font-mono font-bold text-signal-emerald">${Math.round(stats.totalSavings)}</p>
                            <p class="text-[9px] text-zinc-500 uppercase tracking-wide">DH Saved</p>
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- Input Card -->
                <div class="bg-void-900/80 border border-signal-amber/30 p-8 rounded-xl relative overflow-hidden group shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                    <!-- Holographic Scanline (Optimized) -->
                    <div class="absolute inset-0 pointer-events-none opacity-[0.05] bg-grid-pattern"></div>
                    <div class="hidden md:block absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-signal-amber/50 to-transparent animate-scan-line"></div>

                    <!-- Price Input -->
                    <div class="text-center relative z-10">
                        <label for="vendor-offer-input" class="text-xs text-zinc-400 font-mono tracking-widest uppercase mb-4 block">INPUT VENDOR OFFER (OFFER 1)</label>
                        <div class="relative max-w-[200px] mx-auto">
                            <input 
                                type="number" 
                                id="vendor-offer-input" 
                                class="w-full text-center text-5xl font-mono font-bold text-signal-amber bg-transparent border-b-2 border-void-700 py-2 focus:outline-none focus:border-signal-amber transition-all placeholder-void-800 backdrop-blur-sm"
                                placeholder="000"
                                value="${haggleState.vendorOffer || ''}"
                                autofocus
                            />
                            <span class="absolute right-0 bottom-4 text-zinc-600 font-mono text-sm pointer-events-none">DH</span>
                        </div>
                    </div>
                </div>
                    
                    <!-- Item Type Selector -->
                    <div>
                        <label class="text-[10px] text-void-500 font-mono uppercase block mb-2">What are you buying?</label>
                        <select 
                            id="item-type-select"
                            class="w-full bg-void-800 border border-void-600 text-white rounded-[2px] py-3 px-4 font-mono text-sm focus:outline-none focus:border-signal-amber/50 transition-all appearance-none cursor-pointer"
                            style="background-image: url('data:image/svg+xml;charset=US-ASCII,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 4 5%22><path fill=%22%23f59e0b%22 d=%22M2 0L0 2h4zm0 5L0 3h4z%22/></svg>'); background-repeat: no-repeat; background-position: right 12px center; background-size: 10px;"
                        >
                            <option value="other" ${haggleState.itemType === 'other' ? 'selected' : ''}>🛠️ General Item</option>
                            <option value="leather" ${haggleState.itemType === 'leather' ? 'selected' : ''}>👜 Leather Goods</option>
                            <option value="ceramics" ${haggleState.itemType === 'ceramics' ? 'selected' : ''}>🏺 Ceramics / Pottery</option>
                            <option value="spices" ${haggleState.itemType === 'spices' ? 'selected' : ''}>🌶️ Spices</option>
                            <option value="rugs" ${haggleState.itemType === 'rugs' ? 'selected' : ''}>🪁 Rugs / Carpets</option>
                            <option value="textiles" ${haggleState.itemType === 'textiles' ? 'selected' : ''}>👕 Textiles / Clothing</option>
                            <option value="jewelry" ${haggleState.itemType === 'jewelry' ? 'selected' : ''}>💍 Jewelry</option>
                            <option value="lamps" ${haggleState.itemType === 'lamps' ? 'selected' : ''}>🏮 Lamps / Lanterns</option>
                            <option value="art" ${haggleState.itemType === 'art' ? 'selected' : ''}>🎨 Art / Paintings</option>
                            <option value="antiques" ${haggleState.itemType === 'antiques' ? 'selected' : ''}>🏺 Antiques</option>
                            <option value="food" ${haggleState.itemType === 'food' ? 'selected' : ''}>🍲 Food / Street Food</option>
                        </select>
                    </div>
                    
                    <!-- Souk Area Selector -->
                    <div>
                        <label class="text-[10px] text-void-500 font-mono uppercase block mb-2">Where are you?</label>
                        <select 
                            id="souk-area-select"
                            class="w-full bg-void-800 border border-void-600 text-white rounded-[2px] py-3 px-4 font-mono text-sm focus:outline-none focus:border-signal-amber/50 transition-all appearance-none cursor-pointer"
                            style="background-image: url('data:image/svg+xml;charset=US-ASCII,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 4 5%22><path fill=%22%23f59e0b%22 d=%22M2 0L0 2h4zm0 5L0 3h4z%22/></svg>'); background-repeat: no-repeat; background-position: right 12px center; background-size: 10px;"
                        >
                            <option value="unknown" ${haggleState.soukArea === 'unknown' ? 'selected' : ''}>❓ Unknown / Other</option>
                            <option value="jemaa" ${haggleState.soukArea === 'jemaa' ? 'selected' : ''}>🐍 Jemaa el-Fnaa Area</option>
                            <option value="medina" ${haggleState.soukArea === 'medina' ? 'selected' : ''}>🕌 Deep Medina Souks</option>
                            <option value="mellah" ${haggleState.soukArea === 'mellah' ? 'selected' : ''}>✡️ Mellah (Jewish Quarter)</option>
                            <option value="gueliz" ${haggleState.soukArea === 'gueliz' ? 'selected' : ''}>🏙️ Gueliz (New Town)</option>
                        </select>
                    </div>
                    
                    <p class="text-[10px] text-void-500 font-mono text-center">
                        🧠 AI analyzes 25+ factors: time, location, item type, your history & more
                    </p>
                </div>

                <!-- Action Button -->
                <button 
                    id="analyze-btn"
                    class="w-full py-4 bg-gradient-to-r from-signal-amber to-amber-500 hover:from-amber-500 hover:to-signal-amber text-black font-heading font-bold text-lg rounded-[2px] transition-all active:scale-95 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                    <span>🕵️</span>
                    <span>ANALYZE WITH AI</span>
                </button>
            </div>
        `;
        };
    }

    if (typeof negotiationUtils.resolveRenderHaggleStage2Html !== 'function') {
        negotiationUtils.resolveRenderHaggleStage2Html = function resolveRenderHaggleStage2Html(haggleState) {
            const rec = haggleState.aiRecommendation || {};
            const strategy = rec.strategy || { name: 'BALANCED', emoji: '⚖️', color: 'amber' };
            const confidence = rec.confidence || 0.5;
            const explanation = rec.explanation || { reasons: [], summary: '' };
            const prices = rec.prices || {};

            const colorMap = {
                crimson: { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400', glow: 'shadow-red-500/20' },
                amber: { bg: 'bg-signal-amber/20', border: 'border-signal-amber/50', text: 'text-signal-amber', glow: 'shadow-amber-500/20' },
                emerald: { bg: 'bg-signal-emerald/20', border: 'border-signal-emerald/50', text: 'text-emerald-400', glow: 'shadow-emerald-500/20' }
            };
            const colors = colorMap[strategy.color] || colorMap.amber;

            return `
            <div class="space-y-5">
                <!-- Progress Indicator -->
                <div class="flex items-center justify-center gap-2">
                    <div class="w-8 h-1 rounded-full bg-signal-amber"></div>
                    <div class="w-8 h-1 rounded-full bg-signal-amber"></div>
                    <div class="w-8 h-1 rounded-full bg-void-700"></div>
                    <div class="w-8 h-1 rounded-full bg-void-700"></div>
                    <div class="w-8 h-1 rounded-full bg-void-700"></div>
                </div>

                <!-- AI Strategy Badge -->
                <div class="text-center">
                    <div class="${colors.bg} ${colors.border} border-2 rounded-[2px] p-4 inline-block shadow-lg ${colors.glow}">
                        <p class="text-[10px] ${colors.text} font-mono uppercase mb-1">AI STRATEGY</p>
                        <div class="flex items-center justify-center gap-2">
                            <span class="text-3xl">${strategy.emoji}</span>
                            <span class="text-2xl font-heading font-bold ${colors.text}">${strategy.name}</span>
                        </div>
                        <div class="mt-2 flex items-center justify-center gap-2">
                            <span class="text-[10px] text-void-500">CONFIDENCE</span>
                            <div class="w-20 h-1.5 bg-void-800 rounded-full overflow-hidden">
                                <div class="h-full ${strategy.color === 'crimson' ? 'bg-red-500' : strategy.color === 'emerald' ? 'bg-signal-emerald' : 'bg-signal-amber'} transition-all" style="width: ${Math.round(confidence * 100)}%"></div>
                            </div>
                            <span class="${colors.text} font-mono font-bold text-sm">${Math.round(confidence * 100)}%</span>
                        </div>
                    </div>
                </div>

                <!-- AI Explanation Panel -->
                ${explanation.reasons && explanation.reasons.length > 0 ? `
                <div class="bg-void-900/60 border border-void-700 rounded-[2px] p-4">
                    <p class="text-[10px] text-signal-cyan font-mono uppercase mb-3">🧠 WHY THIS STRATEGY</p>
                    <ul class="space-y-2">
                        ${explanation.reasons.map(r => `
                            <li class="flex items-start gap-2 text-sm">
                                <span class="text-lg">${r.emoji}</span>
                                <span class="text-zinc-300">${r.text}</span>
                            </li>
                        `).join('')}
                    </ul>
                    <div class="mt-3 pt-3 border-t border-void-700">
                        <p class="text-sm ${colors.text} font-medium italic">"${explanation.summary}"</p>
                    </div>
                </div>
                ` : ''}

                <!-- Price Comparison -->
                <div class="space-y-3">
                    <p class="text-[10px] text-void-500 font-mono uppercase text-center">AI-CALCULATED PRICES</p>
                    
                    <!-- Vendor Price -->
                    <div class="bg-void-900/60 border border-void-700 rounded-[2px] p-3 flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="text-red-400 text-lg">🛑</span>
                            <div>
                                <p class="text-[10px] text-void-500 font-mono uppercase">VENDOR ASKED</p>
                                <p class="text-xl font-mono font-bold text-red-400">${haggleState.vendorOffer} DH</p>
                            </div>
                        </div>
                        <span class="text-[10px] text-red-400/60 font-mono">TOO HIGH</span>
                    </div>
                    
                    <!-- Shock Price (Your Opening) -->
                    <div class="${colors.bg} ${colors.border} border-2 rounded-[2px] p-4">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 ${strategy.color === 'crimson' ? 'bg-red-500' : strategy.color === 'emerald' ? 'bg-signal-emerald' : 'bg-signal-amber'} rounded-[2px] flex items-center justify-center text-black font-bold">
                                    ⚡
                                </div>
                                <div>
                                    <div class="flex items-center gap-2">
                                        <p class="text-[10px] ${colors.text} font-mono uppercase">SHOCK PRICE</p>
                                        <span class="text-[8px] bg-signal-cyan/20 text-signal-cyan px-1.5 py-0.5 rounded-full font-mono">AI</span>
                                    </div>
                                    <p id="shock-price-display" class="text-2xl font-mono font-bold ${colors.text}">${haggleState.shockPrice} DH</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <p class="text-[10px] text-void-500">DISCOUNT</p>
                                <p class="text-lg font-mono font-bold text-emerald-400">-${prices.percentages?.shockDiscount || 70}%</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Fair & Walk Away Preview -->
                    <div class="grid grid-cols-2 gap-3">
                        <div class="bg-void-900/60 border border-void-700 rounded-[2px] p-3 text-center">
                            <div class="flex items-center justify-center gap-1 mb-1">
                                <p class="text-[10px] text-void-500 font-mono uppercase">FAIR PRICE</p>
                                <span class="text-[8px] bg-signal-cyan/20 text-signal-cyan px-1 py-0.5 rounded-full font-mono">AI</span>
                            </div>
                            <p class="text-xl font-mono font-bold text-emerald-400">${haggleState.fairPrice} DH</p>
                            <p class="text-[10px] text-emerald-400/60">-${prices.percentages?.fairDiscount || 55}% off</p>
                        </div>
                        <div class="bg-void-900/60 border border-void-700 rounded-[2px] p-3 text-center">
                            <div class="flex items-center justify-center gap-1 mb-1">
                                <p class="text-[10px] text-void-500 font-mono uppercase">MAX PRICE</p>
                                <span class="text-[8px] bg-signal-cyan/20 text-signal-cyan px-1 py-0.5 rounded-full font-mono">AI</span>
                            </div>
                            <p class="text-xl font-mono font-bold text-zinc-300">${haggleState.walkAwayPrice} DH</p>
                            <p class="text-[10px] text-void-500">-${prices.percentages?.walkAwayDiscount || 40}% off</p>
                        </div>
                    </div>
                </div>

                <!-- Audio Card -->
                <div class="bg-red-500/10 border border-red-500/30 rounded-[2px] p-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-xs text-red-400 font-mono uppercase">SAY THIS NOW:</p>
                            <p class="text-xl font-bold text-red-400 font-mono">"Ghali Bezaf!"</p>
                            <p class="text-xs text-void-500 italic">(Too expensive!)</p>
                        </div>
                        <button 
                            id="play-ghali-btn"
                            class="p-4 bg-red-500 hover:bg-red-400 rounded-[2px] transition-all active:scale-95"
                        >
                            <span class="text-2xl">▶️</span>
                        </button>
                    </div>
                </div>

                <!-- Debug Panel (Collapsible) -->
                <details class="bg-void-900/30 border border-void-800 rounded-[2px]">
                    <summary class="p-3 cursor-pointer text-[10px] text-void-500 font-mono uppercase hover:text-void-400 transition-colors">
                        🐞 AI DEBUG INFO
                    </summary>
                    <div class="p-3 pt-0 border-t border-void-800 text-[10px] font-mono text-void-500 space-y-1">
                        <p>Features extracted: ${rec.metadata?.featureCount || 'N/A'}</p>
                        <p>Analysis time: ${rec.metadata?.analysisTimeMs?.toFixed(2) || 'N/A'}ms</p>
                        <p>Strategy scores: Aggressive ${rec.strategyScores?.aggressive?.toFixed(1) || 0}, Balanced ${rec.strategyScores?.balanced?.toFixed(1) || 0}, Conservative ${rec.strategyScores?.conservative?.toFixed(1) || 0}</p>
                        <p>Item: ${haggleState.itemType || 'other'} | Area: ${haggleState.soukArea || 'unknown'}</p>
                    </div>
                </details>

                <!-- Action Button -->
                <button 
                    id="next-stage-btn"
                    class="w-full py-4 bg-signal-amber hover:bg-signal-amber/80 text-black font-heading font-bold text-lg rounded-[2px] transition-all active:scale-95 shadow-lg shadow-amber-500/20"
                >
                    NEXT STEP ➔
                </button>
            </div>
        `;
        };
    }

    if (typeof negotiationUtils.resolveRenderHaggleStage3Html !== 'function') {
        negotiationUtils.resolveRenderHaggleStage3Html = function resolveRenderHaggleStage3Html() {
            return `
            <div class="space-y-6">
                <!-- Progress Indicator -->
                <div class="flex items-center justify-center gap-2">
                    <div class="w-8 h-1 rounded-full bg-signal-amber"></div>
                    <div class="w-8 h-1 rounded-full bg-signal-amber"></div>
                    <div class="w-8 h-1 rounded-full bg-signal-amber"></div>
                    <div class="w-8 h-1 rounded-full bg-void-700"></div>
                    <div class="w-8 h-1 rounded-full bg-void-700"></div>
                </div>

                <!-- Stage Header -->
                <div class="text-center">
                    <p class="text-[10px] text-purple-400 font-mono tracking-widest mb-1">STAGE 3</p>
                    <h2 class="font-heading text-xl font-bold text-white">THE MANEUVER</h2>
                    <p class="text-xs text-void-500 mt-1">Select the counter based on vendor's reaction</p>
                </div>

                <!-- Tactic Cards -->
                <div class="space-y-3">
                    <!-- Tactic 1: He's smiling/stuck -->
                    <button 
                        class="tactic-card w-full bg-signal-emerald/10 border border-signal-emerald/30 rounded-[2px] p-4 text-left hover:bg-signal-emerald/20 transition-all active:scale-[0.98]"
                        data-tactic="1"
                        data-audio="assets/audio/nqas_shwiya.mp3"
                    >
                        <div class="flex items-center gap-4">
                            <div class="text-3xl">🙂</div>
                            <div class="flex-1">
                                <p class="text-sm font-bold text-emerald-400 mb-1">He's smiling / stuck</p>
                                <p class="text-xs text-zinc-400">He likes you but won't budge yet</p>
                            </div>
                            <div class="text-emerald-400">➔</div>
                        </div>
                        <div class="mt-3 pt-3 border-t border-signal-emerald/20">
                            <p class="text-xs text-emerald-400 font-mono">"Nqas Shwiya" — Lower it a bit</p>
                        </div>
                    </button>

                    <!-- Tactic 2: He thinks I'm rich -->
                    <button 
                        class="tactic-card w-full bg-blue-500/10 border border-blue-500/30 rounded-[2px] p-4 text-left hover:bg-blue-500/20 transition-all active:scale-[0.98]"
                        data-tactic="2"
                        data-audio="assets/audio/machi_tourist.mp3"
                    >
                        <div class="flex items-center gap-4">
                            <div class="text-3xl">💶</div>
                            <div class="flex-1">
                                <p class="text-sm font-bold text-blue-400 mb-1">He thinks I'm rich</p>
                                <p class="text-xs text-zinc-400">He's giving you the "tourist premium"</p>
                            </div>
                            <div class="text-blue-400">➔</div>
                        </div>
                        <div class="mt-3 pt-3 border-t border-blue-500/20">
                            <p class="text-xs text-blue-400 font-mono">"Machi Tourist" — I'm not a tourist</p>
                        </div>
                    </button>

                    <!-- Tactic 3: Currency confusion -->
                    <button 
                        class="tactic-card w-full bg-signal-crimson/10 border border-signal-crimson/30 rounded-[2px] p-4 text-left hover:bg-signal-crimson/20 transition-all active:scale-[0.98]"
                        data-tactic="3"
                        data-audio="assets/audio/machi_euro.mp3"
                    >
                        <div class="flex items-center gap-4">
                            <div class="text-3xl">💱</div>
                            <div class="flex-1">
                                <p class="text-sm font-bold text-rose-400 mb-1">Currency confusion</p>
                                <p class="text-xs text-zinc-400">He's mixing up Dirham and Euro</p>
                            </div>
                            <div class="text-rose-400">➔</div>
                        </div>
                        <div class="mt-3 pt-3 border-t border-signal-crimson/20">
                            <p class="text-xs text-rose-400 font-mono">"Machi Euro" — Not Euro!</p>
                        </div>
                    </button>
                </div>

                <!-- Tip -->
                <div class="bg-void-900/40 border border-void-800 rounded-[2px] p-4">
                    <p class="text-xs text-void-500 font-mono leading-relaxed">
                        <span class="text-purple-400">👆 TAP A CARD</span> to play the audio and advance to the next stage.
                    </p>
                </div>
            </div>
        `;
        };
    }

    if (typeof negotiationUtils.resolveRenderHaggleStage4Html !== 'function') {
        negotiationUtils.resolveRenderHaggleStage4Html = function resolveRenderHaggleStage4Html(haggleState) {
            return `
            <div class="space-y-6">
                <!-- Progress Indicator -->
                <div class="flex items-center justify-center gap-2">
                    <div class="w-8 h-1 rounded-full bg-signal-amber"></div>
                    <div class="w-8 h-1 rounded-full bg-signal-amber"></div>
                    <div class="w-8 h-1 rounded-full bg-signal-amber"></div>
                    <div class="w-8 h-1 rounded-full bg-signal-amber"></div>
                    <div class="w-8 h-1 rounded-full bg-void-700"></div>
                </div>

                <!-- Stage Header -->
                <div class="text-center">
                    <p class="text-[10px] text-emerald-400 font-mono tracking-widest mb-1">STAGE 4</p>
                    <h2 class="font-heading text-xl font-bold text-white">THE CLOSER</h2>
                    <p class="text-xs text-void-500 mt-1">Your final offer - the fair price</p>
                </div>

                <!-- Price Display -->
                <div class="bg-signal-emerald/20 border-2 border-signal-emerald/50 rounded-[2px] p-6 text-center">
                    <p class="text-[10px] text-emerald-400 font-mono uppercase mb-2">YOUR FAIR PRICE TARGET</p>
                    <p id="fair-price-display" class="text-5xl font-mono font-bold text-emerald-400 mb-2">0 DH</p>
                    <p class="text-xs text-zinc-400">This is 45% of original = Fair market value</p>
                </div>

                <!-- Audio Card -->
                <div class="bg-signal-amber/10 border border-signal-amber/30 rounded-[2px] p-4">
                    <div class="flex items-center justify-between mb-3">
                        <div>
                            <p class="text-xs text-signal-amber font-mono uppercase">THE MAGIC PHRASE:</p>
                            <p class="text-xl font-bold text-signal-amber font-mono">"A3tini Akhir Taman"</p>
                            <p class="text-xs text-void-500 italic">(Give me the final/best price)</p>
                        </div>
                        <button 
                            id="play-akhir-btn"
                            class="p-4 bg-signal-amber hover:bg-signal-amber/80 rounded-[2px] transition-all active:scale-95"
                        >
                            <span class="text-2xl">▶️</span>
                        </button>
                    </div>
                </div>

                <!-- Price Summary -->
                <div class="bg-void-900/60 border border-void-700 rounded-[2px] p-4">
                    <p class="text-xs text-void-500 font-mono uppercase mb-3">PRICE BREAKDOWN</p>
                    <div class="space-y-2 text-sm font-mono">
                        <div class="flex justify-between">
                            <span class="text-zinc-400">Vendor asked:</span>
                            <span class="text-red-400 line-through">${haggleState.vendorOffer} DH</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-zinc-400">Your anchor (30%):</span>
                            <span class="text-signal-amber">${haggleState.shockPrice} DH</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-zinc-400">Fair price (45%):</span>
                            <span class="text-emerald-400 font-bold">${haggleState.fairPrice} DH</span>
                        </div>
                        <div class="flex justify-between pt-2 border-t border-void-700">
                            <span class="text-zinc-400">Walk-away max (60%):</span>
                            <span class="text-zinc-300">${haggleState.walkAwayPrice} DH</span>
                        </div>
                    </div>
                </div>

                <!-- Action Button -->
                <button 
                    id="start-walkaway-btn"
                    class="w-full py-4 bg-red-500 hover:bg-red-400 text-white font-heading font-bold text-lg rounded-[2px] transition-all active:scale-95 shadow-lg shadow-red-500/20"
                >
                    🚶 START WALK-AWAY TIMER
                </button>
            </div>
        `;
        };
    }

    if (typeof negotiationUtils.resolveRenderHaggleStage5Html !== 'function') {
        negotiationUtils.resolveRenderHaggleStage5Html = function resolveRenderHaggleStage5Html(haggleState) {
            return `
            <div class="space-y-6">
                <!-- Progress Indicator -->
                <div class="flex items-center justify-center gap-2">
                    <div class="w-8 h-1 rounded-full bg-signal-amber"></div>
                    <div class="w-8 h-1 rounded-full bg-signal-amber"></div>
                    <div class="w-8 h-1 rounded-full bg-signal-amber"></div>
                    <div class="w-8 h-1 rounded-full bg-signal-amber"></div>
                    <div class="w-8 h-1 rounded-full bg-signal-amber"></div>
                </div>

                <!-- Stage Header -->
                <div class="text-center">
                    <p class="text-[10px] text-red-400 font-mono tracking-widest mb-1">STAGE 5</p>
                    <h2 class="font-heading text-xl font-bold text-white">WALK AWAY</h2>
                    <p class="text-xs text-void-500 mt-1">The ultimate power move</p>
                </div>

                <!-- Timer Display -->
                <div class="bg-red-500/20 border-2 border-red-500/50 rounded-[2px] p-8 text-center">
                    <p class="text-[10px] text-red-400 font-mono uppercase mb-4">WALKING AWAY...</p>
                    
                    <!-- Timer Countdown -->
                    <div class="text-7xl font-mono font-bold text-red-400 mb-4" id="walkaway-timer">10</div>
                    
                    <!-- Progress Bar -->
                    <div class="w-full h-2 bg-void-800 rounded-full overflow-hidden">
                        <div id="walkaway-progress" class="h-full bg-red-500 transition-all duration-1000 ease-linear" style="width: 100%;"></div>
                    </div>
                    
                    <p class="text-sm text-zinc-400 mt-4 font-mono">Wait for the call back...</p>
                </div>

                <!-- Instructions -->
                <div class="bg-void-900/60 border border-void-700 rounded-[2px] p-4 space-y-3">
                    <div class="flex items-start gap-3">
                        <span class="text-lg">1️⃣</span>
                        <p class="text-sm text-zinc-300">Start walking slowly towards the exit</p>
                    </div>
                    <div class="flex items-start gap-3">
                        <span class="text-lg">2️⃣</span>
                        <p class="text-sm text-zinc-300">Listen for "OK OK! Come back!"</p>
                    </div>
                    <div class="flex items-start gap-3">
                        <span class="text-lg">3️⃣</span>
                        <p class="text-sm text-zinc-300">If called back, offer <span class="text-emerald-400 font-bold">${haggleState.fairPrice} DH</span></p>
                    </div>
                </div>

                <!-- Result Cards -->
                <div class="grid grid-cols-2 gap-3">
                    <button 
                        id="deal-success-btn"
                        class="bg-signal-emerald/20 border border-signal-emerald/30 rounded-[2px] p-4 text-center hover:bg-signal-emerald/30 transition-all active:scale-95"
                    >
                        <span class="text-2xl mb-2 block">🤝</span>
                        <p class="text-sm font-bold text-emerald-400">DEAL MADE!</p>
                        <p class="text-xs text-void-500">He accepted</p>
                    </button>
                    <button 
                        id="deal-failed-btn"
                        class="bg-void-700/20 border border-void-600 rounded-[2px] p-4 text-center hover:bg-void-700/30 transition-all active:scale-95"
                    >
                        <span class="text-2xl mb-2 block">🚫</span>
                        <p class="text-sm font-bold text-zinc-400">NO DEAL</p>
                        <p class="text-xs text-void-500">Find another shop</p>
                    </button>
                </div>
            </div>
        `;
        };
    }

    if (typeof negotiationUtils.resolvePlayHaggleAudio !== 'function') {
        negotiationUtils.resolvePlayHaggleAudio = function resolvePlayHaggleAudio(audioPath, AudioCtor, consoleObj) {
            try {
                const audio = new AudioCtor(audioPath);
                audio.play().catch(e => consoleObj.warn('[HAGGLE] Audio playback failed:', e));
            } catch (e) {
                consoleObj.warn('[HAGGLE] Audio missing:', audioPath);
            }
        };
    }

    if (typeof negotiationUtils.resolveRecordNegotiationRoundFlow !== 'function') {
        negotiationUtils.resolveRecordNegotiationRoundFlow = function resolveRecordNegotiationRoundFlow(options = {}) {
            const haggleState = options.haggleState || {};
            const vendorPrice = options.vendorPrice;
            const yourOffer = options.yourOffer;
            const result = options.result;
            const persistHaggleStateFn = options.persistHaggleStateFn || (() => { });
            const nowFn = options.nowFn || (() => Date.now());

            const rounds = Array.isArray(haggleState.rounds) ? haggleState.rounds : [];
            if (!Array.isArray(haggleState.rounds)) {
                haggleState.rounds = rounds;
            }

            const round = {
                round: haggleState.currentRound || (rounds.length + 1),
                vendor: vendorPrice,
                you: yourOffer,
                result: result,
                timestamp: nowFn()
            };

            rounds.push(round);
            haggleState.currentRound = (haggleState.currentRound || 1) + 1;
            persistHaggleStateFn(haggleState);
            return round;
        };
    }

    if (typeof negotiationUtils.resolveGetNegotiationResultIcon !== 'function') {
        negotiationUtils.resolveGetNegotiationResultIcon = function resolveGetNegotiationResultIcon(result) {
            const icons = {
                accepted: '✅',
                rejected: '❌',
                countered: '🔄'
            };
            return icons[result] || '•';
        };
    }

    if (typeof negotiationUtils.resolveRenderNegotiationHistoryHtml !== 'function') {
        negotiationUtils.resolveRenderNegotiationHistoryHtml = function resolveRenderNegotiationHistoryHtml(haggleState, getResultIconFn) {
            const rounds = haggleState?.rounds || [];
            if (rounds.length === 0) {
                return '';
            }

            return `
            <div class="negotiation-history animate-fadeIn">
                <h3 class="history-title">
                    <span class="text-signal-cyan">📜</span>
                    NEGOTIATION LOG
                </h3>
                
                <div class="history-timeline">
                    ${rounds.map((round) => `
                        <div class="history-round ${round.result}">
                            <div class="round-badge">ROUND ${round.round}</div>
                            <div class="round-details">
                                <div class="round-prices">
                                    <span class="vendor-price font-mono">
                                        <span class="text-xs text-zinc-500">THEIR:</span> ${round.vendor}
                                    </span>
                                    <span class="your-price font-mono">
                                        <span class="text-xs text-zinc-500">YOURS:</span> ${round.you}
                                    </span>
                                </div>
                                <div class="round-result ${round.result}">
                                    ${getResultIconFn(round.result)} ${round.result.toUpperCase()}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        };
    }

    if (typeof negotiationUtils.resolveMapContextAreaToNegotiationArea !== 'function') {
        negotiationUtils.resolveMapContextAreaToNegotiationArea = function resolveMapContextAreaToNegotiationArea(area, contextEngine) {
            const normalized = contextEngine?.normalizeArea
                ? contextEngine.normalizeArea(area)
                : String(area || 'unknown').toLowerCase();

            if (normalized === 'jemaa' || normalized === 'mellah' || normalized === 'gueliz') return normalized;
            if (normalized === 'souks_main' || normalized === 'souks_interior' || normalized === 'workshops') return 'medina';
            return 'unknown';
        };
    }

    if (typeof negotiationUtils.resolveStartWalkawayTimerFlow !== 'function') {
        negotiationUtils.resolveStartWalkawayTimerFlow = function resolveStartWalkawayTimerFlow(options = {}) {
            const haggleState = options.haggleState || {};
            const documentObj = options.documentObj || windowObj.document;
            const clearIntervalFn = options.clearIntervalFn || windowObj.clearInterval.bind(windowObj);
            const setIntervalFn = options.setIntervalFn || windowObj.setInterval.bind(windowObj);

            let timeLeft = 10;
            const timerEl = documentObj.getElementById('walkaway-timer');
            const progressEl = documentObj.getElementById('walkaway-progress');

            if (haggleState.timerInterval) {
                clearIntervalFn(haggleState.timerInterval);
            }

            haggleState.timerInterval = setIntervalFn(() => {
                timeLeft--;

                if (timerEl) {
                    timerEl.textContent = timeLeft;
                }

                if (progressEl) {
                    progressEl.style.width = `${(timeLeft / 10) * 100}%`;
                }

                if (timeLeft <= 0) {
                    clearIntervalFn(haggleState.timerInterval);
                    if (timerEl) {
                        timerEl.textContent = '🛑';
                        timerEl.classList.add('animate-pulse');
                    }
                }
            }, 1000);

            return haggleState.timerInterval;
        };
    }

    if (typeof negotiationUtils.resolveAttachHaggleListenersFlow !== 'function') {
        negotiationUtils.resolveAttachHaggleListenersFlow = function resolveAttachHaggleListenersFlow(options = {}) {
            const documentObj = options.documentObj || windowObj.document;
            const haggleState = options.haggleState || {};
            const contextEngine = options.contextEngine || windowObj.contextEngine;
            const persistHaggleStateFn = options.persistHaggleStateFn || (() => { });
            const mapContextAreaToNegotiationAreaFn = options.mapContextAreaToNegotiationAreaFn || (() => 'unknown');
            const showToastFn = options.showToastFn;
            const alertFn = options.alertFn || (() => { });
            const NegotiationContextCtor = options.NegotiationContextCtor;
            const SmartNegotiatorCtor = options.SmartNegotiatorCtor;
            const HapticsObj = options.HapticsObj || windowObj.Haptics || { trigger: () => { } };
            const renderHaggleStageFn = options.renderHaggleStageFn || (() => { });
            const playHaggleAudioFn = options.playHaggleAudioFn || (() => { });
            const recordNegotiationRoundFn = options.recordNegotiationRoundFn || (() => { });
            const setTimeoutFn = options.setTimeoutFn || windowObj.setTimeout.bind(windowObj);
            const startWalkawayTimerFn = options.startWalkawayTimerFn || (() => { });
            const clearIntervalFn = options.clearIntervalFn || windowObj.clearInterval.bind(windowObj);
            const negoLearner = options.negoLearner;
            const sessionIntel = options.sessionIntel || windowObj.sessionIntel;
            const consoleObj = options.consoleObj || windowObj.console || console;
            const parseIntFn = options.parseIntFn || parseInt;

            const soukAreaSelectForPrefill = documentObj.getElementById('souk-area-select');
            if (soukAreaSelectForPrefill && (!haggleState.soukArea || haggleState.soukArea === 'unknown')) {
                const contextualArea = mapContextAreaToNegotiationAreaFn(contextEngine?.context?.currentArea);
                if (contextualArea !== 'unknown') {
                    soukAreaSelectForPrefill.value = contextualArea;
                    haggleState.soukArea = contextualArea;
                    persistHaggleStateFn(haggleState);
                }
            }

            // Stage 1: Analyze button - AI POWERED
            const analyzeBtn = documentObj.getElementById('analyze-btn');
            if (analyzeBtn) {
                analyzeBtn.addEventListener('click', () => {
                    const input = documentObj.getElementById('vendor-offer-input');
                    const itemTypeSelect = documentObj.getElementById('item-type-select');
                    const soukAreaSelect = documentObj.getElementById('souk-area-select');

                    const value = parseIntFn(input?.value) || 0;
                    const itemType = itemTypeSelect?.value || 'other';
                    const soukArea = soukAreaSelect?.value ||
                        mapContextAreaToNegotiationAreaFn(contextEngine?.context?.currentArea);
                    const negotiationContext = contextEngine?.getContext?.('negotiation');

                    if (value <= 0) {
                        alertFn('⚠️ Please enter a valid price!');
                        return;
                    }

                    // Reset history if starting new negotiation
                    if (haggleState.stage === 1) {
                        haggleState.rounds = [];
                        haggleState.currentRound = 1;
                    }

                    // Store context
                    haggleState.vendorOffer = value;
                    haggleState.itemType = itemType;
                    haggleState.soukArea = soukArea;
                    haggleState.contextIntel = negotiationContext || null;

                    if (sessionIntel?.logActivity) {
                        sessionIntel.logActivity('negotiation_start', {
                            itemType,
                            askingPrice: value,
                            area: soukArea
                        });
                    }

                    if (negotiationContext?.recommendedTactics?.length > 0 && typeof showToastFn === 'function') {
                        showToastFn(`Area intel: ${negotiationContext.recommendedTactics[0].label}`, 'info', 2200);
                    }

                    try {
                        consoleObj.log('[HAGGLE-AI] Starting analysis...');

                        const context = new NegotiationContextCtor(value, {
                            itemType: itemType,
                            soukArea: soukArea
                        });

                        const negotiator = new SmartNegotiatorCtor(context);
                        const recommendation = negotiator.analyze();

                        haggleState.aiRecommendation = recommendation;
                        haggleState.aiContext = context.getSummary();
                        haggleState.shockPrice = recommendation.prices.shock;
                        haggleState.fairPrice = recommendation.prices.fair;
                        haggleState.walkAwayPrice = recommendation.prices.walkAway;

                        consoleObj.log('[HAGGLE-AI] Analysis complete:', {
                            strategy: recommendation.strategy.name,
                            confidence: Math.round(recommendation.confidence * 100) + '%',
                            prices: recommendation.prices
                        });

                        HapticsObj?.trigger?.('success');

                    } catch (e) {
                        consoleObj.error('[HAGGLE-AI] Analysis failed, using fallback:', e);
                        haggleState.shockPrice = Math.floor(value * 0.3);
                        haggleState.fairPrice = Math.floor(value * 0.45);
                        haggleState.walkAwayPrice = Math.floor(value * 0.6);
                        haggleState.aiRecommendation = null;
                    }

                    persistHaggleStateFn(haggleState);
                    haggleState.stage = 2;
                    persistHaggleStateFn(haggleState);
                    renderHaggleStageFn();
                });
            }

            // Stage 2: Play Ghali audio + Next button
            const playGhaliBtn = documentObj.getElementById('play-ghali-btn');
            if (playGhaliBtn) {
                playGhaliBtn.addEventListener('click', () => {
                    playHaggleAudioFn('assets/audio/ghali_bezaf.mp3');
                });
            }

            const nextStageBtn = documentObj.getElementById('next-stage-btn');
            if (nextStageBtn) {
                nextStageBtn.addEventListener('click', () => {
                    recordNegotiationRoundFn(haggleState.vendorOffer, haggleState.shockPrice, 'rejected');

                    haggleState.stage = 3;
                    persistHaggleStateFn(haggleState);
                    renderHaggleStageFn();
                });
            }

            // Stage 3: Tactic cards
            const tacticCards = documentObj.querySelectorAll('.tactic-card');
            tacticCards.forEach(card => {
                card.addEventListener('click', () => {
                    const audioPath = card.getAttribute('data-audio');
                    if (audioPath) {
                        playHaggleAudioFn(audioPath);
                    }
                    setTimeoutFn(() => {
                        haggleState.stage = 4;
                        persistHaggleStateFn(haggleState);
                        renderHaggleStageFn();
                    }, 500);
                });
            });

            // Stage 4: Play Akhir audio + Walk away button
            const playAkhirBtn = documentObj.getElementById('play-akhir-btn');
            if (playAkhirBtn) {
                playAkhirBtn.addEventListener('click', () => {
                    playHaggleAudioFn('assets/audio/akhir_taman.mp3');
                });
            }

            const startWalkawayBtn = documentObj.getElementById('start-walkaway-btn');
            if (startWalkawayBtn) {
                startWalkawayBtn.addEventListener('click', () => {
                    haggleState.stage = 5;
                    persistHaggleStateFn(haggleState);
                    renderHaggleStageFn();
                    startWalkawayTimerFn();
                });
            }

            // Stage 5: Result buttons - WITH AI LEARNING
            const dealSuccessBtn = documentObj.getElementById('deal-success-btn');
            if (dealSuccessBtn) {
                dealSuccessBtn.addEventListener('click', () => {
                    clearIntervalFn(haggleState.timerInterval);
                    HapticsObj?.trigger?.('success');

                    recordNegotiationRoundFn(haggleState.vendorOffer, haggleState.fairPrice, 'accepted');

                    try {
                        const rec = haggleState.aiRecommendation;
                        negoLearner.recordNegotiation({
                            vendorOffer: haggleState.vendorOffer,
                            finalPrice: haggleState.fairPrice,
                            success: true,
                            strategyUsed: rec?.strategy?.name || 'BALANCED',
                            recommendedPrices: rec?.prices || null,
                            features: haggleState.aiContext || null,
                            itemType: haggleState.itemType || 'other',
                            soukArea: haggleState.soukArea || 'unknown'
                        });
                        consoleObj.log('[HAGGLE-AI] Recorded success:', negoLearner.getStats());
                    } catch (e) {
                        consoleObj.warn('[HAGGLE-AI] Failed to record:', e);
                    }

                    const savings = haggleState.vendorOffer - haggleState.fairPrice;
                    const discountPercent = Math.round((savings / haggleState.vendorOffer) * 100);
                    const strategyUsed = haggleState.aiRecommendation?.strategy?.name || 'BALANCED';

                    if (contextEngine?.recordNegotiation) {
                        contextEngine.recordNegotiation({
                            itemType: haggleState.itemType || 'other',
                            area: haggleState.soukArea || 'unknown',
                            askingPrice: haggleState.vendorOffer,
                            finalPrice: haggleState.fairPrice,
                            success: true,
                            saved: Math.max(0, savings),
                            strategy: strategyUsed
                        });
                    }

                    if (sessionIntel?.logActivity) {
                        sessionIntel.logActivity('negotiation_complete', {
                            itemType: haggleState.itemType || 'other',
                            area: haggleState.soukArea || 'unknown',
                            askingPrice: haggleState.vendorOffer,
                            finalPrice: haggleState.fairPrice,
                            success: true,
                            saved: Math.max(0, savings),
                            strategy: strategyUsed
                        });
                    }

                    alertFn(`🎉 VICTORY!\n\nYou saved ${savings} DH (${discountPercent}% off)!\n\nOriginal: ${haggleState.vendorOffer} DH\nYou paid: ~${haggleState.fairPrice} DH\n\n🧠 AI Learning: Outcome recorded!`);

                    haggleState.stage = 1;
                    persistHaggleStateFn(haggleState);
                    renderHaggleStageFn();
                });
            }

            const dealFailedBtn = documentObj.getElementById('deal-failed-btn');
            if (dealFailedBtn) {
                dealFailedBtn.addEventListener('click', () => {
                    clearIntervalFn(haggleState.timerInterval);
                    HapticsObj?.trigger?.('error');
                    playHaggleAudioFn('assets/audio/deal_fail.mp3');

                    recordNegotiationRoundFn(haggleState.vendorOffer, haggleState.fairPrice, 'rejected');

                    try {
                        const rec = haggleState.aiRecommendation;
                        negoLearner.recordNegotiation({
                            vendorOffer: haggleState.vendorOffer,
                            finalPrice: haggleState.walkAwayPrice,
                            success: false,
                            strategyUsed: rec?.strategy?.name || 'BALANCED',
                            recommendedPrices: rec?.prices || null,
                            features: haggleState.aiContext || null,
                            itemType: haggleState.itemType || 'other',
                            soukArea: haggleState.soukArea || 'unknown'
                        });
                        consoleObj.log('[HAGGLE-AI] Recorded failure:', negoLearner.getStats());
                    } catch (e) {
                        consoleObj.warn('[HAGGLE-AI] Failed to record:', e);
                    }

                    const strategyUsed = haggleState.aiRecommendation?.strategy?.name || 'BALANCED';
                    if (contextEngine?.recordNegotiation) {
                        contextEngine.recordNegotiation({
                            itemType: haggleState.itemType || 'other',
                            area: haggleState.soukArea || 'unknown',
                            askingPrice: haggleState.vendorOffer,
                            finalPrice: haggleState.walkAwayPrice,
                            success: false,
                            saved: 0,
                            strategy: strategyUsed
                        });
                    }

                    if (sessionIntel?.logActivity) {
                        sessionIntel.logActivity('negotiation_complete', {
                            itemType: haggleState.itemType || 'other',
                            area: haggleState.soukArea || 'unknown',
                            askingPrice: haggleState.vendorOffer,
                            finalPrice: haggleState.walkAwayPrice,
                            success: false,
                            saved: 0,
                            strategy: strategyUsed
                        });
                    }

                    alertFn('No worries!\n\nMove to the next shop. There are always more sellers.\n\nRemember: Walking away is POWER.\n\nAI Learning: Outcome recorded for future improvements!');
                    haggleState.stage = 1;
                    persistHaggleStateFn(haggleState);
                    renderHaggleStageFn();
                });
            }

            return true;
        };
    }

    if (typeof negotiationUtils.resolveOpenFlashCardFlow !== 'function') {
        negotiationUtils.resolveOpenFlashCardFlow = function resolveOpenFlashCardFlow(
            darija,
            subtext,
            colorClass,
            documentObj,
            navigatorObj
        ) {
            // Clean up existing overlays
            const existing = documentObj.getElementById('flash-card-modal');
            if (existing) existing.remove();

            // Map color names to Tailwind text classes
            const colorMap = {
                red: 'text-signal-crimson',
                emerald: 'text-signal-emerald',
                amber: 'text-signal-amber',
                blue: 'text-signal-cyan',
                purple: 'text-purple-400',
                zinc: 'text-zinc-400'
            };
            const textColor = colorMap[colorClass] || 'text-white';

            // Create Modal DOM
            const modal = documentObj.createElement('div');
            modal.id = 'flash-card-modal';
            modal.className = 'fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-6 cursor-pointer animate-fadeIn touch-none';
            modal.onclick = () => modal.remove();

            modal.innerHTML = `
            <div class="text-center space-y-8 transform transition-all duration-300 scale-100">
                <div class="mb-8 opacity-50 ${textColor}">
                    <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"/></svg>
                </div>
                <h1 class="font-sans text-6xl md:text-8xl font-black ${textColor} uppercase tracking-tighter leading-tight break-words" style="text-shadow: 0 0 40px currentColor;">
                    ${darija}
                </h1>
                <p class="font-mono text-xl text-void-500 tracking-[0.3em] uppercase border-t border-void-800 pt-6 mt-6 inline-block">
                    ${subtext}
                </p>
                <div class="absolute bottom-10 left-0 right-0 text-center animate-pulse">
                    <span class="text-[10px] font-mono text-void-600 bg-void-900/50 px-3 py-1 rounded-full border border-void-800">TAP SCREEN TO CLOSE</span>
                </div>
            </div>
        `;

            documentObj.body.appendChild(modal);
            if (navigatorObj.vibrate) navigatorObj.vibrate([50, 50, 50]);
            return true;
        };
    }

    if (typeof negotiationUtils.resolvePlayNegoAudio !== 'function') {
        negotiationUtils.resolvePlayNegoAudio = function resolvePlayNegoAudio(filename, AudioCtor, consoleObj) {
            try {
                const audio = new AudioCtor(`assets/audio/${filename}`);
                audio.play().catch(e => consoleObj.warn('[NEGO] Audio playback failed:', e));
                return true;
            } catch (e) {
                consoleObj.warn('[NEGO] Audio missing:', filename);
                return false;
            }
        };
    }

    if (typeof negotiationUtils.resolveSmartNegotiatorAnalyze !== 'function') {
        negotiationUtils.resolveSmartNegotiatorAnalyze = function resolveSmartNegotiatorAnalyze(
            negotiator,
            performanceObj,
            DateCtor,
            consoleObj
        ) {
            const startTime = performanceObj.now();

            const strategyScores = negotiator._scoreStrategies();
            const selectedStrategy = negotiator._selectStrategy(strategyScores);
            const prices = negotiator._calculatePrices(selectedStrategy);
            const confidence = negotiator._calculateConfidence(selectedStrategy, strategyScores);
            const explanation = negotiator._generateExplanation(selectedStrategy, confidence);

            const recommendation = {
                strategy: selectedStrategy,
                prices,
                confidence,
                explanation,
                strategyScores,
                metadata: {
                    analysisTimeMs: performanceObj.now() - startTime,
                    vendorOffer: negotiator.vendorOffer,
                    featureCount: negotiator.features._featureCount,
                    timestamp: DateCtor.now()
                }
            };

            consoleObj.log(`[NEGO-AI] Analysis complete in ${recommendation.metadata.analysisTimeMs.toFixed(2)}ms`);
            consoleObj.log(`[NEGO-AI] Selected strategy: ${selectedStrategy.name} (${(confidence * 100).toFixed(0)}% confidence)`);

            return recommendation;
        };
    }

    if (typeof negotiationUtils.resolveSmartNegotiatorScoreStrategies !== 'function') {
        negotiationUtils.resolveSmartNegotiatorScoreStrategies = function resolveSmartNegotiatorScoreStrategies(negotiator) {
            const f = negotiator.features;
            const scores = {
                aggressive: 0,
                balanced: 5,
                conservative: 0
            };

            if (f.isClosingTime) {
                scores.aggressive += 3.5;
                scores.balanced += 1;
            } else if (f.timePressureScore > 0.5) {
                scores.aggressive += 2;
                scores.balanced += 0.5;
            }

            if (f.isGoldenHour) {
                scores.aggressive += 1;
            }

            if (f.isPeakHour) {
                scores.conservative += 1.5;
            }

            if (f.isOffPeakHour) {
                scores.aggressive += 1;
            }

            if (f.competitionLevel > 0.7) {
                scores.aggressive += 2;
            } else if (f.competitionLevel < 0.4) {
                scores.conservative += 1.5;
            }

            if (f.touristDensity > 0.8) {
                scores.balanced += 1;
                scores.aggressive += 0.5;
            }

            if (f.isTouristItem) {
                scores.aggressive += 1.5;
            }

            if (f.itemMarkup > 3.5) {
                scores.aggressive += 1.5;
            } else if (f.itemMarkup < 2) {
                scores.conservative += 2;
            }

            if (f.itemVolatility > 0.4) {
                scores.conservative += 2;
            }

            if (f.skillLevel === 'expert') {
                scores.aggressive += 2;
            } else if (f.skillLevel === 'beginner') {
                scores.conservative += 2;
                scores.balanced += 1;
            }

            if (f.successRate > 0.7) {
                scores.aggressive += 1.5;
            } else if (f.successRate < 0.4 && f.totalNegotiations > 3) {
                scores.conservative += 2;
            }

            if (f.isSuspiciouslyRound) {
                scores.aggressive += 1;
            }

            if (f.vendorEagernessScore > 0.6) {
                scores.aggressive += 1.5;
            }

            if (f.isLowSeason) {
                scores.aggressive += 2;
            }

            if (f.isHighSeason) {
                scores.balanced += 1;
                scores.conservative += 0.5;
            }

            Object.keys(scores).forEach((key) => {
                scores[key] = Math.max(0, Math.min(10, scores[key]));
            });

            return scores;
        };
    }

    if (typeof negotiationUtils.resolveSmartNegotiatorSelectStrategy !== 'function') {
        negotiationUtils.resolveSmartNegotiatorSelectStrategy = function resolveSmartNegotiatorSelectStrategy(negotiator, scores) {
            let maxScore = -1;
            let selectedKey = 'balanced';

            Object.entries(scores).forEach(([key, score]) => {
                if (score > maxScore) {
                    maxScore = score;
                    selectedKey = key;
                }
            });

            return {
                ...negotiator.strategies[selectedKey],
                key: selectedKey,
                score: maxScore
            };
        };
    }

    if (typeof negotiationUtils.resolveSmartNegotiatorCalculatePrices !== 'function') {
        negotiationUtils.resolveSmartNegotiatorCalculatePrices = function resolveSmartNegotiatorCalculatePrices(
            negotiator,
            strategy
        ) {
            const f = negotiator.features;
            const offer = negotiator.vendorOffer;

            let shockMultiplier = strategy.baseShockDiscount;
            let fairMultiplier = strategy.baseFairDiscount;
            let walkAwayMultiplier = strategy.baseWalkAwayDiscount;

            if (f.isClosingTime) {
                const timeBonus = 0.05 + (0.10 * (1 - f.minutesUntilClose / 60));
                shockMultiplier -= timeBonus * 0.5;
                fairMultiplier -= timeBonus * 0.3;
            }

            if (f.skillLevel === 'expert' && f.successRate > 0.7) {
                const expBonus = 0.03 + (f.successRate - 0.7) * 0.1;
                shockMultiplier -= expBonus * 0.5;
                fairMultiplier -= expBonus * 0.3;
            }

            if (f.itemVolatility > 0.4) {
                shockMultiplier += 0.10;
                fairMultiplier += 0.08;
                walkAwayMultiplier += 0.05;
            } else if (f.isTouristItem && f.itemMarkup > 3) {
                shockMultiplier -= 0.05;
                fairMultiplier -= 0.05;
            }

            if (f.vendorEagernessScore > 0.6) {
                const eagerBonus = (f.vendorEagernessScore - 0.6) * 0.15;
                shockMultiplier -= eagerBonus * 0.5;
                fairMultiplier -= eagerBonus * 0.3;
            }

            if (f.isLowSeason) {
                shockMultiplier -= 0.03;
                fairMultiplier -= 0.03;
            }

            if (f.competitionLevel > 0.7) {
                shockMultiplier -= 0.03;
                fairMultiplier -= 0.02;
            }

            shockMultiplier = Math.max(0.15, Math.min(0.50, shockMultiplier));
            fairMultiplier = Math.max(0.30, Math.min(0.65, fairMultiplier));
            walkAwayMultiplier = Math.max(0.45, Math.min(0.75, walkAwayMultiplier));

            fairMultiplier = Math.max(fairMultiplier, shockMultiplier + 0.05);
            walkAwayMultiplier = Math.max(walkAwayMultiplier, fairMultiplier + 0.05);

            const roundToNearest5 = (val) => Math.round(val / 5) * 5;

            return {
                shock: roundToNearest5(offer * shockMultiplier),
                fair: roundToNearest5(offer * fairMultiplier),
                walkAway: roundToNearest5(offer * walkAwayMultiplier),
                multipliers: {
                    shock: shockMultiplier,
                    fair: fairMultiplier,
                    walkAway: walkAwayMultiplier
                },
                savings: {
                    atShock: offer - roundToNearest5(offer * shockMultiplier),
                    atFair: offer - roundToNearest5(offer * fairMultiplier),
                    atWalkAway: offer - roundToNearest5(offer * walkAwayMultiplier)
                },
                percentages: {
                    shockDiscount: Math.round((1 - shockMultiplier) * 100),
                    fairDiscount: Math.round((1 - fairMultiplier) * 100),
                    walkAwayDiscount: Math.round((1 - walkAwayMultiplier) * 100)
                }
            };
        };
    }

    if (typeof negotiationUtils.resolveSmartNegotiatorCalculateConfidence !== 'function') {
        negotiationUtils.resolveSmartNegotiatorCalculateConfidence = function resolveSmartNegotiatorCalculateConfidence(
            negotiator,
            strategy,
            scores
        ) {
            const f = negotiator.features;
            let confidence = 0.5;

            if (f.hasHistory && f.totalNegotiations >= 5) {
                confidence += 0.15;
            } else if (f.hasHistory) {
                confidence += 0.08;
            }

            if (f.isClosingTime) {
                confidence += 0.15;
            }

            if (f.timePressureScore > 0.6) {
                confidence += 0.10;
            }

            if (f.skillLevel === 'expert') {
                confidence += 0.10;
            } else if (f.skillLevel === 'intermediate') {
                confidence += 0.05;
            }

            const maxScore = Math.max(scores.aggressive, scores.balanced, scores.conservative);
            const scoreDiff = maxScore - Math.min(scores.aggressive, scores.balanced, scores.conservative);

            if (scoreDiff > 4) {
                confidence += 0.10;
            } else if (scoreDiff < 2) {
                confidence -= 0.10;
            }

            if (f.isTouristItem) {
                confidence += 0.05;
            }

            if (f.itemVolatility > 0.4) {
                confidence -= 0.10;
            }

            return Math.max(0.30, Math.min(0.95, confidence));
        };
    }

    if (typeof negotiationUtils.resolveSmartNegotiatorGenerateExplanation !== 'function') {
        negotiationUtils.resolveSmartNegotiatorGenerateExplanation = function resolveSmartNegotiatorGenerateExplanation(
            negotiator,
            strategy,
            confidence
        ) {
            const f = negotiator.features;
            const reasons = [];

            if (f.isClosingTime) {
                reasons.push({
                    emoji: '⏰',
                    text: 'Closing time soon — vendors want to sell',
                    weight: 'high'
                });
            } else if (f.isGoldenHour) {
                reasons.push({
                    emoji: '🌅',
                    text: 'Sunset approaching — good negotiation window',
                    weight: 'medium'
                });
            } else if (f.isPeakHour) {
                reasons.push({
                    emoji: '👥',
                    text: 'Peak tourist hours — vendors less flexible',
                    weight: 'medium'
                });
            }

            if (f.isTouristItem && f.itemMarkup > 3) {
                reasons.push({
                    emoji: '🏷️',
                    text: 'Tourist item — expect 50-70% markup',
                    weight: 'high'
                });
            }

            if (f.itemVolatility > 0.4) {
                reasons.push({
                    emoji: '💎',
                    text: 'Luxury/unique item — less predictable pricing',
                    weight: 'medium'
                });
            }

            if (f.skillLevel === 'expert') {
                reasons.push({
                    emoji: '🧠',
                    text: "You're experienced — be confident!",
                    weight: 'high'
                });
            } else if (f.skillLevel === 'beginner') {
                reasons.push({
                    emoji: '🐣',
                    text: 'Building experience — stay flexible',
                    weight: 'medium'
                });
            }

            if (f.competitionLevel > 0.7) {
                reasons.push({
                    emoji: '🏪',
                    text: 'Many vendors nearby — you have options',
                    weight: 'high'
                });
            }

            if (f.touristDensity > 0.8) {
                reasons.push({
                    emoji: '📸',
                    text: 'High tourist area — prices heavily inflated',
                    weight: 'medium'
                });
            }

            if (f.isSuspiciouslyRound) {
                reasons.push({
                    emoji: '🎯',
                    text: 'Round number price — room to negotiate',
                    weight: 'medium'
                });
            }

            if (f.isLowSeason) {
                reasons.push({
                    emoji: '📉',
                    text: 'Low tourist season — vendors more flexible',
                    weight: 'high'
                });
            } else if (f.isHighSeason) {
                reasons.push({
                    emoji: '📈',
                    text: 'Peak tourist season — expect resistance',
                    weight: 'medium'
                });
            }

            const weightOrder = { high: 3, medium: 2, low: 1 };
            const sortedReasons = reasons
                .sort((a, b) => weightOrder[b.weight] - weightOrder[a.weight])
                .slice(0, 5);

            const summaryPhrases = {
                aggressive: {
                    high: 'Go hard! Time and conditions favor you.',
                    medium: 'Push for the deal — odds are in your favor.',
                    low: 'Be assertive but ready to adapt.'
                },
                balanced: {
                    high: 'Solid position. Play it smart.',
                    medium: 'Standard approach — stick to the plan.',
                    low: 'Stay flexible and read the vendor.'
                },
                conservative: {
                    high: 'Play it safe — this is a tricky situation.',
                    medium: 'Focus on closing the deal over maximum savings.',
                    low: 'Proceed carefully with this item.'
                }
            };

            const confLevel = confidence > 0.75 ? 'high' : (confidence > 0.55 ? 'medium' : 'low');
            const summary = summaryPhrases[strategy.key]?.[confLevel]
                || "Analyze the vendor's response carefully.";

            return {
                reasons: sortedReasons,
                summary,
                strategyRationale: strategy.description
            };
        };
    }

    if (typeof negotiationUtils.resolveNegotiationLearnerLoadData !== 'function') {
        negotiationUtils.resolveNegotiationLearnerLoadData = function resolveNegotiationLearnerLoadData(
            learner,
            localStorageObj,
            JSONObj,
            consoleObj
        ) {
            try {
                const stored = localStorageObj.getItem(learner.STORAGE_KEY);
                if (!stored) {
                    return learner._getDefaultData();
                }
                return JSONObj.parse(stored);
            } catch (e) {
                consoleObj.warn('[NEGO-LEARNER] Failed to load data:', e);
                return learner._getDefaultData();
            }
        };
    }

    if (typeof negotiationUtils.resolveNegotiationLearnerGetDefaultData !== 'function') {
        negotiationUtils.resolveNegotiationLearnerGetDefaultData = function resolveNegotiationLearnerGetDefaultData(DateCtor) {
            return {
                totalNegotiations: 0,
                successfulDeals: 0,
                failedDeals: 0,
                totalDiscountAchieved: 0,
                totalSavings: 0,
                history: [],
                lastResult: null,
                strategyPerformance: {
                    aggressive: { used: 0, success: 0 },
                    balanced: { used: 0, success: 0 },
                    conservative: { used: 0, success: 0 }
                },
                createdAt: DateCtor.now(),
                updatedAt: DateCtor.now()
            };
        };
    }

    if (typeof negotiationUtils.resolveNegotiationLearnerSaveData !== 'function') {
        negotiationUtils.resolveNegotiationLearnerSaveData = function resolveNegotiationLearnerSaveData(
            learner,
            localStorageObj,
            JSONObj,
            DateCtor,
            consoleObj
        ) {
            try {
                learner.data.updatedAt = DateCtor.now();
                localStorageObj.setItem(learner.STORAGE_KEY, JSONObj.stringify(learner.data));
                consoleObj.log('[NEGO-LEARNER] Data saved successfully');
                return true;
            } catch (e) {
                consoleObj.error('[NEGO-LEARNER] Failed to save data:', e);
                return false;
            }
        };
    }

    if (typeof negotiationUtils.resolveNegotiationLearnerRecordNegotiation !== 'function') {
        negotiationUtils.resolveNegotiationLearnerRecordNegotiation = function resolveNegotiationLearnerRecordNegotiation(
            learner,
            params,
            DateCtor,
            consoleObj
        ) {
            const {
                vendorOffer,
                recommendation,
                finalPrice,
                result,
                itemType = 'other',
                soukArea = 'unknown'
            } = params;

            const entry = {
                id: `nego_${DateCtor.now()}`,
                timestamp: DateCtor.now(),
                vendorOffer,
                finalPrice: finalPrice || recommendation?.prices?.fair || 0,
                result,
                itemType,
                soukArea,
                strategy: recommendation?.strategy?.key || 'balanced',
                recommendedPrices: recommendation?.prices || null,
                confidence: recommendation?.confidence || 0.5,
                discountAchieved: vendorOffer > 0
                    ? 1 - (finalPrice / vendorOffer)
                    : 0,
                savings: vendorOffer - (finalPrice || 0)
            };

            learner.data.totalNegotiations++;

            if (result === 'success') {
                learner.data.successfulDeals++;
                learner.data.totalDiscountAchieved += entry.discountAchieved;
                learner.data.totalSavings += entry.savings;
                learner.data.strategyPerformance[entry.strategy].success++;
            } else {
                learner.data.failedDeals++;
            }

            learner.data.strategyPerformance[entry.strategy].used++;
            learner.data.lastResult = result;

            learner.data.history.unshift(entry);
            if (learner.data.history.length > learner.MAX_HISTORY) {
                learner.data.history = learner.data.history.slice(0, learner.MAX_HISTORY);
            }

            learner._saveData();

            consoleObj.log(`[NEGO-LEARNER] Recorded: ${result} (${entry.strategy})`);
            consoleObj.log(
                `[NEGO-LEARNER] Total: ${learner.data.totalNegotiations}, Success rate: ${learner.getSuccessRate().toFixed(1)}%`
            );

            return entry;
        };
    }

    if (typeof negotiationUtils.resolveNegotiationLearnerGetSuccessRate !== 'function') {
        negotiationUtils.resolveNegotiationLearnerGetSuccessRate = function resolveNegotiationLearnerGetSuccessRate(learner) {
            if (learner.data.totalNegotiations === 0) return 50;
            return (learner.data.successfulDeals / learner.data.totalNegotiations) * 100;
        };
    }

    if (typeof negotiationUtils.resolveNegotiationLearnerGetAverageDiscount !== 'function') {
        negotiationUtils.resolveNegotiationLearnerGetAverageDiscount = function resolveNegotiationLearnerGetAverageDiscount(learner) {
            if (learner.data.successfulDeals === 0) return 45;
            return (learner.data.totalDiscountAchieved / learner.data.successfulDeals) * 100;
        };
    }

    if (typeof negotiationUtils.resolveNegotiationLearnerGetTotalSavings !== 'function') {
        negotiationUtils.resolveNegotiationLearnerGetTotalSavings = function resolveNegotiationLearnerGetTotalSavings(learner) {
            return learner.data.totalSavings;
        };
    }

    if (typeof negotiationUtils.resolveNegotiationLearnerGetStrategyPerformance !== 'function') {
        negotiationUtils.resolveNegotiationLearnerGetStrategyPerformance = function resolveNegotiationLearnerGetStrategyPerformance(
            learner
        ) {
            const perf = learner.data.strategyPerformance;
            return Object.entries(perf).reduce((acc, [key, val]) => {
                acc[key] = {
                    ...val,
                    successRate: val.used > 0 ? (val.success / val.used) * 100 : 0
                };
                return acc;
            }, {});
        };
    }

    if (typeof negotiationUtils.resolveNegotiationLearnerGetRecentHistory !== 'function') {
        negotiationUtils.resolveNegotiationLearnerGetRecentHistory = function resolveNegotiationLearnerGetRecentHistory(
            learner,
            limit
        ) {
            return learner.data.history.slice(0, limit);
        };
    }

    if (typeof negotiationUtils.resolveNegotiationLearnerGetStats !== 'function') {
        negotiationUtils.resolveNegotiationLearnerGetStats = function resolveNegotiationLearnerGetStats(learner) {
            return {
                totalNegotiations: learner.data.totalNegotiations,
                successfulDeals: learner.data.successfulDeals,
                failedDeals: learner.data.failedDeals,
                successRate: learner.getSuccessRate(),
                avgDiscount: learner.getAverageDiscount(),
                totalSavings: learner.getTotalSavings(),
                strategyPerformance: learner.getStrategyPerformance(),
                lastResult: learner.data.lastResult
            };
        };
    }

    if (typeof negotiationUtils.resolveNegotiationLearnerReset !== 'function') {
        negotiationUtils.resolveNegotiationLearnerReset = function resolveNegotiationLearnerReset(
            learner,
            confirmFn,
            consoleObj
        ) {
            if (confirmFn('⚠️ Reset all negotiation history? This cannot be undone.')) {
                learner.data = learner._getDefaultData();
                learner._saveData();
                consoleObj.log('[NEGO-LEARNER] Data reset');
                return true;
            }
            return false;
        };
    }

    windowObj.ALIDADE_NEGOTIATION_UTILS = negotiationUtils;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));
