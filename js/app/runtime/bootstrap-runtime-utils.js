/**
 * ALIDADE Runtime Bootstrap Utilities
 * Extracted from legacy app.js with adapter hooks.
 */
(function bootstrapRuntimeBootstrapUtils(windowObj) {
    if (!windowObj) return;

    const runtimeUtils = windowObj.ALIDADE_RUNTIME_UTILS || (windowObj.ALIDADE_RUNTIME_UTILS = {});

    if (typeof runtimeUtils.startBootstrapRuntime !== 'function') {
        runtimeUtils.startBootstrapRuntime = function startBootstrapRuntime(adapter = {}) {
            if (windowObj.__ALIDADE_BOOTSTRAP_RUNTIME_WIRED__) {
                return;
            }
            windowObj.__ALIDADE_BOOTSTRAP_RUNTIME_WIRED__ = true;

            const doc = adapter.document || windowObj.document;
            if (!doc) return;

            const init = typeof adapter.init === 'function'
                ? adapter.init
                : async () => { };
            const renderFallback = typeof adapter.renderFallback === 'function'
                ? adapter.renderFallback
                : () => { };
            const checkUrlForMagicLink = typeof adapter.checkUrlForMagicLink === 'function'
                ? adapter.checkUrlForMagicLink
                : () => { };
            const error = typeof adapter.error === 'function'
                ? adapter.error
                : (...args) => console.error(...args);

            const bootstrap = async () => {
                if (windowObj.__ALIDADE_BOOTSTRAP_RUNTIME_STARTED__) {
                    return;
                }
                windowObj.__ALIDADE_BOOTSTRAP_RUNTIME_STARTED__ = true;
                try {
                    await init();
                } catch (e) {
                    error('[ALIDADE] Critical initialization error:', e);
                    // Fallback render if everything fails
                    renderFallback();
                } finally {
                    windowObj.__ALIDADE_BOOTSTRAP_RUNTIME_COMPLETED__ = true;
                }
            };

            if (doc.readyState === 'loading') {
                doc.addEventListener('DOMContentLoaded', async () => {
                    await bootstrap();
                    checkUrlForMagicLink();
                });
            } else {
                Promise.resolve(bootstrap()).then(() => checkUrlForMagicLink());
            }
        };
    }

    if (typeof runtimeUtils.resolveGoldenRecordBootstrapPolicy !== 'function') {
        runtimeUtils.resolveGoldenRecordBootstrapPolicy = function resolveGoldenRecordBootstrapPolicy(options = {}) {
            const win = options.windowObj || windowObj;
            const globalPolicy = win.ALIDADE_SECURITY_POLICY?.goldenRecord || {};
            const optionPolicy = options.goldenRecordPolicy || {};
            const strictMode = options.strictGoldenRecordGate === true ||
                optionPolicy.strict === true ||
                globalPolicy.strict === true ||
                win.__ALIDADE_STRICT_SECURITY_MODE__ === true;

            const rawFailOpen = optionPolicy.failOpen ?? globalPolicy.failOpen;
            const rawBlockStartup = options.blockStartupOnGoldenRecordFailure ??
                optionPolicy.blockStartupOnFailure ??
                globalPolicy.blockStartupOnFailure;
            const dataUrl = String(
                optionPolicy.dataUrl ||
                globalPolicy.dataUrl ||
                options.goldenRecordDataUrl ||
                './golden-record-v1.0.2.json'
            );

            const failOpen = strictMode ? false : rawFailOpen !== false;
            const blockStartupOnFailure = strictMode || rawBlockStartup === true;

            return {
                strictMode,
                failOpen,
                blockStartupOnFailure,
                dataUrl
            };
        };
    }

    if (typeof runtimeUtils.setGoldenRecordSecurityState !== 'function') {
        runtimeUtils.setGoldenRecordSecurityState = function setGoldenRecordSecurityState(nextState = {}, options = {}) {
            const win = options.windowObj || windowObj;
            const stateRoot = win.__ALIDADE_RUNTIME_SECURITY_STATE__ || (win.__ALIDADE_RUNTIME_SECURITY_STATE__ = {});
            const previous = stateRoot.goldenRecord || {};
            const merged = {
                ...previous,
                ...nextState,
                updatedAt: new Date().toISOString()
            };
            stateRoot.goldenRecord = merged;

            try {
                win.dispatchEvent(new CustomEvent('alidade:securityStateChanged', {
                    detail: {
                        subsystem: 'golden_record',
                        state: merged
                    }
                }));
            } catch (_error) {
                // Non-blocking: security state event is best effort.
            }

            return merged;
        };
    }

    if (typeof runtimeUtils.resolveInitializeAlidadeAppFlow !== 'function') {
        runtimeUtils.resolveInitializeAlidadeAppFlow = async function resolveInitializeAlidadeAppFlow(options = {}) {
            const win = options.windowObj || windowObj;
            const doc = options.documentObj || win.document;
            const nav = options.navigatorObj || win.navigator;
            const logger = options.consoleObj || console;
            const setTimeoutFn = options.setTimeoutFn || setTimeout;
            const debugLogs = options.debugLogs === true || win.__ALIDADE_DEBUG_LOGS__ === true;
            const debugLog = (...args) => {
                if (debugLogs) logger.log(...args);
            };

            debugLog('[APP] Initializing ALIDADE...');

            try {
                if (!win.i18n || typeof win.i18n.getCurrentLanguage !== 'function') {
                    debugLog('[APP] Waiting for i18n module...');
                    await new Promise((resolve) => {
                        const handler = () => {
                            win.removeEventListener('i18nReady', handler);
                            resolve();
                        };
                        win.addEventListener('i18nReady', handler);
                        setTimeoutFn(resolve, 2000);
                    });
                }

                debugLog('[APP] i18n confirmed:', win.i18n ? win.i18n.getCurrentLanguage() : 'fallback');
                const goldenRecordPolicy = runtimeUtils.resolveGoldenRecordBootstrapPolicy({
                    windowObj: win,
                    goldenRecordPolicy: options.goldenRecordPolicy,
                    strictGoldenRecordGate: options.strictGoldenRecordGate,
                    blockStartupOnGoldenRecordFailure: options.blockStartupOnGoldenRecordFailure,
                    goldenRecordDataUrl: options.goldenRecordDataUrl
                });
                runtimeUtils.setGoldenRecordSecurityState({
                    status: 'pending',
                    mode: goldenRecordPolicy.strictMode ? 'strict' : 'standard',
                    failOpen: goldenRecordPolicy.failOpen,
                    blockStartupOnFailure: goldenRecordPolicy.blockStartupOnFailure,
                    dataUrl: goldenRecordPolicy.dataUrl
                }, { windowObj: win });

                const preloadGoldenRecordFn = typeof options.preloadGoldenRecordFn === 'function'
                    ? () => options.preloadGoldenRecordFn(goldenRecordPolicy)
                    : (
                        win.ALIDADE_GOLDEN_RECORD_UTILS &&
                        typeof win.ALIDADE_GOLDEN_RECORD_UTILS.ensureGoldenRecordLoaded === 'function'
                            ? () => win.ALIDADE_GOLDEN_RECORD_UTILS.ensureGoldenRecordLoaded({
                                windowObj: win,
                                consoleObj: logger,
                                dataUrl: goldenRecordPolicy.dataUrl,
                                failOpen: goldenRecordPolicy.failOpen
                            })
                            : null
                    );

                if (preloadGoldenRecordFn) {
                    debugLog('[APP] Loading golden record...');
                    try {
                        const goldenRecordResult = await preloadGoldenRecordFn();
                        if (goldenRecordResult && goldenRecordResult.status === 'failed') {
                            const failedState = runtimeUtils.setGoldenRecordSecurityState({
                                status: goldenRecordPolicy.blockStartupOnFailure ? 'blocked' : 'degraded',
                                mode: goldenRecordPolicy.strictMode ? 'strict' : 'standard',
                                reason: 'loader_returned_failed',
                                message: goldenRecordResult?.error?.message || 'integrity gate failed',
                                dataUrl: goldenRecordPolicy.dataUrl
                            }, { windowObj: win });

                            if (goldenRecordPolicy.blockStartupOnFailure) {
                                throw new Error(`[GOLDEN_RECORD] fail-closed policy blocked startup (${failedState.status})`);
                            }
                            logger.warn('[APP] Golden record integrity gate failed; continuing in degraded mode');
                        } else if (goldenRecordResult?.meta?.datasetVersion) {
                            runtimeUtils.setGoldenRecordSecurityState({
                                status: 'verified',
                                mode: goldenRecordPolicy.strictMode ? 'strict' : 'standard',
                                datasetVersion: goldenRecordResult.meta.datasetVersion || null,
                                checksumMode: goldenRecordResult.meta.checksumMode || null,
                                checksumDeclared: goldenRecordResult.meta.checksumDeclared || null,
                                checksumComputed: goldenRecordResult.meta.checksumComputed || null,
                                validationWarningCount: Number(goldenRecordResult.meta.validationWarningCount || 0),
                                dataUrl: goldenRecordResult.meta.dataUrl || goldenRecordPolicy.dataUrl
                            }, { windowObj: win });
                            debugLog('[APP] Golden record ready:', goldenRecordResult.meta.datasetVersion);
                        } else {
                            runtimeUtils.setGoldenRecordSecurityState({
                                status: 'verified',
                                mode: goldenRecordPolicy.strictMode ? 'strict' : 'standard',
                                dataUrl: goldenRecordPolicy.dataUrl
                            }, { windowObj: win });
                            debugLog('[APP] Golden record preload completed');
                        }
                    } catch (goldenRecordError) {
                        runtimeUtils.setGoldenRecordSecurityState({
                            status: goldenRecordPolicy.blockStartupOnFailure ? 'blocked' : 'degraded',
                            mode: goldenRecordPolicy.strictMode ? 'strict' : 'standard',
                            reason: 'loader_threw',
                            message: String(goldenRecordError?.message || goldenRecordError || 'unknown'),
                            dataUrl: goldenRecordPolicy.dataUrl
                        }, { windowObj: win });

                        if (goldenRecordPolicy.blockStartupOnFailure) {
                            throw goldenRecordError;
                        }
                        logger.warn('[APP] Golden record preload failed; continuing startup:', goldenRecordError);
                    }
                } else {
                    runtimeUtils.setGoldenRecordSecurityState({
                        status: 'unavailable',
                        mode: goldenRecordPolicy.strictMode ? 'strict' : 'standard',
                        reason: 'loader_unavailable',
                        dataUrl: goldenRecordPolicy.dataUrl
                    }, { windowObj: win });
                }

                if (typeof options.initializeAppStateFn === 'function') {
                    debugLog('[APP] Initializing state...');
                    options.initializeAppStateFn();
                } else {
                    logger.warn('[APP] initializeAppState not found');
                }

                if (options.vectorHudObj && typeof options.vectorHudObj.init === 'function') {
                    options.vectorHudObj.init();
                }

                if (nav && 'serviceWorker' in nav) {
                    const host = String(win.location?.hostname || '').toLowerCase();
                    if (host === '127.0.0.1' || host === 'localhost') {
                        nav.serviceWorker.getRegistrations()
                            .then((registrations) => Promise.all(registrations.map((reg) => reg.unregister())))
                            .catch((e) => logger.warn('[SW] Dev unregister failed:', e));
                    } else {
                        nav.serviceWorker.register('./sw.js').catch((e) => logger.warn('[SW] Fail:', e));
                    }
                }

                if (typeof options.initializeEmergencySOSModuleFn === 'function') {
                    await options.initializeEmergencySOSModuleFn();
                }

                debugLog('[APP] Rendering UI...');

                if (typeof options.renderAppFn === 'function') {
                    options.renderAppFn();
                    debugLog('[APP] Rendered via renderApp()');
                } else if (typeof options.renderViewFn === 'function') {
                    const view = typeof options.resolveRenderViewNameFn === 'function'
                        ? options.resolveRenderViewNameFn()
                        : 'HOME';
                    options.renderViewFn(view || 'HOME');
                    debugLog('[APP] Rendered via renderView()');
                } else {
                    throw new Error('No render function found (checked renderApp and renderView)');
                }

                win.alidade = {
                    updateTier: (tier) => {
                        if (win.appState && typeof win.appState.updateTier === 'function') {
                            win.appState.updateTier(tier);
                        } else if (win.stateManager && typeof win.stateManager.updateTier === 'function') {
                            win.stateManager.updateTier(tier);
                        } else {
                            logger.error('[APP] StateManager instance not found for updateTier');
                        }
                    }
                };

                setTimeoutFn(() => {
                    if (win.licenseManager) {
                        if (typeof win.updateUIByTier === 'function') {
                            win.updateUIByTier();
                        }
                        if (
                            typeof options.normalizeTierTagFn === 'function' &&
                            options.normalizeTierTagFn(win.USER_TIER || 'BASIC') === 'ULTIMATE' &&
                            typeof options.ensureUltimateDataPackFn === 'function'
                        ) {
                            options.ensureUltimateDataPackFn();
                        }
                    }
                }, 500);

                return true;
            } catch (error) {
                logger.warn('[APP] Standard initialization failed, attempting fallback...', error);

                const appContainer = doc.getElementById('protocol-content') || doc.getElementById('app');
                if (appContainer && !appContainer.innerHTML.trim()) {
                    debugLog('[APP] Triggering emergency render');
                    appContainer.innerHTML = `
                    <div class="p-8 text-center">
                        <h1 class="text-2xl font-bold text-signal-amber mb-4">SYSTEM NOMINAL - MANUAL MODE</h1>
                        <p class="text-zinc-400 mb-6">Translation system loaded: ${win.i18n ? 'YES' : 'NO'}</p>
                        <div class="grid gap-4 max-w-md mx-auto">
                            <button onclick="window.renderPriceChecker ? window.renderPriceChecker() : alert('Module loading...')" 
                                    class="p-4 bg-void-800 border border-void-700 rounded hover:border-signal-emerald">
                                Souk Operations (Price Check)
                            </button>
                            <button onclick="location.reload()" 
                                    class="mt-4 px-4 py-2 bg-void-900 text-zinc-500 text-sm rounded">
                                Reload System
                            </button>
                        </div>
                    </div>
                `;
                }
                return false;
            }
        };
    }

    if (typeof runtimeUtils.resolveRenderTierUpsellFab !== 'function') {
        runtimeUtils.resolveRenderTierUpsellFab = function resolveRenderTierUpsellFab(
            documentObj,
            licenseManagerObj,
            normalizeTierTagFn,
            consoleObj
        ) {
            const logger = consoleObj || console;
            const debugLogs = windowObj.__ALIDADE_DEBUG_LOGS__ === true;
            const debugLog = (...args) => {
                if (debugLogs) logger.log(...args);
            };
            if (!licenseManagerObj) return false;

            const user = licenseManagerObj.user;
            const tier = typeof normalizeTierTagFn === 'function'
                ? normalizeTierTagFn(user ? user.license_tier : 'BASIC').toLowerCase()
                : String(user?.license_tier || 'basic').toLowerCase();

            debugLog('[UI] Updating for tier:', tier);

            const existingFab = documentObj.getElementById('fab-activate-protocol');
            if (existingFab) existingFab.remove();

            if (tier === 'ultimate') {
                debugLog('[UI] ULTIMATE TIER ACTIVE');
                return true;
            }

            if (tier === 'basic') {
                const fab = documentObj.createElement('a');
                fab.id = 'fab-activate-protocol';
                fab.href = 'activate.html';
                fab.className = 'fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 animate-bounce-slight';
                fab.innerHTML = `
            <span>[+]</span>
            <span class="font-mono text-xs tracking-wider">ACTIVATE PROTOCOL</span>
        `;
                documentObj.body.appendChild(fab);
            }

            return true;
        };
    }

    if (typeof runtimeUtils.resolveGetAuthUserForGreeting !== 'function') {
        runtimeUtils.resolveGetAuthUserForGreeting = function resolveGetAuthUserForGreeting(options = {}) {
            const lm = options.licenseManagerObj || windowObj.licenseManager;
            const storage = options.localStorageObj || windowObj.localStorage;
            const authTokenKey = options.authTokenKey || 'sb-tynugwtetlclqowlguai-auth-token';

            if (lm && typeof lm.getAuthUser === 'function') {
                const authUser = lm.getAuthUser();
                if (authUser) return authUser;
            }

            if (lm?.authUser) return lm.authUser;

            try {
                const raw = storage.getItem(authTokenKey);
                if (!raw) return null;
                const parsed = JSON.parse(raw);
                return parsed?.user || parsed?.currentSession?.user || parsed?.session?.user || null;
            } catch (_error) {
                return null;
            }
        };
    }

    if (typeof runtimeUtils.resolveGetTacticalCallsign !== 'function') {
        runtimeUtils.resolveGetTacticalCallsign = function resolveGetTacticalCallsign(options = {}) {
            const authUser = typeof options.getAuthUserFn === 'function'
                ? options.getAuthUserFn()
                : null;
            const licenseManagerObj = options.licenseManagerObj || windowObj.licenseManager;
            const primaryName = String(authUser?.user_metadata?.full_name || '').trim();
            const secondaryEmail = String(authUser?.email || licenseManagerObj?.user?.email || '').trim();
            const rawName = primaryName || secondaryEmail || 'OPERATIVE';
            let callsign = String(rawName).split(/[@\s]+/)[0] || '';
            callsign = callsign.substring(0, 10).toUpperCase();
            return callsign || 'OPERATIVE';
        };
    }

    if (typeof runtimeUtils.resolveRenderDashboardMenuItem !== 'function') {
        runtimeUtils.resolveRenderDashboardMenuItem = function resolveRenderDashboardMenuItem(options = {}) {
            const title = options.title;
            const subtitle = options.subtitle;
            const icon = options.icon;
            const targetView = options.targetView;
            const requiredTier = options.requiredTier;
            const index = options.index || 0;
            const userTier = options.userTier || 'BASIC';

            const normalizeTierTagFn = typeof options.normalizeTierTagFn === 'function'
                ? options.normalizeTierTagFn
                : ((tier) => String(tier || 'BASIC'));
            const hasTierAccessFn = typeof options.hasTierAccessFn === 'function'
                ? options.hasTierAccessFn
                : (() => true);
            const trackLockImpressionFn = typeof options.trackLockImpressionFn === 'function'
                ? options.trackLockImpressionFn
                : (() => { });

            const normalizedRequiredTier = normalizeTierTagFn(requiredTier || 'BASIC');
            const normalizedUserTier = normalizeTierTagFn(userTier);
            const requiresGate = normalizedRequiredTier !== 'BASIC';
            const isLocked = requiresGate && !hasTierAccessFn(normalizedUserTier, normalizedRequiredTier);
            const featureKey = String(targetView || title || 'MODULE').replace(/'/g, "\\'");

            if (isLocked) {
                trackLockImpressionFn(featureKey, 'dashboard_card');
            }

            const clickAction = requiresGate
                ? `onclick="window.checkAccess('${normalizedRequiredTier}', () => window.alidadeApp.navigateTo('${targetView}'), '${featureKey}')"`
                : `onclick="window.alidadeApp.navigateTo('${targetView}')"` ;

            const delayClass = `delay-${(index * 100) + 100}`;
            const stateClass = isLocked ? 'border-signal-amber/30 bg-void-900/55' : '';

            return `
            <button class="group relative flex flex-col items-center justify-center p-5 min-h-[140px] rounded-xl border border-void-800 bg-void-900/40 backdrop-blur-md transition-all duration-300 hover:bg-void-800/60 hover:border-signal-amber/40 hover:scale-[1.02] active:scale-[0.98] overflow-hidden animate-[slide-up-fade_0.6s_ease-out_both] ${delayClass} ${stateClass}" ${clickAction}>
                
                <!-- Circuit Background Decoration -->
                <div class="absolute inset-0 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <pattern id="circuit-${index}" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M0 10h20M10 0v20" stroke="currentColor" stroke-width="1" class="text-zinc-500" fill="none"/>
                            <circle cx="10" cy="10" r="1.5" class="text-zinc-500" fill="currentColor"/>
                        </pattern>
                        <rect width="100%" height="100%" fill="url(#circuit-${index})"/>
                    </svg>
                </div>

                <!-- Hover Glow Effect -->
                <div class="absolute inset-0 bg-gradient-to-br from-signal-amber/0 via-transparent to-signal-amber/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <!-- Floating Icon -->
                <div class="relative mb-4 text-zinc-500 group-hover:text-signal-amber group-hover:scale-110 transition-all duration-300 filter group-hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
                    ${icon}
                </div>
                
                <!-- Content -->
                <div class="relative z-10 text-center space-y-1">
                    <h3 class="font-sans text-xs font-black text-zinc-300 tracking-wider uppercase group-hover:text-white transition-colors">
                        ${title}
                    </h3>
                    <p class="text-[9px] text-zinc-600 font-mono leading-tight max-w-[120px] mx-auto group-hover:text-signal-amber/80 transition-colors">
                        ${subtitle}
                    </p>
                </div>
                
                ${requiresGate && !isLocked ? `
                <div class="absolute top-3 right-3">
                   <div class="px-1.5 py-0.5 rounded-sm text-[8px] font-mono font-bold tracking-widest border text-signal-emerald border-signal-emerald/40 bg-signal-emerald/10">OPEN</div>
                </div>
                ` : ''}
                
                <!-- Corner Brackets -->
                <div class="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-void-700 opacity-50 group-hover:border-signal-amber/50 group-hover:opacity-100 transition-all"></div>
                <div class="absolute top-0 right-0 w-3 h-3 border-t border-r border-void-700 opacity-50 group-hover:border-signal-amber/50 group-hover:opacity-100 transition-all"></div>
            </button>
        `;
        };
    }

    if (typeof runtimeUtils.resolveRenderDashboardView !== 'function') {
        runtimeUtils.resolveRenderDashboardView = function resolveRenderDashboardView(options = {}) {
            const doc = options.documentObj || windowObj.document;
            const app = options.appElement || doc?.getElementById('app');
            if (!app) return false;

            const tFn = typeof options.tFn === 'function' ? options.tFn : ((key) => key);
            const tacticalCallsign = String(options.tacticalCallsign || 'OPERATIVE');
            const hasTierAccessFn = typeof options.hasTierAccessFn === 'function'
                ? options.hasTierAccessFn
                : (() => true);
            const userTier = options.userTier || 'BASIC';
            const trackLockImpressionFn = typeof options.trackLockImpressionFn === 'function'
                ? options.trackLockImpressionFn
                : (() => { });
            const currentTierObj = options.currentTierObj || {};
            const iconsObj = options.iconsObj || {};
            const renderMenuItemFn = typeof options.renderMenuItemFn === 'function'
                ? options.renderMenuItemFn
                : (() => '');
            const getRequiredTierForViewFn = typeof options.getRequiredTierForViewFn === 'function'
                ? options.getRequiredTierForViewFn
                : (() => 'BASIC');
            const securityState = windowObj.__ALIDADE_RUNTIME_SECURITY_STATE__?.goldenRecord || {};
            const fallbackMeta = windowObj.__ALIDADE_GOLDEN_RECORD_META__ || {};
            const securityStatus = String(
                securityState.status ||
                (windowObj.ALIDADE_GOLDEN_RECORD ? 'legacy_unverified' : 'unknown')
            ).toLowerCase();
            const securityConfigMap = {
                verified: { label: 'INTEL VERIFIED', textClass: 'text-signal-emerald', dotClass: 'bg-signal-emerald', borderClass: 'border-signal-emerald/40' },
                pending: { label: 'INTEL VERIFYING', textClass: 'text-signal-amber', dotClass: 'bg-signal-amber', borderClass: 'border-signal-amber/40' },
                degraded: { label: 'INTEL DEGRADED', textClass: 'text-signal-crimson', dotClass: 'bg-signal-crimson', borderClass: 'border-signal-crimson/40' },
                blocked: { label: 'INTEL BLOCKED', textClass: 'text-signal-crimson', dotClass: 'bg-signal-crimson', borderClass: 'border-signal-crimson/40' },
                unavailable: { label: 'INTEL OFFLINE', textClass: 'text-zinc-400', dotClass: 'bg-zinc-500', borderClass: 'border-void-700' },
                legacy_unverified: { label: 'INTEL LEGACY', textClass: 'text-signal-cyan', dotClass: 'bg-signal-cyan', borderClass: 'border-signal-cyan/40' },
                unknown: { label: 'INTEL UNKNOWN', textClass: 'text-zinc-400', dotClass: 'bg-zinc-500', borderClass: 'border-void-700' }
            };
            const securityUi = securityConfigMap[securityStatus] || securityConfigMap.unknown;
            const securityDatasetVersion = String(
                securityState.datasetVersion ||
                fallbackMeta.datasetVersion ||
                'n/a'
            );

            if (!hasTierAccessFn(userTier, 'ULTIMATE')) {
                trackLockImpressionFn('OFFLINE_ARCHIVE', 'dashboard_map_card');
                trackLockImpressionFn('LIVE_TACTICAL_MAP', 'dashboard_map_card');
            }

            const html = `


            <div class="p-4 space-y-8 pb-32 overflow-hidden">
                <!-- STATUS HEADER -->
                <header class="space-y-4 animate-[slide-up-fade_0.6s_ease-out]">
                    <div class="flex items-start justify-between">
                        <div class="space-y-1">
                            <div class="flex items-center gap-2">
                                 <div class="relative">
                                     <div class="w-2 h-2 bg-signal-emerald rounded-full"></div>
                                     <div class="absolute inset-0 w-2 h-2 bg-signal-emerald rounded-full animate-ping opacity-75"></div>
                                 </div>
                                 <p class="text-[10px] text-zinc-400 tracking-[0.3em] uppercase font-mono">
                                      SYSTEM ONLINE <span class="text-void-600">::</span> ${new Date().toLocaleTimeString('en-US', { hour12: false })}
                                  </p>
                             </div>
                             <div class="flex items-center gap-2 mt-1.5">
                                 <span class="w-1.5 h-1.5 rounded-full ${securityUi.dotClass}"></span>
                                 <p class="text-[9px] uppercase font-mono tracking-[0.2em] ${securityUi.textClass}">
                                     ${securityUi.label} <span class="text-void-600">::</span> V${securityDatasetVersion}
                                 </p>
                             </div>
                             <h1 class="font-sans text-3xl font-black tracking-tighter text-white leading-none drop-shadow-lg">
                                 ${tFn('home.greeting')}, <br/>
                                 <span class="text-transparent bg-clip-text bg-gradient-to-r from-signal-amber to-amber-200 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                                     ${tacticalCallsign}
                                </span>
                            </h1>
                        </div>
                        
                        <div class="flex flex-col items-end gap-3">
                            <!-- SETTINGS HIDDEN TEMPORARILY UNTIL i18n READY
                             <button onclick="window.alidadeApp.renderSettingsOverlay()" class="relative w-9 h-9 flex items-center justify-center rounded-full bg-void-900 border border-void-700 text-zinc-400 hover:text-white hover:border-signal-amber transition-all shadow-lg group overflow-hidden">
                                <div class="absolute inset-0 bg-signal-amber/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                <span class="relative text-sm transition-transform group-hover:rotate-180 duration-700">*</span>
                            </button>
                            -->
                            
                            <!-- Tactical Rank Badge -->
                            <div class="relative group">
                                <div class="absolute -inset-1 bg-gradient-to-r from-signal-amber to-transparent opacity-20 blur-sm group-hover:opacity-40 transition-opacity rounded-full"></div>
                                <span class="relative inline-flex items-center gap-2 px-4 py-1.5 bg-void-900/90 border border-void-700 group-hover:border-signal-amber/50 rounded-full text-[10px] font-mono font-bold tracking-widest ${currentTierObj.badgeTextColor} shadow-xl backdrop-blur-md transition-colors">
                                    ${currentTierObj.label === 'ULTIMATE' ? `<span class="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,1)]"></span>` : ''}
                                    ${currentTierObj.label}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                <!-- HOLOGRAPHIC MAP CARD -->
                <section class="group relative overflow-hidden rounded-xl border border-void-700 bg-void-950 shadow-2xl animate-[slide-up-fade_0.8s_ease-out_0.2s_both]">
                    
                    <!-- 1. Deep Space Background -->
                    <div class="absolute inset-0 bg-void-900/80 backdrop-blur-xl z-0"></div>
                    
                    <!-- 2. Animated Grid -->
                    <div class="absolute inset-0 tech-grid-bg opacity-20 pointer-events-none z-0"></div>
                    
                    <!-- 3. Scanning Laser Effect -->
                    <div class="animate-scan-line z-0"></div>
                    
                    <!-- 4. Drifting Reticle -->
                    <div class="absolute top-1/2 left-3/4 w-32 h-32 border border-signal-amber/10 rounded-full animate-drift pointer-events-none z-0 flex items-center justify-center">
                        <div class="w-24 h-24 border border-signal-amber/20 rounded-full border-dashed"></div>
                        <div class="absolute w-full h-px bg-signal-amber/10"></div>
                        <div class="absolute h-full w-px bg-signal-amber/10"></div>
                    </div>

                    <!-- 5. Active Content -->
                    <div class="relative z-10 p-6 space-y-6">
                        <div class="flex items-start justify-between">
                            <div class="space-y-1">
                                <div class="flex items-center gap-2">
                                    <span class="w-1.5 h-1.5 bg-green-500 animate-pulse rounded-full"></span>
                                    <p class="text-[9px] text-green-500/80 tracking-[0.2em] uppercase font-mono">LIVE FEED CONNECTED</p>
                                </div>
                                <h2 class="font-heading text-xl font-bold text-white tracking-wide drop-shadow-md">${tFn('dashboard.field_map')}</h2>
                            </div>
                            
                            <!-- Icon Container -->
                            <div class="relative p-3 rounded-lg border border-void-700 bg-void-900/50 text-signal-amber shadow-[0_0_15px_rgba(245,158,11,0.15)] group-hover:shadow-[0_0_25px_rgba(245,158,11,0.3)] transition-shadow duration-500">
                                ${iconsObj.map}
                            </div>
                        </div>
                        
                        <p class="text-sm text-zinc-400 leading-relaxed font-sans max-w-[90%] border-l-2 border-void-700 pl-3">
                            ${tFn('dashboard.map_desc')}
                        </p>
                        
                        <div class="space-y-3 pt-2">
                             ${currentTierObj.offlineFile && currentTierObj.offlineFile !== '#' ? `
                            <a href="${currentTierObj.offlineFile}" 
                               download
                               class="relative flex items-center justify-center gap-3 w-full py-4 px-4 bg-void-800 hover:bg-void-700 border border-void-700 hover:border-signal-amber/50 text-white font-mono text-xs font-bold tracking-wider rounded-lg transition-all duration-300 shadow-md group overflow-hidden">
                                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                ${iconsObj.download}
                                <span>${tFn('dashboard.download_offline')}</span>
                            </a>
                            <div class="flex justify-between items-center px-2">
                                 <p class="text-[9px] text-void-600 font-mono uppercase tracking-widest">SECURE PACKET</p>
                                 <p class="text-[9px] text-signal-amber font-mono uppercase tracking-widest">${currentTierObj.offlineLabel}</p>
                            </div>
                            ` : `
                            <button onclick="checkAccess('ULTIMATE', () => {}, 'OFFLINE_ARCHIVE')" class="flex items-center justify-center gap-3 w-full py-4 px-4 bg-void-800/50 border border-void-800 text-void-500 font-mono text-xs font-bold tracking-wider rounded-lg cursor-not-allowed">
                                ${iconsObj.lock}
                                <span>${tFn('dashboard.offline_locked')}</span>
                            </button>
                            `}
                            
                            <a href="#" 
                               onclick="window.checkAccess('ULTIMATE', () => window.open('${currentTierObj.googleMapsLink}', '_blank'), 'LIVE_TACTICAL_MAP')"
                               class="flex items-center justify-center gap-2 w-full py-3 px-4 bg-transparent hover:bg-void-800/50 text-zinc-400 hover:text-white font-mono text-xs font-medium tracking-wide rounded-lg border border-void-800 hover:border-zinc-500 transition-all duration-300">
                                ${iconsObj.externalLink}
                                <span>${tFn('dashboard.open_live_map')}</span>
                            </a>
                        </div>
                    </div>
                </section>

                <!-- OPERATIONS GRID (Staggered Animation) -->
                <section class="space-y-4">
                    <div class="flex items-center justify-between px-1">
                        <p class="text-[10px] text-void-500 tracking-[0.25em] uppercase font-mono">${tFn('dashboard.operations_hub')}</p>
                        <div class="flex gap-1">
                            <div class="w-1 h-1 bg-void-700 rounded-full"></div>
                            <div class="w-1 h-1 bg-void-700 rounded-full"></div>
                            <div class="w-1 h-1 bg-signal-amber rounded-full animate-pulse"></div>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3" id="operations-grid">
                        ${renderMenuItemFn(tFn('dashboard.menu.souk_ops'), tFn('dashboard.menu.market_intel'), iconsObj.market, true, currentTierObj.accentColor, 'SOUK', getRequiredTierForViewFn('SOUK'), 0)}
                        ${renderMenuItemFn(tFn('dashboard.menu.defense'), tFn('dashboard.menu.threat_matrix'), iconsObj.defense, true, currentTierObj.accentColor, 'DEFENSE', getRequiredTierForViewFn('DEFENSE'), 1)}
                        ${renderMenuItemFn(tFn('dashboard.menu.organic_lab'), tFn('dashboard.menu.food_safety'), iconsObj.heart, true, currentTierObj.accentColor, 'ORGANIC_LAB', getRequiredTierForViewFn('ORGANIC_LAB'), 2)}
                        ${renderMenuItemFn(tFn('dashboard.menu.intel'), tFn('dashboard.menu.hidden_gems'), iconsObj.intel, true, currentTierObj.accentColor, 'INTEL', getRequiredTierForViewFn('INTEL'), 3)}
                        ${renderMenuItemFn(tFn('dashboard.menu.fortress'), tFn('dashboard.menu.solo_female'), iconsObj.userShield, true, currentTierObj.accentColor, 'FORTRESS', getRequiredTierForViewFn('FORTRESS'), 4)}
                        ${renderMenuItemFn(tFn('dashboard.menu.protocols'), tFn('dashboard.menu.insider_code'), iconsObj.hashtag, true, currentTierObj.accentColor, 'PROTOCOLS', getRequiredTierForViewFn('PROTOCOLS'), 5)}
                        ${renderMenuItemFn('[HUD] ' + tFn('dashboard.menu.vector_hud'), tFn('dashboard.menu.compass_distance'), iconsObj.map, true, currentTierObj.accentColor, 'VECTOR', getRequiredTierForViewFn('VECTOR'), 6)}
                        ${renderMenuItemFn(tFn('dashboard.menu.phrase_assistant'), tFn('dashboard.menu.speak_local'), iconsObj.mic, true, currentTierObj.accentColor, 'PHRASES', getRequiredTierForViewFn('PHRASES'), 7)}
                    </div>
                </section>

                <footer class="pt-8 pb-4 text-center opacity-40 hover:opacity-100 transition-opacity">
                    <div class="h-px w-32 bg-gradient-to-r from-transparent via-void-700 to-transparent mx-auto mb-4"></div>
                    <p class="text-[9px] text-void-500 font-mono tracking-[0.3em] uppercase">
                        ALIDADE v2.0 // TACTICAL OS
                    </p>
                </footer>
            </div>
        `;

            app.innerHTML = html;
            return true;
        };
    }
})(typeof window !== 'undefined' ? window : null);
