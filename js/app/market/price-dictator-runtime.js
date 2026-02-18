// Extracted from app.js: market price-dictator runtime block (compatibility-first).

// ---------------------------------------------------------------
// VIEW: MARKET - PRICE DICTATOR
// ---------------------------------------------------------------

function renderPriceDictator() {
    const APP_CONTAINER = document.getElementById('app');

    // 1. THE FULL DATA (31 Items - RESTORED)
    const localMarketData = [
        // --- RATIONS (Food & Drink) ---
        { category: 'food', item: 'Orange Juice (Jemaa)', fair: '4 - 10 DH', trap: '20+ DH', tip: 'Watch them squeeze it. Avoid pre-mixed.' },
        { category: 'food', item: 'Snail Soup (Bowl)', fair: '5 - 10 DH', trap: '30 DH', tip: 'Usually fixed price. Earthy taste.' },
        { category: 'food', item: 'Harira (Soup)', fair: '5 - 15 DH', trap: '20+ DH', tip: '10-15 DH in tourist spots is acceptable.' },
        { category: 'food', item: 'Tagine (Local/Snack)', fair: '30 - 40 DH', trap: 'N/A', tip: 'Best value for money. Simple clay pot.' },
        { category: 'food', item: 'Tagine (Standard)', fair: '70 - 120 DH', trap: '130+ DH', tip: 'Paying for service, hygiene, and comfort.' },
        { category: 'food', item: 'Tagine (Rooftop/View)', fair: '100 - 150 DH', trap: '170+ DH', tip: 'You are paying for the Sunset/View, not the food.' },
        { category: 'food', item: 'Mint Tea (Pot)', fair: '15 - 30 DH', trap: '50+ DH', tip: 'Check if price is for a Cup or a full Pot.' },
        { category: 'food', item: 'Couscous (Friday)', fair: '60 - 90 DH', trap: '150+ DH', tip: 'Best eaten on Fridays. Large portions.' },
        { category: 'food', item: 'Jemaa el-Fna Dinner', fair: '100 - 150 DH', trap: '300 - 500 DH', tip: 'Refuse bread/olives if they are not free.' },
        { category: 'food', item: 'Local Beer (Casablanca)', fair: '50 - 80 DH', trap: 'N/A', tip: 'Alcohol tax is high. This is normal price.' },

        // --- ARTIFACTS (Souk Goods) ---
        { category: 'souk', item: 'Babouche (Slippers)', fair: '70 - 120 DH', trap: '250 DH', tip: 'Rubber sole is cheaper. Leather sole is premium.' },
        { category: 'souk', item: 'Large Rug (3x2m)', fair: '3,500 - 6,000 DH', trap: '20,000 DH', tip: 'Check knot density. Burn test wool.' },
        { category: 'souk', item: 'Leather Pouf (Empty)', fair: '150 - 250 DH', trap: '600 DH', tip: 'Smell it! Strong urine smell = bad tanning.' },
        { category: 'souk', item: 'Leather Bag (Med)', fair: '200 - 400 DH', trap: '800+ DH', tip: 'Check zippers, lining, and stitching carefully.' },
        { category: 'souk', item: 'Argan Oil (100ml)', fair: '80 - 150 DH', trap: '250 DH', tip: 'Cosmetic is light gold. Culinary is dark/roasted.' },
        { category: 'souk', item: 'Saffron (1 gram)', fair: '30 - 50 DH', trap: '100+ DH', tip: 'Water Test: Should color water slowly yellow.' },

        // --- SERVICES (Spa & Help) ---
        { category: 'services', item: 'Hammam Beldi (Local)', fair: '< 150 DH', trap: 'N/A', tip: '10-20 entry + 50-100 scrub. Bring your own soap.' },
        { category: 'services', item: 'Tourist Spa (Pkg)', fair: '300 - 500 DH', trap: '800+ DH', tip: 'Paying for privacy, massage duration, and decor.' },
        { category: 'services', item: 'Henna Tattoo (Hand)', fair: '50 - 100 DH', trap: '300+ DH', tip: 'DANGER: Avoid Black Henna (PPD Chemical).' },
        { category: 'services', item: 'Snake/Monkey Photo', fair: '20 - 50 DH', trap: '200+ DH', tip: 'Negotiate price BEFORE taking the photo.' },
        { category: 'services', item: 'Official Guide (1/2 Day)', fair: '400 - 500 DH', trap: 'Commission', tip: 'Look for official badge. Avoid forced shopping.' },
        { category: 'services', item: 'Sim Cart (Data)', fair: '30 - 50 MAD', trap: '"Free"', tip: 'Buy from official agency (Maroc Telecom/Inwi).' },

        // --- VECTORS (Transport) ---
        { category: 'transport', item: 'Petit Taxi (Day)', fair: 'Meter + 7dh', trap: 'Fixed 50-100dh', tip: 'Insist on Compteur. If refused, walk away.' },
        { category: 'transport', item: 'Petit Taxi (Night)', fair: 'Meter + 50%', trap: '3x Fixed', tip: 'Night rates start 8pm (Winter) / 9pm (Summer).' },
        { category: 'transport', item: 'Medina  Station', fair: '20 - 25 MAD', trap: '80 MAD+', tip: 'Ensure driver uses meter.' },
        { category: 'transport', item: 'Medina  Gueliz', fair: '15 - 25 MAD', trap: '80 MAD+', tip: 'Common route. Meter is the only fair way.' },
        { category: 'transport', item: 'Medina  Majorelle', fair: '20 - 30 MAD', trap: '100 MAD+', tip: 'Drivers exploit this spot. Walk 100m away to hail.' },
        { category: 'transport', item: 'Airport Bus (L19)', fair: '30 DH (Fixed)', trap: 'N/A', tip: 'Ticket valid for 2 weeks return (50 DH).' },
        { category: 'transport', item: 'Grand Taxi (Seat)', fair: '30 - 40 DH', trap: 'Full Price', tip: 'Wait for 6 people or pay for empty seats.' },
        { category: 'transport', item: 'Grand Taxi (Car)', fair: '500 - 700 DH', trap: '1200 DH', tip: 'Whole car for the day. Negotiate waiting time.' },
        { category: 'transport', item: 'Calèche (Carriage)', fair: '200 - 300 DH', trap: '500+ DH', tip: 'Price per hour/ride, NOT per person.' }
    ];

    // 2. THE UI SHELL
    APP_CONTAINER.innerHTML = `
        <div class="min-h-screen bg-void-950 pb-20 font-sans" >
            <!--TACTICAL HEADER-->
            <header class="sticky top-0 z-20 bg-void-950/98 backdrop-blur-md border-b border-signal-emerald/40 p-4 mb-6 relative overflow-hidden">
                <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(16,185,129,0.15) 2px, rgba(16,185,129,0.15) 4px);"></div>
                
                <div class="relative flex items-center gap-4">
                    <button onclick="window.alidadeApp.navigateTo('SOUK')" class="p-3 rounded-sm bg-void-900 border border-signal-emerald/30 hover:bg-signal-emerald/20 hover:border-signal-emerald/60 transition-all active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center">
                        ${ICONS.arrowLeft}
                    </button>
                    <div class="flex-1">
                        <p class="text-[10px] text-signal-emerald tracking-[0.25em] uppercase font-mono mb-0.5">Market Intelligence</p>
                        <div class="flex items-center gap-2">
                            <span class="text-signal-emerald/60 font-mono text-lg">[</span>
                            <h1 class="font-sans text-xl font-bold text-white uppercase tracking-wider">PRICE DICTATOR</h1>
                            <span class="text-signal-emerald/60 font-mono text-lg">]</span>
                        </div>
                    </div>
                </div>
                
                <!-- INTEL BANNER -->
                <div class="relative mt-4">
                    <div class="p-3 bg-void-900/80 border-l-[3px] border-signal-emerald rounded-sm">
                        <p class="text-xs text-zinc-300 leading-relaxed font-mono">
                            <span class="text-emerald-400 font-bold">STOP PAYING THE "TOURIST TAX".</span><br>
                            Access the secondary price list. Negotiate with leverage.
                        </p>
                    </div>
                </div>

                <!-- SEARCH & FILTER -->
                <div class="mt-4 space-y-3">
                    <div class="relative">
                        <input type="text" id="marketSearch" placeholder="SEARCH ITEM (E.G. TAXI, TEA)..." 
                            class="w-full bg-void-900 border border-void-700 rounded-sm p-3 pl-10 text-white placeholder-zinc-600 focus:border-signal-emerald focus:outline-none font-mono text-sm uppercase tracking-wide">
                        <div class="absolute left-3 top-3 text-void-600">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                        </div>
                    </div>
                    
                    <div class="flex gap-2 overflow-x-auto pb-2 no-scrollbar" id="filterContainer">
                        <button class="filter-btn active px-4 py-2 rounded-sm bg-emerald-600 text-zinc-950 font-mono font-bold text-xs border border-signal-emerald whitespace-nowrap tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all" data-cat="all">ALL</button>
                        <button class="filter-btn px-4 py-2 rounded-sm bg-void-900 text-zinc-400 font-mono font-bold text-xs border border-void-700 whitespace-nowrap tracking-wider hover:border-signal-emerald/50 hover:text-emerald-400 transition-all" data-cat="transport">TRANSPORT</button>
                        <button class="filter-btn px-4 py-2 rounded-sm bg-void-900 text-zinc-400 font-mono font-bold text-xs border border-void-700 whitespace-nowrap tracking-wider hover:border-signal-emerald/50 hover:text-emerald-400 transition-all" data-cat="food">FOOD</button>
                        <button class="filter-btn px-4 py-2 rounded-sm bg-void-900 text-zinc-400 font-mono font-bold text-xs border border-void-700 whitespace-nowrap tracking-wider hover:border-signal-emerald/50 hover:text-emerald-400 transition-all" data-cat="souk">SOUK</button>
                        <button class="filter-btn px-4 py-2 rounded-sm bg-void-900 text-zinc-400 font-mono font-bold text-xs border border-void-700 whitespace-nowrap tracking-wider hover:border-signal-emerald/50 hover:text-emerald-400 transition-all" data-cat="services">SERVICES</button>
                    </div>
                </div>
            </header>

                <div id="marketList" class="p-4 space-y-3">
                    </div>

                <div class="p-4 mt-6 mx-4 mb-8 bg-amber-900/20 border border-signal-amber/30 rounded-[2px]">
                    <h3 class="text-signal-amber font-bold font-mono text-sm mb-2">Market Volatility Notice (2025 Radar)</h3>
                    <ul class="text-xs text-slate-400 space-y-2">
                        <li><strong class="text-slate-200">Seasonal Surge:</strong> Expect <span class="text-signal-amber">+20-30%</span> during Holidays.</li>
                        <li><strong class="text-slate-200">Inflation Buffer:</strong> Keep a <span class="text-signal-amber">10-15%</span> emergency buffer.</li>
                        <li><strong class="text-slate-200">Validity:</strong> Data calibrated for 2025.</li>
                    </ul>
                </div>
            </div>
        `;

    // 3. THE LOGIC
    const searchInput = document.getElementById('marketSearch');
    const listContainer = document.getElementById('marketList');
    const filterBtns = document.querySelectorAll('.filter-btn');
    let activeCategory = 'all';

    function renderList(filterText = '') {
        listContainer.innerHTML = '';
        const term = filterText.toLowerCase();

        const filtered = localMarketData.filter(item => {
            const matchesSearch = item.item.toLowerCase().includes(term);
            const matchesCat = activeCategory === 'all' || item.category === activeCategory;
            return matchesSearch && matchesCat;
        });

        if (filtered.length === 0) {
            listContainer.innerHTML = `<div class="text-center text-void-500 mt-8 font-mono text-xs uppercase tracking-widest" > NO INTEL FOUND.</div> `;
            return;
        }

        filtered.forEach(item => {
            const card = document.createElement('div');
            card.className = "bg-void-900 rounded-sm p-4 border border-void-700 shadow-sm active:scale-[0.98] transition-all cursor-pointer group hover:border-signal-emerald/30";
            card.onclick = () => {
                const tip = card.querySelector('.tactical-tip');
                tip.classList.toggle('hidden');
            };

            card.innerHTML = `
        <div class="flex justify-between items-start mb-2" >
                        <h3 class="font-bold text-slate-100">${item.item}</h3>
                        <span class="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-900 px-2 py-1 rounded">${item.category}</span>
                    </div>
                    <div class="flex gap-2 text-xs font-mono mb-2">
                        <div class="bg-emerald-900/30 text-emerald-400 px-2 py-1 rounded border border-signal-emerald/30">
                            ? ${item.fair}
                        </div>
                        ${item.trap !== 'N/A' ? `
                        <div class="bg-red-900/30 text-red-400 px-2 py-1 rounded border border-red-500/30">
                            ${item.trap}
                        </div>` : ''}
                    </div>
                    <div class="tactical-tip hidden mt-3 pt-3 border-t border-slate-700 text-xs text-amber-300 italic">
                        INTEL: ${item.tip}
                    </div>
                    <div class="text-center mt-1">
                        <span class="text-slate-600 text-[10px]">TAP FOR INTEL</span>
                    </div>
    `;
            listContainer.appendChild(card);
        });
    }

    // Event Listeners
    searchInput.addEventListener('input', (e) => renderList(e.target.value));

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update UI
            filterBtns.forEach(b => {
                b.classList.remove('bg-emerald-600', 'text-white');
                b.classList.add('bg-slate-800', 'text-slate-400');
            });
            btn.classList.remove('bg-slate-800', 'text-slate-400');
            btn.classList.add('bg-emerald-600', 'text-white');

            // Update Logic
            activeCategory = btn.dataset.cat;
            renderList(searchInput.value);
        });
    });

    // Initial Render
    renderList();
}

