// Extracted from app.js (Batch 204): App shell runtime stack
// Preserves legacy globals and routing/render parity.

// ---------------------------------------------------------------
// ICONS (SVG)
// ---------------------------------------------------------------

const ICONS = window.ALIDADE_UI_ICONS || {};
const appShellDebugLog = (...args) => {
    if (window.__ALIDADE_DEBUG_LOGS__ === true) {
        console.log(...args);
    }
};

// ---------------------------------------------------------------
// NAVIGATION & ROUTING
// ---------------------------------------------------------------

function commitNavigation(view) {
    const extracted = window.ALIDADE_NAV_UTILS?.commitNavigation;
    if (typeof extracted === 'function') {
        extracted(view, {
            triggerHaptics: (level) => Haptics.trigger(level),
            setCurrentView: (nextView) => { currentView = nextView; },
            setAppState: (key, value, persist) => appState.set(key, value, persist),
            showSkeletonFor: (targetView) => showSkeletonFor(targetView),
            requestAnimationFrame: (callback) => requestAnimationFrame(callback),
            renderApp: () => renderApp(),
            scrollTo: (x, y) => window.scrollTo(x, y)
        });
        return;
    }

    Haptics.trigger('light');

    currentView = view;
    appState.set('currentView', view, true);

    // Show skeleton immediately
    showSkeletonFor(view);

    // Render actual content (with small delay to show skeleton)
    requestAnimationFrame(() => {
        renderApp();
        window.scrollTo(0, 0);
    });
}

function navigateTo(view) {
    const extracted = window.ALIDADE_NAV_UTILS?.navigateTo;
    if (typeof extracted === 'function') {
        extracted(view, {
            getRequiredTierForView: (targetView) => getRequiredTierForView(targetView),
            hasTierAccess: (userTier, requiredTier) => hasTierAccess(userTier, requiredTier),
            getUserTier: () => USER_TIER || 'BASIC',
            showAccessDeniedModal: (requiredTier, featureKey) => showAccessDeniedModal(requiredTier, featureKey),
            normalizeTierTag,
            showSkeletonFor: (targetView) => showSkeletonFor(targetView),
            ensureUltimateDataPack: () => ensureUltimateDataPack(),
            commitNavigation: (targetView) => commitNavigation(targetView)
        });
        return;
    }

    const requiredTier = getRequiredTierForView(view);
    if (!hasTierAccess(USER_TIER || 'BASIC', requiredTier)) {
        showAccessDeniedModal(requiredTier, view);
        return;
    }

    const normalizedRequired = normalizeTierTag(requiredTier || 'BASIC');
    if (normalizedRequired === 'ULTIMATE') {
        showSkeletonFor(view);
        ensureUltimateDataPack().finally(() => {
            commitNavigation(view);
        });
        return;
    }

    commitNavigation(view);
}
/**
* Switch language with smooth transition
*/
async function switchLanguage(langCode) {
    if (!window.i18n) {
        console.error('[APP] i18n not ready yet');
        if (typeof showToast === 'function') {
            showToast('System not ready', 'error');
        }
        return;
    }

    try {
        appShellDebugLog('[APP] Switching to:', langCode);

        // Disable all language buttons during switch
        const buttons = document.querySelectorAll('[onclick^="switchLanguage"]');
        buttons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'wait';
        });

        // Switch language (this will trigger 'languagechange' event)
        await window.i18n.setLanguage(langCode);

        appShellDebugLog('[APP] Language switched to:', langCode);

        // Update state
        if (window.stateManager) {
            window.stateManager.state.modules.settings.language = langCode;
            window.stateManager._saveState(true);
        }

        // The 'languagechange' event listener will handle the UI update

    } catch (err) {
        console.error('[APP] Failed to switch language:', err);
        if (typeof showToast === 'function') {
            showToast('Switch failed', 'error');
        }
    } finally {
        // Re-enable buttons after a short delay
        setTimeout(() => {
            const buttons = document.querySelectorAll('[onclick^="switchLanguage"]');
            buttons.forEach(btn => {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
            });
        }, 300);
    }
}

/**
 * Render language switcher UI
 */
