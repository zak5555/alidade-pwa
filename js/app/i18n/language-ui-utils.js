/**
 * ALIDADE Language UI Utilities
 * Extracted from legacy app.js with adapter hooks.
 */
(function bootstrapLanguageUiUtils(windowObj) {
    if (!windowObj) return;

    const i18nUtils = windowObj.ALIDADE_I18N_UTILS || (windowObj.ALIDADE_I18N_UTILS = {});

    if (typeof i18nUtils.renderLanguageSwitcher !== 'function') {
        i18nUtils.renderLanguageSwitcher = function renderLanguageSwitcher(adapter = {}) {
            const getCurrentLanguage = typeof adapter.getCurrentLanguage === 'function'
                ? adapter.getCurrentLanguage
                : () => 'en';
            const translate = typeof adapter.t === 'function'
                ? adapter.t
                : ((key) => key);
            const current = getCurrentLanguage();

            const languages = [
                { code: 'en', flag: '\uD83C\uDDEC\uD83C\uDDE7', name: 'English', native: 'English' },
                { code: 'fr', flag: '\uD83C\uDDEB\uD83C\uDDF7', name: 'French', native: 'Fran\u00E7ais' },
                { code: 'es', flag: '\uD83C\uDDEA\uD83C\uDDF8', name: 'Spanish', native: 'Espa\u00F1ol' }
            ];

            return `
            <div class="ballistic-glass p-4 mb-4">
                <h3 class="text-sm font-mono text-zinc-400 mb-3 uppercase tracking-wider">
                    ${translate('settings.sections.language')}
                </h3>
                <div class="flex gap-2">
                    ${languages.map((lang) => `
                        <button
                            onclick="switchLanguage('${lang.code}')"
                            class="flex-1 px-4 py-3 rounded-sm transition-all ${current === lang.code
                    ? 'bg-signal-emerald text-void-950 font-semibold'
                    : 'bg-void-800 text-zinc-400 hover:bg-void-700'
                }">
                            <div class="text-2xl mb-1">${lang.flag}</div>
                            <div class="text-xs font-mono">${lang.native}</div>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        };
    }

    if (typeof i18nUtils.switchLanguage !== 'function') {
        i18nUtils.switchLanguage = async function switchLanguage(langCode, adapter = {}) {
            const i18n = adapter.i18n || windowObj.i18n;
            const logError = typeof adapter.error === 'function'
                ? adapter.error
                : (...args) => console.error(...args);
            const logInfo = typeof adapter.log === 'function'
                ? adapter.log
                : (...args) => {
                    if (windowObj.__ALIDADE_DEBUG_LOGS__ === true) {
                        console.log(...args);
                    }
                };
            const setHtmlLang = typeof adapter.setHtmlLang === 'function'
                ? adapter.setHtmlLang
                : ((lang) => {
                    if (windowObj.document?.documentElement) {
                        windowObj.document.documentElement.lang = lang;
                    }
                });

            if (!i18n) {
                logError('[APP] i18n not ready yet');
                return;
            }

            try {
                await i18n.setLanguage(langCode);
                logInfo('[APP] Language switched to:', langCode);

                // Update HTML lang attribute
                setHtmlLang(langCode);

                // Fire custom event (i18n controller already fires 'languagechange')
                // No need to call renderApp() here, event listener will handle it
            } catch (err) {
                logError('[APP] Failed to switch language:', err);
            }
        };
    }
})(typeof window !== 'undefined' ? window : null);
