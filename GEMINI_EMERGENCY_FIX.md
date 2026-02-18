# 🚨 EMERGENCY FIX - Gemini Integration Not Working

## 🎯 PROBLEMS IDENTIFIED

**From user screenshots:**

1. ✅ Gemini integration exists (badge shows "POWERED BY GEMINI")
2. ❌ Camera simulation error thrown
3. ❌ Manual category selector not appearing after photo upload
4. ❌ Error when entering price
5. ❌ Stuck in "IDENTIFY ITEM" loop

---

## 🔧 ROOT CAUSES & FIXES

### **FIX 1: Remove Camera Simulation Block**

**Problem:**
```javascript
// Somewhere in camera code:
if (CONFIG.SIMULATION_MODE) {
    throw new Error('CAMERA_SIMULATION_MODE');
}
```

**Even though you set `SIMULATION_MODE: false`, there might be OTHER checks!**

**Solution - Find and REPLACE:**

**Search for:** `CAMERA_SIMULATION_MODE` or `SIMULATION_MODE`

**In camera/photo upload code (probably around line 16680 in feature_code.js):**

```javascript
// ❌ BAD (current):
if (CONFIG.SIMULATION_MODE || !navigator.mediaDevices) {
    throw new Error('CAMERA_SIMULATION_MODE');
}

// ✅ GOOD (fix):
// Just allow photo upload always, no simulation check
```

**Complete fix:**

```javascript
// Find handleTestImageUpload or similar function
window.handleTestImageUpload = async function (event) {
    const file = event.target.files[0];
    if (!file) return;

    console.log('[CAMERA] Image selected:', file.name);

    const checker = getPriceChecker();

    try {
        // Show analyzing UI
        document.getElementById('price-check-initial').classList.add('hidden');
        document.getElementById('price-check-analyzing').classList.remove('hidden');

        // Convert to base64
        const imageBase64 = await fileToBase64(file);

        // ✅ FIX: Call Gemini directly (no simulation check)
        const classification = await checker.classifier.classify(imageBase64);

        // ✅ FIX: If low confidence OR error, show manual selector
        if (!classification || classification.confidence < 0.70) {
            console.warn('[CAMERA] Low confidence, showing manual selector');
            
            // Hide analyzing
            document.getElementById('price-check-analyzing').classList.add('hidden');
            
            // Show manual selector (should be a function you have)
            const manualResult = await showManualCategorySelector(imageBase64);
            
            if (!manualResult) {
                // User cancelled
                document.getElementById('price-check-initial').classList.remove('hidden');
                return;
            }
            
            classification = manualResult;
        }

        // Store classification
        checker.currentClassification = classification;

        // Show price input screen
        document.getElementById('price-check-analyzing').classList.add('hidden');
        document.getElementById('price-check-input').classList.remove('hidden');

        // Populate item info
        document.getElementById('detected-item-name').textContent = classification.topPrediction.displayName;
        document.getElementById('ai-confidence').textContent = `${Math.round(classification.confidence * 100)}%`;

    } catch (error) {
        console.error('[CAMERA] Upload failed:', error);
        
        // ✅ FIX: On ANY error, show manual selector
        document.getElementById('price-check-analyzing').classList.add('hidden');
        
        const manualResult = await showManualCategorySelector(imageBase64);
        
        if (manualResult) {
            checker.currentClassification = manualResult;
            
            // Continue to price input
            document.getElementById('price-check-input').classList.remove('hidden');
            document.getElementById('detected-item-name').textContent = manualResult.topPrediction.displayName;
            document.getElementById('ai-confidence').textContent = '100% (Manual)';
        } else {
            // Reset to initial
            document.getElementById('price-check-initial').classList.remove('hidden');
        }
    } finally {
        // Reset file input
        event.target.value = '';
    }
};

// Helper function
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
```

---

### **FIX 2: Implement Missing showManualCategorySelector**

**Problem:** Function might not exist or not working!

**Add this COMPLETE function:**

