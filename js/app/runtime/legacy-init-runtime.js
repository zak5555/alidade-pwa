// Extracted from app.js: legacy initialization runtime block (compatibility-first).

// ---------------------------------------------------------------
// INITIALIZATION
// ---------------------------------------------------------------

async function initializeEmergencySOSModule() {
    if (window.emergencySOS && window.renderEmergencySOSSettingsCard) {
        window.refreshEmergencySOSWidget?.();
        return window.emergencySOS;
    }

    try {
        const module = await import('../../emergency-sos.js');
        const initSOS = module.initEmergencySOS || window.initEmergencySOS;
        if (typeof initSOS === 'function') {
            const instance = initSOS();
            window.refreshEmergencySOSWidget?.();
            return instance;
        }
        console.warn('[SOS] initEmergencySOS export not found');
    } catch (error) {
        console.error('[SOS] Failed to initialize emergency module:', error);
    }

    return null;
}

function legacyInitDebugLog(...args) {
    if (window.__ALIDADE_DEBUG_LOGS__ === true) {
        console.log(...args);
    }
}

async function init() {
    legacyInitDebugLog('[ALIDADE] System initializing...');

    const isFallbackI18n = (candidate) => Boolean(candidate && candidate.__ALIDADE_FALLBACK__ === true);
    if (!window.i18n || isFallbackI18n(window.i18n)) {
        await new Promise((resolve) => {
            const onReady = () => {
                window.removeEventListener('i18nReady', onReady);
                resolve();
            };
            window.addEventListener('i18nReady', onReady);
            setTimeout(() => {
                window.removeEventListener('i18nReady', onReady);
                resolve();
            }, 1200);
        });
    }

    // For Launch: Force English default
    if (window.i18n && !isFallbackI18n(window.i18n)) {
        await window.i18n.init();
        const currentLang = typeof window.i18n.getCurrentLanguage === 'function'
            ? String(window.i18n.getCurrentLanguage() || '').toLowerCase()
            : '';
        if (currentLang !== 'en') {
            await window.i18n.setLanguage('en');
        }
        legacyInitDebugLog('[ALIDADE] i18n forced to English for launch');
    }

    // Reduce first-paint tier jitter for authenticated users:
    // wait briefly for license init before first render.
    if (window.__ALIDADE_LICENSE_INIT_PROMISE__) {
        let waitMs = 1200;
        try {
            const hasAuthToken = Boolean(localStorage.getItem('sb-tynugwtetlclqowlguai-auth-token'));
            waitMs = hasAuthToken ? 2500 : 700;
        } catch (_error) {
            waitMs = 1200;
        }
        try {
            await Promise.race([
                window.__ALIDADE_LICENSE_INIT_PROMISE__,
                new Promise((resolve) => setTimeout(resolve, waitMs))
            ]);
        } catch (_error) {
            // Non-blocking: continue startup even if license init degrades.
        }
    }
    if (typeof syncTierFromLicenseManager === 'function') {
        syncTierFromLicenseManager();
    }
    legacyInitDebugLog('[ALIDADE] Version: 2.0 (SPA Edition)');
    legacyInitDebugLog('[ALIDADE] User Tier:', USER_TIER);

    const runtimeUtils = window.ALIDADE_RUNTIME_UTILS || {};
    const goldenRecordPolicy = typeof runtimeUtils.resolveGoldenRecordBootstrapPolicy === 'function'
        ? runtimeUtils.resolveGoldenRecordBootstrapPolicy({ windowObj: window })
        : {
            strictMode: false,
            failOpen: true,
            blockStartupOnFailure: false,
            dataUrl: './golden-record-v1.0.2.json'
        };
    if (typeof runtimeUtils.setGoldenRecordSecurityState === 'function') {
        runtimeUtils.setGoldenRecordSecurityState({
            status: 'pending',
            mode: goldenRecordPolicy.strictMode ? 'strict' : 'standard',
            failOpen: goldenRecordPolicy.failOpen,
            blockStartupOnFailure: goldenRecordPolicy.blockStartupOnFailure,
            dataUrl: goldenRecordPolicy.dataUrl
        }, { windowObj: window });
    }

    const goldenRecordUtils = window.ALIDADE_GOLDEN_RECORD_UTILS;
    if (goldenRecordUtils && typeof goldenRecordUtils.ensureGoldenRecordLoaded === 'function') {
        try {
            const goldenRecordResult = await goldenRecordUtils.ensureGoldenRecordLoaded({
                windowObj: window,
                fetchFn: (typeof window.fetch === 'function') ? window.fetch.bind(window) : null,
                consoleObj: console,
                dataUrl: goldenRecordPolicy.dataUrl || './golden-record-v1.0.2.json',
                failOpen: goldenRecordPolicy.failOpen !== false
            });
            if (goldenRecordResult && goldenRecordResult.status === 'failed') {
                if (typeof runtimeUtils.setGoldenRecordSecurityState === 'function') {
                    runtimeUtils.setGoldenRecordSecurityState({
                        status: goldenRecordPolicy.blockStartupOnFailure ? 'blocked' : 'degraded',
                        mode: goldenRecordPolicy.strictMode ? 'strict' : 'standard',
                        reason: 'loader_returned_failed',
                        dataUrl: goldenRecordPolicy.dataUrl
                    }, { windowObj: window });
                }
                console.warn('[APP] Golden record integrity gate failed; continuing in degraded mode');
                if (goldenRecordPolicy.blockStartupOnFailure) {
                    throw new Error('[GOLDEN_RECORD] fail-closed policy blocked startup in legacy init');
                }
            } else {
                if (typeof runtimeUtils.setGoldenRecordSecurityState === 'function') {
                    runtimeUtils.setGoldenRecordSecurityState({
                        status: 'verified',
                        mode: goldenRecordPolicy.strictMode ? 'strict' : 'standard',
                        datasetVersion: goldenRecordResult?.meta?.datasetVersion || null,
                        checksumMode: goldenRecordResult?.meta?.checksumMode || null,
                        checksumDeclared: goldenRecordResult?.meta?.checksumDeclared || null,
                        checksumComputed: goldenRecordResult?.meta?.checksumComputed || null,
                        validationWarningCount: Number(goldenRecordResult?.meta?.validationWarningCount || 0),
                        dataUrl: goldenRecordResult?.meta?.dataUrl || goldenRecordPolicy.dataUrl
                    }, { windowObj: window });
                }
                legacyInitDebugLog('[APP] Golden record preload complete');
            }
        } catch (goldenRecordError) {
            if (typeof runtimeUtils.setGoldenRecordSecurityState === 'function') {
                runtimeUtils.setGoldenRecordSecurityState({
                    status: goldenRecordPolicy.blockStartupOnFailure ? 'blocked' : 'degraded',
                    mode: goldenRecordPolicy.strictMode ? 'strict' : 'standard',
                    reason: 'loader_threw',
                    message: String(goldenRecordError?.message || goldenRecordError || 'unknown'),
                    dataUrl: goldenRecordPolicy.dataUrl
                }, { windowObj: window });
            }
            if (goldenRecordPolicy.blockStartupOnFailure) {
                throw goldenRecordError;
            }
            console.warn('[APP] Golden record preload failed in legacy init; continuing startup:', goldenRecordError);
        }
    } else if (typeof runtimeUtils.setGoldenRecordSecurityState === 'function') {
        runtimeUtils.setGoldenRecordSecurityState({
            status: 'unavailable',
            mode: goldenRecordPolicy.strictMode ? 'strict' : 'standard',
            reason: 'loader_unavailable',
            dataUrl: goldenRecordPolicy.dataUrl
        }, { windowObj: window });
    }

    // Expose navigation function globally for inline onclick handlers
    const extractedBindings = window.ALIDADE_RUNTIME_UTILS?.initializeAppGlobalBindings;
    if (typeof extractedBindings === 'function') {
        const checkAccessRef = checkAccess;
        const showAccessDeniedModalRef = showAccessDeniedModal;
        extractedBindings({
            windowObj: window,
            navigateTo: (view) => navigateTo(view),
            renderSettingsOverlay: () => renderSettingsOverlay(),
            closeSettingsOverlay: () => closeSettingsOverlay(),
            renderApp: () => renderApp(),
            getI18n: () => window.i18n,
            checkAccess: checkAccessRef,
            showAccessDeniedModal: showAccessDeniedModalRef
        });
    } else {
        window.alidadeApp = {
            navigateTo,
            renderSettingsOverlay,
            closeSettingsOverlay,
            render: renderApp,
            setLanguage: async function (lang) {
                if (window.i18n) {
                    await window.i18n.setLanguage(lang);
                    closeSettingsOverlay();
                    renderApp();
                }
            }
        };
        window.checkAccess = checkAccess;
        window.showAccessDeniedModal = showAccessDeniedModal;
    }

    await initializeEmergencySOSModule();

    // Global helper for back navigation
    window.goBack = function () {
        navigateTo('HOME');
    };

    // ---------------------------------------------------------------
    // PHASE 3: KEYBOARD SHORTCUTS + VIEW TRANSITION ANIMATIONS
    // ---------------------------------------------------------------
    const extractedInteraction = window.ALIDADE_RUNTIME_UTILS?.initializeInteractionRuntime;
    if (typeof extractedInteraction === 'function') {
        extractedInteraction({
            windowObj: window,
            document,
            triggerHaptics: (level) => Haptics.trigger(level),
            navigateTo: (view) => navigateTo(view),
            getRequiredTierForView: (view) => getRequiredTierForView(view),
            checkAccess: (requiredTier, actionCallback, featureKey) => checkAccess(requiredTier, actionCallback, featureKey),
            getCurrentView: () => currentView,
            log: (...args) => legacyInitDebugLog(...args)
        });
    } else {
        const KEYBOARD_SHORTCUTS = {
            // Number keys for quick module access
            '1': 'SOUK',
            '2': 'DEFENSE',
            '3': 'ORGANIC_LAB',
            '4': 'INTEL',
            '5': 'FORTRESS',
            '6': 'PROTOCOLS',
            '7': 'VECTOR',
            '8': 'PHRASES',
        };

        function handleKeyboardShortcuts(e) {
            // Don't trigger if user is typing in an input
            if (document.activeElement.tagName === 'INPUT' ||
                document.activeElement.tagName === 'TEXTAREA' ||
                document.activeElement.isContentEditable) {
                return;
            }

            // Escape - Go back to home
            if (e.key === 'Escape') {
                e.preventDefault();
                Haptics.trigger('light');
                navigateTo('HOME');
                return;
            }

            // Ctrl/Cmd + H - Go home
            if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
                e.preventDefault();
                Haptics.trigger('light');
                navigateTo('HOME');
                return;
            }

            // Number keys for quick navigation (when not holding modifier)
            if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
                const targetView = KEYBOARD_SHORTCUTS[e.key];
                if (targetView) {
                    e.preventDefault();
                    Haptics.trigger('medium');

                    const requiredTier = getRequiredTierForView(targetView);
                    if (requiredTier !== 'BASIC') {
                        checkAccess(requiredTier, () => navigateTo(targetView), targetView);
                    } else {
                        navigateTo(targetView);
                    }
                    return;
                }
            }

            // Ctrl/Cmd + B - Toggle back (if not on home)
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                if (currentView !== 'HOME') {
                    Haptics.trigger('light');
                    navigateTo('HOME');
                }
                return;
            }
        }

        // Register keyboard listener
        document.addEventListener('keydown', handleKeyboardShortcuts);
        legacyInitDebugLog('[ALIDADE] Keyboard shortcuts initialized');

        // Apply view-enter animation to app container on each render
        const originalNavigateTo = navigateTo;
        window.alidadeApp.navigateTo = function (view) {
            const app = document.getElementById('app');
            if (app) {
                // Remove existing animation classes
                app.classList.remove('view-enter', 'view-exit');
                // Trigger reflow
                void app.offsetWidth;
                // Add enter animation
                app.classList.add('view-enter');
            }
            originalNavigateTo(view);
        };
    }

    // ---------------------------------------------------------------
    // PHASE 3: HAPTIC FEEDBACK ENHANCEMENT + i18n INTEGRATION
    // ---------------------------------------------------------------
    const extractedUxI18n = window.ALIDADE_RUNTIME_UTILS?.initializeUxAndI18nRuntime;
    if (typeof extractedUxI18n === 'function') {
        extractedUxI18n({
            windowObj: window,
            document,
            triggerHaptics: (level) => Haptics.trigger(level),
            renderApp: () => renderApp(),
            getI18n: () => window.i18n,
            log: (...args) => legacyInitDebugLog(...args)
        });
    } else {
        // Auto-add haptics to all buttons with data-haptic attribute
        document.addEventListener('click', function (e) {
            const hapticEl = e.target.closest('[data-haptic]');
            if (hapticEl) {
                const hapticType = hapticEl.dataset.haptic || 'light';
                Haptics.trigger(hapticType);
            }
        });

        // Log motion system status
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        legacyInitDebugLog('[ALIDADE] Motion system:', prefersReducedMotion ? 'REDUCED' : 'FULL');

        // Listen for language changes and re-render UI
        window.addEventListener('languagechange', function (e) {
            const lang = e?.detail?.lang || window.i18n?.getCurrentLanguage?.() || document.documentElement.lang || 'en';
            legacyInitDebugLog('[ALIDADE] Language changed to:', lang);
            renderApp();
        });

        // Listen for i18n ready event
        window.addEventListener('i18nReady', function (e) {
            legacyInitDebugLog('[ALIDADE] i18n system ready');
        });

        // Global language switcher function
        window.changeLanguage = async function (lang) {
            if (window.i18n) {
                await window.i18n.setLanguage(lang);
            }
        };

        // Language selector component for Settings views
        window.renderLanguageSelector = function () {
            const currentLang = window.i18n?.getCurrentLanguage() || 'en';
            const languages = window.i18n?.getAvailableLanguages() || [
                { code: 'en', flag: 'EN', native: 'English' },
                { code: 'fr', flag: 'FR', native: 'Francais' },
                { code: 'es', flag: 'ES', native: 'Espanol' }
            ];

            return `
                <div class="p-4 bg-void-900/60 border border-void-800 rounded-[2px] mb-4">
                    <p class="text-xs text-signal-cyan font-mono uppercase mb-3">LANGUAGE / LANGUE / IDIOMA</p>
                    <div class="flex gap-2">
                        ${languages.map(lang => `
                            <button 
                                onclick="changeLanguage('${lang.code}')"
                                class="flex-1 py-3 px-2 rounded-[2px] border transition-all duration-200 text-center
                                    ${currentLang === lang.code
                    ? 'bg-signal-cyan/20 border-signal-cyan text-white'
                    : 'bg-void-800 border-void-700 text-zinc-400 hover:border-void-600'
                }"
                            >
                                <span class="text-lg block mb-1">${lang.flag}</span>
                                <span class="text-[10px] font-mono">${lang.native}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        };

        legacyInitDebugLog('[ALIDADE] i18n integration initialized');
    }

    // Render initial view
    if (currentView !== 'HOME') {
        legacyInitDebugLog(`[ALIDADE] Restoring session: ${currentView}`);
    }
    renderApp();
}
