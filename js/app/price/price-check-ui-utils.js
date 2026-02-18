/**
 * ALIDADE Price Check UI Utilities
 * Extracted from legacy app.js with compatibility hooks.
 */
(function bootstrapPriceCheckUiUtils(windowObj) {
    if (!windowObj) return;

    const priceUtils = windowObj.ALIDADE_PRICE_UTILS || (windowObj.ALIDADE_PRICE_UTILS = {});

    if (typeof priceUtils.buildDetectedItemDisplayHtml !== 'function') {
        priceUtils.buildDetectedItemDisplayHtml = function buildDetectedItemDisplayHtml(topItem, alternatives) {
            return `
            <div class="text-4xl mb-2">${topItem.displayName.split(' ')[0]}</div>
            <div class="text-lg font-semibold text-white">${topItem.displayName}</div>
            <div class="text-sm text-zinc-400">
                Confidence: ${Math.round(topItem.confidence * 100)}%
                ${alternatives.length > 0 ?
                    `<span class="text-zinc-500"> • Also could be: ${alternatives[0].displayName}</span>` : ''}
            </div>
        `;
        };
    }

    if (typeof priceUtils.buildQuickPriceButtonsHtml !== 'function') {
        priceUtils.buildQuickPriceButtonsHtml = function buildQuickPriceButtonsHtml(priceData) {
            return `
                <span class="text-xs text-zinc-500 mr-2">Quick:</span>
                ${[priceData.p25, priceData.median, priceData.p75, Math.round(priceData.p75 * 1.5), Math.round(priceData.p75 * 2.5)].map(price =>
                    `<button onclick="document.getElementById('vendor-price-input').value=${price}"
                        class="px-3 py-1 bg-void-700 text-zinc-300 text-sm rounded hover:bg-zinc-600 transition-colors">
                        ${price} DH
                    </button>`
                ).join('')}
            `;
        };
    }

    if (typeof priceUtils.resolvePriceInputViewContext !== 'function') {
        priceUtils.resolvePriceInputViewContext = function resolvePriceInputViewContext(documentObj, classification, mockPriceDatabase) {
            const inputView = documentObj.getElementById('price-check-input');
            const detectedDisplay = documentObj.getElementById('detected-item-display');
            const topItem = classification.topPrediction;
            const priceData = mockPriceDatabase[topItem.label];
            const quickButtons = documentObj.getElementById('quick-price-buttons');
            return {
                inputView,
                detectedDisplay,
                topItem,
                priceData,
                quickButtons
            };
        };
    }

    if (typeof priceUtils.renderPriceInputView !== 'function') {
        priceUtils.renderPriceInputView = function renderPriceInputView(
            context,
            classification,
            buildDetectedItemDisplayFn,
            buildQuickPriceButtonsFn
        ) {
            context.detectedDisplay.innerHTML = typeof buildDetectedItemDisplayFn === 'function'
                ? buildDetectedItemDisplayFn(context.topItem, classification.alternatives)
                : '';
            if (context.priceData) {
                context.quickButtons.innerHTML = typeof buildQuickPriceButtonsFn === 'function'
                    ? buildQuickPriceButtonsFn(context.priceData)
                    : '';
            }
            context.inputView.dataset.selectedItem = context.topItem.label;
            context.inputView.classList.remove('hidden');
        };
    }

    if (typeof priceUtils.getPriceCheckLevelColors !== 'function') {
        priceUtils.getPriceCheckLevelColors = function getPriceCheckLevelColors() {
            return {
                danger: 'bg-red-900/50 border-red-500/50 text-red-200',
                warning: 'bg-amber-900/50 border-signal-amber/50 text-amber-200',
                caution: 'bg-yellow-900/50 border-yellow-500/50 text-yellow-200',
                ok: 'bg-blue-900/50 border-blue-500/50 text-blue-200',
                success: 'bg-green-900/50 border-green-500/50 text-green-200',
                neutral: 'bg-void-800/50 border-zinc-500/50 text-zinc-200'
            };
        };
    }

    if (typeof priceUtils.resolvePriceCheckResultsRenderContext !== 'function') {
        priceUtils.resolvePriceCheckResultsRenderContext = function resolvePriceCheckResultsRenderContext(
            documentObj,
            result,
            consoleObj
        ) {
            const resultsView = documentObj.getElementById('price-check-results');
            if (!resultsView) {
                if (consoleObj && typeof consoleObj.error === 'function') {
                    consoleObj.error('[UI] price-check-results container MISSING');
                }
                return null;
            }
            const legacyDisplay = documentObj.getElementById('price-checker-display');
            resultsView.classList.remove('hidden');
            const analysis = result.analysis;
            const details = analysis.details;
            const priceData = result.priceData.prices;
            return {
                resultsView,
                legacyDisplay,
                analysis,
                details,
                priceData
            };
        };
    }

    if (typeof priceUtils.resolvePriceCheckLevelColors !== 'function') {
        priceUtils.resolvePriceCheckLevelColors = function resolvePriceCheckLevelColors() {
            if (typeof priceUtils.getPriceCheckLevelColors === 'function') {
                return priceUtils.getPriceCheckLevelColors();
            }
            return {
                danger: 'bg-red-900/50 border-red-500/50 text-red-200',
                warning: 'bg-amber-900/50 border-signal-amber/50 text-amber-200',
                caution: 'bg-yellow-900/50 border-yellow-500/50 text-yellow-200',
                ok: 'bg-blue-900/50 border-blue-500/50 text-blue-200',
                success: 'bg-green-900/50 border-green-500/50 text-green-200',
                neutral: 'bg-void-800/50 border-zinc-500/50 text-zinc-200'
            };
        };
    }

    if (typeof priceUtils.resolvePriceCheckColorClass !== 'function') {
        priceUtils.resolvePriceCheckColorClass = function resolvePriceCheckColorClass(levelColors, analysisLevel) {
            return levelColors[analysisLevel] || levelColors.neutral;
        };
    }

    if (typeof priceUtils.buildPriceCheckResultHtml !== 'function') {
        priceUtils.buildPriceCheckResultHtml = function buildPriceCheckResultHtml(result, analysis, details, colorClass) {
            return `
            <!-- Item Header -->
            <div class="bg-void-800/50 rounded-machined p-4 border border-void-700/50">
                <div class="flex items-center gap-3">
                    <div class="text-3xl">${result.item.displayName.split(' ')[0]}</div>
                    <div>
                        <div class="font-semibold text-white">${result.item.displayName}</div>
                        <div class="text-sm text-zinc-400">AI Confidence: ${Math.round((result.priceData.isSimulated ? 87 : analysis.confidence))}%</div>
                    </div>
                </div>
            </div>

            <!-- Verdict Card -->
            <div class="${colorClass} rounded-machined p-5 border">
                <div class="text-2xl font-bold mb-2">${analysis.message}</div>

                <div class="grid grid-cols-2 gap-4 my-4">
                    <div class="text-center p-3 bg-black/20 rounded-machined">
                        <div class="text-xs text-zinc-400 uppercase">Vendor Price</div>
                        <div class="text-2xl font-bold font-mono">${details.vendorPrice} DH</div>
                    </div>
                    <div class="text-center p-3 bg-black/20 rounded-machined">
                        <div class="text-xs text-zinc-400 uppercase">Fair Price</div>
                        <div class="text-2xl font-bold font-mono">${details.fairPrice} DH</div>
                    </div>
                </div>

                <div class="text-sm mb-3">
                    <span class="font-semibold">Markup:</span>
                    ${details.markup >= 0 ? '+' : ''}${details.markup}% ${details.markup > 50 ? '⚠️' : details.markup < -10 ? '🎉' : ''}
                </div>

                <div class="bg-black/20 rounded-machined p-3">
                    <div class="text-xs text-zinc-400 uppercase mb-1">🧠 Recommendation</div>
                    <div class="font-medium">${analysis.recommendation}</div>
                </div>
            </div>

            <div class="mt-4 flex gap-3">
                <button onclick="window.cancelPriceCheck()"
                    class="flex-1 py-3 bg-void-700 text-white rounded-machined hover:bg-zinc-600 transition-all font-bold">
                    DONE
                </button>
            </div>
        `;
        };
    }

    if (typeof priceUtils.resolvePriceCheckResultHtml !== 'function') {
        priceUtils.resolvePriceCheckResultHtml = function resolvePriceCheckResultHtml(result, analysis, details, colorClass) {
            if (typeof priceUtils.buildPriceCheckResultHtml === 'function') {
                return priceUtils.buildPriceCheckResultHtml(result, analysis, details, colorClass);
            }
            return `
            <!-- Item Header -->
            <div class="bg-void-800/50 rounded-machined p-4 border border-void-700/50">
                <div class="flex items-center gap-3">
                    <div class="text-3xl">${result.item.displayName.split(' ')[0]}</div>
                    <div>
                        <div class="font-semibold text-white">${result.item.displayName}</div>
                        <div class="text-sm text-zinc-400">AI Confidence: ${Math.round((result.priceData.isSimulated ? 87 : analysis.confidence))}%</div>
                    </div>
                </div>
            </div>

            <!-- Verdict Card -->
            <div class="${colorClass} rounded-machined p-5 border">
                <div class="text-2xl font-bold mb-2">${analysis.message}</div>

                <div class="grid grid-cols-2 gap-4 my-4">
                    <div class="text-center p-3 bg-black/20 rounded-machined">
                        <div class="text-xs text-zinc-400 uppercase">Vendor Price</div>
                        <div class="text-2xl font-bold font-mono">${details.vendorPrice} DH</div>
                    </div>
                    <div class="text-center p-3 bg-black/20 rounded-machined">
                        <div class="text-xs text-zinc-400 uppercase">Fair Price</div>
                        <div class="text-2xl font-bold font-mono">${details.fairPrice} DH</div>
                    </div>
                </div>

                <div class="text-sm mb-3">
                    <span class="font-semibold">Markup:</span>
                    ${details.markup >= 0 ? '+' : ''}${details.markup}% ${details.markup > 50 ? '⚠️' : details.markup < -10 ? '🎉' : ''}
                </div>

                <div class="bg-black/20 rounded-machined p-3">
                    <div class="text-xs text-zinc-400 uppercase mb-1">🧠 Recommendation</div>
                    <div class="font-medium">${analysis.recommendation}</div>
                </div>
            </div>

            <div class="mt-4 flex gap-3">
                <button onclick="window.cancelPriceCheck()"
                    class="flex-1 py-3 bg-void-700 text-white rounded-machined hover:bg-zinc-600 transition-all font-bold">
                    DONE
                </button>
            </div>
        `;
        };
    }

    if (typeof priceUtils.calculatePriceCheckSaved !== 'function') {
        priceUtils.calculatePriceCheckSaved = function calculatePriceCheckSaved(details) {
            return Math.max(0, (details.vendorPrice || 0) - (details.fairPrice || 0));
        };
    }

    if (typeof priceUtils.resolvePriceCheckSaved !== 'function') {
        priceUtils.resolvePriceCheckSaved = function resolvePriceCheckSaved(details) {
            if (typeof priceUtils.calculatePriceCheckSaved === 'function') {
                return priceUtils.calculatePriceCheckSaved(details);
            }
            return Math.max(0, (details.vendorPrice || 0) - (details.fairPrice || 0));
        };
    }

    if (typeof priceUtils.buildPriceCheckContextRecordPayload !== 'function') {
        priceUtils.buildPriceCheckContextRecordPayload = function buildPriceCheckContextRecordPayload(result, details, analysis, area) {
            return {
                itemType: result.item?.category || 'unknown',
                area: area || 'unknown',
                fairPrice: details.fairPrice,
                vendorPrice: details.vendorPrice,
                verdict: analysis.verdict,
                saved: priceUtils.calculatePriceCheckSaved(details)
            };
        };
    }

    if (typeof priceUtils.resolvePriceCheckContextRecordPayload !== 'function') {
        priceUtils.resolvePriceCheckContextRecordPayload = function resolvePriceCheckContextRecordPayload(result, details, analysis, area) {
            if (typeof priceUtils.buildPriceCheckContextRecordPayload === 'function') {
                return priceUtils.buildPriceCheckContextRecordPayload(result, details, analysis, area);
            }
            return {
                itemType: result.item?.category || 'unknown',
                area: area || 'unknown',
                fairPrice: details.fairPrice,
                vendorPrice: details.vendorPrice,
                verdict: analysis.verdict,
                saved: typeof priceUtils.resolvePriceCheckSaved === 'function'
                    ? priceUtils.resolvePriceCheckSaved(details)
                    : Math.max(0, (details.vendorPrice || 0) - (details.fairPrice || 0))
            };
        };
    }

    if (typeof priceUtils.buildPriceCheckSessionPayload !== 'function') {
        priceUtils.buildPriceCheckSessionPayload = function buildPriceCheckSessionPayload(result, details, analysis) {
            return {
                itemType: result.item?.category || 'unknown',
                fairPrice: details.fairPrice,
                vendorPrice: details.vendorPrice,
                verdict: analysis.verdict,
                saved: priceUtils.calculatePriceCheckSaved(details)
            };
        };
    }

    if (typeof priceUtils.resolvePriceCheckSessionPayload !== 'function') {
        priceUtils.resolvePriceCheckSessionPayload = function resolvePriceCheckSessionPayload(result, details, analysis) {
            if (typeof priceUtils.buildPriceCheckSessionPayload === 'function') {
                return priceUtils.buildPriceCheckSessionPayload(result, details, analysis);
            }
            return {
                itemType: result.item?.category || 'unknown',
                fairPrice: details.fairPrice,
                vendorPrice: details.vendorPrice,
                verdict: analysis.verdict,
                saved: typeof priceUtils.resolvePriceCheckSaved === 'function'
                    ? priceUtils.resolvePriceCheckSaved(details)
                    : Math.max(0, (details.vendorPrice || 0) - (details.fairPrice || 0))
            };
        };
    }

    if (typeof priceUtils.runPriceCheckPostRender !== 'function') {
        priceUtils.runPriceCheckPostRender = function runPriceCheckPostRender(
            result,
            details,
            analysis,
            resolvePriceCheckSavedFn,
            recordPriceCheckContextFn,
            recordPriceCheckSessionFn
        ) {
            const saved = typeof resolvePriceCheckSavedFn === 'function'
                ? resolvePriceCheckSavedFn(details)
                : Math.max(0, (details.vendorPrice || 0) - (details.fairPrice || 0));
            if (typeof recordPriceCheckContextFn === 'function') {
                recordPriceCheckContextFn(result, details, analysis, saved);
            }
            if (typeof recordPriceCheckSessionFn === 'function') {
                recordPriceCheckSessionFn(result, details, analysis, saved);
            }
        };
    }

    if (typeof priceUtils.resolveShowResultsViewFlow !== 'function') {
        priceUtils.resolveShowResultsViewFlow = function resolveShowResultsViewFlow(
            result,
            resolvePriceCheckResultsRenderContextFn,
            resolvePriceCheckLevelColorsFn,
            resolvePriceCheckColorClassFn,
            buildPriceCheckResultHtmlFn,
            runPriceCheckPostRenderFn
        ) {
            const renderCtx = typeof resolvePriceCheckResultsRenderContextFn === 'function'
                ? resolvePriceCheckResultsRenderContextFn(result)
                : null;
            if (!renderCtx) {
                return false;
            }

            const resultsView = renderCtx.resultsView;
            const legacyDisplay = renderCtx.legacyDisplay;
            const analysis = renderCtx.analysis;
            const details = renderCtx.details;
            const levelColors = typeof resolvePriceCheckLevelColorsFn === 'function'
                ? resolvePriceCheckLevelColorsFn()
                : {};
            const colorClass = typeof resolvePriceCheckColorClassFn === 'function'
                ? resolvePriceCheckColorClassFn(levelColors, analysis?.level)
                : '';
            const resultHTML = typeof buildPriceCheckResultHtmlFn === 'function'
                ? buildPriceCheckResultHtmlFn(result, analysis, details, colorClass)
                : '';

            if (resultsView) {
                resultsView.innerHTML = resultHTML;
            }
            if (legacyDisplay) {
                legacyDisplay.innerHTML = resultHTML;
            }

            if (typeof runPriceCheckPostRenderFn === 'function') {
                runPriceCheckPostRenderFn(result, details, analysis);
            }
            return true;
        };
    }

    if (typeof priceUtils.resolveManualPriceInputCategory !== 'function') {
        priceUtils.resolveManualPriceInputCategory = function resolveManualPriceInputCategory(documentObj, showToastFn) {
            const select = documentObj.getElementById('manual-item-select');
            const itemCategory = select?.value;
            if (!itemCategory) {
                if (typeof showToastFn === 'function') {
                    showToastFn('Please select an item type first', 'warning');
                }
                return null;
            }
            return itemCategory;
        };
    }

    if (typeof priceUtils.showManualPriceInputView !== 'function') {
        priceUtils.showManualPriceInputView = function showManualPriceInputView(documentObj, classification, showPriceInputViewFn) {
            documentObj.getElementById('price-check-initial').classList.add('hidden');
            if (typeof showPriceInputViewFn === 'function') {
                showPriceInputViewFn(classification);
            }
        };
    }

    if (typeof priceUtils.buildManualPriceClassification !== 'function') {
        priceUtils.buildManualPriceClassification = function buildManualPriceClassification(itemCategory, itemDisplayNames) {
            return {
                topPrediction: {
                    label: itemCategory,
                    displayName: itemDisplayNames[itemCategory],
                    confidence: 1.0 // Manual selection = 100% confidence
                },
                alternatives: []
            };
        };
    }

    if (typeof priceUtils.resolveShowManualPriceInputFlow !== 'function') {
        priceUtils.resolveShowManualPriceInputFlow = function resolveShowManualPriceInputFlow(
            checker,
            resolveManualPriceInputCategoryFn,
            ensurePriceCheckScanQuotaFn,
            buildManualPriceClassificationFn,
            showManualPriceInputViewFn
        ) {
            const itemCategory = typeof resolveManualPriceInputCategoryFn === 'function'
                ? resolveManualPriceInputCategoryFn()
                : null;
            if (!itemCategory) {
                return false;
            }

            const hasScanQuota = typeof ensurePriceCheckScanQuotaFn === 'function'
                ? ensurePriceCheckScanQuotaFn(checker)
                : true;
            if (!hasScanQuota) {
                return false;
            }

            const mockClassification = typeof buildManualPriceClassificationFn === 'function'
                ? buildManualPriceClassificationFn(itemCategory)
                : null;
            if (typeof showManualPriceInputViewFn === 'function') {
                showManualPriceInputViewFn(mockClassification);
            }
            return true;
        };
    }

    if (typeof priceUtils.loadPriceCheckHistory !== 'function') {
        priceUtils.loadPriceCheckHistory = function loadPriceCheckHistory(localStorageObj) {
            return JSON.parse(localStorageObj.getItem('alidade_price_history') || '[]');
        };
    }

    if (typeof priceUtils.resolvePriceCheckHistory !== 'function') {
        priceUtils.resolvePriceCheckHistory = function resolvePriceCheckHistory(localStorageObj) {
            if (typeof priceUtils.loadPriceCheckHistory === 'function') {
                return priceUtils.loadPriceCheckHistory(localStorageObj);
            }
            return JSON.parse(localStorageObj.getItem('alidade_price_history') || '[]');
        };
    }

    if (typeof priceUtils.buildPriceCheckHistoryEntry !== 'function') {
        priceUtils.buildPriceCheckHistoryEntry = function buildPriceCheckHistoryEntry(classification, isoTimestamp) {
            return {
                timestamp: isoTimestamp,
                item: classification.topPrediction.label,
                displayName: classification.topPrediction.displayName
                // More details could be added
            };
        };
    }

    if (typeof priceUtils.resolvePriceCheckHistoryEntry !== 'function') {
        priceUtils.resolvePriceCheckHistoryEntry = function resolvePriceCheckHistoryEntry(classification, isoTimestamp) {
            if (typeof priceUtils.buildPriceCheckHistoryEntry === 'function') {
                return priceUtils.buildPriceCheckHistoryEntry(classification, isoTimestamp);
            }
            return {
                timestamp: isoTimestamp,
                item: classification.topPrediction.label,
                displayName: classification.topPrediction.displayName
            };
        };
    }

    if (typeof priceUtils.persistPriceCheckHistory !== 'function') {
        priceUtils.persistPriceCheckHistory = function persistPriceCheckHistory(localStorageObj, history, maxEntries) {
            localStorageObj.setItem('alidade_price_history', JSON.stringify(history.slice(0, maxEntries)));
        };
    }

    if (typeof priceUtils.resolvePersistPriceCheckHistory !== 'function') {
        priceUtils.resolvePersistPriceCheckHistory = function resolvePersistPriceCheckHistory(localStorageObj, history, maxEntries) {
            if (typeof priceUtils.persistPriceCheckHistory === 'function') {
                priceUtils.persistPriceCheckHistory(localStorageObj, history, maxEntries);
                return;
            }
            localStorageObj.setItem('alidade_price_history', JSON.stringify(history.slice(0, maxEntries)));
        };
    }

    if (typeof priceUtils.runSavePriceCheckHistory !== 'function') {
        priceUtils.runSavePriceCheckHistory = function runSavePriceCheckHistory(
            checker,
            resolvePriceCheckHistoryFn,
            resolvePriceCheckHistoryEntryFn,
            persistPriceCheckHistoryFn,
            showToastFn
        ) {
            if (!checker?.currentClassification) {
                return false;
            }

            const history = typeof resolvePriceCheckHistoryFn === 'function'
                ? resolvePriceCheckHistoryFn()
                : [];
            const entry = typeof resolvePriceCheckHistoryEntryFn === 'function'
                ? resolvePriceCheckHistoryEntryFn(checker.currentClassification, new Date().toISOString())
                : null;
            if (!entry) {
                return false;
            }
            history.unshift(entry);

            if (typeof persistPriceCheckHistoryFn === 'function') {
                persistPriceCheckHistoryFn(history, 20);
            }
            if (typeof showToastFn === 'function') {
                showToastFn('Saved to history!', 'success');
            }
            return true;
        };
    }

    if (typeof priceUtils.resolveSavePriceCheckResultFlow !== 'function') {
        priceUtils.resolveSavePriceCheckResultFlow = function resolveSavePriceCheckResultFlow(
            getPriceCheckerFn,
            runSavePriceCheckHistoryFn,
            showToastFn,
            consoleObj
        ) {
            try {
                const checker = typeof getPriceCheckerFn === 'function'
                    ? getPriceCheckerFn()
                    : null;
                if (typeof runSavePriceCheckHistoryFn === 'function') {
                    runSavePriceCheckHistoryFn(checker);
                }
                return true;
            } catch (error) {
                if (consoleObj && typeof consoleObj.error === 'function') {
                    consoleObj.error('[PRICE_CHECK] Save error:', error);
                }
                if (typeof showToastFn === 'function') {
                    showToastFn('Failed to save', 'error');
                }
                return false;
            }
        };
    }

    if (typeof priceUtils.sleep !== 'function') {
        priceUtils.sleep = function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        };
    }

    if (typeof priceUtils.startAnalysisProgressTicker !== 'function') {
        priceUtils.startAnalysisProgressTicker = function startAnalysisProgressTicker(progressBar, intervalMs) {
            let progress = 0;
            return setInterval(() => {
                progress = Math.min(progress + Math.random() * 15, 90);
                progressBar.style.width = progress + '%';
            }, intervalMs || 200);
        };
    }

    if (typeof priceUtils.stopAnalysisProgressTicker !== 'function') {
        priceUtils.stopAnalysisProgressTicker = function stopAnalysisProgressTicker(intervalId, progressBar, finalWidth) {
            clearInterval(intervalId);
            if (finalWidth) progressBar.style.width = finalWidth;
        };
    }

    if (typeof priceUtils.resolveCaptureAnalysisPipeline !== 'function') {
        priceUtils.resolveCaptureAnalysisPipeline = async function resolveCaptureAnalysisPipeline(
            checker,
            videoEl,
            setCaptureAnalysisStep,
            hideCaptureAnalyzingViewFn,
            stopAnalysisProgressTickerCompatFn,
            progressInterval,
            progressBar,
            sleepFn,
            showPriceInputViewFn
        ) {
            setCaptureAnalysisStep('Capturing image...');
            await sleepFn(300);

            setCaptureAnalysisStep('Running AI classification...');
            const result = await checker.captureAndAnalyze(videoEl);

            stopAnalysisProgressTickerCompatFn(priceUtils, progressInterval, progressBar, '100%');
            await sleepFn(300);

            if (typeof hideCaptureAnalyzingViewFn === 'function') {
                hideCaptureAnalyzingViewFn();
            }
            if (typeof showPriceInputViewFn === 'function') {
                showPriceInputViewFn(result.classification);
            }
            return result;
        };
    }

    if (typeof priceUtils.resolveCaptureForPriceCheckFlow !== 'function') {
        priceUtils.resolveCaptureForPriceCheckFlow = async function resolveCaptureForPriceCheckFlow(
            checker,
            videoEl,
            ensurePriceCheckScanQuotaFn,
            createCaptureAnalysisContextFn,
            runCaptureAnalysisPipelineFn,
            handleCaptureAnalysisErrorFn
        ) {
            const hasScanQuota = typeof ensurePriceCheckScanQuotaFn === 'function'
                ? ensurePriceCheckScanQuotaFn(checker)
                : true;
            if (!hasScanQuota) {
                return false;
            }

            const captureAnalysisCtx = typeof createCaptureAnalysisContextFn === 'function'
                ? createCaptureAnalysisContextFn()
                : null;
            const progressBar = captureAnalysisCtx?.progressBar;
            const setCaptureAnalysisStep = captureAnalysisCtx?.setCaptureAnalysisStep;
            const hideCaptureAnalyzingView = captureAnalysisCtx?.hideCaptureAnalyzingView;
            const progressInterval = captureAnalysisCtx?.progressInterval;

            try {
                if (typeof runCaptureAnalysisPipelineFn === 'function') {
                    await runCaptureAnalysisPipelineFn(
                        checker,
                        videoEl,
                        setCaptureAnalysisStep,
                        hideCaptureAnalyzingView,
                        progressInterval,
                        progressBar
                    );
                }
                return true;
            } catch (error) {
                if (typeof handleCaptureAnalysisErrorFn === 'function') {
                    handleCaptureAnalysisErrorFn(error, progressInterval, progressBar);
                }
                return false;
            }
        };
    }

    if (typeof priceUtils.handleCaptureAnalysisError !== 'function') {
        priceUtils.handleCaptureAnalysisError = function handleCaptureAnalysisError(
            errorObj,
            stopAnalysisProgressTickerCompatFn,
            progressInterval,
            progressBar,
            cancelPriceCheckFn,
            showToastFn
        ) {
            stopAnalysisProgressTickerCompatFn(priceUtils, progressInterval, progressBar);
            if (typeof showToastFn === 'function') {
                showToastFn('Analysis failed: ' + errorObj.message, 'error');
            }
            if (typeof cancelPriceCheckFn === 'function') {
                cancelPriceCheckFn();
            }
        };
    }

    if (typeof priceUtils.showPriceCheckAnalyzingView !== 'function') {
        priceUtils.showPriceCheckAnalyzingView = function showPriceCheckAnalyzingView(documentObj, options) {
            const opts = options || {};
            const initialView = documentObj.getElementById('price-check-initial');
            const cameraView = documentObj.getElementById('price-check-camera');
            const analyzingView = documentObj.getElementById('price-check-analyzing');
            const progressBar = documentObj.getElementById('analysis-progress');
            const statusEl = documentObj.getElementById('analysis-status');

            if (opts.hideCamera && cameraView) cameraView.classList.add('hidden');
            if (opts.hideInitial && initialView) initialView.classList.add('hidden');
            if (opts.showAnalyzing !== false && analyzingView) analyzingView.classList.remove('hidden');
            if (progressBar && typeof opts.progressWidth === 'string') progressBar.style.width = opts.progressWidth;

            return { initialView, cameraView, analyzingView, progressBar, statusEl };
        };
    }

    if (typeof priceUtils.resolvePriceCheckAnalyzingUiRefs !== 'function') {
        priceUtils.resolvePriceCheckAnalyzingUiRefs = function resolvePriceCheckAnalyzingUiRefs(documentObj, options) {
            const opts = options || {};
            if (typeof priceUtils.showPriceCheckAnalyzingView === 'function') {
                const refs = priceUtils.showPriceCheckAnalyzingView(documentObj, opts);
                if (refs) return refs;
            }

            const initialView = documentObj.getElementById('price-check-initial');
            const cameraView = documentObj.getElementById('price-check-camera');
            const analyzingView = documentObj.getElementById('price-check-analyzing');
            const progressBar = documentObj.getElementById('analysis-progress');
            const statusEl = documentObj.getElementById('analysis-status');

            if (opts.hideCamera && cameraView) cameraView.classList.add('hidden');
            if (opts.hideInitial && initialView) initialView.classList.add('hidden');
            if (opts.showAnalyzing !== false && analyzingView) analyzingView.classList.remove('hidden');
            if (progressBar && typeof opts.progressWidth === 'string') progressBar.style.width = opts.progressWidth;

            return { initialView, cameraView, analyzingView, progressBar, statusEl };
        };
    }

    if (typeof priceUtils.hidePriceCheckAnalyzingView !== 'function') {
        priceUtils.hidePriceCheckAnalyzingView = function hidePriceCheckAnalyzingView(documentObj) {
            const analyzingView = documentObj.getElementById('price-check-analyzing');
            if (analyzingView) analyzingView.classList.add('hidden');
            return analyzingView;
        };
    }

    if (typeof priceUtils.hidePriceCheckAnalyzingWithFallback !== 'function') {
        priceUtils.hidePriceCheckAnalyzingWithFallback = function hidePriceCheckAnalyzingWithFallback(documentObj, fallbackAnalyzingView) {
            if (typeof priceUtils.hidePriceCheckAnalyzingView === 'function') {
                return priceUtils.hidePriceCheckAnalyzingView(documentObj);
            }
            const analyzingView = fallbackAnalyzingView || documentObj.getElementById('price-check-analyzing');
            if (analyzingView) analyzingView.classList.add('hidden');
            return analyzingView;
        };
    }

    if (typeof priceUtils.createAnalyzeLoadingHide !== 'function') {
        priceUtils.createAnalyzeLoadingHide = function createAnalyzeLoadingHide(
            documentObj,
            hidePriceCheckAnalyzingCompatFn,
            priceUtilsArg
        ) {
            return function hideAnalyzeLoadingView() {
                if (typeof hidePriceCheckAnalyzingCompatFn === 'function') {
                    hidePriceCheckAnalyzingCompatFn(priceUtilsArg);
                    return;
                }
                if (typeof priceUtils.hidePriceCheckAnalyzingWithFallback === 'function') {
                    priceUtils.hidePriceCheckAnalyzingWithFallback(documentObj);
                    return;
                }
                const analyzingView = documentObj.getElementById('price-check-analyzing');
                if (analyzingView) analyzingView.classList.add('hidden');
            };
        };
    }

    if (typeof priceUtils.resolveAnalyzeVendorPrice !== 'function') {
        priceUtils.resolveAnalyzeVendorPrice = function resolveAnalyzeVendorPrice(documentObj) {
            const priceInput = documentObj.getElementById('vendor-price-input');
            return parseInt(priceInput?.value, 10);
        };
    }

    if (typeof priceUtils.logAnalyzePriceDebug !== 'function') {
        priceUtils.logAnalyzePriceDebug = function logAnalyzePriceDebug(checker, consoleObj) {
            if (!consoleObj) return;
            consoleObj.log('CHECK TRIGGERED', {
                classification: checker.currentClassification,
                photo: !!checker.currentPhotoBlob
            });

            if (checker.currentClassification) {
                consoleObj.log('[AI_DEBUG] Top Prediction:', checker.currentClassification.topPrediction.label);
                consoleObj.log('[AI_DEBUG] Probability:', (checker.currentClassification.confidence * 100).toFixed(1) + '%');
            }
        };
    }

    if (typeof priceUtils.resolveAnalyzeItemCategory !== 'function') {
        priceUtils.resolveAnalyzeItemCategory = function resolveAnalyzeItemCategory(inputView, checker, consoleObj) {
            let itemCategory = inputView?.dataset?.selectedItem;
            if (!itemCategory && checker?.currentPhotoBlob) {
                if (consoleObj && typeof consoleObj.warn === 'function') {
                    consoleObj.warn('[PRICE_CHECK] No item category found, forcing "ceramic_bowl" for testing');
                }
                itemCategory = 'ceramic_bowl';
            }
            return itemCategory;
        };
    }

    if (typeof priceUtils.validateAnalyzeInputs !== 'function') {
        priceUtils.validateAnalyzeInputs = function validateAnalyzeInputs(vendorPrice, checker, itemCategory, showToastFn) {
            if (!vendorPrice || vendorPrice <= 0) {
                if (typeof showToastFn === 'function') {
                    showToastFn('Please enter a valid price', 'warning');
                }
                return false;
            }
            if (!checker?.currentClassification && !itemCategory) {
                if (typeof showToastFn === 'function') {
                    showToastFn('AI Analysis in progress... please wait.', 'info');
                }
                return false;
            }
            return true;
        };
    }

    if (typeof priceUtils.createAnalyzeLoadingContext !== 'function') {
        priceUtils.createAnalyzeLoadingContext = function createAnalyzeLoadingContext(
            inputView,
            priceUtilsArg,
            resolvePriceCheckAnalyzingUiRefsCompatFn,
            createPriceCheckAnalysisStepUpdaterCompatFn,
            createAnalyzeLoadingHideCompatFn
        ) {
            if (inputView) {
                inputView.classList.add('hidden');
            }
            const analyzingRefs = typeof resolvePriceCheckAnalyzingUiRefsCompatFn === 'function'
                ? resolvePriceCheckAnalyzingUiRefsCompatFn(priceUtilsArg, { showAnalyzing: true })
                : null;
            const statusEl = analyzingRefs?.statusEl || null;
            const progressBar = analyzingRefs?.progressBar || null;
            const setAnalyzeStep = typeof createPriceCheckAnalysisStepUpdaterCompatFn === 'function'
                ? createPriceCheckAnalysisStepUpdaterCompatFn(priceUtilsArg, statusEl, progressBar)
                : (() => {});
            const hideAnalyzeLoadingView = typeof createAnalyzeLoadingHideCompatFn === 'function'
                ? createAnalyzeLoadingHideCompatFn(priceUtilsArg)
                : (() => {});
            return {
                setAnalyzeStep,
                hideAnalyzeLoadingView
            };
        };
    }

    if (typeof priceUtils.handleAnalyzePriceError !== 'function') {
        priceUtils.handleAnalyzePriceError = function handleAnalyzePriceError(errorObj, inputView, hideAnalyzeLoadingViewFn, showToastFn, consoleObj) {
            if (consoleObj && typeof consoleObj.error === 'function') {
                consoleObj.error('[PRICE_CHECK] Analysis failed:', errorObj);
            }
            if (typeof showToastFn === 'function') {
                showToastFn('Price check failed: ' + (errorObj?.message || 'Unknown error'), 'error');
            }
            if (inputView) {
                inputView.classList.remove('hidden');
            }
            if (typeof hideAnalyzeLoadingViewFn === 'function') {
                hideAnalyzeLoadingViewFn();
            }
        };
    }

    if (typeof priceUtils.resolveAnalyzePricePipeline !== 'function') {
        priceUtils.resolveAnalyzePricePipeline = async function resolveAnalyzePricePipeline(
            checker,
            itemCategory,
            vendorPrice,
            setAnalyzeStep,
            hideAnalyzeLoadingViewFn,
            sleepFn,
            showResultsViewFn
        ) {
            setAnalyzeStep('PROTOCOL: CHECKING DATABASE...', '50%');
            await sleepFn(600);

            const result = await checker.analyzePrice(itemCategory, vendorPrice);

            setAnalyzeStep(null, '100%');
            await sleepFn(300);

            if (typeof hideAnalyzeLoadingViewFn === 'function') {
                hideAnalyzeLoadingViewFn();
            }
            if (typeof showResultsViewFn === 'function') {
                showResultsViewFn(result);
            }
            return result;
        };
    }

    if (typeof priceUtils.resolveAnalyzePriceNowFlow !== 'function') {
        priceUtils.resolveAnalyzePriceNowFlow = async function resolveAnalyzePriceNowFlow(
            getPriceCheckerFn,
            logAnalyzePriceDebugFn,
            resolveInputViewFn,
            resolveAnalyzeVendorPriceFn,
            resolveAnalyzeItemCategoryFn,
            validateAnalyzeInputsFn,
            createAnalyzeLoadingContextFn,
            runAnalyzePricePipelineFn,
            createAnalyzeLoadingHideFn,
            handleAnalyzePriceErrorFn
        ) {
            const checker = typeof getPriceCheckerFn === 'function'
                ? getPriceCheckerFn()
                : null;
            if (typeof logAnalyzePriceDebugFn === 'function') {
                logAnalyzePriceDebugFn(checker);
            }

            const inputView = typeof resolveInputViewFn === 'function'
                ? resolveInputViewFn()
                : null;
            const vendorPrice = typeof resolveAnalyzeVendorPriceFn === 'function'
                ? resolveAnalyzeVendorPriceFn()
                : null;
            const itemCategory = typeof resolveAnalyzeItemCategoryFn === 'function'
                ? resolveAnalyzeItemCategoryFn(inputView, checker)
                : null;
            const hasValidAnalyzeInputs = typeof validateAnalyzeInputsFn === 'function'
                ? validateAnalyzeInputsFn(vendorPrice, checker, itemCategory)
                : !!itemCategory;
            if (!hasValidAnalyzeInputs) {
                return false;
            }

            try {
                const analyzeLoadingCtx = typeof createAnalyzeLoadingContextFn === 'function'
                    ? createAnalyzeLoadingContextFn(inputView)
                    : null;
                const setAnalyzeStep = analyzeLoadingCtx?.setAnalyzeStep;
                const hideAnalyzeLoadingView = analyzeLoadingCtx?.hideAnalyzeLoadingView;

                if (typeof runAnalyzePricePipelineFn === 'function') {
                    await runAnalyzePricePipelineFn(
                        checker,
                        itemCategory,
                        vendorPrice,
                        setAnalyzeStep,
                        hideAnalyzeLoadingView
                    );
                }
                return true;
            } catch (error) {
                const hideAnalyzeLoadingView = typeof createAnalyzeLoadingHideFn === 'function'
                    ? createAnalyzeLoadingHideFn()
                    : (() => {});
                if (typeof handleAnalyzePriceErrorFn === 'function') {
                    handleAnalyzePriceErrorFn(error, inputView, hideAnalyzeLoadingView);
                }
                return false;
            }
        };
    }

    if (typeof priceUtils.setPriceCheckAnalysisStep !== 'function') {
        priceUtils.setPriceCheckAnalysisStep = function setPriceCheckAnalysisStep(statusEl, progressBar, text, width) {
            if (statusEl && typeof text === 'string') statusEl.textContent = text;
            if (progressBar && typeof width === 'string') progressBar.style.width = width;
        };
    }

    if (typeof priceUtils.applyPriceCheckAnalysisStep !== 'function') {
        priceUtils.applyPriceCheckAnalysisStep = function applyPriceCheckAnalysisStep(statusEl, progressBar, text, width) {
            if (typeof priceUtils.setPriceCheckAnalysisStep === 'function') {
                priceUtils.setPriceCheckAnalysisStep(statusEl, progressBar, text, width);
                return;
            }
            if (statusEl && typeof text === 'string') statusEl.textContent = text;
            if (progressBar && typeof width === 'string') progressBar.style.width = width;
        };
    }

    if (typeof priceUtils.createPriceCheckAnalysisStepUpdater !== 'function') {
        priceUtils.createPriceCheckAnalysisStepUpdater = function createPriceCheckAnalysisStepUpdater(statusEl, progressBar) {
            return function updatePriceCheckAnalysisStep(text, width) {
                if (typeof priceUtils.applyPriceCheckAnalysisStep === 'function') {
                    priceUtils.applyPriceCheckAnalysisStep(statusEl, progressBar, text, width);
                    return;
                }
                if (statusEl && typeof text === 'string') statusEl.textContent = text;
                if (progressBar && typeof width === 'string') progressBar.style.width = width;
            };
        };
    }

    if (typeof priceUtils.createQuickCaptureContext !== 'function') {
        priceUtils.createQuickCaptureContext = function createQuickCaptureContext(
            documentObj,
            priceUtilsArg,
            resolvePriceCheckAnalyzingUiRefsCompatFn,
            createPriceCheckAnalysisStepUpdaterCompatFn,
            hidePriceCheckAnalyzingCompatFn
        ) {
            const quickUiRefs = typeof resolvePriceCheckAnalyzingUiRefsCompatFn === 'function'
                ? resolvePriceCheckAnalyzingUiRefsCompatFn(priceUtilsArg, {
                    hideCamera: true,
                    hideInitial: true,
                    showAnalyzing: true,
                    progressWidth: '0%'
                })
                : null;
            const initialView = quickUiRefs?.initialView || documentObj.getElementById('price-check-initial');
            const analyzingView = quickUiRefs?.analyzingView || documentObj.getElementById('price-check-analyzing');
            const progressBar = quickUiRefs?.progressBar || documentObj.getElementById('analysis-progress');
            const statusEl = quickUiRefs?.statusEl || documentObj.getElementById('analysis-status');
            const setQuickAnalysisStep = typeof createPriceCheckAnalysisStepUpdaterCompatFn === 'function'
                ? createPriceCheckAnalysisStepUpdaterCompatFn(priceUtilsArg, statusEl, progressBar)
                : (() => {});
            const hideQuickAnalyzingView = () => {
                if (typeof hidePriceCheckAnalyzingCompatFn === 'function') {
                    hidePriceCheckAnalyzingCompatFn(priceUtilsArg, analyzingView);
                }
            };
            return {
                initialView,
                setQuickAnalysisStep,
                hideQuickAnalyzingView
            };
        };
    }

    if (typeof priceUtils.resolveQuickCaptureError !== 'function') {
        priceUtils.resolveQuickCaptureError = function resolveQuickCaptureError(
            errorObj,
            hideQuickAnalyzingViewFn,
            initialView,
            showToastFn,
            consoleObj
        ) {
            if (consoleObj && typeof consoleObj.error === 'function') {
                consoleObj.error('[QUICK_SCAN] Pipeline failed:', errorObj);
            }
            if (typeof hideQuickAnalyzingViewFn === 'function') {
                hideQuickAnalyzingViewFn();
            }
            if (initialView) {
                initialView.classList.remove('hidden');
            }
            if (typeof showToastFn === 'function') {
                showToastFn('Analysis failed: ' + (errorObj?.message || 'Unknown error'), 'error');
            }
        };
    }

    if (typeof priceUtils.resolveQuickCaptureImageBase64 !== 'function') {
        priceUtils.resolveQuickCaptureImageBase64 = async function resolveQuickCaptureImageBase64(
            checker,
            blobToBase64Fn,
            documentObj
        ) {
            if (checker.currentPhotoBlob) {
                // Already captured (from file upload or previous capture)
                return await blobToBase64Fn(checker.currentPhotoBlob);
            }

            // Try capturing from video
            const videoEl = documentObj.getElementById('price-check-video');
            if (videoEl && videoEl.srcObject) {
                const blob = await checker.camera.capturePhoto(videoEl);
                checker.currentPhotoBlob = blob;
                return await blobToBase64Fn(blob);
            }

            throw new Error('No image source available. Please capture or upload a photo first.');
        };
    }

    if (typeof priceUtils.resolveQuickCaptureDeepPipeline !== 'function') {
        priceUtils.resolveQuickCaptureDeepPipeline = async function resolveQuickCaptureDeepPipeline(
            checker,
            setQuickAnalysisStep,
            resolveQuickCaptureImageBase64CompatFn,
            DeepImageAnalyzerCtor,
            VisionAPIClientCtor,
            calculateHybridPriceFn,
            sleepFn,
            priceUtilsArg
        ) {
            // Step 1: Capture photo from camera or file
            setQuickAnalysisStep('📸 Capturing image...', '10%');
            const imageBase64 = await resolveQuickCaptureImageBase64CompatFn(priceUtilsArg, checker);
            checker.stopCamera();

            // Step 2: Deep zone extraction
            setQuickAnalysisStep('🔬 Extracting detail zones...', '25%');
            await sleepFn(200);
            const deepAnalyzer = new DeepImageAnalyzerCtor();
            const zones = await deepAnalyzer.extractZones(imageBase64);

            // Step 3: Gemini multi-zone deep analysis
            setQuickAnalysisStep('🧠 AI analyzing craftsmanship...', '45%');
            const visionClient = new VisionAPIClientCtor();
            const deepAnalysis = await visionClient.callGeminiDeep(zones);

            // Step 4: Hybrid price calculation
            setQuickAnalysisStep('💰 Calculating fair price...', '75%');
            const itemCategory = deepAnalysis.item?.item_id;
            const hybridPrice = await calculateHybridPriceFn(deepAnalysis, itemCategory);

            // Step 5: Done
            setQuickAnalysisStep('✅ Analysis complete', '100%');
            await sleepFn(400);

            return { deepAnalysis, hybridPrice };
        };
    }

    if (typeof priceUtils.resolveQuickCaptureStartContext !== 'function') {
        priceUtils.resolveQuickCaptureStartContext = function resolveQuickCaptureStartContext(
            documentObj,
            checker,
            ensurePriceCheckScanQuotaFn
        ) {
            const container = documentObj.getElementById('price-check-container');
            if (!container) {
                return null;
            }
            if (typeof ensurePriceCheckScanQuotaFn === 'function') {
                const hasQuota = ensurePriceCheckScanQuotaFn(checker, 'souk_scanner_deep');
                if (!hasQuota) {
                    return null;
                }
            }
            return { container };
        };
    }

    if (typeof priceUtils.resolveQuickCaptureFlow !== 'function') {
        priceUtils.resolveQuickCaptureFlow = async function resolveQuickCaptureFlow(
            checker,
            resolveQuickCaptureStartContextFn,
            createQuickCaptureContextFn,
            runQuickCaptureDeepPipelineFn,
            showQuickCaptureResultsFn,
            handleQuickCaptureErrorFn
        ) {
            const quickStartCtx = typeof resolveQuickCaptureStartContextFn === 'function'
                ? resolveQuickCaptureStartContextFn(checker)
                : null;
            if (!quickStartCtx) {
                return false;
            }

            const quickCaptureCtx = typeof createQuickCaptureContextFn === 'function'
                ? createQuickCaptureContextFn()
                : null;
            const initialView = quickCaptureCtx?.initialView;
            const setQuickAnalysisStep = quickCaptureCtx?.setQuickAnalysisStep;
            const hideQuickAnalyzingView = quickCaptureCtx?.hideQuickAnalyzingView || (() => {});

            try {
                const quickCaptureResult = typeof runQuickCaptureDeepPipelineFn === 'function'
                    ? await runQuickCaptureDeepPipelineFn(checker, setQuickAnalysisStep)
                    : null;
                const deepAnalysis = quickCaptureResult?.deepAnalysis;
                const hybridPrice = quickCaptureResult?.hybridPrice;
                if (typeof showQuickCaptureResultsFn === 'function') {
                    showQuickCaptureResultsFn(hideQuickAnalyzingView, deepAnalysis, hybridPrice);
                } else {
                    hideQuickAnalyzingView();
                }
                return true;
            } catch (error) {
                if (typeof handleQuickCaptureErrorFn === 'function') {
                    handleQuickCaptureErrorFn(error, hideQuickAnalyzingView, initialView);
                }
                return false;
            }
        };
    }

    if (typeof priceUtils.resolveDeepQualityBadge !== 'function') {
        priceUtils.resolveDeepQualityBadge = function resolveDeepQualityBadge(qualityMultiplier) {
            if (qualityMultiplier >= 2.5) return { label: 'COLLECTOR GRADE', color: 'text-purple-400 border-purple-500/50 bg-purple-900/30' };
            if (qualityMultiplier >= 2.0) return { label: 'ARTISAN QUALITY', color: 'text-signal-emerald border-signal-emerald/50 bg-emerald-900/30' };
            if (qualityMultiplier >= 1.5) return { label: 'GOOD QUALITY', color: 'text-signal-cyan border-signal-cyan/50 bg-cyan-900/30' };
            if (qualityMultiplier >= 1.0) return { label: 'STANDARD', color: 'text-zinc-400 border-zinc-500/50 bg-zinc-800/30' };
            return { label: 'LOW QUALITY', color: 'text-signal-amber border-signal-amber/50 bg-amber-900/30' };
        };
    }

    if (typeof priceUtils.resolveDeepQualityBadgeDisplay !== 'function') {
        priceUtils.resolveDeepQualityBadgeDisplay = function resolveDeepQualityBadgeDisplay(qualityMultiplierText) {
            const qualityMultiplier = parseFloat(qualityMultiplierText);
            if (typeof priceUtils.resolveDeepQualityBadge === 'function') {
                return priceUtils.resolveDeepQualityBadge(qualityMultiplier);
            }
            if (qualityMultiplier >= 2.5) return { label: 'COLLECTOR GRADE', color: 'text-purple-400 border-purple-500/50 bg-purple-900/30' };
            if (qualityMultiplier >= 2.0) return { label: 'ARTISAN QUALITY', color: 'text-signal-emerald border-signal-emerald/50 bg-emerald-900/30' };
            if (qualityMultiplier >= 1.5) return { label: 'GOOD QUALITY', color: 'text-signal-cyan border-signal-cyan/50 bg-cyan-900/30' };
            if (qualityMultiplier >= 1.0) return { label: 'STANDARD', color: 'text-zinc-400 border-zinc-500/50 bg-zinc-800/30' };
            return { label: 'LOW QUALITY', color: 'text-signal-amber border-signal-amber/50 bg-amber-900/30' };
        };
    }

    if (typeof priceUtils.getDeepAreaDisplayLabel !== 'function') {
        priceUtils.getDeepAreaDisplayLabel = function getDeepAreaDisplayLabel(area) {
            const areaLabels = {
                jemaa: '📍 Jemaa el-Fnaa (Tourist Zone)',
                souks_main: '📍 Main Souks',
                souks_interior: '📍 Interior Souks',
                workshops: '📍 Artisan Workshop',
                gueliz: '📍 Gueliz (Modern)',
                unknown: '📍 Location Unknown'
            };
            return areaLabels[area] || areaLabels.unknown;
        };
    }

    if (typeof priceUtils.resolveDeepAreaDisplay !== 'function') {
        priceUtils.resolveDeepAreaDisplay = function resolveDeepAreaDisplay(area) {
            if (typeof priceUtils.getDeepAreaDisplayLabel === 'function') {
                return priceUtils.getDeepAreaDisplayLabel(area);
            }
            const areaLabels = {
                jemaa: 'Jemaa el-Fnaa (Tourist Zone)',
                souks_main: 'Main Souks',
                souks_interior: 'Interior Souks',
                workshops: 'Artisan Workshop',
                gueliz: 'Gueliz (Modern)',
                unknown: 'Location Unknown'
            };
            return areaLabels[area] || areaLabels.unknown;
        };
    }

    if (typeof priceUtils.buildDeepSourceBadgeHtml !== 'function') {
        priceUtils.buildDeepSourceBadgeHtml = function buildDeepSourceBadgeHtml(source) {
            return source === 'hybrid'
                ? '<span class="text-[9px] px-2 py-0.5 bg-signal-emerald/20 text-signal-emerald border border-signal-emerald/30 rounded-full font-mono">CROWD + LOCAL</span>'
                : '<span class="text-[9px] px-2 py-0.5 bg-void-700 text-zinc-400 border border-void-600 rounded-full font-mono">LOCAL DATA</span>';
        };
    }

    if (typeof priceUtils.resolveDeepSourceBadge !== 'function') {
        priceUtils.resolveDeepSourceBadge = function resolveDeepSourceBadge(source) {
            if (typeof priceUtils.buildDeepSourceBadgeHtml === 'function') {
                return priceUtils.buildDeepSourceBadgeHtml(source);
            }
            return source === 'hybrid'
                ? '<span class="text-[9px] px-2 py-0.5 bg-signal-emerald/20 text-signal-emerald border border-signal-emerald/30 rounded-full font-mono">CROWD + LOCAL</span>'
                : '<span class="text-[9px] px-2 py-0.5 bg-void-700 text-zinc-400 border border-void-600 rounded-full font-mono">LOCAL DATA</span>';
        };
    }

    if (typeof priceUtils.resolveDeepResultsRenderFlow !== 'function') {
        priceUtils.resolveDeepResultsRenderFlow = function resolveDeepResultsRenderFlow(
            deepAnalysis,
            hybridPrice,
            resolveResultsViewFn,
            resolveDeepResultsPayloadFn,
            resolveDeepQualityBadgeFn,
            resolveDeepAreaDisplayFn,
            resolveDeepSourceBadgeFn,
            createDeepScoreBarFn,
            resolveDeepRedFlagsHtmlFn,
            resolveDeepReasoningHtmlFn,
            buildDeepResultsHtmlFn,
            storeDeepContributionStateFn
        ) {
            const resultsView = typeof resolveResultsViewFn === 'function'
                ? resolveResultsViewFn()
                : null;
            if (!resultsView) return false;

            const deepViewPayload = typeof resolveDeepResultsPayloadFn === 'function'
                ? resolveDeepResultsPayloadFn(deepAnalysis, hybridPrice)
                : {};
            const item = deepViewPayload.item;
            const material = deepViewPayload.material;
            const craftsmanship = deepViewPayload.craftsmanship;
            const authenticity = deepViewPayload.authenticity || {};
            const condition = deepViewPayload.condition;
            const prices = deepViewPayload.prices;
            const displayName = deepViewPayload.displayName;
            const emoji = deepViewPayload.emoji;
            const qMult = deepViewPayload.qMult;

            const qualityBadge = typeof resolveDeepQualityBadgeFn === 'function'
                ? resolveDeepQualityBadgeFn(qMult)
                : null;
            const areaDisplay = typeof resolveDeepAreaDisplayFn === 'function'
                ? resolveDeepAreaDisplayFn(hybridPrice?.area)
                : null;
            const sourceBadge = typeof resolveDeepSourceBadgeFn === 'function'
                ? resolveDeepSourceBadgeFn(hybridPrice?.source)
                : null;
            const scoreBar = typeof createDeepScoreBarFn === 'function'
                ? createDeepScoreBarFn()
                : null;
            const redFlagsHTML = typeof resolveDeepRedFlagsHtmlFn === 'function'
                ? resolveDeepRedFlagsHtmlFn(authenticity.red_flags)
                : '';
            const deepReasoningHtml = typeof resolveDeepReasoningHtmlFn === 'function'
                ? resolveDeepReasoningHtmlFn(deepAnalysis?.reasoning)
                : '';

            const resultHTML = typeof buildDeepResultsHtmlFn === 'function'
                ? buildDeepResultsHtmlFn({
                    item,
                    material,
                    craftsmanship,
                    condition,
                    authenticity,
                    prices,
                    hybridPrice,
                    deepAnalysis,
                    emoji,
                    displayName,
                    qualityBadge,
                    areaDisplay,
                    sourceBadge,
                    qMult,
                    redFlagsHTML,
                    deepReasoningHtml,
                    scoreBar
                })
                : '';

            resultsView.innerHTML = resultHTML;
            if (typeof storeDeepContributionStateFn === 'function') {
                storeDeepContributionStateFn(deepAnalysis, hybridPrice);
            }
            return true;
        };
    }

    if (typeof priceUtils.buildDeepScoreBarHtml !== 'function') {
        priceUtils.buildDeepScoreBarHtml = function buildDeepScoreBarHtml(score, label, maxScore) {
            const max = maxScore || 10;
            const pct = Math.round((score / max) * 100);
            const barColor = pct >= 70 ? 'bg-signal-emerald' : pct >= 40 ? 'bg-signal-amber' : 'bg-signal-crimson';
            return `
            <div class="flex items-center gap-2">
                <span class="text-[10px] text-zinc-500 font-mono w-24 uppercase">${label}</span>
                <div class="flex-1 h-1.5 bg-void-800 rounded-full overflow-hidden">
                    <div class="${barColor} h-full rounded-full transition-all duration-700" style="width: ${pct}%"></div>
                </div>
                <span class="text-xs font-mono text-zinc-300 w-8 text-right">${score}/${max}</span>
            </div>
        `;
        };
    }

    if (typeof priceUtils.renderDeepScoreBarHtml !== 'function') {
        priceUtils.renderDeepScoreBarHtml = function renderDeepScoreBarHtml(score, label, maxScore) {
            if (typeof priceUtils.buildDeepScoreBarHtml === 'function') {
                return priceUtils.buildDeepScoreBarHtml(score, label, maxScore);
            }
            const max = maxScore || 10;
            const pct = Math.round((score / max) * 100);
            const barColor = pct >= 70 ? 'bg-signal-emerald' : pct >= 40 ? 'bg-signal-amber' : 'bg-signal-crimson';
            return `
            <div class="flex items-center gap-2">
                <span class="text-[10px] text-zinc-500 font-mono w-24 uppercase">${label}</span>
                <div class="flex-1 h-1.5 bg-void-800 rounded-full overflow-hidden">
                    <div class="${barColor} h-full rounded-full transition-all duration-700" style="width: ${pct}%"></div>
                </div>
                <span class="text-xs font-mono text-zinc-300 w-8 text-right">${score}/${max}</span>
            </div>
        `;
        };
    }

    if (typeof priceUtils.buildDeepRedFlagsHtml !== 'function') {
        priceUtils.buildDeepRedFlagsHtml = function buildDeepRedFlagsHtml(redFlags) {
            if (!redFlags || redFlags.length === 0) return '';
            return `<div class="mt-3 p-2 bg-red-900/20 border border-red-500/30 rounded">
            <div class="text-[9px] text-red-400 font-mono uppercase mb-1">⚠️ RED FLAGS</div>
            <div class="text-xs text-red-300">${redFlags.join(' • ')}</div>
           </div>`;
        };
    }

    if (typeof priceUtils.resolveDeepRedFlagsHtml !== 'function') {
        priceUtils.resolveDeepRedFlagsHtml = function resolveDeepRedFlagsHtml(redFlags) {
            if (typeof priceUtils.buildDeepRedFlagsHtml === 'function') {
                return priceUtils.buildDeepRedFlagsHtml(redFlags);
            }
            if (!redFlags || redFlags.length === 0) return '';
            return `<div class="mt-3 p-2 bg-red-900/20 border border-red-500/30 rounded">
            <div class="text-[9px] text-red-400 font-mono uppercase mb-1">RED FLAGS</div>
            <div class="text-xs text-red-300">${redFlags.join(' • ')}</div>
           </div>`;
        };
    }

    if (typeof priceUtils.resetPriceCheckViews !== 'function') {
        priceUtils.resetPriceCheckViews = function resetPriceCheckViews(documentObj) {
            documentObj.getElementById('price-check-initial').classList.remove('hidden');
            documentObj.getElementById('price-check-camera').classList.add('hidden');
            documentObj.getElementById('price-check-analyzing').classList.add('hidden');
            documentObj.getElementById('price-check-input').classList.add('hidden');
            documentObj.getElementById('price-check-results').classList.add('hidden');
        };
    }

    if (typeof priceUtils.resolveCancelPriceCheckFlow !== 'function') {
        priceUtils.resolveCancelPriceCheckFlow = function resolveCancelPriceCheckFlow(
            getPriceCheckerFn,
            resetPriceCheckViewsFn
        ) {
            const checker = typeof getPriceCheckerFn === 'function'
                ? getPriceCheckerFn()
                : null;
            if (checker && typeof checker.reset === 'function') {
                checker.reset();
            }
            if (typeof resetPriceCheckViewsFn === 'function') {
                resetPriceCheckViewsFn();
            }
            return true;
        };
    }

    if (typeof priceUtils.showPriceCheckResultsView !== 'function') {
        priceUtils.showPriceCheckResultsView = function showPriceCheckResultsView(documentObj) {
            const resultsView = documentObj.getElementById('price-check-results');
            if (resultsView) {
                resultsView.classList.remove('hidden');
            }
            return resultsView;
        };
    }

    if (typeof priceUtils.resolvePriceCheckResultsView !== 'function') {
        priceUtils.resolvePriceCheckResultsView = function resolvePriceCheckResultsView(documentObj) {
            if (typeof priceUtils.showPriceCheckResultsView === 'function') {
                return priceUtils.showPriceCheckResultsView(documentObj);
            }
            const resultsView = documentObj.getElementById('price-check-results');
            if (resultsView) {
                resultsView.classList.remove('hidden');
            }
            return resultsView;
        };
    }

    if (typeof priceUtils.buildDeepResultsViewPayload !== 'function') {
        priceUtils.buildDeepResultsViewPayload = function buildDeepResultsViewPayload(
            deepAnalysis,
            hybridPrice,
            itemDisplayNames
        ) {
            const item = deepAnalysis?.item || {};
            const displayName = itemDisplayNames[item.item_id] || item.item_id || 'Unknown Item';
            return {
                item,
                material: deepAnalysis?.material || {},
                craftsmanship: deepAnalysis?.craftsmanship || {},
                authenticity: deepAnalysis?.authenticity || {},
                condition: deepAnalysis?.condition || {},
                prices: hybridPrice?.prices || {},
                displayName,
                emoji: displayName.split(' ')[0] || '📦',
                qMult: (deepAnalysis?.quality_multiplier || 1.0).toFixed(1)
            };
        };
    }

    if (typeof priceUtils.resolveDeepResultsViewPayload !== 'function') {
        priceUtils.resolveDeepResultsViewPayload = function resolveDeepResultsViewPayload(
            deepAnalysis,
            hybridPrice,
            itemDisplayNames
        ) {
            if (typeof priceUtils.buildDeepResultsViewPayload === 'function') {
                return priceUtils.buildDeepResultsViewPayload(
                    deepAnalysis,
                    hybridPrice,
                    itemDisplayNames
                );
            }
            const item = deepAnalysis?.item || {};
            const displayName = itemDisplayNames[item.item_id] || item.item_id || 'Unknown Item';
            return {
                item,
                material: deepAnalysis?.material || {},
                craftsmanship: deepAnalysis?.craftsmanship || {},
                authenticity: deepAnalysis?.authenticity || {},
                condition: deepAnalysis?.condition || {},
                prices: hybridPrice?.prices || {},
                displayName,
                emoji: displayName.split(' ')[0] || '📦',
                qMult: (deepAnalysis?.quality_multiplier || 1.0).toFixed(1)
            };
        };
    }

    if (typeof priceUtils.buildDeepResultsHtml !== 'function') {
        priceUtils.buildDeepResultsHtml = function buildDeepResultsHtml(payload) {
            const item = payload.item || {};
            const material = payload.material || {};
            const craftsmanship = payload.craftsmanship || {};
            const condition = payload.condition || {};
            const authenticity = payload.authenticity || {};
            const prices = payload.prices || {};
            const hybridPrice = payload.hybridPrice || {};
            const deepAnalysis = payload.deepAnalysis || {};
            const scoreBar = (score, label, maxScore = 10) => {
                if (typeof priceUtils.buildDeepScoreBarHtml === 'function') {
                    return priceUtils.buildDeepScoreBarHtml(score, label, maxScore);
                }
                const pct = Math.round((score / maxScore) * 100);
                const barColor = pct >= 70 ? 'bg-signal-emerald' : pct >= 40 ? 'bg-signal-amber' : 'bg-signal-crimson';
                return `
            <div class="flex items-center gap-2">
                <span class="text-[10px] text-zinc-500 font-mono w-24 uppercase">${label}</span>
                <div class="flex-1 h-1.5 bg-void-800 rounded-full overflow-hidden">
                    <div class="${barColor} h-full rounded-full transition-all duration-700" style="width: ${pct}%"></div>
                </div>
                <span class="text-xs font-mono text-zinc-300 w-8 text-right">${score}/${maxScore}</span>
            </div>
        `;
            };

            return `
        <div class="space-y-4 animate-[slide-up-fade_0.4s_ease-out]">
            <!-- Item Header -->
            <div class="bg-void-800/50 rounded-machined p-4 border border-void-700/50">
                <div class="flex items-center gap-3 mb-3">
                    <div class="text-4xl">${payload.emoji}</div>
                    <div class="flex-1">
                        <div class="font-semibold text-white text-lg">${payload.displayName}</div>
                        <div class="text-xs text-zinc-500 font-mono">
                            ${item.subtype || ''} • Confidence: ${Math.round((item.confidence || 0) * 100)}%
                        </div>
                    </div>
                    <div class="px-2 py-1 ${payload.qualityBadge.color} border rounded text-[9px] font-mono font-bold tracking-wider">
                        ${payload.qualityBadge.label}
                    </div>
                </div>
                <div class="flex items-center justify-between">
                    <span class="text-[10px] text-zinc-500 font-mono">${payload.areaDisplay}</span>
                    ${payload.sourceBadge}
                </div>
            </div>

            <!-- Price Range Card -->
            <div class="bg-void-900/60 rounded-machined p-5 border border-signal-emerald/30">
                <div class="text-[9px] text-signal-emerald font-mono uppercase tracking-widest mb-3">FAIR PRICE RANGE</div>
                <div class="grid grid-cols-3 gap-3 mb-4">
                    <div class="text-center p-2 bg-void-800/50 rounded">
                        <div class="text-[9px] text-zinc-500 uppercase">Low</div>
                        <div class="text-lg font-bold font-mono text-zinc-300">${prices.p25 || '—'}</div>
                        <div class="text-[9px] text-zinc-600">DH</div>
                    </div>
                    <div class="text-center p-3 bg-signal-emerald/10 border border-signal-emerald/30 rounded">
                        <div class="text-[9px] text-signal-emerald uppercase font-bold">Fair</div>
                        <div class="text-2xl font-bold font-mono text-signal-emerald">${prices.median || '—'}</div>
                        <div class="text-[9px] text-signal-emerald/70">DH</div>
                    </div>
                    <div class="text-center p-2 bg-void-800/50 rounded">
                        <div class="text-[9px] text-zinc-500 uppercase">High</div>
                        <div class="text-lg font-bold font-mono text-zinc-300">${prices.p75 || '—'}</div>
                        <div class="text-[9px] text-zinc-600">DH</div>
                    </div>
                </div>
                ${hybridPrice?.locationFactor && hybridPrice.locationFactor !== 1.0
                    ? `<div class="text-[10px] text-zinc-500 font-mono text-center">
                        Location factor: ${hybridPrice.locationFactor}x (${hybridPrice.area === 'jemaa' ? 'tourist premium' : 'area adjusted'})
                       </div>`
                    : ''}
            </div>

            <!-- Quality Assessment -->
            <div class="bg-void-900/40 rounded-machined p-4 border border-void-700/50">
                <div class="text-[9px] text-zinc-500 font-mono uppercase tracking-widest mb-3">QUALITY ASSESSMENT</div>
                <div class="space-y-2">
                    ${scoreBar(material.score || 0, 'Material')}
                    ${scoreBar(craftsmanship.score || 0, 'Craftsmanship')}
                    ${scoreBar(condition.score || 0, 'Condition')}
                </div>
                <div class="mt-3 flex items-center gap-2">
                    <span class="text-[9px] text-zinc-500 font-mono uppercase">Quality Multiplier:</span>
                    <span class="text-sm font-bold font-mono ${parseFloat(payload.qMult) >= 1.5 ? 'text-signal-emerald' : 'text-zinc-300'}">${payload.qMult}×</span>
                </div>
                <div class="mt-2 flex items-center gap-2">
                    <span class="text-[9px] text-zinc-500 font-mono uppercase">Handmade:</span>
                    <span class="text-xs font-mono ${authenticity.genuine_handmade ? 'text-signal-emerald' : 'text-signal-amber'}">
                        ${authenticity.genuine_handmade ? '✅ YES' : '❌ NO / Unknown'}
                    </span>
                </div>
                ${payload.redFlagsHTML}
            </div>

            <!-- AI Reasoning -->
            ${deepAnalysis.reasoning ? `
            <div class="bg-void-900/30 rounded-machined p-4 border border-void-800">
                <div class="text-[9px] text-zinc-500 font-mono uppercase tracking-widest mb-2">🧠 AI ASSESSMENT</div>
                <p class="text-xs text-zinc-400 leading-relaxed">${deepAnalysis.reasoning}</p>
            </div>` : ''}

            <!-- Action Buttons -->
            <div class="space-y-2">
                <button onclick="window.showHagglePriceInput()"
                    class="w-full py-4 bg-signal-amber text-black rounded-machined hover:bg-amber-400 transition-all font-bold text-base tracking-wide shadow-lg shadow-amber-900/30 active:scale-[0.98]">
                    ⚔️ PREPARE TO HAGGLE
                </button>
                <div class="flex gap-3">
                    <button onclick="window.cancelPriceCheck()"
                        class="flex-1 py-3 bg-void-700 text-white rounded-machined hover:bg-zinc-600 transition-all font-bold text-sm">
                        NEW SCAN
                    </button>
                    <button onclick="window.showContributionPrompt()"
                        class="flex-1 py-3 bg-void-800 text-zinc-400 border border-void-700 rounded-machined hover:bg-void-700 transition-all font-bold text-sm">
                        📊 CONTRIBUTE
                    </button>
                </div>
            </div>
        </div>
    `;
        };
    }

    if (typeof priceUtils.storeDeepContributionState !== 'function') {
        priceUtils.storeDeepContributionState = function storeDeepContributionState(windowObjParam, deepAnalysis, hybridPrice) {
            windowObjParam._lastDeepAnalysis = deepAnalysis;
            windowObjParam._lastHybridPrice = hybridPrice;
        };
    }

    if (typeof priceUtils.readDeepContributionState !== 'function') {
        priceUtils.readDeepContributionState = function readDeepContributionState(windowObjParam) {
            return {
                deepAnalysis: windowObjParam._lastDeepAnalysis,
                hybridPrice: windowObjParam._lastHybridPrice
            };
        };
    }

    if (typeof priceUtils.resolveDeepContributionState !== 'function') {
        priceUtils.resolveDeepContributionState = function resolveDeepContributionState(windowObjParam) {
            if (typeof priceUtils.readDeepContributionState === 'function') {
                return priceUtils.readDeepContributionState(windowObjParam);
            }
            return {
                deepAnalysis: windowObjParam._lastDeepAnalysis,
                hybridPrice: windowObjParam._lastHybridPrice
            };
        };
    }

    if (typeof priceUtils.buildDeepContributionPromptHtml !== 'function') {
        priceUtils.buildDeepContributionPromptHtml = function buildDeepContributionPromptHtml(hybridPrice) {
            return `
        <div class="space-y-4 animate-[slide-up-fade_0.3s_ease-out]">
            <div class="bg-void-900/60 rounded-machined p-5 border border-signal-emerald/30">
                <div class="text-center mb-4">
                    <div class="text-3xl mb-2">📊</div>
                    <h3 class="text-lg font-bold text-white">Help Other Travelers!</h3>
                    <p class="text-xs text-zinc-400 mt-1 max-w-[240px] mx-auto">
                        Share the price you paid to improve accuracy for everyone. Your data is anonymous.
                    </p>
                </div>

                <div class="space-y-3">
                    <div>
                        <label class="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block mb-1">
                            ITEM: ${hybridPrice.displayName}
                        </label>
                    </div>

                    <div>
                        <label for="crowd-price-paid" class="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block mb-1">
                            PRICE YOU PAID (DH)
                        </label>
                        <input type="number" id="crowd-price-paid" name="crowd_price_paid"
                               placeholder="e.g. 850"
                                class="w-full bg-void-950 border border-void-700 rounded-lg px-4 py-3 text-white text-lg font-mono focus:border-signal-emerald focus:ring-1 focus:ring-signal-emerald outline-none transition-all"
                                min="1" step="10">
                    </div>

                    <div>
                        <label for="crowd-asking-price" class="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block mb-1">
                            VENDOR'S ASKING PRICE (Optional)
                        </label>
                        <input type="number" id="crowd-asking-price" name="crowd_asking_price"
                               placeholder="e.g. 1500"
                                class="w-full bg-void-950 border border-void-700 rounded-lg px-4 py-3 text-white text-lg font-mono focus:border-signal-emerald/50 outline-none transition-all"
                                min="1" step="10">
                    </div>
                </div>

                <div class="mt-4 flex gap-3">
                    <button onclick="window.cancelContribution()"
                        class="flex-1 py-3 bg-void-700 text-zinc-400 rounded-machined hover:bg-void-600 transition-all font-mono text-xs">
                        SKIP
                    </button>
                    <button onclick="window.submitCrowdPrice()"
                        class="flex-1 py-3 bg-signal-emerald text-black font-bold rounded-machined hover:bg-emerald-400 transition-all text-sm shadow-lg shadow-emerald-500/20">
                        SUBMIT 📤
                    </button>
                </div>

                <p class="text-[9px] text-zinc-600 text-center mt-3 font-mono">
                    Data is fuzzy-anonymized • No personal info collected
                </p>
            </div>
        </div>
    `;
        };
    }

    if (typeof priceUtils.renderDeepContributionPromptView !== 'function') {
        priceUtils.renderDeepContributionPromptView = function renderDeepContributionPromptView(documentObj, hybridPrice) {
            const resultsView = documentObj.getElementById('price-check-results');
            if (!resultsView) return null;
            if (typeof priceUtils.buildDeepContributionPromptHtml === 'function') {
                resultsView.innerHTML = priceUtils.buildDeepContributionPromptHtml(hybridPrice);
                return resultsView;
            }

            resultsView.innerHTML = `
        <div class="space-y-4 animate-[slide-up-fade_0.3s_ease-out]">
            <div class="bg-void-900/60 rounded-machined p-5 border border-signal-emerald/30">
                <div class="text-center mb-4">
                    <div class="text-3xl mb-2">📊</div>
                    <h3 class="text-lg font-bold text-white">Help Other Travelers!</h3>
                    <p class="text-xs text-zinc-400 mt-1 max-w-[240px] mx-auto">
                        Share the price you paid to improve accuracy for everyone. Your data is anonymous.
                    </p>
                </div>

                <div class="space-y-3">
                    <div>
                        <label class="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block mb-1">
                            ITEM: ${hybridPrice.displayName}
                        </label>
                    </div>

                    <div>
                        <label for="crowd-price-paid" class="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block mb-1">
                            PRICE YOU PAID (DH)
                        </label>
                        <input type="number" id="crowd-price-paid" name="crowd_price_paid"
                               placeholder="e.g. 850"
                                class="w-full bg-void-950 border border-void-700 rounded-lg px-4 py-3 text-white text-lg font-mono focus:border-signal-emerald focus:ring-1 focus:ring-signal-emerald outline-none transition-all"
                                min="1" step="10">
                    </div>

                    <div>
                        <label for="crowd-asking-price" class="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block mb-1">
                            VENDOR'S ASKING PRICE (Optional)
                        </label>
                        <input type="number" id="crowd-asking-price" name="crowd_asking_price"
                               placeholder="e.g. 1500"
                                class="w-full bg-void-950 border border-void-700 rounded-lg px-4 py-3 text-white text-lg font-mono focus:border-signal-emerald/50 outline-none transition-all"
                                min="1" step="10">
                    </div>
                </div>

                <div class="mt-4 flex gap-3">
                    <button onclick="window.cancelContribution()"
                        class="flex-1 py-3 bg-void-700 text-zinc-400 rounded-machined hover:bg-void-600 transition-all font-mono text-xs">
                        SKIP
                    </button>
                    <button onclick="window.submitCrowdPrice()"
                        class="flex-1 py-3 bg-signal-emerald text-black font-bold rounded-machined hover:bg-emerald-400 transition-all text-sm shadow-lg shadow-emerald-500/20">
                        SUBMIT 📤
                    </button>
                </div>

                <p class="text-[9px] text-zinc-600 text-center mt-3 font-mono">
                    Data is fuzzy-anonymized • No personal info collected
                </p>
            </div>
        </div>
    `;
            return resultsView;
        };
    }

    if (typeof priceUtils.resolveDeepContributionPromptView !== 'function') {
        priceUtils.resolveDeepContributionPromptView = function resolveDeepContributionPromptView(documentObj, hybridPrice) {
            if (typeof priceUtils.renderDeepContributionPromptView === 'function') {
                return priceUtils.renderDeepContributionPromptView(documentObj, hybridPrice);
            }
            const resultsView = documentObj.getElementById('price-check-results');
            if (!resultsView) return null;
            if (typeof priceUtils.buildDeepContributionPromptHtml === 'function') {
                resultsView.innerHTML = priceUtils.buildDeepContributionPromptHtml(hybridPrice);
                return resultsView;
            }
            return resultsView;
        };
    }

    if (typeof priceUtils.readDeepContributionInputValues !== 'function') {
        priceUtils.readDeepContributionInputValues = function readDeepContributionInputValues(documentObj) {
            return {
                pricePaid: parseInt(documentObj.getElementById('crowd-price-paid')?.value, 10),
                askingPrice: parseInt(documentObj.getElementById('crowd-asking-price')?.value, 10)
            };
        };
    }

    if (typeof priceUtils.ensureDeepContributionPricePaid !== 'function') {
        priceUtils.ensureDeepContributionPricePaid = function ensureDeepContributionPricePaid(pricePaid, showToastFn) {
            if (pricePaid && pricePaid > 0) {
                return true;
            }
            if (typeof showToastFn === 'function') {
                showToastFn('Please enter the price you paid', 'warning');
            }
            return false;
        };
    }

    if (typeof priceUtils.resolveDeepContributionCrowdDb !== 'function') {
        priceUtils.resolveDeepContributionCrowdDb = function resolveDeepContributionCrowdDb(windowObjParam, CrowdPriceDBCtor) {
            return windowObjParam.crowdPriceDB || new CrowdPriceDBCtor();
        };
    }

    if (typeof priceUtils.buildDeepCrowdSubmissionPayload !== 'function') {
        priceUtils.buildDeepCrowdSubmissionPayload = function buildDeepCrowdSubmissionPayload(
            hybridPrice,
            deepAnalysis,
            pricePaid,
            askingPrice,
            position
        ) {
            return {
                itemType: hybridPrice?.category || deepAnalysis?.item?.item_id || 'generic_item',
                pricePaid: pricePaid,
                askingPrice: askingPrice > 0 ? askingPrice : null,
                qualityMultiplier: deepAnalysis?.quality_multiplier || 1.0,
                area: hybridPrice?.area || 'unknown',
                lat: position?.lat || null,
                lng: position?.lng || null
            };
        };
    }

    if (typeof priceUtils.resolveShowContributionPromptFlow !== 'function') {
        priceUtils.resolveShowContributionPromptFlow = function resolveShowContributionPromptFlow(
            deepState,
            renderDeepContributionPromptFn,
            showToastFn
        ) {
            const hybridPrice = deepState?.hybridPrice;
            if (!hybridPrice) {
                if (typeof showToastFn === 'function') {
                    showToastFn('No analysis to contribute', 'warning');
                }
                return false;
            }
            if (typeof renderDeepContributionPromptFn === 'function') {
                renderDeepContributionPromptFn(hybridPrice);
            }
            return true;
        };
    }

    if (typeof priceUtils.resolveSubmitCrowdPriceFlow !== 'function') {
        priceUtils.resolveSubmitCrowdPriceFlow = async function resolveSubmitCrowdPriceFlow(
            deepState,
            crowdInputs,
            ensureDeepContributionPricePaidFn,
            resolveDeepContributionCrowdDbFn,
            getCurrentPositionFn,
            buildDeepCrowdPayloadFn,
            cancelPriceCheckFn
        ) {
            const hybridPrice = deepState?.hybridPrice;
            const deepAnalysis = deepState?.deepAnalysis;
            const pricePaid = crowdInputs?.pricePaid;
            const askingPrice = crowdInputs?.askingPrice;

            if (typeof ensureDeepContributionPricePaidFn === 'function' &&
                !ensureDeepContributionPricePaidFn(pricePaid)) {
                return false;
            }

            const crowdDB = typeof resolveDeepContributionCrowdDbFn === 'function'
                ? resolveDeepContributionCrowdDbFn()
                : null;
            if (!crowdDB || typeof crowdDB.submitPrice !== 'function') {
                return false;
            }

            const position = typeof getCurrentPositionFn === 'function'
                ? await getCurrentPositionFn()
                : null;
            const crowdPayload = typeof buildDeepCrowdPayloadFn === 'function'
                ? buildDeepCrowdPayloadFn(hybridPrice, deepAnalysis, pricePaid, askingPrice, position)
                : null;
            await crowdDB.submitPrice(crowdPayload);

            if (typeof cancelPriceCheckFn === 'function') {
                cancelPriceCheckFn();
            }
            return true;
        };
    }

    if (typeof priceUtils.resolveLegacyDeepQualityTier !== 'function') {
        priceUtils.resolveLegacyDeepQualityTier = function resolveLegacyDeepQualityTier(qualityMultiplier) {
            if (qualityMultiplier >= 2.5) {
                return { qualityTier: 'MUSEUM GRADE', qualityColor: 'text-purple-300', qualityBg: 'bg-purple-900/40 border-purple-500/50' };
            }
            if (qualityMultiplier >= 2.0) {
                return { qualityTier: 'ARTISAN PREMIUM', qualityColor: 'text-amber-300', qualityBg: 'bg-amber-900/40 border-amber-500/50' };
            }
            if (qualityMultiplier >= 1.5) {
                return { qualityTier: 'GOOD QUALITY', qualityColor: 'text-emerald-300', qualityBg: 'bg-emerald-900/40 border-emerald-500/50' };
            }
            if (qualityMultiplier >= 1.0) {
                return { qualityTier: 'AVERAGE', qualityColor: 'text-zinc-300', qualityBg: 'bg-zinc-800/40 border-zinc-500/50' };
            }
            return { qualityTier: 'TOURIST TRAP', qualityColor: 'text-red-300', qualityBg: 'bg-red-900/40 border-red-500/50' };
        };
    }

    if (typeof priceUtils.resolveLegacyDeepQualityTheme !== 'function') {
        priceUtils.resolveLegacyDeepQualityTheme = function resolveLegacyDeepQualityTheme(qualityMultiplier) {
            if (typeof priceUtils.resolveLegacyDeepQualityTier === 'function') {
                return priceUtils.resolveLegacyDeepQualityTier(qualityMultiplier);
            }
            if (qualityMultiplier >= 2.5) return { qualityTier: 'MUSEUM GRADE', qualityColor: 'text-purple-300', qualityBg: 'bg-purple-900/40 border-purple-500/50' };
            if (qualityMultiplier >= 2.0) return { qualityTier: 'ARTISAN PREMIUM', qualityColor: 'text-amber-300', qualityBg: 'bg-amber-900/40 border-amber-500/50' };
            if (qualityMultiplier >= 1.5) return { qualityTier: 'GOOD QUALITY', qualityColor: 'text-emerald-300', qualityBg: 'bg-emerald-900/40 border-emerald-500/50' };
            if (qualityMultiplier >= 1.0) return { qualityTier: 'AVERAGE', qualityColor: 'text-zinc-300', qualityBg: 'bg-zinc-800/40 border-zinc-500/50' };
            return { qualityTier: 'TOURIST TRAP', qualityColor: 'text-red-300', qualityBg: 'bg-red-900/40 border-red-500/50' };
        };
    }

    if (typeof priceUtils.buildLegacyDeepScoreBarHtml !== 'function') {
        priceUtils.buildLegacyDeepScoreBarHtml = function buildLegacyDeepScoreBarHtml(label, score, maxScore) {
            const max = maxScore || 10;
            const pct = Math.round((score / max) * 100);
            const barColor = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500';
            const scoreColor = pct >= 70 ? 'text-emerald-400' : pct >= 40 ? 'text-amber-400' : 'text-red-400';
            return `
            <div class="flex items-center gap-3">
                <span class="text-[10px] text-zinc-400 font-mono w-24 uppercase tracking-wider">${label}</span>
                <div class="flex-1 bg-void-800 rounded-full h-2 overflow-hidden">
                    <div class="${barColor} h-full rounded-full transition-all duration-700" style="width: ${pct}%"></div>
                </div>
                <span class="text-xs font-mono font-bold ${scoreColor}">${score}/10</span>
            </div>
        `;
        };
    }

    if (typeof priceUtils.resolveDeepReasoningHtml !== 'function') {
        priceUtils.resolveDeepReasoningHtml = function resolveDeepReasoningHtml(reasoningText) {
            if (!reasoningText) return '';
            return `
            <div class="bg-void-900/30 rounded-machined p-4 border border-void-800">
                <div class="text-[9px] text-zinc-500 font-mono uppercase tracking-widest mb-2">🧠 AI ASSESSMENT</div>
                <p class="text-xs text-zinc-400 leading-relaxed">${reasoningText}</p>
            </div>`;
        };
    }

    if (typeof priceUtils.renderLegacyDeepScoreBarHtml !== 'function') {
        priceUtils.renderLegacyDeepScoreBarHtml = function renderLegacyDeepScoreBarHtml(label, score, maxScore) {
            if (typeof priceUtils.buildLegacyDeepScoreBarHtml === 'function') {
                return priceUtils.buildLegacyDeepScoreBarHtml(label, score, maxScore);
            }
            const max = maxScore || 10;
            const pct = Math.round((score / max) * 100);
            const barColor = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500';
            return `
            <div class="flex items-center gap-3">
                <span class="text-[10px] text-zinc-400 font-mono w-24 uppercase tracking-wider">${label}</span>
                <div class="flex-1 bg-void-800 rounded-full h-2 overflow-hidden">
                    <div class="${barColor} h-full rounded-full transition-all duration-700" style="width: ${pct}%"></div>
                </div>
                <span class="text-xs font-mono font-bold ${pct >= 70 ? 'text-emerald-400' : pct >= 40 ? 'text-amber-400' : 'text-red-400'}">${score}/10</span>
            </div>
        `;
        };
    }

    if (typeof priceUtils.buildLegacyDeepRedFlagsHtml !== 'function') {
        priceUtils.buildLegacyDeepRedFlagsHtml = function buildLegacyDeepRedFlagsHtml(deepAuth) {
            if (!(deepAuth?.red_flags?.length > 0)) return '';
            return `<div class="mt-3 p-3 bg-red-900/30 border border-red-500/30 rounded-lg">
            <div class="text-[10px] text-red-400 font-mono uppercase tracking-widest mb-1">⚠️ RED FLAGS</div>
            <ul class="text-xs text-red-300 space-y-1">
                ${deepAuth.red_flags.map(f => `<li>• ${f.replace(/_/g, ' ')}</li>`).join('')}
            </ul>
           </div>`;
        };
    }

    if (typeof priceUtils.resolveLegacyDeepRedFlagsHtml !== 'function') {
        priceUtils.resolveLegacyDeepRedFlagsHtml = function resolveLegacyDeepRedFlagsHtml(deepAuth) {
            if (typeof priceUtils.buildLegacyDeepRedFlagsHtml === 'function') {
                return priceUtils.buildLegacyDeepRedFlagsHtml(deepAuth);
            }
            if (!(deepAuth?.red_flags?.length > 0)) return '';
            return `<div class="mt-3 p-3 bg-red-900/30 border border-red-500/30 rounded-lg">
            <div class="text-[10px] text-red-400 font-mono uppercase tracking-widest mb-1">RED FLAGS</div>
            <ul class="text-xs text-red-300 space-y-1">
                ${deepAuth.red_flags.map(f => `<li>${f.replace(/_/g, ' ')}</li>`).join('')}
            </ul>
           </div>`;
        };
    }

    if (typeof priceUtils.resolveLegacyDeepAuthBadge !== 'function') {
        priceUtils.resolveLegacyDeepAuthBadge = function resolveLegacyDeepAuthBadge(isHandmade) {
            if (isHandmade === true) {
                return '<span class="px-2 py-1 bg-emerald-900/50 text-emerald-300 text-[10px] font-mono rounded border border-emerald-500/30">✅ HANDMADE</span>';
            }
            if (isHandmade === false) {
                return '<span class="px-2 py-1 bg-red-900/50 text-red-300 text-[10px] font-mono rounded border border-red-500/30">⚠️ MACHINE-MADE</span>';
            }
            return '<span class="px-2 py-1 bg-zinc-800/50 text-zinc-400 text-[10px] font-mono rounded border border-zinc-500/30">❓ UNCERTAIN</span>';
        };
    }

    if (typeof priceUtils.resolveLegacyDeepAuthBadgeHtml !== 'function') {
        priceUtils.resolveLegacyDeepAuthBadgeHtml = function resolveLegacyDeepAuthBadgeHtml(isHandmade) {
            if (typeof priceUtils.resolveLegacyDeepAuthBadge === 'function') {
                return priceUtils.resolveLegacyDeepAuthBadge(isHandmade);
            }
            if (isHandmade === true) {
                return '<span class="px-2 py-1 bg-emerald-900/50 text-emerald-300 text-[10px] font-mono rounded border border-emerald-500/30">HANDMADE</span>';
            }
            if (isHandmade === false) {
                return '<span class="px-2 py-1 bg-red-900/50 text-red-300 text-[10px] font-mono rounded border border-red-500/30">MACHINE-MADE</span>';
            }
            return '<span class="px-2 py-1 bg-zinc-800/50 text-zinc-400 text-[10px] font-mono rounded border border-zinc-500/30">UNCERTAIN</span>';
        };
    }

    if (typeof priceUtils.buildAnalyzeDeepResultPayload !== 'function') {
        priceUtils.buildAnalyzeDeepResultPayload = function buildAnalyzeDeepResultPayload(
            itemCategory,
            smartPrice,
            analysis,
            deepAnalysis,
            itemDisplayNames
        ) {
            return {
                item: {
                    category: itemCategory,
                    displayName: itemDisplayNames[itemCategory] || itemCategory
                },
                priceData: {
                    prices: smartPrice.prices,
                    isSimulated: false
                },
                analysis: analysis,
                verdict: analysis.verdict,
                recommendation: analysis.recommendation,
                deepAnalysis: deepAnalysis
            };
        };
    }

    if (typeof priceUtils.resolveAnalyzeDeepResultPayload !== 'function') {
        priceUtils.resolveAnalyzeDeepResultPayload = function resolveAnalyzeDeepResultPayload(
            itemCategory,
            smartPrice,
            analysis,
            deepAnalysis,
            itemDisplayNames
        ) {
            if (typeof priceUtils.buildAnalyzeDeepResultPayload === 'function') {
                return priceUtils.buildAnalyzeDeepResultPayload(
                    itemCategory,
                    smartPrice,
                    analysis,
                    deepAnalysis,
                    itemDisplayNames
                );
            }
            return {
                item: {
                    category: itemCategory,
                    displayName: itemDisplayNames[itemCategory] || itemCategory
                },
                priceData: {
                    prices: smartPrice.prices,
                    isSimulated: false
                },
                analysis: analysis,
                verdict: analysis.verdict,
                recommendation: analysis.recommendation,
                deepAnalysis: deepAnalysis
            };
        };
    }

    if (typeof priceUtils.runAnalyzeDeepStandardFallback !== 'function') {
        priceUtils.runAnalyzeDeepStandardFallback = async function runAnalyzeDeepStandardFallback(
            checker,
            itemCategory,
            vendorPrice,
            showResultsViewFn,
            showToastFn
        ) {
            try {
                const result = await checker.analyzePrice(itemCategory, vendorPrice);
                if (typeof showResultsViewFn === 'function') {
                    showResultsViewFn(result);
                }
                return true;
            } catch (error) {
                if (typeof showToastFn === 'function') {
                    showToastFn('Analysis failed: ' + error.message, 'error');
                }
                return false;
            }
        };
    }

    if (typeof priceUtils.resolveAnalyzeDeepVendorPrice !== 'function') {
        priceUtils.resolveAnalyzeDeepVendorPrice = function resolveAnalyzeDeepVendorPrice(documentObj) {
            return parseInt(documentObj.getElementById('deep-vendor-price')?.value, 10);
        };
    }

    if (typeof priceUtils.ensureAnalyzeDeepVendorPrice !== 'function') {
        priceUtils.ensureAnalyzeDeepVendorPrice = function ensureAnalyzeDeepVendorPrice(vendorPrice, showToastFn) {
            if (!vendorPrice || vendorPrice <= 0) {
                if (typeof showToastFn === 'function') {
                    showToastFn('Enter a valid price', 'warning');
                }
                return false;
            }
            return true;
        };
    }

    if (typeof priceUtils.resolveAnalyzeDeepContext !== 'function') {
        priceUtils.resolveAnalyzeDeepContext = function resolveAnalyzeDeepContext(checker) {
            const classification = checker?.currentClassification;
            return {
                classification,
                itemCategory: classification?.topPrediction?.label,
                smartPrice: classification?.smartPrice
            };
        };
    }

    if (typeof priceUtils.runAnalyzeDeepScamCheck !== 'function') {
        priceUtils.runAnalyzeDeepScamCheck = function runAnalyzeDeepScamCheck(vendorPrice, smartPrice, ScamDetectorCtor) {
            const scamDetector = new ScamDetectorCtor();
            return scamDetector.analyze(vendorPrice, { prices: smartPrice.prices });
        };
    }

    if (typeof priceUtils.resolveAnalyzeDeepPriceFlow !== 'function') {
        priceUtils.resolveAnalyzeDeepPriceFlow = async function resolveAnalyzeDeepPriceFlow(
            checker,
            vendorPrice,
            resolveAnalyzeDeepContextFn,
            runAnalyzeDeepStandardFallbackFn,
            runAnalyzeDeepScamCheckFn,
            buildAnalyzeDeepResultPayloadFn,
            showResultsViewFn
        ) {
            const analyzeDeepCtx = typeof resolveAnalyzeDeepContextFn === 'function'
                ? resolveAnalyzeDeepContextFn(checker)
                : null;
            const classification = analyzeDeepCtx?.classification;
            if (!classification) return false;

            const itemCategory = analyzeDeepCtx.itemCategory;
            const smartPrice = analyzeDeepCtx.smartPrice;
            if (!smartPrice) {
                if (typeof runAnalyzeDeepStandardFallbackFn === 'function') {
                    await runAnalyzeDeepStandardFallbackFn(checker, itemCategory, vendorPrice);
                }
                return true;
            }

            const analysis = typeof runAnalyzeDeepScamCheckFn === 'function'
                ? runAnalyzeDeepScamCheckFn(vendorPrice, smartPrice)
                : null;
            const deepResultPayload = typeof buildAnalyzeDeepResultPayloadFn === 'function'
                ? buildAnalyzeDeepResultPayloadFn(itemCategory, smartPrice, analysis, classification.deepAnalysis)
                : null;
            if (typeof showResultsViewFn === 'function') {
                showResultsViewFn(deepResultPayload);
            }
            return true;
        };
    }

    if (typeof priceUtils.runAnalyzeDeepAction !== 'function') {
        priceUtils.runAnalyzeDeepAction = async function runAnalyzeDeepAction(
            getPriceCheckerFn,
            resolveAnalyzeDeepVendorPriceFn,
            ensureAnalyzeDeepVendorPriceFn,
            runAnalyzeDeepPriceFlowFn
        ) {
            const checker = typeof getPriceCheckerFn === 'function'
                ? getPriceCheckerFn()
                : null;
            const vendorPrice = typeof resolveAnalyzeDeepVendorPriceFn === 'function'
                ? resolveAnalyzeDeepVendorPriceFn()
                : null;
            const hasValidVendorPrice = typeof ensureAnalyzeDeepVendorPriceFn === 'function'
                ? ensureAnalyzeDeepVendorPriceFn(vendorPrice)
                : !!(vendorPrice && vendorPrice > 0);
            if (!hasValidVendorPrice) {
                return false;
            }

            if (typeof runAnalyzeDeepPriceFlowFn === 'function') {
                await runAnalyzeDeepPriceFlowFn(checker, vendorPrice);
                return true;
            }
            return false;
        };
    }

    if (typeof priceUtils.getLegacyManualSelectorCategories !== 'function') {
        priceUtils.getLegacyManualSelectorCategories = function getLegacyManualSelectorCategories() {
            return [
                { id: 'tagine_pot_large', name: 'Tagine Pot (Large)', icon: '🫕', fair: 250 },
                { id: 'tagine_pot_small', name: 'Tagine Pot (Small)', icon: '🍲', fair: 100 },
                { id: 'ceramic_bowl', name: 'Ceramic Bowl', icon: '🥣', fair: 100 },
                { id: 'ceramic_plate', name: 'Ceramic Plate', icon: '🍽️', fair: 120 },
                { id: 'leather_bag', name: 'Leather Bag', icon: '👜', fair: 350 },
                { id: 'leather_wallet', name: 'Leather Wallet', icon: '👛', fair: 200 },
                { id: 'babouche_embroidered', name: 'Embroidered Babouche', icon: '🥿', fair: 350 },
                { id: 'babouche_plain', name: 'Plain Babouche', icon: '👞', fair: 180 },
                { id: 'rug_small', name: 'Small Rug', icon: '🧶', fair: 1200 },
                { id: 'lantern_brass', name: 'Brass Lantern', icon: '🏮', fair: 200 },
                { id: 'argan_oil', name: 'Argan Oil', icon: '🫙', fair: 150 },
                { id: 'jewelry_silver', name: 'Silver Jewelry', icon: '💍', fair: 400 }
            ];
        };
    }

    if (typeof priceUtils.buildLegacyManualSelectorModalHtml !== 'function') {
        priceUtils.buildLegacyManualSelectorModalHtml = function buildLegacyManualSelectorModalHtml(categories, imageBase64) {
            return `
            <div id="manual-category-modal" 
                 class="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
                 style="animation: fadeIn 0.2s ease-in;">
                <div class="bg-void-900 border-2 border-signal-amber rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-lg">
                    <div class="sticky top-0 bg-void-900 border-b border-void-700 p-4 z-10">
                        <div class="flex items-center justify-between">
                            <div>
                                <h2 class="text-signal-amber font-mono font-bold text-lg">📸 IDENTIFY ITEM</h2>
                                <p class="text-zinc-400 text-xs mt-1">Select what you photographed</p>
                            </div>
                            <button onclick="window.closeManualSelector(null)" 
                                    class="text-zinc-500 hover:text-zinc-300 text-2xl leading-none">✕</button>
                        </div>
                    </div>
                    ${imageBase64 ? `
                    <div class="p-4 border-b border-void-700 bg-void-950">
                        <img src="${imageBase64}" 
                             class="w-full h-48 object-contain rounded-lg border border-void-600 bg-void-800"
                             alt="Your photo">
                    </div>` : ''}
                    <div class="p-4 overflow-y-auto max-h-[50vh]">
                        <div class="grid grid-cols-2 gap-3">
                            ${categories.map(cat => `
                                <button onclick="window.selectManualCategory('${cat.id}', '${cat.name}')"
                                    class="group p-3 bg-void-800 hover:bg-void-700 border border-void-600 hover:border-signal-emerald rounded-lg text-left transition-all active:scale-95">
                                    <div class="text-3xl mb-1">${cat.icon}</div>
                                    <div class="text-zinc-100 font-medium text-sm group-hover:text-signal-emerald">${cat.name}</div>
                                    <div class="text-zinc-500 text-[10px] mt-1">Fair: <span class="text-signal-emerald">${cat.fair} DH</span></div>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    <div class="sticky bottom-0 bg-void-900 border-t border-void-700 p-4">
                        <button onclick="window.closeManualSelector(null)" 
                                class="w-full py-3 bg-void-700 hover:bg-void-600 text-zinc-400 font-mono text-sm rounded-lg transition-colors">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
        };
    }

    if (typeof priceUtils.mountLegacyManualSelectorModal !== 'function') {
        priceUtils.mountLegacyManualSelectorModal = function mountLegacyManualSelectorModal(documentObj, modalHTML) {
            documentObj.body.insertAdjacentHTML('beforeend', modalHTML);
        };
    }

    if (typeof priceUtils.storeLegacyManualSelectorResolve !== 'function') {
        priceUtils.storeLegacyManualSelectorResolve = function storeLegacyManualSelectorResolve(windowObjParam, resolveFn) {
            windowObjParam._manualCategoryResolve = resolveFn;
        };
    }

    if (typeof priceUtils.openLegacyManualSelectorModal !== 'function') {
        priceUtils.openLegacyManualSelectorModal = function openLegacyManualSelectorModal(
            windowObjParam,
            documentObj,
            modalHTML,
            resolveFn
        ) {
            if (typeof priceUtils.mountLegacyManualSelectorModal === 'function') {
                priceUtils.mountLegacyManualSelectorModal(documentObj, modalHTML);
            } else {
                documentObj.body.insertAdjacentHTML('beforeend', modalHTML);
            }

            if (typeof priceUtils.storeLegacyManualSelectorResolve === 'function') {
                priceUtils.storeLegacyManualSelectorResolve(windowObjParam, resolveFn);
            } else {
                windowObjParam._manualCategoryResolve = resolveFn;
            }
        };
    }

    if (typeof priceUtils.removeLegacyManualSelectorModal !== 'function') {
        priceUtils.removeLegacyManualSelectorModal = function removeLegacyManualSelectorModal(documentObj) {
            const modal = documentObj.getElementById('manual-category-modal');
            if (modal) modal.remove();
        };
    }

    if (typeof priceUtils.buildLegacyManualSelectionResult !== 'function') {
        priceUtils.buildLegacyManualSelectionResult = function buildLegacyManualSelectionResult(itemId, itemName) {
            return {
                topPrediction: {
                    label: itemId,
                    displayName: itemName,
                    confidence: 1.0
                },
                confidence: 1.0,
                method: 'manual_selection',
                alternatives: []
            };
        };
    }

    if (typeof priceUtils.resolveLegacyManualSelectionResult !== 'function') {
        priceUtils.resolveLegacyManualSelectionResult = function resolveLegacyManualSelectionResult(itemId, itemName) {
            if (typeof priceUtils.buildLegacyManualSelectionResult === 'function') {
                return priceUtils.buildLegacyManualSelectionResult(itemId, itemName);
            }
            return {
                topPrediction: {
                    label: itemId,
                    displayName: itemName,
                    confidence: 1.0
                },
                confidence: 1.0,
                method: 'manual_selection',
                alternatives: []
            };
        };
    }

    if (typeof priceUtils.resolveLegacyManualSelection !== 'function') {
        priceUtils.resolveLegacyManualSelection = function resolveLegacyManualSelection(windowObjParam, result) {
            if (windowObjParam._manualCategoryResolve) {
                windowObjParam._manualCategoryResolve(result);
                windowObjParam._manualCategoryResolve = null;
            }
        };
    }

    if (typeof priceUtils.finalizeLegacyManualSelection !== 'function') {
        priceUtils.finalizeLegacyManualSelection = function finalizeLegacyManualSelection(windowObjParam, documentObj, result) {
            if (typeof priceUtils.removeLegacyManualSelectorModal === 'function') {
                priceUtils.removeLegacyManualSelectorModal(documentObj);
            } else {
                const modal = documentObj.getElementById('manual-category-modal');
                if (modal) modal.remove();
            }

            if (typeof priceUtils.resolveLegacyManualSelection === 'function') {
                priceUtils.resolveLegacyManualSelection(windowObjParam, result);
                return;
            }

            if (windowObjParam && windowObjParam._manualCategoryResolve) {
                windowObjParam._manualCategoryResolve(result);
                windowObjParam._manualCategoryResolve = null;
            }
        };
    }

    if (typeof priceUtils.resolveLegacyManualSelectionFinalize !== 'function') {
        priceUtils.resolveLegacyManualSelectionFinalize = function resolveLegacyManualSelectionFinalize(windowObjParam, documentObj, result) {
            if (typeof priceUtils.finalizeLegacyManualSelection === 'function') {
                priceUtils.finalizeLegacyManualSelection(windowObjParam, documentObj, result);
                return;
            }

            const modal = documentObj.getElementById('manual-category-modal');
            if (modal) modal.remove();
            if (windowObjParam && windowObjParam._manualCategoryResolve) {
                windowObjParam._manualCategoryResolve(result);
                windowObjParam._manualCategoryResolve = null;
            }
        };
    }

    if (typeof priceUtils.buildLegacyDeepQuickPriceButtonsHtml !== 'function') {
        priceUtils.buildLegacyDeepQuickPriceButtonsHtml = function buildLegacyDeepQuickPriceButtonsHtml(smartPrice) {
            return [smartPrice.prices.p25, smartPrice.prices.median, smartPrice.prices.p75,
                Math.round(smartPrice.prices.p75 * 1.5), Math.round(smartPrice.prices.p75 * 2.5)]
                .map(p => `<button onclick="document.getElementById('deep-vendor-price').value=${p}"
                                class="px-2.5 py-1 bg-void-700 text-zinc-300 text-[11px] rounded hover:bg-zinc-600 transition-colors font-mono">${p}</button>`).join('');
        };
    }

    if (typeof priceUtils.buildLegacyDeepBaseAdjustmentText !== 'function') {
        priceUtils.buildLegacyDeepBaseAdjustmentText = function buildLegacyDeepBaseAdjustmentText(baseMedian, qualityMultiplier, adjustedMedian) {
            return `Base: ${baseMedian} DH × ${qualityMultiplier.toFixed(1)} quality = ${adjustedMedian} DH`;
        };
    }

    if (typeof priceUtils.buildLegacyDeepReasoningHtml !== 'function') {
        priceUtils.buildLegacyDeepReasoningHtml = function buildLegacyDeepReasoningHtml(reasoning) {
            if (!reasoning) return '';
            return `
            <div class="bg-void-900/30 rounded-xl p-4 border border-void-800">
                <div class="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-1">🧠 AI REASONING</div>
                <p class="text-xs text-zinc-300 leading-relaxed">${reasoning}</p>
            </div>`;
        };
    }

    if (typeof priceUtils.resolveLegacyDeepReasoningHtml !== 'function') {
        priceUtils.resolveLegacyDeepReasoningHtml = function resolveLegacyDeepReasoningHtml(reasoning) {
            if (typeof priceUtils.buildLegacyDeepReasoningHtml === 'function') {
                return priceUtils.buildLegacyDeepReasoningHtml(reasoning);
            }
            if (!reasoning) return '';
            return `
            <div class="bg-void-900/30 rounded-xl p-4 border border-void-800">
                <div class="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-1">🧠 AI REASONING</div>
                <p class="text-xs text-zinc-300 leading-relaxed">${reasoning}</p>
            </div>`;
        };
    }

    if (typeof priceUtils.resolveLegacyDeepQuickPricingContent !== 'function') {
        priceUtils.resolveLegacyDeepQuickPricingContent = function resolveLegacyDeepQuickPricingContent(smartPrice, qualityMultiplier) {
            if (!smartPrice) {
                return {
                    deepQuickButtonsHtml: '',
                    deepBaseAdjustText: ''
                };
            }

            const deepQuickButtonsHtml = typeof priceUtils.buildLegacyDeepQuickPriceButtonsHtml === 'function'
                ? priceUtils.buildLegacyDeepQuickPriceButtonsHtml(smartPrice)
                : [smartPrice.prices.p25, smartPrice.prices.median, smartPrice.prices.p75,
                    Math.round(smartPrice.prices.p75 * 1.5), Math.round(smartPrice.prices.p75 * 2.5)]
                    .map(p => `<button onclick="document.getElementById('deep-vendor-price').value=${p}"
                                class="px-2.5 py-1 bg-void-700 text-zinc-300 text-[11px] rounded hover:bg-zinc-600 transition-colors font-mono">${p}</button>`).join('');

            const deepBaseAdjustText = typeof priceUtils.buildLegacyDeepBaseAdjustmentText === 'function'
                ? priceUtils.buildLegacyDeepBaseAdjustmentText(smartPrice.basePrices.median, qualityMultiplier, smartPrice.prices.median)
                : `Base: ${smartPrice.basePrices.median} DH × ${qualityMultiplier.toFixed(1)} quality = ${smartPrice.prices.median} DH`;

            return {
                deepQuickButtonsHtml,
                deepBaseAdjustText
            };
        };
    }

    if (typeof priceUtils.buildLegacyDeepResultsViewHtml !== 'function') {
        priceUtils.buildLegacyDeepResultsViewHtml = function buildLegacyDeepResultsViewHtml(payload) {
            const deep = payload.deep || {};
            const smartPrice = payload.smartPrice;
            const item = payload.item || {};
            return `
        <div class="space-y-4 animate-[slide-up-fade_0.4s_ease-out]">
            <!-- Item Identification -->
            <div class="bg-void-800/50 rounded-xl p-4 border border-void-700/50">
                <div class="flex items-center gap-3">
                    <div class="text-4xl">${item.displayName.split(' ')[0]}</div>
                    <div class="flex-1">
                        <div class="font-semibold text-white text-lg">${item.displayName}</div>
                        <div class="text-xs text-zinc-400 mt-1">
                            Confidence: ${Math.round(item.confidence * 100)}%
                            ${deep.item?.subtype ? ` • ${deep.item.subtype.replace(/_/g, ' ')}` : ''}
                        </div>
                    </div>
                    ${payload.authBadge}
                </div>
            </div>

            <!-- Quality Tier Banner -->
            <div class="${payload.qualityBg} border rounded-xl p-4 text-center">
                <div class="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 mb-1">QUALITY ASSESSMENT</div>
                <div class="text-2xl font-bold ${payload.qualityColor} font-mono">${payload.qualityTier}</div>
                <div class="text-xs text-zinc-400 mt-1">Quality Multiplier: ${payload.qm.toFixed(1)}x</div>
            </div>

            <!-- Score Breakdown -->
            <div class="bg-void-900/50 rounded-xl p-4 border border-void-700/50 space-y-3">
                <div class="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-2">DETAILED SCORES</div>
                ${payload.scoreBar('Material', deep.material?.score || 0)}
                ${payload.scoreBar('Craft', deep.craftsmanship?.score || 0)}
                ${payload.scoreBar('Condition', deep.condition?.score || 0)}

                <div class="pt-2 border-t border-void-700 mt-2 space-y-1">
                    ${deep.material?.type ? `<div class="text-xs text-zinc-400">📦 Material: <span class="text-zinc-200">${deep.material.type.replace(/_/g, ' ')}</span></div>` : ''}
                    ${deep.craftsmanship?.technique ? `<div class="text-xs text-zinc-400">🔨 Technique: <span class="text-zinc-200">${deep.craftsmanship.technique.replace(/_/g, ' ')}</span></div>` : ''}
                    ${deep.condition?.wear ? `<div class="text-xs text-zinc-400">🔍 Wear: <span class="text-zinc-200">${deep.condition.wear}</span></div>` : ''}
                    ${deep.condition?.age ? `<div class="text-xs text-zinc-400">📅 Age: <span class="text-zinc-200">${deep.condition.age}</span></div>` : ''}
                </div>

                ${deep.material?.indicators?.length > 0 ? `
                <div class="flex flex-wrap gap-1 mt-2">
                    ${deep.material.indicators.map(i => `<span class="px-2 py-0.5 bg-emerald-900/30 text-emerald-400 text-[10px] font-mono rounded">${i.replace(/_/g, ' ')}</span>`).join('')}
                </div>` : ''}

                ${payload.redFlagsHTML}
            </div>

            <!-- Smart Price Section -->
            ${smartPrice ? `
            <div class="bg-void-900/50 rounded-xl p-4 border border-signal-amber/30">
                <div class="text-[10px] text-signal-amber font-mono uppercase tracking-widest mb-3">💰 QUALITY-ADJUSTED FAIR PRICE</div>
                <div class="grid grid-cols-3 gap-2 text-center mb-3">
                    <div class="p-2 bg-void-800/50 rounded-lg">
                        <div class="text-[9px] text-zinc-500 uppercase">Low</div>
                        <div class="text-lg font-bold font-mono text-zinc-300">${smartPrice.prices.p25}</div>
                        <div class="text-[9px] text-zinc-500">DH</div>
                    </div>
                    <div class="p-2 bg-signal-amber/10 rounded-lg border border-signal-amber/30">
                        <div class="text-[9px] text-signal-amber uppercase">Fair</div>
                        <div class="text-xl font-bold font-mono text-signal-amber">${smartPrice.prices.median}</div>
                        <div class="text-[9px] text-signal-amber">DH</div>
                    </div>
                    <div class="p-2 bg-void-800/50 rounded-lg">
                        <div class="text-[9px] text-zinc-500 uppercase">High</div>
                        <div class="text-lg font-bold font-mono text-zinc-300">${smartPrice.prices.p75}</div>
                        <div class="text-[9px] text-zinc-500">DH</div>
                    </div>
                </div>

                <div class="text-[10px] text-zinc-500 text-center">
                    ${payload.deepBaseAdjustText}
                </div>

                <!-- Vendor Price Check -->
                <div class="mt-4 pt-3 border-t border-void-700">
                    <label for="deep-vendor-price" class="block text-xs font-medium text-zinc-400 mb-2 font-mono uppercase tracking-wide">
                        VENDOR ASKING PRICE (DH)
                    </label>
                    <div class="flex gap-2">
                        <input type="number" id="deep-vendor-price" name="deep_vendor_price" placeholder="e.g. 1500"
                            class="flex-1 bg-void-950 border border-void-700 rounded-lg px-4 py-3 text-white text-lg font-mono focus:border-signal-amber focus:ring-1 focus:ring-signal-amber outline-none transition-all"
                            min="0" step="10">
                        <button onclick="window.analyzeDeepPrice()"
                            class="px-5 py-3 bg-signal-amber text-black font-bold rounded-lg hover:bg-amber-400 transition-colors shadow-lg font-mono text-xs tracking-wide">
                            CHECK 🔎
                        </button>
                    </div>
                    <div class="mt-2 flex gap-1.5 flex-wrap justify-center">
                        ${payload.deepQuickButtonsHtml}
                    </div>
                </div>
            </div>` : ''}

            <!-- AI Reasoning -->
            ${payload.deepReasoningHtml}

            <!-- Response Time -->
            <div class="text-center text-[10px] text-zinc-600 font-mono">
                Analyzed in ${deep.responseTime || 0}ms via Gemini Deep Vision
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-3">
                <button onclick="window.cancelPriceCheck()"
                    class="flex-1 py-3 bg-void-700 text-white rounded-xl hover:bg-zinc-600 transition-all font-bold font-mono text-xs uppercase tracking-wide">
                    ← NEW SCAN
                </button>
                <button onclick="window.savePriceCheckResult()"
                    class="flex-1 py-3 bg-signal-cyan/20 text-signal-cyan border border-signal-cyan/30 rounded-xl hover:bg-signal-cyan/30 transition-all font-bold font-mono text-xs uppercase tracking-wide">
                    💾 SAVE
                </button>
            </div>
        </div>
    `;
        };
    }

    if (typeof priceUtils.resolveLegacyDeepResultsRenderFlow !== 'function') {
        priceUtils.resolveLegacyDeepResultsRenderFlow = function resolveLegacyDeepResultsRenderFlow(
            classification,
            resolveLegacyDeepResultsContainerFn,
            resolveLegacyDeepQualityThemeFn,
            createLegacyDeepScoreBarFn,
            resolveLegacyDeepRedFlagsHtmlFn,
            resolveLegacyDeepAuthBadgeHtmlFn,
            resolveLegacyDeepQuickPricingContentFn,
            resolveLegacyDeepReasoningHtmlFn,
            buildLegacyDeepResultsViewHtmlFn
        ) {
            const deep = classification?.deepAnalysis || {};
            const smartPrice = classification?.smartPrice;
            const item = classification?.topPrediction || {};
            const resultsView = typeof resolveLegacyDeepResultsContainerFn === 'function'
                ? resolveLegacyDeepResultsContainerFn()
                : null;
            if (!resultsView) return false;

            const qm = deep.quality_multiplier || 1.0;
            const qualityTheme = typeof resolveLegacyDeepQualityThemeFn === 'function'
                ? resolveLegacyDeepQualityThemeFn(qm)
                : {};
            const scoreBar = typeof createLegacyDeepScoreBarFn === 'function'
                ? createLegacyDeepScoreBarFn()
                : null;
            const redFlagsHTML = typeof resolveLegacyDeepRedFlagsHtmlFn === 'function'
                ? resolveLegacyDeepRedFlagsHtmlFn(deep.authenticity)
                : '';
            const isHandmade = deep.authenticity?.genuine_handmade;
            const authBadge = typeof resolveLegacyDeepAuthBadgeHtmlFn === 'function'
                ? resolveLegacyDeepAuthBadgeHtmlFn(isHandmade)
                : '';
            const quickPricingContent = typeof resolveLegacyDeepQuickPricingContentFn === 'function'
                ? resolveLegacyDeepQuickPricingContentFn(smartPrice, qm)
                : { deepQuickButtonsHtml: '', deepBaseAdjustText: '' };
            const deepReasoningHtml = typeof resolveLegacyDeepReasoningHtmlFn === 'function'
                ? resolveLegacyDeepReasoningHtmlFn(deep.reasoning)
                : '';

            const resultHTML = typeof buildLegacyDeepResultsViewHtmlFn === 'function'
                ? buildLegacyDeepResultsViewHtmlFn({
                    deep,
                    smartPrice,
                    item,
                    qm,
                    qualityTier: qualityTheme.qualityTier,
                    qualityColor: qualityTheme.qualityColor,
                    qualityBg: qualityTheme.qualityBg,
                    authBadge,
                    redFlagsHTML,
                    deepQuickButtonsHtml: quickPricingContent.deepQuickButtonsHtml,
                    deepBaseAdjustText: quickPricingContent.deepBaseAdjustText,
                    deepReasoningHtml,
                    scoreBar
                })
                : '';
            resultsView.innerHTML = resultHTML;
            return true;
        };
    }

    if (typeof priceUtils.fileToBase64 !== 'function') {
        priceUtils.fileToBase64 = function fileToBase64(file) {
            if (typeof priceUtils.blobToBase64 === 'function') {
                return priceUtils.blobToBase64(file);
            }
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        };
    }

    if (typeof priceUtils.showLegacyDeepResultsContainer !== 'function') {
        priceUtils.showLegacyDeepResultsContainer = function showLegacyDeepResultsContainer(documentObj) {
            documentObj.getElementById('price-check-input').classList.add('hidden');
            const resultsView = documentObj.getElementById('price-check-results');
            if (resultsView) resultsView.classList.remove('hidden');
            return resultsView;
        };
    }

    if (typeof priceUtils.buildUploadDeepClassification !== 'function') {
        priceUtils.buildUploadDeepClassification = function buildUploadDeepClassification(deepResult, itemDisplayNames) {
            const itemId = deepResult.item?.item_id || 'generic_item';
            return {
                topPrediction: {
                    label: itemId,
                    displayName: itemDisplayNames[itemId] || itemId,
                    confidence: deepResult.item?.confidence || 0.8
                },
                confidence: deepResult.item?.confidence || 0.8,
                reasoning: deepResult.reasoning,
                method: 'deep_analysis',
                deepAnalysis: deepResult,
                alternatives: []
            };
        };
    }

    if (typeof priceUtils.resolveUploadDeepClassification !== 'function') {
        priceUtils.resolveUploadDeepClassification = function resolveUploadDeepClassification(deepResult, itemDisplayNames) {
            if (typeof priceUtils.buildUploadDeepClassification === 'function') {
                return priceUtils.buildUploadDeepClassification(deepResult, itemDisplayNames);
            }
            const itemId = deepResult.item?.item_id || 'generic_item';
            return {
                topPrediction: {
                    label: itemId,
                    displayName: itemDisplayNames[itemId] || itemId,
                    confidence: deepResult.item?.confidence || 0.8
                },
                confidence: deepResult.item?.confidence || 0.8,
                reasoning: deepResult.reasoning,
                method: 'deep_analysis',
                deepAnalysis: deepResult,
                alternatives: []
            };
        };
    }

    if (typeof priceUtils.resolveUploadDeepAnalysisFlow !== 'function') {
        priceUtils.resolveUploadDeepAnalysisFlow = async function resolveUploadDeepAnalysisFlow(
            imageBase64,
            setUploadAnalysisStep,
            DeepImageAnalyzerCtor,
            VisionAPIClientCtor,
            calculateHybridPriceFn,
            resolveUploadDeepClassificationFn,
            itemDisplayNames,
            sleepFn,
            consoleObj
        ) {
            const logger = consoleObj || console;
            logger.log('[UPLOAD] Starting deep single-shot analysis...');

            const deepAnalyzer = new DeepImageAnalyzerCtor();
            const zones = await deepAnalyzer.extractZones(imageBase64);
            setUploadAnalysisStep('AI ANALYZING MATERIAL...', '45%');

            const visionClient = new VisionAPIClientCtor();
            const deepResult = await visionClient.callGeminiDeep(zones);
            setUploadAnalysisStep('CALCULATING FAIR PRICE...', '75%');

            const itemId = deepResult.item?.item_id || 'generic_item';
            const classification = typeof resolveUploadDeepClassificationFn === 'function'
                ? resolveUploadDeepClassificationFn(deepResult, itemDisplayNames)
                : null;
            if (!classification) {
                throw new Error('Failed to build deep upload classification');
            }

            const smartPrice = await calculateHybridPriceFn(deepResult, itemId);
            if (smartPrice) {
                classification.smartPrice = smartPrice;
            }

            setUploadAnalysisStep('ANALYSIS COMPLETE', '100%');
            if (typeof sleepFn === 'function') {
                await sleepFn(400);
            }

            logger.log('[UPLOAD] Deep analysis complete:', {
                item: itemId,
                quality: deepResult.quality_multiplier,
                material: deepResult.material?.score,
                craftsmanship: deepResult.craftsmanship?.score
            });
            return classification;
        };
    }

    if (typeof priceUtils.resolveUploadStandardClassificationFlow !== 'function') {
        priceUtils.resolveUploadStandardClassificationFlow = async function resolveUploadStandardClassificationFlow(
            checker,
            imageBase64,
            file,
            setUploadAnalysisStep
        ) {
            if (typeof setUploadAnalysisStep === 'function') {
                setUploadAnalysisStep('FALLBACK: STANDARD AI...', '60%');
            }
            const classification = await checker.classifier.classify(imageBase64, file);
            if (typeof setUploadAnalysisStep === 'function') {
                setUploadAnalysisStep('COMPLETE', '100%');
            }
            return classification;
        };
    }

    if (typeof priceUtils.resolveUploadLowConfidenceFlow !== 'function') {
        priceUtils.resolveUploadLowConfidenceFlow = async function resolveUploadLowConfidenceFlow(
            classification,
            imageBase64,
            hideUploadAnalyzingViewFn,
            confidenceThreshold,
            resolveUploadManualSelectionFn,
            priceUtilsArg,
            consoleObj
        ) {
            if (!classification) return null;
            if (classification.confidence >= confidenceThreshold) {
                return classification;
            }

            if (consoleObj && typeof consoleObj.warn === 'function') {
                consoleObj.warn('[CAMERA] Low confidence (' + classification.confidence + '), showing manual selector');
            }
            if (typeof hideUploadAnalyzingViewFn === 'function') {
                hideUploadAnalyzingViewFn();
            }
            const manualResult = typeof resolveUploadManualSelectionFn === 'function'
                ? await resolveUploadManualSelectionFn(priceUtilsArg, imageBase64)
                : null;
            if (!manualResult) {
                return null;
            }
            return manualResult;
        };
    }

    if (typeof priceUtils.resolveUploadPipelineClassification !== 'function') {
        priceUtils.resolveUploadPipelineClassification = async function resolveUploadPipelineClassification(
            checker,
            imageBase64,
            file,
            setUploadAnalysisStep,
            hideUploadAnalyzingViewFn,
            runUploadDeepAnalysisFn,
            runUploadStandardClassificationFn,
            resolveUploadManualSelectionFn
        ) {
            try {
                if (typeof runUploadDeepAnalysisFn === 'function') {
                    return await runUploadDeepAnalysisFn(priceUtils, imageBase64, setUploadAnalysisStep);
                }
            } catch (deepError) {
                console.warn('[UPLOAD] ⚠️ Deep analysis failed, falling back to standard...', deepError);
            }

            try {
                if (typeof runUploadStandardClassificationFn === 'function') {
                    return await runUploadStandardClassificationFn(
                        checker,
                        imageBase64,
                        file,
                        setUploadAnalysisStep
                    );
                }
            } catch (error) {
                console.warn('[CAMERA] ⚠️ AI failed, showing manual selector:', error);
            }

            if (typeof hideUploadAnalyzingViewFn === 'function') {
                hideUploadAnalyzingViewFn();
            }
            const manualResult = typeof resolveUploadManualSelectionFn === 'function'
                ? await resolveUploadManualSelectionFn(priceUtils, imageBase64)
                : null;
            if (!manualResult) {
                return null;
            }
            return manualResult;
        };
    }

    if (typeof priceUtils.resolveUploadUnhandledError !== 'function') {
        priceUtils.resolveUploadUnhandledError = async function resolveUploadUnhandledError(
            checker,
            file,
            errorObj,
            hideUploadAnalyzingViewFn,
            fileToBase64Fn,
            showManualCategorySelectorFn,
            resolveUploadManualFallbackFn,
            showUploadInitialFn,
            notifyUploadFallbackErrorFn
        ) {
            try {
                if (typeof hideUploadAnalyzingViewFn === 'function') {
                    hideUploadAnalyzingViewFn();
                }
                const imageBase64 = typeof fileToBase64Fn === 'function'
                    ? await fileToBase64Fn(file)
                    : null;
                const manualResult = typeof showManualCategorySelectorFn === 'function'
                    ? await showManualCategorySelectorFn(imageBase64)
                    : null;
                if (typeof resolveUploadManualFallbackFn === 'function') {
                    resolveUploadManualFallbackFn(manualResult);
                }
            } catch (fallbackError) {
                console.error('[CAMERA] Manual selector also failed:', fallbackError);
                if (typeof showUploadInitialFn === 'function') {
                    showUploadInitialFn();
                }
                if (typeof notifyUploadFallbackErrorFn === 'function') {
                    notifyUploadFallbackErrorFn(errorObj?.message);
                }
            }
        };
    }

    if (typeof priceUtils.resolveUploadStartContext !== 'function') {
        priceUtils.resolveUploadStartContext = function resolveUploadStartContext(
            eventObj,
            getPriceCheckerFn,
            ensurePriceCheckScanQuotaFn,
            consoleObj
        ) {
            const file = eventObj?.target?.files?.[0];
            if (!file) return null;
            if (consoleObj && typeof consoleObj.log === 'function') {
                consoleObj.log('[CAMERA] 📸 Image selected:', file.name);
            }

            const checker = typeof getPriceCheckerFn === 'function'
                ? getPriceCheckerFn()
                : null;
            if (!checker) {
                return null;
            }
            if (typeof ensurePriceCheckScanQuotaFn === 'function') {
                const hasQuota = ensurePriceCheckScanQuotaFn(checker, 'souk_scanner_upload');
                if (!hasQuota) {
                    return null;
                }
            }
            return { file, checker };
        };
    }

    if (typeof priceUtils.createUploadAnalyzingContext !== 'function') {
        priceUtils.createUploadAnalyzingContext = function createUploadAnalyzingContext(
            documentObj,
            priceUtilsArg,
            resolvePriceCheckAnalyzingUiRefsCompatFn,
            createPriceCheckAnalysisStepUpdaterCompatFn,
            hidePriceCheckAnalyzingCompatFn
        ) {
            const uploadUiRefs = typeof resolvePriceCheckAnalyzingUiRefsCompatFn === 'function'
                ? resolvePriceCheckAnalyzingUiRefsCompatFn(priceUtilsArg, {
                    hideInitial: true,
                    showAnalyzing: true
                })
                : null;

            const progressBar = uploadUiRefs?.progressBar || documentObj.getElementById('analysis-progress');
            const statusEl = uploadUiRefs?.statusEl || documentObj.getElementById('analysis-status');
            const setUploadAnalysisStep = typeof createPriceCheckAnalysisStepUpdaterCompatFn === 'function'
                ? createPriceCheckAnalysisStepUpdaterCompatFn(priceUtilsArg, statusEl, progressBar)
                : ((text, width) => {
                    if (statusEl && typeof text === 'string') statusEl.textContent = text;
                    if (progressBar && typeof width === 'string') progressBar.style.width = width;
                });
            const hideUploadAnalyzingView = () => {
                if (typeof hidePriceCheckAnalyzingCompatFn === 'function') {
                    hidePriceCheckAnalyzingCompatFn(priceUtilsArg);
                    return;
                }
                const analyzingView = documentObj.getElementById('price-check-analyzing');
                if (analyzingView) analyzingView.classList.add('hidden');
            };
            return {
                progressBar,
                statusEl,
                setUploadAnalysisStep,
                hideUploadAnalyzingView
            };
        };
    }

    if (typeof priceUtils.resolveUploadImageBase64 !== 'function') {
        priceUtils.resolveUploadImageBase64 = async function resolveUploadImageBase64(
            checker,
            file,
            fileToBase64Fn
        ) {
            const imageBase64 = typeof fileToBase64Fn === 'function'
                ? await fileToBase64Fn(file)
                : null;
            if (checker) {
                checker.currentPhotoBlob = file;
            }
            return imageBase64;
        };
    }

    if (typeof priceUtils.resolveHandleTestImageUploadFlow !== 'function') {
        priceUtils.resolveHandleTestImageUploadFlow = async function resolveHandleTestImageUploadFlow(
            eventObj,
            resolveUploadStartContextFn,
            createUploadAnalyzingContextFn,
            sleepFn,
            resolveUploadImageBase64Fn,
            resolveUploadPipelineClassificationFn,
            resolveUploadLowConfidenceClassificationFn,
            resolveUploadClassificationResultFn,
            resolveUploadUnhandledErrorFn,
            resetUploadInputValueFn,
            consoleObj
        ) {
            const uploadStartCtx = typeof resolveUploadStartContextFn === 'function'
                ? resolveUploadStartContextFn(eventObj)
                : null;
            if (!uploadStartCtx) {
                return false;
            }

            const file = uploadStartCtx.file;
            const checker = uploadStartCtx.checker;
            let hideUploadAnalyzingView = () => {};

            try {
                const uploadAnalyzingCtx = typeof createUploadAnalyzingContextFn === 'function'
                    ? createUploadAnalyzingContextFn()
                    : null;
                hideUploadAnalyzingView = uploadAnalyzingCtx?.hideUploadAnalyzingView || (() => {});
                const setUploadAnalysisStep = uploadAnalyzingCtx?.setUploadAnalysisStep || (() => {});

                setUploadAnalysisStep('LOADING IMAGE...', '15%');
                if (typeof sleepFn === 'function') {
                    await sleepFn();
                }

                const imageBase64 = typeof resolveUploadImageBase64Fn === 'function'
                    ? await resolveUploadImageBase64Fn(checker, file)
                    : null;

                setUploadAnalysisStep('EXTRACTING ZONES...', '25%');

                let classification = typeof resolveUploadPipelineClassificationFn === 'function'
                    ? await resolveUploadPipelineClassificationFn(
                        checker,
                        imageBase64,
                        file,
                        setUploadAnalysisStep,
                        hideUploadAnalyzingView
                    )
                    : null;
                if (!classification) {
                    return false;
                }

                classification = typeof resolveUploadLowConfidenceClassificationFn === 'function'
                    ? await resolveUploadLowConfidenceClassificationFn(
                        classification,
                        imageBase64,
                        hideUploadAnalyzingView
                    )
                    : null;
                if (!classification) {
                    return false;
                }

                checker.currentClassification = classification;
                if (typeof resolveUploadClassificationResultFn === 'function') {
                    resolveUploadClassificationResultFn(classification);
                }
                return true;
            } catch (error) {
                if (consoleObj && typeof consoleObj.error === 'function') {
                    consoleObj.error('[CAMERA] 💥 Upload failed:', error);
                }
                if (typeof resolveUploadUnhandledErrorFn === 'function') {
                    await resolveUploadUnhandledErrorFn(checker, file, hideUploadAnalyzingView, error);
                }
                return false;
            } finally {
                if (typeof resetUploadInputValueFn === 'function') {
                    resetUploadInputValueFn(eventObj);
                }
            }
        };
    }

    if (typeof priceUtils.renderUploadClassificationResult !== 'function') {
        priceUtils.renderUploadClassificationResult = function renderUploadClassificationResult(
            documentObj,
            classification,
            showDeepResultsViewFn,
            showPriceInputViewFn
        ) {
            documentObj.getElementById('price-check-analyzing').classList.add('hidden');
            if (classification.deepAnalysis) {
                showDeepResultsViewFn(classification);
                return;
            }
            showPriceInputViewFn(classification);
        };
    }

    if (typeof priceUtils.resolveUploadClassificationResultView !== 'function') {
        priceUtils.resolveUploadClassificationResultView = function resolveUploadClassificationResultView(
            documentObj,
            classification,
            showDeepResultsViewFn,
            showPriceInputViewFn
        ) {
            if (typeof priceUtils.renderUploadClassificationResult === 'function') {
                priceUtils.renderUploadClassificationResult(
                    documentObj,
                    classification,
                    showDeepResultsViewFn,
                    showPriceInputViewFn
                );
                return;
            }
            documentObj.getElementById('price-check-analyzing').classList.add('hidden');
            if (classification.deepAnalysis) {
                showDeepResultsViewFn(classification);
                return;
            }
            showPriceInputViewFn(classification);
        };
    }

    if (typeof priceUtils.applyUploadManualFallbackResult !== 'function') {
        priceUtils.applyUploadManualFallbackResult = function applyUploadManualFallbackResult(
            documentObj,
            checker,
            manualResult,
            showPriceInputViewFn,
            showToastFn
        ) {
            if (manualResult) {
                checker.currentClassification = manualResult;
                showPriceInputViewFn(manualResult);
                return;
            }

            documentObj.getElementById('price-check-initial').classList.remove('hidden');
            if (typeof showToastFn === 'function') {
                showToastFn('Upload cancelled', 'info');
            }
        };
    }

    if (typeof priceUtils.resolveUploadManualFallbackResult !== 'function') {
        priceUtils.resolveUploadManualFallbackResult = function resolveUploadManualFallbackResult(
            documentObj,
            checker,
            manualResult,
            showPriceInputViewFn,
            showToastFn
        ) {
            if (typeof priceUtils.applyUploadManualFallbackResult === 'function') {
                priceUtils.applyUploadManualFallbackResult(
                    documentObj,
                    checker,
                    manualResult,
                    showPriceInputViewFn,
                    showToastFn
                );
                return;
            }

            if (manualResult) {
                checker.currentClassification = manualResult;
                showPriceInputViewFn(manualResult);
                return;
            }

            documentObj.getElementById('price-check-initial').classList.remove('hidden');
            if (typeof showToastFn === 'function') {
                showToastFn('Upload cancelled', 'info');
            }
        };
    }

    if (typeof priceUtils.showUploadInitialView !== 'function') {
        priceUtils.showUploadInitialView = function showUploadInitialView(documentObj) {
            documentObj.getElementById('price-check-initial').classList.remove('hidden');
        };
    }

    if (typeof priceUtils.resolveUploadManualSelection !== 'function') {
        priceUtils.resolveUploadManualSelection = async function resolveUploadManualSelection(
            documentObj,
            imageBase64,
            showManualCategorySelectorFn
        ) {
            const manualResult = typeof showManualCategorySelectorFn === 'function'
                ? await showManualCategorySelectorFn(imageBase64)
                : null;

            if (manualResult) {
                return manualResult;
            }

            if (typeof priceUtils.showUploadInitialView === 'function') {
                priceUtils.showUploadInitialView(documentObj);
            } else {
                documentObj.getElementById('price-check-initial').classList.remove('hidden');
            }

            return null;
        };
    }

    if (typeof priceUtils.notifyUploadFallbackError !== 'function') {
        priceUtils.notifyUploadFallbackError = function notifyUploadFallbackError(showToastFn, message) {
            if (typeof showToastFn === 'function') {
                showToastFn('ERROR: ' + message, 'error');
            }
        };
    }

    if (typeof priceUtils.resetUploadInputValue !== 'function') {
        priceUtils.resetUploadInputValue = function resetUploadInputValue(eventObj) {
            if (eventObj?.target) {
                eventObj.target.value = '';
            }
        };
    }

    if (typeof priceUtils.ensurePriceCheckCameraAccess !== 'function') {
        priceUtils.ensurePriceCheckCameraAccess = function ensurePriceCheckCameraAccess(
            ensureBasicFeatureAuthFn,
            ensureAiScannerAccessFn
        ) {
            const basicAuthPassed = typeof ensureBasicFeatureAuthFn === 'function'
                ? ensureBasicFeatureAuthFn({
                    source: 'souk_scanner_auth_gate',
                    title: 'Authenticate To Continue',
                    copy: 'Registration is required before using AI scanner. Sign in to unlock INITIATE SCAN on your profile.',
                    meta: 'Sign in once to continue with scanner operations.'
                })
                : true;
            if (!basicAuthPassed) {
                return false;
            }
            if (typeof ensureAiScannerAccessFn === 'function') {
                return !!ensureAiScannerAccessFn('souk_scanner_camera');
            }
            return true;
        };
    }

    if (typeof priceUtils.resolveStartPriceCheckCameraFlow !== 'function') {
        priceUtils.resolveStartPriceCheckCameraFlow = async function resolveStartPriceCheckCameraFlow(
            checker,
            container,
            ensurePriceCheckCameraAccessFn,
            showPriceCheckCameraViewFn,
            startCameraFn,
            handleCameraStartErrorFn,
            consoleObj
        ) {
            const hasCameraAccess = typeof ensurePriceCheckCameraAccessFn === 'function'
                ? ensurePriceCheckCameraAccessFn()
                : true;
            if (!hasCameraAccess) {
                return false;
            }

            try {
                if (typeof showPriceCheckCameraViewFn === 'function') {
                    showPriceCheckCameraViewFn();
                }
                if (typeof startCameraFn === 'function') {
                    await startCameraFn(checker, container);
                }
                return true;
            } catch (error) {
                if (consoleObj && typeof consoleObj.error === 'function') {
                    consoleObj.error('[CAMERA_FLOW] Error:', error);
                }
                if (typeof handleCameraStartErrorFn === 'function') {
                    handleCameraStartErrorFn(error);
                }
                return false;
            }
        };
    }

    if (typeof priceUtils.ensurePriceCheckScanQuota !== 'function') {
        priceUtils.ensurePriceCheckScanQuota = function ensurePriceCheckScanQuota(
            checker,
            source,
            ensureAiScannerAccessFn,
            consumeAiScannerUsageFn,
            onDeniedFn
        ) {
            if (checker?.scanQuotaConsumed) {
                return true;
            }

            const hasAccess = typeof ensureAiScannerAccessFn === 'function'
                ? ensureAiScannerAccessFn(source)
                : true;
            if (!hasAccess) {
                if (typeof onDeniedFn === 'function') {
                    onDeniedFn();
                }
                return false;
            }

            if (typeof consumeAiScannerUsageFn === 'function') {
                consumeAiScannerUsageFn();
            }
            if (checker) {
                checker.scanQuotaConsumed = true;
            }
            return true;
        };
    }

    if (typeof priceUtils.showPriceCheckCameraView !== 'function') {
        priceUtils.showPriceCheckCameraView = function showPriceCheckCameraView(documentObj) {
            documentObj.getElementById('price-check-initial').classList.add('hidden');
            documentObj.getElementById('price-check-camera').classList.remove('hidden');
        };
    }

    if (typeof priceUtils.resolvePriceCheckCameraView !== 'function') {
        priceUtils.resolvePriceCheckCameraView = function resolvePriceCheckCameraView(documentObj) {
            if (typeof priceUtils.showPriceCheckCameraView === 'function') {
                priceUtils.showPriceCheckCameraView(documentObj);
                return;
            }
            documentObj.getElementById('price-check-initial').classList.add('hidden');
            documentObj.getElementById('price-check-camera').classList.remove('hidden');
        };
    }

    if (typeof priceUtils.revertPriceCheckCameraView !== 'function') {
        priceUtils.revertPriceCheckCameraView = function revertPriceCheckCameraView(documentObj) {
            documentObj.getElementById('price-check-initial').classList.remove('hidden');
            documentObj.getElementById('price-check-camera').classList.add('hidden');
        };
    }

    if (typeof priceUtils.resolveRevertPriceCheckCameraView !== 'function') {
        priceUtils.resolveRevertPriceCheckCameraView = function resolveRevertPriceCheckCameraView(documentObj) {
            if (typeof priceUtils.revertPriceCheckCameraView === 'function') {
                priceUtils.revertPriceCheckCameraView(documentObj);
                return;
            }
            documentObj.getElementById('price-check-initial').classList.remove('hidden');
            documentObj.getElementById('price-check-camera').classList.add('hidden');
        };
    }

    if (typeof priceUtils.showPriceCheckFileUploadFallback !== 'function') {
        priceUtils.showPriceCheckFileUploadFallback = function showPriceCheckFileUploadFallback(documentObj) {
            const fallbackEl = documentObj.getElementById('file-upload-fallback');
            if (fallbackEl) {
                fallbackEl.classList.remove('hidden');
            }
        };
    }

    if (typeof priceUtils.resolvePriceCheckFileUploadFallback !== 'function') {
        priceUtils.resolvePriceCheckFileUploadFallback = function resolvePriceCheckFileUploadFallback(documentObj) {
            if (typeof priceUtils.showPriceCheckFileUploadFallback === 'function') {
                priceUtils.showPriceCheckFileUploadFallback(documentObj);
                return;
            }
            const fallbackEl = documentObj.getElementById('file-upload-fallback');
            if (fallbackEl) {
                fallbackEl.classList.remove('hidden');
            }
        };
    }

    if (typeof priceUtils.resolveCameraStartErrorMessage !== 'function') {
        priceUtils.resolveCameraStartErrorMessage = function resolveCameraStartErrorMessage(errorObj) {
            if (errorObj?.name === 'NotAllowedError' || errorObj?.message?.includes('permission')) {
                return 'PERMISSION DENIED: Please enable camera access in your settings.';
            }
            if (errorObj?.message === 'CAMERA_NOT_FOUND') {
                return 'NO CAMERA FOUND: We could not detect a camera on this device.';
            }
            return `SYSTEM ERROR: ${errorObj?.message || 'Unable to access camera.'}`;
        };
    }

    if (typeof priceUtils.resolveCameraStartUserMessage !== 'function') {
        priceUtils.resolveCameraStartUserMessage = function resolveCameraStartUserMessage(errorObj) {
            if (typeof priceUtils.resolveCameraStartErrorMessage === 'function') {
                return priceUtils.resolveCameraStartErrorMessage(errorObj);
            }

            let message = 'Unable to access camera.';
            if (errorObj?.name === 'NotAllowedError' || errorObj?.message?.includes('permission')) {
                message = 'PERMISSION DENIED: Please enable camera access in your settings.';
            } else if (errorObj?.message === 'CAMERA_NOT_FOUND') {
                message = 'NO CAMERA FOUND: We could not detect a camera on this device.';
            } else {
                message = `SYSTEM ERROR: ${errorObj?.message || 'Unable to access camera.'}`;
            }
            return message;
        };
    }

    if (typeof priceUtils.resolveHandleCameraStartError !== 'function') {
        priceUtils.resolveHandleCameraStartError = function resolveHandleCameraStartError(
            errorObj,
            revertPriceCheckCameraViewFn,
            showPriceCheckFileUploadFallbackFn,
            showToastFn,
            resolveCameraStartUserMessageFn,
            consoleObj
        ) {
            if (errorObj?.message === 'CAMERA_SIMULATION_MODE') {
                if (consoleObj && typeof consoleObj.log === 'function') {
                    consoleObj.log('[CAMERA_FLOW] Entering simulation mode - showing file upload');
                }
                if (typeof revertPriceCheckCameraViewFn === 'function') {
                    revertPriceCheckCameraViewFn();
                }
                if (typeof showPriceCheckFileUploadFallbackFn === 'function') {
                    showPriceCheckFileUploadFallbackFn();
                }
                if (typeof showToastFn === 'function') {
                    showToastFn('Camera unavailable - use test image upload', 'info');
                }
                return;
            }

            const userMessage = typeof resolveCameraStartUserMessageFn === 'function'
                ? resolveCameraStartUserMessageFn(errorObj)
                : (typeof priceUtils.resolveCameraStartUserMessage === 'function'
                    ? priceUtils.resolveCameraStartUserMessage(errorObj)
                    : 'Unable to access camera.');
            if (typeof showToastFn === 'function') {
                showToastFn(userMessage, 'error');
            }
            if (typeof revertPriceCheckCameraViewFn === 'function') {
                revertPriceCheckCameraViewFn();
            }
        };
    }

    if (typeof priceUtils.resolvePriceCheckerStartCamera !== 'function') {
        priceUtils.resolvePriceCheckerStartCamera = async function resolvePriceCheckerStartCamera(
            checker,
            containerEl,
            consoleObj
        ) {
            try {
                const stream = await checker.camera.requestCamera();
                const videoEl = containerEl.querySelector('#price-check-video');
                if (videoEl) {
                    videoEl.srcObject = stream;
                    videoEl.setAttribute('playsinline', 'true');
                    videoEl.muted = true;
                    await videoEl.play();
                    if (consoleObj && typeof consoleObj.log === 'function') {
                        consoleObj.log('[CAMERA] Video element playing');
                    }
                }
                checker.scanQuotaConsumed = false;
                checker.state = 'camera';
                return true;
            } catch (error) {
                if (consoleObj && typeof consoleObj.error === 'function') {
                    consoleObj.error('[PRICE_CHECK] startCamera failed:', error);
                }
                throw error;
            }
        };
    }

    if (typeof priceUtils.resolvePriceCheckerStopCamera !== 'function') {
        priceUtils.resolvePriceCheckerStopCamera = function resolvePriceCheckerStopCamera(checker) {
            checker.camera.stopCamera();
            checker.state = 'idle';
            return true;
        };
    }

    if (typeof priceUtils.resolvePriceCheckerCaptureAndAnalyze !== 'function') {
        priceUtils.resolvePriceCheckerCaptureAndAnalyze = async function resolvePriceCheckerCaptureAndAnalyze(
            checker,
            videoEl,
            consoleObj
        ) {
            checker.state = 'analyzing';

            try {
                const photoBlob = await checker.camera.capturePhoto(videoEl);
                checker.currentPhotoBlob = photoBlob;

                checker.stopCamera();

                const tensor = await checker.processor.preprocessImage(photoBlob);
                const classification = await checker.classifier.classify(tensor, photoBlob);

                if (!classification) {
                    checker.state = 'idle';
                    return {
                        needsManualSelection: false,
                        classification: null,
                        cancelled: true
                    };
                }

                checker.currentClassification = classification;

                return {
                    needsManualSelection: false,
                    classification
                };
            } catch (error) {
                if (consoleObj && typeof consoleObj.error === 'function') {
                    consoleObj.error('[PRICE_CHECK] Analysis error:', error);
                }
                checker.state = 'idle';
                throw error;
            }
        };
    }

    if (typeof priceUtils.resolvePriceCheckerCallVisionApi !== 'function') {
        priceUtils.resolvePriceCheckerCallVisionApi = async function resolvePriceCheckerCallVisionApi(
            setTimeoutFn,
            consoleObj
        ) {
            if (consoleObj && typeof consoleObj.log === 'function') {
                consoleObj.log('[HYBRID:CLOUD] Simulating remote recognition protocol...');
            }
            await new Promise((resolve) => setTimeoutFn(resolve, 1500));
            return null;
        };
    }

    if (typeof priceUtils.resolvePriceCheckerAnalyzePrice !== 'function') {
        priceUtils.resolvePriceCheckerAnalyzePrice = async function resolvePriceCheckerAnalyzePrice(
            checker,
            itemCategory,
            vendorPrice,
            itemDisplayNames,
            consoleObj
        ) {
            try {
                const priceData = await checker.priceDB.lookupPrice(itemCategory);
                const analysis = checker.scamDetector.analyze(vendorPrice, priceData);

                checker.state = 'results';

                return {
                    item: {
                        category: itemCategory,
                        displayName: itemDisplayNames[itemCategory] || itemCategory
                    },
                    priceData,
                    analysis,
                    verdict: analysis.verdict,
                    recommendation: analysis.recommendation
                };
            } catch (error) {
                if (consoleObj && typeof consoleObj.error === 'function') {
                    consoleObj.error('[PRICE_CHECK] Price analysis error:', error);
                }
                throw error;
            }
        };
    }

    if (typeof priceUtils.resolvePriceCheckerReset !== 'function') {
        priceUtils.resolvePriceCheckerReset = function resolvePriceCheckerReset(checker) {
            checker.stopCamera();
            checker.currentClassification = null;
            checker.currentPhotoBlob = null;
            checker.state = 'idle';
            checker.scanQuotaConsumed = false;
            return true;
        };
    }

    if (typeof priceUtils.buildPriceCheckerScreenHtml !== 'function') {
        priceUtils.buildPriceCheckerScreenHtml = function buildPriceCheckerScreenHtml(
            simulationMode,
            itemDisplayNames
        ) {
            const simulationBadge = !simulationMode
                ? '<span class="px-3 py-1 bg-void-800 border-l-2 border-purple-500 text-purple-400 text-[9px] font-mono tracking-widest">GEMINI AI LINKED</span>'
                : '<span class="px-3 py-1 bg-void-800 border-l-2 border-signal-amber text-signal-amber text-[9px] font-mono tracking-widest">SIMULATION MODE</span>';
            const itemOptions = Object.entries(itemDisplayNames || {}).map(([key, name]) =>
                `<option value="${key}">${name}</option>`
            ).join('');

            return `
            <div class="space-y-6" id="price-check-container">
                <!-- Header -->
                <div class="flex items-center justify-between">
                    <div class="space-y-1">
                        <h2 class="text-lg font-bold text-white flex items-center gap-2 font-heading tracking-wide">
                             <div class="w-2 h-2 bg-signal-amber rounded-full animate-pulse"></div>
                             THREAT ANALYSIS
                        </h2>
                        <p class="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">AI SCAM DETECTION MODULE</p>
                    </div>
                    ${simulationBadge}
                </div>

                <!-- Initial View (Targeting System) -->
                <div id="price-check-initial" class="space-y-6 animate-[slide-up-fade_0.4s_ease-out]">
                    <div class="relative bg-void-900/40 rounded-xl border border-void-700 p-8 text-center overflow-hidden group">
                        <!-- BG Effects (Optimized: Removed heavy inline gradient) -->
                        <div class="absolute inset-0 opacity-[0.03] bg-grid-pattern"></div>
                        <div class="absolute top-0 right-0 p-3 opacity-30">
                            <svg width="20" height="20" viewBox="0 0 24 24" class="text-signal-amber fill-current"><path d="M0 0h6v2H2v4H0V0zm24 0h-6v2h4v4h2V0zm0 24h-6v-2h4v-4h2v6zM0 24h6v-2H2v-4H0v6z"/></svg>
                        </div>

                        <div class="relative z-10">
                            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-void-800/50 border border-void-600 mb-4 shadow-lg group-hover:scale-110 transition-transform duration-500">
                                <span class="text-3xl">🎯</span>
                            </div>
                            <h3 class="font-sans text-lg font-bold text-white mb-2 uppercase tracking-wide">Target Acquisition</h3>
                            <p class="text-zinc-500 text-xs font-mono mb-8 max-w-[200px] mx-auto leading-relaxed">
                                Deploy AI scanner to analyze market pricing and detect anomalies.
                            </p>

                            <button id="start-camera-btn" onclick="window.startPriceCheckCamera()"
                                class="relative w-full py-4 bg-void-800 hover:bg-void-700 border border-signal-amber/50 text-white font-mono font-bold tracking-widest rounded-lg transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.98] group-hover:border-signal-amber">
                                <div class="absolute inset-0 bg-signal-amber/10 translate-y-full hover:translate-y-0 transition-transform duration-300"></div>
                                <span class="relative flex items-center justify-center gap-3">
                                    <span class="animate-pulse">⦿</span> INITIATE SCAN
                                </span>
                            </button>

                            <!-- Fallback hidden login preserved -->
                             <div id="file-upload-fallback" class="hidden mt-6 animate-[slide-up-fade_0.4s_ease-out]">
                                <div class="border-t border-void-700 pt-4">
                                    <p class="text-[9px] text-signal-amber font-mono mb-3 uppercase tracking-widest">⚠️ SENSOR ERROR - MANUAL OVERRIDE</p>
                                    <input type="file" id="test-image-input" name="test_image_input" aria-label="Upload image for price check" accept="image/*" class="hidden" onchange="window.handleTestImageUpload(event)">
                                    <button onclick="document.getElementById('test-image-input').click()"
                                        class="w-full py-3 bg-void-800 border border-signal-cyan/50 text-signal-cyan font-bold rounded-lg hover:bg-signal-cyan/10 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wide">
                                        <span>📂</span> Upload Intel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Manual Check -->
                    <div class="bg-void-900/30 rounded-lg p-5 border border-void-800">
                        <h4 class="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-3">Manual Input Protocol</h4>
                        <div class="flex gap-2">
                            <select id="manual-item-select" name="manual_item_select" aria-label="Select target type" class="flex-1 bg-void-950 border border-void-700 rounded-md px-3 py-2 text-zinc-300 text-xs font-mono focus:border-signal-amber/50 outline-none transition-colors">
                                <option value="">SELECT TARGET TYPE...</option>
                                ${itemOptions}
                            </select>
                            <button onclick="window.showManualPriceInput()"
                                class="px-4 py-2 bg-void-800 text-zinc-300 border border-void-700 rounded-md hover:bg-void-700 transition-colors text-xs font-bold font-mono">
                                ENTER
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Camera View -->
                <div id="price-check-camera" class="hidden space-y-4">
                    <div class="relative bg-black rounded-xl overflow-hidden aspect-[4/3] border-2 border-void-700 shadow-2xl">
                        <video id="price-check-video" autoplay playsinline muted
                            class="w-full h-full object-cover opacity-80"></video>

                        <!-- Tactical Overlay -->
                        <div class="absolute inset-0 pointer-events-none">
                            <div class="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-signal-amber/70"></div>
                            <div class="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-signal-amber/70"></div>
                            <div class="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-signal-amber/70"></div>
                            <div class="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-signal-amber/70"></div>

                            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-signal-amber/30 rounded-full flex items-center justify-center">
                                <div class="w-1 h-1 bg-signal-amber rounded-full animate-ping"></div>
                            </div>

                            <div class="absolute bottom-6 left-0 w-full text-center">
                                <p class="text-[10px] text-signal-amber font-mono bg-black/50 inline-block px-2 rounded-sm">TARGET LOCKING...</p>
                            </div>
                        </div>
                    </div>

                    <div class="flex gap-3">
                        <button onclick="window.cancelPriceCheck()"
                            class="py-4 px-3 bg-void-900 border border-void-700 text-zinc-500 rounded-lg font-mono text-xs tracking-widest hover:text-white transition-colors">
                            ABORT
                        </button>
                        <button onclick="window.captureForPriceCheck()"
                            class="flex-1 py-4 bg-void-800 border border-void-700 text-zinc-300 font-bold rounded-lg font-mono text-xs tracking-widest hover:bg-void-700 transition-colors">
                            QUICK ID
                        </button>
                        <button onclick="window.handleQuickCapture()"
                            class="flex-1 py-4 bg-signal-emerald/90 text-black font-bold rounded-lg font-mono text-xs tracking-widest hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20">
                            ⚡ DEEP SCAN
                        </button>
                    </div>
                </div>

                <!-- Analyzing View -->
                <div id="price-check-analyzing" class="hidden space-y-6 animate-[slide-up-fade_0.4s_ease-out]">
                    <div class="bg-void-900/50 rounded-xl p-8 text-center border border-void-700 relative overflow-hidden">
                        <div class="absolute inset-0 animate-scan-line z-0"></div>

                        <div class="relative z-10">
                             <div class="inline-block animate-spin text-3xl mb-4 text-signal-cyan">💠</div>
                            <h3 class="text-sm font-bold text-white mb-2 font-mono tracking-widest uppercase">Processing Intel</h3>
                            <p class="text-zinc-500 text-xs font-mono mb-6" id="analysis-status">Decrypting visual data...</p>

                            <div class="w-full bg-void-800 rounded-full h-1 overflow-hidden">
                                <div id="analysis-progress" class="bg-signal-cyan h-full transition-all duration-300 shadow-[0_0_10px_rgba(6,182,212,0.5)]" style="width: 0%"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Input View -->
                 <div id="price-check-input" class="hidden space-y-4">
                     <div class="bg-void-900/50 rounded-xl p-6 border border-void-700 animate-[slide-up-fade_0.4s_ease-out]">
                        <div id="detected-item-display" class="mb-4 text-center">
                            <!-- Filled by JS -->
                        </div>

                        <label for="vendor-price-input" class="block text-xs font-medium text-zinc-400 mb-2 font-mono uppercase tracking-wide">
                            VENDOR QUOTE (DH)
                        </label>
                        <div class="flex gap-3">
                            <input type="number" id="vendor-price-input" name="vendor_price_input" placeholder="e.g. 1500"
                                class="flex-1 bg-void-950 border border-void-700 rounded-lg px-4 py-3 text-white text-lg font-mono focus:border-signal-amber focus:ring-1 focus:ring-signal-amber outline-none transition-all"
                                min="0" step="10">
                            <button onclick="window.analyzePriceNow()"
                                class="px-6 py-3 bg-signal-amber text-black font-bold rounded-lg hover:bg-amber-400 transition-colors shadow-lg font-mono text-xs tracking-wide">
                                ANALYZE 🔎
                            </button>
                        </div>

                        <div class="mt-4 flex gap-2 flex-wrap justify-center border-t border-void-800 pt-4" id="quick-price-buttons">
                        </div>
                    </div>
                </div>

                <!-- Results View -->
                <div id="price-check-results" class="hidden space-y-4">
                    <div id="price-checker-display"></div>
                </div>
            </div>
        `;
        };
    }

    if (typeof priceUtils.resolveRenderPriceChecker !== 'function') {
        priceUtils.resolveRenderPriceChecker = function resolveRenderPriceChecker(
            container,
            checker,
            itemDisplayNames,
            configObj,
            consoleObj
        ) {
            checker.reset();
            container.innerHTML = priceUtils.buildPriceCheckerScreenHtml(
                !!configObj?.SIMULATION_MODE,
                itemDisplayNames
            );
            if (consoleObj && typeof consoleObj.log === 'function') {
                consoleObj.log('[PRICE_CHECK] UI Rendered (Ascended)');
            }
            return true;
        };
    }

    if (typeof priceUtils.resolveBuildPriceCheckerScreenHtml !== 'function') {
        priceUtils.resolveBuildPriceCheckerScreenHtml = function resolveBuildPriceCheckerScreenHtml(
            simulationMode,
            itemDisplayNames
        ) {
            if (typeof priceUtils.buildPriceCheckerScreenHtml === 'function') {
                return priceUtils.buildPriceCheckerScreenHtml(simulationMode, itemDisplayNames);
            }
            return '';
        };
    }
})(typeof window !== 'undefined' ? window : null);
