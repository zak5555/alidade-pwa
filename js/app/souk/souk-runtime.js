// Extracted from app.js: souk module runtime block (compatibility-first).

// ---------------------------------------------------------------
// VIEW: SOUK OPS MODULE (Gold/Green Theme)
// ---------------------------------------------------------------

const soukRuntimeDebugLog = (...args) => {
    if (window.__ALIDADE_DEBUG_LOGS__ === true) {
        console.log(...args);
    }
};

// ---------------------------------------------------------------
// VIEW: CERAMICS PROTOCOL
// ---------------------------------------------------------------

function renderCeramicsProtocol() {
    // --- AUDIO HELPER ---
    window.playCeramicSound = (type) => {
        // MP3 Paths: Ensure these match my assets folder
        const path = type === 'fes' ? 'assets/audio/fes_ping.mp3' : 'assets/audio/safi_thud.mp3';
        const audio = new Audio(path);
        audio.volume = 0.6; // Slightly lower volume
        audio.play().catch((e) => soukRuntimeDebugLog('Audio file missing:', path, e));
    };

    const app = document.getElementById('app');

    const html = `
        <div class="min-h-screen bg-void-950 pb-20" >
            <!--TACTICAL HEADER-->
            <header class="sticky top-0 z-20 bg-void-950/98 backdrop-blur-md border-b border-teal-500/40 p-4 mb-6 relative overflow-hidden">
                <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(20,184,166,0.15) 2px, rgba(20,184,166,0.15) 4px);"></div>
                
                <div class="relative flex items-center gap-4">
                    <button onclick="window.alidadeApp.navigateTo('SOUK')" class="p-3 rounded-sm bg-void-900 border border-teal-500/30 hover:bg-teal-500/20 hover:border-teal-500/60 transition-all active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center">
                        ${ICONS.arrowLeft}
                    </button>
                    <div class="flex-1">
                        <p class="text-[10px] text-teal-500 tracking-[0.25em] uppercase font-mono mb-0.5">Material Analysis</p>
                        <div class="flex items-center gap-2">
                            <span class="text-teal-500/60 font-mono text-lg">[</span>
                            <h1 class="font-sans text-xl font-bold text-white uppercase tracking-wider">CERAMICS PROTOCOL</h1>
                            <span class="text-teal-500/60 font-mono text-lg">]</span>
                        </div>
                    </div>
                </div>
            </header>

            <div class="px-4">
                <!-- TACTICAL TAB BAR -->
                <div class="mb-6">
                    <div class="h-[1px] bg-void-800 mb-3"></div>
                    <div class="flex gap-2">
                        <button class="ceramics-tab flex-1 px-4 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-void-900 text-zinc-400 border border-void-600 transition-all hover:border-teal-500/50 hover:text-teal-400" data-tab="authenticate">
                            AUTHENTICATE
                        </button>
                        <button class="ceramics-tab flex-1 px-4 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-void-900 text-zinc-400 border border-void-600 transition-all hover:border-teal-500/50 hover:text-teal-400" data-tab="pricing">
                            PRICING
                        </button>
                        <button class="ceramics-tab flex-1 px-4 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-void-900 text-zinc-400 border border-void-600 transition-all hover:border-teal-500/50 hover:text-teal-400" data-tab="hazards">
                            HAZARDS
                        </button>
                    </div>
                </div>

                <!-- TAB CONTENT -->
                <div id="ceramics-content"></div>
            </div>
        </div>
        `;

    app.innerHTML = html;

    // Set initial tab
    switchCeramicsTab('authenticate');
    attachCeramicsListeners();
}

function switchCeramicsTab(tabName) {
    // Update tab buttons with tactical styling
    document.querySelectorAll('.ceramics-tab').forEach(tab => {
        tab.className = "ceramics-tab flex-1 px-4 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-void-900 text-zinc-400 border border-void-600 transition-all";
        if (tab.getAttribute('data-tab') === tabName) {
            tab.className = "ceramics-tab flex-1 px-4 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-teal-500 text-zinc-950 border-2 border-teal-400 shadow-[0_0_20px_rgba(20,184,166,0.25)] transition-all";
        }
    });

    // Render tab content
    const content = document.getElementById('ceramics-content');

    switch (tabName) {
        case 'authenticate':
            content.innerHTML = renderAuthenticateTab();
            attachAuthenticateListeners();
            break;
        case 'pricing':
            content.innerHTML = renderPricingTab();
            break;
        case 'hazards':
            content.innerHTML = renderHazardsTab();
            attachHazardsListeners();
            break;
    }
}

function renderAuthenticateTab() {
    return `
        <div class="space-y-6" >
                <!--Title -->
                <div class="p-4 bg-teal-500/10 border border-teal-500/30 rounded-[2px]">
                    <h2 class="font-heading text-lg font-bold text-teal-400 mb-2">TAMEGROUTE VERIFICATION</h2>
                    <p class="text-sm text-zinc-400">Authentic Tamegroute pottery has distinctive characteristics. Use these checks to verify.</p>
                </div>

                <!--Toggle Checks-->
                <div class="space-y-4">
                    <!-- Check 1 -->
                    <div class="p-4 bg-void-900/60 border border-void-800 rounded-[2px]">
                        <div class="flex items-center justify-between mb-2">
                            <label class="font-mono text-sm font-semibold text-white">Visual Check: 3 Stilt Marks (Kiln Scars)?</label>
                            <button class="auth-toggle w-14 h-7 rounded-full transition-all relative" data-check="stilt" data-state="false">
                                <span class="toggle-slider absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-all"></span>
                            </button>
                        </div>
                        <p class="text-xs text-void-500">Look for 3 small circular marks (scars) on the base from kiln supports during firing.</p>
                    </div>

                    <!-- Check 2 -->
                    <div class="p-4 bg-void-900/60 border border-void-800 rounded-[2px]">
                        <div class="flex items-center justify-between mb-2">
                            <label class="font-mono text-sm font-semibold text-white">Texture Check: Rough/Unglazed Base (Raw Clay)?</label>
                            <button class="auth-toggle w-14 h-7 rounded-full transition-all relative" data-check="clay" data-state="false">
                                <span class="toggle-slider absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-all"></span>
                            </button>
                        </div>
                        <p class="text-xs text-void-500">The base should feel rough and unglazed, showing natural raw clay texture.</p>
                    </div>
                </div>

                <!--Result Box-->
        <div id="auth-result" class="p-6 rounded-[2px] border-l-4 transition-all">
            <div class="flex items-center gap-3 mb-2">
                <div id="auth-icon"></div>
                <h3 class="font-heading text-lg font-bold" id="auth-title">AWAITING INPUT</h3>
            </div>
            <p class="text-sm" id="auth-message">Complete both checks above to verify authenticity.</p>
        </div>
            </div>
        `;
}

