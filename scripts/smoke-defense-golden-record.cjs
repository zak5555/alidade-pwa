#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const ROOT = process.cwd();

function fail(message, detail) {
    const suffix = detail ? `\n${detail}` : '';
    throw new Error(`${message}${suffix}`);
}

function assert(condition, message, detail) {
    if (!condition) fail(message, detail);
}

function runNodeCheck(filePath) {
    const abs = path.join(ROOT, filePath);
    const result = spawnSync(process.execPath, ['--check', abs], {
        cwd: ROOT,
        encoding: 'utf8'
    });
    if (result.status !== 0) {
        fail(`Syntax check failed: ${filePath}`, `${result.stderr || result.stdout || ''}`.trim());
    }
    return true;
}

function runNodeCheckEsm(filePath) {
    const source = readText(filePath);
    const result = spawnSync(process.execPath, ['--check', '--input-type=module', '-'], {
        cwd: ROOT,
        encoding: 'utf8',
        input: source
    });
    if (result.status !== 0) {
        fail(`ESM syntax check failed: ${filePath}`, `${result.stderr || result.stdout || ''}`.trim());
    }
    return true;
}

function readText(filePath) {
    return fs.readFileSync(path.join(ROOT, filePath), 'utf8');
}

function readJson(filePath) {
    return JSON.parse(readText(filePath));
}

function haversineDistance(lat1, lng1, lat2, lng2) {
    const toRad = (value) => (value * Math.PI) / 180;
    const earthRadiusMeters = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusMeters * c;
}

function createCustomEventCtor() {
    return function CustomEvent(type, init = {}) {
        this.type = type;
        this.detail = init.detail;
    };
}

function createEventWindow(seed = {}) {
    const listeners = new Map();
    const events = [];
    const base = {
        addEventListener: (type, handler) => {
            if (!listeners.has(type)) listeners.set(type, []);
            listeners.get(type).push(handler);
        },
        removeEventListener: (type, handler) => {
            const handlers = listeners.get(type) || [];
            if (!handler) {
                listeners.delete(type);
                return;
            }
            listeners.set(type, handlers.filter((candidate) => candidate !== handler));
        },
        dispatchEvent: (event) => {
            events.push(event.type);
            const handlers = listeners.get(event.type) || [];
            handlers.forEach((handler) => {
                try { handler(event); } catch (_error) { }
            });
            return true;
        }
    };
    const windowObj = { ...base, ...seed };
    windowObj.window = windowObj;
    windowObj.__events = events;
    return windowObj;
}

async function testGoldenRecordLoader() {
    const source = readText('js/app/data/golden-record-runtime-utils.js');
    const dataset = readJson('golden-record-v1.0.2.json');
    const events = [];
    const listeners = new Map();

    const windowObj = {
        fetch: async () => ({
            ok: true,
            status: 200,
            json: async () => JSON.parse(JSON.stringify(dataset))
        }),
        crypto: crypto.webcrypto,
        TextEncoder,
        addEventListener: (type, handler) => {
            if (!listeners.has(type)) listeners.set(type, []);
            listeners.get(type).push(handler);
        },
        removeEventListener: () => { },
        dispatchEvent: (event) => {
            events.push(event.type);
            const handlers = listeners.get(event.type) || [];
            handlers.forEach((handler) => {
                try { handler(event); } catch (_error) { }
            });
            return true;
        }
    };
    windowObj.window = windowObj;

    const context = {
        window: windowObj,
        console,
        TextEncoder,
        CustomEvent: createCustomEventCtor(),
        setTimeout,
        clearTimeout
    };

    vm.createContext(context);
    vm.runInContext(source, context, { filename: 'js/app/data/golden-record-runtime-utils.js' });

    assert(windowObj.ALIDADE_GOLDEN_RECORD_UTILS, 'Golden record utils were not initialized');
    const shape = windowObj.ALIDADE_GOLDEN_RECORD_UTILS.validateGoldenRecordShape(dataset);
    assert(shape && shape.ok === true, 'Golden record shape validator did not pass on fixture dataset');
    assert(Array.isArray(shape.warnings), 'Golden record shape validator did not return warnings array');
    assert(shape.warnings.length === 0, 'Golden record shape validator returned warnings on fixture dataset');

    const result = await windowObj.ALIDADE_GOLDEN_RECORD_UTILS.ensureGoldenRecordLoaded({
        windowObj,
        fetchFn: windowObj.fetch,
        consoleObj: console,
        dataUrl: './golden-record-v1.0.2.json',
        failOpen: false
    });

    const state = windowObj.ALIDADE_GOLDEN_RECORD_UTILS.getGoldenRecordState();

    assert(result && result.status === 'ready', 'Golden record loader did not return ready');
    assert(state.status === 'ready' && state.hasRecord === true, 'Golden record state is not ready');
    assert(windowObj.ALIDADE_GOLDEN_RECORD && windowObj.ALIDADE_GOLDEN_RECORD.metadata?.dataset_version === '1.0.2',
        'Golden record payload was not attached to window');
    assert((state.meta?.validationWarningCount || 0) === 0,
        'Golden record runtime reported validation warnings for fixture dataset');
    assert(events.includes('alidade:goldenRecordReady'), 'Ready event was not dispatched');

    const tamperedDataset = JSON.parse(JSON.stringify(dataset));
    tamperedDataset.metadata.checksum_sha256 = '0'.repeat(64);
    const tamperedEvents = [];
    const tamperedWindowObj = {
        fetch: async () => ({
            ok: true,
            status: 200,
            json: async () => JSON.parse(JSON.stringify(tamperedDataset))
        }),
        crypto: crypto.webcrypto,
        TextEncoder,
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: (event) => {
            tamperedEvents.push(event.type);
            return true;
        }
    };
    tamperedWindowObj.window = tamperedWindowObj;

    const tamperedContext = {
        window: tamperedWindowObj,
        console,
        TextEncoder,
        CustomEvent: createCustomEventCtor(),
        setTimeout,
        clearTimeout
    };
    vm.createContext(tamperedContext);
    vm.runInContext(source, tamperedContext, { filename: 'js/app/data/golden-record-runtime-utils.js' });

    let failClosedRejected = false;
    try {
        await tamperedWindowObj.ALIDADE_GOLDEN_RECORD_UTILS.ensureGoldenRecordLoaded({
            windowObj: tamperedWindowObj,
            fetchFn: tamperedWindowObj.fetch,
            consoleObj: console,
            dataUrl: './golden-record-v1.0.2.json',
            failOpen: false
        });
    } catch (_error) {
        failClosedRejected = true;
    }
    assert(failClosedRejected, 'Golden record loader did not fail-closed on checksum mismatch');
    assert(tamperedEvents.includes('alidade:goldenRecordFailed'),
        'Golden record loader did not dispatch failure event on fail-closed path');

    return {
        name: 'golden-record-loader',
        ok: true,
        meta: state.meta,
        failClosedRejected
    };
}

