// ---------------------------------------------------------------
// SERVICE + MAP RUNTIME (Extracted from app.js)
// ---------------------------------------------------------------
// ---------------------------------------------------------------
// SERVICE WORKER & UPDATE SYSTEM
// ---------------------------------------------------------------

const serviceMapDebugLog = (...args) => {
    if (window.__ALIDADE_DEBUG_LOGS__ === true) {
        console.log(...args);
    }
};

if ('serviceWorker' in navigator) {
    const extractedSwRuntime = window.ALIDADE_RUNTIME_UTILS?.initializeServiceWorkerUpdateRuntime;
    if (typeof extractedSwRuntime === 'function') {
        extractedSwRuntime({
            windowObj: window,
            navigator,
            showUpdateNotification: () => showUpdateNotification(),
            log: (...args) => serviceMapDebugLog(...args),
            error: (...args) => console.error(...args)
        });
    } else {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').then(registration => {
                serviceMapDebugLog('[SW] Registered');

                // Check for updates every 5 minutes
                setInterval(() => {
                    registration.update();
                }, 5 * 60 * 1000);

                // Listen for update found
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New version waiting
                            serviceMapDebugLog('[SW] New version detected and waiting');
                            showUpdateNotification();
                        }
                    });
                });
            }).catch(err => {
                console.error('[SW] Registration failed:', err);
            });
        });
    }
}

