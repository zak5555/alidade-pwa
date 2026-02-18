/**
 * ALIDADE Runtime Feedback Utilities
 * Extracted from legacy app.js with adapter hooks.
 */
(function bootstrapRuntimeFeedbackUtils(windowObj) {
    if (!windowObj) return;

    const runtimeUtils = windowObj.ALIDADE_RUNTIME_UTILS || (windowObj.ALIDADE_RUNTIME_UTILS = {});

    if (typeof runtimeUtils.showToast !== 'function') {
        runtimeUtils.showToast = function showToast(message, type = 'info', adapter = {}) {
            const doc = adapter.document || windowObj.document;
            if (!doc) return;

            const toast = doc.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.textContent = message;

            doc.body?.appendChild(toast);

            // Force reflow
            toast.offsetHeight;

            // Add show class
            const requestFrame = typeof adapter.requestAnimationFrame === 'function'
                ? adapter.requestAnimationFrame
                : windowObj.requestAnimationFrame;
            if (typeof requestFrame === 'function') {
                requestFrame(() => {
                    toast.classList.add('show');
                });
            } else {
                toast.classList.add('show');
            }

            const timeoutFn = typeof adapter.setTimeout === 'function'
                ? adapter.setTimeout
                : setTimeout;
            timeoutFn(() => {
                toast.classList.remove('show');
                timeoutFn(() => toast.remove(), 300);
            }, 2500);
        };
    }

    if (typeof runtimeUtils.bindGlobalButtonHaptics !== 'function') {
        runtimeUtils.bindGlobalButtonHaptics = function bindGlobalButtonHaptics(adapter = {}) {
            const doc = adapter.document || windowObj.document;
            if (!doc) return;

            const triggerHaptics = typeof adapter.triggerHaptics === 'function'
                ? adapter.triggerHaptics
                : () => { };

            doc.addEventListener('click', (event) => {
                const btn = event.target.closest('.btn, .btn-primary, .btn-secondary, button');
                if (btn && !btn.disabled) {
                    triggerHaptics('medium');
                }
            });
        };
    }
})(typeof window !== 'undefined' ? window : null);