async function testContextRuntimeBaselineIntegration() {
    const source = readText('js/app/context/context-runtime.js');
    const dataset = readJson('golden-record-v1.0.2.json');
    const events = [];

    const windowObj = {
        ALIDADE_CONTEXT_MAP_DATA: {
            SOUK_LANDMARKS: {},
            CONTEXT_NEGOTIATION_TACTICS: {},
            CONTEXT_AREA_BOUNDS: []
        },
        ALIDADE_GOLDEN_RECORD: dataset,
        MEDINA_LANDMARKS: [],
        crowdPriceDB: {
            getUserStats: () => ({ rank: 'Scout', points: 12 })
        },
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: (event) => {
            events.push(event.type);
            return true;
        }
    };
    windowObj.window = windowObj;

    const context = {
        window: windowObj,
        console,
        CustomEvent: createCustomEventCtor(),
        Date,
        setTimeout,
        clearTimeout,
        detectSoukArea: () => 'jemaa',
        haversineDistance
    };

    vm.createContext(context);
    vm.runInContext(source, context, { filename: 'js/app/context/context-runtime.js' });

    const engine = windowObj.contextEngine;
    assert(engine && typeof engine.updateLocation === 'function', 'Context engine was not initialized');

    await engine.updateLocation(31.62603, -7.98993, { source: 'smoke_context', accuracy: 10 });

    const vectorContext = engine.getContext('vector');

    assert(Array.isArray(vectorContext.criticalPoints) && vectorContext.criticalPoints.length > 0,
        'Vector context did not expose nearby critical points');
    assert(Array.isArray(vectorContext.riskZones) && vectorContext.riskZones.length > 0,
        'Vector context did not expose active risk zones');
    assert(Array.isArray(vectorContext.threats) && vectorContext.threats.some((threat) => threat.source === 'baseline_risk_zone'),
        'Baseline threats were not merged into threat feed');
    assert(typeof vectorContext.baselineIntel?.integrityStatus === 'string',
        'Vector context baseline intel does not expose integrity status');
    assert(typeof engine.getCurrentDangerLevel() === 'string', 'Danger level did not resolve');
    assert(events.includes('contextUpdate'), 'Context updates were not dispatched');

    return {
        name: 'context-baseline-integration',
        ok: true,
        snapshot: {
            criticalPoints: vectorContext.criticalPoints.length,
            riskZones: vectorContext.riskZones.length,
            threats: vectorContext.threats.length,
            dangerLevel: engine.getCurrentDangerLevel()
        }
    };
}

async function testContextRuntimeOfflineCacheAndInterpolation() {
    const source = readText('js/app/context/context-runtime.js');
    const dataset = readJson('golden-record-v1.0.2.json');
    const storageMap = new Map();
    const localStorage = {
        getItem: (key) => (storageMap.has(String(key)) ? storageMap.get(String(key)) : null),
        setItem: (key, value) => {
            storageMap.set(String(key), String(value));
        },
        removeItem: (key) => {
            storageMap.delete(String(key));
        }
    };

    const createWindow = () => {
        const events = [];
        const windowObj = {
            ALIDADE_CONTEXT_MAP_DATA: {
                SOUK_LANDMARKS: {},
                CONTEXT_NEGOTIATION_TACTICS: {},
                CONTEXT_AREA_BOUNDS: []
            },
            ALIDADE_GOLDEN_RECORD: dataset,
            MEDINA_LANDMARKS: [],
            crowdPriceDB: {
                getUserStats: () => ({ rank: 'Scout', points: 4 })
            },
            localStorage,
            addEventListener: () => { },
            removeEventListener: () => { },
            dispatchEvent: (event) => {
                events.push(event.type);
                return true;
            }
        };
        windowObj.window = windowObj;
        windowObj.__events = events;
        return windowObj;
    };

    const windowA = createWindow();
    const contextA = {
        window: windowA,
        console,
        CustomEvent: createCustomEventCtor(),
        Date,
        setTimeout,
        clearTimeout,
        detectSoukArea: () => 'souks_main',
        haversineDistance
    };
    vm.createContext(contextA);
    vm.runInContext(source, contextA, { filename: 'js/app/context/context-runtime.js' });

    const engineA = windowA.contextEngine;
    assert(engineA && typeof engineA.updateLocation === 'function',
        'Context engine (phase A) was not initialized');

    await engineA.updateLocation(31.6200, -7.9902, { source: 'smoke_gps', accuracy: 15 });
    const vectorA = engineA.getContext('vector');

    assert(Array.isArray(vectorA.riskZones) && vectorA.riskZones.length > 0,
        'Context runtime did not produce risk zones for interpolation scenario');
    assert(vectorA.riskZones.some((zone) => zone.source === 'baseline_risk_zone_interpolated'),
        'Context runtime did not emit interpolated risk-zone signal');

    const cacheRaw = localStorage.getItem('alidade_context_snapshot_v1');
    assert(typeof cacheRaw === 'string' && cacheRaw.length > 0,
        'Context runtime did not persist cache snapshot');
    const cacheEnvelope = JSON.parse(cacheRaw);
    assert(cacheEnvelope?.snapshot?.location?.lat === 31.62 &&
        cacheEnvelope?.snapshot?.location?.lng === -7.9902,
    'Context cache snapshot did not persist latest location');

    const windowB = createWindow();
    const contextB = {
        window: windowB,
        console,
        CustomEvent: createCustomEventCtor(),
        Date,
        setTimeout,
        clearTimeout,
        detectSoukArea: () => 'souks_main',
        haversineDistance
    };
    vm.createContext(contextB);
    vm.runInContext(source, contextB, { filename: 'js/app/context/context-runtime.js' });

    const engineB = windowB.contextEngine;
    assert(engineB && engineB.context?.location && typeof engineB.context.location.lat === 'number',
        'Context runtime did not restore location from cached snapshot');
    assert(engineB.context.sessionData?.lastCachedRestoreAt,
        'Context runtime did not mark cached restore timestamp');
    assert(engineB.context.sessionData?.lastCachedRestoreSource === 'constructor',
        'Context runtime did not mark cached restore source');

    const vectorB = engineB.getContext('vector');
    assert(vectorB?.contextCache?.restoredFromCache === true,
        'Vector context does not expose cache restore signal');
    assert(Array.isArray(vectorB.riskZones) && vectorB.riskZones.length > 0,
        'Restored context did not keep risk zones');

    return {
        name: 'context-offline-cache-and-interpolation',
        ok: true,
        details: {
            cachedSource: engineB.context.sessionData.lastLocationSource,
            restoredRiskZones: vectorB.riskZones.length
        }
    };
}

function extractFirstPoliceHref(html) {
    const match = String(html || '').match(/href="(https:\/\/www\.google\.com\/maps\?q=[^"]+)"/i);
    return match ? match[1] : null;
}

function createDefenseContext() {
    const policePoints = [
        {
            id: 'police_jemaa',
            type: 'police',
            name: 'Police: Brigade Touristique (near Jemaa el-Fna)',
            lat: 31.62603,
            lng: -7.98993,
            trustScore: 0.9
        },
        {
            id: 'police_gueliz',
            type: 'police',
            name: 'Préfecture de Police (Marrakech)',
            lat: 31.64701,
            lng: -7.98759,
            trustScore: 0.85
        }
    ];

    const windowObj = {
        ALIDADE_MODULE_PREVIEWS: {
            BASIC_THREAT_PREVIEW: [
                {
                    id: 'orange_juice_roulette',
                    title: 'Orange Juice Roulette',
                    risk: 'MEDIUM',
                    category: 'jemaa',
                    loss: '40 DH',
                    description: 'Seed threat',
                    counter_measure: 'Seed response'
                }
            ]
        },
        ALIDADE_GOLDEN_RECORD: readJson('golden-record-v1.0.2.json'),
        addEventListener: () => { },
        removeEventListener: () => { },
        showUpgradeModal: () => { },
        contextEngine: {
            context: {
                location: { lat: 31.62603, lng: -7.98993 }
            },
            getDistanceMeters: haversineDistance,
            getCurrentDangerLevel: () => 'high',
            getContext: (module) => {
                if (module !== 'vector') return {};
                const location = windowObj.contextEngine.context.location;
                const nearest = policePoints
                    .map((point) => ({
                        ...point,
                        distance: haversineDistance(location.lat, location.lng, point.lat, point.lng)
                    }))
                    .sort((a, b) => a.distance - b.distance)
                    .slice(0, 1);

                return {
                    criticalPoints: nearest,
                    riskZones: [
                        {
                            id: `zone_${Math.round(location.lat * 1000)}`,
                            areaName: nearest[0].distance < 500 ? 'Jemaa perimeter' : 'Gueliz perimeter',
                            baselineScore: 0.8,
                            confidence: 0.8,
                            distance: nearest[0].distance,
                            threatTypes: ['pickpocket']
                        }
                    ],
                    baselineIntel: {
                        datasetVersion: '1.0.2',
                        integrityStatus: 'verified',
                        validationWarningCount: 0,
                        checksumMode: 'compact'
                    }
                };
            }
        }
    };
    windowObj.window = windowObj;
    return windowObj;
}

