/**
 * ALIDADE Settings Overlay Utilities
 * Extracted from legacy app.js with adapter hooks.
 */
(function bootstrapSettingsOverlayUtils(windowObj) {
    if (!windowObj) return;

    const settingsUtils = windowObj.ALIDADE_SETTINGS_UTILS || (windowObj.ALIDADE_SETTINGS_UTILS = {});

    if (typeof settingsUtils.closeSettingsOverlay !== 'function') {
        settingsUtils.closeSettingsOverlay = function closeSettingsOverlay(adapter = {}) {
            const doc = adapter.document || windowObj.document;
            if (!doc) return;
            const overlay = doc.getElementById('settings-overlay');
            if (overlay) {
                overlay.remove();
            }
        };
    }

    if (typeof settingsUtils.renderSettingsOverlay !== 'function') {
        settingsUtils.renderSettingsOverlay = function renderSettingsOverlay(adapter = {}) {
            const doc = adapter.document || windowObj.document;
            if (!doc) return;
            if (doc.getElementById('settings-overlay')) return;

            const triggerHaptics = typeof adapter.triggerHaptics === 'function'
                ? adapter.triggerHaptics
                : () => { };
            triggerHaptics('medium');

            const tier = typeof adapter.getUserTier === 'function'
                ? adapter.getUserTier()
                : 'OPERATIVE';
            const overlay = doc.createElement('div');
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
                        <span class="text-xl font-bold font-mono">\u00D7</span>
                    </button>
                </div>
                
                <!-- Content -->
                <div class="p-6 space-y-6">
                    <!-- Language Section -->
                    <div class="space-y-3">
                        <p class="text-[10px] text-void-500 font-mono uppercase tracking-[0.2em]">\uD83C\uDF0D Language Matrix</p>
                        <div class="grid grid-cols-1 gap-2">
                            <button onclick="window.alidadeApp.setLanguage('en')" class="flex items-center justify-between p-3.5 bg-void-900 border border-void-800 rounded-sm hover:border-signal-cyan/50 hover:bg-void-800 transition-all group active:scale-[0.98]">
                                <div class="flex items-center gap-3">
                                    <span class="text-xl">\uD83C\uDDEC\uD83C\uDDE7</span>
                                    <span class="font-mono text-xs text-zinc-300 group-hover:text-white transition-colors">ENGLISH</span>
                                </div>
                                <span class="text-void-600 font-mono text-[9px]">EN-UK</span>
                            </button>
                            
                            <button onclick="window.alidadeApp.setLanguage('fr')" class="flex items-center justify-between p-3.5 bg-void-900 border border-void-800 rounded-sm hover:border-signal-cyan/50 hover:bg-void-800 transition-all group active:scale-[0.98]">
                                <div class="flex items-center gap-3">
                                    <span class="text-xl">\uD83C\uDDEB\uD83C\uDDF7</span>
                                    <span class="font-mono text-xs text-zinc-300 group-hover:text-white transition-colors">FRAN\u00C7AIS</span>
                                </div>
                                <span class="text-void-600 font-mono text-[9px]">FR-FR</span>
                            </button>
                            
                            <button onclick="window.alidadeApp.setLanguage('es')" class="flex items-center justify-between p-3.5 bg-void-900 border border-void-800 rounded-sm hover:border-signal-cyan/50 hover:bg-void-800 transition-all group active:scale-[0.98]">
                                <div class="flex items-center gap-3">
                                    <span class="text-xl">\uD83C\uDDEA\uD83C\uDDF8</span>
                                    <span class="font-mono text-xs text-zinc-300 group-hover:text-white transition-colors">ESPA\u00D1OL</span>
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

            doc.body?.appendChild(overlay);

            // Handle click outside to close
            overlay.addEventListener('click', (event) => {
                if (event.target !== overlay) return;
                const closeOverlay = typeof adapter.closeSettingsOverlay === 'function'
                    ? adapter.closeSettingsOverlay
                    : settingsUtils.closeSettingsOverlay;
                if (typeof closeOverlay === 'function') {
                    if (closeOverlay === settingsUtils.closeSettingsOverlay) {
                        closeOverlay(adapter);
                    } else {
                        closeOverlay();
                    }
                }
            });
        };
    }
})(typeof window !== 'undefined' ? window : null);
