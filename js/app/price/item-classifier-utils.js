/**
 * ALIDADE Item Classifier Utilities
 * Extracted from ItemClassifier in legacy app.js with compatibility hooks.
 */
(function bootstrapItemClassifierUtils(windowObj) {
    if (!windowObj) return;

    const priceUtils = windowObj.ALIDADE_PRICE_UTILS || (windowObj.ALIDADE_PRICE_UTILS = {});
    const itemClassifierDebugLog = (...args) => {
        if (windowObj.__ALIDADE_DEBUG_LOGS__ === true) {
            console.log(...args);
        }
    };

    if (typeof priceUtils.blobToBase64 !== 'function') {
        priceUtils.blobToBase64 = function blobToBase64(blob) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        };
    }

    if (typeof priceUtils.base64ToBlob !== 'function') {
        priceUtils.base64ToBlob = async function base64ToBlob(base64) {
            const response = await fetch(base64);
            return await response.blob();
        };
    }

    if (typeof priceUtils.resolveClassifierPreviewUrl !== 'function') {
        priceUtils.resolveClassifierPreviewUrl = function resolveClassifierPreviewUrl(imageBlob, urlObj) {
            return imageBlob ? urlObj.createObjectURL(imageBlob) : null;
        };
    }

    if (typeof priceUtils.prepareClassifierInputBase64 !== 'function') {
        priceUtils.prepareClassifierInputBase64 = async function prepareClassifierInputBase64(
            imageTensor,
            imageBlob,
            blobToBase64Fn,
            tfObj,
            documentObj
        ) {
            if (imageBlob) {
                // Convert blob to base64
                return await blobToBase64Fn(imageBlob);
            }

            if (imageTensor && imageTensor.shape) {
                // Convert TensorFlow tensor to base64
                const canvas = documentObj.createElement('canvas');
                canvas.width = imageTensor.shape[1];
                canvas.height = imageTensor.shape[0];

                await tfObj.browser.toPixels(imageTensor, canvas);
                return canvas.toDataURL('image/jpeg', 0.8);
            }

            if (typeof imageTensor === 'string') {
                // Already base64
                return imageTensor;
            }

            throw new Error('Invalid image format');
        };
    }

    if (typeof priceUtils.hasValidClassifierResult !== 'function') {
        priceUtils.hasValidClassifierResult = function hasValidClassifierResult(result) {
            return !!(result && result.topPrediction && result.topPrediction.label);
        };
    }
    if (typeof priceUtils.logClassifierResultSummary !== 'function') {
        priceUtils.logClassifierResultSummary = function logClassifierResultSummary(result) {
            itemClassifierDebugLog('[CLASSIFIER] ----------------------------------------');
            itemClassifierDebugLog('[CLASSIFIER] AI DETECTION RESULT:');
            itemClassifierDebugLog('[CLASSIFIER]    Item:', result.topPrediction?.label);
            itemClassifierDebugLog('[CLASSIFIER]    Confidence:', result.confidence);
            itemClassifierDebugLog('[CLASSIFIER]    Reasoning:', result.reasoning);
            itemClassifierDebugLog('[CLASSIFIER] ----------------------------------------');
        };
    }
    if (typeof priceUtils.runClassifierManualFallback !== 'function') {
        priceUtils.runClassifierManualFallback = async function runClassifierManualFallback(
            imageBase64,
            base64ToBlobFn,
            showCategorySelectorFn,
            urlObj
        ) {
            const blob = await base64ToBlobFn(imageBase64);
            const imageURL = urlObj.createObjectURL(blob);
            return await showCategorySelectorFn(imageURL);
        };
    }

    if (typeof priceUtils.getManualCategorySelectorCategories !== 'function') {
        priceUtils.getManualCategorySelectorCategories = function getManualCategorySelectorCategories() {
            // Comprehensive category database with realistic Marrakech prices
            return [
                // === CERAMICS ===
                {
                    id: 'tagine_pot_small',
                    name: 'Tagine Pot (Small)',
                    icon: '🍲',
                    fairPrice: 100,
                    askingPrice: 400,
                    category: 'ceramics'
                },
                {
                    id: 'tagine_pot_decorated',
                    name: 'Tagine Pot (Decorated)',
                    icon: '🏺',
                    fairPrice: 150,
                    askingPrice: 600,
                    category: 'ceramics'
                },
                {
                    id: 'tagine_pot_large',
                    name: 'Tagine Pot (Large)',
                    icon: '🫕',
                    fairPrice: 250,
                    askingPrice: 1000,
                    category: 'ceramics'
                },
                {
                    id: 'ceramic_plate',
                    name: 'Ceramic Plate',
                    icon: '🍽️',
                    fairPrice: 60,
                    askingPrice: 200,
                    category: 'ceramics'
                },
                {
                    id: 'ceramic_bowl',
                    name: 'Ceramic Bowl',
                    icon: '🥣',
                    fairPrice: 50,
                    askingPrice: 180,
                    category: 'ceramics'
                },

                // === LEATHER ===
                {
                    id: 'leather_bag_small',
                    name: 'Leather Bag (Small)',
                    icon: '👜',
                    fairPrice: 250,
                    askingPrice: 1200,
                    category: 'leather'
                },
                {
                    id: 'leather_bag_medium',
                    name: 'Leather Bag (Medium)',
                    icon: '💼',
                    fairPrice: 350,
                    askingPrice: 1500,
                    category: 'leather'
                },
                {
                    id: 'leather_bag_large',
                    name: 'Leather Bag (Large)',
                    icon: '🎒',
                    fairPrice: 450,
                    askingPrice: 1800,
                    category: 'leather'
                },
                {
                    id: 'babouche_slippers',
                    name: 'Babouche Slippers',
                    icon: '👡',
                    fairPrice: 120,
                    askingPrice: 500,
                    category: 'leather'
                },
                {
                    id: 'leather_jacket',
                    name: 'Leather Jacket',
                    icon: '🧥',
                    fairPrice: 1000,
                    askingPrice: 4000,
                    category: 'leather'
                },
                {
                    id: 'leather_wallet',
                    name: 'Leather Wallet',
                    icon: '👛',
                    fairPrice: 150,
                    askingPrice: 600,
                    category: 'leather'
                },

                // === TEXTILES & RUGS ===
                {
                    id: 'berber_rug_small',
                    name: 'Berber Rug (Small 60x90cm)',
                    icon: '🧶',
                    fairPrice: 300,
                    askingPrice: 1200,
                    category: 'rugs'
                },
                {
                    id: 'berber_rug_medium',
                    name: 'Berber Rug (Medium 1x2m)',
                    icon: '🪢',
                    fairPrice: 1000,
                    askingPrice: 4000,
                    category: 'rugs'
                },
                {
                    id: 'berber_rug_large',
                    name: 'Berber Rug (Large 2x3m+)',
                    icon: '🧵',
                    fairPrice: 2500,
                    askingPrice: 10000,
                    category: 'rugs'
                },
                {
                    id: 'scarf_cotton',
                    name: 'Cotton Scarf',
                    icon: '🧣',
                    fairPrice: 60,
                    askingPrice: 250,
                    category: 'textiles'
                },
                {
                    id: 'scarf_silk',
                    name: 'Silk Scarf',
                    icon: '🎀',
                    fairPrice: 150,
                    askingPrice: 600,
                    category: 'textiles'
                },

                // === HOME GOODS ===
                {
                    id: 'lantern_small',
                    name: 'Metal Lantern (Small)',
                    icon: '🏮',
                    fairPrice: 100,
                    askingPrice: 400,
                    category: 'home'
                },
                {
                    id: 'lantern_medium',
                    name: 'Metal Lantern (Medium)',
                    icon: '🪔',
                    fairPrice: 200,
                    askingPrice: 800,
                    category: 'home'
                },
                {
                    id: 'teapot_moroccan',
                    name: 'Moroccan Teapot',
                    icon: '🫖',
                    fairPrice: 150,
                    askingPrice: 600,
                    category: 'home'
                },

                // === COSMETICS ===
                {
                    id: 'argan_oil_100ml',
                    name: 'Argan Oil (100ml)',
                    icon: '🛢️',
                    fairPrice: 100,
                    askingPrice: 250,
                    category: 'cosmetics'
                },
                {
                    id: 'argan_oil_250ml',
                    name: 'Argan Oil (250ml)',
                    icon: '🫙',
                    fairPrice: 150,
                    askingPrice: 300,
                    category: 'cosmetics'
                },

                // === SPICES ===
                {
                    id: 'spices_100g',
                    name: 'Spices (100g)',
                    icon: '🌶️',
                    fairPrice: 30,
                    askingPrice: 120,
                    category: 'spices'
                },
                {
                    id: 'saffron_1g',
                    name: 'Saffron (1g)',
                    icon: '🧂',
                    fairPrice: 80,
                    askingPrice: 250,
                    category: 'spices'
                },

                // === JEWELRY ===
                {
                    id: 'silver_bracelet',
                    name: 'Silver Bracelet',
                    icon: '📿',
                    fairPrice: 150,
                    askingPrice: 600,
                    category: 'jewelry'
                },
                {
                    id: 'silver_necklace',
                    name: 'Silver Necklace',
                    icon: '📿',
                    fairPrice: 250,
                    askingPrice: 1000,
                    category: 'jewelry'
                }
            ];
        };
    }

    if (typeof priceUtils.buildCategorySelectorModalHtml !== 'function') {
        priceUtils.buildCategorySelectorModalHtml = function buildCategorySelectorModalHtml(categories, imagePreview) {
            return `
                    <div id="category-selector-modal"
                         class="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
                        <div class="bg-void-900 border-2 border-signal-amber/30 rounded-machined w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-glow-amber">

                            <!-- Header -->
                            <div class="sticky top-0 bg-void-900 border-b border-void-700 p-4 z-10">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <h2 class="text-signal-amber font-mono font-bold text-lg tracking-tight-ui">
                                            📸 IDENTIFY ITEM
                                        </h2>
                                        <p class="text-zinc-400 text-xs mt-1">
                                            Select what you're looking at
                                        </p>
                                    </div>
                                    <button onclick="window.closeCategorySelector(null)"
                                            class="text-zinc-500 hover:text-zinc-300 text-2xl leading-none">
                                        ✕
                                    </button>
                                </div>
                            </div>

                            <!-- Image Preview -->
                            ${imagePreview ? `
                            <div class="p-4 border-b border-void-700 bg-void-950">
                                <img src="${imagePreview}"
                                     class="w-full h-64 object-contain rounded-machined-sm border border-void-600 bg-void-800"
                                     alt="Your photo">
                            </div>
                            ` : ''}

                            <!-- Category Grid -->
                            <div class="p-4 overflow-y-auto max-h-[calc(90vh-${imagePreview ? '24rem' : '12rem'})]">
                                <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    ${categories.map(cat => `
                                        <button
                                            onclick="window.selectCategory('${cat.id}', '${cat.name}', ${cat.fairPrice}, ${cat.askingPrice})"
                                            class="group p-4 bg-void-800 hover:bg-void-700 border border-void-600 hover:border-signal-emerald rounded-machined text-left transition-all active:scale-95">

                                            <div class="text-4xl mb-2">${cat.icon}</div>

                                            <div class="text-zinc-100 font-medium text-sm group-hover:text-signal-emerald mb-1">
                                                ${cat.name}
                                            </div>

                                            <div class="text-zinc-500 text-xs space-y-0.5">
                                                <div>Fair: <span class="text-signal-emerald">${cat.fairPrice} DH</span></div>
                                                <div>Asking: <span class="text-signal-amber">${cat.askingPrice} DH</span></div>
                                            </div>
                                        </button>
                                    `).join('')}
                                </div>
                            </div>

                            <!-- Footer -->
                            <div class="sticky bottom-0 bg-void-900 border-t border-void-700 p-4">
                                <button onclick="window.closeCategorySelector(null)"
                                        class="w-full py-3 bg-void-700 hover:bg-void-600 text-zinc-400 font-mono text-sm rounded-machined-sm transition-colors">
                                    Cancel
                                </button>
                            </div>

                        </div>
                    </div>
                `;
        };
    }

    if (typeof priceUtils.insertCategorySelectorModal !== 'function') {
        priceUtils.insertCategorySelectorModal = function insertCategorySelectorModal(documentObj, modalHTML) {
            documentObj.body.insertAdjacentHTML('beforeend', modalHTML);
        };
    }

    if (typeof priceUtils.storeCategorySelectorResolve !== 'function') {
        priceUtils.storeCategorySelectorResolve = function storeCategorySelectorResolve(windowObjParam, resolveFn) {
            windowObjParam._categoryResolve = resolveFn;
        };
    }

    if (typeof priceUtils.openCategorySelectorModal !== 'function') {
        priceUtils.openCategorySelectorModal = function openCategorySelectorModal(
            windowObjParam,
            documentObj,
            modalHTML,
            resolveFn
        ) {
            if (typeof priceUtils.insertCategorySelectorModal === 'function') {
                priceUtils.insertCategorySelectorModal(documentObj, modalHTML);
            } else {
                documentObj.body.insertAdjacentHTML('beforeend', modalHTML);
            }

            if (typeof priceUtils.storeCategorySelectorResolve === 'function') {
                priceUtils.storeCategorySelectorResolve(windowObjParam, resolveFn);
            } else {
                windowObjParam._categoryResolve = resolveFn;
            }
        };
    }

    if (typeof priceUtils.removeCategorySelectorModal !== 'function') {
        priceUtils.removeCategorySelectorModal = function removeCategorySelectorModal(documentObj) {
            const modal = documentObj.getElementById('category-selector-modal');
            if (modal) modal.remove();
        };
    }

    if (typeof priceUtils.buildManualCategorySelectionResult !== 'function') {
        priceUtils.buildManualCategorySelectionResult = function buildManualCategorySelectionResult(
            itemId,
            itemName,
            fairPrice,
            askingPrice
        ) {
            return {
                topPrediction: {
                    label: itemId,
                    displayName: itemName,
                    confidence: 1.0 // User selected = 100% confidence
                },
                fairPrice: fairPrice,
                askingPrice: askingPrice,
                method: 'manual_selection',
                alternatives: []
            };
        };
    }

    if (typeof priceUtils.resolveManualCategorySelectionResult !== 'function') {
        priceUtils.resolveManualCategorySelectionResult = function resolveManualCategorySelectionResult(
            itemId,
            itemName,
            fairPrice,
            askingPrice
        ) {
            if (typeof priceUtils.buildManualCategorySelectionResult === 'function') {
                return priceUtils.buildManualCategorySelectionResult(itemId, itemName, fairPrice, askingPrice);
            }
            return {
                topPrediction: {
                    label: itemId,
                    displayName: itemName,
                    confidence: 1.0
                },
                fairPrice: fairPrice,
                askingPrice: askingPrice,
                method: 'manual_selection',
                alternatives: []
            };
        };
    }

    if (typeof priceUtils.resolveCategorySelector !== 'function') {
        priceUtils.resolveCategorySelector = function resolveCategorySelector(windowObjParam, result) {
            if (windowObjParam._categoryResolve) {
                windowObjParam._categoryResolve(result);
                windowObjParam._categoryResolve = null;
            }
        };
    }

    if (typeof priceUtils.finalizeCategorySelector !== 'function') {
        priceUtils.finalizeCategorySelector = function finalizeCategorySelector(windowObjParam, documentObj, result) {
            if (typeof priceUtils.removeCategorySelectorModal === 'function') {
                priceUtils.removeCategorySelectorModal(documentObj);
            } else {
                const modal = documentObj.getElementById('category-selector-modal');
                if (modal) modal.remove();
            }

            if (typeof priceUtils.resolveCategorySelector === 'function') {
                priceUtils.resolveCategorySelector(windowObjParam, result);
                return;
            }

            if (windowObjParam._categoryResolve) {
                windowObjParam._categoryResolve(result);
                windowObjParam._categoryResolve = null;
            }
        };
    }

    if (typeof priceUtils.resolveCategorySelectorFinalize !== 'function') {
        priceUtils.resolveCategorySelectorFinalize = function resolveCategorySelectorFinalize(windowObjParam, documentObj, result) {
            if (typeof priceUtils.finalizeCategorySelector === 'function') {
                priceUtils.finalizeCategorySelector(windowObjParam, documentObj, result);
                return;
            }

            const modal = documentObj.getElementById('category-selector-modal');
            if (modal) modal.remove();
            if (windowObjParam._categoryResolve) {
                windowObjParam._categoryResolve(result);
                windowObjParam._categoryResolve = null;
            }
        };
    }
})(typeof window !== 'undefined' ? window : null);