async function testDefenseDynamicEmergencyMapAndCards() {
    const source = readText('js/app/defense/defense-runtime.js');
    const windowObj = createDefenseContext();

    const context = {
        window: windowObj,
        document: {
            getElementById: () => null,
            querySelectorAll: () => [],
            body: { insertAdjacentHTML: () => { } }
        },
        console,
        appState: {
            getModule: () => ({ currentTab: 'threats' }),
            setModule: () => { }
        },
        normalizeTierTag: (value) => String(value || 'BASIC').trim().toUpperCase(),
        USER_TIER: 'BASIC',
        ICONS: { arrowLeft: '<-', arrowRight: '->' },
        t: (key) => key,
        ensureUltimateViewData: () => false,
        renderSoukClassifiedPreviewCard: () => '<div>LOCKED</div>',
        trackLockImpression: () => { },
        trackTierFunnelEvent: () => { },
        escapeHtml: (value) => String(value || ''),
        confirm: () => true,
        setTimeout: (handler) => {
            if (typeof handler === 'function') handler();
            return 0;
        },
        clearTimeout: () => { }
    };

    context.window.appState = context.appState;
    context.window.normalizeTierTag = context.normalizeTierTag;
    context.window.USER_TIER = context.USER_TIER;
    context.window.t = context.t;
    context.window.ICONS = context.ICONS;

    vm.createContext(context);
    vm.runInContext(source, context, { filename: 'js/app/defense/defense-runtime.js' });

    assert(typeof context.renderLegalTabContent === 'function', 'renderLegalTabContent is not available');
    assert(typeof context.resolveDefenseBaselineThreatCards === 'function', 'resolveDefenseBaselineThreatCards is not available');
    assert(typeof context.renderDefenseLiveRiskPanelContent === 'function', 'renderDefenseLiveRiskPanelContent is not available');

    windowObj.contextEngine.context.location = { lat: 31.62603, lng: -7.98993 };
    const htmlJemaa = context.renderLegalTabContent();
    const hrefJemaa = extractFirstPoliceHref(htmlJemaa);

    windowObj.contextEngine.context.location = { lat: 31.64701, lng: -7.98759 };
    const htmlGueliz = context.renderLegalTabContent();
    const hrefGueliz = extractFirstPoliceHref(htmlGueliz);

    const liveCards = context.resolveDefenseBaselineThreatCards('all');
    const liveRiskHtml = context.renderDefenseLiveRiskPanelContent();

    assert(hrefJemaa && hrefJemaa.includes('31.62603,-7.98993'),
        'Legal tab did not point to nearest Jemaa police location');
    assert(hrefGueliz && hrefGueliz.includes('31.64701,-7.98759'),
        'Legal tab did not point to nearest Gueliz police location');
    assert(hrefJemaa !== hrefGueliz, 'Legal tab police map href did not change with location');
    assert(String(htmlJemaa).includes('DIAL 141') && String(htmlJemaa).includes('DIAL 19'),
        'Legal tab did not render expected emergency numbers from golden record');
    assert(Array.isArray(liveCards) && liveCards.length > 0, 'Defense baseline risk cards were not generated');
    assert(liveCards[0].source === 'baseline_zone', 'Defense baseline risk card source is invalid');
    assert(String(liveRiskHtml).includes('Intel Integrity'),
        'Defense live risk panel does not render intel integrity status');
    assert(String(liveRiskHtml).includes('VERIFIED'),
        'Defense live risk panel does not render expected verified integrity label');
    assert(String(liveRiskHtml).includes('Context Source'),
        'Defense live risk panel does not render context source status');
    assert(String(liveRiskHtml).includes('Risk Signal'),
        'Defense live risk panel does not render risk signal mode');

    return {
        name: 'defense-dynamic-map-and-cards',
        ok: true,
        details: {
            hrefJemaa,
            hrefGueliz,
            liveCardCount: liveCards.length
        }
    };
}

function testLegacyInitWiringPresence() {
    const source = readText('js/app/runtime/legacy-init-runtime.js');
    assert(source.includes('ensureGoldenRecordLoaded'), 'Legacy init does not call ensureGoldenRecordLoaded');
    assert(source.includes('Golden record preload complete'), 'Legacy init golden record log marker is missing');
    assert(source.includes('resolveGoldenRecordBootstrapPolicy'),
        'Legacy init does not resolve golden-record bootstrap policy');
    assert(source.includes('setGoldenRecordSecurityState'),
        'Legacy init does not report golden-record security state');
    return {
        name: 'legacy-init-wiring-presence',
        ok: true
    };
}

function testVectorHudSecuritySignalPresence() {
    const source = readText('js/app/vector/vector-hud-utils.js');
    assert(source.includes('hud-intel-integrity'),
        'Vector HUD does not render intel integrity slot');
    assert(source.includes('alidade:securityStateChanged'),
        'Vector HUD does not subscribe to security state updates');
    assert(source.includes('__ALIDADE_VECTOR_SECURITY_UPDATE_HANDLER__'),
        'Vector HUD security update handler reference is missing');
    assert(source.includes('hud-context-source'),
        'Vector HUD does not render context source slot');
    assert(source.includes('hud-risk-mode'),
        'Vector HUD does not render risk signal mode slot');
    return {
        name: 'vector-hud-security-signal-presence',
        ok: true
    };
}

async function testBootstrapFailClosedPolicyFlow() {
    const source = readText('js/app/runtime/bootstrap-runtime-utils.js');
    const events = [];
    const windowObj = {
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: (event) => {
            events.push(event.type);
            return true;
        },
        document: {
            getElementById: () => null
        },
        navigator: {},
        location: { hostname: 'localhost' }
    };
    windowObj.window = windowObj;

    const context = {
        window: windowObj,
        console,
        CustomEvent: createCustomEventCtor(),
        setTimeout: (handler) => {
            if (typeof handler === 'function') handler();
            return 0;
        },
        clearTimeout
    };

    vm.createContext(context);
    vm.runInContext(source, context, { filename: 'js/app/runtime/bootstrap-runtime-utils.js' });

    const runtimeUtils = windowObj.ALIDADE_RUNTIME_UTILS;
    assert(runtimeUtils && typeof runtimeUtils.resolveInitializeAlidadeAppFlow === 'function',
        'Bootstrap runtime utils are unavailable');
    assert(typeof runtimeUtils.resolveGoldenRecordBootstrapPolicy === 'function',
        'Bootstrap runtime policy resolver is unavailable');

    const policy = runtimeUtils.resolveGoldenRecordBootstrapPolicy({
        windowObj,
        strictGoldenRecordGate: true
    });
    assert(policy.failOpen === false, 'Strict golden-record policy must force failOpen=false');
    assert(policy.blockStartupOnFailure === true, 'Strict golden-record policy must block startup on failure');

    let initTouched = false;
    const result = await runtimeUtils.resolveInitializeAlidadeAppFlow({
        windowObj,
        documentObj: windowObj.document,
        navigatorObj: windowObj.navigator,
        consoleObj: console,
        setTimeoutFn: (handler) => {
            if (typeof handler === 'function') handler();
            return 0;
        },
        preloadGoldenRecordFn: async () => ({ status: 'failed' }),
        goldenRecordPolicy: {
            strict: true,
            failOpen: false,
            blockStartupOnFailure: true,
            dataUrl: './golden-record-v1.0.2.json'
        },
        initializeAppStateFn: () => {
            initTouched = true;
        },
        renderAppFn: () => {
            initTouched = true;
        }
    });

    const securityState = windowObj.__ALIDADE_RUNTIME_SECURITY_STATE__?.goldenRecord || {};
    assert(result === false, 'Bootstrap flow should fail when strict fail-closed policy blocks startup');
    assert(initTouched === false, 'Bootstrap flow continued despite fail-closed block');
    assert(securityState.status === 'blocked', 'Security state was not marked blocked');
    assert(events.includes('alidade:securityStateChanged'),
        'Bootstrap flow did not dispatch security state change event');

    return {
        name: 'bootstrap-fail-closed-policy-flow',
        ok: true,
        securityState: {
            status: securityState.status,
            mode: securityState.mode
        }
    };
}