```javascript
/**
 * Show manual category selector with image preview
 * Returns classification object in same format as AI
 */
async function showManualCategorySelector(imageBase64) {
    return new Promise((resolve) => {
        // Categories from your price database
        const categories = [
            { id: 'tagine_pot_large', name: 'Tagine Pot (Large)', icon: '🫕', fair: 250, asking: 1000 },
            { id: 'tagine_pot_small', name: 'Tagine Pot (Small)', icon: '🍲', fair: 100, asking: 400 },
            { id: 'ceramic_bowl', name: 'Ceramic Bowl', icon: '🥣', fair: 100, asking: 300 },
            { id: 'ceramic_plate', name: 'Ceramic Plate', icon: '🍽️', fair: 120, asking: 400 },
            { id: 'leather_bag', name: 'Leather Bag', icon: '👜', fair: 350, asking: 1500 },
            { id: 'babouche_embroidered', name: 'Embroidered Babouche', icon: '🥿', fair: 350, asking: 1400 },
            { id: 'babouche_plain', name: 'Plain Babouche', icon: '👞', fair: 180, asking: 700 },
            { id: 'rug_small', name: 'Small Rug', icon: '🧶', fair: 1200, asking: 5000 },
            { id: 'lantern_brass', name: 'Brass Lantern', icon: '🏮', fair: 200, asking: 800 },
            { id: 'argan_oil', name: 'Argan Oil', icon: '🫙', fair: 150, asking: 300 }
        ];

        // Create modal HTML
        const modalHTML = `
            <div id="manual-category-modal" 
                 class="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
                 style="animation: fadeIn 0.2s ease-in;">
                <div class="bg-void-900 border-2 border-signal-amber rounded-machined w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-glow-amber">
                    
                    <!-- Header -->
                    <div class="sticky top-0 bg-void-900 border-b border-void-700 p-4 z-10">
                        <div class="flex items-center justify-between">
                            <div>
                                <h2 class="text-signal-amber font-mono font-bold text-lg">
                                    📸 IDENTIFY ITEM
                                </h2>
                                <p class="text-zinc-400 text-xs mt-1">
                                    Select what you photographed
                                </p>
                            </div>
                            <button onclick="closeManualSelector(null)" 
                                    class="text-zinc-500 hover:text-zinc-300 text-2xl leading-none">
                                ✕
                            </button>
                        </div>
                    </div>
                    
                    <!-- Image Preview -->
                    <div class="p-4 border-b border-void-700 bg-void-950">
                        <img src="${imageBase64}" 
                             class="w-full h-64 object-contain rounded-machined border border-void-600 bg-void-800"
                             alt="Your photo">
                    </div>
                    
                    <!-- Category Grid -->
                    <div class="p-4 overflow-y-auto max-h-[50vh]">
                        <div class="grid grid-cols-2 gap-3">
                            ${categories.map(cat => `
                                <button 
                                    onclick="selectManualCategory('${cat.id}', '${cat.name}', ${cat.fair})"
                                    class="group p-4 bg-void-800 hover:bg-void-700 border border-void-600 hover:border-signal-emerald rounded-machined text-left transition-all active:scale-95">
                                    
                                    <div class="text-4xl mb-2">${cat.icon}</div>
                                    
                                    <div class="text-zinc-100 font-medium text-sm group-hover:text-signal-emerald mb-2">
                                        ${cat.name}
                                    </div>
                                    
                                    <div class="text-zinc-500 text-xs space-y-1">
                                        <div>Fair: <span class="text-signal-emerald">${cat.fair} DH</span></div>
                                        <div>Asking: <span class="text-signal-amber">${cat.asking} DH</span></div>
                                    </div>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div class="sticky bottom-0 bg-void-900 border-t border-void-700 p-4">
                        <button onclick="closeManualSelector(null)" 
                                class="w-full py-3 bg-void-700 hover:bg-void-600 text-zinc-400 font-mono text-sm rounded-machined transition-colors">
                            Cancel
                        </button>
                    </div>
                    
                </div>
            </div>
        `;

        // Insert modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Store resolve function globally
        window._manualCategoryResolve = resolve;
    });
}

// Global callback when user selects category
window.selectManualCategory = function(itemId, itemName, fairPrice) {
    console.log('[MANUAL] Category selected:', itemId);
    
    // Close modal
    const modal = document.getElementById('manual-category-modal');
    if (modal) modal.remove();
    
    // Resolve with classification object (same format as Gemini)
    if (window._manualCategoryResolve) {
        window._manualCategoryResolve({
            topPrediction: {
                label: itemId,
                displayName: itemName,
                confidence: 1.0  // Manual = 100% confidence
            },
            confidence: 1.0,
            method: 'manual_selection',
            alternatives: []
        });
        window._manualCategoryResolve = null;
    }
};

