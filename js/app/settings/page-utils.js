/**
 * ALIDADE Settings Page Utilities
 * Extracted from legacy app.js with adapter hooks.
 */
(function bootstrapSettingsPageUtils(windowObj) {
    if (!windowObj) return;

    const settingsUtils = windowObj.ALIDADE_SETTINGS_UTILS || (windowObj.ALIDADE_SETTINGS_UTILS = {});

    if (typeof settingsUtils.renderSettings !== 'function') {
        settingsUtils.renderSettings = function renderSettings(adapter = {}) {
            const getSettings = typeof adapter.getSettings === 'function'
                ? adapter.getSettings
                : () => ({});
            const settings = getSettings();
            const doc = adapter.document || windowObj.document;
            const app = doc.getElementById('app');
            const translate = typeof adapter.t === 'function'
                ? adapter.t
                : ((key) => key);
            const renderLanguageSwitcher = typeof adapter.renderLanguageSwitcher === 'function'
                ? adapter.renderLanguageSwitcher
                : () => '';
            const arrowLeftIcon = adapter.arrowLeftIcon || '';
            const renderEmergencyCard = typeof adapter.renderEmergencySOSSettingsCard === 'function'
                ? adapter.renderEmergencySOSSettingsCard
                : () => '';
            const attachEmergencyHandlers = typeof adapter.attachEmergencySOSSettingsHandlers === 'function'
                ? adapter.attachEmergencySOSSettingsHandlers
                : null;

            const html = `
            <div class="min-h-screen bg-void-950 p-6 pb-24">
                <header class="mb-8">
                    <div class="flex items-center gap-3 mb-2">
                        <button onclick="window.alidadeApp.navigateTo('HOME')" class="p-2 rounded-[2px] bg-void-800 text-zinc-400 hover:text-white transition-colors">
                            ${arrowLeftIcon}
                        </button>
                        <h1 class="font-mono text-2xl font-bold text-signal-emerald uppercase tracking-wider">
                            ${translate('settings.title')}
                        </h1>
                    </div>
                </header>

                <div class="settings-container max-w-2xl mx-auto space-y-6">
                    <!-- LANGUAGE SECTION -->
                    ${renderLanguageSwitcher()}

                    <!-- HAPTICS SECTION -->
                    <div class="ballistic-glass p-4">
                        <h3 class="text-sm font-mono text-zinc-400 mb-4 uppercase tracking-wider">
                            ${translate('settings.sections.haptics')}
                        </h3>
                        
                        <div class="setting-item flex items-center justify-between p-4 bg-void-800/50 rounded-sm">
                            <div class="setting-info">
                                <div class="setting-label font-bold text-white flex items-center gap-2">
                                    <span class="text-lg">\uD83D\uDCF3</span>
                                    ${translate('settings.haptics.enable')}
                                </div>
                                <div class="setting-description text-xs text-zinc-500 mt-1">
                                    Adaptive vibration feedback
                                </div>
                            </div>
                            <label class="toggle-switch relative inline-block w-12 h-6">
                                <input 
                                    type="checkbox" 
                                    id="haptics-toggle"
                                    class="peer sr-only"
                                    ${settings.hapticsEnabled ? 'checked' : ''}
                                    onchange="toggleHaptics(this.checked)"
                                >
                                <span class="toggle-slider absolute cursor-pointer inset-0 bg-void-950 border border-void-600 rounded-full transition-all duration-300 peer-checked:bg-signal-emerald/20 peer-checked:border-signal-emerald peer-hover:border-void-500"></span>
                                <span class="absolute content-[''] h-4 w-4 left-1 bottom-1 bg-zinc-500 rounded-full transition-all duration-300 peer-checked:translate-x-6 peer-checked:bg-signal-emerald shadow-sm"></span>
                            </label>
                        </div>
                    </div>

                    <!-- THEME SECTION -->
                    <div class="ballistic-glass p-4">
                        <h3 class="text-sm font-mono text-zinc-400 mb-4 uppercase tracking-wider">
                            ${translate('settings.sections.theme')}
                        </h3>
                        <div class="flex gap-2">
                            <button class="flex-1 py-3 rounded-sm bg-signal-emerald text-void-950 font-bold text-xs uppercase font-mono">
                                ${translate('settings.theme.dark')}
                            </button>
                            <button class="flex-1 py-3 rounded-sm bg-void-800 text-zinc-500 font-bold text-xs uppercase font-mono opacity-50 cursor-not-allowed">
                                ${translate('settings.theme.light')}
                            </button>
                        </div>
                    </div>

                    <div class="js-sos-settings-card">
                        ${renderEmergencyCard() || ''}
                    </div>

                    <!-- ABOUT SECTION -->
                    <div class="text-center pt-8">
                        <p class="text-[10px] text-void-700 font-mono tracking-widest">ALIDADE OS v2.1 // BUILD 2026.02.05</p>
                    </div>
                </div>
            </div>
        `;

            app.innerHTML = html;
            if (typeof attachEmergencyHandlers === 'function') {
                attachEmergencyHandlers(app);
            }
            if (typeof adapter.setCurrentView === 'function') {
                adapter.setCurrentView('SETTINGS');
            }
        };
    }

    if (typeof settingsUtils.toggleHaptics !== 'function') {
        settingsUtils.toggleHaptics = function toggleHaptics(enabled, adapter = {}) {
            const setSettingsModule = typeof adapter.setSettingsModule === 'function'
                ? adapter.setSettingsModule
                : () => { };
            const triggerHaptics = typeof adapter.triggerHaptics === 'function'
                ? adapter.triggerHaptics
                : () => { };
            const log = typeof adapter.log === 'function'
                ? adapter.log
                : (...args) => console.log(...args);

            setSettingsModule({ hapticsEnabled: enabled });

            if (enabled) {
                triggerHaptics('double');
            }

            log('[SETTINGS] Haptics:', enabled ? 'enabled' : 'disabled');
        };
    }
})(typeof window !== 'undefined' ? window : null);
