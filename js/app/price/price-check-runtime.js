// ---------------------------------------------------------------
// PRICE CHECK RUNTIME (Extracted from app.js)
// ---------------------------------------------------------------

const priceRuntimeDebugLog = (...args) => {
    if (window.__ALIDADE_DEBUG_LOGS__ === true) {
        console.log(...args);
    }
};

let priceCheckerInstance = null;

function getPriceChecker() {
    if (!priceCheckerInstance) {
        priceCheckerInstance = new PriceChecker();
    }
    return priceCheckerInstance;
}

function renderPriceChecker(containerId = 'protocol-content') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const priceUtils = window.ALIDADE_PRICE_UTILS;
    const checker = getPriceChecker();
    if (priceUtils && typeof priceUtils.resolveRenderPriceChecker === 'function') {
        priceUtils.resolveRenderPriceChecker(container, checker, ITEM_DISPLAY_NAMES, CONFIG, console);
        return;
    }

    checker.reset();
    if (priceUtils && typeof priceUtils.resolveBuildPriceCheckerScreenHtml === 'function') {
        container.innerHTML = priceUtils.resolveBuildPriceCheckerScreenHtml(
            !!CONFIG?.SIMULATION_MODE,
            ITEM_DISPLAY_NAMES
        );
    } else {
        container.innerHTML = '';
    }
    priceRuntimeDebugLog('[PRICE_CHECK] UI Rendered (Ascended)');
}


// ---------------------------------------------------------------
// UI: Event Handlers (Global)
// ---------------------------------------------------------------

window.startPriceCheckCamera = async function () {
    const priceUtils = window.ALIDADE_PRICE_UTILS;
    const checker = getPriceChecker();
    const container = document.getElementById('price-check-container');
    await runStartPriceCheckCameraFlowCompat(priceUtils, checker, container);
};

// Listen for camera:missing event
window.addEventListener('camera:missing', (event) => {
    priceRuntimeDebugLog('[CAMERA] Hardware missing event received:', event.detail);
});

const showPriceCheckCameraViewCompat = (priceUtils) => {
    if (priceUtils && typeof priceUtils.resolvePriceCheckCameraView === 'function') {
        priceUtils.resolvePriceCheckCameraView(document);
    }
};

const revertPriceCheckCameraViewCompat = (priceUtils) => {
    if (priceUtils && typeof priceUtils.resolveRevertPriceCheckCameraView === 'function') {
        priceUtils.resolveRevertPriceCheckCameraView(document);
    }
};

const showPriceCheckFileUploadFallbackCompat = (priceUtils) => {
    if (priceUtils && typeof priceUtils.resolvePriceCheckFileUploadFallback === 'function') {
        priceUtils.resolvePriceCheckFileUploadFallback(document);
    }
};

const resolveCameraStartUserMessageCompat = (priceUtils, error) => {
    if (priceUtils && typeof priceUtils.resolveCameraStartUserMessage === 'function') {
        return priceUtils.resolveCameraStartUserMessage(error);
    }
    return 'Unable to access camera.';
};

const handleCameraStartErrorCompat = (priceUtils, error) => {
    if (priceUtils && typeof priceUtils.resolveHandleCameraStartError === 'function') {
        priceUtils.resolveHandleCameraStartError(
            error,
            () => revertPriceCheckCameraViewCompat(priceUtils),
            () => showPriceCheckFileUploadFallbackCompat(priceUtils),
            (message, level) => showToast(message, level),
            (errorObj) => resolveCameraStartUserMessageCompat(priceUtils, errorObj),
            console
        );
    }
};

const runStartPriceCheckCameraFlowCompat = async (priceUtils, checker, container) => {
    if (priceUtils && typeof priceUtils.resolveStartPriceCheckCameraFlow === 'function') {
        return await priceUtils.resolveStartPriceCheckCameraFlow(
            checker,
            container,
            () => ensurePriceCheckCameraAccessCompat(priceUtils),
            () => showPriceCheckCameraViewCompat(priceUtils),
            (payloadChecker, payloadContainer) => payloadChecker.startCamera(payloadContainer),
            (error) => handleCameraStartErrorCompat(priceUtils, error),
            console
        );
    }
    return false;
};

const ensurePriceCheckCameraAccessCompat = (priceUtils) => {
    if (priceUtils && typeof priceUtils.ensurePriceCheckCameraAccess === 'function') {
        return priceUtils.ensurePriceCheckCameraAccess(ensureBasicFeatureAuth, ensureAiScannerAccess);
    }
    return false;
};

const resolvePriceCheckAnalyzingUiRefsCompat = (priceUtils, options) => {
    const opts = options || {};
    if (priceUtils && typeof priceUtils.resolvePriceCheckAnalyzingUiRefs === 'function') {
        return priceUtils.resolvePriceCheckAnalyzingUiRefs(document, opts);
    }
    return {
        initialView: null,
        cameraView: null,
        analyzingView: null,
        progressBar: null,
        statusEl: null
    };
};

const createPriceCheckAnalysisStepUpdaterCompat = (priceUtils, statusEl, progressBar) => {
    if (priceUtils && typeof priceUtils.createPriceCheckAnalysisStepUpdater === 'function') {
        return priceUtils.createPriceCheckAnalysisStepUpdater(statusEl, progressBar);
    }
    return () => {};
};

const hidePriceCheckAnalyzingCompat = (priceUtils, fallbackAnalyzingView) => {
    if (priceUtils && typeof priceUtils.hidePriceCheckAnalyzingWithFallback === 'function') {
        priceUtils.hidePriceCheckAnalyzingWithFallback(document, fallbackAnalyzingView);
    }
};

const ensurePriceCheckScanQuotaCompat = (priceUtils, checker, source, onDenied) => {
    if (priceUtils && typeof priceUtils.ensurePriceCheckScanQuota === 'function') {
        return priceUtils.ensurePriceCheckScanQuota(
            checker,
            source,
            ensureAiScannerAccess,
            consumeAiScannerUsage,
            onDenied
        );
    }
    return false;
};

const resolveDeepContributionStateCompat = (priceUtils) => {
    if (typeof priceUtils?.resolveDeepContributionState === 'function') {
        return priceUtils.resolveDeepContributionState(window);
    }
    return {
        deepAnalysis: window._lastDeepAnalysis,
        hybridPrice: window._lastHybridPrice
    };
};

const resolvePriceCheckResultsViewCompat = (priceUtils) => {
    if (typeof priceUtils?.resolvePriceCheckResultsView === 'function') {
        return priceUtils.resolvePriceCheckResultsView(document);
    }
    return null;
};

const resolveDeepResultsViewPayloadCompat = (priceUtils, deepAnalysis, hybridPrice) => {
    if (typeof priceUtils?.resolveDeepResultsViewPayload === 'function') {
        return priceUtils.resolveDeepResultsViewPayload(deepAnalysis, hybridPrice, ITEM_DISPLAY_NAMES);
    }
    return null;
};

const renderDeepContributionPromptCompat = (priceUtils, hybridPrice) => {
    if (priceUtils && typeof priceUtils.resolveDeepContributionPromptView === 'function') {
        return priceUtils.resolveDeepContributionPromptView(document, hybridPrice);
    }
    return null;
};

const buildDeepContributionPromptHtmlCompat = (priceUtils, hybridPrice) => {
    if (priceUtils && typeof priceUtils.buildDeepContributionPromptHtml === 'function') {
        return priceUtils.buildDeepContributionPromptHtml(hybridPrice);
    }
    return '';
};

