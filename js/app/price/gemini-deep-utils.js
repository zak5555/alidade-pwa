/**
 * ALIDADE Gemini Deep Utilities
 * Extracted from VisionAPIClient.callGeminiDeep in legacy app.js with compatibility hooks.
 */
(function bootstrapGeminiDeepUtils(windowObj) {
    if (!windowObj) return;

    const priceUtils = windowObj.ALIDADE_PRICE_UTILS || (windowObj.ALIDADE_PRICE_UTILS = {});
    const geminiDeepDebugLog = (...args) => {
        if (windowObj.__ALIDADE_DEBUG_LOGS__ === true) {
            console.log(...args);
        }
    };

    if (typeof priceUtils.stripGeminiDeepZone !== 'function') {
        priceUtils.stripGeminiDeepZone = function stripGeminiDeepZone(b64) {
            if (!b64 || typeof b64 !== 'string') {
                console.error('[GEMINI-DEEP] Invalid zone data:', typeof b64, b64?.length);
                throw new Error('Zone data is empty or invalid');
            }
            return b64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
        };
    }

    if (typeof priceUtils.cleanGeminiDeepResponseText !== 'function') {
        priceUtils.cleanGeminiDeepResponseText = function cleanGeminiDeepResponseText(resultText) {
            return resultText
                .replace(/^\uFEFF/, '')                     // BOM
                .replace(/```json\s*/gi, '')                // ```json
                .replace(/```\s*/g, '')                     // ```
                .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // control chars
                .trim();
        };
    }

    if (typeof priceUtils.parseGeminiDeepJson !== 'function') {
        priceUtils.parseGeminiDeepJson = function parseGeminiDeepJson(resultText) {
            try {
                return JSON.parse(resultText);
            } catch (parseError) {
                console.error('[GEMINI-DEEP] JSON parse failed. Error:', parseError.message);
                console.error('[GEMINI-DEEP] Attempted to parse:', resultText.substring(0, 500));

                // Last resort: try fixing common JSON issues
                try {
                    const fixed = resultText
                        .replace(/,\s*}/g, '}')       // trailing commas
                        .replace(/,\s*]/g, ']')        // trailing commas in arrays
                        .replace(/'/g, '"')            // single quotes
                        .replace(/(\w+):/g, '"$1":');  // unquoted keys
                    const parsed = JSON.parse(fixed);
                    geminiDeepDebugLog('[GEMINI-DEEP] ✅ Fixed JSON parsed successfully');
                    return parsed;
                } catch {
                    throw new Error(`JSON parse failed: ${parseError.message}`);
                }
            }
        };
    }

    if (typeof priceUtils.logGeminiDeepZoneSizes !== 'function') {
        priceUtils.logGeminiDeepZoneSizes = function logGeminiDeepZoneSizes(zones) {
            geminiDeepDebugLog('[GEMINI-DEEP] Zone sizes - overall:', zones.overall?.length || 'MISSING',
                '| detail:', zones.detail?.length || 'MISSING',
                '| material:', zones.material?.length || 'MISSING');
        };
    }

    if (typeof priceUtils.buildGeminiDeepPrompt !== 'function') {
        priceUtils.buildGeminiDeepPrompt = function buildGeminiDeepPrompt() {
            return `You are an expert Moroccan handicraft appraiser with 20 years of experience in Marrakech souks.

I'm providing you with ONE item photographed once, auto-processed into 3 views:
- IMAGE 1 (Overall View): The complete item, background cropped
- IMAGE 2 (Detail Zone): Auto-extracted craftsmanship close-up (highest detail area)
- IMAGE 3 (Material Zone): Auto-extracted texture/material close-up

Analyze ALL THREE images and provide a comprehensive assessment.

VALID ITEM IDs: ["tagine_pot_large","tagine_pot_small","ceramic_bowl","ceramic_plate","ceramic_tile","leather_bag","leather_wallet","leather_belt","leather_pouf","leather_shoes","babouche_plain","babouche_embroidered","rug_small","rug_medium","rug_large","rug_runner","lantern_brass","lantern_glass","lantern_metal","teapot_silver","tea_glasses","djellaba","kaftan","scarf_silk","scarf_wool","argan_oil","spices_mixed","saffron","ras_el_hanout","jewelry_silver","jewelry_gold","jewelry_berber","generic_leather","generic_ceramic","generic_metal","generic_textile","generic_food","generic_item"]

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "item": {
    "item_id": "exact_id_from_list",
    "subtype": "brief_description",
    "confidence": 0.85
  },
  "material": {
    "score": 7,
    "type": "genuine_leather",
    "indicators": ["natural_grain", "consistent_color"],
    "concerns": []
  },
  "craftsmanship": {
    "score": 8,
    "technique": "hand_stitched",
    "details": ["even_stitches", "clean_edges"],
    "issues": []
  },
  "authenticity": {
    "genuine_handmade": true,
    "markers": ["hand_stitching", "traditional_pattern"],
    "red_flags": []
  },
  "condition": {
    "score": 9,
    "wear": "minimal",
    "damage": [],
    "age": "new"
  },
  "quality_multiplier": 1.8,
  "reasoning": "Brief overall assessment"
}

SCORING GUIDE for quality_multiplier:
- 0.5 = Tourist trap junk (machine-made, fake materials)
- 1.0 = Average souk quality
- 1.5 = Good handmade quality
- 2.0 = Excellent artisan work
- 3.0 = Museum/collector grade`;
        };
    }

    if (typeof priceUtils.buildGeminiDeepRequestBody !== 'function') {
        priceUtils.buildGeminiDeepRequestBody = function buildGeminiDeepRequestBody(prompt, overallData, detailData, materialData) {
            return {
                contents: [{
                    parts: [
                        { text: prompt },
                        { inline_data: { mime_type: 'image/jpeg', data: overallData } },
                        { inline_data: { mime_type: 'image/jpeg', data: detailData } },
                        { inline_data: { mime_type: 'image/jpeg', data: materialData } }
                    ]
                }],
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                ],
                generationConfig: {
                    temperature: 0.15,
                    maxOutputTokens: 2048,
                    responseMimeType: 'application/json'
                }
            };
        };
    }

    if (typeof priceUtils.prepareGeminiDeepZones !== 'function') {
        priceUtils.prepareGeminiDeepZones = function prepareGeminiDeepZones(zones) {
            if (typeof priceUtils.logGeminiDeepZoneSizes === 'function') {
                priceUtils.logGeminiDeepZoneSizes(zones || {});
            } else {
                geminiDeepDebugLog('[GEMINI-DEEP] Zone sizes - overall:', zones?.overall?.length || 'MISSING',
                    '| detail:', zones?.detail?.length || 'MISSING',
                    '| material:', zones?.material?.length || 'MISSING');
            }
            const stripZone = typeof priceUtils.stripGeminiDeepZone === 'function'
                ? priceUtils.stripGeminiDeepZone
                : function stripZoneFallback(b64) {
                    if (!b64 || typeof b64 !== 'string') {
                        throw new Error('Zone data is empty or invalid');
                    }
                    return b64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
                };
            return {
                overallData: stripZone(zones?.overall),
                detailData: stripZone(zones?.detail),
                materialData: stripZone(zones?.material)
            };
        };
    }

    if (typeof priceUtils.parseGeminiDeepApiResponse !== 'function') {
        priceUtils.parseGeminiDeepApiResponse = function parseGeminiDeepApiResponse(responseText) {
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (jsonErr) {
                console.error('[GEMINI-DEEP] Response is not valid JSON:', jsonErr.message);
                console.error('[GEMINI-DEEP] Raw body preview:', responseText.substring(0, 500));
                throw new Error(`Gemini returned invalid JSON: ${jsonErr.message}`);
            }

            // Log finish reason for diagnostics
            const finishReason = data.candidates?.[0]?.finishReason;
            geminiDeepDebugLog('[GEMINI-DEEP] Finish reason:', finishReason || 'UNKNOWN');

            if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
                console.error('[GEMINI-DEEP] Response structure:', JSON.stringify(data).substring(0, 500));
                throw new Error(`Invalid Gemini response (finishReason: ${finishReason})`);
            }

            return {
                data,
                finishReason,
                resultText: data.candidates[0].content.parts[0].text
            };
        };
    }

    if (typeof priceUtils.parseGeminiDeepAnalysisResponse !== 'function') {
        priceUtils.parseGeminiDeepAnalysisResponse = function parseGeminiDeepAnalysisResponse(responseText) {
            const apiResponse = typeof priceUtils.parseGeminiDeepApiResponse === 'function'
                ? priceUtils.parseGeminiDeepApiResponse(responseText)
                : (() => {
                    const data = JSON.parse(responseText);
                    const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (!resultText) {
                        throw new Error('Invalid Gemini response');
                    }
                    return {
                        data,
                        finishReason: data?.candidates?.[0]?.finishReason,
                        resultText
                    };
                })();

            const rawResultText = apiResponse.resultText;
            const cleanedText = typeof priceUtils.cleanGeminiDeepResponseText === 'function'
                ? priceUtils.cleanGeminiDeepResponseText(rawResultText)
                : rawResultText;
            const extractedText = typeof priceUtils.extractVisionJsonObject === 'function'
                ? priceUtils.extractVisionJsonObject(cleanedText)
                : cleanedText;
            if (!extractedText) {
                throw new Error('No JSON object found in Gemini response');
            }
            const parsed = typeof priceUtils.parseGeminiDeepJson === 'function'
                ? priceUtils.parseGeminiDeepJson(extractedText)
                : JSON.parse(extractedText);

            return {
                apiResponse,
                rawResultText,
                cleanedText,
                extractedText,
                parsed
            };
        };
    }

    if (typeof priceUtils.resolveGeminiDeepCallFlow !== 'function') {
        priceUtils.resolveGeminiDeepCallFlow = async function resolveGeminiDeepCallFlow(
            client,
            zones,
            configObj,
            fetchFn,
            performanceObj,
            consoleObj
        ) {
            const logger = consoleObj || console;
            const perf = performanceObj || performance;
            const fetchImpl = fetchFn || fetch;
            const startTime = perf.now();

            logger.log('[GEMINI-DEEP] Starting multi-zone deep analysis...');

            const prompt = typeof priceUtils.buildGeminiDeepPrompt === 'function'
                ? priceUtils.buildGeminiDeepPrompt()
                : `Analyze these 3 Moroccan handicraft image zones and return ONLY JSON with:
{"item":{"item_id":"exact_id","subtype":"brief","confidence":0.85},"material":{"score":7,"type":"material","indicators":[],"concerns":[]},"craftsmanship":{"score":7,"technique":"technique","details":[],"issues":[]},"authenticity":{"genuine_handmade":true,"markers":[],"red_flags":[]},"condition":{"score":8,"wear":"light","damage":[],"age":"new"},"quality_multiplier":1.5,"reasoning":"brief overall assessment"}`;

            try {
                if (typeof priceUtils.logGeminiDeepZoneSizes === 'function') {
                    priceUtils.logGeminiDeepZoneSizes(zones);
                } else {
                    logger.log('[GEMINI-DEEP] Zone sizes - overall:', zones?.overall?.length || 'MISSING',
                        '| detail:', zones?.detail?.length || 'MISSING',
                        '| material:', zones?.material?.length || 'MISSING');
                }

                const zoneData = typeof priceUtils.prepareGeminiDeepZones === 'function'
                    ? priceUtils.prepareGeminiDeepZones(zones)
                    : (() => {
                        const stripZone = (b64) => {
                            if (!b64 || typeof b64 !== 'string') {
                                throw new Error('Zone data is empty or invalid');
                            }
                            return b64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
                        };
                        return {
                            overallData: stripZone(zones?.overall),
                            detailData: stripZone(zones?.detail),
                            materialData: stripZone(zones?.material)
                        };
                    })();

                const requestBody = typeof priceUtils.buildGeminiDeepRequestBody === 'function'
                    ? priceUtils.buildGeminiDeepRequestBody(
                        prompt,
                        zoneData.overallData,
                        zoneData.detailData,
                        zoneData.materialData
                    )
                    : {
                        contents: [{
                            parts: [
                                { text: prompt },
                                { inline_data: { mime_type: 'image/jpeg', data: zoneData.overallData } },
                                { inline_data: { mime_type: 'image/jpeg', data: zoneData.detailData } },
                                { inline_data: { mime_type: 'image/jpeg', data: zoneData.materialData } }
                            ]
                        }],
                        safetySettings: [
                            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
                        ],
                        generationConfig: {
                            temperature: 0.15,
                            maxOutputTokens: 2048,
                            responseMimeType: 'application/json'
                        }
                    };

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
                    logger.error('[GEMINI-DEEP] API error response:', errorText.substring(0, 500));
                    throw new Error(`Gemini Deep API ${response.status}: ${errorText.substring(0, 200)}`);
                }

                const responseText = await response.text();
                logger.log('[GEMINI-DEEP] Response length:', responseText.length);

                const deepResponse = typeof priceUtils.parseGeminiDeepAnalysisResponse === 'function'
                    ? priceUtils.parseGeminiDeepAnalysisResponse(responseText)
                    : (() => {
                        const parsedApiResponse = typeof priceUtils.parseGeminiDeepApiResponse === 'function'
                            ? priceUtils.parseGeminiDeepApiResponse(responseText)
                            : (() => {
                                const data = JSON.parse(responseText);
                                const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                                if (!resultText) {
                                    throw new Error('Invalid Gemini response');
                                }
                                return { resultText };
                            })();
                        const rawResultText = parsedApiResponse.resultText;
                        if (!rawResultText) {
                            throw new Error('Invalid Gemini response');
                        }
                        const cleanedText = typeof priceUtils.cleanGeminiDeepResponseText === 'function'
                            ? priceUtils.cleanGeminiDeepResponseText(rawResultText)
                            : rawResultText
                                .replace(/^\uFEFF/, '')
                                .replace(/```json\s*/gi, '')
                                .replace(/```\s*/g, '')
                                .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
                                .trim();
                        const extractedText = typeof priceUtils.extractVisionJsonObject === 'function'
                            ? priceUtils.extractVisionJsonObject(cleanedText)
                            : cleanedText;
                        if (!extractedText) {
                            throw new Error('No JSON object found in Gemini response');
                        }
                        return {
                            rawResultText,
                            parsed: typeof priceUtils.parseGeminiDeepJson === 'function'
                                ? priceUtils.parseGeminiDeepJson(extractedText)
                                : JSON.parse(extractedText)
                        };
                    })();

                logger.log('[GEMINI-DEEP] Raw response length:', deepResponse.rawResultText.length);
                logger.log('[GEMINI-DEEP] Raw response preview:', deepResponse.rawResultText.substring(0, 200));

                const parsed = deepResponse.parsed;
                const elapsed = Math.round(perf.now() - startTime);
                logger.log('[GEMINI-DEEP] Deep analysis complete in', elapsed, 'ms');
                logger.log('[GEMINI-DEEP] Item:', parsed.item?.item_id, '| Quality:', parsed.quality_multiplier);

                if (client) {
                    client.requestCount = Number(client.requestCount || 0) + 1;
                }

                if (typeof priceUtils.buildGeminiDeepResult === 'function') {
                    return priceUtils.buildGeminiDeepResult(parsed, elapsed);
                }

                return {
                    ...parsed,
                    responseTime: elapsed,
                    provider: 'gemini-deep'
                };
            } catch (error) {
                logger.error('[GEMINI-DEEP] Deep analysis failed:', error);
                throw error;
            }
        };
    }

    if (typeof priceUtils.buildGeminiDeepResult !== 'function') {
        priceUtils.buildGeminiDeepResult = function buildGeminiDeepResult(parsed, elapsedMs) {
            return {
                ...parsed,
                responseTime: elapsedMs,
                provider: 'gemini-deep'
            };
        };
    }
})(typeof window !== 'undefined' ? window : null);

