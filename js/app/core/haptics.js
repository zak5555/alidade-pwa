/**
 * ALIDADE Haptics Service
 * Extracted from legacy app.js with behavior-preserving guards.
 */
(function bootstrapHaptics(windowObj) {
    if (!windowObj) return;
    const hapticsDebugLog = (...args) => {
        if (windowObj.__ALIDADE_DEBUG_LOGS__ === true) {
            console.log(...args);
        }
    };

    if (!windowObj.Haptics) {
        const service = {
            isSupported: () => 'vibrate' in navigator,
            _userGestureSeen: false,
            patterns: {
                light: [10],
                medium: [20],
                heavy: [30],
                double: [10, 50, 10],
                success: [10],
                error: [50, 50, 50],
                warning: [200],
                confirm: [10, 100, 10, 100, 30],
                alert: [100, 50, 100, 50, 100]
            },
            trigger(type = 'light') {
                if (!this.isSupported()) return;
                if (!this._userGestureSeen) return;

                const settings = windowObj.appState?.getModule ? windowObj.appState.getModule('settings') : null;
                if (settings && settings.hapticsEnabled === false) return;

                const pattern = this.patterns[type] || this.patterns.light;
                navigator.vibrate(pattern);
                hapticsDebugLog(`[HAPTICS] ${type} feedback`);
            },
            cancel() {
                if (this.isSupported()) {
                    navigator.vibrate(0);
                }
            }
        };

        windowObj.Haptics = service;
    }

    if (!windowObj.Haptics._gestureBindingDone) {
        windowObj.Haptics._gestureBindingDone = true;
        ['pointerdown', 'touchstart', 'keydown'].forEach((evt) => {
            windowObj.addEventListener(evt, () => { windowObj.Haptics._userGestureSeen = true; }, { once: true, passive: true });
        });
    }
})(typeof window !== 'undefined' ? window : null);