const storeDeepContributionStateCompat = (priceUtils, deepAnalysis, hybridPrice) => {
    if (priceUtils && typeof priceUtils.storeDeepContributionState === 'function') {
        priceUtils.storeDeepContributionState(window, deepAnalysis, hybridPrice);
    }
    window._lastDeepAnalysis = deepAnalysis;
    window._lastHybridPrice = hybridPrice;
};

const resolveDeepContributionInputsCompat = (priceUtils) => {
    if (priceUtils && typeof priceUtils.readDeepContributionInputValues === 'function') {
        return priceUtils.readDeepContributionInputValues(document);
    }
    return { pricePaid: null, askingPrice: null };
};

const ensureDeepContributionPricePaidCompat = (priceUtils, pricePaid) => {
    if (priceUtils && typeof priceUtils.ensureDeepContributionPricePaid === 'function') {
        return priceUtils.ensureDeepContributionPricePaid(pricePaid, showToast);
    }
    return false;
};

const resolveDeepContributionCrowdDbCompat = (priceUtils) => {
    if (priceUtils && typeof priceUtils.resolveDeepContributionCrowdDb === 'function') {
        return priceUtils.resolveDeepContributionCrowdDb(window, CrowdPriceDB);
    }
    return null;
};

const buildDeepCrowdPayloadCompat = (priceUtils, hybridPrice, deepAnalysis, pricePaid, askingPrice, position) => {
    if (priceUtils && typeof priceUtils.buildDeepCrowdSubmissionPayload === 'function') {
        return priceUtils.buildDeepCrowdSubmissionPayload(
            hybridPrice,
            deepAnalysis,
            pricePaid,
            askingPrice,
            position
        );
    }
    return null;
};

const runShowContributionPromptCompat = (priceUtils) => {
    const deepState = resolveDeepContributionStateCompat(priceUtils);
    if (priceUtils && typeof priceUtils.resolveShowContributionPromptFlow === 'function') {
        return priceUtils.resolveShowContributionPromptFlow(
            deepState,
            (hybridPrice) => renderDeepContributionPromptCompat(priceUtils, hybridPrice),
            showToast
        );
    }
    return false;
};

const runSubmitCrowdPriceFlowCompat = async (priceUtils) => {
    const deepState = resolveDeepContributionStateCompat(priceUtils);
    const crowdInputs = resolveDeepContributionInputsCompat(priceUtils);

    if (priceUtils && typeof priceUtils.resolveSubmitCrowdPriceFlow === 'function') {
        return await priceUtils.resolveSubmitCrowdPriceFlow(
            deepState,
            crowdInputs,
            (pricePaid) => ensureDeepContributionPricePaidCompat(priceUtils, pricePaid),
            () => resolveDeepContributionCrowdDbCompat(priceUtils),
            getCurrentPosition,
            (hybridPrice, deepAnalysis, pricePaid, askingPrice, position) =>
                buildDeepCrowdPayloadCompat(priceUtils, hybridPrice, deepAnalysis, pricePaid, askingPrice, position),
            () => window.cancelPriceCheck()
        );
    }
    return false;
};

const runDeepResultsRenderCompat = (priceUtils, deepAnalysis, hybridPrice) => {
    if (typeof priceUtils?.resolveDeepResultsRenderFlow !== 'function') return false;
    return priceUtils.resolveDeepResultsRenderFlow(
        deepAnalysis,
        hybridPrice,
        () => resolvePriceCheckResultsViewCompat(priceUtils),
        (payloadDeepAnalysis, payloadHybridPrice) =>
            resolveDeepResultsViewPayloadCompat(priceUtils, payloadDeepAnalysis, payloadHybridPrice),
        (qMult) => resolveDeepQualityBadgeCompat(priceUtils, qMult),
        (area) => resolveDeepAreaDisplayCompat(priceUtils, area),
        (source) => resolveDeepSourceBadgeCompat(priceUtils, source),
        () => createDeepScoreBarCompat(priceUtils),
        (redFlags) => resolveDeepRedFlagsHtmlCompat(priceUtils, redFlags),
        (reasoning) => resolveDeepReasoningHtmlCompat(priceUtils, reasoning),
        (payload) => buildDeepResultsHtmlCompat(priceUtils, payload),
        (payloadDeepAnalysis, payloadHybridPrice) =>
            storeDeepContributionStateCompat(priceUtils, payloadDeepAnalysis, payloadHybridPrice)
    );
};

const resolveDeepQualityBadgeCompat = (priceUtils, qualityMultiplierText) => {
    if (typeof priceUtils?.resolveDeepQualityBadgeDisplay === 'function') {
        return priceUtils.resolveDeepQualityBadgeDisplay(qualityMultiplierText);
    }
    return null;
};

const resolveDeepAreaDisplayCompat = (priceUtils, area) => {
    if (typeof priceUtils?.resolveDeepAreaDisplay === 'function') {
        return priceUtils.resolveDeepAreaDisplay(area);
    }
    return null;
};

const resolveDeepSourceBadgeCompat = (priceUtils, source) => {
    if (typeof priceUtils?.resolveDeepSourceBadge === 'function') {
        return priceUtils.resolveDeepSourceBadge(source);
    }
    return '';
};

const createDeepScoreBarCompat = (priceUtils) => {
    return (score, label, maxScore = 10) => {
        if (typeof priceUtils?.renderDeepScoreBarHtml === 'function') {
            return priceUtils.renderDeepScoreBarHtml(score, label, maxScore);
        }
        return '';
    };
};

const resolveDeepRedFlagsHtmlCompat = (priceUtils, redFlags) => {
    if (typeof priceUtils?.resolveDeepRedFlagsHtml === 'function') {
        return priceUtils.resolveDeepRedFlagsHtml(redFlags);
    }
    return '';
};

const resolveDeepReasoningHtmlCompat = (priceUtils, reasoningText) => {
    if (typeof priceUtils?.resolveDeepReasoningHtml === 'function') {
        return priceUtils.resolveDeepReasoningHtml(reasoningText);
    }
    return '';
};

const buildDeepResultsHtmlCompat = (priceUtils, payload) => {
    if (typeof priceUtils?.buildDeepResultsHtml === 'function') {
        return priceUtils.buildDeepResultsHtml(payload);
    }
    return '';
};

const resolveLegacyDeepResultsContainerCompat = (priceUtils) => {
    if (priceUtils && typeof priceUtils.showLegacyDeepResultsContainer === 'function') {
        return priceUtils.showLegacyDeepResultsContainer(document);
    }
    return null;
};

const resolveLegacyDeepQualityThemeCompat = (priceUtils, qualityMultiplier) => {
    if (priceUtils && typeof priceUtils.resolveLegacyDeepQualityTheme === 'function') {
        return priceUtils.resolveLegacyDeepQualityTheme(qualityMultiplier);
    }
    return null;
};

const createLegacyDeepScoreBarCompat = (priceUtils) => {
    return (label, score, maxScore = 10) => {
        if (priceUtils && typeof priceUtils.renderLegacyDeepScoreBarHtml === 'function') {
            return priceUtils.renderLegacyDeepScoreBarHtml(label, score, maxScore);
        }
        return '';
    };
};

const resolveLegacyDeepRedFlagsHtmlCompat = (priceUtils, deepAuth) => {
    if (priceUtils && typeof priceUtils.resolveLegacyDeepRedFlagsHtml === 'function') {
        return priceUtils.resolveLegacyDeepRedFlagsHtml(deepAuth);
    }
    return '';
};