function renderLanguageSwitcher() {
    const extracted = window.ALIDADE_I18N_UTILS?.renderLanguageSwitcher;
    if (typeof extracted === 'function') {
        return extracted({
            getCurrentLanguage: () => window.i18n ? window.i18n.getCurrentLanguage() : 'en',
            t: (key) => t(key)
        });
    }

    const current = window.i18n ? window.i18n.getCurrentLanguage() : 'en';

    const languages = [
        { code: 'en', flag: '🇺🇸', name: 'English', native: 'English' },
        { code: 'fr', flag: '🇫🇷', name: 'French', native: 'Français' },
        { code: 'es', flag: '🇪🇸', name: 'Spanish', native: 'Español' }
    ];

    return `
        <!-- Language Switcher Card -->
        <div class="ballistic-glass p-4 mb-4">
            <!-- Header -->
            <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-mono text-zinc-400 uppercase tracking-wider">
                    ${t('settings.sections.language')}
                </h3>
                <div class="text-xs font-mono text-signal-emerald font-semibold">
                    ${current.toUpperCase()}
                </div>
            </div>
            
            <!-- Language Buttons Grid -->
            <div class="grid grid-cols-3 gap-2">
                ${languages.map(lang => `
                    <button 
                        onclick="switchLanguage('${lang.code}')"
                        class="px-3 py-3 rounded-sm transition-all duration-200 transform
                               ${current === lang.code
            ? 'bg-signal-emerald text-void-950 font-semibold shadow-lg shadow-signal-emerald/20 scale-105'
            : 'bg-void-800 text-zinc-400 hover:bg-void-700 hover:text-zinc-200 hover:scale-105'}
                               disabled:opacity-50 disabled:cursor-not-allowed
                               active:scale-95 focus:outline-none focus:ring-2 focus:ring-signal-emerald focus:ring-offset-2 focus:ring-offset-void-950">
                        
                        <!-- Flag Icon -->
                        <div class="text-3xl mb-1 ${current === lang.code ? 'animate-pulse' : ''}">
                            ${lang.flag}
                        </div>
                        
                        <!-- Language Name -->
                        <div class="text-xs font-mono font-semibold">
                            ${lang.native}
                        </div>
                        
                        <!-- Active Indicator -->
                        ${current === lang.code
            ? '<div class="text-[8px] mt-1 font-bold tracking-wider">ACTIVE</div>'
            : ''}
                    </button>
                `).join('')}
            </div>
            
            <!-- Current Language Info -->
            <div class="mt-3 px-3 py-2 bg-void-800 rounded-sm flex items-center gap-2">
                <span class="text-xs text-zinc-500 font-mono">Current:</span>
                <span class="text-xs text-signal-cyan font-mono font-semibold">
                    ${languages.find(l => l.code === current)?.native || 'English'}
                </span>
            </div>
            
            <!-- Pro Tip -->
            <div class="mt-3 px-3 py-2 bg-void-800 rounded-sm border-l-2 border-signal-cyan">
                <p class="text-[11px] text-zinc-400 font-mono leading-relaxed">
                    TIP: ${t('settings.language.tip') || 'Language changes apply instantly across the entire app'}
                </p>
            </div>
        </div>
    `;
}