function renderSoukClassifiedPreviewCard({
    source = 'souk_preview',
    feature = 'MARKET',
    body = 'Full intelligence is restricted to Ultimate operatives.',
    cta = 'UNLOCK'
} = {}) {
    const safeSource = String(source || 'souk_preview').replace(/'/g, "\\'");
    const safeFeature = String(feature || 'MARKET').replace(/'/g, "\\'");
    const safeBody = escapeHtml(String(body || ''));
    const safeCta = escapeHtml(String(cta || 'UNLOCK'));

    return `
        <div class="mt-3 p-3 rounded-[2px] border border-signal-amber/30 bg-signal-amber/5">
            <p class="text-[10px] font-mono uppercase tracking-widest text-signal-amber">CLASSIFIED PREVIEW</p>
            <p class="text-xs text-zinc-300 mt-1">${safeBody}</p>
            <button
                onclick="window.trackTierFunnelEvent && window.trackTierFunnelEvent('click_upgrade', { source: '${safeSource}', feature: '${safeFeature}' }); window.showUpgradeModal && window.showUpgradeModal('ultimate', '${safeFeature}')"
                class="mt-3 px-3 py-2 bg-signal-amber text-black text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm hover:bg-amber-400 transition-colors"
            >
                ${safeCta}
            </button>
        </div>
    `;
}

function renderSoukPricingLockTable(items = [], source = 'souk_pricing_preview') {
    const safeSource = String(source || 'souk_pricing_preview').replace(/'/g, "\\'");
    const rows = (Array.isArray(items) ? items : []).map((item) => {
        const itemName = escapeHtml(String(item?.name || 'Unknown item'));
        const fairPrice = escapeHtml(String(item?.target || '--'));
        const touristPrice = escapeHtml(String(item?.scam || '--'));
        return `
            <tr class="border-b border-void-800/70">
                <td class="px-3 py-2 text-zinc-200 font-mono text-[11px]">${itemName}</td>
                <td class="px-3 py-2 text-emerald-400 font-mono text-[11px] text-right">${fairPrice}</td>
                <td class="px-3 py-2 text-rose-400 font-mono text-[11px] text-right">${touristPrice}</td>
            </tr>
        `;
    }).join('');

    return `
        <div class="space-y-4">
            <div class="p-4 bg-signal-amber/10 border border-signal-amber/30 rounded-sm">
                <h2 class="font-heading text-lg font-bold text-signal-amber mb-2">PRICE DECRYPTOR</h2>
                <p class="text-sm text-zinc-400">Tab 1 and 2 are open. Pricing intelligence is encrypted for Ultimate operatives.</p>
            </div>

            <div class="relative border border-signal-amber/30 rounded-sm overflow-hidden bg-void-950/70">
                <table class="w-full">
                    <thead class="bg-void-900/90 border-b border-void-700">
                        <tr>
                            <th class="px-3 py-2 text-left text-[10px] font-mono uppercase tracking-widest text-zinc-300">Item</th>
                            <th class="px-3 py-2 text-right text-[10px] font-mono uppercase tracking-widest text-emerald-400">Fair Price</th>
                            <th class="px-3 py-2 text-right text-[10px] font-mono uppercase tracking-widest text-rose-400">Tourist Price</th>
                        </tr>
                    </thead>
                    <tbody style="filter: blur(5px);" class="select-none pointer-events-none">
                        ${rows}
                    </tbody>
                </table>

                <div class="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[1px] p-3">
                    <div class="w-full max-w-xs rounded-sm border border-signal-amber/40 bg-void-950/95 p-4 text-center shadow-[0_0_25px_rgba(245,158,11,0.28)]">
                        <p class="text-[10px] font-mono uppercase tracking-[0.2em] text-signal-amber">REAL-TIME MARKET DATA // ENCRYPTED</p>
                        <p class="text-xs text-zinc-300 mt-2">Unlock live price floors, trap multipliers, and tactical negotiation ranges.</p>
                        <button
                            onclick="window.trackTierFunnelEvent && window.trackTierFunnelEvent('click_upgrade', { source: '${safeSource}', feature: 'MARKET' }); window.showUpgradeModal && window.showUpgradeModal('ultimate', 'MARKET')"
                            class="mt-3 px-3 py-2 bg-signal-amber text-black text-[10px] font-mono font-bold uppercase tracking-widest rounded-sm hover:bg-amber-400 transition-colors"
                        >
                            DECRYPT PRICES
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderPricingTab() {
    const items = [
        { name: 'Tamegroute Candle Holder', target: '40-60 DH', scam: '250-400 DH' },
        { name: 'Tamegroute Bowl (Zlafa)', target: '15-25 DH', scam: '100-150 DH' },
        { name: 'Safi Mug (Modern)', target: '20-30 DH', scam: '80-120 DH' },
        { name: 'Safi Tagine (Unglazed)', target: '30-50 DH', scam: '120-200 DH' },
        { name: 'Fes Blue Plate (25cm)', target: '150-250 DH', scam: '400-600 DH' }
    ];

    if (!isUltimateTierActive()) {
        trackLockImpression('MARKET', 'souk_ceramics_pricing_preview');
        return renderSoukPricingLockTable(items, 'souk_ceramics_pricing_preview');
    }

    return `
        <div class="space-y-4" >
            <div class="p-4 bg-teal-500/10 border border-teal-500/30 rounded-[2px]">
                <h2 class="font-heading text-lg font-bold text-teal-400 mb-2">PRICE DECRYPTOR</h2>
                <p class="text-sm text-zinc-400">Fair market prices vs tourist traps. Green = target range, Red = scam alert.</p>
            </div>

                ${items.map(item => `
                    <div class="grid grid-cols-2 gap-3">
                        <!-- Target Price -->
                        <div class="p-4 bg-void-900/60 border-l-4 border-signal-emerald rounded-[2px]">
                            <p class="text-xs text-void-500 font-mono uppercase tracking-wide mb-1">Target Price</p>
                            <h3 class="font-heading text-sm font-bold text-white mb-2">${item.name}</h3>
                            <p class="font-mono text-2xl font-bold text-emerald-400">${item.target}</p>
                        </div>
                        
                        <!-- Scam Price -->
                        <div class="p-4 bg-void-900/60 border-l-4 border-signal-crimson rounded-[2px]">
                            <p class="text-xs text-void-500 font-mono uppercase tracking-wide mb-1">Tourist Trap</p>
                            <h3 class="font-heading text-sm font-bold text-white mb-2">${item.name}</h3>
                            <p class="font-mono text-2xl font-bold text-rose-400">${item.scam}</p>
                        </div>
                    </div>
                `).join('')
        }
            </div>
        `;
}

function renderHazardsTab() {
    return `
        <div class="space-y-6" >
                <!--Lead Warning-->
                <div class="p-5 bg-signal-crimson/10 border border-signal-crimson/30 rounded-[2px]">
                    <div class="flex items-start gap-3 mb-3">
                        <div class="text-rose-400">
                            ${ICONS.alert}
                        </div>
                        <div>
                            <h2 class="font-heading text-lg font-bold text-rose-400 mb-2">THE TOXIC TRAP</h2>
                            <p class="text-sm text-zinc-300 leading-relaxed">
                                <strong class="text-rose-400">Bright Yellow/Red Glaze = High Lead Risk.</strong><br/>
                                Never use for hot food or acidic drinks. Lead leaches into food and can cause serious health issues.
                            </p>
                        </div>
                    </div>
                    <div class="mt-4 p-3 bg-black/30 rounded border border-signal-crimson/20">
                        <p class="text-xs text-zinc-400 font-mono">? SAFE USAGE: Decorative purposes only. For functional ware, choose natural earth tones or certified lead-free pieces.</p>
                    </div>
                </div>

                <!--Acid Test-->
                <div class="p-5 bg-signal-amber/10 border border-signal-amber/30 rounded-[2px]">
                    <h3 class="font-heading text-lg font-bold text-signal-amber mb-3">THE ACID TEST</h3>
                    <div class="space-y-2">
                        <p class="text-sm text-zinc-300"><strong class="text-signal-amber">Method:</strong> Fill bowl with vinegar overnight (12+ hours)</p>
                        <p class="text-sm text-zinc-300"><strong class="text text-rose-400">Warning Sign:</strong> If glaze fades or discolors ? Lead is LEACHING</p>
                        <p class="text-sm text-zinc-300"><strong class="text-emerald-400">Safe Result:</strong> Glaze remains unchanged ? Lead-free or sealed</p>
                    </div>
                    <div class="mt-3 p-3 bg-black/30 rounded border border-signal-amber/20">
                        <p class="text-xs text-zinc-400 font-mono">Use white vinegar (5% acidity). Discard piece if test shows leaching.</p>
                    </div>
                </div>

                <!--Sound Audit-->
        <div class="p-5 bg-void-900/60 border border-void-800 rounded-[2px]">
            <h2 class="font-heading text-lg font-bold text-teal-400 mb-3">SOUND AUDIT</h2>
            <p class="text-sm text-zinc-400 mb-4">
                Different clay types produce different sounds when tapped. Learn to distinguish quality.
            </p>

            <div class="grid grid-cols-2 gap-3">
                <!-- Fes Clay -->
                <button onclick="playCeramicSound('fes')" class="sound-btn p-4 bg-teal-500/10 border border-teal-500/30 rounded-[2px] hover:bg-teal-500/20 transition-all active:scale-95" data-sound="ping">
                    <div class="text-teal-400 mb-2">
                        ${ICONS.beaker}
                    </div>
                    <h3 class="font-heading text-sm font-bold text-teal-400 mb-1">FES CLAY</h3>
                    <p class="text-xs text-zinc-400 font-mono">"Bell-like PING"</p>
                    <p class="text-xs text-void-500 mt-2">High-fired, dense ceramic</p>
                </button>

                <!-- Safi Clay -->
                <button onclick="playCeramicSound('safi')" class="sound-btn p-4 bg-signal-amber/10 border border-signal-amber/30 rounded-[2px] hover:bg-signal-amber/20 transition-all active:scale-95" data-sound="thud">
                    <div class="text-signal-amber mb-2">
                        ${ICONS.cube}
                    </div>
                    <h3 class="font-heading text-sm font-bold text-signal-amber mb-1">SAFI CLAY</h3>
                    <p class="text-xs text-zinc-400 font-mono">"Dull THUD"</p>
                    <p class="text-xs text-void-500 mt-2">Lower temp, porous</p>
                </button>
            </div>
        </div>
            </div>
        `;
}

function attachCeramicsListeners() {
    // Tab switching
    document.querySelectorAll('.ceramics-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            switchCeramicsTab(tabName);
        });
    });
}

function attachAuthenticateListeners() {
    const toggles = document.querySelectorAll('.auth-toggle');

    toggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            // Toggle state
            const currentState = toggle.getAttribute('data-state') === 'true';
            const newState = !currentState;
            toggle.setAttribute('data-state', newState);

            // Update visual
            const slider = toggle.querySelector('.toggle-slider');
            if (newState) {
                toggle.classList.add('bg-signal-emerald');
                toggle.classList.remove('bg-void-600');
                slider.style.transform = 'translateX(28px)';
            } else {
                toggle.classList.remove('bg-signal-emerald');
                toggle.classList.add('bg-void-600');
                slider.style.transform = 'translateX(0)';
            }

            // Update result
            updateAuthResult();
        });

        // Set initial state
        toggle.classList.add('bg-void-600');
    });
}

function updateAuthResult() {
    const stiltCheck = document.querySelector('[data-check="stilt"]').getAttribute('data-state') === 'true';
    const clayCheck = document.querySelector('[data-check="clay"]').getAttribute('data-state') === 'true';

    const resultBox = document.getElementById('auth-result');
    const icon = document.getElementById('auth-icon');
    const title = document.getElementById('auth-title');
    const message = document.getElementById('auth-message');

    if (stiltCheck && clayCheck) {
        // Both checks passed - AUTHENTIC
        resultBox.className = 'p-6 rounded-[2px] border-l-4 border-signal-emerald bg-signal-emerald/10 transition-all';
        icon.innerHTML = `<div class="text-emerald-400" > ${ICONS.checkCircle}</div> `;
        icon.className = 'text-emerald-400';
        title.textContent = 'MATCH CONFIRMED';
        title.className = 'font-heading text-lg font-bold text-emerald-400';
        message.textContent = 'Authentic Tamegroute. Both characteristics match genuine pieces.';
        message.className = 'text-sm text-emerald-300';
    } else if (!stiltCheck && !clayCheck) {
        // Neither check - AWAITING
        resultBox.className = 'p-6 rounded-[2px] border-l-4 border-void-600 bg-void-800/30 transition-all';
        icon.innerHTML = '';
        title.textContent = 'AWAITING INPUT';
        title.className = 'font-heading text-lg font-bold text-zinc-400';
        message.textContent = 'Complete both checks above to verify authenticity.';
        message.className = 'text-sm text-void-500';
    } else {
        // One or more checks failed - FAKE
        resultBox.className = 'p-6 rounded-[2px] border-l-4 border-signal-crimson bg-signal-crimson/10 transition-all';
        icon.innerHTML = `<div class="text-rose-400" > ${ICONS.xCircle}</div> `;
        icon.className = 'text-rose-400';
        title.textContent = 'ANOMALY DETECTED';
        title.className = 'font-heading text-lg font-bold text-rose-400';
        message.textContent = 'Likely factory replica. Genuine Tamegroute must pass both checks.';
        message.className = 'text-sm text-rose-300';
    }
}

function attachHazardsListeners() {
    document.querySelectorAll('.sound-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const sound = btn.getAttribute('data-sound');
            soukRuntimeDebugLog(`[ALIDADE] Playing sound: ${sound} `);
            // Future: Implement actual audio playback
        });
    });
}

// ---------------------------------------------------------------
// VIEW: LEATHER PROTOCOL
// ---------------------------------------------------------------

function renderLeatherProtocol() {
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
                        <p class="text-[10px] text-signal-amber tracking-[0.25em] uppercase font-mono mb-0.5">Material Analysis</p>
                        <div class="flex items-center gap-2">
                            <span class="text-signal-amber/60 font-mono text-lg">[</span>
                            <h1 class="font-sans text-xl font-bold text-white uppercase tracking-wider">LEATHER PROTOCOL</h1>
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
                        <button class="leather-tab flex-1 px-4 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-void-900 text-zinc-400 border border-void-600 transition-all hover:border-signal-amber/50 hover:text-signal-amber" data-tab="species">
                            SPECIES ID
                        </button>
                        <button class="leather-tab flex-1 px-4 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-void-900 text-zinc-400 border border-void-600 transition-all hover:border-signal-amber/50 hover:text-signal-amber" data-tab="lab">
                            THE LAB
                        </button>
                        <button class="leather-tab flex-1 px-4 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-void-900 text-zinc-400 border border-void-600 transition-all hover:border-signal-amber/50 hover:text-signal-amber" data-tab="pricing">
                            PRICING
                        </button>
                    </div>
                </div>

                <!-- TAB CONTENT -->
                <div id="leather-content"></div>
            </div>
        </div>
        `;

    app.innerHTML = html;

    // Set initial tab
    switchLeatherTab('species');
    attachLeatherListeners();
}

function switchLeatherTab(tabName) {
    // Update tab buttons with tactical styling
    document.querySelectorAll('.leather-tab').forEach(tab => {
        tab.className = "leather-tab flex-1 px-4 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-void-900 text-zinc-400 border border-void-600 transition-all";
        if (tab.getAttribute('data-tab') === tabName) {
            tab.className = "leather-tab flex-1 px-4 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-signal-amber text-zinc-950 border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-all";
        }
    });

    // Render tab content
    const content = document.getElementById('leather-content');

    switch (tabName) {
        case 'species':
            content.innerHTML = renderSpeciesTab();
            attachSpeciesListeners();
            break;
        case 'lab':
            content.innerHTML = renderLabTab();
            attachLabListeners();
            break;
        case 'pricing':
            content.innerHTML = renderLeatherPricingTab();
            break;
    }
}

function renderSpeciesTab() {
    return `
        <div class="space-y-6" >
                <!--Title -->
                <div class="p-4 bg-signal-amber/10 border border-signal-amber/30 rounded-sm relative overflow-hidden">
                    <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.05) 5px, rgba(255,255,255,0.05) 10px);"></div>
                    <h2 class="font-heading text-lg font-bold text-signal-amber mb-2">TACTILE FORENSICS: Touch the Grain</h2>
                    <p class="text-sm text-zinc-400">Select the texture that matches what you feel:</p>
                </div>

                <!--Material Selector Cards-->
                <div class="space-y-3">
                    ${renderSpeciesCard('sheep', 'Soft, Spongy, Stretches', 'SHEEP (Basane). Low Durability. Good for lining, BAD for bags.', 'amber')}
                    ${renderSpeciesCard('goat', 'Tough, Pebbled Grain, Springs Back', 'GOAT (Maza). High Durability. APPROVED for bags & shoes.', 'emerald')}
                    ${renderSpeciesCard('cowhide', 'Stiff, Heavy, Wood-like', 'COWHIDE/CAMEL FAKE. Often sold as Camel. Too stiff for high quality.', 'rose')}
                </div>

                <!--Result Box-->
        <div id="species-result" class="p-6 rounded-sm border-l-4 border-void-600 bg-void-800/30 transition-all hidden">
            <div class="flex items-center gap-3 mb-2">
                <div id="species-icon"></div>
                <h3 class="font-heading text-lg font-bold" id="species-title">Select Material Above</h3>
            </div>
            <p class="text-sm" id="species-message"></p>
        </div>
            </div>
        `;
}

function renderSpeciesCard(id, description, result, resultColor) {
    // Gradient map based on resultColor
    const bgClass = resultColor === 'emerald' ? 'bg-gradient-to-r from-emerald-500/10 to-zinc-900' :
        resultColor === 'amber' ? 'bg-gradient-to-r from-amber-500/10 to-zinc-900' :
            'bg-gradient-to-r from-rose-500/10 to-zinc-900';

    const borderClass = resultColor === 'emerald' ? 'border-signal-emerald/30' :
        resultColor === 'amber' ? 'border-signal-amber/30' :
            'border-signal-crimson/30';

    return `
        <button class="species-card w-full p-5 ${bgClass} border ${borderClass} border-l-[4px] border-l-${resultColor}-500 hover:border-${resultColor}-500/60 rounded-sm text-left transition-all active:scale-95 relative overflow-hidden group" data - species="${id}" data - result="${result}" data - color="${resultColor}" >
                <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px);"></div>
                <div class="flex items-center justify-between relative z-10">
                    <div>
                        <span class="text-[10px] font-mono font-bold text-${resultColor}-400 opacity-80 tracking-widest uppercase mb-1 block">OPTION ${id === 'sheep' ? 'A' : id === 'goat' ? 'B' : 'C'}</span>
                        <h3 class="font-heading text-base font-bold text-white mb-1 group-hover:text-white transition-colors">
                            ${id === 'sheep' ? 'Sheep' : id === 'goat' ? 'Goat' : 'Cow/Camel-Fake'}
                        </h3>
                        <p class="text-sm text-zinc-400">${description}</p>
                    </div>
                    <div class="text-signal-amber opacity-0 species-check transition-opacity" id="check-${id}">
                        ${ICONS.checkCircle}
                    </div>
                </div>
            </button>
        `;
}

function renderLabTab() {
    return `
        <div class="space-y-6" >
                <!--Title -->
                <div class="p-4 bg-signal-amber/10 border border-signal-amber/30 rounded-sm relative overflow-hidden">
                    <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.05) 5px, rgba(255,255,255,0.05) 10px);"></div>
                    <h2 class="font-heading text-lg font-bold text-signal-amber mb-2">TANNING VERIFICATION</h2>
                    <p class="text-sm text-zinc-400">Chrome vs. Vegetable Tanned - Chemical Audit</p>
                </div>

                <!--Test 1: Water Drop-->
                <div class="p-5 bg-void-900 border border-void-700/50 rounded-sm relative overflow-hidden">
                    <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px);"></div>
                    <h3 class="font-heading text-base font-bold text-white mb-3 relative z-10">TEST 1: The Water Drop</h3>
                    <div class="flex items-center justify-between mb-2 relative z-10">
                        <label class="font-mono text-sm font-semibold text-zinc-300">Drop of water beads up / rolls off?</label>
                        <button class="lab-toggle w-14 h-7 rounded-sm transition-all relative bg-void-600" data-test="water" data-state="false">
                            <span class="toggle-slider absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-sm transition-all"></span>
                        </button>
                    </div>
                    <div id="water-result" class="mt-3 p-3 bg-void-950/50 rounded-sm border border-void-700/50 relative z-10">
                        <p class="text-xs text-void-500 font-mono">Perform the test and toggle above</p>
                    </div>
                </div>

                <!--Test 2: Burn Test-->
        <div class="p-5 bg-void-900 border border-void-700/50 rounded-sm relative overflow-hidden">
            <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px);"></div>
            <h3 class="font-heading text-base font-bold text-white mb-3 relative z-10">TEST 2: The Burn Test (Edge)</h3>
            <div class="flex items-center justify-between mb-2 relative z-10">
                <label class="font-mono text-sm font-semibold text-zinc-300">Smells like Plastic / Green Flame?</label>
                <button class="lab-toggle w-14 h-7 rounded-sm transition-all relative bg-void-600" data-test="burn" data-state="false">
                    <span class="toggle-slider absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-sm transition-all"></span>
                </button>
            </div>
            <div id="burn-result" class="mt-3 p-3 bg-void-950/50 rounded-sm border border-void-700/50 relative z-10">
                <p class="text-xs text-void-500 font-mono">Perform the test and toggle above</p>
            </div>
        </div>
            </div>
        `;
}

function renderLeatherPricingTab() {
    const items = [
        { name: 'Babouche (Standard Round)', target: '70-120 DH', scam: '250-350 DH' },
        { name: 'Babouche (Royal/Pointed)', target: '150-250 DH', scam: '400-600 DH' },
        { name: 'Leather Pouf (Unstuffed)', target: '150-250 DH', scam: '450-700 DH' },
        { name: 'Shoulder Bag (Sm/Med)', target: '200-400 DH', scam: '500-800 DH' },
        { name: 'Weekender Bag (Large)', target: '600-1000 DH', scam: '1500-2000 DH' },
        { name: 'Leather Jacket', target: '700-1200 DH', scam: '2500-4000 DH' }
    ];

    if (!isUltimateTierActive()) {
        trackLockImpression('MARKET', 'souk_leather_pricing_preview');
        return renderSoukPricingLockTable(items, 'souk_leather_pricing_preview');
    }

    return `
        <div class="space-y-4" >
            <div class="p-4 bg-signal-amber/10 border border-signal-amber/30 rounded-sm relative overflow-hidden">
                <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.05) 5px, rgba(255,255,255,0.05) 10px);"></div>
                <h2 class="font-heading text-lg font-bold text-signal-amber mb-2">PRICE DECRYPTOR</h2>
                <p class="text-sm text-zinc-400">Fair market prices vs tourist traps. Green = target range, Red = scam alert.</p>
            </div>

                ${items.map(item => `
                    <div class="grid grid-cols-2 gap-3">
                        <!-- Target Price -->
                        <div class="p-4 bg-void-900 border-l-4 border-signal-emerald rounded-sm relative overflow-hidden">
                             <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(16,185,129,0.1) 2px, rgba(16,185,129,0.1) 4px);"></div>
                            <p class="text-[10px] text-void-500 font-mono uppercase tracking-wide mb-1">Target Price</p>
                            <h3 class="font-heading text-sm font-bold text-white mb-2">${item.name}</h3>
                            <p class="font-mono text-2xl font-bold text-emerald-400">${item.target}</p>
                        </div>
                        
                        <!-- Scam Price -->
                        <div class="p-4 bg-void-900 border-l-4 border-signal-crimson rounded-sm relative overflow-hidden">
                             <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(244,63,94,0.1) 2px, rgba(244,63,94,0.1) 4px);"></div>
                            <p class="text-[10px] text-void-500 font-mono uppercase tracking-wide mb-1">Tourist Trap</p>
                            <h3 class="font-heading text-sm font-bold text-white mb-2">${item.name}</h3>
                            <p class="font-mono text-2xl font-bold text-rose-400">${item.scam}</p>
                        </div>
                    </div>
                `).join('')
        }
            </div>
        `;
}

function attachLeatherListeners() {
    // Tab switching
    document.querySelectorAll('.leather-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            switchLeatherTab(tabName);
        });
    });
}

