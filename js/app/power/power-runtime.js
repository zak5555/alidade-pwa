/**
 * ALIDADE Power Runtime
 * Battery/network-aware mode resolver with runtime events.
 */
(function registerAlidadePowerRuntime(windowObj) {
    'use strict';

    if (!windowObj) return;

    const POWER_MODES = Object.freeze({
        NORMAL: 'normal',
        POWER_SAVER: 'power_saver',
        EMERGENCY: 'emergency',
        CRITICAL: 'critical'
    });

    const LOW_LEVEL_THRESHOLD = 0.5;
    const EMERGENCY_LEVEL_THRESHOLD = 0.2;
    const CRITICAL_LEVEL_THRESHOLD = 0.1;

    let initialized = false;
    let batteryRef = null;
    let forcedMode = null;
    let readyResolve = null;
    const readyPromise = new Promise((resolve) => {
        readyResolve = resolve;
    });

    const state = {
        mode: POWER_MODES.NORMAL,
        batteryLevel: null,
        charging: null,
        saveData: null,
        effectiveType: null,
        source: 'bootstrap',
        updatedAt: new Date().toISOString()
    };

    function toFiniteNumber(value) {
        if (value === null || value === undefined || value === '') return null;
        const num = Number(value);
        return Number.isFinite(num) ? num : null;
    }

    function normalizeMode(value) {
        const text = String(value || '').trim().toLowerCase();
        if (text === POWER_MODES.NORMAL) return POWER_MODES.NORMAL;
        if (text === POWER_MODES.POWER_SAVER) return POWER_MODES.POWER_SAVER;
        if (text === POWER_MODES.EMERGENCY) return POWER_MODES.EMERGENCY;
        if (text === POWER_MODES.CRITICAL) return POWER_MODES.CRITICAL;
        return null;
    }

    function inferModeFromSignals(snapshot) {
        if (snapshot.charging === true) return POWER_MODES.NORMAL;

        const level = toFiniteNumber(snapshot.batteryLevel);
        if (level !== null) {
            if (level <= CRITICAL_LEVEL_THRESHOLD) return POWER_MODES.CRITICAL;
            if (level <= EMERGENCY_LEVEL_THRESHOLD) return POWER_MODES.EMERGENCY;
            if (level <= LOW_LEVEL_THRESHOLD) return POWER_MODES.POWER_SAVER;
            return POWER_MODES.NORMAL;
        }

        if (snapshot.saveData === true) return POWER_MODES.POWER_SAVER;
        if (snapshot.effectiveType === 'slow-2g' || snapshot.effectiveType === '2g') return POWER_MODES.POWER_SAVER;
        return POWER_MODES.NORMAL;
    }

    function syncRuntimeSecurityState(nextState) {
        const root = windowObj.__ALIDADE_RUNTIME_SECURITY_STATE__ ||
            (windowObj.__ALIDADE_RUNTIME_SECURITY_STATE__ = {});
        root.power = {
            mode: nextState.mode,
            batteryLevel: nextState.batteryLevel,
            charging: nextState.charging,
            saveData: nextState.saveData,
            effectiveType: nextState.effectiveType,
            source: nextState.source,
            updatedAt: nextState.updatedAt
        };
    }

    function dispatchPowerModeChanged(previousMode, nextState) {
        const detail = {
            previousMode,
            mode: nextState.mode,
            batteryLevel: nextState.batteryLevel,
            charging: nextState.charging,
            saveData: nextState.saveData,
            effectiveType: nextState.effectiveType,
            source: nextState.source,
            updatedAt: nextState.updatedAt
        };
        try {
            windowObj.dispatchEvent(new CustomEvent('alidade:powerModeChanged', { detail }));
        } catch (_error) {
            // ignore dispatch errors
        }
    }

    function updateState(patch = {}, source = 'runtime') {
        const next = {
            ...state,
            ...patch
        };
        next.source = source;
        next.updatedAt = new Date().toISOString();

        const previousMode = state.mode;
        const inferredMode = forcedMode || inferModeFromSignals(next);
        next.mode = inferredMode;

        state.mode = next.mode;
        state.batteryLevel = next.batteryLevel;
        state.charging = next.charging;
        state.saveData = next.saveData;
        state.effectiveType = next.effectiveType;
        state.source = next.source;
        state.updatedAt = next.updatedAt;

        syncRuntimeSecurityState(state);

        if (previousMode !== state.mode) {
            dispatchPowerModeChanged(previousMode, state);
        }

        return { ...state };
    }

    function onBatterySignalChange() {
        if (!batteryRef) return;
        updateState({
            batteryLevel: toFiniteNumber(batteryRef.level),
            charging: batteryRef.charging === true
        }, 'battery_api');
    }

    function getConnectionSnapshot() {
        const conn = windowObj.navigator?.connection || windowObj.navigator?.mozConnection || windowObj.navigator?.webkitConnection;
        if (!conn) return null;
        const effectiveType = typeof conn.effectiveType === 'string'
            ? conn.effectiveType.toLowerCase()
            : null;
        return {
            saveData: conn.saveData === true,
            effectiveType
        };
    }

    function bindConnectionSignals() {
        const conn = windowObj.navigator?.connection || windowObj.navigator?.mozConnection || windowObj.navigator?.webkitConnection;
        if (!conn || typeof conn.addEventListener !== 'function') return;

        const handler = () => {
            const snapshot = getConnectionSnapshot();
            if (!snapshot) return;
            updateState(snapshot, 'network_hints');
        };
        conn.addEventListener('change', handler);
        handler();
    }

    async function initBatterySignals() {
        if (!windowObj.navigator || typeof windowObj.navigator.getBattery !== 'function') return;
        try {
            batteryRef = await windowObj.navigator.getBattery();
            if (!batteryRef) return;
            if (typeof batteryRef.addEventListener === 'function') {
                batteryRef.addEventListener('levelchange', onBatterySignalChange);
                batteryRef.addEventListener('chargingchange', onBatterySignalChange);
            }
            onBatterySignalChange();
        } catch (_error) {
            // battery API may be unavailable or blocked
        }
    }

    function refresh() {
        const connectionSnapshot = getConnectionSnapshot();
        if (connectionSnapshot) {
            updateState(connectionSnapshot, 'network_hints');
        } else {
            updateState({}, 'refresh');
        }
        if (batteryRef) {
            onBatterySignalChange();
        }
        return { ...state };
    }

    function forceModeForDebug(mode) {
        const normalized = normalizeMode(mode);
        if (!normalized) return { ok: false, reason: 'invalid_mode' };
        forcedMode = normalized;
        updateState({}, 'forced_debug_mode');
        return { ok: true, mode: state.mode };
    }

    function clearForcedMode() {
        forcedMode = null;
        updateState({}, 'forced_debug_mode_cleared');
        return { ...state };
    }

    function getState() {
        return { ...state };
    }

    function getMode() {
        return state.mode;
    }

    function exposeUtils() {
        windowObj.ALIDADE_POWER_RUNTIME_UTILS = {
            __initialized: true,
            POWER_MODES,
            getState,
            getMode,
            refresh,
            forceModeForDebug,
            clearForcedMode,
            whenReady: () => readyPromise
        };
    }

    async function init() {
        if (initialized) {
            refresh();
            return;
        }
        initialized = true;

        exposeUtils();
        updateState({}, 'bootstrap');
        bindConnectionSignals();
        await initBatterySignals();
        refresh();

        try {
            windowObj.dispatchEvent(new CustomEvent('alidade:powerRuntimeReady', {
                detail: getState()
            }));
        } catch (_error) {
            // ignore dispatch errors
        }

        if (readyResolve) readyResolve(getState());
    }

    init().catch(() => {
        if (readyResolve) readyResolve(getState());
    });
})(typeof window !== 'undefined' ? window : null);
