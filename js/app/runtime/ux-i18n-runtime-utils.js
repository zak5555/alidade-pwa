/**
 * ALIDADE Runtime UX + i18n Wiring Utilities
 * Extracted from legacy app.js with adapter hooks.
 */
(function bootstrapRuntimeUxI18nUtils(windowObj) {
    if (!windowObj) return;

    const runtimeUtils = windowObj.ALIDADE_RUNTIME_UTILS || (windowObj.ALIDADE_RUNTIME_UTILS = {});

    if (typeof runtimeUtils.initializeUxAndI18nRuntime !== 'function') {
        runtimeUtils.initializeUxAndI18nRuntime = function initializeUxAndI18nRuntime(adapter = {}) {
            const target = adapter.windowObj || windowObj;
            const doc = adapter.document || target.document;
            if (!target || !doc) return;

            const triggerHaptics = typeof adapter.triggerHaptics === 'function'
                ? adapter.triggerHaptics
                : () => { };
            const renderApp = typeof adapter.renderApp === 'function'
                ? adapter.renderApp
                : () => { };
            const getI18n = typeof adapter.getI18n === 'function'
                ? adapter.getI18n
                : () => target.i18n;
            const log = typeof adapter.log === 'function'
                ? adapter.log
                : (...args) => console.log(...args);

            // Auto-add haptics to all buttons with data-haptic attribute
            doc.addEventListener('click', function (event) {
                const hapticEl = event.target.closest('[data-haptic]');
                if (hapticEl) {
                    const hapticType = hapticEl.dataset.haptic || 'light';
                    triggerHaptics(hapticType);
                }
            });

            // Log motion system status
            const prefersReducedMotion = target.matchMedia('(prefers-reduced-motion: reduce)').matches;
            log('[ALIDADE] \uD83C\uDFAC Motion system:', prefersReducedMotion ? 'REDUCED' : 'FULL');

            // Listen for language changes and re-render UI
            target.addEventListener('languagechange', function (event) {
                const i18n = getI18n();
                const lang = event?.detail?.lang || i18n?.getCurrentLanguage?.() || doc.documentElement.lang || 'en';
                log('[ALIDADE] \uD83C\uDF0D Language changed to:', lang);
                renderApp();
            });

            // Listen for i18n ready event
            target.addEventListener('i18nReady', function () {
                log('[ALIDADE] \uD83C\uDF0D i18n system ready');
            });

            // Global language switcher function
            target.changeLanguage = async function (lang) {
                const i18n = getI18n();
                if (i18n) {
                    await i18n.setLanguage(lang);
                }
            };

            // Language selector component for Settings views
            target.renderLanguageSelector = function () {
                const i18n = getI18n();
                const currentLang = i18n?.getCurrentLanguage() || 'en';
                const languages = i18n?.getAvailableLanguages() || [
                    { code: 'en', flag: '\uD83C\uDDEC\uD83C\uDDE7', native: 'English' },
                    { code: 'fr', flag: '\uD83C\uDDEB\uD83C\uDDF7', native: 'Fran\u00E7ais' },
                    { code: 'es', flag: '\uD83C\uDDEA\uD83C\uDDF8', native: 'Espa\u00F1ol' }
                ];

                return `
                <div class="p-4 bg-void-900/60 border border-void-800 rounded-[2px] mb-4">
                    <p class="text-xs text-signal-cyan font-mono uppercase mb-3">\uD83C\uDF0D LANGUAGE / LANGUE / IDIOMA</p>
                    <div class="flex gap-2">
                        ${languages.map((lang) => `
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

            log('[ALIDADE] \uD83C\uDF0D i18n integration initialized');
        };
    }
})(typeof window !== 'undefined' ? window : null);