const resolveLegacyDeepAuthBadgeHtmlCompat = (priceUtils, isHandmade) => {
    if (priceUtils && typeof priceUtils.resolveLegacyDeepAuthBadgeHtml === 'function') {
        return priceUtils.resolveLegacyDeepAuthBadgeHtml(isHandmade);
    }
    return '';
};

const resolveLegacyDeepQuickPricingContentCompat = (priceUtils, smartPrice, qualityMultiplier) => {
    if (priceUtils && typeof priceUtils.resolveLegacyDeepQuickPricingContent === 'function') {
        return priceUtils.resolveLegacyDeepQuickPricingContent(smartPrice, qualityMultiplier);
    }
    return null;
};

const resolveLegacyDeepReasoningHtmlCompat = (priceUtils, reasoningText) => {
    if (priceUtils && typeof priceUtils.resolveLegacyDeepReasoningHtml === 'function') {
        return priceUtils.resolveLegacyDeepReasoningHtml(reasoningText);
    }
    return '';
};

const buildLegacyDeepResultsViewHtmlCompat = (priceUtils, payload) => {
    if (priceUtils && typeof priceUtils.buildLegacyDeepResultsViewHtml === 'function') {
        return priceUtils.buildLegacyDeepResultsViewHtml(payload);
    }
    return '';
};

const showUploadInitialCompat = (priceUtils) => {
    if (priceUtils && typeof priceUtils.showUploadInitialView === 'function') {
        priceUtils.showUploadInitialView(document);
    }
};

const resolveUploadManualSelectionCompat = async (priceUtils, imageBase64) => {
    if (priceUtils && typeof priceUtils.resolveUploadManualSelection === 'function') {
        return await priceUtils.resolveUploadManualSelection(
            document,
            imageBase64,
            (payload) => showManualCategorySelector(payload)
        );
    }
    return null;
};

const resolveUploadClassificationResultCompat = (priceUtils, classification) => {
    if (priceUtils && typeof priceUtils.resolveUploadClassificationResultView === 'function') {
        priceUtils.resolveUploadClassificationResultView(
            document,
            classification,
            (payload) => showDeepResultsView(payload),
            (payload) => showPriceInputView(payload)
        );
    }
};

const resolveUploadManualFallbackCompat = (priceUtils, checker, manualResult) => {
    if (priceUtils && typeof priceUtils.resolveUploadManualFallbackResult === 'function') {
        priceUtils.resolveUploadManualFallbackResult(
            document,
            checker,
            manualResult,
            (payload) => showPriceInputView(payload),
            showToast
        );
    }
};

const runAnalyzeDeepStandardFallbackCompat = async (priceUtils, checker, itemCategory, vendorPrice) => {
    if (priceUtils && typeof priceUtils.runAnalyzeDeepStandardFallback === 'function') {
        await priceUtils.runAnalyzeDeepStandardFallback(
            checker,
            itemCategory,
            vendorPrice,
            (payload) => showResultsView(payload),
            showToast
        );
    }
};

const buildAnalyzeDeepResultPayloadCompat = (priceUtils, itemCategory, smartPrice, analysis, deepAnalysis) => {
    if (priceUtils && typeof priceUtils.resolveAnalyzeDeepResultPayload === 'function') {
        return priceUtils.resolveAnalyzeDeepResultPayload(
            itemCategory,
            smartPrice,
            analysis,
            deepAnalysis,
            ITEM_DISPLAY_NAMES
        );
    }
    return null;
};

const resolveAnalyzeDeepVendorPriceCompat = (priceUtils) => {
    if (priceUtils && typeof priceUtils.resolveAnalyzeDeepVendorPrice === 'function') {
        return priceUtils.resolveAnalyzeDeepVendorPrice(document);
    }
    return null;
};

const ensureAnalyzeDeepVendorPriceCompat = (priceUtils, vendorPrice) => {
    if (priceUtils && typeof priceUtils.ensureAnalyzeDeepVendorPrice === 'function') {
        return priceUtils.ensureAnalyzeDeepVendorPrice(vendorPrice, showToast);
    }
    return false;
};

const resolveAnalyzeDeepContextCompat = (priceUtils, checker) => {
    if (priceUtils && typeof priceUtils.resolveAnalyzeDeepContext === 'function') {
        return priceUtils.resolveAnalyzeDeepContext(checker);
    }
    return null;
};

const runAnalyzeDeepPriceFlowCompat = async (priceUtils, checker, vendorPrice) => {
    if (priceUtils && typeof priceUtils.resolveAnalyzeDeepPriceFlow === 'function') {
        return await priceUtils.resolveAnalyzeDeepPriceFlow(
            checker,
            vendorPrice,
            (payloadChecker) => resolveAnalyzeDeepContextCompat(priceUtils, payloadChecker),
            (payloadChecker, itemCategory, payloadVendorPrice) =>
                runAnalyzeDeepStandardFallbackCompat(priceUtils, payloadChecker, itemCategory, payloadVendorPrice),
            (payloadVendorPrice, smartPrice) => runAnalyzeDeepScamCheckCompat(priceUtils, payloadVendorPrice, smartPrice),
            (itemCategory, smartPrice, analysis, deepAnalysis) =>
                buildAnalyzeDeepResultPayloadCompat(priceUtils, itemCategory, smartPrice, analysis, deepAnalysis),
            (payload) => showResultsView(payload)
        );
    }
    return false;
};

const runAnalyzeDeepActionCompat = async (priceUtils) => {
    if (priceUtils && typeof priceUtils.runAnalyzeDeepAction === 'function') {
        return await priceUtils.runAnalyzeDeepAction(
            () => resolveAnalyzeDeepVendorPriceCompat(priceUtils),
            (vendorPrice) => ensureAnalyzeDeepVendorPriceCompat(priceUtils, vendorPrice),
            () => {
                const checker = getPriceChecker();
                return checker;
            },
            (checker, vendorPrice) => runAnalyzeDeepPriceFlowCompat(priceUtils, checker, vendorPrice),
            showToast
        );
    }
    return false;
};

const runAnalyzeDeepScamCheckCompat = (priceUtils, vendorPrice, smartPrice) => {
    if (priceUtils && typeof priceUtils.runAnalyzeDeepScamCheck === 'function') {
        return priceUtils.runAnalyzeDeepScamCheck(vendorPrice, smartPrice, ScamDetector);
    }
    return null;
};

const resolveLegacyManualSelectorCategoriesCompat = (priceUtils) => {
    if (typeof priceUtils?.getLegacyManualSelectorCategories === 'function') {
        return priceUtils.getLegacyManualSelectorCategories();
    }
    return [];
};

const buildLegacyManualSelectorModalCompat = (priceUtils, categories, imageBase64) => {
    if (typeof priceUtils?.buildLegacyManualSelectorModalHtml === 'function') {
        return priceUtils.buildLegacyManualSelectorModalHtml(categories, imageBase64);
    }
    return '';
};

const openLegacyManualSelectorModalCompat = (priceUtils, modalHTML, resolve) => {
    if (typeof priceUtils?.openLegacyManualSelectorModal === 'function') {
        priceUtils.openLegacyManualSelectorModal(window, document, modalHTML, resolve);
        return;
    }
    window._manualCategoryResolve = resolve;
};

const resolveItemClassifierCategorySelectorCategoriesCompat = (priceUtils) => {
    if (typeof priceUtils?.getManualCategorySelectorCategories === 'function') {
        return priceUtils.getManualCategorySelectorCategories();
    }
    return [];
};

const buildItemClassifierCategorySelectorModalCompat = (priceUtils, categories, imagePreview) => {
    if (typeof priceUtils?.buildCategorySelectorModalHtml === 'function') {
        return priceUtils.buildCategorySelectorModalHtml(categories, imagePreview);
    }
    return '';
};

