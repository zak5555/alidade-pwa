// ---------------------------------------------------------------
// FORTRESS RUNTIME (Extracted from app.js)
// ---------------------------------------------------------------
// ---------------------------------------------------------------
// VIEW: THE FORTRESS (SOLO FEMALE OPS)
// ---------------------------------------------------------------

const fortressRuntimeDebugLog = (...args) => {
    if (window.__ALIDADE_DEBUG_LOGS__ === true) {
        console.log(...args);
    }
};

const fortressPreviewData = window.ALIDADE_MODULE_PREVIEWS || {};
const BASIC_FORTRESS_PREVIEW = fortressPreviewData.BASIC_FORTRESS_PREVIEW || { mission_statement: '', modules: [] };

let FORTRESS_DATA = BASIC_FORTRESS_PREVIEW;
const fortressIcons = window.ALIDADE_UI_ICONS || {};

window.playTacticalAudio = (file) => {
    const audio = new Audio(file);
    audio.play().catch((e) => fortressRuntimeDebugLog('Audio missing or blocked', e));
};

function renderFortress() {
    if (ensureUltimateViewData('FORTRESS', renderFortress)) {
        return;
    }

    const app = document.getElementById('app');

    const html = `
        <div class="min-h-screen bg-void-950 pb-24 selection:bg-signal-rose/30 selection:text-white overflow-x-hidden">
                <!--OMEGA HEADER-->
                <header class="sticky top-0 z-40 bg-void-950/80 backdrop-blur-xl border-b border-white/5 pb-4 pt- safe-top transition-all duration-500">
                    <div class="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_14px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
                    
                    <div class="px-4 pt-4 flex items-center justify-between relative z-10">
                        <button onclick="window.alidadeApp.navigateTo('HOME')" class="group relative w-12 h-12 rounded bg-void-900/50 border border-white/10 hover:border-signal-rose/50 hover:bg-signal-rose/10 transition-all duration-300 flex items-center justify-center overflow-hidden active:scale-95">
                            <div class="absolute inset-0 bg-gradient-to-tr from-signal-rose/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            ${fortressIcons.arrowLeft || ""}
                        </button>
                        
                        <div class="text-right">
                            <div class="flex items-center justify-end gap-2 mb-1">
                                <span class="w-1.5 h-1.5 rounded-full bg-signal-rose shadow-[0_0_10px_rgba(244,63,94,0.5)] animate-pulse"></span>
                                <p class="text-[9px] text-signal-rose tracking-[0.3em] font-mono font-bold uppercase">SOLO OPS // LIVE</p>
                            </div>
                            <h1 class="font-sans text-2xl font-black text-white tracking-wide uppercase drop-shadow-xl">THE FORTRESS</h1>
                        </div>
                    </div>
                </header>

                <div class="px-4 max-w-2xl mx-auto space-y-8 mt-6">
                    <!-- MISSION BRIEFING: OMEGA -->
                    <div class="relative p-6 rounded-sm bg-gradient-to-br from-void-900 via-void-900 to-void-950 border border-white/5 overflow-hidden group">
                        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-signal-rose/10 via-transparent to-transparent opacity-50"></div>
                        <div class="absolute right-0 top-0 p-4 opacity-[0.03] text-signal-rose text-9xl font-black select-none pointer-events-none -rotate-12 translate-x-10 -translate-y-10">F</div>
                        
                        <div class="relative z-10 flex flex-col gap-4">
                            <div class="flex items-center gap-3">
                                <div class="px-2 py-1 rounded-[1px] bg-signal-rose/10 border border-signal-rose/20 backdrop-blur-sm">
                                    <span class="text-[10px] font-mono font-bold text-signal-rose tracking-wider">SECURE CHANNEL_</span>
                                </div>
                                <div class="h-px flex-1 bg-gradient-to-r from-signal-rose/20 to-transparent"></div>
                            </div>
                            <p class="text-sm text-zinc-300 font-sans leading-relaxed text-balance drop-shadow-sm">"${FORTRESS_DATA.mission_statement}"</p>
                        </div>
                    </div>

                    <!-- MODULES GRID -->
                    <div class="space-y-4">
                        ${renderFortressModule1()}
                        ${renderFortressModule2()}
                        ${renderFortressModule3()}
                        ${renderFortressModule4()}
                    </div>
                </div>
            </div>
        `;

    app.innerHTML = html;
    attachFortressListeners();
}

