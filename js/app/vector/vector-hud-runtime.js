// ---------------------------------------------------------------
// VECTOR HUD RUNTIME (Extracted from app.js)
// ---------------------------------------------------------------

class VectorHUD {
    constructor() {
        this.active = false;
        this.canvas = null;
        this.ctx = null;
        this.animationId = null;
        this.orientation = { alpha: 0, beta: 0, gamma: 0 };
    }

    init() {
        const vectorHudUtils = window.ALIDADE_VECTOR_HUD_UTILS;
        if (vectorHudUtils && typeof vectorHudUtils.resolveVectorHudInit === 'function') {
            return vectorHudUtils.resolveVectorHudInit(this, document, window, console);
        }
        return false;
    }

    async start() {
        const vectorHudUtils = window.ALIDADE_VECTOR_HUD_UTILS;
        if (vectorHudUtils && typeof vectorHudUtils.resolveVectorHudStart === 'function') {
            return await vectorHudUtils.resolveVectorHudStart(this, window, console);
        }
        return false;
    }

    _bindSensors() {
        const vectorHudUtils = window.ALIDADE_VECTOR_HUD_UTILS;
        if (vectorHudUtils && typeof vectorHudUtils.resolveVectorHudBindSensors === 'function') {
            return vectorHudUtils.resolveVectorHudBindSensors(this, window, document, console);
        }
        return false;
    }

    _handleOrientation(e) {
        const vectorHudUtils = window.ALIDADE_VECTOR_HUD_UTILS;
        if (vectorHudUtils && typeof vectorHudUtils.resolveVectorHudHandleOrientation === 'function') {
            return vectorHudUtils.resolveVectorHudHandleOrientation(this, e);
        }
        return false;
    }

    showError(msg) {
        const vectorHudUtils = window.ALIDADE_VECTOR_HUD_UTILS;
        if (vectorHudUtils && typeof vectorHudUtils.resolveVectorHudShowError === 'function') {
            return vectorHudUtils.resolveVectorHudShowError(document, msg, console);
        }
        return false;
    }

    resize() {
        const vectorHudUtils = window.ALIDADE_VECTOR_HUD_UTILS;
        if (vectorHudUtils && typeof vectorHudUtils.resolveVectorHudResize === 'function') {
            return vectorHudUtils.resolveVectorHudResize(this, window);
        }
        return false;
    }

    _loop() {
        const vectorHudUtils = window.ALIDADE_VECTOR_HUD_UTILS;
        if (vectorHudUtils && typeof vectorHudUtils.resolveVectorHudLoop === 'function') {
            return vectorHudUtils.resolveVectorHudLoop(this, window);
        }
        return false;
    }

    _drawCompass(heading) {
        const vectorHudUtils = window.ALIDADE_VECTOR_HUD_UTILS;
        if (vectorHudUtils && typeof vectorHudUtils.resolveVectorHudDrawCompass === 'function') {
            return vectorHudUtils.resolveVectorHudDrawCompass(this, heading, window);
        }
        return false;
    }

    _drawHorizon(beta, gamma) {
        const vectorHudUtils = window.ALIDADE_VECTOR_HUD_UTILS;
        if (vectorHudUtils && typeof vectorHudUtils.resolveVectorHudDrawHorizon === 'function') {
            return vectorHudUtils.resolveVectorHudDrawHorizon(this, beta, gamma, window);
        }
        return false;
    }

    stop() {
        const vectorHudUtils = window.ALIDADE_VECTOR_HUD_UTILS;
        if (vectorHudUtils && typeof vectorHudUtils.resolveVectorHudStop === 'function') {
            return vectorHudUtils.resolveVectorHudStop(this, window);
        }
        return false;
    }
}

// Expose Global
window.VectorHUD = new VectorHUD();