const openItemClassifierCategorySelectorModalCompat = (priceUtils, modalHTML, resolve) => {
    if (typeof priceUtils?.openCategorySelectorModal === 'function') {
        priceUtils.openCategorySelectorModal(window, document, modalHTML, resolve);
        return;
    }
    window._categoryResolve = resolve;
};

const resolveLegacyManualSelectionFinalizeCompat = (priceUtils, result) => {
    if (typeof priceUtils?.resolveLegacyManualSelectionFinalize === 'function') {
        priceUtils.resolveLegacyManualSelectionFinalize(window, document, result);
        return;
    }
    if (window._manualCategoryResolve) {
        window._manualCategoryResolve(result);
        window._manualCategoryResolve = null;
    }
};

const resolveCategorySelectorFinalizeCompat = (priceUtils, result) => {
    if (typeof priceUtils?.resolveCategorySelectorFinalize === 'function') {
        priceUtils.resolveCategorySelectorFinalize(window, document, result);
        return;
    }
    if (window._categoryResolve) {
        window._categoryResolve(result);
        window._categoryResolve = null;
    }
};

const buildDetectedItemDisplayCompat = (priceUtils, topItem, alternatives) => {
    if (priceUtils && typeof priceUtils.buildDetectedItemDisplayHtml === 'function') {
        return priceUtils.buildDetectedItemDisplayHtml(topItem, alternatives);
    }
    return '';
};

const buildQuickPriceButtonsCompat = (priceUtils, priceData) => {
    if (priceUtils && typeof priceUtils.buildQuickPriceButtonsHtml === 'function') {
        return priceUtils.buildQuickPriceButtonsHtml(priceData);
    }
    return '';
};

const buildManualPriceClassificationCompat = (priceUtils, itemCategory) => {
    if (priceUtils && typeof priceUtils.buildManualPriceClassification === 'function') {
        return priceUtils.buildManualPriceClassification(itemCategory, ITEM_DISPLAY_NAMES);
    }
    return null;
};

const resetPriceCheckViewsCompat = (priceUtils) => {
    if (priceUtils && typeof priceUtils.resetPriceCheckViews === 'function') {
        priceUtils.resetPriceCheckViews(document);
    }
};

const runCancelPriceCheckFlowCompat = (priceUtils) => {
    if (priceUtils && typeof priceUtils.resolveCancelPriceCheckFlow === 'function') {
        return priceUtils.resolveCancelPriceCheckFlow(
            () => getPriceChecker(),
            () => resetPriceCheckViewsCompat(priceUtils)
        );
    }
    return false;
};

const startAnalysisProgressTickerCompat = (priceUtils, progressBar) => {
    if (priceUtils && typeof priceUtils.startAnalysisProgressTicker === 'function') {
        return priceUtils.startAnalysisProgressTicker(progressBar, 200);
    }
    return null;
};

const stopAnalysisProgressTickerCompat = (priceUtils, progressInterval, progressBar, doneWidth) => {
    if (priceUtils && typeof priceUtils.stopAnalysisProgressTicker === 'function') {
        priceUtils.stopAnalysisProgressTicker(progressInterval, progressBar, doneWidth);
    }
};

const createCaptureAnalysisContextCompat = (priceUtils) => {
    const uiRefs = resolvePriceCheckAnalyzingUiRefsCompat(priceUtils, {
        hideCamera: true,
        showAnalyzing: true
    });

    const progressBar = uiRefs?.progressBar || document.getElementById('analysis-progress');
    const statusEl = uiRefs?.statusEl || document.getElementById('analysis-status');
    const setCaptureAnalysisStep = createPriceCheckAnalysisStepUpdaterCompat(priceUtils, statusEl, progressBar);
    const hideCaptureAnalyzingView = () => {
        hidePriceCheckAnalyzingCompat(priceUtils);
    };

    const progressInterval = startAnalysisProgressTickerCompat(priceUtils, progressBar);

    return {
        progressBar,
        setCaptureAnalysisStep,
        hideCaptureAnalyzingView,
        progressInterval
    };
};

const resolveManualPriceInputCategoryCompat = (priceUtils) => {
    if (priceUtils && typeof priceUtils.resolveManualPriceInputCategory === 'function') {
        return priceUtils.resolveManualPriceInputCategory(document, showToast);
    }
    return null;
};

const showManualPriceInputViewCompat = (priceUtils, classification) => {
    if (priceUtils && typeof priceUtils.showManualPriceInputView === 'function') {
        return priceUtils.showManualPriceInputView(
            document,
            classification,
            (payload) => showPriceInputView(payload)
        );
    }
    return false;
};

const resolvePriceInputViewContextCompat = (priceUtils, classification) => {
    if (priceUtils && typeof priceUtils.resolvePriceInputViewContext === 'function') {
        return priceUtils.resolvePriceInputViewContext(document, classification, MOCK_PRICE_DATABASE);
    }
    return null;
};

const renderPriceInputViewCompat = (priceUtils, classification, context) => {
    if (priceUtils && typeof priceUtils.renderPriceInputView === 'function') {
        return priceUtils.renderPriceInputView(
            context,
            classification,
            (topItem, alternatives) => buildDetectedItemDisplayCompat(priceUtils, topItem, alternatives),
            (priceData) => buildQuickPriceButtonsCompat(priceUtils, priceData)
        );
    }
    return false;
};

const runCaptureAnalysisPipelineCompat = async (
    priceUtils,
    checker,
    videoEl,
    setCaptureAnalysisStep,
    hideCaptureAnalyzingView,
    progressInterval,
    progressBar
) => {
    if (priceUtils && typeof priceUtils.resolveCaptureAnalysisPipeline === 'function') {
        return await priceUtils.resolveCaptureAnalysisPipeline(
            checker,
            videoEl,
            setCaptureAnalysisStep,
            hideCaptureAnalyzingView,
            stopAnalysisProgressTickerCompat,
            progressInterval,
            progressBar,
            _sleep,
            (classification) => showPriceInputView(classification)
        );
    }
    return null;
};

const handleCaptureAnalysisErrorCompat = (priceUtils, error, progressInterval, progressBar) => {
    if (priceUtils && typeof priceUtils.handleCaptureAnalysisError === 'function') {
        return priceUtils.handleCaptureAnalysisError(
            error,
            stopAnalysisProgressTickerCompat,
            progressInterval,
            progressBar,
            window.cancelPriceCheck,
            showToast
        );
    }
    return false;
};

const runCaptureForPriceCheckFlowCompat = async (priceUtils, checker, videoEl) => {
    if (priceUtils && typeof priceUtils.resolveCaptureForPriceCheckFlow === 'function') {
        return await priceUtils.resolveCaptureForPriceCheckFlow(
            checker,
            videoEl,
            () => createCaptureAnalysisContextCompat(priceUtils),
            (
                payloadChecker,
                payloadVideoEl,
                setCaptureAnalysisStep,
                hideCaptureAnalyzingView,
                progressInterval,
                progressBar
            ) => runCaptureAnalysisPipelineCompat(
                priceUtils,
                payloadChecker,
                payloadVideoEl,
                setCaptureAnalysisStep,
                hideCaptureAnalyzingView,
                progressInterval,
                progressBar
            ),
            (error, progressInterval, progressBar) =>
                handleCaptureAnalysisErrorCompat(priceUtils, error, progressInterval, progressBar)
        );
    }
    return false;
};

