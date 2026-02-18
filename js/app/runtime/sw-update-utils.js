/**
 * ALIDADE Runtime Service Worker + Update Utilities
 * Extracted from legacy app.js with adapter hooks.
 */
(function bootstrapRuntimeSwUpdateUtils(windowObj) {
    if (!windowObj) return;

    const runtimeUtils = windowObj.ALIDADE_RUNTIME_UTILS || (windowObj.ALIDADE_RUNTIME_UTILS = {});

    if (typeof runtimeUtils.showUpdateNotification !== 'function') {
        runtimeUtils.showUpdateNotification = function showUpdateNotification(adapter = {}) {
            const doc = adapter.document || windowObj.document;
            if (!doc) return;

            // Prevent duplicates
            if (doc.getElementById('update-notification')) return;

            const notification = doc.createElement('div');
            notification.id = 'update-notification';
            notification.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-signal-amber text-black px-6 py-4 rounded-machined shadow-glow-amber animate-slideDown max-w-[90vw] md:max-w-md';
            notification.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="flex-shrink-0 text-xl">\u26A1</div>
                <div class="flex-grow">
                    <p class="font-mono font-bold text-xs leading-none mb-1 text-black/80">ALIDADE UPDATE Available</p>
                    <p class="font-mono font-black text-sm uppercase">Phase Shift Available</p>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="window.updateApp()" class="px-4 py-2 bg-black text-signal-amber rounded-machined-sm font-bold text-xs hover:bg-void-800 transition-colors uppercase">
                        Deploy
                    </button>
                    <button onclick="window.dismissUpdate()" class="p-2 text-black/40 hover:text-black transition-colors" title="Dismiss">
                        \u2715
                    </button>
                </div>
            </div>
        `;
            doc.body?.appendChild(notification);

            // Haptic pulse for update
            if (typeof adapter.triggerHaptics === 'function') {
                adapter.triggerHaptics('double');
            } else if (windowObj.Haptics) {
                windowObj.Haptics.trigger('double');
            }
        };
    }

    if (typeof runtimeUtils.updateApp !== 'function') {
        runtimeUtils.updateApp = function updateApp(adapter = {}) {
            const navigatorObj = adapter.navigator || windowObj.navigator;
            const targetWindow = adapter.windowObj || windowObj;
            const serviceWorker = navigatorObj?.serviceWorker;
            if (!serviceWorker) return;

            serviceWorker.getRegistration().then((reg) => {
                if (reg?.waiting) {
                    reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
            });

            // Reload page after update takes control
            serviceWorker.addEventListener('controllerchange', () => {
                targetWindow.location.reload();
            });
        };
    }

    if (typeof runtimeUtils.dismissUpdate !== 'function') {
        runtimeUtils.dismissUpdate = function dismissUpdate(adapter = {}) {
            const doc = adapter.document || windowObj.document;
            if (!doc) return;

            const notification = doc.getElementById('update-notification');
            if (notification) {
                notification.classList.add('animate-slideUp'); // Reverse animation
                setTimeout(() => notification.remove(), 300);
            }
        };
    }

    if (typeof runtimeUtils.initializeServiceWorkerUpdateRuntime !== 'function') {
        runtimeUtils.initializeServiceWorkerUpdateRuntime = function initializeServiceWorkerUpdateRuntime(adapter = {}) {
            const targetWindow = adapter.windowObj || windowObj;
            const navigatorObj = adapter.navigator || windowObj.navigator;
            const serviceWorker = navigatorObj?.serviceWorker;
            if (!serviceWorker) return;

            const log = typeof adapter.log === 'function'
                ? adapter.log
                : (...args) => console.log(...args);
            const error = typeof adapter.error === 'function'
                ? adapter.error
                : (...args) => console.error(...args);
            const showUpdate = typeof adapter.showUpdateNotification === 'function'
                ? adapter.showUpdateNotification
                : runtimeUtils.showUpdateNotification;

            targetWindow.addEventListener('load', () => {
                serviceWorker.register('./sw.js').then((registration) => {
                    log('[SW] Registered');

                    // Check for updates every 5 minutes
                    setInterval(() => {
                        registration.update();
                    }, 5 * 60 * 1000);

                    // Listen for update found
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (!newWorker) return;

                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && serviceWorker.controller) {
                                // New version waiting
                                log('[SW] New version detected and waiting');
                                if (showUpdate === runtimeUtils.showUpdateNotification) {
                                    showUpdate(adapter);
                                } else {
                                    showUpdate();
                                }
                            }
                        });
                    });
                }).catch((err) => {
                    error('[SW] Registration failed:', err);
                });
            });
        };
    }
})(typeof window !== 'undefined' ? window : null);
