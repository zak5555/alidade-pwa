/**
 * ALIDADE Ultimate Data Pack Utilities
 * Extracted from legacy app.js with adapter hooks.
 */
(function bootstrapUltimateDataPackUtils(windowObj) {
    if (!windowObj) return;

    const dataUtils = windowObj.ALIDADE_DATA_UTILS || (windowObj.ALIDADE_DATA_UTILS = {});

    if (typeof dataUtils.hasUltimateDataPackLoaded !== 'function') {
        dataUtils.hasUltimateDataPackLoaded = function hasUltimateDataPackLoaded(adapter = {}) {
            const getPack = typeof adapter.getUltimateDataPack === 'function'
                ? adapter.getUltimateDataPack
                : null;
            return Boolean(getPack ? getPack() : adapter.ultimateDataPack);
        };
    }

    if (typeof dataUtils.applyUltimateDataPack !== 'function') {
        dataUtils.applyUltimateDataPack = function applyUltimateDataPack(pack = {}, adapter = {}) {
            if (!pack || typeof pack !== 'object') return;

            if (Array.isArray(pack.threatData) && pack.threatData.length > 0 && typeof adapter.setThreatData === 'function') {
                adapter.setThreatData(pack.threatData);
            }

            if (pack.intelData && typeof pack.intelData === 'object' && typeof adapter.setIntelData === 'function') {
                adapter.setIntelData(pack.intelData);
            }

            if (pack.fortressData && typeof pack.fortressData === 'object' && typeof adapter.setFortressData === 'function') {
                adapter.setFortressData(pack.fortressData);
            }

            if (pack.protocolsData && typeof pack.protocolsData === 'object') {
                const currentProtocolsData = typeof adapter.getProtocolsData === 'function'
                    ? adapter.getProtocolsData()
                    : {};
                const merged = { ...(currentProtocolsData || {}), ...pack.protocolsData };
                // Briefing stays on the dedicated pack loader path.
                merged.briefing = (currentProtocolsData || {}).briefing;
                if (typeof adapter.setProtocolsData === 'function') {
                    adapter.setProtocolsData(merged);
                }
            }

            if (pack.medEvacContacts && typeof pack.medEvacContacts === 'object' && typeof adapter.setMedevacContacts === 'function') {
                const currentContacts = typeof adapter.getMedevacContacts === 'function'
                    ? adapter.getMedevacContacts()
                    : {};
                adapter.setMedevacContacts({
                    ...(currentContacts || {}),
                    ...pack.medEvacContacts
                });
            }
        };
    }

    if (typeof dataUtils.ensureUltimateDataPack !== 'function') {
        dataUtils.ensureUltimateDataPack = function ensureUltimateDataPack(adapter = {}) {
            const normalizeTier = typeof adapter.normalizeTierTag === 'function'
                ? adapter.normalizeTierTag
                : (value) => String(value || 'BASIC').trim().toUpperCase();
            const tier = normalizeTier(typeof adapter.getUserTier === 'function' ? adapter.getUserTier() : 'BASIC');
            if (tier !== 'ULTIMATE') {
                return Promise.resolve(false);
            }

            const hasPackLoaded = typeof adapter.hasUltimateDataPackLoaded === 'function'
                ? adapter.hasUltimateDataPackLoaded
                : () => dataUtils.hasUltimateDataPackLoaded(adapter);
            if (hasPackLoaded()) {
                return Promise.resolve(true);
            }

            const existingPromise = typeof adapter.getUltimateDataPackPromise === 'function'
                ? adapter.getUltimateDataPackPromise()
                : null;
            if (existingPromise) {
                return existingPromise;
            }

            const fetchImpl = typeof adapter.fetch === 'function' ? adapter.fetch : windowObj.fetch;
            if (typeof fetchImpl !== 'function') {
                return Promise.resolve(false);
            }

            const applyPack = typeof adapter.applyUltimateDataPack === 'function'
                ? adapter.applyUltimateDataPack
                : dataUtils.applyUltimateDataPack;
            const setPromise = typeof adapter.setUltimateDataPackPromise === 'function'
                ? adapter.setUltimateDataPackPromise
                : null;
            const setPack = typeof adapter.setUltimateDataPack === 'function'
                ? adapter.setUltimateDataPack
                : null;
            const setFailed = typeof adapter.setUltimateDataPackFailed === 'function'
                ? adapter.setUltimateDataPackFailed
                : null;
            const warn = typeof adapter.warn === 'function'
                ? adapter.warn
                : (...args) => console.warn(...args);
            const packUrl = String(adapter.ultimateDataPackUrl || 'assets/data/data-ultimate.json');

            const requestPromise = fetchImpl(packUrl)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    return response.json();
                })
                .then((payload) => {
                    if (setPack) setPack(payload);
                    if (setFailed) setFailed(false);
                    if (typeof applyPack === 'function') {
                        if (applyPack === dataUtils.applyUltimateDataPack) {
                            applyPack(payload, adapter);
                        } else {
                            applyPack(payload);
                        }
                    }
                    return true;
                })
                .catch((error) => {
                    if (setFailed) setFailed(true);
                    warn('[ULTIMATE_DATA] Failed to load pack:', error);
                    return false;
                })
                .finally(() => {
                    if (setPromise) setPromise(null);
                });

            if (setPromise) {
                setPromise(requestPromise);
            }
            return requestPromise;
        };
    }

    if (typeof dataUtils.ensureUltimateViewData !== 'function') {
        dataUtils.ensureUltimateViewData = function ensureUltimateViewData(viewKey, rerender, adapter = {}) {
            const normalizeTier = typeof adapter.normalizeTierTag === 'function'
                ? adapter.normalizeTierTag
                : (value) => String(value || 'BASIC').trim().toUpperCase();
            const tier = normalizeTier(typeof adapter.getUserTier === 'function' ? adapter.getUserTier() : 'BASIC');
            const hasPackLoaded = typeof adapter.hasUltimateDataPackLoaded === 'function'
                ? adapter.hasUltimateDataPackLoaded()
                : dataUtils.hasUltimateDataPackLoaded(adapter);
            const packFailed = typeof adapter.getUltimateDataPackFailed === 'function'
                ? Boolean(adapter.getUltimateDataPackFailed())
                : false;
            if (tier !== 'ULTIMATE' || hasPackLoaded || packFailed) {
                return false;
            }

            const doc = adapter.document || windowObj.document;
            const app = doc && typeof doc.getElementById === 'function'
                ? doc.getElementById('app')
                : null;
            if (app) {
                app.innerHTML = `
            <div class="min-h-screen bg-void-950 flex items-center justify-center p-6">
                <div class="p-4 rounded-[2px] border border-void-800 bg-void-900/50 text-center">
                    <p class="text-xs text-zinc-400 font-mono uppercase tracking-widest">Loading classified archive...</p>
                </div>
            </div>
        `;
            }

            const ensurePack = typeof adapter.ensureUltimateDataPack === 'function'
                ? adapter.ensureUltimateDataPack
                : dataUtils.ensureUltimateDataPack;
            const ensureResult = ensurePack === dataUtils.ensureUltimateDataPack
                ? ensurePack(adapter)
                : ensurePack();
            Promise.resolve(ensureResult).finally(() => {
                const current = String(typeof adapter.getCurrentView === 'function' ? adapter.getCurrentView() : '').trim().toUpperCase();
                if (current === String(viewKey || '').toUpperCase() && typeof rerender === 'function') {
                    rerender();
                }
            });
            return true;
        };
    }
})(typeof window !== 'undefined' ? window : null);