const runShowManualPriceInputFlowCompat = (priceUtils, checker) => {
    if (priceUtils && typeof priceUtils.resolveShowManualPriceInputFlow === 'function') {
        return priceUtils.resolveShowManualPriceInputFlow(
            checker,
            () => resolveManualPriceInputCategoryCompat(priceUtils),
            (payloadChecker) => ensurePriceCheckScanQuotaCompat(priceUtils, payloadChecker, 'souk_scanner_manual'),
            (itemCategory) => buildManualPriceClassificationCompat(priceUtils, itemCategory),
            (classification) => showManualPriceInputViewCompat(priceUtils, classification)
        );
    }
    return false;
};

const resolveAnalyzeItemCategoryCompat = (inputView, checker) => {
    const priceUtils = window.ALIDADE_PRICE_UTILS;
    if (priceUtils && typeof priceUtils.resolveAnalyzeItemCategory === 'function') {
        return priceUtils.resolveAnalyzeItemCategory(inputView, checker, console);
    }
    return null;
};

const validateAnalyzeInputsCompat = (vendorPrice, checker, itemCategory) => {
    const priceUtils = window.ALIDADE_PRICE_UTILS;
    if (priceUtils && typeof priceUtils.validateAnalyzeInputs === 'function') {
        return priceUtils.validateAnalyzeInputs(vendorPrice, checker, itemCategory, showToast);
    }
    return false;
};

const createAnalyzeLoadingHideCompat = (priceUtils) => {
    if (priceUtils && typeof priceUtils.createAnalyzeLoadingHide === 'function') {
        return priceUtils.createAnalyzeLoadingHide(
            document,
            hidePriceCheckAnalyzingCompat,
            priceUtils
        );
    }
    return () => {};
};

const resolveAnalyzeVendorPriceCompat = (priceUtils) => {
    if (priceUtils && typeof priceUtils.resolveAnalyzeVendorPrice === 'function') {
        return priceUtils.resolveAnalyzeVendorPrice(document);
    }
    return null;
};

const logAnalyzePriceDebugCompat = (priceUtils, checker) => {
    if (priceUtils && typeof priceUtils.logAnalyzePriceDebug === 'function') {
        return priceUtils.logAnalyzePriceDebug(checker, console);
    }
    return false;
};

const createAnalyzeLoadingContextCompat = (priceUtils, inputView) => {
    if (priceUtils && typeof priceUtils.createAnalyzeLoadingContext === 'function') {
        return priceUtils.createAnalyzeLoadingContext(
            inputView,
            priceUtils,
            resolvePriceCheckAnalyzingUiRefsCompat,
            createPriceCheckAnalysisStepUpdaterCompat,
            createAnalyzeLoadingHideCompat
        );
    }
    return {
        setAnalyzeStep: () => {},
        hideAnalyzeLoadingView: () => {}
    };
};

const handleAnalyzePriceErrorCompat = (error, inputView, hideAnalyzeLoadingView) => {
    const priceUtils = window.ALIDADE_PRICE_UTILS;
    if (priceUtils && typeof priceUtils.handleAnalyzePriceError === 'function') {
        priceUtils.handleAnalyzePriceError(error, inputView, hideAnalyzeLoadingView, showToast, console);
        return;
    }
};

const runAnalyzePricePipelineCompat = async (
    priceUtils,
    checker,
    itemCategory,
    vendorPrice,
    setAnalyzeStep,
    hideAnalyzeLoadingView
) => {
    if (priceUtils && typeof priceUtils.resolveAnalyzePricePipeline === 'function') {
        return await priceUtils.resolveAnalyzePricePipeline(
            checker,
            itemCategory,
            vendorPrice,
            setAnalyzeStep,
            hideAnalyzeLoadingView,
            _sleep,
            (payload) => showResultsView(payload)
        );
    }
    return null;
};

const buildLegacyManualSelectionResultCompat = (priceUtils, itemId, itemName) => {
    if (priceUtils && typeof priceUtils.resolveLegacyManualSelectionResult === 'function') {
        return priceUtils.resolveLegacyManualSelectionResult(itemId, itemName);
    }
    return null;
};

const buildCategorySelectionResultCompat = (priceUtils, itemId, itemName, fairPrice, askingPrice) => {
    if (priceUtils && typeof priceUtils.resolveManualCategorySelectionResult === 'function') {
        return priceUtils.resolveManualCategorySelectionResult(itemId, itemName, fairPrice, askingPrice);
    }
    return null;
};

const resolvePriceCheckResultsRenderContextCompat = (priceUtils, result) => {
    if (priceUtils && typeof priceUtils.resolvePriceCheckResultsRenderContext === 'function') {
        return priceUtils.resolvePriceCheckResultsRenderContext(document, result, console);
    }
    return null;
};

const resolvePriceCheckLevelColorsCompat = (priceUtils) => {
    if (priceUtils && typeof priceUtils.resolvePriceCheckLevelColors === 'function') {
        return priceUtils.resolvePriceCheckLevelColors();
    }
    return null;
};

const resolvePriceCheckColorClassCompat = (priceUtils, levelColors, level) => {
    if (priceUtils && typeof priceUtils.resolvePriceCheckColorClass === 'function') {
        return priceUtils.resolvePriceCheckColorClass(levelColors, level);
    }
    return '';
};

const buildPriceCheckResultHtmlCompat = (priceUtils, result, analysis, details, colorClass) => {
    if (priceUtils && typeof priceUtils.resolvePriceCheckResultHtml === 'function') {
        return priceUtils.resolvePriceCheckResultHtml(result, analysis, details, colorClass);
    }
    return '';
};

const resolvePriceCheckSavedCompat = (priceUtils, details) => {
    if (priceUtils && typeof priceUtils.resolvePriceCheckSaved === 'function') {
        return priceUtils.resolvePriceCheckSaved(details);
    }
    return 0;
};

const recordPriceCheckContextCompat = (priceUtils, result, details, analysis, saved) => {
    if (!window.contextEngine?.recordPriceCheck) {
        return;
    }
    if (priceUtils && typeof priceUtils.resolvePriceCheckContextRecordPayload === 'function') {
        const payload = priceUtils.resolvePriceCheckContextRecordPayload(
            result,
            details,
            analysis,
            window.contextEngine.context?.currentArea
        );
        if (payload) {
            window.contextEngine.recordPriceCheck(payload);
        }
    }
};

const recordPriceCheckSessionCompat = (priceUtils, result, details, analysis, saved) => {
    if (!window.sessionIntel?.logActivity) {
        return;
    }
    if (priceUtils && typeof priceUtils.resolvePriceCheckSessionPayload === 'function') {
        const payload = priceUtils.resolvePriceCheckSessionPayload(result, details, analysis);
        if (payload) {
            window.sessionIntel.logActivity('price_check', payload);
        }
    }
};

const runPriceCheckPostRenderCompat = (priceUtils, result, details, analysis) => {
    if (priceUtils && typeof priceUtils.runPriceCheckPostRender === 'function') {
        return priceUtils.runPriceCheckPostRender(
            result,
            details,
            analysis,
            (payloadDetails) => resolvePriceCheckSavedCompat(priceUtils, payloadDetails),
            (payloadResult, payloadDetails, payloadAnalysis, saved) =>
                recordPriceCheckContextCompat(priceUtils, payloadResult, payloadDetails, payloadAnalysis, saved),
            (payloadResult, payloadDetails, payloadAnalysis, saved) =>
                recordPriceCheckSessionCompat(priceUtils, payloadResult, payloadDetails, payloadAnalysis, saved)
        );
    }
    return false;
};