async function testPowerRuntimeModeFlow() {
    const source = readText('js/app/power/power-runtime.js');
    const batteryHandlers = new Map();
    const connectionHandlers = new Map();
    const battery = {
        level: 0.82,
        charging: false,
        addEventListener: (type, handler) => {
            batteryHandlers.set(type, handler);
        }
    };
    const connection = {
        saveData: false,
        effectiveType: '4g',
        addEventListener: (type, handler) => {
            connectionHandlers.set(type, handler);
        }
    };

    const windowObj = createEventWindow({
        navigator: {
            onLine: true,
            getBattery: async () => battery,
            connection
        }
    });

    const context = {
        window: windowObj,
        console,
        navigator: windowObj.navigator,
        CustomEvent: createCustomEventCtor(),
        setTimeout,
        clearTimeout
    };

    vm.createContext(context);
    vm.runInContext(source, context, { filename: 'js/app/power/power-runtime.js' });

    const utils = windowObj.ALIDADE_POWER_RUNTIME_UTILS;
    assert(utils && typeof utils.getMode === 'function',
        'Power runtime did not expose getMode');
    assert(typeof utils.whenReady === 'function',
        'Power runtime did not expose readiness promise');

    await utils.whenReady();
    assert(utils.getMode() === 'normal',
        'Power runtime did not initialize in normal mode');

    battery.level = 0.08;
    const levelHandler = batteryHandlers.get('levelchange');
    if (typeof levelHandler === 'function') levelHandler();
    assert(utils.getMode() === 'critical',
        'Power runtime did not switch to critical mode on low battery');

    const forced = utils.forceModeForDebug('emergency');
    assert(forced && forced.ok === true && utils.getMode() === 'emergency',
        'Power runtime forceModeForDebug did not set emergency mode');

    utils.clearForcedMode();
    assert(utils.getMode() === 'critical',
        'Power runtime clearForcedMode did not restore inferred mode');

    battery.charging = true;
    const chargingHandler = batteryHandlers.get('chargingchange');
    if (typeof chargingHandler === 'function') chargingHandler();
    assert(utils.getMode() === 'normal',
        'Power runtime did not normalize mode while charging');

    connection.saveData = true;
    connection.effectiveType = '2g';
    battery.charging = false;
    battery.level = undefined;
    if (typeof chargingHandler === 'function') chargingHandler();
    const connectionHandler = connectionHandlers.get('change');
    if (typeof connectionHandler === 'function') connectionHandler();
    assert(utils.getMode() === 'power_saver',
        'Power runtime did not move to power_saver mode from network hints');

    assert(windowObj.__events.includes('alidade:powerRuntimeReady'),
        'Power runtime did not dispatch ready event');
    assert(windowObj.__events.includes('alidade:powerModeChanged'),
        'Power runtime did not dispatch mode change event');

    return {
        name: 'power-runtime-mode-flow',
        ok: true,
        state: utils.getState()
    };
}

async function testIntelEventRuntimeGuardFlow() {
    const source = readText('js/app/security/intel-event-runtime.js');
    const dataset = readJson('golden-record-v1.0.2.json');

    const storageMap = new Map();
    const localStorage = {
        getItem: (key) => (storageMap.has(key) ? storageMap.get(key) : null),
        setItem: (key, value) => {
            storageMap.set(String(key), String(value));
        },
        removeItem: (key) => {
            storageMap.delete(String(key));
        }
    };

    let fetchCalls = 0;
    let lastFetchUrl = null;
    let lastFetchInit = null;
    let powerMode = 'normal';
    let intervalSeq = 0;
    const intervalRegistry = new Map();
    const setIntervalStub = (handler, _delay) => {
        intervalSeq += 1;
        intervalRegistry.set(intervalSeq, handler);
        return intervalSeq;
    };
    const clearIntervalStub = (id) => {
        intervalRegistry.delete(id);
    };
    const windowObj = createEventWindow({
        ALIDADE_GOLDEN_RECORD: dataset,
        ALIDADE_POWER_RUNTIME_UTILS: {
            getMode: () => powerMode,
            getState: () => ({ mode: powerMode })
        },
        localStorage,
        crypto: crypto.webcrypto,
        TextEncoder,
        navigator: { onLine: true },
        fetch: async (url, init) => {
            fetchCalls += 1;
            lastFetchUrl = String(url || '');
            lastFetchInit = init || null;
            return {
                ok: true,
                status: 200,
                async json() {
                    return { ok: true };
                }
            };
        }
    });

    const context = {
        window: windowObj,
        console,
        TextEncoder,
        navigator: windowObj.navigator,
        localStorage,
        CustomEvent: createCustomEventCtor(),
        setInterval: setIntervalStub,
        clearInterval: clearIntervalStub,
        setTimeout,
        clearTimeout
    };

    vm.createContext(context);
    vm.runInContext(source, context, { filename: 'js/app/security/intel-event-runtime.js' });

    const utils = windowObj.ALIDADE_INTEL_EVENT_UTILS;
    assert(utils && typeof utils.emitIntelEvent === 'function',
        'Intel event runtime did not expose emitIntelEvent');
    assert(typeof utils.flushQueue === 'function',
        'Intel event runtime did not expose flushQueue');
    assert(typeof utils.setIngestApiKey === 'function',
        'Intel event runtime did not expose setIngestApiKey helper');
    assert(typeof utils.setIngestEndpoint === 'function',
        'Intel event runtime did not expose setIngestEndpoint helper');

    localStorage.setItem('alidade_intel_ingest_api_key_v1', 'smoke_ingest_key');
    const endpointOverride = 'https://example.test/functions/v1/intel-ingest';
    const endpointUpdate = utils.setIngestEndpoint(endpointOverride);
    assert(endpointUpdate && endpointUpdate.ok === true,
        'Intel event runtime did not acknowledge endpoint override update');

    const unknown = await utils.emitIntelEvent('unknown.event', { test: true }, { sessionId: 'smoke_session' });
    assert(unknown && unknown.ok === false && unknown.reason === 'unknown_event',
        'Intel event runtime did not reject unknown events');

    const accepted = await utils.emitIntelEvent('context.update', {
        type: 'location',
        lat: 31.62603,
        lng: -7.98993,
        dangerLevel: 'medium'
    }, {
        sessionId: 'smoke_session',
        source: 'smoke'
    });
    assert(accepted && accepted.ok === true,
        'Intel event runtime did not accept canonical context.update event');
    assert(utils.getQueueStats().pending >= 1,
        'Intel event runtime did not enqueue accepted event');

    powerMode = 'critical';
    windowObj.dispatchEvent({ type: 'alidade:powerModeChanged', detail: { mode: 'critical' } });
    const droppedInCritical = await utils.emitIntelEvent('context.update', {
        type: 'location',
        lat: 31.62603,
        lng: -7.98993,
        dangerLevel: 'medium'
    }, {
        sessionId: 'smoke_session',
        source: 'smoke'
    });
    assert(droppedInCritical && droppedInCritical.ok === false && droppedInCritical.reason === 'power_mode_drop_noncritical',
        'Intel event runtime did not drop non-critical context updates in critical power mode');
    assert(utils.getPowerMode && utils.getPowerMode() === 'critical',
        'Intel event runtime did not refresh power mode after power signal');

    powerMode = 'normal';
    windowObj.dispatchEvent({ type: 'alidade:powerModeChanged', detail: { mode: 'normal' } });

    const replayA = await utils.emitIntelEvent('sos.armed', { method: 'button' }, {
        sessionId: 'smoke_session',
        nonce: 'smoke_nonce_fixed'
    });
    const replayB = await utils.emitIntelEvent('sos.armed', { method: 'button' }, {
        sessionId: 'smoke_session',
        nonce: 'smoke_nonce_fixed'
    });
    assert(replayA && replayA.ok === true,
        'Intel event runtime did not accept first nonce');
    assert(replayB && replayB.ok === false && replayB.reason === 'replay_nonce_detected',
        'Intel event runtime did not reject replayed nonce');

    const flushed = await utils.flushQueue(true);
    assert(flushed && typeof flushed.pending === 'number',
        'Intel event runtime flush did not return queue summary');
    if (!flushed.skipped) {
        assert(Number.isFinite(Number(flushed.acceptedCount)),
            'Intel event runtime flush did not expose numeric acceptedCount');
        assert(Number.isFinite(Number(flushed.rejectedCount)),
            'Intel event runtime flush did not expose numeric rejectedCount');
    }
    assert(fetchCalls > 0,
        'Intel event runtime did not attempt network flush');
    const sentHeaders = lastFetchInit && lastFetchInit.headers ? lastFetchInit.headers : {};
    assert(lastFetchUrl === endpointOverride,
        'Intel event runtime did not flush to overridden ingest endpoint');
    assert(sentHeaders['x-intel-ingest-key'] === 'smoke_ingest_key',
        'Intel event runtime did not send x-intel-ingest-key from configured API key');
    assert(windowObj.__events.includes('alidade:intelEventQueued'),
        'Intel event runtime did not dispatch intelEventQueued event');
    assert(windowObj.__events.includes('alidade:intelEventRejected'),
        'Intel event runtime did not dispatch intelEventRejected event');

    return {
        name: 'intel-event-runtime-guard-flow',
        ok: true,
        stats: {
            fetchCalls,
            pending: utils.getQueueStats().pending,
            rejections: utils.getRecentRejections().length
        }
    };
}

