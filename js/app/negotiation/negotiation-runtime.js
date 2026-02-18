// Extracted from app.js: negotiation/haggle runtime wrappers (compatibility-first).

// ---------------------------------------------------------------
// VIEW: NEGOTIATION - HAGGLE WIZARD PRO
// ---------------------------------------------------------------

let haggleState = appState.getModule('haggle');

// Negotiation Tab State
let currentNegoTab = 'calculator';

function renderNegotiation() {
    const app = document.getElementById('app');
    if (!app) return false;

    const negotiationUtils = window.ALIDADE_NEGOTIATION_UTILS;
    const html = negotiationUtils && typeof negotiationUtils.resolveRenderNegotiationHtml === 'function'
        ? negotiationUtils.resolveRenderNegotiationHtml(ICONS)
        : '';
    app.innerHTML = html;

    // EXPOSE GLOBALLY for onclick handlers
    window.switchNegoTab = switchNegoTab;

    // ? PRIORITY 3: Load saved negotiation tab
    const savedProtocolsState = appState.getModule('protocols');
    const savedTab = savedProtocolsState.currentTab || 'calculator';
    switchNegoTab(savedTab);
    return true;
}

function switchNegoTab(tabName) {
    const negotiationUtils = window.ALIDADE_NEGOTIATION_UTILS;
    if (negotiationUtils && typeof negotiationUtils.resolveSwitchNegoTabFlow === 'function') {
        return negotiationUtils.resolveSwitchNegoTabFlow({
            tabName,
            setCurrentNegoTabFn: (nextTab) => { currentNegoTab = nextTab; },
            persistTabFn: (nextTab) => appState.setModule('protocols', { currentTab: nextTab }),
            documentObj: document,
            renderCalculatorTabFn: renderCalculatorTab,
            attachCalculatorLogicFn: attachCalculatorLogic,
            renderScriptsTabFn: renderScriptsTab,
            renderIntelTabFn: renderIntelTab
        });
    }
    return false;
}

// ---------------------------------------------------------------
// TAB: CALCULATOR (Haggle Wizard Pro)
// ---------------------------------------------------------------
function renderCalculatorTab() {
    // Always render the container - stages handle their own data requirements
    return `
            <div id="haggle-container" class="space-y-6">
                <!-- Stage content will be injected here -->
            </div>
        `;
}

function attachCalculatorLogic() {
    // Render the first stage
    renderHaggleStage();
}

// ---------------------------------------------------------------
// GLOBAL HELPERS: Flash Card & Audio
// ---------------------------------------------------------------
window.openFlashCard = function (darija, subtext, colorClass) {
    const negotiationUtils = window.ALIDADE_NEGOTIATION_UTILS;
    if (negotiationUtils && typeof negotiationUtils.resolveOpenFlashCardFlow === 'function') {
        return negotiationUtils.resolveOpenFlashCardFlow(
            darija,
            subtext,
            colorClass,
            document,
            navigator
        );
    }
    return false;
};

window.playNegoAudio = function (filename) {
    const negotiationUtils = window.ALIDADE_NEGOTIATION_UTILS;
    if (negotiationUtils && typeof negotiationUtils.resolvePlayNegoAudio === 'function') {
        return negotiationUtils.resolvePlayNegoAudio(filename, Audio, console);
    }
    return false;
};

// ---------------------------------------------------------------
// TAB: INTEL (Market Psychology)
// ---------------------------------------------------------------
function renderIntelTab() {
    const negotiationUtils = window.ALIDADE_NEGOTIATION_UTILS;
    if (negotiationUtils && typeof negotiationUtils.resolveRenderIntelTabHtml === 'function') {
        return negotiationUtils.resolveRenderIntelTabHtml();
    }
    return '';
}

// ---------------------------------------------------------------
// TAB: SCRIPTS
// ---------------------------------------------------------------
function renderScriptsTab() {
    const negotiationUtils = window.ALIDADE_NEGOTIATION_UTILS;
    const scripts = negotiationUtils && typeof negotiationUtils.resolveScriptsCatalog === 'function'
        ? negotiationUtils.resolveScriptsCatalog()
        : [];
    if (negotiationUtils && typeof negotiationUtils.resolveRenderScriptsTabHtml === 'function') {
        return negotiationUtils.resolveRenderScriptsTabHtml(scripts);
    }
    return '';
}



