/**
 * ALIDADE Price Session UI Utilities
 * Extracted from legacy app.js with compatibility hooks.
 */
(function bootstrapPriceSessionUiUtils(windowObj) {
    if (!windowObj) return;

    const priceUtils = windowObj.ALIDADE_PRICE_UTILS || (windowObj.ALIDADE_PRICE_UTILS = {});

    if (typeof priceUtils.buildSessionInsightsHtml !== 'function') {
        priceUtils.buildSessionInsightsHtml = function buildSessionInsightsHtml(insights) {
            if (insights.length > 0) {
                return insights.map((insight) => `
            <div class="flex items-start gap-3 bg-void-800 p-3 rounded">
                <div class="text-xl">${insight.icon}</div>
                <div class="text-sm text-zinc-300 leading-relaxed">${insight.text}</div>
            </div>
        `).join('');
            }

            return '<div class="text-sm text-zinc-500 bg-void-800 p-3 rounded">Run a few scans or negotiations to unlock insights.</div>';
        };
    }

    if (typeof priceUtils.resolveBestCategoryName !== 'function') {
        priceUtils.resolveBestCategoryName = function resolveBestCategoryName(bestCategory, displayNames) {
            if (bestCategory === 'none') return null;
            return displayNames[bestCategory] || bestCategory.replace(/_/g, ' ');
        };
    }

    if (typeof priceUtils.buildSessionSummaryModalHtml !== 'function') {
        priceUtils.buildSessionSummaryModalHtml = function buildSessionSummaryModalHtml(summary, insightsHtml, bestCategoryName) {
            return `
        <div id="session-summary-modal" class="fixed inset-0 bg-black/90 flex items-center justify-center z-[120] p-4">
            <div class="bg-void-900 border border-signal-emerald max-w-md w-full rounded-lg overflow-hidden">
                <div class="bg-gradient-to-r from-signal-emerald to-signal-cyan p-6 text-center">
                    <div class="text-3xl mb-2">🎯</div>
                    <h2 class="text-2xl font-bold text-white">Session Summary</h2>
                    <p class="text-xs text-white/80 mt-1">
                        ${summary.duration.hours}h ${summary.duration.minutes}m active
                    </p>
                </div>
                <div class="p-6 space-y-4">
                    <div class="grid grid-cols-2 gap-3">
                        <div class="bg-void-800 p-4 rounded text-center">
                            <div class="text-3xl font-mono font-bold text-signal-amber">${Math.round(summary.stats.totalSaved)}</div>
                            <div class="text-xs text-zinc-400 mt-1">DH Saved</div>
                        </div>
                        <div class="bg-void-800 p-4 rounded text-center">
                            <div class="text-3xl font-mono font-bold text-signal-emerald">${summary.performance.successRate.toFixed(0)}%</div>
                            <div class="text-xs text-zinc-400 mt-1">Success Rate</div>
                        </div>
                        <div class="bg-void-800 p-4 rounded text-center">
                            <div class="text-3xl font-mono font-bold text-signal-cyan">${summary.stats.negotiations}</div>
                            <div class="text-xs text-zinc-400 mt-1">Negotiations</div>
                        </div>
                        <div class="bg-void-800 p-4 rounded text-center">
                            <div class="text-3xl font-mono font-bold text-purple-400">${summary.stats.placesVisitedCount}</div>
                            <div class="text-xs text-zinc-400 mt-1">Places Visited</div>
                        </div>
                    </div>

                    <div class="space-y-2">
                        <div class="text-xs text-zinc-500 font-mono uppercase">Insights</div>
                        ${insightsHtml}
                    </div>

                    ${bestCategoryName ? `
                    <div class="bg-gradient-to-r from-signal-emerald/10 to-signal-cyan/10 border border-signal-emerald/30 p-4 rounded">
                        <div class="text-xs text-signal-emerald font-mono uppercase mb-1">Best Category</div>
                        <div class="text-lg font-bold text-white">${bestCategoryName}</div>
                    </div>` : ''}

                    <div class="flex gap-3">
                        <button onclick="closeSessionSummary()" class="flex-1 bg-signal-emerald text-black font-bold py-3 rounded">
                            DONE
                        </button>
                        <button onclick="window.sessionIntel.reset(); closeSessionSummary();" class="flex-1 bg-void-800 text-zinc-300 border border-void-700 font-bold py-3 rounded">
                            NEW SESSION
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
        };
    }

    if (typeof priceUtils.buildContributionModalHtml !== 'function') {
        priceUtils.buildContributionModalHtml = function buildContributionModalHtml(haggledPrice, savings, savingsText, savingsIcon, userStats) {
            const rankIcons = { Scout: '🔭', Navigator: '🧭', Pathfinder: '🗺️', Cartographer: '📐', Master: '👑' };

            return `
        <div id="contribution-modal" 
             class="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
             style="animation: fadeIn 0.3s ease-out;">
            <div class="bg-void-900 border border-signal-emerald/50 max-w-md w-full rounded-xl p-6 shadow-2xl shadow-emerald-900/20"
                 style="animation: slideUp 0.3s ease-out;">
                
                <!-- Header -->
                <div class="text-center mb-5">
                    <div class="text-4xl mb-2">${savingsIcon}</div>
                    <h2 class="text-signal-emerald font-mono font-bold text-lg">
                        ${savings > 0 ? 'GREAT HAGGLE!' : 'PRICE RECORDED'}
                    </h2>
                </div>

                <!-- Price Summary -->
                <div class="bg-void-800 rounded-lg p-4 mb-4 border border-void-700">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-zinc-400 text-xs font-mono uppercase">You paid</span>
                        <span class="text-2xl font-mono font-bold text-signal-emerald">${haggledPrice} DH</span>
                    </div>
                    ${savings > 0 ? `
                    <div class="flex justify-between items-center pt-2 border-t border-void-600">
                        <span class="text-zinc-400 text-xs font-mono uppercase">Saved vs asking</span>
                        <span class="text-lg font-mono font-bold text-signal-amber">${savingsText}</span>
                    </div>` : ''}
                </div>

                <!-- Crowdsource Appeal -->
                <div class="bg-signal-cyan/10 border border-signal-cyan/30 rounded-lg p-4 mb-5">
                    <div class="flex items-start gap-3">
                        <div class="text-2xl">🌍</div>
                        <div>
                            <p class="text-signal-cyan font-bold text-sm mb-1">Help Future Travelers</p>
                            <p class="text-zinc-400 text-xs leading-relaxed">
                                Your price data helps others avoid scams. 
                                Anonymous, takes 1 second.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- User Stats -->
                <div class="flex items-center justify-between bg-void-800 rounded-lg p-3 mb-5 border border-void-700">
                    <div class="flex items-center gap-2">
                        <span class="text-lg">${rankIcons[userStats.rank] || '🔭'}</span>
                        <span class="text-xs text-zinc-300 font-mono">${userStats.rank}</span>
                    </div>
                    <div class="text-right">
                        <div class="text-xs text-zinc-500 font-mono">${userStats.points} pts · ${userStats.contributions} reports</div>
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex gap-3">
                    <button id="btn-contribute-price"
                        class="flex-1 py-3.5 bg-signal-emerald text-void-950 font-mono font-bold text-sm rounded-xl 
                               hover:bg-signal-emerald/90 active:scale-95 transition-all uppercase tracking-wide">
                        ✓ CONTRIBUTE (+10 pts)
                    </button>
                    <button id="btn-skip-contribute"
                        class="px-5 py-3.5 bg-void-800 text-zinc-500 font-mono text-xs rounded-xl 
                               hover:bg-void-700 hover:text-zinc-300 transition-all border border-void-700">
                        Skip
                    </button>
                </div>
            </div>
        </div>
    `;
        };
    }

    if (typeof priceUtils.markContributionSubmitted !== 'function') {
        priceUtils.markContributionSubmitted = function markContributionSubmitted(buttonEl) {
            if (!buttonEl) return;
            buttonEl.textContent = '✅ SUBMITTED!';
            buttonEl.classList.remove('bg-signal-emerald');
            buttonEl.classList.add('bg-emerald-700');
        };
    }

    if (typeof priceUtils.closeContributionModal !== 'function') {
        priceUtils.closeContributionModal = function closeContributionModal(documentObj) {
            documentObj.getElementById('contribution-modal')?.remove();
        };
    }

    if (typeof priceUtils.notifyContributionSuccess !== 'function') {
        priceUtils.notifyContributionSuccess = function notifyContributionSuccess(showToastFn) {
            if (typeof showToastFn === 'function') {
                showToastFn('✅ Thanks! Your data helps others', 'success');
            }
        };
    }
    if (typeof priceUtils.setContributionSubmitPending !== 'function') {
        priceUtils.setContributionSubmitPending = function setContributionSubmitPending(buttonEl) {
            if (!buttonEl) return;
            buttonEl.textContent = '⏳ Submitting...';
            buttonEl.disabled = true;
        };
    }

    if (typeof priceUtils.resolveContributionArea !== 'function') {
        priceUtils.resolveContributionArea = function resolveContributionArea(position, detectSoukAreaFn) {
            return position ? detectSoukAreaFn(position.lat, position.lng) : 'unknown';
        };
    }

    if (typeof priceUtils.scheduleContributionModalClose !== 'function') {
        priceUtils.scheduleContributionModalClose = function scheduleContributionModalClose(documentObj, delayMs) {
            setTimeout(() => {
                if (typeof priceUtils.closeContributionModal === 'function') {
                    priceUtils.closeContributionModal(documentObj);
                    return;
                }
                documentObj.getElementById('contribution-modal')?.remove();
            }, delayMs || 1200);
        };
    }
})(typeof window !== 'undefined' ? window : null);