function testIntelEventWiringPresence() {
    const guardSource = readText('js/app/security/intel-event-runtime.js');
    assert(guardSource.includes('CANONICAL_EVENTS'),
        'Intel event runtime does not define canonical events set');
    assert(guardSource.includes('checkRateLimit'),
        'Intel event runtime does not define rate limiting path');
    assert(guardSource.includes('consumeNonce'),
        'Intel event runtime does not define nonce replay guard');
    assert(guardSource.includes('alidade:powerModeChanged'),
        'Intel event runtime does not subscribe to power mode changes');
    assert(guardSource.includes('power_mode_drop_noncritical'),
        'Intel event runtime does not guard non-critical events on critical power mode');
    assert(guardSource.includes('alidade:intelEventRejected'),
        'Intel event runtime does not dispatch rejection event');
    assert(guardSource.includes('alidade:intelEventQueued'),
        'Intel event runtime does not dispatch queued event');
    assert(guardSource.includes('/functions/v1/intel-ingest'),
        'Intel event runtime default endpoint is not wired to edge ingest');
    assert(guardSource.includes('alidade_intel_ingest_api_key_v1'),
        'Intel event runtime does not persist ingest API key slot');
    assert(guardSource.includes('x-intel-ingest-key'),
        'Intel event runtime does not send ingest API key header');
    assert(guardSource.includes('setIngestApiKey'),
        'Intel event runtime does not expose ingest API key setter');
    assert(guardSource.includes('setIngestEndpoint'),
        'Intel event runtime does not expose ingest endpoint setter');

    const contextSource = readText('js/app/context/context-runtime.js');
    assert(contextSource.includes('emitIntelContextUpdate'),
        'Context runtime does not expose intel context emit helper');
    assert(contextSource.includes('getPowerAwareIntelEmitIntervalMs'),
        'Context runtime does not expose power-aware intel emit interval helper');
    assert(contextSource.includes('shouldEmitIntelContextUpdate'),
        'Context runtime does not expose power-aware intel emit throttle guard');
    assert(contextSource.includes("emitIntelEvent('context.update'"),
        'Context runtime does not emit context.update through intel guard');
    assert(contextSource.includes('restoreContextFromCache'),
        'Context runtime does not expose cached context restore path');
    assert(contextSource.includes('resolveInterpolatedRiskZones'),
        'Context runtime does not expose risk interpolation helper');
    assert(contextSource.includes('baseline_risk_zone_interpolated'),
        'Context runtime does not tag interpolated risk zones');

    const sosSource = readText('js/emergency-sos.js');
    assert(sosSource.includes("emitIntelEvent('sos.armed'"),
        'Emergency SOS does not emit sos.armed through intel guard');
    assert(sosSource.includes("emitIntelEvent('sos.triggered'"),
        'Emergency SOS does not emit sos.triggered through intel guard');
    assert(sosSource.includes("emitIntelEvent('sos.deactivated'"),
        'Emergency SOS does not emit sos.deactivated through intel guard');

    const indexSource = readText('index.html');
    assert(indexSource.includes('js/app/power/power-runtime.js'),
        'Index does not register power runtime script');
    assert(indexSource.includes('js/app/security/intel-event-runtime.js'),
        'Index does not register intel event runtime script');

    return {
        name: 'intel-event-guard-wiring-presence',
        ok: true
    };
}

