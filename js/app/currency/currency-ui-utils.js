(function initAlidadeCurrencyUiUtils(windowObj) {
    if (!windowObj) return;

    const currencyUiUtils = windowObj.ALIDADE_CURRENCY_UI_UTILS || {};

    if (typeof currencyUiUtils.buildCurrencyWidgetHtml !== 'function') {
        currencyUiUtils.buildCurrencyWidgetHtml = function buildCurrencyWidgetHtml(widget) {
            const currencies = widget.converter.getSupportedCurrencies()
                .filter(c => c.code !== 'MAD')
                .map(c => `<option value="${c.code}" ${c.code === widget.converter.userCurrency ? 'selected' : ''}>${c.flag} ${c.code}</option>`)
                .join('');

            const status = widget.converter.provider.getStatus();

            return `
                <div class="cw-header">
                    <div class="cw-title">
                        <span class="cw-icon">💱</span>
                        <span>CONVERTER</span>
                    </div>
                    <button class="cw-close" id="cw-close-btn" aria-label="Close converter">×</button>
                </div>

                <div class="cw-body">
                    <div class="cw-input-group">
                        <input
                            type="number"
                            id="cw-mad-input"
                            class="cw-input"
                            placeholder="0"
                            inputmode="decimal"
                            aria-label="Amount in Moroccan Dirham"
                        />
                        <span class="cw-currency-label">
                            <span class="cw-flag">🇲🇦</span>
                            <span>MAD</span>
                        </span>
                    </div>

                    <div class="cw-swap">
                        <button id="cw-swap-btn" class="cw-swap-btn" aria-label="Swap currencies">?</button>
                    </div>

                    <div class="cw-input-group">
                        <input
                            type="number"
                            id="cw-foreign-input"
                            class="cw-input"
                            placeholder="0"
                            inputmode="decimal"
                            aria-label="Amount in foreign currency"
                        />
                        <select id="cw-currency-select" class="cw-currency-select" aria-label="Select currency">
                            ${currencies}
                        </select>
                    </div>
                </div>

                <div class="cw-footer">
                    <div class="cw-rate-info">
                        <span id="cw-rate-display">1 DH = ${widget.converter.format(widget.converter.getRate('MAD', widget.converter.userCurrency), widget.converter.userCurrency)}</span>
                    </div>
                    <div class="cw-status" id="cw-status">
                        <span class="cw-status-icon">${status.icon}</span>
                        <span class="cw-status-text">${status.detail}</span>
                    </div>
                </div>
            `;
        };
    }

    if (typeof currencyUiUtils.buildCurrencyWidgetCss !== 'function') {
        currencyUiUtils.buildCurrencyWidgetCss = function buildCurrencyWidgetCss() {
            return `
                .currency-widget {
                    position: fixed;
                    bottom: 80px;
                    right: 16px;
                    width: 280px;
                    background: linear-gradient(145deg, rgba(15,15,15,0.98), rgba(10,10,10,0.98));
                    border: 1px solid rgba(245, 158, 11, 0.3);
                    border-radius: 8px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(245, 158, 11, 0.1);
                    z-index: 9999;
                    display: none;
                    font-family: 'Inter', system-ui, sans-serif;
                    backdrop-filter: blur(10px);
                    transform: translateY(20px);
                    opacity: 0;
                    transition: transform 0.2s ease, opacity 0.2s ease;
                }

                .currency-widget.open {
                    display: block;
                    transform: translateY(0);
                    opacity: 1;
                }

                .cw-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 16px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }

                .cw-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #f59e0b;
                    font-size: 12px;
                    font-weight: 600;
                    letter-spacing: 0.1em;
                    font-family: 'JetBrains Mono', monospace;
                }

                .cw-icon {
                    font-size: 16px;
                }

                .cw-close {
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255,255,255,0.1);
                    border: none;
                    border-radius: 4px;
                    color: #888;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .cw-close:hover {
                    background: rgba(239, 68, 68, 0.2);
                    color: #ef4444;
                }

                .cw-body {
                    padding: 16px;
                }

                .cw-input-group {
                    display: flex;
                    align-items: center;
                    background: rgba(0,0,0,0.4);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 6px;
                    padding: 8px 12px;
                    transition: border-color 0.2s;
                }

                .cw-input-group:focus-within {
                    border-color: rgba(245, 158, 11, 0.5);
                }

                .cw-input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    color: white;
                    font-size: 20px;
                    font-weight: 600;
                    font-family: 'JetBrains Mono', monospace;
                    width: 100%;
                    outline: none;
                }

                .cw-input::placeholder {
                    color: rgba(255,255,255,0.2);
                }

                .cw-input::-webkit-outer-spin-button,
                .cw-input::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }

                .cw-currency-label {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: #888;
                    font-size: 14px;
                    font-weight: 500;
                    white-space: nowrap;
                }

                .cw-flag {
                    font-size: 16px;
                }

                .cw-currency-select {
                    background: transparent;
                    border: none;
                    color: #888;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    outline: none;
                    padding: 4px;
                    -webkit-appearance: none;
                    appearance: none;
                }

                .cw-currency-select option {
                    background: #1a1a1a;
                    color: white;
                }

                .cw-swap {
                    display: flex;
                    justify-content: center;
                    padding: 8px 0;
                }

                .cw-swap-btn {
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(245, 158, 11, 0.1);
                    border: 1px solid rgba(245, 158, 11, 0.3);
                    border-radius: 50%;
                    color: #f59e0b;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .cw-swap-btn:hover {
                    background: rgba(245, 158, 11, 0.2);
                    transform: rotate(180deg);
                }

                .cw-footer {
                    padding: 12px 16px;
                    border-top: 1px solid rgba(255,255,255,0.1);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .cw-rate-info {
                    color: #10b981;
                    font-size: 11px;
                    font-family: 'JetBrains Mono', monospace;
                }

                .cw-status {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    color: #666;
                    font-size: 10px;
                }

                .cw-status-icon {
                    font-size: 12px;
                }

                .currency-fab {
                    position: fixed;
                    bottom: 16px;
                    right: 16px;
                    width: 56px;
                    height: 56px;
                    background: linear-gradient(145deg, #f59e0b, #d97706);
                    border: none;
                    border-radius: 50%;
                    box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
                    color: black;
                    font-size: 24px;
                    cursor: pointer;
                    z-index: 9998;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .currency-fab:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 20px rgba(245, 158, 11, 0.5);
                }

                .currency-fab:active {
                    transform: scale(0.95);
                }

                .currency-fab.hidden {
                    display: none;
                }

                .price-tooltip {
                    position: absolute;
                    background: rgba(15, 15, 15, 0.95);
                    border: 1px solid rgba(245, 158, 11, 0.4);
                    border-radius: 4px;
                    padding: 6px 10px;
                    color: #10b981;
                    font-size: 12px;
                    font-family: 'JetBrains Mono', monospace;
                    white-space: nowrap;
                    z-index: 10000;
                    pointer-events: none;
                    opacity: 0;
                    transform: translateY(5px);
                    transition: opacity 0.15s, transform 0.15s;
                }

                .price-tooltip.visible {
                    opacity: 1;
                    transform: translateY(0);
                }

                @media (max-width: 640px) {
                    .currency-widget {
                        width: calc(100vw - 32px);
                        right: 16px;
                        left: 16px;
                        bottom: 80px;
                    }
                }
            `;
        };
    }

    if (typeof currencyUiUtils.resolveCurrencyWidgetCreateWidget !== 'function') {
        currencyUiUtils.resolveCurrencyWidgetCreateWidget = function resolveCurrencyWidgetCreateWidget(widget, documentObj) {
            if (documentObj.getElementById('currency-widget')) {
                widget.widget = documentObj.getElementById('currency-widget');
                return widget.widget;
            }

            const widgetEl = documentObj.createElement('div');
            widgetEl.id = 'currency-widget';
            widgetEl.className = 'currency-widget';
            widgetEl.innerHTML = currencyUiUtils.buildCurrencyWidgetHtml(widget);

            if (!documentObj.getElementById('currency-widget-styles')) {
                const style = documentObj.createElement('style');
                style.id = 'currency-widget-styles';
                style.textContent = currencyUiUtils.buildCurrencyWidgetCss();
                documentObj.head.appendChild(style);
            }

            documentObj.body.appendChild(widgetEl);
            widget.widget = widgetEl;
            return widgetEl;
        };
    }

    if (typeof currencyUiUtils.resolveCurrencyWidgetAttachListeners !== 'function') {
        currencyUiUtils.resolveCurrencyWidgetAttachListeners = function resolveCurrencyWidgetAttachListeners(widget, documentObj) {
            const closeBtn = documentObj.getElementById('cw-close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => widget.close());
            }

            const madInput = documentObj.getElementById('cw-mad-input');
            if (madInput) {
                madInput.addEventListener('input', (e) => widget._onMadInput(e.target.value));
            }

            const foreignInput = documentObj.getElementById('cw-foreign-input');
            if (foreignInput) {
                foreignInput.addEventListener('input', (e) => widget._onForeignInput(e.target.value));
            }

            const currencySelect = documentObj.getElementById('cw-currency-select');
            if (currencySelect) {
                currencySelect.addEventListener('change', (e) => widget._onCurrencyChange(e.target.value));
            }

            const swapBtn = documentObj.getElementById('cw-swap-btn');
            if (swapBtn) {
                swapBtn.addEventListener('click', () => widget._onSwap());
            }

            documentObj.addEventListener('keydown', (e) => {
                if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                    if (documentObj.activeElement.tagName === 'INPUT' ||
                        documentObj.activeElement.tagName === 'TEXTAREA' ||
                        documentObj.activeElement.isContentEditable) {
                        return;
                    }
                    e.preventDefault();
                    widget.toggle();
                }
            });

            documentObj.addEventListener('click', (e) => {
                if (widget.isOpen &&
                    !widget.widget.contains(e.target) &&
                    !e.target.closest('.currency-fab') &&
                    !e.target.closest('[data-price]')) {
                    widget.close();
                }
            });

            return true;
        };
    }

    if (typeof currencyUiUtils.resolveCurrencyWidgetOnMadInput !== 'function') {
        currencyUiUtils.resolveCurrencyWidgetOnMadInput = function resolveCurrencyWidgetOnMadInput(widget, value, documentObj) {
            clearTimeout(widget.debounceTimer);
            widget.debounceTimer = setTimeout(() => {
                const amount = parseFloat(value) || 0;
                const foreignInput = documentObj.getElementById('cw-foreign-input');
                if (foreignInput && amount > 0) {
                    const converted = widget.converter.convert(amount, 'MAD', widget.converter.userCurrency);
                    foreignInput.value = converted;
                } else if (foreignInput) {
                    foreignInput.value = '';
                }
            }, widget.DEBOUNCE_MS);
            return true;
        };
    }

    if (typeof currencyUiUtils.resolveCurrencyWidgetOnForeignInput !== 'function') {
        currencyUiUtils.resolveCurrencyWidgetOnForeignInput = function resolveCurrencyWidgetOnForeignInput(widget, value, documentObj) {
            clearTimeout(widget.debounceTimer);
            widget.debounceTimer = setTimeout(() => {
                const amount = parseFloat(value) || 0;
                const madInput = documentObj.getElementById('cw-mad-input');
                if (madInput && amount > 0) {
                    const converted = widget.converter.convert(amount, widget.converter.userCurrency, 'MAD');
                    madInput.value = Math.round(converted);
                } else if (madInput) {
                    madInput.value = '';
                }
            }, widget.DEBOUNCE_MS);
            return true;
        };
    }

    if (typeof currencyUiUtils.resolveCurrencyWidgetOnCurrencyChange !== 'function') {
        currencyUiUtils.resolveCurrencyWidgetOnCurrencyChange = function resolveCurrencyWidgetOnCurrencyChange(widget, code, documentObj) {
            widget.converter.userCurrency = code;
            widget._updateRateDisplay();

            const madInput = documentObj.getElementById('cw-mad-input');
            if (madInput && madInput.value) {
                widget._onMadInput(madInput.value);
            }
            return true;
        };
    }

    if (typeof currencyUiUtils.resolveCurrencyWidgetOnSwap !== 'function') {
        currencyUiUtils.resolveCurrencyWidgetOnSwap = function resolveCurrencyWidgetOnSwap(documentObj) {
            const madInput = documentObj.getElementById('cw-mad-input');
            const foreignInput = documentObj.getElementById('cw-foreign-input');

            if (madInput && foreignInput) {
                const temp = madInput.value;
                madInput.value = foreignInput.value;
                foreignInput.value = temp;
            }
            return true;
        };
    }

    if (typeof currencyUiUtils.resolveCurrencyWidgetUpdateRateDisplay !== 'function') {
        currencyUiUtils.resolveCurrencyWidgetUpdateRateDisplay = function resolveCurrencyWidgetUpdateRateDisplay(widget, documentObj) {
            const rateDisplay = documentObj.getElementById('cw-rate-display');
            if (rateDisplay) {
                const rate = widget.converter.getRate('MAD', widget.converter.userCurrency);
                rateDisplay.textContent = `1 DH = ${widget.converter.format(rate, widget.converter.userCurrency)}`;
            }
            return true;
        };
    }

    if (typeof currencyUiUtils.resolveCurrencyWidgetUpdateStatus !== 'function') {
        currencyUiUtils.resolveCurrencyWidgetUpdateStatus = function resolveCurrencyWidgetUpdateStatus(widget, documentObj) {
            const statusEl = documentObj.getElementById('cw-status');
            if (statusEl) {
                const status = widget.converter.provider.getStatus();
                statusEl.innerHTML = `
                    <span class="cw-status-icon">${status.icon}</span>
                    <span class="cw-status-text">${status.detail}</span>
                `;
            }
            return true;
        };
    }

    if (typeof currencyUiUtils.resolveCurrencyWidgetOpen !== 'function') {
        currencyUiUtils.resolveCurrencyWidgetOpen = function resolveCurrencyWidgetOpen(
            widget,
            madAmount,
            documentObj,
            setTimeoutFn,
            hapticsObj
        ) {
            widget.isOpen = true;
            widget.widget.classList.add('open');
            void widget.widget.offsetWidth;

            if (madAmount !== null) {
                const madInput = documentObj.getElementById('cw-mad-input');
                if (madInput) {
                    madInput.value = madAmount;
                    widget._onMadInput(madAmount);
                }
            }

            setTimeoutFn(() => {
                const input = documentObj.getElementById('cw-mad-input');
                if (input) input.focus();
            }, 100);

            widget._updateStatus();
            hapticsObj?.trigger('light');
            return true;
        };
    }

    if (typeof currencyUiUtils.resolveCurrencyWidgetClose !== 'function') {
        currencyUiUtils.resolveCurrencyWidgetClose = function resolveCurrencyWidgetClose(widget, hapticsObj) {
            widget.isOpen = false;
            widget.widget.classList.remove('open');
            hapticsObj?.trigger('light');
            return true;
        };
    }

    if (typeof currencyUiUtils.resolveCurrencyWidgetToggle !== 'function') {
        currencyUiUtils.resolveCurrencyWidgetToggle = function resolveCurrencyWidgetToggle(widget) {
            if (widget.isOpen) {
                widget.close();
            } else {
                widget.open();
            }
            return true;
        };
    }

    if (typeof currencyUiUtils.resolveCurrencyWidgetSetAmount !== 'function') {
        currencyUiUtils.resolveCurrencyWidgetSetAmount = function resolveCurrencyWidgetSetAmount(widget, madAmount, documentObj) {
            if (!widget.isOpen) {
                widget.open(madAmount);
            } else {
                const madInput = documentObj.getElementById('cw-mad-input');
                if (madInput) {
                    madInput.value = madAmount;
                    widget._onMadInput(madAmount);
                }
            }
            return true;
        };
    }

    if (typeof currencyUiUtils.resolvePriceIntegrationCreateTooltip !== 'function') {
        currencyUiUtils.resolvePriceIntegrationCreateTooltip = function resolvePriceIntegrationCreateTooltip(integration, documentObj) {
            if (documentObj.getElementById('price-tooltip')) {
                integration.tooltip = documentObj.getElementById('price-tooltip');
                return integration.tooltip;
            }

            const tooltip = documentObj.createElement('div');
            tooltip.id = 'price-tooltip';
            tooltip.className = 'price-tooltip';
            documentObj.body.appendChild(tooltip);
            integration.tooltip = tooltip;
            return tooltip;
        };
    }

    if (typeof currencyUiUtils.resolvePriceIntegrationAttachGlobalListeners !== 'function') {
        currencyUiUtils.resolvePriceIntegrationAttachGlobalListeners = function resolvePriceIntegrationAttachGlobalListeners(
            integration,
            documentObj
        ) {
            documentObj.addEventListener('mouseover', (e) => {
                const priceEl = e.target.closest('[data-price]');
                if (priceEl) {
                    const price = parseFloat(priceEl.dataset.price);
                    if (!isNaN(price) && price > 0) {
                        integration._showTooltip(priceEl, price);
                    }
                }
            });

            documentObj.addEventListener('mouseout', (e) => {
                if (e.target.closest('[data-price]')) {
                    integration._hideTooltip();
                }
            });

            documentObj.addEventListener('click', (e) => {
                const priceEl = e.target.closest('[data-price]');
                if (priceEl) {
                    const price = parseFloat(priceEl.dataset.price);
                    if (!isNaN(price) && price > 0) {
                        e.preventDefault();
                        integration.widget.setAmount(price);
                    }
                }
            });

            return true;
        };
    }

    if (typeof currencyUiUtils.resolvePriceIntegrationShowTooltip !== 'function') {
        currencyUiUtils.resolvePriceIntegrationShowTooltip = function resolvePriceIntegrationShowTooltip(
            integration,
            element,
            madAmount
        ) {
            const preview = integration.converter.getPreview(madAmount);
            integration.tooltip.textContent = preview;

            const rect = element.getBoundingClientRect();
            integration.tooltip.style.left = `${rect.left + rect.width / 2}px`;
            integration.tooltip.style.top = `${rect.top - 30}px`;
            integration.tooltip.style.transform = 'translateX(-50%)';

            integration.tooltip.classList.add('visible');
            return true;
        };
    }

    if (typeof currencyUiUtils.resolvePriceIntegrationHideTooltip !== 'function') {
        currencyUiUtils.resolvePriceIntegrationHideTooltip = function resolvePriceIntegrationHideTooltip(integration) {
            integration.tooltip.classList.remove('visible');
            return true;
        };
    }

    if (typeof currencyUiUtils.resolvePriceIntegrationEnhancePrices !== 'function') {
        currencyUiUtils.resolvePriceIntegrationEnhancePrices = function resolvePriceIntegrationEnhancePrices(integration, containerObj) {
            const container = containerObj || document;
            const selectors = [
                '.price-value',
                '.price-amount',
                '[class*="price"]',
                '.vendor-price',
                '.fair-price',
                '.shock-price'
            ];

            container.querySelectorAll(selectors.join(', ')).forEach(el => {
                if (el.dataset.price) return;

                const text = el.textContent.trim();
                const match = text.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*(?:DH|MAD)?/i);

                if (match) {
                    const price = parseFloat(match[1].replace(',', ''));
                    if (!isNaN(price) && price > 0) {
                        el.dataset.price = price;
                        el.style.cursor = 'help';
                        el.title = 'Click to convert';
                    }
                }
            });
            return true;
        };
    }

    windowObj.ALIDADE_CURRENCY_UI_UTILS = currencyUiUtils;
})(typeof window !== 'undefined' ? window : null);