function renderHaggleStage() {
    const negotiationUtils = window.ALIDADE_NEGOTIATION_UTILS;
    if (negotiationUtils && typeof negotiationUtils.resolveRenderHaggleStageFlow === 'function') {
        return negotiationUtils.resolveRenderHaggleStageFlow({
            haggleState,
            persistHaggleStateFn: (state) => appState.setModule('haggle', state),
            documentObj: document,
            renderStage1Fn: renderHaggleStage1,
            renderStage2Fn: renderHaggleStage2,
            renderStage3Fn: renderHaggleStage3,
            renderStage4Fn: renderHaggleStage4,
            renderStage5Fn: renderHaggleStage5,
            renderNegotiationHistoryFn: renderNegotiationHistory,
            attachHaggleListenersFn: attachHaggleListeners,
            animateValueFn: animateValue
        });
    }
    return false;
}


// ---------------------------------------------------------------
// STAGE 1: TARGET ACQUISITION (Input) - AI ENHANCED
// ---------------------------------------------------------------
function renderHaggleStage1() {
    const negotiationUtils = window.ALIDADE_NEGOTIATION_UTILS;
    const stats = negoLearner.getStats();
    const hasHistory = stats.totalNegotiations > 0;
    if (negotiationUtils && typeof negotiationUtils.resolveRenderHaggleStage1Html === 'function') {
        return negotiationUtils.resolveRenderHaggleStage1Html(haggleState, stats, hasHistory);
    }
    return '';
}


// ---------------------------------------------------------------
// STAGE 2: THE ANCHOR - AI RECOMMENDATION DISPLAY
// ---------------------------------------------------------------
function renderHaggleStage2() {
    const negotiationUtils = window.ALIDADE_NEGOTIATION_UTILS;
    if (negotiationUtils && typeof negotiationUtils.resolveRenderHaggleStage2Html === 'function') {
        return negotiationUtils.resolveRenderHaggleStage2Html(haggleState);
    }
    return '';
}


// ---------------------------------------------------------------
// STAGE 3: THE MANEUVER (Select Tactic)
// ---------------------------------------------------------------
function renderHaggleStage3() {
    const negotiationUtils = window.ALIDADE_NEGOTIATION_UTILS;
    if (negotiationUtils && typeof negotiationUtils.resolveRenderHaggleStage3Html === 'function') {
        return negotiationUtils.resolveRenderHaggleStage3Html();
    }
    return '';
}

// ---------------------------------------------------------------
// STAGE 4: THE CLOSER (Fair Price)
// ---------------------------------------------------------------
function renderHaggleStage4() {
    const negotiationUtils = window.ALIDADE_NEGOTIATION_UTILS;
    if (negotiationUtils && typeof negotiationUtils.resolveRenderHaggleStage4Html === 'function') {
        return negotiationUtils.resolveRenderHaggleStage4Html(haggleState);
    }
    return '';
}

// ---------------------------------------------------------------
// STAGE 5: WALK AWAY (Timer)
// ---------------------------------------------------------------
function renderHaggleStage5() {
    const negotiationUtils = window.ALIDADE_NEGOTIATION_UTILS;
    if (negotiationUtils && typeof negotiationUtils.resolveRenderHaggleStage5Html === 'function') {
        return negotiationUtils.resolveRenderHaggleStage5Html(haggleState);
    }
    return '';
}

// ---------------------------------------------------------------
// HAGGLE HELPER: Safe Audio Playback
// ---------------------------------------------------------------
function playHaggleAudio(audioPath) {
    const negotiationUtils = window.ALIDADE_NEGOTIATION_UTILS;
    if (negotiationUtils && typeof negotiationUtils.resolvePlayHaggleAudio === 'function') {
        return negotiationUtils.resolvePlayHaggleAudio(audioPath, Audio, console);
    }
    return false;
}