function testIntelIngestEdgeFunctionPresence() {
    const source = readText('supabase/functions/intel-ingest/index.ts');
    assert(source.includes('CANONICAL_EVENTS'),
        'intel-ingest edge function does not define canonical event whitelist');
    assert(source.includes('MAX_REQUEST_BODY_BYTES'),
        'intel-ingest edge function does not define request-body limit');
    assert(source.includes('request_body_too_large'),
        'intel-ingest edge function does not enforce request-body limit');
    assert(source.includes('parseRequestJsonBody'),
        'intel-ingest edge function does not use guarded JSON body parser');
    assert(source.includes('readRequestBodyBytes'),
        'intel-ingest edge function does not stream-read body with byte limits');
    assert(source.includes('unsupported_media_type'),
        'intel-ingest edge function does not enforce application/json content type');
    assert(source.includes('invalid_body_stream'),
        'intel-ingest edge function does not handle invalid body stream errors');
    assert(source.includes('verifyEnvelopeSignature'),
        'intel-ingest edge function does not verify event signature');
    assert(source.includes('invalid_signature_alg'),
        'intel-ingest edge function does not enforce signature_alg validation');
    assert(source.includes('payload_too_large'),
        'intel-ingest edge function does not enforce payload size limit');
    assert(source.includes('meta_too_large'),
        'intel-ingest edge function does not enforce meta size limit');
    assert(source.includes('event_too_large'),
        'intel-ingest edge function does not enforce event size limit');
    assert(source.includes('SESSION_MAP_MAX_ENTRIES'),
        'intel-ingest edge function does not cap session-memory map growth');
    assert(source.includes('checkReplayNonce'),
        'intel-ingest edge function does not enforce replay nonce guard');
    assert(source.includes('checkSessionRateLimit'),
        'intel-ingest edge function does not enforce per-session rate limiting');
    assert(source.includes('SOURCE_RATE_LIMITS_ENV_KEY') && source.includes('INTEL_INGEST_SOURCE_RATE_LIMITS'),
        'intel-ingest edge function does not define per-source rate-limit config env');
    assert(source.includes('parseSourceRateLimitRules'),
        'intel-ingest edge function does not parse per-source rate-limit rules');
    assert(source.includes('resolveSourceRateLimit'),
        'intel-ingest edge function does not resolve per-source rate-limit rule');
    assert(source.includes('sessionSourceRateMemory'),
        'intel-ingest edge function does not keep per-source rate-limit memory');
    assert(source.includes('checkGeoPlausibility'),
        'intel-ingest edge function does not enforce geo plausibility checks');
    assert(source.includes('stale_or_future_event'),
        'intel-ingest edge function does not reject stale/future events');
    assert(source.includes('INTEL_INGEST_SIGNING_SECRET'),
        'intel-ingest edge function does not require signing secret');
    assert(source.includes('missing_ingest_api_key'),
        'intel-ingest edge function does not enforce API key when persistence is enabled');
    assert(source.includes('.upsert(') && source.includes('onConflict: "event_id"'),
        'intel-ingest edge function does not use idempotent event_id upsert');
    assert(source.includes('ignoreDuplicates: true'),
        'intel-ingest edge function does not ignore duplicate event_id rows');
    assert(source.includes('persistRejectedEvents'),
        'intel-ingest edge function does not persist rejection telemetry');
    assert(source.includes('intel_event_rejections'),
        'intel-ingest edge function does not write rejected events to intel_event_rejections table');
    assert(source.includes('rejectedPersistedCount'),
        'intel-ingest edge function does not expose rejectedPersistedCount in response');
    assert(source.includes('rejectionPersistenceWarning'),
        'intel-ingest edge function does not expose rejectionPersistenceWarning in response');
    return {
        name: 'intel-ingest-edge-function-presence',
        ok: true
    };
}

function testIntelEventStreamMigrationPresence() {
    const source = readText('supabase/migrations/20260217220500_create_intel_event_stream.sql');
    assert(source.includes('CREATE TABLE IF NOT EXISTS public.intel_event_stream'),
        'intel_event_stream migration does not create intake table');
    assert(source.includes('ENABLE ROW LEVEL SECURITY'),
        'intel_event_stream migration does not enable RLS');
    assert(source.includes('FORCE ROW LEVEL SECURITY'),
        'intel_event_stream migration does not force RLS');
    assert(source.includes('intel_event_stream_service_role_insert'),
        'intel_event_stream migration does not create service_role insert policy');
    assert(source.includes('idx_intel_event_stream_event_id_unique'),
        'intel_event_stream migration does not define unique event_id index');
    assert(source.includes('CREATE OR REPLACE FUNCTION public.purge_intel_event_stream'),
        'intel_event_stream migration does not define retention purge function');
    assert(source.includes('pg_cron'),
        'intel_event_stream migration does not include pg_cron retention scheduling guard');
    return {
        name: 'intel-event-stream-migration-presence',
        ok: true
    };
}

