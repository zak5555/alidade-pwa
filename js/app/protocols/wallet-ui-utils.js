/**
 * ALIDADE Protocols Wallet UI Utilities
 * Extracted from wallet tab rendering helpers.
 */
(function bootstrapProtocolsWalletUiUtils(windowObj) {
    if (!windowObj) return;

    const protocolsUtils = windowObj.ALIDADE_PROTOCOLS_UTILS || (windowObj.ALIDADE_PROTOCOLS_UTILS = {});

    if (typeof protocolsUtils.protocolsResolveWalletVisualState !== 'function') {
        protocolsUtils.protocolsResolveWalletVisualState = function protocolsResolveWalletVisualState(status) {
            const statusColor = status.remaining < 0 ? 'red' : status.status === 'SPENDING FAST' ? 'amber' : 'emerald';
            const mainColor = status.remaining < 0 ? 'text-red-400' : 'text-emerald-400';
            const borderColor = status.remaining < 0 ? 'border-red-500/50' : 'border-emerald-500/30';
            const shadowColor = status.remaining < 0
                ? 'shadow-[0_0_30px_rgba(239,68,68,0.2)]'
                : 'shadow-[0_0_30px_rgba(16,185,129,0.1)]';

            return {
                statusColor,
                mainColor,
                borderColor,
                shadowColor
            };
        };
    }

    if (typeof protocolsUtils.protocolsRenderWalletSetup !== 'function') {
        protocolsUtils.protocolsRenderWalletSetup = function protocolsRenderWalletSetup(options = {}) {
            const getKBFn = options.getKBFn || (() => ({}));
            const translateFn = options.translateFn || ((key) => key);
            const kb = getKBFn();
            const profiles = kb.budget_profiles || {};

            return `
            <div class="mb-8 relative">
                 <div class="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-transparent"></div>
                <h2 class="font-heading text-2xl font-bold text-white tracking-wider shadow-glow">SETUP_FINANCE_CORE</h2>
                <p class="text-xs text-emerald-500 font-mono uppercase tracking-widest mt-1">// SELECT_OPERATOR_PROFILE</p>
            </div>

            <!-- BUDGET PROFILE SELECTION -->
            <div class="mb-8">
                <div class="grid grid-cols-2 gap-3 mb-6">
                    ${Object.entries(profiles).map(([key, p]) => `
                        <button class="profile-btn relative group p-4 bg-void-900/50 border border-void-700 rounded-sm text-left transition-all hover:border-emerald-500/50 hover:bg-void-900 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)] active:scale-[0.98] overflow-hidden" data-profile="${key}">
                            <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div class="relative z-10">
                                <span class="text-2xl mb-2 block filter drop-shadow-md group-hover:scale-110 transition-transform origin-left">
                                    ${key === 'backpacker' ? '🎒' : key === 'budget' ? '⚖️' : key === 'mid_range' ? '🏨' : '💎'}
                                </span>
                                <p class="text-xs font-bold text-white font-heading uppercase tracking-wider group-hover:text-emerald-400 transition-colors">${translateFn(`wallet.profiles.${key}`)}</p>
                                <p class="text-[9px] text-zinc-500 font-mono mt-1 group-hover:text-zinc-400">TARGET: <span class="text-white">${p.daily_total}</span> DH/DAY</p>
                            </div>
                            <!-- Corner Accents -->
                            <div class="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-void-600 group-hover:border-emerald-500 transition-colors"></div>
                        </button>
                    `).join('')}
                </div>
            </div>

            <!-- CUSTOM PARAMETERS -->
            <div class="p-6 bg-black border border-void-800 rounded-sm relative overflow-hidden">
                <div class="absolute top-0 right-0 p-3 opacity-20 text-4xl text-void-700 font-heading">⚙️</div>
                <p class="text-[10px] text-emerald-500 font-mono uppercase mb-4 tracking-[0.2em]">/// MANUAL_OVERRIDE_PARAMS</p>
                
                <div class="space-y-4 relative z-10">
                    <div class="flex items-center gap-4">
                            <label for="setup-total" class="text-[10px] text-zinc-500 font-mono uppercase w-32 tracking-wider">TOTAL_BUDGET</label>
                            <div class="flex-1 relative group/input">
                                <input type="number" id="setup-total" name="setup_total" class="w-full bg-void-900 border-b border-void-700 text-white font-mono text-sm py-2 focus:border-emerald-500 outline-none transition-colors placeholder-void-600" placeholder="0000">
                                <span class="absolute right-0 top-2 text-[10px] text-void-500 font-mono">DH</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-4">
                             <label for="setup-days" class="text-[10px] text-zinc-500 font-mono uppercase w-32 tracking-wider">MISSION_DURATION</label>
                            <div class="flex-1 relative group/input">
                                <input type="number" id="setup-days" name="setup_days" class="w-full bg-void-900 border-b border-void-700 text-white font-mono text-sm py-2 focus:border-emerald-500 outline-none transition-colors placeholder-void-600" placeholder="0" value="5">
                                 <span class="absolute right-0 top-2 text-[10px] text-void-500 font-mono">DAYS</span>
                            </div>
                        </div>

                     <!-- INIT BUTTON -->
                    <button id="start-wallet-btn" class="w-full mt-4 py-4 bg-emerald-600 hover:bg-emerald-500 text-black font-heading font-black text-sm uppercase tracking-[0.2em] rounded-sm transition-all shadow-[0_5px_20px_rgba(16,185,129,0.2)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.4)] active:scale-[0.98]">
                        INITIALIZE SYSTEM
                    </button>
                </div>
            </div>

            <!-- DCC WARNING (COMPACT) -->
             <div class="mt-6 p-4 bg-red-950/20 border-l-2 border-red-500 rounded-r-sm">
                <div class="flex items-center gap-2 mb-1">
                    <span class="text-xl animate-pulse">🛑</span>
                    <h3 class="font-heading font-bold text-red-500 text-xs tracking-wider">CRITICAL ADVISORY</h3>
                </div>
                <p class="text-[10px] text-red-300/80 leading-relaxed font-mono">
                    ${translateFn('wallet.dcc.full_desc')} <strong class="text-white">"MAD"</strong>. ${translateFn('wallet.dcc.full_warning')}
                </p>
            </div>
        `;
        };
    }

    if (typeof protocolsUtils.protocolsBuildWalletTabHtml !== 'function') {
        protocolsUtils.protocolsBuildWalletTabHtml = function protocolsBuildWalletTabHtml(payload) {
            const status = payload.status;
            const tips = payload.tips;
            const recentTransactions = payload.recentTransactions;
            const walletState = payload.walletState;
            const isWalletExecutionLocked = payload.isWalletExecutionLocked;
            const visuals = payload.visuals;
            const getCategoryEmojiFn = payload.getCategoryEmojiFn;
            const formatTimeFn = payload.formatTimeFn;
            const translateFn = payload.translateFn;

            return `
            <!-- HEADER -->
            <div class="mb-6 flex items-center justify-between">
                <div>
                    <h2 class="font-heading text-xl font-bold text-white tracking-widest shadow-emerald-glow">SMART_WALLET</h2>
                    <p class="text-[10px] text-emerald-500/60 font-mono uppercase tracking-[0.2em]">/// Financial_Command_Core</p>
                </div>
                <div class="text-2xl animate-pulse-slow">🛡️</div>
            </div>

            <!-- HOLOGRAPHIC BUDGET VAULT -->
            <div class="relative overflow-hidden rounded-sm bg-void-950 border ${visuals.borderColor} ${visuals.shadowColor} mb-6 group transition-all duration-500">
                <!-- SCANLINE BG -->
                <div class="absolute inset-0 opacity-20 pointer-events-none" 
                     style="background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(16, 185, 129, 0.05) 2px, rgba(16, 185, 129, 0.05) 4px); animation: scrollScanlines 15s linear infinite;">
                </div>
                
                <div class="relative p-6 z-10">
                    <!-- STATUS HEADER -->
                    <div class="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                        <div class="flex items-center gap-2">
                            <span class="w-1.5 h-1.5 bg-${visuals.statusColor}-500 rounded-full animate-ping"></span>
                            <p class="text-[10px] text-${visuals.statusColor}-400 font-mono uppercase tracking-[0.2em] font-bold">
                                ${status.emoji} ${status.status}
                            </p>
                        </div>
                        <p class="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
                            DAY ${status.days_elapsed} <span class="text-zinc-700">/</span> ${walletState.budget.days}
                        </p>
                    </div>

                    <!-- MAIN READOUT -->
                    <div class="flex justify-between items-end mb-6">
                        <div>
                            <p class="text-[10px] text-zinc-500 font-mono uppercase mb-1">Available Funds</p>
                            <div class="font-heading text-4xl font-black ${visuals.mainColor} tracking-wider flex items-baseline gap-1" style="text-shadow: 0 0 20px rgba(16,185,129,0.3);">
                                ${status.remaining}<span class="text-sm font-mono opacity-70">DH</span>
                            </div>
                            <p class="text-[10px] text-zinc-500 font-mono mt-1">
                                // TOTAL CAPACITY: <span class="text-zinc-300">${status.total} DH</span>
                            </p>
                        </div>
                        
                        <div class="text-right">
                             <div class="bg-void-900/80 border border-void-700 p-2 rounded-sm backdrop-blur-sm">
                                <p class="text-[9px] text-zinc-500 font-mono uppercase mb-1">BURN RATE</p>
                                <p class="font-mono text-lg font-bold ${status.daily_spent > status.daily_budget ? 'text-amber-500' : 'text-white'}">
                                    ${status.daily_spent}<span class="text-xs text-zinc-600">/${status.daily_budget}</span>
                                </p>
                             </div>
                        </div>
                    </div>

                    <!-- REACTOR PROGRESS BAR -->
                    <div class="relative h-2 bg-void-900 rounded-full overflow-hidden border border-white/5">
                        <div class="absolute inset-0 opacity-10" style="background-image: linear-gradient(90deg, transparent 50%, #fff 50%); background-size: 4px 100%;"></div>
                        <div class="h-full ${status.remaining < 0 ? 'bg-red-500' : 'bg-gradient-to-r from-emerald-600 to-emerald-400'} relative transition-all duration-1000 ease-out" 
                             style="width: ${Math.min(status.pct_spent, 100)}%; box-shadow: 0 0 15px ${status.remaining < 0 ? 'rgba(239,68,68,0.5)' : 'rgba(16,185,129,0.5)'}">
                            <div class="absolute right-0 top-0 bottom-0 w-[1px] bg-white/50 animate-pulse"></div>
                        </div>
                    </div>
                    <div class="flex justify-between mt-2 text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                        <span>${status.spent} DH DEPLOYED</span>
                        <span>${status.pct_spent}% UTILIZATION</span>
                    </div>
                </div>
            </div>

            <!-- DCC SHIELD WARNING (TACTICAL ALERT) -->
            <div class="relative overflow-hidden p-4 bg-red-950/20 border-l-2 border-red-500 rounded-r-sm mb-6 group">
                <div class="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div class="flex items-start gap-3 relative z-10">
                    <div class="text-2xl mt-[-2px] animate-pulse">🛑</div>
                    <div>
                        <p class="text-[10px] text-red-500 font-mono font-bold uppercase tracking-[0.15em] mb-1">DCC_PROTOCOL_WARNING</p>
                        <p class="text-xs text-red-200/80 leading-relaxed font-sans">${translateFn('wallet.dcc.warning')}</p>
                    </div>
                </div>
            </div>

            <!-- TACHYON INPUT TERMINAL -->
            <div class="p-5 bg-black border border-void-800 rounded-sm mb-6 shadow-inner relative overflow-hidden">
                <div class="absolute top-0 right-0 p-2 opacity-20 text-[60px] text-zinc-800 font-heading pointer-events-none leading-none select-none">INPUT</div>
                
                <p class="text-[10px] text-emerald-500 font-mono uppercase mb-4 tracking-[0.2em] flex items-center gap-2">
                    <span class="w-1 h-1 bg-emerald-500"></span> NEW_TRANSACTION_ENTRY
                </p>

                <div class="space-y-4 relative z-10">
                    <div class="flex gap-3">
                         <!-- AMOUNT -->
                        <div class="w-1/3 relative group/input">
                            <label for="expense-amount" class="block text-[9px] text-void-500 font-mono mb-1 ml-1 group-focus-within/input:text-emerald-500 transition-colors">AMOUNT</label>
                            <input type="number" id="expense-amount" 
                                   name="expense_amount"
                                   class="w-full bg-void-900 border border-void-700 rounded-none px-3 py-3 text-white font-mono text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all placeholder-void-600" 
                                   placeholder="0.00">
                        </div>
                        
                        <!-- DESCRIPTION -->
                        <div class="flex-1 relative group/input">
                            <label for="expense-desc" class="block text-[9px] text-void-500 font-mono mb-1 ml-1 group-focus-within/input:text-emerald-500 transition-colors">DESIGNATION</label>
                            <input type="text" id="expense-desc" 
                                   name="expense_desc"
                                   class="w-full bg-void-900 border border-void-700 rounded-none px-3 py-3 text-white font-mono text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all placeholder-void-600" 
                                   placeholder="ENTER_ITEM_ID">
                        </div>
                    </div>

                    <div class="flex gap-3">
                        <!-- CATEGORY SECTOR -->
                        <div class="flex-1 relative group/select">
                             <label for="expense-category" class="block text-[9px] text-void-500 font-mono mb-1 ml-1 group-focus-within/select:text-emerald-500 transition-colors">SECTOR</label>
                            <select id="expense-category" name="expense_category" class="w-full bg-void-900 border border-void-700 rounded-none px-3 py-3 text-zinc-300 text-sm font-mono focus:border-emerald-500 outline-none appearance-none">
                                <option value="food">🍲 NUTRITION</option>
                                <option value="transport">🚕 TRANSPORT</option>
                                <option value="shopping">🛍️ ACQUISITION</option>
                                <option value="activities">🎟️ OPERATIONS</option>
                                <option value="services">📱 SERVICES</option>
                                <option value="other">📦 MISC_LOGS</option>
                            </select>
                            <div class="absolute right-3 bottom-3.5 text-xs text-void-500 pointer-events-none">▼</div>
                        </div>

                        <!-- EXECUTE BUTTON -->
                        <div class="flex items-end">
                            <button id="add-expense-btn" data-locked="${isWalletExecutionLocked ? '1' : '0'}" class="h-[42px] px-6 ${isWalletExecutionLocked ? 'bg-signal-amber hover:bg-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)]' : 'bg-emerald-600 hover:bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]'} font-heading font-black text-xs tracking-[0.15em] rounded-sm transition-all active:scale-95 flex items-center gap-2">
                                <span>${isWalletExecutionLocked ? 'UNLOCK ULTIMATE ACCESS' : 'EXECUTE'}</span>
                                <span class="bg-black/20 px-1 rounded text-[9px]">${isWalletExecutionLocked ? '🔒' : '⏎'}</span>
                            </button>
                        </div>
                    </div>
                    ${isWalletExecutionLocked ? `
                        <p class="text-[10px] text-signal-amber/80 font-mono uppercase tracking-wider">Basic can inspect wallet intel. Execute is Ultimate only.</p>
                    ` : ''}
                </div>
            </div>

            <!-- INTELLIGENCE FEED -->
            ${tips.length > 0 ? `
                <div class="mb-6 space-y-3">
                    ${tips.map(tip => `
                        <div class="relative p-3 bg-blue-950/30 border border-blue-500/30 rounded-sm group overflow-hidden" data-tip-id="${tip.id}">
                             <div class="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div class="flex items-start justify-between relative z-10">
                                <div class="flex-1">
                                    <p class="text-[9px] text-blue-400 font-mono font-bold uppercase tracking-[0.1em] mb-1">/// INTEL_SUGGESTION</p>
                                    <p class="text-xs font-bold text-white mb-1 shadow-blue-glow">${tip.title}</p>
                                    <p class="text-xs text-blue-100/70 whitespace-pre-line font-light">${tip.message}</p>
                                </div>
                                <button class="dismiss-tip-btn text-blue-500/50 hover:text-blue-400 transition-colors p-1" data-tip="${tip.id}">✕</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            <!-- DATA STREAM (TRANSACTIONS) -->
            <div class="relative">
                <div class="flex items-center justify-between mb-3 border-b border-void-800 pb-2">
                    <p class="text-[10px] text-zinc-400 font-mono uppercase tracking-[0.15em]">DATA_STREAM_LOG</p>
                    <span class="text-[9px] text-void-600 font-mono">${recentTransactions.length} ENTRIES</span>
                </div>

                ${recentTransactions.length > 0 ? `
                    <div class="space-y-1">
                        ${recentTransactions.map((tx, i) => {
                const priceCheck = tx.priceComparison;
                const hasAlert = priceCheck && priceCheck.found && priceCheck.severity !== 'ok' && priceCheck.severity !== 'good';

                return `
                                <div class="group flex items-center justify-between p-3 bg-void-900/30 border border-transparent hover:border-void-700 hover:bg-void-900 rounded-sm transition-all" style="animation: fadeIn 0.3s ease-out ${i * 0.05}s backwards;">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 flex items-center justify-center bg-void-950 border border-void-800 rounded-sm text-sm group-hover:border-emerald-500/30 transition-colors">
                                            ${getCategoryEmojiFn(tx.category)}
                                        </div>
                                        <div>
                                            <p class="text-xs text-white font-mono tracking-wide group-hover:text-emerald-300 transition-colors">${tx.description}</p>
                                            <p class="text-[9px] text-void-500 font-mono uppercase">${formatTimeFn(tx.timestamp)} // ${tx.category.toUpperCase()}</p>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <p class="text-sm font-mono font-bold text-white tracking-widest">${tx.amount}<span class="text-[9px] text-zinc-500 ml-1">DH</span></p>
                                        ${hasAlert ? `<p class="text-[9px] font-mono font-bold mt-0.5 ${priceCheck.severity === 'critical' ? 'text-red-500 animate-pulse' : 'text-amber-500'}">⚠️ ${priceCheck.verdict.toUpperCase()}</p>` : ''}
                                    </div>
                                </div>
                            `;
            }).join('')}
                    </div>
                ` : `
                    <div class="py-8 text-center border border-dashed border-void-800 rounded-sm opacity-50">
                        <p class="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">NO_DATA_STREAM_DETECTED</p>
                    </div>
                `}
            </div>

            <!-- ANALYTICS PREVIEW (MINI) -->
            <div class="mt-6 pt-4 border-t border-void-800 grid grid-cols-2 gap-2">
                 ${Object.entries(walletState.categories).slice(0, 4).map(([cat, data]) => `
                    <div class="flex justify-between items-center p-2 bg-black/40 rounded-sm border border-white/5">
                        <span class="text-[9px] text-zinc-500 uppercase font-mono">${cat}</span>
                        <span class="text-[10px] text-zinc-300 font-mono">${data.total} DH</span>
                    </div>
                `).join('')}
            </div>

            <!-- RESET CONTROL -->
            <div class="mt-8 text-center">
                <button id="reset-wallet-btn" class="text-[9px] text-void-600 hover:text-red-500 font-mono uppercase tracking-[0.2em] transition-colors border-b border-transparent hover:border-red-500/50 pb-0.5">
                    [ SYSTEM_RESET_PROTOCOL ]
                </button>
            </div>
        `;
        };
    }

    if (typeof protocolsUtils.protocolsRenderWalletTabFlow !== 'function') {
        protocolsUtils.protocolsRenderWalletTabFlow = function protocolsRenderWalletTabFlow(options = {}) {
            const walletState = options.walletState || {};
            const renderWalletSetupFn = options.renderWalletSetupFn || (() => '');
            if (!walletState.initialized) {
                return renderWalletSetupFn();
            }

            const analyzeBudgetStatusFn = options.analyzeBudgetStatusFn || (() => ({}));
            const suggestTipsFn = options.suggestTipsFn || (() => []);
            const normalizeTierTagFn = options.normalizeTierTagFn || ((value) => value);
            const getFeatureUsageStatusFn = options.getFeatureUsageStatusFn || (() => ({ allowed: true }));
            const trackLockImpressionFn = options.trackLockImpressionFn || (() => { });
            const getCategoryEmojiFn = options.getCategoryEmojiFn || (() => '📦');
            const formatTimeFn = options.formatTimeFn || (() => '');
            const translateFn = options.translateFn || ((key) => key);

            const status = analyzeBudgetStatusFn();
            const tips = suggestTipsFn();
            const recentTransactions = walletState.transactions.slice(-5).reverse();
            const tier = normalizeTierTagFn(options.userTier || windowObj.USER_TIER || 'BASIC');
            const walletFeatureStatus = getFeatureUsageStatusFn(options.protocolsWalletExecuteFeature);
            const isWalletExecutionLocked = tier !== 'ULTIMATE' && !walletFeatureStatus.allowed;

            if (isWalletExecutionLocked) {
                trackLockImpressionFn('PROTOCOLS_WALLET_EXECUTE', 'protocols_wallet_execute_button');
            }

            const visuals = typeof protocolsUtils.protocolsResolveWalletVisualState === 'function'
                ? protocolsUtils.protocolsResolveWalletVisualState(status)
                : {
                    statusColor: 'emerald',
                    mainColor: 'text-emerald-400',
                    borderColor: 'border-emerald-500/30',
                    shadowColor: 'shadow-[0_0_30px_rgba(16,185,129,0.1)]'
                };

            if (typeof protocolsUtils.protocolsBuildWalletTabHtml === 'function') {
                return protocolsUtils.protocolsBuildWalletTabHtml({
                    status,
                    tips,
                    recentTransactions,
                    walletState,
                    isWalletExecutionLocked,
                    visuals,
                    getCategoryEmojiFn,
                    formatTimeFn,
                    translateFn
                });
            }

            return '';
        };
    }

    if (typeof protocolsUtils.protocolsAttachWalletListenersFlow !== 'function') {
        protocolsUtils.protocolsAttachWalletListenersFlow = function protocolsAttachWalletListenersFlow(options = {}) {
            const documentObj = options.documentObj || windowObj.document;
            const getKBFn = options.getKBFn || (() => ({}));
            const updateBudgetPreviewFn = options.updateBudgetPreviewFn || (() => { });
            const getWalletStateFn = options.getWalletStateFn || (() => ({}));
            const setWalletStateFn = options.setWalletStateFn || (() => { });
            const saveWalletStateFn = options.saveWalletStateFn || (() => { });
            const renderWalletTabFn = options.renderWalletTabFn || (() => '');
            const attachWalletListenersFn = options.attachWalletListenersFn || (() => { });
            const promptProtocolsWalletUpgradeFn = options.promptProtocolsWalletUpgradeFn || (() => { });
            const generateIdFn = options.generateIdFn || (() => '');
            const detectScamFn = options.detectScamFn || (() => ({ scam_detected: false, alerts: [] }));
            const compareFairPriceFn = options.compareFairPriceFn || (() => ({ found: false }));
            const alertFn = options.alertFn || windowObj.alert;
            const setTimeoutFn = options.setTimeoutFn || windowObj.setTimeout;
            const loadWalletStateFn = options.loadWalletStateFn || (() => ({}));
            const confirmFn = options.confirmFn || windowObj.confirm;

            const rerenderWallet = () => {
                const container = documentObj.getElementById('protocol-content');
                if (!container) return;
                container.innerHTML = renderWalletTabFn();
                attachWalletListenersFn();
            };

            // Profile selection buttons
            documentObj.querySelectorAll('.profile-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    // Remove selection from all
                    documentObj.querySelectorAll('.profile-btn').forEach(b => {
                        b.classList.remove('bg-signal-emerald/20', 'border-signal-emerald/50');
                        b.classList.add('bg-void-800', 'border-void-700');
                    });
                    // Add selection to clicked
                    btn.classList.add('bg-signal-emerald/20', 'border-signal-emerald/50');
                    btn.classList.remove('bg-void-800', 'border-void-700');

                    // Update budget preview
                    const profile = btn.dataset.profile;
                    const kb = getKBFn();
                    const profileData = kb.budget_profiles?.[profile];
                    if (profileData) {
                        const setupTotal = documentObj.getElementById('setup-total');
                        const setupDays = documentObj.getElementById('setup-days');
                        const days = parseInt(setupDays?.value) || 5;

                        // Auto-fill suggested budget
                        if (setupTotal && !setupTotal.value) {
                            setupTotal.value = profileData.daily_total * days;
                        }

                        updateBudgetPreviewFn();
                    }
                });
            });

            // Budget inputs change preview
            const setupTotal = documentObj.getElementById('setup-total');
            const setupDays = documentObj.getElementById('setup-days');

            if (setupTotal) {
                setupTotal.addEventListener('input', updateBudgetPreviewFn);
            }
            if (setupDays) {
                setupDays.addEventListener('input', updateBudgetPreviewFn);
            }

            // Start wallet button
            const startBtn = documentObj.getElementById('start-wallet-btn');
            if (startBtn) {
                startBtn.addEventListener('click', () => {
                    const total = parseInt(documentObj.getElementById('setup-total')?.value) || 0;
                    const days = parseInt(documentObj.getElementById('setup-days')?.value) || 5;
                    const profileBtn = documentObj.querySelector('.profile-btn.bg-signal-emerald\\/20');
                    const profile = profileBtn?.dataset.profile || 'budget';

                    if (total <= 0) {
                        alertFn('Please enter a budget amount');
                        return;
                    }

                    // Initialize wallet
                    const walletState = getWalletStateFn();
                    walletState.initialized = true;
                    walletState.budget = {
                        total: total,
                        days: days,
                        style: profile,
                        startDate: new Date().toISOString()
                    };
                    saveWalletStateFn();
                    rerenderWallet();
                });
            }

            // Add expense button
            const addBtn = documentObj.getElementById('add-expense-btn');
            if (addBtn) {
                addBtn.addEventListener('click', () => {
                    if (addBtn.dataset.locked === '1') {
                        promptProtocolsWalletUpgradeFn('protocols_wallet_execute_button');
                        return;
                    }

                    const amount = parseInt(documentObj.getElementById('expense-amount')?.value) || 0;
                    const desc = documentObj.getElementById('expense-desc')?.value || '';
                    const category = documentObj.getElementById('expense-category')?.value || 'other';

                    if (amount <= 0) {
                        alertFn('Please enter an amount');
                        return;
                    }

                    // Create transaction
                    const tx = {
                        id: generateIdFn(),
                        timestamp: Date.now(),
                        description: desc || category,
                        amount: amount,
                        category: category
                    };

                    // Run intelligence checks
                    const scamResult = detectScamFn(tx);
                    const priceResult = compareFairPriceFn(tx.description, tx.amount, tx.category);

                    tx.scamAlerts = scamResult.alerts;
                    tx.priceComparison = priceResult;

                    // Add to state
                    const walletState = getWalletStateFn();
                    walletState.transactions.push(tx);
                    walletState.categories[category].total += amount;
                    walletState.categories[category].count += 1;

                    // Show alerts if any
                    if (scamResult.scam_detected && scamResult.alerts.length > 0) {
                        const alert = scamResult.alerts[0];
                        if (alert.severity === 'critical' || alert.severity === 'high') {
                            setTimeoutFn(() => {
                                alertFn(alert.message);
                            }, 100);
                        }
                    }

                    if (priceResult.found && (priceResult.severity === 'critical' || priceResult.severity === 'high')) {
                        setTimeoutFn(() => {
                            alertFn(priceResult.message);
                        }, 200);
                    }

                    saveWalletStateFn();
                    rerenderWallet();
                });
            }

            // Dismiss tip buttons
            documentObj.querySelectorAll('.dismiss-tip-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const tipId = btn.dataset.tip;
                    const walletState = getWalletStateFn();
                    walletState.dismissedTips.push(tipId);
                    saveWalletStateFn();
                    rerenderWallet();
                });
            });

            // Reset wallet button
            const resetBtn = documentObj.getElementById('reset-wallet-btn');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    if (confirmFn('Reset wallet? This will clear all transactions and budget settings.')) {
                        const nextWalletState = loadWalletStateFn();
                        nextWalletState.initialized = false;
                        nextWalletState.transactions = [];
                        nextWalletState.categories = {
                            food: { total: 0, count: 0 },
                            transport: { total: 0, count: 0 },
                            shopping: { total: 0, count: 0 },
                            activities: { total: 0, count: 0 },
                            services: { total: 0, count: 0 },
                            other: { total: 0, count: 0 }
                        };
                        nextWalletState.dismissedTips = [];
                        setWalletStateFn(nextWalletState);
                        saveWalletStateFn();
                        rerenderWallet();
                    }
                });
            }

            return true;
        };
    }
})(typeof window !== 'undefined' ? window : null);