// ---------------------------------------------------------------
// HAGGLE HELPER: History & State
// ---------------------------------------------------------------

// Ensure rounds array exists
if (!haggleState.rounds) {
    haggleState.rounds = [];
    haggleState.currentRound = 1;
}

function recordNegotiationRound(vendorPrice, yourOffer, result) {
    const negotiationUtils = window.ALIDADE_NEGOTIATION_UTILS;
    if (negotiationUtils && typeof negotiationUtils.resolveRecordNegotiationRoundFlow === 'function') {
        return negotiationUtils.resolveRecordNegotiationRoundFlow({
            haggleState,
            vendorPrice,
            yourOffer,
            result,
            persistHaggleStateFn: (state) => appState.setModule('haggle', state),
            nowFn: () => Date.now()
        });
    }
    return null;
}

function getResultIcon(result) {
    const negotiationUtils = window.ALIDADE_NEGOTIATION_UTILS;
    if (negotiationUtils && typeof negotiationUtils.resolveGetNegotiationResultIcon === 'function') {
        return negotiationUtils.resolveGetNegotiationResultIcon(result);
    }
    return '•';
}

function renderNegotiationHistory() {
    const negotiationUtils = window.ALIDADE_NEGOTIATION_UTILS;
    if (negotiationUtils && typeof negotiationUtils.resolveRenderNegotiationHistoryHtml === 'function') {
        return negotiationUtils.resolveRenderNegotiationHistoryHtml(
            haggleState,
            (result) => getResultIcon(result)
        );
    }
    return '';
}

function mapContextAreaToNegotiationArea(area) {
    const negotiationUtils = window.ALIDADE_NEGOTIATION_UTILS;
    if (negotiationUtils && typeof negotiationUtils.resolveMapContextAreaToNegotiationArea === 'function') {
        return negotiationUtils.resolveMapContextAreaToNegotiationArea(area, window.contextEngine);
    }
    return 'unknown';
}

// ---------------------------------------------------------------
// HAGGLE HELPER: Attach Event Listeners
// ---------------------------------------------------------------
function attachHaggleListeners() {
    const negotiationUtils = window.ALIDADE_NEGOTIATION_UTILS;
    if (negotiationUtils && typeof negotiationUtils.resolveAttachHaggleListenersFlow === 'function') {
        return negotiationUtils.resolveAttachHaggleListenersFlow({
            documentObj: document,
            haggleState,
            contextEngine: window.contextEngine,
            persistHaggleStateFn: (state) => appState.setModule('haggle', state),
            mapContextAreaToNegotiationAreaFn: (area) => mapContextAreaToNegotiationArea(area),
            showToastFn: typeof showToast === 'function' ? showToast : null,
            alertFn: (message) => alert(message),
            NegotiationContextCtor: NegotiationContext,
            SmartNegotiatorCtor: SmartNegotiator,
            HapticsObj: Haptics,
            renderHaggleStageFn: () => renderHaggleStage(),
            playHaggleAudioFn: (audioPath) => playHaggleAudio(audioPath),
            recordNegotiationRoundFn: (vendorPrice, yourOffer, result) => recordNegotiationRound(vendorPrice, yourOffer, result),
            setTimeoutFn: setTimeout,
            startWalkawayTimerFn: () => startWalkawayTimer(),
            clearIntervalFn: clearInterval,
            negoLearner,
            sessionIntel: window.sessionIntel,
            consoleObj: console,
            parseIntFn: parseInt
        });
    }
    return false;
}

// ---------------------------------------------------------------
// HAGGLE HELPER: Walk Away Timer
// ---------------------------------------------------------------
function startWalkawayTimer() {
    const negotiationUtils = window.ALIDADE_NEGOTIATION_UTILS;
    if (negotiationUtils && typeof negotiationUtils.resolveStartWalkawayTimerFlow === 'function') {
        return negotiationUtils.resolveStartWalkawayTimerFlow({
            haggleState,
            documentObj: document,
            clearIntervalFn: clearInterval,
            setIntervalFn: setInterval
        });
    }
    return null;
}