function testIntelIngestOpsPresence() {
    const healthMigration = readText('supabase/migrations/20260217222500_add_intel_ingest_health_rpc.sql');
    assert(healthMigration.includes('CREATE OR REPLACE FUNCTION public.get_intel_ingest_health'),
        'intel ingest health migration does not define health RPC');
    assert(healthMigration.includes('GRANT EXECUTE ON FUNCTION public.get_intel_ingest_health(integer) TO service_role'),
        'intel ingest health migration does not grant execute to service_role');
    const healthKpiMigration = readText('supabase/migrations/20260218050000_enhance_intel_ingest_health_rpc_kpis.sql');
    assert(healthKpiMigration.includes('ingestDelayMsP95'),
        'intel ingest KPI migration does not expose ingestDelayMsP95');
    assert(healthKpiMigration.includes('freshnessSeconds'),
        'intel ingest KPI migration does not expose freshnessSeconds');
    assert(healthKpiMigration.includes('eventsBySource'),
        'intel ingest KPI migration does not expose eventsBySource');
    const rejectionTelemetryMigration = readText('supabase/migrations/20260218052018_add_intel_ingest_rejection_telemetry.sql');
    assert(rejectionTelemetryMigration.includes('CREATE TABLE IF NOT EXISTS public.intel_event_rejections'),
        'intel rejection telemetry migration does not create intel_event_rejections table');
    assert(rejectionTelemetryMigration.includes('purge_intel_event_rejections'),
        'intel rejection telemetry migration does not define rejection retention purge');
    assert(rejectionTelemetryMigration.includes('rejectRatePercent'),
        'intel rejection telemetry migration does not expose rejectRatePercent in health RPC');
    assert(rejectionTelemetryMigration.includes('rejectedBySource'),
        'intel rejection telemetry migration does not expose rejectedBySource in health RPC');
    assert(rejectionTelemetryMigration.includes('rejectedByReason'),
        'intel rejection telemetry migration does not expose rejectedByReason in health RPC');
    const rejectionSourceReasonMigration = readText('supabase/migrations/20260218063000_add_intel_ingest_rejected_by_source_reason_kpi.sql');
    assert(rejectionSourceReasonMigration.includes('CREATE OR REPLACE FUNCTION public.get_intel_ingest_health'),
        'intel source-reason KPI migration does not redefine health RPC');
    assert(rejectionSourceReasonMigration.includes('rejectedBySourceReason'),
        'intel source-reason KPI migration does not expose rejectedBySourceReason in health RPC');

    const healthScript = readText('scripts/check-intel-ingest-health.cjs');
    assert(healthScript.includes("rpc('get_intel_ingest_health'"),
        'intel ingest health script does not call get_intel_ingest_health RPC');
    assert(healthScript.includes('--window-minutes'),
        'intel ingest health script does not support --window-minutes flag');
    assert(healthScript.includes('--max-delayed'),
        'intel ingest health script does not support --max-delayed flag');
    assert(healthScript.includes('--min-distinct-sessions'),
        'intel ingest health script does not support --min-distinct-sessions flag');
    assert(healthScript.includes('--max-p95-delay-ms'),
        'intel ingest health script does not support --max-p95-delay-ms flag');
    assert(healthScript.includes('--max-freshness-seconds'),
        'intel ingest health script does not support --max-freshness-seconds flag');
    assert(healthScript.includes('--require-source'),
        'intel ingest health script does not support --require-source flag');
    assert(healthScript.includes('--min-source-events'),
        'intel ingest health script does not support --min-source-events flag');
    assert(healthScript.includes('--max-rejected'),
        'intel ingest health script does not support --max-rejected flag');
    assert(healthScript.includes('--max-reject-rate-pct'),
        'intel ingest health script does not support --max-reject-rate-pct flag');
    assert(healthScript.includes('--ignore-reject-source-in-rate'),
        'intel ingest health script does not support --ignore-reject-source-in-rate flag');
    assert(healthScript.includes('--ignore-reject-sources-in-rate'),
        'intel ingest health script does not support --ignore-reject-sources-in-rate flag');
    assert(healthScript.includes('--ignore-reject-source-prefixes'),
        'intel ingest health script does not support --ignore-reject-source-prefixes flag');
    assert(healthScript.includes('--allowed-reject-reasons'),
        'intel ingest health script does not support --allowed-reject-reasons flag');
    assert(healthScript.includes('--allowed-reject-sources'),
        'intel ingest health script does not support --allowed-reject-sources flag');
    assert(healthScript.includes('--allowed-reject-source-prefixes'),
        'intel ingest health script does not support --allowed-reject-source-prefixes flag');
    assert(healthScript.includes('--allowed-reject-source-reasons'),
        'intel ingest health script does not support --allowed-reject-source-reasons flag');
    assert(healthScript.includes('--reject-source'),
        'intel ingest health script does not support --reject-source flag');
    assert(healthScript.includes('--min-reject-source-events'),
        'intel ingest health script does not support --min-reject-source-events flag');
    assert(healthScript.includes('--max-reject-source-events'),
        'intel ingest health script does not support --max-reject-source-events flag');

    const verifyScript = readText('scripts/verify-intel-ingest.cjs');
    assert(verifyScript.includes('--min-distinct-sessions'),
        'intel ingest verify script does not support --min-distinct-sessions flag');
    assert(verifyScript.includes('--max-p95-delay-ms'),
        'intel ingest verify script does not support --max-p95-delay-ms flag');
    assert(verifyScript.includes('--max-freshness-seconds'),
        'intel ingest verify script does not support --max-freshness-seconds flag');
    assert(verifyScript.includes('--require-source'),
        'intel ingest verify script does not support --require-source flag');
    assert(verifyScript.includes('--min-source-events'),
        'intel ingest verify script does not support --min-source-events flag');
    assert(verifyScript.includes('--require-persistence'),
        'intel ingest verify script does not support --require-persistence flag');
    assert(verifyScript.includes('--max-rejected'),
        'intel ingest verify script does not support --max-rejected flag');
    assert(verifyScript.includes('--max-reject-rate-pct'),
        'intel ingest verify script does not support --max-reject-rate-pct flag');
    assert(verifyScript.includes('--ignore-reject-source-in-rate'),
        'intel ingest verify script does not support --ignore-reject-source-in-rate flag');
    assert(verifyScript.includes('--ignore-reject-sources-in-rate'),
        'intel ingest verify script does not support --ignore-reject-sources-in-rate flag');
    assert(verifyScript.includes('--ignore-reject-source-prefixes'),
        'intel ingest verify script does not support --ignore-reject-source-prefixes flag');
    assert(verifyScript.includes('--allowed-reject-reasons'),
        'intel ingest verify script does not support --allowed-reject-reasons flag');
    assert(verifyScript.includes('--allowed-reject-sources'),
        'intel ingest verify script does not support --allowed-reject-sources flag');
    assert(verifyScript.includes('--allowed-reject-source-prefixes'),
        'intel ingest verify script does not support --allowed-reject-source-prefixes flag');
    assert(verifyScript.includes('--allowed-reject-source-reasons'),
        'intel ingest verify script does not support --allowed-reject-source-reasons flag');
    assert(verifyScript.includes('--reject-source'),
        'intel ingest verify script does not support --reject-source flag');
    assert(verifyScript.includes('--min-reject-source-events'),
        'intel ingest verify script does not support --min-reject-source-events flag');
    assert(verifyScript.includes('--max-reject-source-events'),
        'intel ingest verify script does not support --max-reject-source-events flag');
    assert(verifyScript.includes('--rejection-probe-count'),
        'intel ingest verify script does not support --rejection-probe-count flag');
    assert(verifyScript.includes('--rejection-probe-source'),
        'intel ingest verify script does not support --rejection-probe-source flag');
    assert(verifyScript.includes('--require-rejection-persistence'),
        'intel ingest verify script does not support --require-rejection-persistence flag');
    assert(verifyScript.includes('--rejection-probe-expected-reason'),
        'intel ingest verify script does not support --rejection-probe-expected-reason flag');

    const packageJson = readText('package.json');
    assert(packageJson.includes('"ops:intel:probe"'),
        'package.json does not register ops:intel:probe script');
    assert(packageJson.includes('"ops:intel:health"'),
        'package.json does not register ops:intel:health script');
    assert(packageJson.includes('"ops:intel:verify"'),
        'package.json does not register ops:intel:verify script');
    assert(packageJson.includes('"ops:intel:verify:quick"'),
        'package.json does not register ops:intel:verify:quick script');
    assert(packageJson.includes('"ops:intel:health:strict"'),
        'package.json does not register ops:intel:health:strict script');
    assert(packageJson.includes('"ops:intel:verify:strict"'),
        'package.json does not register ops:intel:verify:strict script');
    assert(packageJson.includes('"ops:intel:verify:strict:rejection"'),
        'package.json does not register ops:intel:verify:strict:rejection script');
    assert(packageJson.includes('"ops:intel:sla"'),
        'package.json does not register ops:intel:sla script');
    assert(packageJson.includes('"ops:intel:ci"'),
        'package.json does not register ops:intel:ci script');
    assert(packageJson.includes('"ops:hooks:install"'),
        'package.json does not register ops:hooks:install script');
    assert(packageJson.includes('"security:scan:secrets"'),
        'package.json does not register security:scan:secrets script');
    const packageManifest = JSON.parse(packageJson);
    const strictHealthScript = String(packageManifest?.scripts?.['ops:intel:health:strict'] || '');
    const quickVerifyScript = String(packageManifest?.scripts?.['ops:intel:verify:quick'] || '');
    const intelSlaScript = String(packageManifest?.scripts?.['ops:intel:sla'] || '');
    const strictVerifyScript = String(packageManifest?.scripts?.['ops:intel:verify:strict'] || '');
    const strictVerifyRejectionScript = String(packageManifest?.scripts?.['ops:intel:verify:strict:rejection'] || '');
    assert(quickVerifyScript.includes('--count 3'),
        'ops:intel:verify:quick does not enforce reduced probe count');
    assert(quickVerifyScript.includes('--require-persistence 1'),
        'ops:intel:verify:quick does not enforce persistence requirement');
    assert(intelSlaScript.includes('check-intel-verify-sla.cjs'),
        'ops:intel:sla does not execute SLA checker script');
    assert(intelSlaScript.includes('--require-success-job intel-verify-full'),
        'ops:intel:sla does not enforce full-lane success job requirement');
    assert(strictHealthScript.includes('--allowed-reject-source-reasons'),
        'ops:intel:health:strict does not enforce source-reason allowlist');
    assert(strictVerifyScript.includes('--allowed-reject-source-reasons'),
        'ops:intel:verify:strict does not enforce source-reason allowlist');
    assert(strictVerifyScript.includes('--require-persistence 1'),
        'ops:intel:verify:strict does not enforce persistence requirement');
    assert(strictVerifyRejectionScript.includes('--require-rejection-persistence 1'),
        'ops:intel:verify:strict:rejection does not enforce rejection persistence requirement');
    const strictCiScript = String(packageManifest?.scripts?.['ops:intel:ci'] || '');
    assert(strictCiScript.includes('ops:intel:verify:strict'),
        'ops:intel:ci does not run strict verify profile');
    assert(strictCiScript.includes('ops:intel:verify:strict:rejection'),
        'ops:intel:ci does not run strict rejection verify profile');
    assert(strictCiScript.includes('ops:intel:health:strict'),
        'ops:intel:ci does not run strict health profile');

    const smokeWorkflow = readText('.github/workflows/smoke-defense.yml');
    assert(smokeWorkflow.includes('Secret hygiene scan'),
        'smoke-defense workflow does not run Secret hygiene scan step');
    assert(smokeWorkflow.includes('schedule:'),
        'smoke-defense workflow does not include scheduled monitoring trigger');
    assert(smokeWorkflow.includes("cron: '17 */6 * * *'"),
        'smoke-defense workflow schedule cron is missing or unexpected');
    assert(smokeWorkflow.includes("group: smoke-defense-${{ github.ref }}-${{ github.event_name }}-${{ github.event_name == 'workflow_dispatch' && inputs.verify_profile || 'auto' }}"),
        'smoke-defense workflow does not use lane-aware concurrency group');
    assert(smokeWorkflow.includes('permissions:'),
        'smoke-defense workflow does not declare explicit permissions');
    assert(smokeWorkflow.includes('actions: write'),
        'smoke-defense workflow does not grant actions: write for watchdog remediation');
    assert(smokeWorkflow.includes('verify_profile'),
        'smoke-defense workflow does not expose manual verify profile input');
    assert(smokeWorkflow.includes('sla_max_age_hours'),
        'smoke-defense workflow does not expose manual SLA max age input');
    assert(smokeWorkflow.includes('intel-verify-fast'),
        'smoke-defense workflow does not define intel fast verify lane');
    assert(smokeWorkflow.includes('intel-verify-full'),
        'smoke-defense workflow does not define intel full verify lane');
    assert(smokeWorkflow.includes('intel-sla-watchdog'),
        'smoke-defense workflow does not define intel SLA watchdog lane');
    assert(smokeWorkflow.includes('npm run ops:intel:verify:quick'),
        'smoke-defense workflow fast lane does not use quick verify profile');
    assert(smokeWorkflow.includes('npm run ops:intel:ci'),
        'smoke-defense workflow full lane does not use strict CI profile');
    assert(smokeWorkflow.includes('npm run ops:intel:sla'),
        'smoke-defense workflow watchdog lane does not run SLA check');
    assert(smokeWorkflow.includes('SLA_MAX_AGE_HOURS'),
        'smoke-defense workflow watchdog lane does not resolve SLA max age input');
    assert(smokeWorkflow.includes('npm run ops:intel:sla -- --max-age-hours'),
        'smoke-defense workflow watchdog lane does not pass SLA max age override');
    assert(smokeWorkflow.includes('continue-on-error: true'),
        'smoke-defense workflow watchdog lane does not tolerate stale SLA check before remediation');
    assert(smokeWorkflow.includes('Trigger full intel verify remediation'),
        'smoke-defense workflow watchdog lane does not define full verify remediation step');
    assert(smokeWorkflow.includes('gh workflow run smoke-defense.yml'),
        'smoke-defense workflow watchdog remediation does not dispatch workflow run');
    assert(smokeWorkflow.includes('-f verify_profile=full'),
        'smoke-defense workflow watchdog remediation does not force full verify profile');
    assert(smokeWorkflow.includes('branches:') && smokeWorkflow.includes('- main'),
        'smoke-defense workflow push trigger is not limited to main branch');
    assert(smokeWorkflow.includes('paths-ignore:'),
        'smoke-defense workflow does not define trigger path ignore optimization');

    const ingestReadme = readText('supabase/functions/intel-ingest/README.md');
    assert(ingestReadme.includes('INTEL_INGEST_SOURCE_RATE_LIMITS'),
        'intel-ingest README does not document per-source rate-limit configuration');

    const preCommitHook = readText('.githooks/pre-commit');
    assert(preCommitHook.includes('security:scan:secrets:staged'),
        'pre-commit hook does not run staged secret hygiene scan');

    return {
        name: 'intel-ingest-ops-presence',
        ok: true
    };
}