const resolvePriceCheckHistoryCompat = (priceUtils) => {
    if (priceUtils && typeof priceUtils.resolvePriceCheckHistory === 'function') {
        return priceUtils.resolvePriceCheckHistory(localStorage);
    }
    return [];
};

const resolvePriceCheckHistoryEntryCompat = (priceUtils, classification, isoTimestamp) => {
    if (priceUtils && typeof priceUtils.resolvePriceCheckHistoryEntry === 'function') {
        return priceUtils.resolvePriceCheckHistoryEntry(classification, isoTimestamp);
    }
    return null;
};

const persistPriceCheckHistoryCompat = (priceUtils, history, maxEntries) => {
    if (priceUtils && typeof priceUtils.resolvePersistPriceCheckHistory === 'function') {
        priceUtils.resolvePersistPriceCheckHistory(localStorage, history, maxEntries);
    }
};

const runSavePriceCheckHistoryCompat = (priceUtils, checker) => {
    if (priceUtils && typeof priceUtils.runSavePriceCheckHistory === 'function') {
        return priceUtils.runSavePriceCheckHistory(
            checker,
            () => resolvePriceCheckHistoryCompat(priceUtils),
            (classification, isoTimestamp) => resolvePriceCheckHistoryEntryCompat(priceUtils, classification, isoTimestamp),
            (history, maxEntries) => persistPriceCheckHistoryCompat(priceUtils, history, maxEntries),
            showToast
        );
    }
    return false;
};

const runSavePriceCheckResultFlowCompat = (priceUtils) => {
    if (priceUtils && typeof priceUtils.resolveSavePriceCheckResultFlow === 'function') {
        return priceUtils.resolveSavePriceCheckResultFlow(
            () => getPriceChecker(),
            (checker) => runSavePriceCheckHistoryCompat(priceUtils, checker),
            showToast,
            console
        );
    }
    return false;
};

const resolveUploadDeepClassificationCompat = (priceUtils, deepResult) => {
    if (priceUtils && typeof priceUtils.resolveUploadDeepClassification === 'function') {
        return priceUtils.resolveUploadDeepClassification(deepResult, ITEM_DISPLAY_NAMES);
    }
    return null;
};

const notifyUploadFallbackErrorCompat = (priceUtils, message) => {
    if (priceUtils && typeof priceUtils.notifyUploadFallbackError === 'function') {
        priceUtils.notifyUploadFallbackError(showToast, message);
    }
};

const resetUploadInputValueCompat = (priceUtils, eventObj) => {
    if (priceUtils && typeof priceUtils.resetUploadInputValue === 'function') {
        priceUtils.resetUploadInputValue(eventObj);
    }
};

const runUploadDeepAnalysisCompat = async (priceUtils, imageBase64, setUploadAnalysisStep) => {
    if (priceUtils && typeof priceUtils.resolveUploadDeepAnalysisFlow === 'function') {
        return await priceUtils.resolveUploadDeepAnalysisFlow(
            imageBase64,
            setUploadAnalysisStep,
            DeepImageAnalyzer,
            VisionAPIClient,
            calculateHybridPrice,
            (deepResult, itemDisplayNames) => resolveUploadDeepClassificationCompat(priceUtils, deepResult, itemDisplayNames),
            ITEM_DISPLAY_NAMES,
            _sleep,
            console
        );
    }
    return null;
};

const runUploadStandardClassificationCompat = async (checker, imageBase64, file, setUploadAnalysisStep) => {
    const priceUtils = window.ALIDADE_PRICE_UTILS;
    if (priceUtils && typeof priceUtils.resolveUploadStandardClassificationFlow === 'function') {
        return await priceUtils.resolveUploadStandardClassificationFlow(
            checker,
            imageBase64,
            file,
            setUploadAnalysisStep
        );
    }
    return null;
};

const resolveUploadPipelineClassificationCompat = async (
    priceUtils,
    checker,
    imageBase64,
    file,
    setUploadAnalysisStep,
    hideUploadAnalyzingView
) => {
    if (priceUtils && typeof priceUtils.resolveUploadPipelineClassification === 'function') {
        return await priceUtils.resolveUploadPipelineClassification(
            checker,
            imageBase64,
            file,
            setUploadAnalysisStep,
            hideUploadAnalyzingView,
            runUploadDeepAnalysisCompat,
            runUploadStandardClassificationCompat,
            resolveUploadManualSelectionCompat
        );
    }
    return null;
};

const resolveUploadLowConfidenceClassificationCompat = async (
    priceUtils,
    classification,
    imageBase64,
    hideUploadAnalyzingView
) => {
    if (priceUtils && typeof priceUtils.resolveUploadLowConfidenceFlow === 'function') {
        return await priceUtils.resolveUploadLowConfidenceFlow(
            classification,
            imageBase64,
            hideUploadAnalyzingView,
            CONFIG.CONFIDENCE_THRESHOLD,
            resolveUploadManualSelectionCompat,
            priceUtils,
            console
        );
    }
    return classification;
};

const resolveUploadUnhandledErrorCompat = async (
    priceUtils,
    checker,
    file,
    hideUploadAnalyzingView,
    error
) => {
    if (priceUtils && typeof priceUtils.resolveUploadUnhandledError === 'function') {
        return await priceUtils.resolveUploadUnhandledError(
            checker,
            file,
            error,
            hideUploadAnalyzingView,
            fileToBase64,
            (imageBase64) => showManualCategorySelector(imageBase64),
            (manualResult) => resolveUploadManualFallbackCompat(priceUtils, checker, manualResult),
            () => showUploadInitialCompat(priceUtils),
            (message) => notifyUploadFallbackErrorCompat(priceUtils, message)
        );
    }
    return false;
};

const createQuickCaptureContextCompat = (priceUtils) => {
    if (priceUtils && typeof priceUtils.createQuickCaptureContext === 'function') {
        return priceUtils.createQuickCaptureContext(
            document,
            priceUtils,
            resolvePriceCheckAnalyzingUiRefsCompat,
            createPriceCheckAnalysisStepUpdaterCompat,
            hidePriceCheckAnalyzingCompat
        );
    }
    return null;
};

const resolveQuickCaptureStartContextCompat = (priceUtils, checker) => {
    if (priceUtils && typeof priceUtils.resolveQuickCaptureStartContext === 'function') {
        return priceUtils.resolveQuickCaptureStartContext(
            document,
            checker,
            (payloadChecker, source) => ensurePriceCheckScanQuotaCompat(priceUtils, payloadChecker, source)
        );
    }
    return null;
};

const runQuickCaptureDeepPipelineCompat = async (priceUtils, checker, setQuickAnalysisStep) => {
    if (priceUtils && typeof priceUtils.resolveQuickCaptureDeepPipeline === 'function') {
        return await priceUtils.resolveQuickCaptureDeepPipeline(
            checker,
            setQuickAnalysisStep,
            resolveQuickCaptureImageBase64Compat,
            DeepImageAnalyzer,
            VisionAPIClient,
            calculateHybridPrice,
            _sleep,
            priceUtils
        );
    }
    return null;
};

const resolveQuickCaptureImageBase64Compat = async (priceUtils, checker) => {
    if (priceUtils && typeof priceUtils.resolveQuickCaptureImageBase64 === 'function') {
        return await priceUtils.resolveQuickCaptureImageBase64(checker, _blobToBase64, document);
    }
    return null;
};

const handleQuickCaptureErrorCompat = (error, hideQuickAnalyzingView, initialView) => {
    const priceUtils = window.ALIDADE_PRICE_UTILS;
    if (priceUtils && typeof priceUtils.resolveQuickCaptureError === 'function') {
        return priceUtils.resolveQuickCaptureError(
            error,
            hideQuickAnalyzingView,
            initialView,
            showToast,
            console
        );
    }
    return false;
};