// Global callback for cancel
window.closeManualSelector = function(result) {
    const modal = document.getElementById('manual-category-modal');
    if (modal) modal.remove();
    
    if (window._manualCategoryResolve) {
        window._manualCategoryResolve(result); // null = cancelled
        window._manualCategoryResolve = null;
    }
};
```

---

### **FIX 3: Fix VisionAPIClient Gemini Call**

**Problem:** Gemini might be returning error or wrong format

**Add better error handling:**

```javascript
// In VisionAPIClient class, update _callGemini method:

async _callGemini(imageBase64) {
    const startTime = performance.now();
    
    try {
        // Remove data URL prefix if present
        const base64Image = imageBase64.replace(/^data:image\/(png|jpg|jpeg|webp);base64,/, '');
        
        console.log('[GEMINI] 🔍 Analyzing image...');
        
        const requestBody = {
            contents: [{
                parts: [
                    {
                        text: `You are an expert at identifying Moroccan handicraft items.

Analyze this image and identify what item is shown.

POSSIBLE ITEMS (respond with exact ID):
- tagine_pot_large (large terracotta cooking pot with conical lid)
- tagine_pot_small (small terracotta tagine)
- ceramic_bowl (ceramic dish or bowl)
- ceramic_plate (decorative plate)
- leather_bag (leather handbag or purse)
- babouche_embroidered (decorative slippers)
- babouche_plain (simple leather slippers)
- rug_small (carpet)
- lantern_brass (metal lantern)
- argan_oil (bottle of oil)

CRITICAL: Respond ONLY with valid JSON in this EXACT format:
{
  "item_id": "tagine_pot_large",
  "confidence": 0.95,
  "reasoning": "Terracotta material, conical shape, traditional Moroccan tagine design"
}

If unsure, use closest match with lower confidence (0.40-0.70).`
                    },
                    {
                        inline_data: {
                            mime_type: "image/jpeg",
                            data: base64Image
                        }
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 200,
                responseMimeType: "application/json"
            }
        };

        console.log('[GEMINI] 📡 Sending request...');

        const response = await fetch(
            `${CONFIG.GEMINI_ENDPOINT}?key=${CONFIG.GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[GEMINI] ❌ API error:', response.status, errorText);
            throw new Error(`Gemini API ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('[GEMINI] 📦 Raw response:', data);

        // Parse response
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            console.error('[GEMINI] ❌ Invalid response structure:', data);
            throw new Error('Invalid Gemini response structure');
        }

        const resultText = data.candidates[0].content.parts[0].text;
        console.log('[GEMINI] 📝 Result text:', resultText);

        // Parse JSON
        const parsed = JSON.parse(resultText);
        
        if (!parsed.item_id || !parsed.confidence) {
            console.error('[GEMINI] ❌ Missing required fields:', parsed);
            throw new Error('Invalid response format from Gemini');
        }

        const responseTime = performance.now() - startTime;
        console.log('[GEMINI] ✅ Success in', Math.round(responseTime), 'ms');

        // Map to our format
        return {
            topPrediction: {
                label: parsed.item_id,
                displayName: ITEM_DISPLAY_NAMES[parsed.item_id] || parsed.item_id,
                confidence: parsed.confidence
            },
            confidence: parsed.confidence,
            reasoning: parsed.reasoning,
            responseTime: Math.round(responseTime),
            provider: 'gemini',
            alternatives: []
        };

    } catch (error) {
        console.error('[GEMINI] 💥 Error:', error);
        throw error; // Re-throw to trigger fallback
    }
}
```

---

### **FIX 4: Add ITEM_DISPLAY_NAMES Mapping**

**Problem:** `ITEM_DISPLAY_NAMES[...]` might be undefined

**Make sure you have this object:**

```javascript
const ITEM_DISPLAY_NAMES = {
    'tagine_pot_large': '🫕 Tagine Pot (Large)',
    'tagine_pot_small': '🍲 Tagine Pot (Small)',
    'ceramic_bowl': '🥣 Ceramic Bowl',
    'ceramic_plate': '🍽️ Ceramic Plate',
    'leather_bag': '👜 Leather Bag',
    'babouche_embroidered': '🥿 Embroidered Babouche',
    'babouche_plain': '👞 Plain Babouche',
    'rug_small': '🧶 Small Rug',
    'lantern_brass': '🏮 Brass Lantern',
    'argan_oil': '🫙 Argan Oil'
};
```

---

### **FIX 5: Fix CONFIG Object**

**Make sure CONFIG has all required fields:**

```javascript
const CONFIG = {
    SIMULATION_MODE: false,  // ✅ CRITICAL: Must be false
    GEMINI_API_KEY: 'YOUR_ACTUAL_API_KEY_HERE',  // ⚠️ Replace!
    GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
    CONFIDENCE_THRESHOLD: 0.70,
    MAX_RETRIES: 2,
    TIMEOUT: 8000
};
```

---

## 🧪 TESTING PROCEDURE

### **Test 1: Upload Photo**
1. Open Price Checker
2. Click upload button
3. Select tagine photo
4. **Expected:**
   - Shows "Analyzing..." screen
   - Calls Gemini API
   - If success: Shows "Tagine Pot (Large)" with confidence
   - If fail: Shows manual selector modal

### **Test 2: Manual Selector**
1. If modal appears
2. Should see 10 category cards
3. Click "Tagine Pot (Large)"
4. **Expected:**
   - Modal closes
   - Shows item name + "100% (Manual)"
   - Price input appears

### **Test 3: Complete Flow**
1. Upload → Select category → Enter price (e.g., 50 DH)
2. Click "Check"
3. **Expected:**
   - Shows price analysis
   - No errors!

---

## 🚨 EMERGENCY DEBUGGING

**If still broken, check console for:**

```javascript
// Add this at the TOP of app.js for debugging:
window.DEBUG_MODE = true;

// Then check console for:
[CAMERA] Image selected: tagine.jpg
[GEMINI] 🔍 Analyzing image...
[GEMINI] 📡 Sending request...
[GEMINI] 📦 Raw response: {...}
[GEMINI] ✅ Success in 1234 ms

// Or manual fallback:
[GEMINI] 💥 Error: ...
[CAMERA] Falling back to manual selector
```

---

## 📋 COMPLETE CHECKLIST

Before it works, ensure:

- [ ] `CONFIG.SIMULATION_MODE = false`
- [ ] Gemini API key is correct
- [ ] No `throw new Error('CAMERA_SIMULATION_MODE')` in code
- [ ] `showManualCategorySelector()` function exists
- [ ] `ITEM_DISPLAY_NAMES` object exists
- [ ] VisionAPIClient has error handling
- [ ] File input resets after upload (`event.target.value = ''`)
- [ ] Modal closes properly after selection
- [ ] Classification stored in `checker.currentClassification`
- [ ] Price input screen shows after selection

---

## 🔧 QUICK FIX (If Everything Fails)

**Temporary workaround - Always use manual selector:**

```javascript
// In handleTestImageUpload, replace everything with:
window.handleTestImageUpload = async function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const imageBase64 = await fileToBase64(file);
    
    // Just show manual selector (skip Gemini for now)
    const result = await showManualCategorySelector(imageBase64);
    
    if (result) {
        const checker = getPriceChecker();
        checker.currentClassification = result;
        
        // Show price input
        document.getElementById('price-check-initial').classList.add('hidden');
        document.getElementById('price-check-input').classList.remove('hidden');
        document.getElementById('detected-item-name').textContent = result.topPrediction.displayName;
        document.getElementById('ai-confidence').textContent = '100% (Manual)';
    }
    
    event.target.value = '';
};
```

**This guarantees it works while you debug Gemini!**

---

## ✅ EXPECTED FINAL BEHAVIOR

**Good Flow:**
```
1. User uploads photo
2. Gemini analyzes (2 seconds)
3. Returns "Tagine Pot (Large), 95% confidence"
4. Shows price input screen
5. User enters vendor price
6. Shows analysis
7. Success! ✅
```

**Fallback Flow:**
```
1. User uploads photo
2. Gemini fails OR low confidence
3. Manual selector appears
4. User clicks category
5. Shows price input screen
6. User enters price
7. Shows analysis
8. Success! ✅
```

---

**IMPLEMENT THESE FIXES IN ORDER. TEST AFTER EACH FIX!** 🔧