function testEmergencySosResilienceWiringPresence() {
    const source = readText('js/emergency-sos.js');
    assert(source.includes('class SOSIncidentQueueManager'),
        'Emergency SOS does not define incident queue manager');
    assert(source.includes('createResilientSosFetch'),
        'Emergency SOS does not define resilient SOS fetch wrapper');
    assert(source.includes('runTamperDrill'),
        'Emergency SOS does not expose tamper drill flow');
    assert(source.includes('showAuditTimelineModal'),
        'Emergency SOS does not expose audit timeline modal flow');
    assert(source.includes('buildSignedAuditSnapshot'),
        'Emergency SOS does not expose signed snapshot builder flow');
    assert(source.includes('sos_auto_escalation_triggered'),
        'Emergency SOS does not expose auto-escalation audit flow');
    assert(source.includes('data-sos-run-drill'),
        'Emergency SOS settings card does not include tamper drill action');
    assert(source.includes('data-sos-flush-queue'),
        'Emergency SOS settings card does not include queue flush action');
    assert(source.includes('data-sos-open-audit'),
        'Emergency SOS settings card does not include audit log action');
    assert(source.includes('data-sos-toggle-auto-escalation'),
        'Emergency SOS settings card does not include auto-escalation toggle');
    assert(source.includes('data-sos-copy-snapshot'),
        'Emergency SOS settings card does not include signed snapshot copy action');
    assert(source.includes('data-sos-export-incident'),
        'Emergency SOS settings card does not include incident export action');
    assert(source.includes('alidade:securityDrillExecuted'),
        'Emergency SOS tamper drill does not dispatch security drill event');

    return {
        name: 'emergency-sos-resilience-wiring-presence',
        ok: true
    };
}

async function main() {
    const syntaxFiles = [
        'js/app/data/golden-record-runtime-utils.js',
        'js/app/power/power-runtime.js',
        'js/app/security/intel-event-runtime.js',
        'js/app/runtime/bootstrap-runtime-utils.js',
        'js/app/runtime/app-initialization-runtime.js',
        'js/app/runtime/legacy-init-runtime.js',
        'js/app/context/context-runtime.js',
        'js/app/vector/vector-hud-utils.js',
        'js/app/defense/defense-runtime.js',
        'scripts/check-intel-ingest-health.cjs',
        'scripts/probe-intel-ingest.cjs',
        'scripts/verify-intel-ingest.cjs'
    ];

    const results = [];

    syntaxFiles.forEach((filePath) => {
        runNodeCheck(filePath);
        results.push({ name: `syntax:${filePath}`, ok: true });
    });
    runNodeCheckEsm('js/emergency-sos.js');
    results.push({ name: 'syntax:js/emergency-sos.js', ok: true });

    results.push(await testGoldenRecordLoader());
    results.push(await testBootstrapFailClosedPolicyFlow());
    results.push(await testPowerRuntimeModeFlow());
    results.push(await testIntelEventRuntimeGuardFlow());
    results.push(testIntelEventWiringPresence());
    results.push(testIntelIngestEdgeFunctionPresence());
    results.push(testIntelEventStreamMigrationPresence());
    results.push(testIntelIngestOpsPresence());
    results.push(await testContextRuntimeBaselineIntegration());
    results.push(await testContextRuntimeOfflineCacheAndInterpolation());
    results.push(await testDefenseDynamicEmergencyMapAndCards());
    results.push(testVectorHudSecuritySignalPresence());
    results.push(testLegacyInitWiringPresence());
    results.push(testEmergencySosResilienceWiringPresence());

    const failed = results.filter((result) => !result.ok);
    if (failed.length > 0) {
        console.error('[SMOKE] FAIL');
        console.error(JSON.stringify({ results, failed }, null, 2));
        process.exit(1);
    }

    console.log('[SMOKE] PASS');
    console.log(JSON.stringify({ results }, null, 2));
}

main().catch((error) => {
    console.error('[SMOKE] UNCAUGHT ERROR');
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
});