// ---------------------------------------------------------------
// VIEW: SOUK OPS MODULE (Updated with Grid Menu)
// ---------------------------------------------------------------

function renderSouk() {
    // ACCESS CONTROL LAYER
    // BASIC and ULTIMATE tiers can access SOUK OPS
    const userTier = (typeof currentUserPlan !== 'undefined') ? normalizeTierTag(currentUserPlan) : 'BASIC';

    // Unknown/invalid tiers are restricted
    if (!['BASIC', 'ULTIMATE'].includes(userTier)) {
        const tierLabel = (window.licenseManager && window.licenseManager.getTierSummary)
            ? window.licenseManager.getTierSummary().tier.toUpperCase()
            : userTier;
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="min-h-screen bg-void-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <!-- Grid Background -->
                <div class="absolute inset-0 bg-grid-pattern opacity-[0.05] pointer-events-none"></div>

                <!-- Modal Container -->
                <div class="relative w-full max-w-sm bg-black/80 backdrop-blur-xl border border-signal-amber/50 p-8 shadow-[0_0_50px_-10px_rgba(245,158,11,0.3)] animate-[fadeIn_0.3s_ease-out]">
                    <!-- Scanline Texture -->
                    <div class="absolute inset-0 opacity-[0.1] pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(245,158,11,0.2) 2px, rgba(245,158,11,0.2) 4px);"></div>

                    <!-- Lock Icon -->
                    <div class="absolute top-4 left-4 text-signal-amber/60">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    </div>

                    <!-- Content -->
                    <div class="text-center mt-4">
                        <h1 class="font-mono text-xl font-bold text-signal-amber tracking-[0.2em] mb-6 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">ACCESS DENIED</h1>
                        
                        <div class="w-full h-px bg-signal-amber/20 mb-6"></div>

                        <div class="space-y-1 mb-8">
                            <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">BASIC / ULTIMATE CLEARANCE REQUIRED.</p>
                            <p class="text-[10px] text-zinc-500 font-mono">Current clearance: <span class="text-white font-bold">${tierLabel}</span>. Upgrade to unlock Souk Ops.</p>
                        </div>

                        <button onclick="window.trackTierFunnelEvent && window.trackTierFunnelEvent('click_upgrade', { source: 'souk_access_modal', feature: 'MARKET' }); window.showUpgradeModal ? window.showUpgradeModal('ultimate', 'MARKET') : window.alidadeApp.navigateTo('SETTINGS')" class="w-full py-3.5 bg-signal-amber hover:bg-amber-400 text-black font-bold tracking-widest uppercase text-xs transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] active:scale-[0.98]">
                            UPGRADE NOW
                        </button>
                        
                        <button onclick="window.alidadeApp.navigateTo('HOME')" class="mt-6 text-[9px] text-zinc-600 font-mono uppercase tracking-widest hover:text-zinc-400 transition-colors">
                            DISMISS
                        </button>
                    </div>
                    
                    <!-- Corner Accents -->
                    <div class="absolute top-0 left-0 w-1.5 h-1.5 border-l border-t border-signal-amber"></div>
                    <div class="absolute top-0 right-0 w-1.5 h-1.5 border-r border-t border-signal-amber"></div>
                    <div class="absolute bottom-0 left-0 w-1.5 h-1.5 border-l border-b border-signal-amber"></div>
                    <div class="absolute bottom-0 right-0 w-1.5 h-1.5 border-r border-b border-signal-amber"></div>
                </div>
            </div>
        `;
        return;
    }

    const app = document.getElementById('app');

    // -- Tactical Tools (Pre-compute locked HTML) --
    const _batchFeature = getFeatureUsageStatus('batch_processing');
    const _filtersFeature = getFeatureUsageStatus('advanced_filters');
    const _batchLocked = !_batchFeature.allowed;
    const _filtersLocked = !_filtersFeature.allowed;

    const _batchCard = '<div class="group relative bg-void-900/60 border border-blue-500/20 rounded-sm p-5 hover:border-blue-500/40 transition-all"><div class="flex items-center gap-4 mb-3"><div class="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg></div><div><h3 class="font-sans text-sm font-bold text-white uppercase tracking-wide">Batch Processing</h3><p class="text-[10px] text-zinc-500 font-mono tracking-wide">Scan multiple items at once</p></div></div><div class="flex gap-2"><span class="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-sm text-[9px] text-blue-400 font-mono uppercase tracking-wider">Up to 5 items</span><span class="px-2 py-0.5 bg-void-800 border border-void-700 rounded-sm text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Queue Mode</span></div></div>';

    const _filtersCard = '<div class="group relative bg-void-900/60 border border-purple-500/20 rounded-sm p-5 hover:border-purple-500/40 transition-all"><div class="flex items-center gap-4 mb-3"><div class="flex h-11 w-11 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/></svg></div><div><h3 class="font-sans text-sm font-bold text-white uppercase tracking-wide">AI Advanced Filters</h3><p class="text-[10px] text-zinc-500 font-mono tracking-wide">Smart classification &amp; presets</p></div></div><div class="flex gap-2"><span class="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded-sm text-[9px] text-purple-400 font-mono uppercase tracking-wider">AI-Powered</span><span class="px-2 py-0.5 bg-void-800 border border-void-700 rounded-sm text-[9px] text-zinc-500 font-mono uppercase tracking-wider">5 Presets</span></div></div>';

    const _upgradeMarketAction = "window.trackTierFunnelEvent && window.trackTierFunnelEvent('click_upgrade', { source: 'souk_tactical_tools', feature: 'MARKET' }); window.showUpgradeModal && window.showUpgradeModal('ultimate', 'MARKET')";
    const _wrapLockedTool = (cardHtml, ctaLabel) => `
        <div class="relative">
            ${cardHtml}
            <div class="absolute inset-0 rounded-sm border border-signal-amber/40 bg-black/75 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2 p-3 text-center">
                <p class="text-[9px] text-signal-amber font-mono uppercase tracking-widest">CLASSIFIED // ULTIMATE</p>
                <button onclick="${_upgradeMarketAction}" class="px-3 py-1.5 bg-signal-amber text-black text-[10px] font-mono font-bold tracking-widest uppercase rounded-sm hover:bg-amber-400 transition-colors">
                    ${ctaLabel}
                </button>
            </div>
        </div>
    `;

    if (_batchLocked) trackLockImpression('MARKET', 'souk_batch_tool');
    if (_filtersLocked) trackLockImpression('MARKET', 'souk_filters_tool');

    const _batchHtml = _batchLocked ? _wrapLockedTool(_batchCard, 'UNLOCK BATCH') : _batchCard;
    const _filtersHtml = _filtersLocked ? _wrapLockedTool(_filtersCard, 'UNLOCK FILTERS') : _filtersCard;
    const tacticalToolsHtml = _batchHtml + _filtersHtml;

    const html = `
        <!--SOUK SPECIFIC STYLES-->


            <div class="min-h-screen bg-void-950 pb-32 overflow-hidden">

                <!-- HEADER -->
                <header class="relative p-4 mb-6 animate-[slide-up-fade_0.6s_ease-out]">
                    <div class="absolute inset-0 bg-void-900/50 backdrop-blur-md border-b border-signal-amber/20"></div>
                    <div class="relative flex items-center gap-4">
                        <button onclick="window.alidadeApp.navigateTo('HOME')" class="group relative w-12 h-12 flex items-center justify-center rounded-full bg-void-900 border border-void-700 hover:border-signal-amber transition-all shadow-lg active:scale-95">
                            <div class="absolute inset-0 bg-signal-amber/10 scale-0 group-hover:scale-100 transition-transform rounded-full"></div>
                            ${ICONS.arrowLeft}
                        </button>
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="w-1.5 h-1.5 bg-signal-amber animate-pulse rounded-full"></span>
                                <p class="text-[9px] text-zinc-500 tracking-[0.3em] uppercase font-mono">MARKET INTELLIGENCE</p>
                            </div>
                            <h1 class="font-sans text-2xl font-black text-white tracking-wide uppercase leading-none">
                                <span class="text-signal-amber drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">SOUK</span> OPS
                            </h1>
                        </div>
                    </div>
                </header>

                <div class="px-4 space-y-8">
                    <!-- USAGE COUNTER -->
                    <div id="usage-counter-container" class="animate-[slide-up-fade_0.8s_ease-out_0.2s_both]">
                        ${(() => {
            if (window.UsageCounter && window.licenseManager) {
                const feature = 'ai_scanner';
                const usage = window.licenseManager.canUseFeature(feature);
                // usage returns { allowed, current_usage, limit, ... }
                return window.UsageCounter({
                    current: usage.current_usage || 0,
                    limit: usage.limit, // -1 or number
                    featureName: 'DAILY SCANS',
                    resetTime: new Date().setHours(24, 0, 0, 0) // Next midnight (approx)
                });
            }
            const usage = getFeatureUsageStatus('ai_scanner');
            const current = usage.current_usage || 0;
            const limit = usage.limit === -1 ? '8' : usage.limit;
            const tone = usage.allowed ? 'text-signal-emerald border-signal-emerald/20 bg-signal-emerald/5' : 'text-signal-amber border-signal-amber/30 bg-signal-amber/10';
            return `
                <div class="rounded-sm border ${tone} px-3 py-2 font-mono text-[10px] tracking-widest uppercase">
                    Daily scans: <span class="font-bold">${current}/${limit}</span>
                </div>
            `;
        })()}
                    </div>

                    <!-- CAMERA SECTION (Scanner Mount) -->
                    <div id="scanner-mount-point" class="animate-[slide-up-fade_0.8s_ease-out_0.2s_both]"></div>

                    <!-- CATEGORY MATRIX -->
                    <section class="space-y-4 animate-[slide-up-fade_0.8s_ease-out_0.4s_both]">
                        <div class="flex items-center justify-between px-1 border-b border-void-800 pb-2">
                            <h2 class="text-[10px] text-zinc-500 font-mono tracking-[0.25em] uppercase">Category Matrix</h2>
                            <div class="flex gap-1">
                                <div class="w-1 h-3 bg-signal-amber/20 transform skew-x-12"></div>
                                <div class="w-1 h-3 bg-signal-amber/40 transform skew-x-12"></div>
                                <div class="w-1 h-3 bg-signal-amber/80 transform skew-x-12"></div>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                            ${renderSoukCategory(t('souk.categories.negotiation'), t('souk.categories.negotiation_desc'), '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>', 'emerald', 'NEGOTIATION', 0)}
                            ${renderSoukCategory(t('souk.categories.forensics'), t('souk.categories.forensics_desc'), '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>', 'purple', 'PRODUCT_FORENSICS', 1)}
                            ${renderSoukCategory(t('souk.categories.ceramics'), t('souk.categories.ceramics_desc'), ICONS.beaker, 'teal', 'CERAMICS', 2)}
                            ${renderSoukCategory(t('souk.categories.leather'), t('souk.categories.leather_desc'), ICONS.checkCircle, 'amber', 'LEATHER', 3)}
                            ${renderSoukCategory(t('souk.categories.rugs'), t('souk.categories.rugs_desc'), ICONS.cube, 'rose', 'RUGS', 4)}
                            ${renderSoukCategory(t('souk.categories.metals'), t('souk.categories.metals_desc'), ICONS.lock, 'zinc', 'METALS', 5)}
                        </div>
                    </section>

                    <!-- TACTICAL TOOLS (Locked Placeholders) -->
                    <section class="space-y-4 animate-[slide-up-fade_0.8s_ease-out_0.5s_both]">
                        <div class="flex items-center justify-between px-1 border-b border-void-800 pb-2">
                            <h2 class="text-[10px] text-zinc-500 font-mono tracking-[0.25em] uppercase">Tactical Tools</h2>
                            <span class="text-[9px] text-signal-amber/60 font-mono uppercase tracking-wider">Coming Soon</span>
                        </div>

                        <div class="grid grid-cols-1 gap-3">
                            ${tacticalToolsHtml}
                        </div>
                    </section>

                    <!-- DATABASE LINK -->
                    <section class="animate-[slide-up-fade_0.8s_ease-out_0.6s_both]">
                        <button onclick="window.checkAccess('ULTIMATE', () => window.alidadeApp.navigateTo('MARKET'), 'MARKET')"
                            class="group relative w-full overflow-hidden rounded-xl border border-signal-emerald/30 bg-void-900/40 p-1 transition-all active:scale-[0.98] hover:border-signal-emerald/60">

                            <div class="absolute inset-0 opacity-[0.05]" style="background-image: radial-gradient(circle at 1px 1px, rgba(16, 185, 129, 0.4) 1px, transparent 0); background-size: 16px 16px;"></div>

                            <div class="relative flex items-center justify-between bg-void-900/60 backdrop-blur-sm rounded-lg p-5">
                                <div class="flex items-center gap-4">
                                    <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-signal-emerald/10 text-signal-emerald border border-signal-emerald/20 group-hover:scale-110 transition-transform">
                                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                    </div>
                                    <div class="text-left space-y-1">
                                        <h3 class="font-sans text-base font-bold text-white tracking-wide uppercase">${t('souk.price_database.title')}</h3>
                                        <p class="text-[10px] text-zinc-400 font-mono tracking-wide">${t('souk.price_database.desc')}</p>
                                    </div>
                                </div>
                                <div class="text-signal-emerald opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                                </div>
                            </div>
                        </button>
                    </section>
                </div>
            </div>
    `;

    app.innerHTML = html;

    // MOUNT THE SCANNER UI
    if (window.renderPriceChecker) {
        window.renderPriceChecker('scanner-mount-point');
    } else {
        console.error('Price Checker module not loaded');
    }

    attachSoukListeners();
}

function renderPriceRow(item, price) {
    return `
        <tr class="border-b border-void-800 hover:bg-void-800/50 transition-all font-mono text-sm">
                <td class="px-4 py-3 text-zinc-400">${item}</td>
                <td class="px-4 py-3 text-right font-bold text-signal-emerald">${price}</td>
            </tr>
        `;
}

function attachSoukListeners() {
    const askPriceInput = document.getElementById('ask-price');
    const realPriceDisplay = document.getElementById('real-price');
    const walkPriceDisplay = document.getElementById('walk-price');

    if (askPriceInput) {
        askPriceInput.addEventListener('input', (e) => {
            const askPrice = parseFloat(e.target.value) || 0;

            if (askPrice > 0) {
                const realPrice = Math.round(askPrice * 0.4);
                const walkPrice = Math.round(askPrice * 0.5);

                realPriceDisplay.textContent = `${realPrice} MAD`;
                walkPriceDisplay.textContent = `${walkPrice} MAD`;
            } else {
                realPriceDisplay.textContent = '--';
                walkPriceDisplay.textContent = '--';
            }
        });
    }
}

function renderSoukCategory(title, subtitle, icon, accentColor, targetView, index = 0) {
    const colorClasses = {
        teal: 'text-teal-400 group-hover:text-teal-300 border-teal-500/20 group-hover:border-teal-500/40',
        amber: 'text-signal-amber group-hover:text-amber-300 border-signal-amber/20 group-hover:border-signal-amber/40',
        rose: 'text-rose-400 group-hover:text-rose-300 border-rose-500/20 group-hover:border-rose-500/40',
        emerald: 'text-emerald-400 group-hover:text-emerald-300 border-signal-emerald/20 group-hover:border-signal-emerald/40',
        zinc: 'text-zinc-400 group-hover:text-zinc-300 border-zinc-500/20 group-hover:border-zinc-500/40',
        purple: 'text-purple-400 group-hover:text-purple-300 border-purple-500/20 group-hover:border-purple-500/40'
    };

    const themeClass = colorClasses[accentColor] || colorClasses.zinc;
    const delayClass = `delay-${(index * 100)}`;

    return `
        <button onclick="window.alidadeApp.navigateTo('${targetView}')" class="group relative p-4 min-h-[120px] bg-void-900/60 backdrop-blur-md border rounded-xl transition-all active:scale-95 text-left overflow-hidden hover:bg-void-800 ${themeClass} ${delayClass} animate-[slide-up-fade_0.5s_ease-out_both]">
                
                <!--Circuit Pattern-->
                <div class="absolute inset-0 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <pattern id="circuit-${index}-souk" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M0 10h20M10 0v20" stroke="currentColor" stroke-width="1" fill="none"/>
                            <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
                        </pattern>
                        <rect width="100%" height="100%" fill="url(#circuit-${index}-souk)"/>
                    </svg>
                </div>

                <div class="relative z-10 flex flex-col h-full justify-between">
                    <div class="transition-transform group-hover:scale-110 origin-top-left group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                        ${icon}
                    </div>
                    <div>
                        <h3 class="font-sans text-xs font-black tracking-wider uppercase mb-1">${title}</h3>
                        <p class="text-[9px] text-void-400 font-mono leading-tight">${subtitle}</p>
                    </div>
                </div>
            </button>
        `;
}