function attachSpeciesListeners() {
    document.querySelectorAll('.species-card').forEach(card => {
        card.addEventListener('click', () => {
            const species = card.getAttribute('data-species');
            const result = card.getAttribute('data-result');
            const color = card.getAttribute('data-color');

            // Clear all checks
            document.querySelectorAll('.species-check').forEach(check => {
                check.classList.add('opacity-0');
            });

            // Show selected check
            document.getElementById(`check - ${species} `).classList.remove('opacity-0');

            // Update result
            const resultBox = document.getElementById('species-result');
            const icon = document.getElementById('species-icon');
            const title = document.getElementById('species-title');
            const message = document.getElementById('species-message');

            resultBox.classList.remove('hidden');

            if (color === 'emerald') {
                resultBox.className = 'p-6 rounded-sm border-l-4 border-signal-emerald bg-signal-emerald/10 transition-all';
                icon.innerHTML = `<div class="text-emerald-400" > ${ICONS.checkCircle}</div> `;
                title.textContent = 'VERIFIED';
                title.className = 'font-heading text-lg font-bold text-emerald-400';
                message.textContent = `Result: ${result} `;
                message.className = 'text-sm text-emerald-300';
            } else if (color === 'amber') {
                resultBox.className = 'p-6 rounded-sm border-l-4 border-signal-amber bg-signal-amber/10 transition-all';
                icon.innerHTML = `<div class="text-signal-amber" > ${ICONS.alert}</div> `;
                title.textContent = 'WARNING';
                title.className = 'font-heading text-lg font-bold text-signal-amber';
                message.textContent = `Result: ${result} `;
                message.className = 'text-sm text-amber-300';
            } else {
                resultBox.className = 'p-6 rounded-sm border-l-4 border-signal-crimson bg-signal-crimson/10 transition-all';
                icon.innerHTML = `<div class="text-rose-400" > ${ICONS.xCircle}</div> `;
                title.textContent = 'ALERT';
                title.className = 'font-heading text-lg font-bold text-rose-400';
                message.textContent = `Result: ${result} `;
                message.className = 'text-sm text-rose-300';
            }
        });
    });
}

function attachLabListeners() {
    document.querySelectorAll('.lab-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const test = toggle.getAttribute('data-test');
            const currentState = toggle.getAttribute('data-state') === 'true';
            const newState = !currentState;
            toggle.setAttribute('data-state', newState);

            // Update visual
            const slider = toggle.querySelector('.toggle-slider');
            if (newState) {
                toggle.classList.add('bg-signal-crimson');
                toggle.classList.remove('bg-void-600');
                slider.style.transform = 'translateX(28px)';
            } else {
                toggle.classList.remove('bg-signal-crimson');
                toggle.classList.add('bg-void-600');
                slider.style.transform = 'translateX(0)';
            }

            // Update result
            updateLabResult(test, newState);
        });
    });
}

function updateLabResult(test, isPositive) {
    const resultDiv = document.getElementById(`${test} -result`);

    if (test === 'water') {
        if (isPositive) {
            resultDiv.innerHTML = '<p class="text-sm text-rose-400 font-semibold">[ALERT] Chemical Coating / Chrome Tanned. Not breathable.</p>';
            resultDiv.className = 'mt-3 p-3 bg-signal-crimson/10 rounded border border-signal-crimson/30';
        } else {
            resultDiv.innerHTML = '<p class="text-sm text-emerald-400 font-semibold">? GOOD: Absorbs (Natural).</p>';
            resultDiv.className = 'mt-3 p-3 bg-signal-emerald/10 rounded border border-signal-emerald/30';
        }
    } else if (test === 'burn') {
        if (isPositive) {
            resultDiv.innerHTML = '<p class="text-sm text-rose-400 font-semibold">[DANGER] Chemical / Synthetic. Walk away.</p>';
            resultDiv.className = 'mt-3 p-3 bg-signal-crimson/10 rounded border border-signal-crimson/30';
        } else {
            resultDiv.innerHTML = '<p class="text-sm text-emerald-400 font-semibold">? GOOD: Smells like Burnt Hair (Organic).</p>';
            resultDiv.className = 'mt-3 p-3 bg-signal-emerald/10 rounded border border-signal-emerald/30';
        }
    }
}

// ---------------------------------------------------------------
// VIEW: RUGS PROTOCOL
// ---------------------------------------------------------------

function renderRugsProtocol() {
    const app = document.getElementById('app');

    const html = `
        <div class="min-h-screen bg-void-950 pb-20" >
            <!--TACTICAL HEADER-->
            <header class="sticky top-0 z-20 bg-void-950/98 backdrop-blur-md border-b border-signal-crimson/40 p-4 mb-6 relative overflow-hidden">
                <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(244,63,94,0.15) 2px, rgba(244,63,94,0.15) 4px);"></div>
                
                <div class="relative flex items-center gap-4">
                    <button onclick="window.alidadeApp.navigateTo('SOUK')" class="p-3 rounded-sm bg-void-900 border border-signal-crimson/30 hover:bg-signal-crimson/20 hover:border-signal-crimson/60 transition-all active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center">
                        ${ICONS.arrowLeft}
                    </button>
                    <div class="flex-1">
                        <p class="text-[10px] text-signal-crimson tracking-[0.25em] uppercase font-mono mb-0.5">Fiber Analysis</p>
                        <div class="flex items-center gap-2">
                            <span class="text-signal-crimson/60 font-mono text-lg">[</span>
                            <h1 class="font-sans text-xl font-bold text-white uppercase tracking-wider">RUGS PROTOCOL</h1>
                            <span class="text-signal-crimson/60 font-mono text-lg">]</span>
                        </div>
                    </div>
                </div>
            </header>

            <div class="px-4">
                <!-- TACTICAL TAB BAR -->
                <div class="mb-6">
                    <div class="h-[1px] bg-void-800 mb-3"></div>
                    <div class="flex gap-2">
                        <button class="rugs-tab flex-1 px-4 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-void-900 text-zinc-400 border border-void-600 transition-all hover:border-signal-crimson/50 hover:text-rose-400" data-tab="fiber">
                            FIBER ID
                        </button>
                        <button class="rugs-tab flex-1 px-4 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-void-900 text-zinc-400 border border-void-600 transition-all hover:border-signal-crimson/50 hover:text-rose-400" data-tab="age">
                            AGE CHECK
                        </button>
                        <button class="rugs-tab flex-1 px-4 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-void-900 text-zinc-400 border border-void-600 transition-all hover:border-signal-crimson/50 hover:text-rose-400" data-tab="pricing">
                            PRICING
                        </button>
                    </div>
                </div>

                <!-- TAB CONTENT -->
                <div id="rugs-content"></div>
            </div>
        </div>
        `;

    app.innerHTML = html;
    switchRugsTab('fiber');
    attachRugsListeners();
}

