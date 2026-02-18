// Extracted from app.js: intel hidden-gems runtime block (compatibility-first).

// ---------------------------------------------------------------
// VIEW: INTEL - HIDDEN GEMS
// ---------------------------------------------------------------

const intelModulePreviewData = window.ALIDADE_MODULE_PREVIEWS || {};

const BASIC_INTEL_PREVIEW = intelModulePreviewData.BASIC_INTEL_PREVIEW || { page_desc: '', categories: {} };

let INTEL_DATA = BASIC_INTEL_PREVIEW;

const BASIC_INTEL_OXYGEN_TARGETS = intelModulePreviewData.BASIC_INTEL_OXYGEN_TARGETS || Object.freeze([]);

const BASIC_INTEL_RATIONS_STREET_TARGETS = intelModulePreviewData.BASIC_INTEL_RATIONS_STREET_TARGETS || Object.freeze([]);

const BASIC_INTEL_RATIONS_LOCKED_TARGETS = intelModulePreviewData.BASIC_INTEL_RATIONS_LOCKED_TARGETS || Object.freeze([]);

function renderIntelUpgradeOverlay(source = 'intel_lock', cta = 'UNLOCK FULL DATABASE') {
    const safeSource = String(source || 'intel_lock').replace(/'/g, "\\'");
    const safeCta = escapeHtml(String(cta || 'UNLOCK FULL DATABASE'));
    return `
        <div class="absolute inset-0 flex items-center justify-center p-4">
            <button
                onclick="window.trackTierFunnelEvent && window.trackTierFunnelEvent('click_upgrade', { source: '${safeSource}', feature: 'INTEL' }); window.showUpgradeModal && window.showUpgradeModal('ultimate', 'INTEL')"
                class="px-4 py-2 rounded-sm border border-signal-amber/40 bg-black/85 text-signal-amber text-[11px] font-mono font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:bg-signal-amber hover:text-black transition-colors"
            >
                ${safeCta}
            </button>
        </div>
    `;
}

function renderIntelBlurredLockedCard(target, source = 'intel_locked_card') {
    const safeSource = String(source || 'intel_locked_card').replace(/'/g, "\\'");
    return `
        <div class="relative">
            <div class="pointer-events-none select-none" style="filter: blur(6px);">
                ${renderIntelCard(target)}
            </div>
            ${renderIntelUpgradeOverlay(safeSource, 'CLASSIFIED')}
        </div>
    `;
}

function renderIntelDummyBlurList(tabName = 'recon') {
    const safeTab = String(tabName || 'recon').toLowerCase();
    const placeholders = Array.from({ length: 5 }, (_, index) => {
        const n = index + 1;
        return `
            <div class="p-4 bg-surface/60 border border-white/10 rounded-xl">
                <div class="flex items-center justify-between mb-2">
                    <p class="text-sm font-bold text-white">Target ${n}</p>
                    <span class="text-[10px] font-mono text-signal-amber">CLASSIFIED</span>
                </div>
                <p class="text-xs text-zinc-400">Encrypted field notes and routing vectors.</p>
            </div>
        `;
    }).join('');

    trackLockImpression('INTEL', `intel_${safeTab}_full_blur`);
    return `
        <div class="relative">
            <div class="space-y-3 pointer-events-none select-none" style="filter: blur(6px);">
                ${placeholders}
            </div>
            ${renderIntelUpgradeOverlay(`intel_${safeTab}_overlay`, 'UNLOCK FULL DATABASE')}
        </div>
    `;
}

function renderIntelFreemiumTab(categoryKey = 'rations') {
    if (categoryKey === 'oxygen') {
        return `
            <div class="mb-4">
                <h2 class="font-heading text-lg font-bold text-signal-amber">OXYGEN: GARDENS</h2>
                <p class="text-xs text-void-500 font-mono">Open access for all operatives.</p>
            </div>
            <div class="space-y-4">
                ${BASIC_INTEL_OXYGEN_TARGETS.map((target) => renderIntelCard(target)).join('')}
            </div>
        `;
    }

    if (categoryKey === 'rations') {
        trackLockImpression('INTEL', 'intel_rations_premium_locked');
        return `
            <div class="space-y-6">
                <div>
                    <h2 class="font-heading text-lg font-bold text-signal-amber">RATIONS: STREET FOOD</h2>
                    <p class="text-xs text-void-500 font-mono">Open category: fast local staples.</p>
                    <div class="space-y-4 mt-3">
                        ${BASIC_INTEL_RATIONS_STREET_TARGETS.map((target) => renderIntelCard(target)).join('')}
                    </div>
                </div>

                <div>
                    <h3 class="font-heading text-base font-bold text-signal-amber">FINE DINING & ROOFTOPS // CLASSIFIED</h3>
                    <p class="text-xs text-zinc-500 font-mono mt-1">Premium targets are visible but encrypted in Basic tier.</p>
                    <div class="space-y-4 mt-3">
                        ${BASIC_INTEL_RATIONS_LOCKED_TARGETS.map((target, index) => renderIntelBlurredLockedCard(target, `intel_rations_locked_${index + 1}`)).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    const labels = {
        recon: 'RECON',
        maze: 'THE MAZE',
        elevation: 'ELEVATION',
        recovery: 'RECOVERY',
        nightlife: 'NIGHT OPS'
    };
    const label = labels[categoryKey] || 'CLASSIFIED ARCHIVE';
    return `
        <div class="mb-4">
            <h2 class="font-heading text-lg font-bold text-signal-amber">${label}</h2>
            <p class="text-xs text-void-500 font-mono">Preview volume only. Database content is encrypted.</p>
        </div>
        ${renderIntelDummyBlurList(categoryKey)}
    `;
}

let currentIntelTab = 'rations';

function renderIntel() {
    if (ensureUltimateViewData('INTEL', renderIntel)) {
        return;
    }

    const app = document.getElementById('app');

    const html = `
        <div class="min-h-screen bg-void-950 pb-6">
                <!--HEADER-->
                <header class="sticky top-0 z-20 bg-void-950/95 backdrop-blur-sm border-b border-signal-amber/20 p-4">
                    <div class="flex items-center gap-3 mb-3">
                        <button onclick="window.alidadeApp.navigateTo('HOME')" class="p-2 rounded-lg bg-surface/60 border border-white/10 hover:bg-signal-amber/10 hover:border-signal-amber/30 transition-all active:scale-95">
                            ${ICONS.arrowLeft}
                        </button>
                        <div>
                            <p class="text-[10px] text-signal-amber tracking-widest uppercase font-mono">${t('intel.header_subtitle')}</p>
                            <h1 class="font-heading text-2xl font-bold text-signal-amber">${t('intel.header_title')}</h1>
                        </div>
                    </div>

                    <!-- 7-TAB NAVIGATION (Thumb-Friendly) -->
                    <div class="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4">
                        <button class="intel-tab flex-shrink-0 min-h-[48px] px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap flex items-center gap-2" data-intel-tab="rations">${t('intel.tabs.rations')}</button>
                        <button class="intel-tab flex-shrink-0 min-h-[48px] px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap flex items-center gap-2" data-intel-tab="oxygen">${t('intel.tabs.oxygen')}</button>
                        <button class="intel-tab flex-shrink-0 min-h-[48px] px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap flex items-center gap-2" data-intel-tab="recon">${t('intel.tabs.recon')}</button>
                        <button class="intel-tab flex-shrink-0 min-h-[48px] px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap flex items-center gap-2" data-intel-tab="maze">${t('intel.tabs.maze')}</button>
                        <button class="intel-tab flex-shrink-0 min-h-[48px] px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap flex items-center gap-2" data-intel-tab="elevation">${t('intel.tabs.elevation')}</button>
                        <button class="intel-tab flex-shrink-0 min-h-[48px] px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap flex items-center gap-2" data-intel-tab="recovery">${t('intel.tabs.recovery')}</button>
                        <button class="intel-tab flex-shrink-0 min-h-[48px] px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap flex items-center gap-2" data-intel-tab="nightlife">${t('intel.tabs.nightlife')}</button>
                    </div>
                </header>

                <!--PAGE DESCRIPTION-->
                <div class="px-4 pt-4 mb-4">
                    <div class="p-3 bg-signal-amber/10 border-l-4 border-signal-amber rounded-r-lg">
                        <p class="text-sm text-zinc-300 italic">${INTEL_DATA.page_desc}</p>
                    </div>
                </div>

                <!--TAB CONTENT-->
        <div id="intel-content" class="px-4 space-y-4 pb-20">
            <!-- Rendered by JS -->
        </div>
            </div>
        `;

    app.innerHTML = html;
    switchIntelTab(currentIntelTab);
    attachIntelListeners();
}

function attachIntelListeners() {
    document.querySelectorAll('.intel-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-intel-tab');
            switchIntelTab(tabName);
        });
    });
}

function switchIntelTab(tabName) {
    currentIntelTab = tabName;

    // Update tab button styles
    document.querySelectorAll('.intel-tab').forEach(btn => {
        if (btn.getAttribute('data-intel-tab') === tabName) {
            btn.classList.add('bg-signal-amber', 'text-zinc-950');
            btn.classList.remove('bg-void-800', 'text-zinc-400');
        } else {
            btn.classList.remove('bg-signal-amber', 'text-zinc-950');
            btn.classList.add('bg-void-800', 'text-zinc-400');
        }
    });

    const container = document.getElementById('intel-content');
    if (!container) return;

    if (!isUltimateTierActive()) {
        container.innerHTML = renderIntelFreemiumTab(tabName);
        return;
    }

    // Special handling for Night Ops
    if (tabName === 'nightlife') {
        container.innerHTML = renderNightOpsTab();
    } else {
        container.innerHTML = renderStandardIntelTab(tabName);
    }
}

function renderStandardIntelTab(categoryKey) {
    const category = INTEL_DATA.categories[categoryKey];
    if (!category) return '<p class="text-void-500">No data available.</p>';

    return `
        <div class="mb-4">
                <h2 class="font-heading text-lg font-bold text-signal-amber">${category.title}</h2>
                <p class="text-xs text-void-500 font-mono">${category.subtitle}</p>
            </div>
        <div class="space-y-4">
            ${category.targets.map(target => renderIntelCard(target)).join('')}
        </div>
    `;
}

function renderIntelCard(target) {
    return `
        <div class="bg-surface/60 border border-white/10 rounded-xl overflow-hidden">
                <!--Header -->
                <div class="p-4 border-b border-white/5">
                    <div class="flex items-start justify-between mb-2">
                        <h3 class="font-heading font-bold text-white text-base">${target.name}</h3>
                        <div class="flex items-center gap-2">
                            <span class="text-signal-amber text-sm font-mono">${target.price}</span>
                            <span class="px-2 py-0.5 bg-signal-amber/20 border border-signal-amber/30 rounded text-[10px] font-mono text-signal-amber">${target.type}</span>
                        </div>
                    </div>
                    <!-- Metrics -->
                    <div class="flex items-center gap-3 text-xs text-zinc-400">
                        <span class="flex items-center gap-1">? ${target.window}</span>
                        <span class="text-void-600">|</span>
                        <span class="flex items-center gap-1">${target.vibe}</span>
                    </div>
                </div>

                <!--Body -->
        <div class="p-4 space-y-3">
            <!-- The Scoop -->
            <div class="p-3 bg-void-800/50 rounded-lg border-l-4 border-signal-amber">
                <p class="text-xs text-signal-amber font-mono uppercase tracking-wider mb-1">THE SCOOP</p>
                <p class="text-sm text-zinc-300">${target.intel}</p>
            </div>

            <!-- Signature & Protocol -->
            <div class="grid grid-cols-2 gap-3">
                <div class="p-2 bg-emerald-500/10 rounded border border-emerald-500/20">
                    <p class="text-[10px] text-emerald-400 font-mono uppercase mb-0.5">TARGET ITEM</p>
                    <p class="text-sm text-emerald-300 font-bold">${target.item}</p>
                </div>
                <div class="p-2 bg-blue-500/10 rounded border border-blue-500/20">
                    <p class="text-[10px] text-blue-400 font-mono uppercase mb-0.5">PROTOCOL</p>
                    <p class="text-xs text-blue-300">${target.protocol}</p>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="grid grid-cols-2 gap-2 pt-2">
                ${target.link && target.link !== '#' ? `
                            <a href="${target.link}" target="_blank" rel="noopener noreferrer" class="flex items-center justify-center gap-2 py-3 bg-signal-amber/20 border border-signal-amber/40 rounded-lg text-signal-amber font-mono text-xs font-bold hover:bg-signal-amber/30 transition-all active:scale-95">
                                VECTOR
                            </a>
                        ` : `
                            <div class="flex items-center justify-center gap-2 py-3 bg-void-800/50 border border-void-700 rounded-lg text-void-500 font-mono text-xs">
                                NO LINK
                            </div>
                        `}
                <a href="${target.map}" target="_blank" rel="noopener noreferrer" class="flex items-center justify-center gap-2 py-3 bg-blue-500/20 border border-blue-500/40 rounded-lg text-blue-400 font-mono text-xs font-bold hover:bg-blue-500/30 transition-all active:scale-95">
                    GPS
                </a>
            </div>
        </div>
        </div>
            </div>
        `;
}

function renderNightOpsTab() {
    const nightlife = INTEL_DATA.categories.nightlife;

    return `
        <!--Category Header-->
            <div class="mb-4">
                <h2 class="font-heading text-lg font-bold text-red-400">${nightlife.title}</h2>
                <p class="text-xs text-void-500 font-mono">${nightlife.subtitle}</p>
            </div>

            <!--SAFETY BRIEFING(Critical)-->
            <div class="p-4 bg-red-500/10 border-2 border-red-500/50 rounded-xl mb-6">
                <div class="flex items-center gap-2 mb-4">
                    <span class="text-2xl">[!]</span>
                    <h3 class="font-heading text-lg font-bold text-red-400">SAFETY BRIEFING</h3>
                </div>
                <div class="space-y-3">
                    ${nightlife.safety.map(phase => `
                        <div class="p-3 bg-black/30 rounded-lg border-l-4 ${phase.phase.includes('DRINKS') ? 'border-signal-amber' : phase.phase.includes('WALLET') ? 'border-red-500' : 'border-blue-500'}">
                            <h4 class="font-bold ${phase.phase.includes('DRINKS') ? 'text-signal-amber' : phase.phase.includes('WALLET') ? 'text-red-400' : 'text-blue-400'} mb-2">${phase.phase}</h4>
                            <ul class="space-y-1">
                                ${phase.rules.map(rule => `<li class="text-sm text-zinc-300">• ${rule}</li>`).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!--QUIET LUXURY-->
            <div class="mb-6">
                <div class="flex items-center gap-2 mb-3">
                    <span class="text-xl">*</span>
                    <h3 class="font-heading text-base font-bold text-emerald-400">QUIET LUXURY</h3>
                    <span class="text-xs text-void-500 font-mono">(Low Risk)</span>
                </div>
                <div class="space-y-3">
                    ${nightlife.quiet.map(venue => renderNightVenueCard(venue, 'emerald')).join('')}
                </div>
            </div>

            <!--THE PARTY SCENE-->
        <div>
            <div class="flex items-center gap-2 mb-3">
                <span class="text-xl">*</span>
                <h3 class="font-heading text-base font-bold text-purple-400">THE PARTY SCENE</h3>
                <span class="text-xs text-void-500 font-mono">(Higher Risk)</span>
            </div>
            <div class="space-y-3">
                ${nightlife.party.map(venue => renderNightVenueCard(venue, 'purple')).join('')}
            </div>
        </div>
    `;
}

function renderNightVenueCard(venue, colorTheme) {
    const hasWarning = /\?\?|ALERT|DANGER|\[WARN\]/i.test(String(venue.intel || ''));
    return `
        <div class="p-4 bg-surface/60 border border-white/10 rounded-lg ${hasWarning ? 'border-l-4 border-l-red-500' : ''}">
                <div class="flex items-start justify-between mb-2">
                    <div>
                        <h4 class="font-heading font-bold text-white">${venue.name}</h4>
                        <p class="text-xs text-${colorTheme}-400 font-mono">${venue.vibe}</p>
                    </div>
                    <span class="text-signal-amber text-sm font-mono">${venue.price}</span>
                </div>
                <div class="flex items-center gap-2 mb-2">
                    <span class="px-2 py-0.5 bg-${colorTheme}-500/20 border border-${colorTheme}-500/30 rounded text-[10px] font-mono text-${colorTheme}-400">${venue.item}</span>
                </div>
                <p class="text-sm text-zinc-400 mb-3">${venue.intel}</p>
                ${venue.link && venue.link !== '#' ? `
                    <a href="${venue.link}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-xs text-signal-amber hover:text-amber-300 font-mono">
                        OPEN LINK
                    </a>
                ` : ''
        }
            </div>
        `;
}
