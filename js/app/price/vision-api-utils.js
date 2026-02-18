/**
 * ALIDADE Vision API Utilities
 * Extracted from VisionAPIClient in legacy app.js with compatibility hooks.
 */
(function bootstrapVisionApiUtils(windowObj) {
    if (!windowObj) return;

    const priceUtils = windowObj.ALIDADE_PRICE_UTILS || (windowObj.ALIDADE_PRICE_UTILS = {});
    const visionApiDebugLog = (...args) => {
        if (windowObj.__ALIDADE_DEBUG_LOGS__ === true) {
            console.log(...args);
        }
    };

    if (typeof priceUtils.stripImageDataUrlPrefix !== 'function') {
        priceUtils.stripImageDataUrlPrefix = function stripImageDataUrlPrefix(imageBase64) {
            return imageBase64.replace(/^data:image\/(png|jpg|jpeg|webp);base64,/, '');
        };
    }

    if (typeof priceUtils.ensureImageDataUrl !== 'function') {
        priceUtils.ensureImageDataUrl = function ensureImageDataUrl(imageBase64) {
            return imageBase64.startsWith('data:')
                ? imageBase64
                : `data:image/jpeg;base64,${imageBase64}`;
        };
    }

    if (typeof priceUtils.cleanVisionJsonText !== 'function') {
        priceUtils.cleanVisionJsonText = function cleanVisionJsonText(resultText) {
            return resultText
                .replace(/```json/gi, '')
                .replace(/```/g, '')
                .trim();
        };
    }

    if (typeof priceUtils.extractVisionJsonObject !== 'function') {
        priceUtils.extractVisionJsonObject = function extractVisionJsonObject(resultText) {
            const jsonMatch = resultText.match(/\{[\s\S]*\}/);
            return jsonMatch ? jsonMatch[0] : resultText;
        };
    }

    if (typeof priceUtils.buildVisionClassificationResult !== 'function') {
        priceUtils.buildVisionClassificationResult = function buildVisionClassificationResult(
            parsed,
            provider,
            responseTimeMs,
            displayNames
        ) {
            return {
                topPrediction: {
                    label: parsed.item_id,
                    displayName: displayNames[parsed.item_id] || parsed.item_id,
                    confidence: parsed.confidence
                },
                confidence: parsed.confidence,
                reasoning: parsed.reasoning,
                responseTime: Math.round(responseTimeMs),
                provider,
                alternatives: []
            };
        };
    }

    if (typeof priceUtils.resolveVisionProvider !== 'function') {
        priceUtils.resolveVisionProvider = function resolveVisionProvider(configuredProvider) {
            return configuredProvider || 'GEMINI';
        };
    }

    if (typeof priceUtils.dispatchVisionProviderCall !== 'function') {
        priceUtils.dispatchVisionProviderCall = async function dispatchVisionProviderCall(provider, handlers) {
            if (provider === 'OPENROUTER') return handlers.openRouter();
            if (provider === 'DEEPSEEK') return handlers.deepSeek();
            return handlers.gemini();
        };
    }

    if (typeof priceUtils.logVisionResultSummary !== 'function') {
        priceUtils.logVisionResultSummary = function logVisionResultSummary(provider, result) {
            visionApiDebugLog('╔════════════ AI RESULT ════════════╗');
            visionApiDebugLog('║ Provider:', provider);
            visionApiDebugLog('║ Predicted:', result.topPrediction.label);
            visionApiDebugLog('║ Confidence:', result.confidence);
            visionApiDebugLog('╚═══════════════════════════════════╝');
        };
    }

    if (typeof priceUtils.buildVisionStats !== 'function') {
        priceUtils.buildVisionStats = function buildVisionStats(requestCount, failureCount) {
            return { requestCount, failureCount };
        };
    }

    if (typeof priceUtils.runVisionManualFallback !== 'function') {
        priceUtils.runVisionManualFallback = async function runVisionManualFallback(
            imageBase64,
            base64ToBlobFn,
            ItemClassifierCtor,
            urlObj
        ) {
            const classifier = new ItemClassifierCtor();
            const blob = await base64ToBlobFn(imageBase64);
            const imageURL = urlObj.createObjectURL(blob);
            return await classifier.showCategorySelector(imageURL);
        };
    }

    if (typeof priceUtils.buildGeminiHeaders !== 'function') {
        priceUtils.buildGeminiHeaders = function buildGeminiHeaders() {
            return { 'Content-Type': 'application/json' };
        };
    }

    if (typeof priceUtils.buildDeepSeekHeaders !== 'function') {
        priceUtils.buildDeepSeekHeaders = function buildDeepSeekHeaders(apiKey) {
            return {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            };
        };
    }

    if (typeof priceUtils.buildOpenRouterHeaders !== 'function') {
        priceUtils.buildOpenRouterHeaders = function buildOpenRouterHeaders(apiKey) {
            return {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://alidade.netlify.app',
                'X-Title': 'Alidade Souk Assistant'
            };
        };
    }

    if (typeof priceUtils.buildGeminiVisionPrompt !== 'function') {
        priceUtils.buildGeminiVisionPrompt = function buildGeminiVisionPrompt() {
            return `You are an expert Moroccan handicraft item classifier.

STEP 1: IDENTIFY THE MATERIAL
Look at the item in the image and determine its PRIMARY material:
- LEATHER (brown, tan, black, textured animal hide, stitching)
- CERAMIC (clay, glazed pottery, painted patterns)
- METAL (brass, silver, copper, shiny/hammered surfaces)
- TEXTILE (fabric, woven, threads, carpet patterns)
- FOOD/COSMETIC (bottles, spices, oils)

STEP 2: MATCH USING THIS PRIORITY ORDER

IF MATERIAL IS LEATHER:
- Small flat rectangular item that folds, fits in pocket ? "leather_wallet" (VERY COMMON)
- Has handles/straps, carries things inside ? "leather_bag"
- Long thin strip with buckle ? "leather_belt"
- Large stuffed round seat/cushion ? "leather_pouf"
- Slipper shoe ? "babouche_plain" or "babouche_embroidered"
- Unknown leather item ? "generic_leather"

IF MATERIAL IS CERAMIC:
- Cooking pot with CONICAL LID ? "tagine_pot_large" or "tagine_pot_small"
- Round eating vessel ? "ceramic_bowl" or "ceramic_plate"
- Flat decorative piece ? "ceramic_tile"
- Unknown ceramic ? "generic_ceramic"

IF MATERIAL IS METAL:
- Decorative light fixture with glass/holes ? "lantern_brass" or "lantern_metal"
- Teapot with spout and handle ? "teapot_silver"
- Small drinking glass ? "tea_glasses"
- Unknown metal ? "generic_metal"

IF MATERIAL IS TEXTILE:
- Floor covering ? "rug_small", "rug_medium", "rug_large"
- Robe/dress ? "djellaba" or "kaftan"
- Neck wrap ? "scarf_silk" or "scarf_wool"
- Unknown fabric ? "generic_textile"

VALID IDS: ["tagine_pot_large","tagine_pot_small","ceramic_bowl","ceramic_plate","ceramic_tile","leather_bag","leather_wallet","leather_belt","leather_pouf","babouche_plain","babouche_embroidered","rug_small","rug_medium","rug_large","rug_runner","lantern_brass","lantern_glass","lantern_metal","teapot_silver","tea_glasses","djellaba","kaftan","scarf_silk","scarf_wool","argan_oil","spices_mixed","saffron","jewelry_silver","generic_leather","generic_ceramic","generic_metal","generic_textile","generic_food","generic_item"]

Respond with ONLY this JSON (no markdown):
{"item_id": "exact_id", "confidence": 0.85, "reasoning": "material observed + specific visual features"}`;
        };
    }

    if (typeof priceUtils.buildGeminiVisionRequestBody !== 'function') {
        priceUtils.buildGeminiVisionRequestBody = function buildGeminiVisionRequestBody(base64Image, promptText) {
            const prompt = typeof promptText === 'string' && promptText.length > 0
                ? promptText
                : (typeof priceUtils.buildGeminiVisionPrompt === 'function'
                    ? priceUtils.buildGeminiVisionPrompt()
                    : '');
            return {
                contents: [{
                    parts: [
                        { text: prompt },
                        {
                            inline_data: {
                                mime_type: 'image/jpeg',
                                data: base64Image
                            }
                        }
                    ]
                }],
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
                ],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 300
                }
            };
        };
    }

    if (typeof priceUtils.extractGeminiVisionResultText !== 'function') {
        priceUtils.extractGeminiVisionResultText = function extractGeminiVisionResultText(data) {
            if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                throw new Error('Invalid Gemini response structure');
            }
            return data.candidates[0].content.parts[0].text;
        };
    }

    if (typeof priceUtils.extractChatVisionResultText !== 'function') {
        priceUtils.extractChatVisionResultText = function extractChatVisionResultText(data, providerLabel) {
            if (!data?.choices?.[0]?.message?.content) {
                throw new Error(`Invalid ${providerLabel} response structure`);
            }
            return data.choices[0].message.content;
        };
    }

    if (typeof priceUtils.parseVisionClassificationJson !== 'function') {
        priceUtils.parseVisionClassificationJson = function parseVisionClassificationJson(resultText) {
            const cleaned = typeof priceUtils.cleanVisionJsonText === 'function'
                ? priceUtils.cleanVisionJsonText(resultText)
                : resultText;
            const extracted = typeof priceUtils.extractVisionJsonObject === 'function'
                ? priceUtils.extractVisionJsonObject(cleaned)
                : cleaned;
            return JSON.parse(extracted);
        };
    }

    if (typeof priceUtils.ensureVisionClassificationFields !== 'function') {
        priceUtils.ensureVisionClassificationFields = function ensureVisionClassificationFields(parsed) {
            if (!parsed?.item_id || !parsed?.confidence) {
                throw new Error('Invalid response format');
            }
            return parsed;
        };
    }

    if (typeof priceUtils.buildVisionClassificationPayload !== 'function') {
        priceUtils.buildVisionClassificationPayload = function buildVisionClassificationPayload(resultText) {
            const cleanedText = typeof priceUtils.cleanVisionJsonText === 'function'
                ? priceUtils.cleanVisionJsonText(resultText)
                : String(resultText || '').replace(/```json/gi, '').replace(/```/g, '').trim();
            const extractedText = typeof priceUtils.extractVisionJsonObject === 'function'
                ? priceUtils.extractVisionJsonObject(cleanedText)
                : cleanedText;
            const parsed = JSON.parse(extractedText);
            return {
                cleanedText,
                extractedText,
                parsed
            };
        };
    }

    if (typeof priceUtils.parseGeminiVisionClassificationResponse !== 'function') {
        priceUtils.parseGeminiVisionClassificationResponse = function parseGeminiVisionClassificationResponse(data) {
            const resultText = typeof priceUtils.extractGeminiVisionResultText === 'function'
                ? priceUtils.extractGeminiVisionResultText(data)
                : data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!resultText) {
                throw new Error('Invalid Gemini response structure');
            }
            const payload = typeof priceUtils.buildVisionClassificationPayload === 'function'
                ? priceUtils.buildVisionClassificationPayload(resultText)
                : {
                    cleanedText: resultText,
                    extractedText: resultText,
                    parsed: JSON.parse(resultText)
                };
            const parsed = typeof priceUtils.ensureVisionClassificationFields === 'function'
                ? priceUtils.ensureVisionClassificationFields(payload.parsed)
                : payload.parsed;
            return {
                resultText,
                cleanedText: payload.cleanedText,
                extractedText: payload.extractedText,
                parsed
            };
        };
    }

    if (typeof priceUtils.parseChatVisionClassificationResponse !== 'function') {
        priceUtils.parseChatVisionClassificationResponse = function parseChatVisionClassificationResponse(data, providerLabel) {
            const label = providerLabel || 'Provider';
            const resultText = typeof priceUtils.extractChatVisionResultText === 'function'
                ? priceUtils.extractChatVisionResultText(data, label)
                : data?.choices?.[0]?.message?.content;
            if (!resultText) {
                throw new Error(`Invalid ${label} response structure`);
            }
            const payload = typeof priceUtils.buildVisionClassificationPayload === 'function'
                ? priceUtils.buildVisionClassificationPayload(resultText)
                : {
                    cleanedText: resultText,
                    extractedText: resultText,
                    parsed: JSON.parse(resultText)
                };
            const parsed = typeof priceUtils.ensureVisionClassificationFields === 'function'
                ? priceUtils.ensureVisionClassificationFields(payload.parsed)
                : payload.parsed;
            return {
                resultText,
                cleanedText: payload.cleanedText,
                extractedText: payload.extractedText,
                parsed
            };
        };
    }

    if (typeof priceUtils.buildDeepSeekVisionPrompt !== 'function') {
        priceUtils.buildDeepSeekVisionPrompt = function buildDeepSeekVisionPrompt() {
            return `You are an expert at identifying Moroccan handicraft items.

Analyze this image and return a JSON object with the "item_id" that best matches the item.

ALLOWED_IDS_LIST:
[
  "tagine_pot_large", "tagine_pot_small",
  "ceramic_bowl", "ceramic_plate", "ceramic_tile",
  "leather_bag", "leather_wallet", "leather_belt", "leather_pouf",
  "babouche_plain", "babouche_embroidered",
  "rug_small", "rug_medium", "rug_large", "rug_runner",
  "lantern_brass", "lantern_glass", "lantern_metal",
  "teapot_silver", "tea_glasses",
  "djellaba", "kaftan", "scarf_silk", "scarf_wool",
  "argan_oil", "spices_mixed", "saffron", "jewelry_silver",
  "generic_leather", "generic_ceramic", "generic_metal",
  "generic_textile", "generic_food", "generic_item"
]

RULES:
1. Use EXACTLY one ID from the list above.
2. If it is a wallet, billfold, or cardholder, use "leather_wallet".
3. If it is a handbag, purse, or satchel, use "leather_bag".
4. If unsure, use the appropriate "generic_" ID (e.g., "generic_leather").

CRITICAL: Respond ONLY with valid JSON, no markdown formatting.
{
  "item_id": "EXACT_ID_FROM_LIST",
  "confidence": 0.95,
  "reasoning": "Brief visual reasoning"
}`;
        };
    }

    if (typeof priceUtils.buildDeepSeekVisionRequestBody !== 'function') {
        priceUtils.buildDeepSeekVisionRequestBody = function buildDeepSeekVisionRequestBody(imageUrl, modelName, promptText) {
            const prompt = typeof promptText === 'string' && promptText.length > 0
                ? promptText
                : (typeof priceUtils.buildDeepSeekVisionPrompt === 'function'
                    ? priceUtils.buildDeepSeekVisionPrompt()
                    : '');
            return {
                model: modelName || 'deepseek-chat',
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            { type: 'image_url', image_url: { url: imageUrl } }
                        ]
                    }
                ],
                max_tokens: 200,
                temperature: 0.1
            };
        };
    }

    if (typeof priceUtils.buildOpenRouterVisionPrompt !== 'function') {
        priceUtils.buildOpenRouterVisionPrompt = function buildOpenRouterVisionPrompt() {
            return `You are an expert at identifying Moroccan handicraft items.

Analyze this image and return a JSON object with the "item_id" that best matches the item.

ALLOWED_IDS_LIST:
[
  "tagine_pot_large", "tagine_pot_small",
  "ceramic_bowl", "ceramic_plate", "ceramic_tile",
  "leather_bag", "leather_wallet", "leather_belt", "leather_pouf",
  "babouche_plain", "babouche_embroidered",
  "rug_small", "rug_medium", "rug_large", "rug_runner",
  "lantern_brass", "lantern_glass", "lantern_metal",
  "teapot_silver", "tea_glasses",
  "djellaba", "kaftan", "scarf_silk", "scarf_wool",
  "argan_oil", "spices_mixed", "saffron", "jewelry_silver",
  "generic_leather", "generic_ceramic", "generic_metal",
  "generic_textile", "generic_food", "generic_item"
]

RULES:
1. Use EXACTLY one ID from the list above.
2. If it is a wallet, billfold, or cardholder, use "leather_wallet".
3. If it is a handbag, purse, or satchel, use "leather_bag".
4. If unsure, use the appropriate "generic_" ID.

CRITICAL: Respond ONLY with valid JSON, no markdown.
{"item_id": "EXACT_ID", "confidence": 0.95, "reasoning": "Brief reason"}`;
        };
    }

    if (typeof priceUtils.buildOpenRouterVisionRequestBody !== 'function') {
        priceUtils.buildOpenRouterVisionRequestBody = function buildOpenRouterVisionRequestBody(imageUrl, modelName, promptText) {
            const prompt = typeof promptText === 'string' && promptText.length > 0
                ? promptText
                : (typeof priceUtils.buildOpenRouterVisionPrompt === 'function'
                    ? priceUtils.buildOpenRouterVisionPrompt()
                    : '');
            return {
                model: modelName || 'google/gemini-flash-1.5-8b',
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            { type: 'image_url', image_url: { url: imageUrl } }
                        ]
                    }
                ],
                max_tokens: 200,
                temperature: 0.1
            };
        };
    }

    if (typeof priceUtils.resolveVisionAnalyzeImageFlow !== 'function') {
        priceUtils.resolveVisionAnalyzeImageFlow = async function resolveVisionAnalyzeImageFlow(
            client,
            imageBase64,
            fallbackToManual,
            configuredProvider,
            callOpenRouterFn,
            callDeepSeekFn,
            callGeminiFn,
            fallbackToManualFn,
            consoleObj
        ) {
            const logger = consoleObj || console;
            const provider = typeof priceUtils.resolveVisionProvider === 'function'
                ? priceUtils.resolveVisionProvider(configuredProvider)
                : (configuredProvider || 'GEMINI');

            logger.log(`[VISION API] Analyzing image with ${provider}...`);

            try {
                const result = typeof priceUtils.dispatchVisionProviderCall === 'function'
                    ? await priceUtils.dispatchVisionProviderCall(provider, {
                        openRouter: callOpenRouterFn,
                        deepSeek: callDeepSeekFn,
                        gemini: callGeminiFn
                    })
                    : await (provider === 'OPENROUTER'
                        ? callOpenRouterFn()
                        : provider === 'DEEPSEEK'
                            ? callDeepSeekFn()
                            : callGeminiFn());

                if (typeof priceUtils.logVisionResultSummary === 'function') {
                    priceUtils.logVisionResultSummary(provider, result);
                } else {
                    logger.log('[VISION API] Provider:', provider);
                    logger.log('[VISION API] Predicted:', result?.topPrediction?.label);
                    logger.log('[VISION API] Confidence:', result?.confidence);
                }

                logger.log('[VISION API] Success - returning AI result');
                return result;
            } catch (error) {
                logger.error('[VISION API] Error:', error);
                if (client) {
                    client.failureCount = Number(client.failureCount || 0) + 1;
                }

                if (fallbackToManual && typeof fallbackToManualFn === 'function') {
                    logger.log('[VISION API] Falling back to manual selection');
                    return await fallbackToManualFn(imageBase64);
                }

                throw error;
            }
        };
    }

    if (typeof priceUtils.resolveGeminiVisionCallFlow !== 'function') {
        priceUtils.resolveGeminiVisionCallFlow = async function resolveGeminiVisionCallFlow(
            client,
            imageBase64,
            configObj,
            displayNames,
            fetchFn,
            performanceObj,
            consoleObj
        ) {
            const perf = performanceObj || performance;
            const logger = consoleObj || console;
            const fetchImpl = fetchFn || fetch;
            const startTime = perf.now();

            try {
                const base64Image = typeof priceUtils.stripImageDataUrlPrefix === 'function'
                    ? priceUtils.stripImageDataUrlPrefix(imageBase64)
                    : String(imageBase64 || '').replace(/^data:image\/(png|jpg|jpeg|webp);base64,/, '');

                logger.log('[GEMINI] Analyzing image...');

                const requestBody = typeof priceUtils.buildGeminiVisionRequestBody === 'function'
                    ? priceUtils.buildGeminiVisionRequestBody(base64Image)
                    : {
                        contents: [{
                            parts: [
                                {
                                    text: 'Classify this Moroccan handicraft image and return ONLY JSON: {"item_id":"exact_id","confidence":0.85,"reasoning":"brief visual reasoning"}'
                                },
                                {
                                    inline_data: {
                                        mime_type: 'image/jpeg',
                                        data: base64Image
                                    }
                                }
                            ]
                        }],
                        safetySettings: [
                            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
                        ],
                        generationConfig: {
                            temperature: 0.1,
                            maxOutputTokens: 300
                        }
                    };

                logger.log('[GEMINI] Sending request...');

                const response = await fetchImpl(
                    `${configObj.GEMINI_ENDPOINT}?key=${configObj.GEMINI_API_KEY}`,
                    {
                        method: 'POST',
                        headers: typeof priceUtils.buildGeminiHeaders === 'function'
                            ? priceUtils.buildGeminiHeaders()
                            : { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestBody)
                    }
                );

                if (!response.ok) {
                    const errorText = await response.text();
                    logger.error('[GEMINI] API Error:', errorText);
                    throw new Error(`Gemini API ${response.status}: ${errorText}`);
                }

                const data = await response.json();

                let extractedResultText = '';
                let parsed;
                if (typeof priceUtils.parseGeminiVisionClassificationResponse === 'function') {
                    try {
                        const classification = priceUtils.parseGeminiVisionClassificationResponse(data);
                        extractedResultText = classification.extractedText;
                        parsed = classification.parsed;
                    } catch (parseError) {
                        if (parseError && parseError.message === 'Invalid Gemini response structure') {
                            logger.warn('Gemini blocked response (safety?)', data);
                        }
                        if (parseError && parseError.message === 'Invalid response format') {
                            throw new Error('Invalid response format - missing item_id or confidence');
                        }
                        throw parseError;
                    }
                } else {
                    if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                        logger.warn('Gemini blocked response (safety?)', data);
                        throw new Error('Invalid Gemini response structure');
                    }

                    const resultText = data.candidates[0].content.parts[0].text;
                    const cleanedResultText = typeof priceUtils.cleanVisionJsonText === 'function'
                        ? priceUtils.cleanVisionJsonText(resultText)
                        : resultText.replace(/```json/gi, '').replace(/```/g, '').trim();
                    extractedResultText = typeof priceUtils.extractVisionJsonObject === 'function'
                        ? priceUtils.extractVisionJsonObject(cleanedResultText)
                        : cleanedResultText;
                    parsed = JSON.parse(extractedResultText);
                    if (!parsed.item_id || !parsed.confidence) {
                        throw new Error('Invalid response format - missing item_id or confidence');
                    }
                }

                logger.log('[GEMINI] Raw JSON:', extractedResultText);

                const responseTime = perf.now() - startTime;
                if (client) {
                    client.requestCount = Number(client.requestCount || 0) + 1;
                }

                logger.log('[GEMINI] SUCCESS:', {
                    item: parsed.item_id,
                    confidence: (parsed.confidence * 100).toFixed(0) + '%',
                    time: responseTime + 'ms'
                });

                if (typeof priceUtils.buildVisionClassificationResult === 'function') {
                    return priceUtils.buildVisionClassificationResult(parsed, 'gemini', responseTime, displayNames);
                }

                return {
                    topPrediction: {
                        label: parsed.item_id,
                        displayName: displayNames[parsed.item_id] || parsed.item_id,
                        confidence: parsed.confidence
                    },
                    confidence: parsed.confidence,
                    reasoning: parsed.reasoning,
                    responseTime: Math.round(responseTime),
                    provider: 'gemini',
                    alternatives: []
                };
            } catch (error) {
                logger.error('[GEMINI] Error:', error);
                throw error;
            }
        };
    }

    if (typeof priceUtils.resolveDeepSeekVisionCallFlow !== 'function') {
        priceUtils.resolveDeepSeekVisionCallFlow = async function resolveDeepSeekVisionCallFlow(
            client,
            imageBase64,
            configObj,
            displayNames,
            fetchFn,
            performanceObj,
            consoleObj,
            alertFn
        ) {
            const perf = performanceObj || performance;
            const logger = consoleObj || console;
            const fetchImpl = fetchFn || fetch;
            const notify = typeof alertFn === 'function' ? alertFn : (typeof windowObj.alert === 'function' ? windowObj.alert.bind(windowObj) : null);
            const startTime = perf.now();

            try {
                if (!configObj.DEEPSEEK_API_KEY) {
                    throw new Error('DeepSeek API key not configured! Add your key to CONFIG.DEEPSEEK_API_KEY');
                }

                const imageUrl = typeof priceUtils.ensureImageDataUrl === 'function'
                    ? priceUtils.ensureImageDataUrl(imageBase64)
                    : (String(imageBase64 || '').startsWith('data:')
                        ? imageBase64
                        : `data:image/jpeg;base64,${imageBase64}`);

                logger.log('[DEEPSEEK] Analyzing image...');

                const requestBody = typeof priceUtils.buildDeepSeekVisionRequestBody === 'function'
                    ? priceUtils.buildDeepSeekVisionRequestBody(imageUrl, configObj.DEEPSEEK_MODEL || 'deepseek-chat')
                    : {
                        model: configObj.DEEPSEEK_MODEL || 'deepseek-chat',
                        messages: [
                            {
                                role: 'user',
                                content: [
                                    {
                                        type: 'text',
                                        text: 'Classify this Moroccan handicraft image and return ONLY JSON: {"item_id":"exact_id","confidence":0.95,"reasoning":"brief visual reasoning"}'
                                    },
                                    { type: 'image_url', image_url: { url: imageUrl } }
                                ]
                            }
                        ],
                        max_tokens: 200,
                        temperature: 0.1
                    };

                logger.log('[DEEPSEEK] Sending request to:', configObj.DEEPSEEK_ENDPOINT);

                const response = await fetchImpl(configObj.DEEPSEEK_ENDPOINT, {
                    method: 'POST',
                    headers: typeof priceUtils.buildDeepSeekHeaders === 'function'
                        ? priceUtils.buildDeepSeekHeaders(configObj.DEEPSEEK_API_KEY)
                        : {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${configObj.DEEPSEEK_API_KEY}`
                        },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`DeepSeek API ${response.status}: ${errorText}`);
                }

                const data = await response.json();

                let extractedResultText = '';
                let parsed;
                if (typeof priceUtils.parseChatVisionClassificationResponse === 'function') {
                    try {
                        const classification = priceUtils.parseChatVisionClassificationResponse(data, 'DeepSeek');
                        extractedResultText = classification.extractedText;
                        parsed = classification.parsed;
                    } catch (parseError) {
                        logger.warn('DeepSeek invalid response', data);
                        throw parseError;
                    }
                } else {
                    if (!data?.choices?.[0]?.message?.content) {
                        logger.warn('DeepSeek invalid response', data);
                        throw new Error('Invalid DeepSeek response structure');
                    }
                    const resultText = data.choices[0].message.content;
                    const cleanedResultText = typeof priceUtils.cleanVisionJsonText === 'function'
                        ? priceUtils.cleanVisionJsonText(resultText)
                        : resultText.replace(/```json/gi, '').replace(/```/g, '').trim();
                    extractedResultText = typeof priceUtils.extractVisionJsonObject === 'function'
                        ? priceUtils.extractVisionJsonObject(cleanedResultText)
                        : cleanedResultText;
                    parsed = JSON.parse(extractedResultText);
                    if (!parsed.item_id || !parsed.confidence) {
                        throw new Error('Invalid response format');
                    }
                }

                logger.log('[DEEPSEEK] Raw JSON:', extractedResultText);

                const responseTime = perf.now() - startTime;
                if (client) {
                    client.requestCount = Number(client.requestCount || 0) + 1;
                }

                if (notify) {
                    notify('[DEEPSEEK] SUCCESS!\nItem: ' + parsed.item_id + '\nConfidence: ' + (parsed.confidence * 100).toFixed(0) + '%');
                }

                if (typeof priceUtils.buildVisionClassificationResult === 'function') {
                    return priceUtils.buildVisionClassificationResult(parsed, 'deepseek', responseTime, displayNames);
                }

                return {
                    topPrediction: {
                        label: parsed.item_id,
                        displayName: displayNames[parsed.item_id] || parsed.item_id,
                        confidence: parsed.confidence
                    },
                    confidence: parsed.confidence,
                    reasoning: parsed.reasoning,
                    responseTime: Math.round(responseTime),
                    provider: 'deepseek',
                    alternatives: []
                };
            } catch (error) {
                logger.error('[DEEPSEEK] Error:', error);
                if (notify) {
                    notify('[DEEPSEEK] API Error:\n' + error.message);
                }
                throw error;
            }
        };
    }

    if (typeof priceUtils.resolveOpenRouterVisionCallFlow !== 'function') {
        priceUtils.resolveOpenRouterVisionCallFlow = async function resolveOpenRouterVisionCallFlow(
            client,
            imageBase64,
            configObj,
            displayNames,
            fetchFn,
            performanceObj,
            consoleObj,
            alertFn
        ) {
            const perf = performanceObj || performance;
            const logger = consoleObj || console;
            const fetchImpl = fetchFn || fetch;
            const notify = typeof alertFn === 'function' ? alertFn : (typeof windowObj.alert === 'function' ? windowObj.alert.bind(windowObj) : null);
            const startTime = perf.now();

            try {
                if (!configObj.OPENROUTER_API_KEY) {
                    throw new Error('OpenRouter API key not configured! Get your FREE key at openrouter.ai/keys');
                }

                const imageUrl = typeof priceUtils.ensureImageDataUrl === 'function'
                    ? priceUtils.ensureImageDataUrl(imageBase64)
                    : (String(imageBase64 || '').startsWith('data:')
                        ? imageBase64
                        : `data:image/jpeg;base64,${imageBase64}`);

                logger.log('[OPENROUTER] Analyzing image with model:', configObj.OPENROUTER_MODEL);

                const requestBody = typeof priceUtils.buildOpenRouterVisionRequestBody === 'function'
                    ? priceUtils.buildOpenRouterVisionRequestBody(imageUrl, configObj.OPENROUTER_MODEL || 'google/gemini-flash-1.5-8b')
                    : {
                        model: configObj.OPENROUTER_MODEL || 'google/gemini-flash-1.5-8b',
                        messages: [
                            {
                                role: 'user',
                                content: [
                                    {
                                        type: 'text',
                                        text: 'Classify this Moroccan handicraft image and return ONLY JSON: {"item_id":"exact_id","confidence":0.95,"reasoning":"brief reason"}'
                                    },
                                    { type: 'image_url', image_url: { url: imageUrl } }
                                ]
                            }
                        ],
                        max_tokens: 200,
                        temperature: 0.1
                    };

                logger.log('[OPENROUTER] Sending request...');

                const response = await fetchImpl(configObj.OPENROUTER_ENDPOINT, {
                    method: 'POST',
                    headers: typeof priceUtils.buildOpenRouterHeaders === 'function'
                        ? priceUtils.buildOpenRouterHeaders(configObj.OPENROUTER_API_KEY)
                        : {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${configObj.OPENROUTER_API_KEY}`,
                            'HTTP-Referer': 'https://alidade.netlify.app',
                            'X-Title': 'Alidade Souk Assistant'
                        },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`OpenRouter API ${response.status}: ${errorText}`);
                }

                const data = await response.json();

                let extractedResultText = '';
                let parsed;
                if (typeof priceUtils.parseChatVisionClassificationResponse === 'function') {
                    try {
                        const classification = priceUtils.parseChatVisionClassificationResponse(data, 'OpenRouter');
                        extractedResultText = classification.extractedText;
                        parsed = classification.parsed;
                    } catch (parseError) {
                        logger.warn('OpenRouter invalid response', data);
                        throw parseError;
                    }
                } else {
                    if (!data?.choices?.[0]?.message?.content) {
                        logger.warn('OpenRouter invalid response', data);
                        throw new Error('Invalid OpenRouter response structure');
                    }
                    const resultText = data.choices[0].message.content;
                    const cleanedResultText = typeof priceUtils.cleanVisionJsonText === 'function'
                        ? priceUtils.cleanVisionJsonText(resultText)
                        : resultText.replace(/```json/gi, '').replace(/```/g, '').trim();
                    extractedResultText = typeof priceUtils.extractVisionJsonObject === 'function'
                        ? priceUtils.extractVisionJsonObject(cleanedResultText)
                        : cleanedResultText;
                    parsed = JSON.parse(extractedResultText);
                    if (!parsed.item_id || !parsed.confidence) {
                        throw new Error('Invalid response format');
                    }
                }

                logger.log('[OPENROUTER] Raw JSON:', extractedResultText);

                const responseTime = perf.now() - startTime;
                if (client) {
                    client.requestCount = Number(client.requestCount || 0) + 1;
                }

                if (notify) {
                    notify('[OPENROUTER] SUCCESS!\nItem: ' + parsed.item_id + '\nConfidence: ' + (parsed.confidence * 100).toFixed(0) + '%');
                }

                if (typeof priceUtils.buildVisionClassificationResult === 'function') {
                    return priceUtils.buildVisionClassificationResult(parsed, 'openrouter', responseTime, displayNames);
                }

                return {
                    topPrediction: {
                        label: parsed.item_id,
                        displayName: displayNames[parsed.item_id] || parsed.item_id,
                        confidence: parsed.confidence
                    },
                    confidence: parsed.confidence,
                    reasoning: parsed.reasoning,
                    responseTime: Math.round(responseTime),
                    provider: 'openrouter',
                    alternatives: []
                };
            } catch (error) {
                logger.error('[OPENROUTER] Error:', error);
                if (notify) {
                    notify('[OPENROUTER] API Error:\n' + error.message);
                }
                throw error;
            }
        };
    }
})(typeof window !== 'undefined' ? window : null);