function switchRugsTab(tabName) {
    document.querySelectorAll('.rugs-tab').forEach(tab => {
        tab.className = "rugs-tab flex-1 px-4 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-void-900 text-zinc-400 border border-void-600 transition-all";
        if (tab.getAttribute('data-tab') === tabName) {
            tab.className = "rugs-tab flex-1 px-4 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-signal-crimson text-zinc-950 border-2 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.25)] transition-all";
        }
    });

    const content = document.getElementById('rugs-content');
    switch (tabName) {
        case 'fiber':
            content.innerHTML = renderFiberTab();
            attachFiberListeners();
            break;
        case 'age':
            content.innerHTML = renderAgeCheckTab();
            attachAgeCheckListeners();
            break;
        case 'pricing':
            content.innerHTML = renderRugsPricingTab();
            break;
    }
}

function renderFiberTab() {
    return `
        <div class="space-y-6 animate-fadeIn pb-20" >
                <!--Section A: Burn Test-->
                <div class="p-4 bg-signal-crimson/10 border border-signal-crimson/30 rounded-sm relative overflow-hidden">
                    <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.05) 5px, rgba(255,255,255,0.05) 10px);"></div>
                    <h2 class="font-mono text-xs font-bold text-signal-crimson uppercase tracking-widest mb-1">SECTION A: The Burn Test</h2>
                    <p class="text-xs text-zinc-400">Select the smell/ash result when you burn a fiber:</p>
                </div>

                <div class="space-y-3">
                    ${renderBurnCard('wool', 'Burnt Hair / Black Ash', 'REAL WOOL (Safe).', 'emerald')}
                    ${renderBurnCard('synthetic', 'Plastic / Hard Bead', 'SYNTHETIC/ACRYLIC (Low Value).', 'amber')}
                    ${renderBurnCard('viscose', 'Burnt Paper / Grey Ash', 'VISCOSE (Fake Sabra).', 'rose')}
                </div>

                <div id="burn-result" class="p-6 rounded-sm border-l-4 border-void-600 bg-void-900 transition-all hidden border border-void-700">
                    <div class="flex items-center gap-3 mb-2">
                        <div id="burn-icon"></div>
                        <h3 class="font-heading text-lg font-bold" id="burn-title">Select Result Above</h3>
                    </div>
                    <p class="text-sm font-mono" id="burn-message"></p>
                </div>

                <!--Section B: Wet Thumb-->
        <div class="p-5 bg-void-900 border border-void-700/50 rounded-sm mt-8 relative overflow-hidden">
            <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.05) 5px, rgba(255,255,255,0.05) 10px);"></div>
            <div class="relative z-10">
                <h3 class="font-heading text-sm font-bold text-white mb-4 uppercase tracking-wider">SECTION B: The Wet Thumb (Sabra Check)</h3>
                <div class="flex items-center justify-between mb-4">
                    <label class="font-mono text-xs font-bold text-zinc-400 uppercase tracking-wide">Feels Slimy/Sticky when wet?</label>

                    <!-- Mechanical Toggle -->
                    <button class="sabra-toggle w-16 h-8 bg-void-800 rounded-sm relative transition-all border border-void-600 focus:outline-none focus:shadow-[0_0_15px_rgba(255,255,255,0.1)]" data-state="false">
                        <span class="toggle-slider absolute top-1 left-1 w-6 h-6 bg-zinc-400 rounded-sm shadow-md transition-all"></span>
                    </button>
                </div>
                <div id="sabra-result" class="p-3 bg-void-950/50 rounded-sm border border-void-800 text-center">
                    <p class="text-[10px] text-void-500 font-mono uppercase tracking-widest">Perform the wet test and toggle above</p>
                </div>
            </div>
        </div>
            </div>
        `;
}

function renderBurnCard(id, description, result, resultColor) {
    // Gradient map based on resultColor
    const bgClass = resultColor === 'emerald' ? 'bg-gradient-to-r from-emerald-500/10 to-zinc-900' :
        resultColor === 'amber' ? 'bg-gradient-to-r from-amber-500/10 to-zinc-900' :
            'bg-gradient-to-r from-rose-500/10 to-zinc-900';

    const borderClass = resultColor === 'emerald' ? 'border-signal-emerald/30' :
        resultColor === 'amber' ? 'border-signal-amber/30' :
            'border-signal-crimson/30';

    return `
        <button class="burn-card w-full p-5 ${bgClass} border ${borderClass} border-l-[4px] border-l-${resultColor}-500 hover:border-${resultColor}-500/60 rounded-sm text-left transition-all active:scale-[0.98] group relative overflow-hidden" data - burn="${id}" data - result="${result}" data - color="${resultColor}" >
                <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px);"></div>
                <div class="flex items-center justify-between relative z-10">
                    <div>
                        <h3 class="font-mono text-xs font-bold text-void-500 uppercase tracking-widest mb-1 group-hover:text-zinc-300 transition-colors">TEST PROTOCOL ${id === 'wool' ? '01' : id === 'synthetic' ? '02' : '03'}</h3>
                        <p class="text-sm text-zinc-300 font-bold group-hover:text-white transition-colors">${description}</p>
                    </div>
                    <div class="text-${resultColor}-500 opacity-0 burn-check transition-all transform scale-90" id="check-${id}">
                        ${ICONS.checkCircle}
                    </div>
                </div>
                <!--Selection Glow(Hidden by default )-->
        <div class="absolute inset-0 bg-${resultColor}-500/5 opacity-0 transition-opacity burn-glow" id="glow-${id}"></div>
            </button>
        `;
}