// HELPER: OMEGA Accordion Wrapper
const wrapOmegaAccordion = (id, icon, title, contentHTML, themeColor = 'rose') => `
        <div class="fortress-accordion relative bg-void-900/40 backdrop-blur-sm border border-white/5 rounded-sm overflow-hidden group transition-all duration-500 hover:border-${themeColor}-500/30 hover:shadow-[0_0_30px_-10px_rgba(var(--color-${themeColor}-500),0.15)]">
        <div class="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
        
        <button class="fortress-header w-full p-5 flex items-stretch justify-between text-left outline-none relative z-10" data-fortress-id="${id}">
            <div class="flex items-center gap-5">
                <div class="relative w-12 h-12 flex items-center justify-center">
                    <div class="absolute inset-0 bg-void-950 rounded-sm border border-white/10 group-hover:border-${themeColor}-500/40 group-hover:shadow-[0_0_15px_rgba(var(--color-${themeColor}-500),0.2)] transition-all duration-500"></div>
                    <span class="relative z-10 text-xl filter drop-shadow-lg grayscale group-hover:grayscale-0 transition-all duration-500">${icon}</span>
                </div>
                <div class="flex flex-col justify-center">
                    <span class="text-[9px] font-mono text-${themeColor}-500/80 tracking-[0.2em] uppercase font-bold mb-1 opacity-70 group-hover:opacity-100 transition-opacity">Module ${id.split('_')[1].padStart(2, '0')}</span>
                    <span class="font-sans font-bold text-zinc-100 text-lg tracking-wide group-hover:text-white transition-colors">${title.replace(/MODULE \d+: /, '')}</span>
                </div>
            </div>
            
            <div class="flex flex-col justify-center items-end">
                <div class="w-8 h-8 rounded-full border border-white/5 bg-void-950 flex items-center justify-center group-hover:border-${themeColor}-500/50 transition-colors">
                    <span class="fortress-icon text-[10px] text-zinc-500 transition-transform duration-500 group-hover:text-${themeColor}-400">?</span>
                </div>
            </div>
        </button>

        <div class="fortress-content hidden border-t border-white/5 bg-black/20" id="fortress-${id}">
            <div class="p-5 space-y-6 relative">
                 <div class="absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-${themeColor}-500/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                ${contentHTML}
            </div>
        </div>
    </div>
        `;

function renderFortressModule1() {
    const mod = FORTRESS_DATA.modules[0];
    const content = `
        <!--Threat Detected Module-->
        <div class="relative overflow-hidden rounded bg-red-950/20 border border-red-500/30 p-5 group/alert">
            <div class="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#ff000008_10px,#ff000008_20px)] animate-[pulse_4s_ease-in-out_infinite]"></div>
            <div class="relative z-10 flex gap-4">
                <div class="text-2xl animate-pulse">!</div>
                <div class="space-y-2">
                    <h4 class="font-mono font-bold text-red-500 text-xs tracking-[0.2em] uppercase glow-text-red">Active Threat: ${mod.scam.title}</h4>
                    <p class="text-xs text-zinc-300 font-mono"><span class="text-red-400 bg-red-950/50 px-1 border border-red-500/20">AGENT:</span> ${mod.scam.lie}</p>
                    <p class="text-xs text-zinc-300 font-mono"><span class="text-emerald-400 bg-emerald-950/50 px-1 border border-emerald-500/20">COUNTER:</span> ${mod.scam.counter}</p>
                </div>
            </div>
        </div>

        <!--Intel Cards-->
        <div class="grid grid-cols-1 gap-3">
            ${mod.content.map(item => `
                <div class="p-4 bg-void-900 border-l-[2px] border-emerald-500/50 bg-gradient-to-r from-emerald-900/10 to-transparent">
                    <h4 class="font-bold text-emerald-400 text-xs mb-1 uppercase tracking-wider">${item.title}</h4>
                    <p class="text-xs text-zinc-400 leading-relaxed">${item.text}</p>
                </div>
            `).join('')}
        </div>

        <!--Zoning Matrix-->
        <div class="grid grid-cols-2 gap-3">
            <div class="space-y-2">
                <h5 class="text-[10px] font-mono font-bold text-emerald-500/70 border-b border-emerald-500/20 pb-1">SAFE ZONES</h5>
                <ul class="space-y-1">
                    ${mod.zones.green.map(z => `<li class="text-[10px] text-zinc-400 font-mono flex gap-1"><span class="text-emerald-500">›</span> ${z}</li>`).join('')}
                </ul>
            </div>
            <div class="space-y-2">
                <h5 class="text-[10px] font-mono font-bold text-red-500/70 border-b border-red-500/20 pb-1">DANGER ZONES</h5>
                <ul class="space-y-1">
                    ${mod.zones.red.map(z => `<li class="text-[10px] text-zinc-400 font-mono flex gap-1"><span class="text-red-500">›</span> ${z}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
    return wrapOmegaAccordion('mod_1', '1', mod.title, content, 'emerald');
}