function showUpdateNotification() {
    const extracted = window.ALIDADE_RUNTIME_UTILS?.showUpdateNotification;
    if (typeof extracted === 'function') {
        extracted({
            document,
            triggerHaptics: (level) => {
                if (window.Haptics) {
                    window.Haptics.trigger(level);
                }
            }
        });
        return;
    }

    // Prevent duplicates
    if (document.getElementById('update-notification')) return;

    const notification = document.createElement('div');
    notification.id = 'update-notification';
    notification.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-signal-amber text-black px-6 py-4 rounded-machined shadow-glow-amber animate-slideDown max-w-[90vw] md:max-w-md';
    notification.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="flex-shrink-0 text-xl">?</div>
                <div class="flex-grow">
                    <p class="font-mono font-bold text-xs leading-none mb-1 text-black/80">ALIDADE UPDATE Available</p>
                    <p class="font-mono font-black text-sm uppercase">Phase Shift Available</p>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="window.updateApp()" class="px-4 py-2 bg-black text-signal-amber rounded-machined-sm font-bold text-xs hover:bg-void-800 transition-colors uppercase">
                        Deploy
                    </button>
                    <button onclick="window.dismissUpdate()" class="p-2 text-black/40 hover:text-black transition-colors" title="Dismiss">
                        ?
                    </button>
                </div>
            </div>
        `;
    document.body.appendChild(notification);

    // Haptic pulse for update
    if (window.Haptics) {
        window.Haptics.trigger('double');
    }
}

function updateApp() {
    const extracted = window.ALIDADE_RUNTIME_UTILS?.updateApp;
    if (typeof extracted === 'function') {
        extracted({
            navigator,
            windowObj: window
        });
        return;
    }

    navigator.serviceWorker.getRegistration().then(reg => {
        if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
    });

    // Reload page after update takes control
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
    });
}

function dismissUpdate() {
    const extracted = window.ALIDADE_RUNTIME_UTILS?.dismissUpdate;
    if (typeof extracted === 'function') {
        extracted({
            document
        });
        return;
    }

    const notification = document.getElementById('update-notification');
    if (notification) {
        notification.classList.add('animate-slideUp'); // Reverse animation
        setTimeout(() => notification.remove(), 300);
    }
}

// Expose update functions globally
window.updateApp = updateApp;
window.dismissUpdate = dismissUpdate;

// Run initialization when DOM is ready
const extractedBootstrap = window.ALIDADE_RUNTIME_UTILS?.startBootstrapRuntime;
if (typeof extractedBootstrap === 'function') {
    extractedBootstrap({
        document,
        init: () => init(),
        renderFallback: () => renderApp(),
        checkUrlForMagicLink: () => checkUrlForMagicLink(),
        error: (...args) => console.error(...args)
    });
} else {
    const bootstrap = async () => {
        try {
            await init();
        } catch (e) {
            console.error('[ALIDADE] Critical initialization error:', e);
            // Fallback render if everything fails
            renderApp();
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async () => {
            await bootstrap();
            checkUrlForMagicLink();
        });
    } else {
        bootstrap().then(() => checkUrlForMagicLink());
    }
}

// ---------------------------------------------------------------
// MAP - RECENT LOCATIONS TRACKER
// ---------------------------------------------------------------

/**
 * Track a viewed location
 */
function trackMapLocation(location) {
    const extracted = window.ALIDADE_MAP_UTILS?.trackMapLocation;
    if (typeof extracted === 'function') {
        return extracted(location, {
            getMapState: () => appState.getModule('map') || { recentLocations: [] },
            setMapState: (next) => appState.setModule('map', next),
            now: () => Date.now(),
            recordVisitedPOI: window.contextEngine?.recordVisitedPOI
                ? (payload) => window.contextEngine.recordVisitedPOI(payload)
                : null,
            log: (...args) => serviceMapDebugLog(...args)
        });
    }
    return false;
}

/**
 * Format relative time
 */
function formatTimeAgo(timestamp) {
    const extracted = window.ALIDADE_MAP_UTILS?.formatTimeAgo;
    if (typeof extracted === 'function') {
        return extracted(timestamp, {
            now: () => Date.now()
        });
    }
    return new Date(timestamp).toLocaleDateString();
}

/**
 * Clear recent locations
 */
window.clearRecentLocations = function () {
    const extracted = window.ALIDADE_MAP_UTILS?.clearRecentLocations;
    if (typeof extracted === 'function') {
        extracted({
            confirm: (message) => confirm(message),
            getMapState: () => appState.getModule('map') || {},
            setMapState: (next) => appState.setModule('map', next),
            renderVectorModule: () => renderVectorModule(),
            log: (...args) => serviceMapDebugLog(...args)
        });
        return;
    }
    return false;
};

/**
 * Jump to location on map
 */
window.jumpToLocation = function (lat, lng, name) {
    const extracted = window.ALIDADE_MAP_UTILS?.jumpToLocation;
    if (typeof extracted === 'function') {
        extracted(lat, lng, name, {
            triggerHaptics: (level) => Haptics.trigger(level),
            log: (...args) => serviceMapDebugLog(...args),
            showToast: (message) => showToast(message),
            scrollTo: (options) => window.scrollTo(options)
        });
        return;
    }
    return false;
};

/**
 * Render recent locations list
 */
function renderRecentLocations() {
    const extracted = window.ALIDADE_MAP_UTILS?.renderRecentLocations;
    if (typeof extracted === 'function') {
        return extracted({
            getMapState: () => appState.getModule('map') || {},
            formatTimeAgo: (timestamp) => formatTimeAgo(timestamp)
        });
    }
    return '';
}

/**
 * Toast Notification helper
 */
window.showToast = function (message, type = 'info') {
    const extracted = window.ALIDADE_RUNTIME_UTILS?.showToast;
    if (typeof extracted === 'function') {
        extracted(message, type, {
            document,
            requestAnimationFrame: (callback) => requestAnimationFrame(callback),
            setTimeout: (handler, timeout) => setTimeout(handler, timeout)
        });
        return;
    }
    return showToast(message, type);
};

// ---------------------------------------------------------------
// GLOBAL HAPTIC LISTENERS
// ---------------------------------------------------------------

const extractedGlobalButtonHaptics = window.ALIDADE_RUNTIME_UTILS?.bindGlobalButtonHaptics;
if (typeof extractedGlobalButtonHaptics === 'function') {
    extractedGlobalButtonHaptics({
        document,
        triggerHaptics: (level) => Haptics.trigger(level)
    });
} else {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn, .btn-primary, .btn-secondary, button');
        if (btn && !btn.disabled) {
            Haptics.trigger('medium');
        }
    });
}