function renderAgeCheckTab() {
    return `
        <div class="space-y-6 animate-fadeIn" >
                <div class="p-4 bg-signal-crimson/10 border border-signal-crimson/30 rounded-sm relative overflow-hidden">
                    <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.05) 5px, rgba(255,255,255,0.05) 10px);"></div>
                    <h2 class="font-mono text-xs font-bold text-signal-crimson uppercase tracking-widest mb-1">THE ROOT INSPECTION</h2>
                    <p class="text-xs text-zinc-400">Vintage vs. Bleached - Check the fiber roots</p>
                </div>

                <div class="p-6 bg-void-900 border border-void-700 rounded-sm relative overflow-hidden">
                    <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.05) 5px, rgba(255,255,255,0.05) 10px);"></div>
                    <div class="relative z-10">
                        <h3 class="font-heading text-sm font-bold text-white mb-4 uppercase tracking-wider">Visual Verification</h3>
                        <div class="flex items-center justify-between mb-4">
                            <label class="font-mono text-xs font-bold text-zinc-400 uppercase tracking-wide">Roots are LIGHTER than tips?</label>
                            
                            <!-- Mechanical Toggle -->
                            <button class="vintage-toggle w-16 h-8 bg-void-800 rounded-sm relative transition-all border border-void-600 focus:outline-none focus:shadow-[0_0_15px_rgba(255,255,255,0.1)]" data-state="false">
                                <span class="toggle-slider absolute top-1 left-1 w-6 h-6 bg-zinc-400 rounded-sm shadow-md transition-all"></span>
                            </button>
                        </div>
                        <div id="vintage-result" class="p-3 bg-void-950/50 rounded-sm border border-void-800 text-center">
                            <p class="text-[10px] text-void-500 font-mono uppercase tracking-widest">Examine fibers closely and toggle above</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
}

function renderRugsPricingTab() {
    const items = [
        { name: 'Sabra Rug (Cactus Silk)', target: '400-700 DH', scam: '1500-3000 DH' },
        { name: 'Beni Ourain (Wool, Large)', target: '2500-4000 DH', scam: '6000-15000 DH' },
        { name: 'Azilal (Colorful, Med)', target: '1500-2200 DH', scam: '3500-7000 DH' },
        { name: 'Boujaad (Vintage Red)', target: '2000-3000 DH', scam: '5000-9000 DH' },
        { name: 'Kilim / Hanbel (Flat)', target: '300-600 DH', scam: '1000-2000 DH' }
    ];

    if (!isUltimateTierActive()) {
        trackLockImpression('MARKET', 'souk_rugs_pricing_preview');
        return renderSoukPricingLockTable(items, 'souk_rugs_pricing_preview');
    }

    return `
        <div class="space-y-4 animate-fadeIn pb-20" >
            <div class="p-4 bg-signal-crimson/10 border border-signal-crimson/30 rounded-sm relative overflow-hidden">
                <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.05) 5px, rgba(255,255,255,0.05) 10px);"></div>
                <h2 class="font-mono text-xs font-bold text-signal-crimson uppercase tracking-widest mb-1">PRICE DECRYPTOR</h2>
                <p class="text-xs text-zinc-400">Fair market prices vs tourist traps. Green = target range, Red = scam alert.</p>
            </div>

                ${items.map(item => `
                    <div class="grid grid-cols-2 gap-3">
                        <div class="p-4 bg-void-900 border-l-[4px] border-signal-emerald rounded-sm relative overflow-hidden hover:bg-signal-emerald/5 transition-colors">
                            <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(16,185,129,0.1) 2px, rgba(16,185,129,0.1) 4px);"></div>
                            <p class="text-[10px] text-signal-emerald font-mono uppercase tracking-widest mb-2">Target Price</p>
                            <h3 class="font-sans text-xs font-bold text-white uppercase tracking-wider mb-1 opacity-80">${item.name}</h3>
                            <p class="font-mono text-xl font-bold text-emerald-400 tracking-tight">${item.target}</p>
                        </div>
                        <div class="p-4 bg-void-900 border-l-[4px] border-signal-crimson rounded-sm relative overflow-hidden hover:bg-signal-crimson/5 transition-colors">
                            <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(244,63,94,0.1) 2px, rgba(244,63,94,0.1) 4px);"></div>
                            <p class="text-[10px] text-signal-crimson font-mono uppercase tracking-widest mb-2">Tourist Trap</p>
                            <h3 class="font-sans text-xs font-bold text-white uppercase tracking-wider mb-1 opacity-80">${item.name}</h3>
                            <p class="font-mono text-xl font-bold text-signal-crimson tracking-tight">${item.scam}</p>
                        </div>
                    </div>
                `).join('')
        }
            </div>
        `;
}

function attachRugsListeners() {
    document.querySelectorAll('.rugs-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            switchRugsTab(tabName);
        });
    });
}

function attachFiberListeners() {
    // Burn test cards
    document.querySelectorAll('.burn-card').forEach(card => {
        card.addEventListener('click', () => {
            const burn = card.getAttribute('data-burn');
            const result = card.getAttribute('data-result');
            const color = card.getAttribute('data-color');

            document.querySelectorAll('.burn-check').forEach(check => check.classList.add('opacity-0'));
            document.getElementById(`check - ${burn} `).classList.remove('opacity-0');

            const resultBox = document.getElementById('burn-result');
            const icon = document.getElementById('burn-icon');
            const title = document.getElementById('burn-title');
            const message = document.getElementById('burn-message');

            resultBox.classList.remove('hidden');

            if (color === 'emerald') {
                resultBox.className = 'p-6 rounded-sm border-l-4 border-signal-emerald bg-signal-emerald/10 transition-all';
                icon.innerHTML = `<div class="text-emerald-400" > ${ICONS.checkCircle}</div> `;
                title.textContent = 'SAFE';
                title.className = 'font-heading text-lg font-bold text-emerald-400';
            } else if (color === 'amber') {
                resultBox.className = 'p-6 rounded-sm border-l-4 border-signal-amber bg-signal-amber/10 transition-all';
                icon.innerHTML = `<div class="text-signal-amber" > ${ICONS.alert}</div> `;
                title.textContent = 'WARNING';
                title.className = 'font-heading text-lg font-bold text-signal-amber';
            } else {
                resultBox.className = 'p-6 rounded-sm border-l-4 border-signal-crimson bg-signal-crimson/10 transition-all';
                icon.innerHTML = `<div class="text-rose-400" > ${ICONS.xCircle}</div> `;
                title.textContent = 'ALERT';
                title.className = 'font-heading text-lg font-bold text-rose-400';
            }
            message.textContent = `Result: ${result} `;
            message.className = 'text-sm text-zinc-300';
        });
    });

    // Sabra toggle
    const sabraToggle = document.querySelector('.sabra-toggle');
    if (sabraToggle) {
        sabraToggle.addEventListener('click', () => {
            const currentState = sabraToggle.getAttribute('data-state') === 'true';
            const newState = !currentState;
            sabraToggle.setAttribute('data-state', newState);

            const slider = sabraToggle.querySelector('.toggle-slider');
            const resultDiv = document.getElementById('sabra-result');

            if (newState) {
                sabraToggle.classList.add('bg-signal-crimson');
                sabraToggle.classList.remove('bg-void-600');
                slider.style.transform = 'translateX(28px)';
                resultDiv.innerHTML = '<p class="text-sm text-rose-400 font-semibold">? FAKE SABRA (Viscose). Do not wash. Decorative only.</p>';
                resultDiv.className = 'mt-3 p-3 bg-signal-crimson/10 rounded-sm border border-signal-crimson/30';
            } else {
                sabraToggle.classList.remove('bg-signal-crimson');
                sabraToggle.classList.add('bg-void-600');
                slider.style.transform = 'translateX(0)';
                resultDiv.innerHTML = '<p class="text-sm text-emerald-400 font-semibold">? NATURAL FIBER.</p>';
                resultDiv.className = 'mt-3 p-3 bg-signal-emerald/10 rounded-sm border border-signal-emerald/30';
            }
        });
    }
}

function attachAgeCheckListeners() {
    const vintageToggle = document.querySelector('.vintage-toggle');
    if (vintageToggle) {
        vintageToggle.addEventListener('click', () => {
            const currentState = vintageToggle.getAttribute('data-state') === 'true';
            const newState = !currentState;
            vintageToggle.setAttribute('data-state', newState);

            const slider = vintageToggle.querySelector('.toggle-slider');
            const resultDiv = document.getElementById('vintage-result');

            if (newState) {
                vintageToggle.classList.add('bg-signal-crimson');
                vintageToggle.classList.remove('bg-void-600');
                slider.style.transform = 'translateX(28px)';
                resultDiv.innerHTML = '<p class="text-sm text-rose-400 font-semibold">? FAKE VINTAGE. Chemically bleached/washed.</p>';
                resultDiv.className = 'mt-3 p-3 bg-signal-crimson/10 rounded-sm border border-signal-crimson/30';
            } else {
                vintageToggle.classList.remove('bg-signal-crimson');
                vintageToggle.classList.add('bg-void-600');
                slider.style.transform = 'translateX(0)';
                resultDiv.innerHTML = '<p class="text-sm text-emerald-400 font-semibold">? LIKELY VINTAGE. Natural sun fading.</p>';
                resultDiv.className = 'mt-3 p-3 bg-signal-emerald/10 rounded-sm border border-signal-emerald/30';
            }
        });
    }
}

// ---------------------------------------------------------------
// VIEW: METALS PROTOCOL
// ---------------------------------------------------------------

function renderMetalsProtocol() {
    const app = document.getElementById('app');

    const html = `
        <div class="min-h-screen bg-void-950 pb-20" >
            <!--TACTICAL HEADER-->
            <header class="sticky top-0 z-20 bg-void-950/98 backdrop-blur-md border-b border-zinc-500/40 p-4 mb-6 relative overflow-hidden">
                <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(161,161,170,0.15) 2px, rgba(161,161,170,0.15) 4px);"></div>
                
                <div class="relative flex items-center gap-4">
                    <button onclick="window.alidadeApp.navigateTo('SOUK')" class="p-3 rounded-sm bg-void-900 border border-zinc-500/30 hover:bg-zinc-500/20 hover:border-zinc-400/60 transition-all active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center">
                        ${ICONS.arrowLeft}
                    </button>
                    <div class="flex-1">
                        <p class="text-[10px] text-zinc-400 tracking-[0.25em] uppercase font-mono mb-0.5">Alloy Analysis</p>
                        <div class="flex items-center gap-2">
                            <span class="text-void-500/60 font-mono text-lg">[</span>
                            <h1 class="font-sans text-xl font-bold text-white uppercase tracking-wider">METALS PROTOCOL</h1>
                            <span class="text-void-500/60 font-mono text-lg">]</span>
                        </div>
                    </div>
                </div>
            </header>

            <div class="px-4">
                <!-- TACTICAL TAB BAR -->
                <div class="mb-6">
                    <div class="h-[1px] bg-void-800 mb-3"></div>
                    <div class="flex gap-2">
                        <button class="metals-tab flex-1 px-4 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-void-900 text-zinc-400 border border-void-600 transition-all hover:border-zinc-400/50 hover:text-zinc-300" data-tab="material">
                            MATERIAL ID
                        </button>
                        <button class="metals-tab flex-1 px-4 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-void-900 text-zinc-400 border border-void-600 transition-all hover:border-zinc-400/50 hover:text-zinc-300" data-tab="quality">
                            QUALITY
                        </button>
                        <button class="metals-tab flex-1 px-4 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-void-900 text-zinc-400 border border-void-600 transition-all hover:border-zinc-400/50 hover:text-zinc-300" data-tab="pricing">
                            PRICING
                        </button>
                    </div>
                </div>

                <!-- TAB CONTENT -->
                <div id="metals-content"></div>
            </div>
        </div>
        `;

    app.innerHTML = html;
    switchMetalsTab('material');
    attachMetalsListeners();
}

function switchMetalsTab(tabName) {
    document.querySelectorAll('.metals-tab').forEach(tab => {
        tab.className = "metals-tab flex-1 px-4 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-void-900 text-zinc-400 border border-void-600 transition-all";
        if (tab.getAttribute('data-tab') === tabName) {
            tab.className = "metals-tab flex-1 px-4 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-zinc-300 text-zinc-950 border-2 border-zinc-200 shadow-[0_0_20px_rgba(161,161,170,0.25)] transition-all";
        }
    });

    const content = document.getElementById('metals-content');
    switch (tabName) {
        case 'material':
            content.innerHTML = renderMaterialTab();
            attachMaterialListeners();
            break;
        case 'quality':
            content.innerHTML = renderQualityTab();
            attachQualityListeners();
            break;
        case 'pricing':
            content.innerHTML = renderMetalsPricingTab();
            break;
    }
}

function renderMaterialTab() {
    return `
        <div class="space-y-6" >
                <!--Section A: Magnet Trap-->
                <div class="p-5 bg-void-900 border border-void-700/50 rounded-sm relative overflow-hidden">
                    <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.05) 5px, rgba(255,255,255,0.05) 10px);"></div>
                    <div class="relative z-10">
                        <h3 class="font-heading text-base font-bold text-white mb-3">SECTION A: The Magnet Trap</h3>
                        <div class="flex items-center justify-between mb-2">
                            <label class="font-mono text-sm font-semibold text-zinc-300">Does Magnet Stick?</label>
                            <button class="magnet-toggle w-14 h-7 rounded-sm transition-all relative bg-void-600" data-state="false">
                                <span class="toggle-slider absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-sm transition-all"></span>
                            </button>
                        </div>
                        <div id="magnet-result" class="mt-3 p-3 bg-void-950/50 rounded-sm border border-void-700/50">
                            <p class="text-xs text-void-500 font-mono">Test with magnet and toggle above</p>
                        </div>
                    </div>
                </div>

                <!--Section B: Scratch Test-->
        <div class="p-5 bg-void-900 border border-void-700/50 rounded-sm relative overflow-hidden">
            <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.05) 5px, rgba(255,255,255,0.05) 10px);"></div>
            <div class="relative z-10">
                <h3 class="font-heading text-base font-bold text-white mb-3">SECTION B: The Scratch Test (Silver/Maillechort)</h3>
                <div class="flex items-center justify-between mb-2">
                    <label class="font-mono text-sm font-semibold text-zinc-300">Scratch reveals Yellow Core?</label>
                    <button class="scratch-toggle w-14 h-7 rounded-sm transition-all relative bg-void-600" data-state="false">
                        <span class="toggle-slider absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-sm transition-all"></span>
                    </button>
                </div>
                <div id="scratch-result" class="mt-3 p-3 bg-void-950/50 rounded-sm border border-void-700/50">
                    <p class="text-xs text-void-500 font-mono">Perform scratch test and toggle above</p>
                </div>
            </div>
        </div>
            </div>
        `;
}

function renderQualityTab() {
    return `
        <div class="space-y-6" >
                <div class="p-4 bg-zinc-500/10 border border-zinc-500/30 rounded-sm relative overflow-hidden">
                    <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.05) 5px, rgba(255,255,255,0.05) 10px);"></div>
                    <h2 class="font-heading text-lg font-bold text-zinc-400 mb-2">THE HAMMER AUDIT</h2>
                    <p class="text-sm text-zinc-400">Handmade vs. Machine Made</p>
                </div>

                <div class="p-5 bg-void-900 border border-void-700/50 rounded-sm relative overflow-hidden">
                     <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px);"></div>
                    <h3 class="font-heading text-base font-bold text-white mb-3 relative z-10">Surface Inspection</h3>
                    <div class="flex items-center justify-between mb-2 relative z-10">
                        <label class="font-mono text-sm font-semibold text-zinc-300">Surface is perfectly smooth/uniform?</label>
                        <button class="hammer-toggle w-14 h-7 rounded-sm transition-all relative bg-void-600" data-state="false">
                            <span class="toggle-slider absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-sm transition-all"></span>
                        </button>
                    </div>
                    <div id="hammer-result" class="mt-3 p-3 bg-void-950/50 rounded-sm border border-void-700/50 relative z-10">
                        <p class="text-xs text-void-500 font-mono">Examine surface and toggle above</p>
                    </div>
                </div>
            </div>
        `;
}

function renderMetalsPricingTab() {
    const items = [
        { name: 'Small Lantern (Brass)', target: '100-200 DH', scam: '300-500 DH' },
        { name: 'Floor Lamp (Lg, Chiseled)', target: '1500-3000 DH', scam: '3000-5000 DH' },
        { name: 'Teapot (Small, Maillechort)', target: '150-200 DH', scam: '400-600 DH' },
        { name: 'Teapot (Large, Maillechort)', target: '300-500 DH', scam: '800-1200 DH' }
    ];

    if (!isUltimateTierActive()) {
        trackLockImpression('MARKET', 'souk_metals_pricing_preview');
        return renderSoukPricingLockTable(items, 'souk_metals_pricing_preview');
    }

    return `
        <div class="space-y-4" >
            <div class="p-4 bg-zinc-500/10 border border-zinc-500/30 rounded-sm relative overflow-hidden">
                <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.05) 5px, rgba(255,255,255,0.05) 10px);"></div>
                <h2 class="font-heading text-lg font-bold text-zinc-400 mb-2">PRICE DECRYPTOR</h2>
                <p class="text-sm text-zinc-400">Fair market prices vs tourist traps. Green = target range, Red = scam alert.</p>
            </div>

                ${items.map(item => `
                    <div class="grid grid-cols-2 gap-3">
                        <div class="p-4 bg-void-900 border-l-4 border-signal-emerald rounded-sm relative overflow-hidden">
                            <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(16,185,129,0.1) 2px, rgba(16,185,129,0.1) 4px);"></div>
                            <p class="text-xs text-void-500 font-mono uppercase tracking-wide mb-1">Target Price</p>
                            <h3 class="font-heading text-sm font-bold text-white mb-2">${item.name}</h3>
                            <p class="font-mono text-2xl font-bold text-emerald-400">${item.target}</p>
                        </div>
                        <div class="p-4 bg-void-900 border-l-4 border-signal-crimson rounded-sm relative overflow-hidden">
                            <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(244,63,94,0.1) 2px, rgba(244,63,94,0.1) 4px);"></div>
                            <p class="text-xs text-void-500 font-mono uppercase tracking-wide mb-1">? Tourist Trap</p>
                            <h3 class="font-heading text-sm font-bold text-white mb-2">${item.name}</h3>
                            <p class="font-mono text-2xl font-bold text-rose-400">${item.scam}</p>
                        </div>
                    </div>
                `).join('')
        }
            </div>
        `;
}

function attachMetalsListeners() {
    document.querySelectorAll('.metals-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            switchMetalsTab(tabName);
        });
    });
}

function attachMaterialListeners() {
    // Magnet toggle
    const magnetToggle = document.querySelector('.magnet-toggle');
    if (magnetToggle) {
        magnetToggle.addEventListener('click', () => {
            const currentState = magnetToggle.getAttribute('data-state') === 'true';
            const newState = !currentState;
            magnetToggle.setAttribute('data-state', newState);

            const slider = magnetToggle.querySelector('.toggle-slider');
            const resultDiv = document.getElementById('magnet-result');

            if (newState) {
                magnetToggle.classList.add('bg-signal-crimson');
                magnetToggle.classList.remove('bg-void-600');
                slider.style.transform = 'translateX(28px)';
                resultDiv.innerHTML = '<p class="text-sm text-rose-400 font-semibold">? IRON (Fake). Will rust quickly.</p>';
                resultDiv.className = 'mt-3 p-3 bg-signal-crimson/10 rounded-sm border border-signal-crimson/30';
            } else {
                magnetToggle.classList.remove('bg-signal-crimson');
                magnetToggle.classList.add('bg-void-600');
                slider.style.transform = 'translateX(0)';
                resultDiv.innerHTML = '<p class="text-sm text-emerald-400 font-semibold">? NON-FERROUS (Brass/Copper/Silver). Good.</p>';
                resultDiv.className = 'mt-3 p-3 bg-signal-emerald/10 rounded-sm border border-signal-emerald/30';
            }
        });
    }

    // Scratch toggle
    const scratchToggle = document.querySelector('.scratch-toggle');
    if (scratchToggle) {
        scratchToggle.addEventListener('click', () => {
            const currentState = scratchToggle.getAttribute('data-state') === 'true';
            const newState = !currentState;
            scratchToggle.setAttribute('data-state', newState);

            const slider = scratchToggle.querySelector('.toggle-slider');
            const resultDiv = document.getElementById('scratch-result');

            if (newState) {
                scratchToggle.classList.add('bg-signal-amber');
                scratchToggle.classList.remove('bg-void-600');
                slider.style.transform = 'translateX(28px)';
                resultDiv.innerHTML = '<p class="text-sm text-signal-amber font-semibold">[WARN] PLATED BRASS. Not solid silver.</p>';
                resultDiv.className = 'mt-3 p-3 bg-signal-amber/10 rounded-sm border border-signal-amber/30';
            } else {
                scratchToggle.classList.remove('bg-signal-amber');
                scratchToggle.classList.add('bg-void-600');
                slider.style.transform = 'translateX(0)';
                resultDiv.innerHTML = '<p class="text-sm text-emerald-400 font-semibold">? SOLID ALLOY (Maillechort). Good.</p>';
                resultDiv.className = 'mt-3 p-3 bg-signal-emerald/10 rounded-sm border border-signal-emerald/30';
            }
        });
    }
}

function attachQualityListeners() {
    const hammerToggle = document.querySelector('.hammer-toggle');
    if (hammerToggle) {
        hammerToggle.addEventListener('click', () => {
            const currentState = hammerToggle.getAttribute('data-state') === 'true';
            const newState = !currentState;
            hammerToggle.setAttribute('data-state', newState);

            const slider = hammerToggle.querySelector('.toggle-slider');
            const resultDiv = document.getElementById('hammer-result');

            if (newState) {
                hammerToggle.classList.add('bg-signal-amber');
                hammerToggle.classList.remove('bg-void-600');
                slider.style.transform = 'translateX(28px)';
                resultDiv.innerHTML = '<p class="text-sm text-signal-amber font-semibold">[WARN] MACHINE MADE. Lower value.</p>';
                resultDiv.className = 'mt-3 p-3 bg-signal-amber/10 rounded-sm border border-signal-amber/30';
            } else {
                hammerToggle.classList.remove('bg-signal-amber');
                hammerToggle.classList.add('bg-void-600');
                slider.style.transform = 'translateX(0)';
                resultDiv.innerHTML = '<p class="text-sm text-emerald-400 font-semibold">[GOOD] HAND MADE. Visible \'bruises\' and irregularities.</p>';
                resultDiv.className = 'mt-3 p-3 bg-signal-emerald/10 rounded-sm border border-signal-emerald/30';
            }
        });
    }
}

// ---------------------------------------------------------------
// FORENSICS LAB - REFACTORED WITH TACTICAL OS STYLING
// ---------------------------------------------------------------
// ---------------------------------------------------------------
// FORENSICS LAB - REFACTORED WITH PROTOCOL-7 OPTIMIZATION
// ---------------------------------------------------------------
function renderForensicsModule() {
    const app = document.getElementById('app');
    const html = `
        <div class="min-h-screen bg-void-950 pb-20 relative" >
        <!--GLOBAL GRID BACKGROUND-->
        <div class="fixed inset-0 pointer-events-none opacity-[0.02] bg-grid-pattern"></div>

        <!--TACTICAL HEADER-->
        <header class="sticky top-0 z-20 bg-void-950 border-b border-white/5 p-4 mb-6 relative overflow-hidden shadow-sm">
            <div class="relative flex items-center gap-4">
                <button onclick="window.alidadeApp.navigateTo('SOUK')" class="p-3 rounded-sm bg-void-900 border border-void-700 hover:bg-void-800 hover:border-zinc-500 transition-all active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center group">
                    <span class="text-zinc-400 group-hover:text-white transition-colors">${ICONS.arrowLeft}</span>
                </button>
                <div class="flex-1">
                    <p class="text-[10px] text-signal-emerald tracking-[0.25em] uppercase font-mono mb-0.5">Full Spectrum Analysis</p>
                    <div class="flex items-center gap-2">
                        <span class="text-void-600 font-mono text-lg">[</span>
                        <h1 class="font-sans text-xl font-bold text-white uppercase tracking-wider">FORENSICS LAB</h1>
                        <span class="text-void-600 font-mono text-lg">]</span>
                    </div>
                </div>
            </div>
        </header>

        <div class="px-4 relative z-10">
            <!-- TACTICAL SCROLL TABS -->
            <div class="mb-6 overflow-x-auto no-scrollbar pb-2">
                <div id="forensic-tabs-container" class="flex gap-2">
                    <button id="tab-argan" data-target="argan" class="forensic-tab px-5 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-void-900 text-zinc-500 border border-void-700 hover:text-zinc-300 hover:border-zinc-500 transition-all whitespace-nowrap">ARGAN</button>
                    <button id="tab-saffron" data-target="saffron" class="forensic-tab px-5 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-void-900 text-zinc-500 border border-void-700 hover:text-zinc-300 hover:border-zinc-500 transition-all whitespace-nowrap">SAFFRON</button>
                    <button id="tab-rose" data-target="rose" class="forensic-tab px-5 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-void-900 text-zinc-500 border border-void-700 hover:text-zinc-300 hover:border-zinc-500 transition-all whitespace-nowrap">ROSE</button>
                    <button id="tab-rugs" data-target="rugs" class="forensic-tab px-5 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-void-900 text-zinc-500 border border-void-700 hover:text-zinc-300 hover:border-zinc-500 transition-all whitespace-nowrap">RUGS</button>
                    <button id="tab-leather" data-target="leather" class="forensic-tab px-5 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-void-900 text-zinc-500 border border-void-700 hover:text-zinc-300 hover:border-zinc-500 transition-all whitespace-nowrap">LEATHER</button>
                    <button id="tab-metals" data-target="metals" class="forensic-tab px-5 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-void-900 text-zinc-500 border border-void-700 hover:text-zinc-300 hover:border-zinc-500 transition-all whitespace-nowrap">SILVER</button>
                    <button id="tab-ceramics" data-target="ceramics" class="forensic-tab px-5 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-void-900 text-zinc-500 border border-void-700 hover:text-zinc-300 hover:border-zinc-500 transition-all whitespace-nowrap">CERAMICS</button>
                </div>
            </div>
            <div id="forensic-display" class="space-y-4"></div>
        </div>
    </div>
        `;
    app.innerHTML = html;
    // EVENT DELEGATION: Attach ONE listener to parent container
    const tabsContainer = document.getElementById('forensic-tabs-container');
    tabsContainer.addEventListener('click', function (e) {
        const targetTab = e.target.closest('.forensic-tab');
        if (targetTab) {
            const testId = targetTab.getAttribute('data-target');
            switchForensicTab(testId);
        }
    });
    // ? PRIORITY 3: Load saved forensics tab state
    const forensicsState = appState.getModule('forensics');
    const savedForensicTab = forensicsState.currentTab || 'argan';
    switchForensicTab(savedForensicTab);
}
// --- HELPER: TAB SWITCHER (ELITE TIER) ---
function switchForensicTab(type) {
    // 1. Persist State
    appState.setModule('forensics', { currentTab: type });

    // 2. Theme & Content Configuration (The "Brain")
    const themes = {
        argan: { color: 'emerald', hex: '#10b981', icon: 'A' },
        saffron: { color: 'purple', hex: '#a855f7', icon: 'S' },
        rose: { color: 'rose', hex: '#f43f5e', icon: 'R' },
        rugs: { color: 'amber', hex: '#f59e0b', icon: 'U' },
        leather: { color: 'orange', hex: '#f97316', icon: 'L' },
        metals: { color: 'slate', hex: '#94a3b8', icon: 'M' },
        ceramics: { color: 'blue', hex: '#3b82f6', icon: 'C' }
    };

    const protocols = {
        argan: {
            title: "THE GOLDEN RULE",
            desc: "Never buy clear bottles. Light kills Argan. <span class='text-white font-bold'>Only dark glass.</span>",
            tests: [
                { id: "T01", title: "OLFACTORY", label: "Smell: Nutty/Earthy?", hint: "If roasting smell = Culinary (Not for face). If odorless = Industrial fake." },
                { id: "T02", title: "DERMAL", label: "Skin: Absorbs Instantly?", hint: "Real Argan vanishes. Fake stays greasy/sticky (Paraffin)." },
                { id: "T03", title: "HYDROPHOBIC", label: "Water: Floats Cohesively?", hint: "It should float in a tight bead. If it disperses = Fake." }
            ]
        },
        saffron: {
            title: "THE COLD WATER PROTOCOL",
            desc: "Drop ONE thread in cold water. Wait 2 minutes.",
            tests: [
                { id: "T01", title: "CHROMATOGRAPHY", label: "Color: Turns Yellow SLOWLY?", hint: "Real Saffron takes time. Fake (Dye) turns water red instantly." },
                { id: "T02", title: "PIGMENT", label: "Thread: Stays Red?", hint: "If thread turns white/pale = Corn Silk (Fake)." }
            ]
        },
        rose: {
            title: "THE SHAKE DOWN",
            desc: "Shake the bottle violently for 15 seconds.",
            tests: [
                { id: "T01", title: "SURFACTANT", label: "Foam: Bubbles Vanish Instantly?", hint: "If thick foam stays for 30s+ = Synthetic Soap/Detergent." },
                { id: "T02", title: "OLFACTORY", label: "Smell: Earthy/Damp?", hint: "Real Rose H2O smells like wet garden. Sweet candy smell = Fake." }
            ]
        },
        rugs: {
            title: "THE WEAVE CHECK",
            desc: "Authentic Moroccan rugs have irregular patterns and hand-tied knots.",
            tests: [
                { id: "T01", title: "KNOT PATTERN", label: "Knots: Hand-Tied & Irregular?", hint: "Machine-made rugs have perfect, uniform knots. Real ones vary." },
                { id: "T02", title: "SYMMETRY", label: "Pattern: Slight Asymmetry?", hint: "Handmade rugs are never perfectly symmetrical. Perfect = Factory." },
                { id: "T03", title: "BACKING", label: "Back: Same Quality as Front?", hint: "Cheap rugs hide mesh backing. Real rugs show clean knots on both sides." }
            ]
        },
        leather: {
            title: "THE CAMEL LEATHER TEST",
            desc: "Real camel leather is soft, has natural grain, and ages beautifully.",
            tests: [
                { id: "T01", title: "OLFACTORY", label: "Smell: Natural & Earthy?", hint: "Synthetic leather smells like plastic/chemicals. Real = musky earth." },
                { id: "T02", title: "TEXTURE", label: "Grain: Unique Texture & Pores?", hint: "Fake leather has uniform stamped patterns. Real shows natural variation." },
                { id: "T03", title: "HYDROPHILIC", label: "Water Drop: Absorbs Slowly?", hint: "Real leather absorbs water over time. Synthetic beads up instantly." }
            ]
        },
        metals: {
            title: "THE SILVER AUTHENTICITY TEST",
            desc: "Real Moroccan silver is 925 Sterling or higher. Beware of nickel alloys.",
            tests: [
                { id: "T01", title: "HALLMARK", label: "Stamp: \"925\" or Berber Mark?", hint: "Authentic silver has hallmarks. No stamp = likely plated or fake." },
                { id: "T02", title: "MAGNETIC", label: "Magnet Test: Not Magnetic?", hint: "Real silver is NOT magnetic. If it sticks = nickel/iron mix." },
                { id: "T03", title: "DENSITY", label: "Weight: Feels Heavy?", hint: "Sterling silver is dense and heavy. Aluminum alloys = suspiciously light." }
            ]
        },
        ceramics: {
            title: "THE POTTERY AUTHENTICITY CHECK",
            desc: "Authentic Moroccan ceramics are hand-painted with natural glazes.",
            tests: [
                { id: "T01", title: "ARTISAN", label: "Paint: Hand-Painted Irregularities?", hint: "Machine-printed designs are perfect. Hand-painted shows slight variations." },
                { id: "T02", title: "GLAZE", label: "Base: Unglazed & Rough?", hint: "Authentic pottery leaves the base unglazed (terracotta texture)." },
                { id: "T03", title: "DENSITY", label: "Weight: Feels Solid & Heavy?", hint: "Traditional ceramics use thick clay. Cheap tourist pieces = thin & light." }
            ]
        }
    };

    const activeTheme = themes[type];
    const content = protocols[type];

    // 3. Update Visuals
    document.querySelectorAll('.forensic-tab').forEach(btn => {
        btn.className = "forensic-tab relative px-5 py-2.5 min-h-[44px] rounded-sm text-xs font-mono font-bold tracking-wider bg-void-900/80 text-zinc-500 border border-void-700/50 transition-all duration-300 whitespace-nowrap overflow-hidden group hover:border-zinc-500/30 hover:text-zinc-300";
    });

    const activeBtn = document.getElementById(`tab - ${type} `);
    if (activeBtn) {
        // Elite Active State
        activeBtn.className = `forensic - tab relative px - 5 py - 2.5 min - h - [44px] rounded - sm text - xs font - mono font - bold tracking - wider bg - void -800 text - white border - b - 2 border - b - ${activeTheme.color} -500 border - t border - t - void -700 border - x border - x - void -700 transition - all duration - 300 whitespace - nowrap shadow - [0_4px_20px_ - 8px_${activeTheme.shadow}]`;
    }

    // 4. Render Content (Data-Driven Injection)
    const container = document.getElementById('forensic-display');

    // Generate Briefing Card
    let html = `
        <div class="relative p-6 bg-gradient-to-br from-void-900 to-void-950 border-l-[3px] border-${activeTheme.color}-500 mb-6 rounded-sm shadow-lg overflow-hidden group hover:shadow-${activeTheme.color}-500/10 transition-shadow duration-500" >
            <div class="absolute inset-0 opacity-[0.03] bg-grid-pattern"></div>
            <div class="absolute right-0 top-0 p-4 opacity-10 text-${activeTheme.color}-500 text-6xl font-black select-none pointer-events-none transform translate-x-4 -translate-y-2">${activeTheme.icon}</div>
            <div class="relative z-10">
                <div class="flex items-center gap-2 mb-2">
                    <span class="w-1.5 h-1.5 rounded-full bg-${activeTheme.color}-500 animate-pulse"></span>
                    <h3 class="font-bold text-${activeTheme.color}-400 text-xs tracking-[0.25em] uppercase font-mono">PROTOCOL: ${activeTheme.color.toUpperCase()}</h3>
                </div>
                <h2 class="font-bold text-white text-lg mb-2 tracking-wide font-sans">${content.title}</h2>
                <p class="text-xs text-zinc-400 leading-relaxed font-mono border-l border-void-700 pl-3">${content.desc}</p>
            </div>
        </div>
        `;

    const hasUltimateForensics = isUltimateTierActive();
    if (!hasUltimateForensics) {
        const lockSource = `souk_forensics_${type}_preview`;
        trackLockImpression('PRODUCT_FORENSICS', lockSource);
        html += renderSoukClassifiedPreviewCard({
            source: lockSource,
            feature: 'PRODUCT_FORENSICS',
            body: 'Full Chemical Analysis & 5-Step Verification Protocol restricted to Operatives.',
            cta: 'UNLOCK LAB PROTOCOLS'
        });
        container.innerHTML = html;
        return;
    }

    // Generate Test Cards
    content.tests.forEach(test => {
        html += `
        <div class="group relative bg-void-900/40 border border-void-800 rounded-sm overflow-hidden mb-3 hover:border-${activeTheme.color}-500/40 hover:bg-void-900/60 transition-all duration-300 shadow-sm hover:shadow-[0_4px_20px_-10px_${activeTheme.shadow}] backdrop-blur-sm" >
                <!--Header -->
                <div class="relative flex items-center justify-between px-4 py-3 bg-white/5 border-b border-void-800/50 group-hover:border-${activeTheme.color}-500/20 transition-colors">
                    <div class="flex items-center gap-3">
                        <span class="text-[9px] font-mono font-bold text-zinc-600 bg-void-950 px-1.5 py-0.5 rounded border border-void-800 group-hover:border-${activeTheme.color}-500/30 group-hover:text-${activeTheme.color}-400 transition-colors">${test.id}</span>
                        <span class="text-[10px] font-mono font-bold text-zinc-400 tracking-[0.2em] uppercase group-hover:text-white transition-colors">${test.title}</span>
                    </div>
                    <span class="status-badge text-[9px] font-mono text-void-600 group-hover:text-zinc-500 transition-colors">STANDBY</span>
                </div>
                <!--Body -->
        <div class="relative p-5">
            <div class="flex items-center justify-between mb-4">
                <label class="font-mono text-sm font-bold text-zinc-200 tracking-wide group-hover:text-white transition-colors decoration-slice">${test.label}</label>
                <!-- Tactical Toggle -->
                <button class="lab-toggle w-12 h-6 rounded-full transition-all duration-300 relative bg-void-800 border border-void-600 group-hover:border-zinc-500 overflow-hidden shadow-inner">
                    <span class="absolute top-0.5 left-0.5 w-5 h-5 bg-zinc-400 rounded-full transition-all duration-300 shadow-sm z-10"></span>
                    <div class="absolute inset-0 bg-signal-emerald opacity-0 transition-opacity duration-300"></div>
                </button>
            </div>
            <p class="text-xs text-zinc-500 leading-relaxed mb-2 font-mono group-hover:text-zinc-400 transition-colors">${test.hint}</p>
            <div class="result-feedback hidden"></div>
        </div>
            </div>
        `;
    });

    container.innerHTML = html;

    // 5. Initialize Listeners
    attachToggleListeners();
}

// --- HELPER: TOGGLE LOGIC WITH EVENT DELEGATION (REFINED) ---
function attachToggleListeners() {
    const displayContainer = document.getElementById('forensic-display');
    if (!displayContainer) return;

    // Clone to strip old listeners
    const newContainer = displayContainer.cloneNode(true);
    displayContainer.parentNode.replaceChild(newContainer, displayContainer);

    newContainer.addEventListener('click', function (e) {
        const toggleBtn = e.target.closest('.lab-toggle');
        if (toggleBtn) {
            toggleResult(toggleBtn);
        }
    });
}

function toggleResult(btn) {
    const isChecked = btn.classList.contains('active-state');
    const slider = btn.querySelector('span');
    const sliderBg = btn.querySelector('div'); // The background fill
    const feedback = btn.parentElement.parentElement.querySelector('.result-feedback');
    const cardRoot = btn.closest('.group');
    const statusBadge = cardRoot ? cardRoot.querySelector('.status-badge') : null;

    if (!isChecked) {
        // TURN ON (VERIFIED)
        btn.classList.add('active-state', 'border-emerald-400', 'ring-1', 'ring-emerald-500/50');
        btn.classList.remove('bg-void-800', 'border-void-600');

        slider.style.transform = 'translateX(24px)';
        slider.style.backgroundColor = '#ffffff'; // Flash white
        sliderBg.classList.remove('opacity-0'); // Show green bg

        feedback.textContent = "> VERIFIED: AUTHENTICITY CONFIRMED";
        feedback.className = "result-feedback mt-3 p-3 rounded-sm text-[10px] font-mono font-bold tracking-wider text-center bg-signal-emerald/10 text-emerald-400 border border-signal-emerald/30 animate-in fade-in slide-in-from-top-1";
        feedback.classList.remove('hidden');

        if (statusBadge) {
            statusBadge.textContent = "VERIFIED";
            statusBadge.className = "status-badge text-[9px] font-mono text-signal-emerald font-bold tracking-wider shadow-emerald-500/20 drop-shadow-sm";
        }
    } else {
        // TURN OFF (STANDBY)
        btn.classList.remove('active-state', 'border-emerald-400', 'ring-1', 'ring-emerald-500/50');
        btn.classList.add('bg-void-800', 'border-void-600');

        slider.style.transform = 'translateX(0px)';
        slider.style.backgroundColor = ''; // Reset
        sliderBg.classList.add('opacity-0'); // Hide green bg

        feedback.classList.add('hidden');

        if (statusBadge) {
            statusBadge.textContent = "STANDBY";
            statusBadge.className = "status-badge text-[9px] font-mono text-void-600 transition-colors";
        }
    }
}
// ---------------------------------------------------------------
// VIEW: TRANSPORT SHIELD (Logistics Protocol) - UPGRADED WITH SHADOW METER
// ---------------------------------------------------------------

// Shadow Meter State Variables
let meterInterval = null;
let currentPosition = null;
let startPosition = null;
let startTime = null;
let isMeterRunning = false;
let isNightMode = false;
let totalDistance = 0; // in km
let elapsedTime = 0; // in minutes
let currentFare = 7.50; // minimum fare in DH
let watchId = null;

// Haversine distance calculation (in kilometers)
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Calculate taxi fare based on distance, time, and night mode
function calculateTaxiFare(distKm, timeMin, isNight) {
    let fare = 7.00 + (8.00 * distKm) + (0.50 * timeMin);
    if (isNight) {
        fare *= 1.5;
    }
    return Math.max(fare, 7.50);
}

// Start the shadow meter with GPS tracking
function startShadowMeter() {
    if (!ensureBasicFeatureAuth({
        source: 'transport_shadow_meter_auth_gate',
        title: 'Authenticate To Continue',
        copy: 'Registration is required before your first Shadow Meter run. Sign in to unlock live taxi auditing.',
        meta: 'Sign in once to activate Shadow Meter on this profile.'
    })) {
        return;
    }

    if (isMeterRunning) return;
    if (!navigator.geolocation) {
        alert("GPS not available. Enable location services.");
        return;
    }

    totalDistance = 0;
    elapsedTime = 0;
    startTime = Date.now();
    isMeterRunning = true;

    navigator.geolocation.getCurrentPosition((position) => {
        startPosition = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
        };
        currentPosition = { ...startPosition };

        watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const newPos = {
                    lat: pos.coords.latitude,
                    lon: pos.coords.longitude
                };
                if (currentPosition) {
                    const dist = haversineDistance(
                        currentPosition.lat, currentPosition.lon,
                        newPos.lat, newPos.lon
                    );
                    totalDistance += dist;
                }
                currentPosition = newPos;
                updateMeterUI();
            },
            (error) => {
                console.error("GPS Error:", error);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 10000,
                timeout: 5000
            }
        );
    }, (error) => {
        console.error("GPS Initial Error:", error);
        isMeterRunning = false;
    });

    meterInterval = setInterval(() => {
        if (isMeterRunning) {
            elapsedTime = Math.floor((Date.now() - startTime) / 60000);
            updateMeterUI();
        }
    }, 1000);

    updateMeterUI();
}

// Stop the shadow meter
function stopShadowMeter() {
    if (!isMeterRunning) return;
    isMeterRunning = false;

    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }

    if (meterInterval !== null) {
        clearInterval(meterInterval);
        meterInterval = null;
    }

    updateMeterUI();
}

// Toggle night mode
function toggleNightMode() {
    isNightMode = !isNightMode;
    updateMeterUI();
}

// Update the meter UI with current values
function updateMeterUI() {
    currentFare = calculateTaxiFare(totalDistance, elapsedTime, isNightMode);

    const fareDisplay = document.getElementById('meter-fare-display');
    const distanceDisplay = document.getElementById('meter-distance');
    const timeDisplay = document.getElementById('meter-time');
    const nightToggle = document.getElementById('night-mode-toggle');
    const startBtn = document.getElementById('start-meter-btn');
    const stopBtn = document.getElementById('stop-meter-btn');
    const statusDisplay = document.getElementById('meter-status');

    if (fareDisplay) {
        fareDisplay.textContent = `${currentFare.toFixed(2)} DH`;
    }

    if (distanceDisplay) {
        distanceDisplay.textContent = `${totalDistance.toFixed(2)} Km`;
    }

    if (timeDisplay) {
        timeDisplay.textContent = `${elapsedTime} Min`;
    }

    if (nightToggle) {
        nightToggle.textContent = isNightMode ? ' NIGHT MODE (+50%)' : ' DAY MODE';
        nightToggle.className = isNightMode ?
            'w-full px-4 py-3 rounded-[2px] font-mono text-sm font-bold border transition-all ' +
            'bg-signal-amber/20 border-signal-amber/40 text-amber-300 hover:bg-signal-amber/30' :
            'w-full px-4 py-3 rounded-[2px] font-mono text-sm font-bold border transition-all ' +
            'bg-blue-500/20 border-blue-500/40 text-blue-300 hover:bg-blue-500/30';
    }

    if (startBtn) {
        startBtn.disabled = isMeterRunning;
        startBtn.className = isMeterRunning ?
            'px-4 py-3 rounded-[2px] font-mono text-sm font-bold border transition-all ' +
            'bg-void-700/50 border-void-600 text-zinc-500 cursor-not-allowed' :
            'px-4 py-3 rounded-[2px] font-mono text-sm font-bold border transition-all ' +
            'bg-signal-emerald/20 border-signal-emerald/40 text-emerald-300 hover:bg-signal-emerald/30';
    }

    if (stopBtn) {
        stopBtn.disabled = !isMeterRunning;
        stopBtn.className = !isMeterRunning ?
            'px-4 py-3 rounded-[2px] font-mono text-sm font-bold border transition-all ' +
            'bg-void-700/50 border-void-600 text-zinc-500 cursor-not-allowed' :
            'px-4 py-3 rounded-[2px] font-mono text-sm font-bold border transition-all ' +
            'bg-red-500/20 border-red-500/40 text-red-300 hover:bg-red-500/30';
    }

    if (statusDisplay) {
        statusDisplay.textContent = isMeterRunning ? 'RUNNING' : 'STOPPED';
        statusDisplay.className = isMeterRunning ?
            'text-xs font-mono text-emerald-400' :
            'text-xs font-mono text-zinc-500';
    }

    // Update fare breakdown
    const distanceCost = document.getElementById('distance-cost');
    const timeCost = document.getElementById('time-cost');
    const nightSurcharge = document.getElementById('night-surcharge');
    const totalFare = document.getElementById('total-fare');

    if (distanceCost) {
        distanceCost.textContent = `${(8.00 * totalDistance).toFixed(2)} DH`;
    }
    if (timeCost) {
        timeCost.textContent = `${(0.50 * elapsedTime).toFixed(2)} DH`;
    }
    if (nightSurcharge) {
        const baseFare = 7.00 + (8.00 * totalDistance) + (0.50 * elapsedTime);
        const surcharge = isNightMode ? baseFare * 0.5 : 0;
        nightSurcharge.textContent = `${surcharge.toFixed(2)} DH`;
    }
    if (totalFare) {
        totalFare.textContent = `${currentFare.toFixed(2)} DH`;
    }
}

// Attach functions to window object for IIFE access
window.startShadowMeter = startShadowMeter;
window.stopShadowMeter = stopShadowMeter;
window.toggleNightMode = toggleNightMode;
window.updateMeterUI = updateMeterUI;

function renderTransportShield() {
    const app = document.getElementById('app');

    const html = `
        <div class="min-h-screen bg-void-950 pb-6">
                <!-- HEADER -->
                <header class="sticky top-0 z-20 bg-void-950/95 backdrop-blur-sm border-b border-teal-500/20 p-4 mb-4">
                    <div class="flex items-center gap-3 mb-2">
                        <button onclick="window.alidadeApp.navigateTo('HOME')" class="p-2 rounded-[2px] bg-void-900/60 border border-void-800 hover:bg-teal-500/10 hover:border-teal-500/30 transition-all active:scale-95">
                            ${ICONS.arrowLeft}
                        </button>
                        <div>
                            <p class="text-[10px] text-zinc-500 tracking-widest uppercase font-mono">Logistics Protocol</p>
                            <h1 class="font-heading text-2xl font-bold text-teal-400">TRANSPORT SHIELD</h1>
                            <p class="text-xs text-zinc-500 mt-1">Real-Time Shadow Meter (Taxi Auditor)</p>
                        </div>
                    </div>
                </header>

                <!-- SHADOW METER SECTION -->
                <section class="px-4 mb-6">
                    <h2 class="text-sm font-mono text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        REAL-TIME SHADOW METER
                    </h2>
                    
                    <!-- FARE DISPLAY -->
                    <div class="p-6 mb-4 bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-signal-amber/30 rounded-[2px] text-center">
                        <p class="text-xs text-amber-300 font-mono mb-2">CURRENT FARE</p>
                        <div class="text-5xl font-bold text-amber-400 mb-1" id="meter-fare-display">7.50 DH</div>
                        <p class="text-xs text-signal-amber/70 font-mono">Minimum: 7.50 DH • Night Mode: +50%</p>
                    </div>
                    
                    <!-- LIVE STATS -->
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div class="p-4 bg-void-900/60 border border-void-800 rounded-[2px]">
                            <p class="text-xs text-zinc-500 font-mono mb-1">DISTANCE</p>
                            <div class="text-2xl font-bold text-emerald-400" id="meter-distance">0.00 Km</div>
                            <p class="text-xs text-zinc-600 mt-1">Rate: 8.00 DH/Km</p>
                        </div>
                        <div class="p-4 bg-void-900/60 border border-void-800 rounded-[2px]">
                            <p class="text-xs text-zinc-500 font-mono mb-1">TIME</p>
                            <div class="text-2xl font-bold text-blue-400" id="meter-time">0 Min</div>
                            <p class="text-xs text-zinc-600 mt-1">Rate: 0.50 DH/Min</p>
                        </div>
                    </div>
                    
                    <!-- CONTROLS -->
                    <div class="space-y-3">
                        <div class="grid grid-cols-2 gap-3">
                            <button id="start-meter-btn" onclick="window.startShadowMeter()"
                                class="px-4 py-3 rounded-[2px] font-mono text-sm font-bold border transition-all 
                                       bg-signal-emerald/20 border-signal-emerald/40 text-emerald-300 hover:bg-signal-emerald/30">
                                START METER
                            </button>
                            <button id="stop-meter-btn" onclick="window.stopShadowMeter()"
                                class="px-4 py-3 rounded-[2px] font-mono text-sm font-bold border transition-all 
                                       bg-red-500/20 border-red-500/40 text-red-300 hover:bg-red-500/30"
                                disabled>
                                STOP METER
                            </button>
                        </div>
                        
                        <button id="night-mode-toggle" onclick="window.toggleNightMode()"
                            class="w-full px-4 py-3 rounded-[2px] font-mono text-sm font-bold border transition-all 
                                   bg-blue-500/20 border-blue-500/40 text-blue-300 hover:bg-blue-500/30">
                            DAY MODE
                        </button>
                    </div>
                    
                    <!-- FARE BREAKDOWN -->
                    <div class="mt-4 p-4 bg-void-900/40 border border-void-800 rounded-[2px]">
                        <p class="text-xs text-zinc-400 font-mono mb-3">FARE CALCULATION</p>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span class="text-zinc-400">Base Fare:</span>
                                <span class="text-zinc-300">7.00 DH</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-zinc-400">Distance (8.00 DH/Km):</span>
                                <span class="text-emerald-400" id="distance-cost">0.00 DH</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-zinc-400">Time (0.50 DH/Min):</span>
                                <span class="text-blue-400" id="time-cost">0.00 DH</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-zinc-400">Night Surcharge:</span>
                                <span class="text-amber-400" id="night-surcharge">0.00 DH</span>
                            </div>
                            <div class="border-t border-void-800 pt-2 mt-2 flex justify-between">
                                <span class="text-zinc-300 font-semibold">TOTAL:</span>
                                <span class="text-amber-400 font-bold" id="total-fare">7.50 DH</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- GPS STATUS -->
                    <div class="mt-4 p-3 bg-void-900/30 border border-void-800 rounded-[2px]">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <div class="w-2 h-2 rounded-full bg-signal-emerald animate-pulse"></div>
                                <span class="text-xs text-zinc-400 font-mono">GPS: READY</span>
                            </div>
                            <span class="text-xs text-zinc-500 font-mono" id="meter-status">STOPPED</span>
                        </div>
                    </div>
                </section>

                <!--RENTAL CAR PROTOCOL-->
                <section class="px-4 mb-6">
                    <h2 class="text-sm font-mono text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        RENTAL CAR PROTOCOL
                    </h2>
                    <div class="p-4 bg-teal-500/10 border border-teal-500/30 rounded-[2px] mb-3">
                        <p class="text-xs text-teal-300 font-mono mb-3">PRE-DEPARTURE CHECKLIST</p>
                        <div class="space-y-3">
                            <label class="flex items-start gap-3 cursor-pointer rental-check">
                                <input type="checkbox" class="mt-1 accent-teal-500">
                                <div>
                                    <p class="text-sm text-zinc-200 font-semibold">The 4K Walk-Around</p>
                                    <p class="text-xs text-zinc-400">Record slow-mo video of bumpers/mirrors/wheels IN FRONT of inspector.</p>
                                </div>
                            </label>
                            <label class="flex items-start gap-3 cursor-pointer rental-check">
                                <input type="checkbox" class="mt-1 accent-teal-500">
                                <div>
                                    <p class="text-sm text-zinc-200 font-semibold">The Glass Trap</p>
                                    <p class="text-xs text-zinc-400">Check windshield for micro-cracks (they'll blame you).</p>
                                </div>
                            </label>
                            <label class="flex items-start gap-3 cursor-pointer rental-check">
                                <input type="checkbox" class="mt-1 accent-teal-500">
                                <div>
                                    <p class="text-sm text-zinc-200 font-semibold">Spare Tire & Jack</p>
                                    <p class="text-xs text-zinc-400">Verify presence (commonly "missing").</p>
                                </div>
                            </label>
                            <label class="flex items-start gap-3 cursor-pointer rental-check">
                                <input type="checkbox" class="mt-1 accent-teal-500">
                                <div>
                                    <p class="text-sm text-zinc-200 font-semibold">Fuel & AC Test</p>
                                    <p class="text-xs text-zinc-400">Film gauge running. Test AC cooling before driving off.</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </section>

                <!--GRAND TAXI STRATEGY-->
                <section class="px-4 mb-6">
                    <h2 class="text-sm font-mono text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        GRAND TAXI STRATEGY
                    </h2>
                    <div class="grid gap-3">
                        <div class="p-4 bg-signal-amber/10 border border-signal-amber/30 rounded-[2px]">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="text-xl">*</span>
                                <h3 class="font-heading font-bold text-amber-400">COMFORT MODE</h3>
                            </div>
                            <p class="text-sm text-zinc-300 mb-2">Book the entire car (800-1000 DH)</p>
                            <ul class="text-xs text-zinc-400 space-y-1">
                                <li>? You control AC settings</li>
                                <li>? You control stops</li>
                                <li>? Direct route, no waiting</li>
                            </ul>
                        </div>
                        <div class="p-4 bg-signal-emerald/10 border border-signal-emerald/30 rounded-[2px]">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="text-xl">*</span>
                                <h3 class="font-heading font-bold text-emerald-400">ADVENTURE MODE</h3>
                            </div>
                            <p class="text-sm text-zinc-300 mb-2">Seat only (30-50 DH per person)</p>
                            <ul class="text-xs text-zinc-400 space-y-1">
                                <li>? Wait for 6 passengers</li>
                                <li>Random AC/music lottery</li>
                                <li>Cultural immersion</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <!--PETIT TAXI RULES-->
        <section class="px-4 mb-6">
            <h2 class="text-sm font-mono text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                PETIT TAXI INTEL
            </h2>
            <div class="p-4 bg-void-900/60 border border-void-800 rounded-[2px] space-y-3">
                <div class="p-3 bg-red-500/10 rounded border-l-4 border-red-500">
                    <p class="text-xs text-red-400 font-mono font-bold mb-1">METER RULE</p>
                    <p class="text-sm text-zinc-300">"Kh-dem Compteur" (Turn on meter). If refused, exit immediately.</p>
                </div>
                <div class="p-3 bg-signal-amber/10 rounded border-l-4 border-signal-amber">
                    <p class="text-xs text-amber-400 font-mono font-bold mb-1">BILL SWITCH DEFENSE</p>
                    <p class="text-sm text-zinc-300">Announce denomination: "Ha Meyatayn Dirham" (Here is 200). Use phone light.</p>
                </div>
                <div class="p-3 bg-signal-emerald/10 rounded border-l-4 border-signal-emerald">
                    <p class="text-xs text-emerald-400 font-mono font-bold mb-1">NIGHT RATES</p>
                    <p class="text-sm text-zinc-300">Starts 8pm (winter) / 9pm (summer). Meter + 50% is legal.</p>
                </div>
            </div>
        </section>
            </div>
        `;

    app.innerHTML = html;

    // Initialize UI state
    setTimeout(() => {
        updateMeterUI();
    }, 100);
}