function renderFortressModule2() {
    const mod = FORTRESS_DATA.modules[1];
    const colors = ['zinc', 'zinc', 'amber', 'orange', 'red', 'rose'];

    // Escalation Matrix Visual
    const content = `
        <div class="relative py-2 pl-4">
            <!--Central Nervous System Line-->
            <div class="absolute left-[27px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-zinc-800 via-amber-900/50 to-rose-600/50"></div>
            
            <div class="space-y-6">
                ${mod.levels.map((lvl, i) => {
        const c = colors[i];
        return `
                        <div class="relative pl-8 group/node">
                            <!-- Tactical Node -->
                            <div class="absolute left-5 top-5 w-3 h-3 rounded-full bg-void-950 border-2 border-${c}-500/30 group-hover/node:border-${c}-500 group-hover/node:scale-125 transition-all duration-300 z-10 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                                <div class="w-full h-full rounded-full bg-${c}-500/20 animate-pulse"></div>
                            </div>

                            <!-- Data Packet -->
                            <div class="relative bg-void-950 border border-white/5 p-4 rounded-sm hover:border-${c}-500/40 transition-colors group-hover/node:bg-void-900/80">
                                <div class="flex justify-between items-start mb-2">
                                    <span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-${c}-500/10 text-${c}-500 border border-${c}-500/20">LVL ${lvl.level} // ${lvl.name}</span>
                                </div>
                                
                                <div class="flex items-center justify-between">
                                     <p class="text-xs font-mono text-zinc-500">TRIGGER: <span class="text-zinc-300">${lvl.use}</span></p>
                                    ${lvl.audio_file ? `
                                        <button onclick="window.playTacticalAudio('${lvl.audio_file}')" class="w-8 h-8 flex items-center justify-center rounded bg-void-900 border border-white/10 hover:border-${c}-500 hover:text-${c}-400 transition-all text-zinc-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                                        </button>
                                    ` : ''}
                                </div>
                                
                                ${lvl.script ? `
                                    <div class="mt-3 pt-3 border-t border-white/5">
                                        <p class="font-sans font-bold text-white text-base">"${lvl.script}"</p>
                                        ${lvl.meaning ? `<p class="text-[10px] text-zinc-500 italic mt-1">${lvl.meaning}</p>` : ''}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
    }).join('')}
            </div>
        </div>
        `;
    return wrapOmegaAccordion('mod_2', '2', mod.title, content, 'rose');
}

function renderFortressModule3() {
    const mod = FORTRESS_DATA.modules[2];
    const content = `
        <div class="space-y-4">
             <!--HUD Comparison-->
             <div class="grid grid-cols-2 gap-px bg-void-800 border border-void-800 rounded-sm overflow-hidden">
                <div class="bg-void-900 p-3 hover:bg-emerald-900/10 transition-colors">
                    <div class="flex items-center gap-2 mb-2 pb-2 border-b border-emerald-500/10">
                        <span class="text-emerald-500 text-xs">?</span>
                        <span class="text-[10px] font-mono font-bold text-emerald-500">RECOMMENDED</span>
                    </div>
                    <p class="text-[11px] text-zinc-300 leading-relaxed">${mod.blocks[0].do}</p>
                </div>
                <div class="bg-void-900 p-3 hover:bg-red-900/10 transition-colors">
                     <div class="flex items-center gap-2 mb-2 pb-2 border-b border-red-500/10">
                        <span class="text-red-500 text-xs">?</span>
                        <span class="text-[10px] font-mono font-bold text-red-500">COMPROMISED</span>
                    </div>
                    <p class="text-[11px] text-zinc-300 leading-relaxed">${mod.blocks[0].avoid}</p>
                </div>
             </div>

             <!--Special Hack-->
             <div class="p-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjYTg1NWf3IiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] border border-purple-500/30 rounded-sm">
                <div class="flex gap-3">
                    <div class="text-2xl">*</div>
                    <div>
                        <h4 class="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">${mod.blocks[1].title}</h4>
                        <p class="text-xs text-zinc-300">${mod.blocks[1].text}</p>
                    </div>
                </div>
             </div>

             <!--Gear Grid-->
        <div>
            <h4 class="text-[10px] font-mono font-bold text-zinc-500 mb-2 uppercase tracking-widest">TACTICAL LOADOUT</h4>
            <div class="grid grid-cols-2 gap-2">
                ${mod.blocks[2].items.map(item => `
                        <div class="px-3 py-2 bg-void-950 border border-white/10 rounded-[1px] text-[10px] text-zinc-300 font-mono flex items-center gap-2">
                            <span class="w-1 h-1 bg-amber-500 rounded-full"></span> ${item}
                        </div>
                    `).join('')}
            </div>
        </div>
        </div>
        `;
    return wrapOmegaAccordion('mod_3', '3', mod.title, content, 'purple');
}

function renderFortressModule4() {
    const mod = FORTRESS_DATA.modules[3];
    const typeConfigs = {
        Food: { color: 'emerald', icon: 'F' },
        Relax: { color: 'amber', icon: 'R' },
        Body: { color: 'rose', icon: 'B' },
        Quiet: { color: 'blue', icon: 'Q' }
    };

    const content = `
        <div class="grid grid-cols-1 gap-3">
            ${mod.locations.map(loc => {
        const config = typeConfigs[loc.type] || { color: 'amber', icon: '?' };
        return `
                    <div 
                        onclick="trackMapLocation({ name: '${loc.name.replace(/'/g, "\\'")}', type: '${loc.type}', lat: 0, lng: 0 }); Haptics.trigger('light');"
                        class="group/loc relative bg-void-950 border border-void-800 p-4 rounded-sm hover:border-${config.color}-500/50 transition-all cursor-pointer overflow-hidden"
                    >
                        <!-- Tech Lines -->
                        <div class="absolute top-0 right-0 w-8 h-8 border-t border-r border-${config.color}-500/20 group-hover/loc:border-${config.color}-500/50 transition-colors"></div>
                        <div class="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-${config.color}-500/20 group-hover/loc:border-${config.color}-500/50 transition-colors"></div>
                        
                        <div class="flex items-start justify-between relative z-10">
                            <div>
                                <div class="flex items-center gap-2 mb-1">
                                    <span class="text-sm">${config.icon}</span>
                                    <h4 class="font-bold text-zinc-200 text-sm group-hover/loc:text-${config.color}-400 transition-colors">${loc.name}</h4>
                                </div>
                                <p class="text-[11px] text-zinc-500 font-mono group-hover/loc:text-zinc-400 w-11/12">${loc.note}</p>
                            </div>
                            <div class="flex flex-col items-end gap-1">
                                <span class="text-[9px] font-mono text-${config.color}-500/70 border border-${config.color}-900 bg-${config.color}-900/10 px-1.5 py-0.5 rounded uppercase tracking-wider">${loc.type}</span>
                            </div>
                        </div>
                    </div>
                `;
    }).join('')
        }
        </div>
        `;
    return wrapOmegaAccordion('mod_4', '4', mod.title, content, 'blue');
}

function attachFortressListeners() {
    document.querySelectorAll('.fortress-header').forEach(header => {
        header.addEventListener('click', () => {
            const moduleId = header.getAttribute('data-fortress-id');
            const icon = header.querySelector('.fortress-icon');
            // Animate click
            Haptics.trigger('medium');

            toggleFortressAccordion(moduleId);
        });
    });
}

function toggleFortressAccordion(moduleId) {
    const content = document.getElementById(`fortress-${moduleId}`);
    const header = document.querySelector(`[data-fortress-id="${moduleId}"]`);
    const icon = header.querySelector('.fortress-icon');
    const isOpen = !content.classList.contains('hidden');

    // Close all accordions
    document.querySelectorAll('.fortress-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('.fortress-icon').forEach(i => {
        i.style.transform = 'rotate(0deg)';
    });

    // Open clicked one if it was closed
    if (!isOpen) {
        content.classList.remove('hidden');
        icon.style.transform = 'rotate(180deg)';
    }
}
