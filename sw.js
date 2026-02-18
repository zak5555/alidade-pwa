/**
 * ALIDADE Service Worker v2.14
 * Enhanced with:
 * - Cache-first strategy for app shell
 * - Proper offline support
 * - Update notification system
 * - Removed CDN dependencies
 * - Protocol-7 design system support
 * - Multi-language i18n support (EN / FR / ES)
 */

const CACHE_NAME = 'alidade-tactical-v2.14';
const APP_SHELL = [
    './',
    './index.html',
    './activate.html',
    './app.js',
    './style.css',
    './output.css',
    './js/license-manager.js',
    './js/vector-nav-v2.js',
    './manifest.json',
    './i18n/index.js',
    './i18n/en.js',
    './i18n/fr.js',
    './i18n/es.js',
    './assets/icons/maskable_icon_x192.png',
    './assets/icons/maskable_icon_x512.png',
    './assets/lite.kmz',
    './assets/ultimate.kmz'
];

const OPTIONAL_ASSETS = [];

// ===================================================================
// INSTALL - Aggressive caching of app shell
// ===================================================================
self.addEventListener('install', (event) => {
    console.log('[SW] Installing v2.14...');

    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching app shell');

            // Cache critical assets first
            return cache.addAll(APP_SHELL).then(() => {
                // Cache optional assets (don't fail if missing)
                return Promise.allSettled(
                    OPTIONAL_ASSETS.map((url) =>
                        cache.add(url).catch((err) => {
                            console.warn(`[SW] Failed to cache ${url}:`, err);
                        })
                    )
                );
            });
        }).then(() => {
            console.log('[SW] Installation complete');
            // User-controlled update: Let app decide when to skip waiting
        })
    );
});

// ===================================================================
// ACTIVATE - Clean up old caches
// ===================================================================
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating v2.14...');

    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[SW] Removing old cache:', key);
                        return caches.delete(key);
                    }
                    return null;
                })
            );
        }).then(() => {
            console.log('[SW] Activation complete');
            // Take control of all clients immediately
            return self.clients.claim();
        })
    );
});

// ===================================================================
// FETCH - Cache-First with Network Fallback
// ===================================================================
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip cross-origin requests (CDNs, external resources)
    if (url.origin !== location.origin) {
        console.log('[SW] Skipping cross-origin:', url.href);
        return;
    }

    // Skip Chrome extensions
    if (url.protocol === 'chrome-extension:') {
        return;
    }

    event.respondWith(
        // CACHE-FIRST STRATEGY
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
                console.log('[SW] Cache HIT:', request.url);

                // Return cached response immediately
                // But also update cache in background
                fetch(request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, networkResponse.clone());
                            console.log('[SW] Updated cache:', request.url);
                        });
                    }
                }).catch(() => {
                    // Network failed, but we already have cached version
                    console.log('[SW] Network unavailable, using cache');
                });

                return cachedResponse;
            }

            // CACHE MISS - Try network
            console.log('[SW] Cache MISS, fetching:', request.url);
            return fetch(request).then((networkResponse) => {
                // Cache successful responses
                if (networkResponse && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseToCache);
                        console.log('[SW] Cached new resource:', request.url);
                    });
                }
                return networkResponse;
            }).catch((error) => {
                console.error('[SW] Fetch failed:', request.url, error);

                // Return offline fallback if available
                if (request.destination === 'document') {
                    return caches.match('./index.html');
                }

                throw error;
            });
        })
    );
});

// ===================================================================
// MESSAGE - Handle update notifications
// ===================================================================
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[SW] Skip waiting requested');
        self.skipWaiting();
    }
});

console.log('[SW] Service Worker script loaded');