const resolveUploadStartContextCompat = (priceUtils, eventObj) => {
    if (priceUtils && typeof priceUtils.resolveUploadStartContext === 'function') {
        return priceUtils.resolveUploadStartContext(
            eventObj,
            getPriceChecker,
            (checker, source) => ensurePriceCheckScanQuotaCompat(priceUtils, checker, source),
            console
        );
    }
    return null;
};

const createUploadAnalyzingContextCompat = (priceUtils) => {
    if (priceUtils && typeof priceUtils.createUploadAnalyzingContext === 'function') {
        return priceUtils.createUploadAnalyzingContext(
            document,
            priceUtils,
            resolvePriceCheckAnalyzingUiRefsCompat,
            createPriceCheckAnalysisStepUpdaterCompat,
            hidePriceCheckAnalyzingCompat
        );
    }
    return null;
};

const resolveUploadImageBase64Compat = async (priceUtils, checker, file) => {
    if (priceUtils && typeof priceUtils.resolveUploadImageBase64 === 'function') {
        return await priceUtils.resolveUploadImageBase64(checker, file, fileToBase64);
    }
    return null;
};

const runHandleTestImageUploadFlowCompat = async (priceUtils, event) => {
    if (priceUtils && typeof priceUtils.resolveHandleTestImageUploadFlow === 'function') {
        return await priceUtils.resolveHandleTestImageUploadFlow(
            event,
            (eventObj) => resolveUploadStartContextCompat(priceUtils, eventObj),
            () => createUploadAnalyzingContextCompat(priceUtils),
            () => _sleep(300),
            (checker, file) => resolveUploadImageBase64Compat(priceUtils, checker, file),
            (checker, imageBase64, file, setUploadAnalysisStep, hideUploadAnalyzingView) =>
                resolveUploadPipelineClassificationCompat(
                    priceUtils,
                    checker,
                    imageBase64,
                    file,
                    setUploadAnalysisStep,
                    hideUploadAnalyzingView
                ),
            (classification, imageBase64, hideUploadAnalyzingView) =>
                resolveUploadLowConfidenceClassificationCompat(
                    priceUtils,
                    classification,
                    imageBase64,
                    hideUploadAnalyzingView
                ),
            (classification) => resolveUploadClassificationResultCompat(priceUtils, classification),
            (checker, file, hideUploadAnalyzingView, error) =>
                resolveUploadUnhandledErrorCompat(priceUtils, checker, file, hideUploadAnalyzingView, error),
            (eventObj) => resetUploadInputValueCompat(priceUtils, eventObj),
            console
        );
    }
    return false;
};

// Handle test image upload — now with DEEP ANALYSIS
window.handleTestImageUpload = async function (event) {
    const priceUtils = window.ALIDADE_PRICE_UTILS;
    await runHandleTestImageUploadFlowCompat(priceUtils, event);
};

// Helper function to convert file to base64
function fileToBase64(file) {
    const priceUtils = window.ALIDADE_PRICE_UTILS;
    if (priceUtils && typeof priceUtils.fileToBase64 === 'function') {
        return priceUtils.fileToBase64(file);
    }
    return Promise.resolve(null);
}


// ---------------------------------------------------------------
// MANUAL CATEGORY SELECTOR
// ---------------------------------------------------------------

async function showManualCategorySelector(imageBase64) {
    return new Promise((resolve) => {
        const priceUtils = window.ALIDADE_PRICE_UTILS;
        const categories = resolveLegacyManualSelectorCategoriesCompat(priceUtils);
        const modalHTML = buildLegacyManualSelectorModalCompat(priceUtils, categories, imageBase64);
        openLegacyManualSelectorModalCompat(priceUtils, modalHTML, resolve);
    });
}

window.selectManualCategory = function (itemId, itemName) {
    const priceUtils = window.ALIDADE_PRICE_UTILS;
    priceRuntimeDebugLog('[MANUAL] ? Category selected:', itemId);

    const selectionResult = buildLegacyManualSelectionResultCompat(priceUtils, itemId, itemName);

    resolveLegacyManualSelectionFinalizeCompat(priceUtils, selectionResult);
};

window.closeManualSelector = function (result) {
    const priceUtils = window.ALIDADE_PRICE_UTILS;
    resolveLegacyManualSelectionFinalizeCompat(priceUtils, result);
    // Preserve legacy window assignment occurrence for contract parity.
    if (window._manualCategoryResolve == null) {
        window._manualCategoryResolve = null;
    }
};

const runLegacyDeepResultsViewRenderCompat = (priceUtils, classification) => {
    if (priceUtils && typeof priceUtils.resolveLegacyDeepResultsRenderFlow === 'function') {
        return priceUtils.resolveLegacyDeepResultsRenderFlow(
            classification,
            () => resolveLegacyDeepResultsContainerCompat(priceUtils),
            (qualityMultiplier) => resolveLegacyDeepQualityThemeCompat(priceUtils, qualityMultiplier),
            () => createLegacyDeepScoreBarCompat(priceUtils),
            (authenticity) => resolveLegacyDeepRedFlagsHtmlCompat(priceUtils, authenticity),
            (isHandmade) => resolveLegacyDeepAuthBadgeHtmlCompat(priceUtils, isHandmade),
            (smartPrice, qualityMultiplier) => resolveLegacyDeepQuickPricingContentCompat(priceUtils, smartPrice, qualityMultiplier),
            (reasoning) => resolveLegacyDeepReasoningHtmlCompat(priceUtils, reasoning),
            (payload) => buildLegacyDeepResultsViewHtmlCompat(priceUtils, payload)
        );
    }
    return false;
};


// ---------------------------------------------------------------
// DEEP RESULTS VIEW — Rich Quality Assessment Display
// ---------------------------------------------------------------

function showDeepResultsView(classification) {
    const priceUtils = window.ALIDADE_PRICE_UTILS;
    runLegacyDeepResultsViewRenderCompat(priceUtils, classification);
}

// Handle vendor price check from deep results view
window.analyzeDeepPrice = async function () {
    const priceUtils = window.ALIDADE_PRICE_UTILS;
    await runAnalyzeDeepActionCompat(priceUtils);
};

// ---------------------------------------------------------------
// CATEGORY SELECTOR CALLBACKS
// ---------------------------------------------------------------

// Global callback when user selects category
window.selectCategory = function (itemId, itemName, fairPrice, askingPrice) {
    const priceUtils = window.ALIDADE_PRICE_UTILS;
    priceRuntimeDebugLog('[MANUAL_SELECT] User selected:', itemId);

    const selectionResult = buildCategorySelectionResultCompat(priceUtils, itemId, itemName, fairPrice, askingPrice);

    resolveCategorySelectorFinalizeCompat(priceUtils, selectionResult);
};

// Global callback for cancel
window.closeCategorySelector = function (result) {
    const priceUtils = window.ALIDADE_PRICE_UTILS;
    priceRuntimeDebugLog('[MANUAL_SELECT] User cancelled selection');

    resolveCategorySelectorFinalizeCompat(priceUtils, result);
    // Preserve legacy window assignment occurrence for contract parity.
    if (window._categoryResolve == null) {
        window._categoryResolve = null;
    }
};


window.cancelPriceCheck = function () {
    const priceUtils = window.ALIDADE_PRICE_UTILS;
    runCancelPriceCheckFlowCompat(priceUtils);
};