function renderSettingsOverlay() {
    const extracted = window.ALIDADE_SETTINGS_UTILS?.renderSettingsOverlay;
    if (typeof extracted === 'function') {
        extracted({
            document,
            triggerHaptics: (level) => Haptics.trigger(level),
            getUserTier: () => typeof USER_TIER !== 'undefined' ? USER_TIER : 'OPERATIVE',
            closeSettingsOverlay: () => closeSettingsOverlay()
        });
        return;
    }

    if (document.getElementById('settings-overlay')) return;
    Haptics.trigger('medium');

    const tier = typeof USER_TIER !== 'undefined' ? USER_TIER : 'OPERATIVE';
    const overlay = document.createElement('div');
    overlay.id = 'settings-overlay';
    overlay.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4';

    overlay.innerHTML = `
            <div class="w-full max-w-sm bg-void-950 border border-void-800 rounded-sm shadow-2xl overflow-hidden">
                <!-- Header -->
                <div class="flex items-center justify-between p-4 border-b border-void-800 bg-void-900/50">
                    <div class="flex items-center gap-2">
                        <span class="w-1.5 h-1.5 bg-signal-cyan animate-pulse"></span>
                        <h2 class="font-mono text-[10px] font-bold text-signal-cyan tracking-[0.2em] uppercase">Tactical Settings</h2>
                    </div>
                    <button onclick="window.alidadeApp.closeSettingsOverlay()" class="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-500/10 rounded-sm transition-colors">
                        <span class="text-xl font-bold font-mono">×</span>
                    </button>
                </div>
                
                <!-- Content -->
                <div class="p-6 space-y-6">
                    <!-- Language Section -->
                    <div class="space-y-3">
                        <p class="text-[10px] text-void-500 font-mono uppercase tracking-[0.2em]">Language Matrix</p>
                        <div class="grid grid-cols-1 gap-2">
                            <button onclick="window.alidadeApp.setLanguage('en')" class="flex items-center justify-between p-3.5 bg-void-900 border border-void-800 rounded-sm hover:border-signal-cyan/50 hover:bg-void-800 transition-all group active:scale-[0.98]">
                                <div class="flex items-center gap-3">
                                    <span class="text-xl">🇺🇸</span>
                                    <span class="font-mono text-xs text-zinc-300 group-hover:text-white transition-colors">ENGLISH</span>
                                </div>
                                <span class="text-void-600 font-mono text-[9px]">EN-UK</span>
                            </button>
                            
                            <button onclick="window.alidadeApp.setLanguage('fr')" class="flex items-center justify-between p-3.5 bg-void-900 border border-void-800 rounded-sm hover:border-signal-cyan/50 hover:bg-void-800 transition-all group active:scale-[0.98]">
                                <div class="flex items-center gap-3">
                                    <span class="text-xl">🇫🇷</span>
                                    <span class="font-mono text-xs text-zinc-300 group-hover:text-white transition-colors">FRANÇAIS</span>
                                </div>
                                <span class="text-void-600 font-mono text-[9px]">FR-FR</span>
                            </button>
                            
                            <button onclick="window.alidadeApp.setLanguage('es')" class="flex items-center justify-between p-3.5 bg-void-900 border border-void-800 rounded-sm hover:border-signal-cyan/50 hover:bg-void-800 transition-all group active:scale-[0.98]">
                                <div class="flex items-center gap-3">
                                    <span class="text-xl">🇪🇸</span>
                                    <span class="font-mono text-xs text-zinc-300 group-hover:text-white transition-colors">ESPAÑOL</span>
                                </div>
                                <span class="text-void-600 font-mono text-[9px]">ES-ES</span>
                            </button>
                        </div>
                    </div>
                    
                    <!-- System Info Section -->
                    <div class="pt-4 border-t border-void-800/50">
                        <div class="flex justify-between items-center text-[10px] font-mono text-void-600 tracking-widest">
                            <span>SYSTEM: V2.0</span>
                            <span class="text-signal-amber">TIER: ${tier}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

    document.body.appendChild(overlay);

    // Handle click outside to close
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeSettingsOverlay();
    });
}

function closeSettingsOverlay() {
    const extracted = window.ALIDADE_SETTINGS_UTILS?.closeSettingsOverlay;
    if (typeof extracted === 'function') {
        extracted({
            document
        });
        return;
    }

    const overlay = document.getElementById('settings-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// Expose for global usage
window.alidadeApp = window.alidadeApp || {};
window.alidadeApp.navigateTo = navigateTo;

// ---------------------------------------------------------------
// MASTER RENDER FUNCTION
// ---------------------------------------------------------------

function renderApp() {
    appShellDebugLog(`[ALIDADE] Rendering view: ${currentView}`);

    switch (currentView) {
        case 'HOME':
            renderDashboard();
            break;
        case 'DEFENSE':
            renderDefense();
            break;
        case 'SOUK':
            renderSouk();
            break;
        case 'CERAMICS':
            renderCeramicsProtocol();
            break;
        case 'LEATHER':
            renderLeatherProtocol();
            break;
        case 'RUGS':
            renderRugsProtocol();
            break;
        case 'METALS':
            renderMetalsProtocol();
            break;
        case 'ORGANIC_LAB':
            renderOrganicLabPlaceholder();
            break;
        case 'BIODEFENSE':
        case 'PRODUCT_FORENSICS':
            renderForensicsModule();
            break;
        case 'NEGOTIATION':
            renderNegotiation();
            break;
        case 'MARKET':
            renderPriceDictator();
            break;
        case 'TRANSPORT':
            renderTransportShield();
            break;
        case 'FORTRESS':
            renderFortress();
            break;
        case 'INTEL':
            renderIntel();
            break;
        case 'PROTOCOLS':
            renderProtocols();
            break;
        case 'VECTOR':
            renderVectorHUD();
            break;
        case 'PHRASES':
            renderPhrases();
            break;
        case 'ROUTE_PLANNER':
            renderRoutePlanner();
            break;
        default:
            renderDashboard();
    }

    if (window.refreshEmergencySOSWidget) {
        window.refreshEmergencySOSWidget();
    }
}

function triggerEmergencySOSFromUI() {
    if (window.emergencySOS && typeof window.emergencySOS.quickActivate === 'function') {
        window.emergencySOS.quickActivate('ui-button');
        return;
    }

    const choice = confirm('EMERGENCY SOS\n\nCall Police (19) or Ambulance (15)?');
    if (choice) {
        window.location.href = 'tel:19';
    } else {
        window.location.href = 'tel:15';
    }
}

function setupGlobalSOSButtonHandler() {
    if (window.__alidadeSOSHandlerBound) return;
    window.__alidadeSOSHandlerBound = true;

    document.addEventListener('click', (event) => {
        const sosBtn = event.target.closest('#sos-btn');
        if (!sosBtn) return;
        event.preventDefault();
        triggerEmergencySOSFromUI();
    });
}

// ---------------------------------------------------------------
// VIEW: HOME DASHBOARD
// ---------------------------------------------------------------

function getAuthUserForGreeting() {
    const runtimeUtils = window.ALIDADE_RUNTIME_UTILS;
    if (runtimeUtils && typeof runtimeUtils.resolveGetAuthUserForGreeting === 'function') {
        return runtimeUtils.resolveGetAuthUserForGreeting({
            licenseManagerObj: window.licenseManager,
            localStorageObj: localStorage,
            authTokenKey: 'sb-tynugwtetlclqowlguai-auth-token'
        });
    }

    return null;
}

function getTacticalCallsign() {
    const runtimeUtils = window.ALIDADE_RUNTIME_UTILS;
    if (runtimeUtils && typeof runtimeUtils.resolveGetTacticalCallsign === 'function') {
        return runtimeUtils.resolveGetTacticalCallsign({
            getAuthUserFn: getAuthUserForGreeting,
            licenseManagerObj: window.licenseManager
        });
    }

    return 'OPERATIVE';
}

function renderDashboard() {
    const app = document.getElementById('app');
    if (!app) return;

    const tacticalCallsign = getTacticalCallsign();
    const runtimeUtils = window.ALIDADE_RUNTIME_UTILS;
    if (runtimeUtils && typeof runtimeUtils.resolveRenderDashboardView === 'function') {
        const rendered = runtimeUtils.resolveRenderDashboardView({
            documentObj: document,
            appElement: app,
            tacticalCallsign,
            tFn: t,
            hasTierAccessFn: hasTierAccess,
            userTier: USER_TIER || 'BASIC',
            trackLockImpressionFn: trackLockImpression,
            currentTierObj: currentTier,
            iconsObj: ICONS,
            renderMenuItemFn: renderMenuItem,
            getRequiredTierForViewFn: getRequiredTierForView
        });
        if (rendered) return;
    }

    app.innerHTML = '';
}

// Protocol-7 Omega Ascended Item Renderer
function renderMenuItem(title, subtitle, icon, isUnlocked, accentColor = 'amber-400', targetView = null, requiredTier = null, index = 0) {
    const runtimeUtils = window.ALIDADE_RUNTIME_UTILS;
    if (runtimeUtils && typeof runtimeUtils.resolveRenderDashboardMenuItem === 'function') {
        return runtimeUtils.resolveRenderDashboardMenuItem({
            title,
            subtitle,
            icon,
            targetView,
            requiredTier,
            index,
            userTier: USER_TIER || 'BASIC',
            normalizeTierTagFn: normalizeTierTag,
            hasTierAccessFn: hasTierAccess,
            trackLockImpressionFn: trackLockImpression
        });
    }

    return '';
}