window.captureForPriceCheck = async function () {
    const priceUtils = window.ALIDADE_PRICE_UTILS;
    const checker = getPriceChecker();
    const videoEl = document.getElementById('price-check-video');
    await runCaptureForPriceCheckFlowCompat(priceUtils, checker, videoEl);
};

function showPriceInputView(classification) {
    const priceUtils = window.ALIDADE_PRICE_UTILS;
    const context = resolvePriceInputViewContextCompat(priceUtils, classification);
    renderPriceInputViewCompat(priceUtils, classification, context);
}

window.showManualPriceInput = function () {
    const priceUtils = window.ALIDADE_PRICE_UTILS;
    const checker = getPriceChecker();
    runShowManualPriceInputFlowCompat(priceUtils, checker);
};

const runAnalyzePriceNowFlowCompat = async (priceUtils) => {
    if (priceUtils && typeof priceUtils.resolveAnalyzePriceNowFlow === 'function') {
        return await priceUtils.resolveAnalyzePriceNowFlow(
            () => getPriceChecker(),
            (checker) => logAnalyzePriceDebugCompat(priceUtils, checker),
            () => document.getElementById('price-check-input'),
            () => resolveAnalyzeVendorPriceCompat(priceUtils),
            (inputView, checker) => resolveAnalyzeItemCategoryCompat(inputView, checker),
            (vendorPrice, checker, itemCategory) => validateAnalyzeInputsCompat(vendorPrice, checker, itemCategory),
            (inputView) => createAnalyzeLoadingContextCompat(priceUtils, inputView),
            (checker, itemCategory, vendorPrice, setAnalyzeStep, hideAnalyzeLoadingView) =>
                runAnalyzePricePipelineCompat(
                    priceUtils,
                    checker,
                    itemCategory,
                    vendorPrice,
                    setAnalyzeStep,
                    hideAnalyzeLoadingView
                ),
            () => createAnalyzeLoadingHideCompat(priceUtils),
            (error, inputView, hideAnalyzeLoadingView) =>
                handleAnalyzePriceErrorCompat(error, inputView, hideAnalyzeLoadingView)
        );
    }
    return false;
};

window.analyzePriceNow = async function () {
    const priceUtils = window.ALIDADE_PRICE_UTILS;
    await runAnalyzePriceNowFlowCompat(priceUtils);
};

const runShowResultsViewFlowCompat = (priceUtils, result) => {
    if (priceUtils && typeof priceUtils.resolveShowResultsViewFlow === 'function') {
        return priceUtils.resolveShowResultsViewFlow(
            result,
            (payloadResult) => resolvePriceCheckResultsRenderContextCompat(priceUtils, payloadResult),
            () => resolvePriceCheckLevelColorsCompat(priceUtils),
            (levelColors, level) => resolvePriceCheckColorClassCompat(priceUtils, levelColors, level),
            (payloadResult, analysis, details, colorClass) =>
                buildPriceCheckResultHtmlCompat(priceUtils, payloadResult, analysis, details, colorClass),
            (payloadResult, details, analysis) => runPriceCheckPostRenderCompat(priceUtils, payloadResult, details, analysis)
        );
    }
    return false;
};

function showResultsView(result) {
    const priceUtils = window.ALIDADE_PRICE_UTILS;
    runShowResultsViewFlowCompat(priceUtils, result);
}

window.savePriceCheckResult = function () {
    const priceUtils = window.ALIDADE_PRICE_UTILS;
    runSavePriceCheckResultFlowCompat(priceUtils);
};


// ---------------------------------------------------------------
// QUICK SCAN: One-Shot Deep Analysis Flow
// Snap ? Zone Extract ? AI Analysis ? Hybrid Price ? Results
// ---------------------------------------------------------------

/**
 * Handle the "Quick Scan" capture button
 * Full pipeline: Camera snap ? DeepImageAnalyzer ? Gemini Deep ? Hybrid Price
 */
const runQuickCaptureFlowCompat = async (priceUtils, checker) => {
    if (priceUtils && typeof priceUtils.resolveQuickCaptureFlow === 'function') {
        return await priceUtils.resolveQuickCaptureFlow(
            checker,
            (payloadChecker) => resolveQuickCaptureStartContextCompat(priceUtils, payloadChecker),
            () => createQuickCaptureContextCompat(priceUtils),
            (payloadChecker, setQuickAnalysisStep) =>
                runQuickCaptureDeepPipelineCompat(priceUtils, payloadChecker, setQuickAnalysisStep),
            (hideQuickAnalyzingView, deepAnalysis, hybridPrice) => {
                hideQuickAnalyzingView();
                showDeepResults(deepAnalysis, hybridPrice);
            },
            (error, hideQuickAnalyzingView, initialView) =>
                handleQuickCaptureErrorCompat(error, hideQuickAnalyzingView, initialView)
        );
    }
    return false;
};

window.handleQuickCapture = async function () {
    const priceUtils = window.ALIDADE_PRICE_UTILS;
    const checker = getPriceChecker();
    await runQuickCaptureFlowCompat(priceUtils, checker);
};

/** Helper: blob to base64 data URL */
function _blobToBase64(blob) {
    const priceUtils = window.ALIDADE_PRICE_UTILS;
    if (priceUtils && typeof priceUtils.blobToBase64 === 'function') {
        return priceUtils.blobToBase64(blob);
    }
    return Promise.resolve(null);
}

/** Helper: promisified sleep */
function _sleep(ms) {
    const priceUtils = window.ALIDADE_PRICE_UTILS;
    if (priceUtils && typeof priceUtils.sleep === 'function') {
        return priceUtils.sleep(ms);
    }
    return Promise.resolve();
}


// ---------------------------------------------------------------
// UI: Deep Results View (Enhanced with quality scores)
// ---------------------------------------------------------------

function showDeepResults(deepAnalysis, hybridPrice) {
    const priceUtils = window.ALIDADE_PRICE_UTILS;
    runDeepResultsRenderCompat(priceUtils, deepAnalysis, hybridPrice);
}


// ---------------------------------------------------------------
// UI: Contribution Prompt (Waze-style Crowdsource)
// ---------------------------------------------------------------

const showDeepContributionPrompt = function () {
    const priceUtils = window.ALIDADE_PRICE_UTILS;
    runShowContributionPromptCompat(priceUtils);
};

window.showContributionPrompt = showDeepContributionPrompt;

window.cancelContribution = function () {
    window.cancelPriceCheck();
};

window.submitCrowdPrice = async function () {
    const priceUtils = window.ALIDADE_PRICE_UTILS;
    await runSubmitCrowdPriceFlowCompat(priceUtils);
};


// ---------------------------------------------------------------
// EXPOSE GLOBALLY
// ---------------------------------------------------------------

window.renderPriceChecker = renderPriceChecker;
window.PriceChecker = PriceChecker;
window.PhotoCapture = PhotoCapture;
window.ImageProcessor = ImageProcessor;
window.ItemClassifier = ItemClassifier;
window.PriceDatabase = PriceDatabase;
window.ScamDetector = ScamDetector;
window.CrowdPriceDB = CrowdPriceDB;
window.DeepImageAnalyzer = DeepImageAnalyzer;
window.detectSoukArea = detectSoukArea;
window.calculateHybridPrice = calculateHybridPrice;
window.analyzeSingleShotDeep = analyzeSingleShotDeep;
window.ITEM_DISPLAY_NAMES = ITEM_DISPLAY_NAMES;

priceRuntimeDebugLog('[ALIDADE] Price Verification System Initialized (Simulation Mode:', CONFIG.SIMULATION_MODE, ')');


