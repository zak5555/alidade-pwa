# 🔄 MISSION: Replace Mock AI with Real Vision API

## 🎯 OBJECTIVE

Replace the fake "simulation mode" in Price Checker with **real AI vision** using free/cheap APIs.

**Current Problem:**
```javascript
// Line 191-237 in feature_code.js
_mockClassify() {
    // Returns RANDOM item (ignores photo!)
    const picked = mockItems[Math.floor(Math.random() * mockItems.length)];
    return picked;
}
```

**What We Need:**
- Real image recognition
- Accurate item detection
- Free or cheap API
- Fast response (<3 seconds)
- Fallback to manual selection if fails

---

## 🆓 RECOMMENDED API: Google AI Studio (Gemini 2.0 Flash)

### **Why Gemini 2.0 Flash:**
✅ **FREE:** 1,500 requests/day (no credit card)
✅ **Excellent Vision:** Best-in-class object detection
✅ **Fast:** ~1-2 second response time
✅ **Reliable:** Google infrastructure (99.9% uptime)
✅ **Easy Setup:** 5 minutes to get API key
✅ **Generous Limits:** Enough for 100+ users/day

### **Pricing (When Free Tier Runs Out):**
```
Free Tier: 1,500 requests/day
Paid Tier: $0.00025 per image (¼ cent!)
          = $2.50 per 10,000 images
          = Extremely cheap
```

---

## 📋 STEP-BY-STEP IMPLEMENTATION

### **STEP 1: Get Free API Key (5 minutes)**

1. Go to: https://aistudio.google.com/
2. Click "Get API Key"
3. Create new project (name it "ALIDADE")
4. Copy API key (looks like: `AIzaSyB...xyz123`)
5. Store securely (we'll use environment variable)

---

### **STEP 2: Update Configuration**

**In `feature_code.js`, find CONFIG object (line 19-27):**

```javascript
// ❌ BEFORE (Mock Mode):
const CONFIG = {
    SIMULATION_MODE: true,
    MODEL_URL: 'https://api.alidade.app/models/...',
    API_URL: 'https://api.alidade.app/prices',
    // ...
};
```

**Replace with:**

```javascript
// ✅ AFTER (Real API):
const CONFIG = {
    SIMULATION_MODE: false,  // Disable mock
    VISION_API: 'GEMINI',    // Primary provider
    GEMINI_API_KEY: 'YOUR_API_KEY_HERE', // ⚠️ MOVE TO SERVER LATER!
    GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
    FALLBACK_PROVIDERS: ['HUGGINGFACE', 'MANUAL'], // Backup options
    CONFIDENCE_THRESHOLD: 0.70, // Require 70% confidence
    MAX_RETRIES: 2,
    TIMEOUT: 5000, // 5 seconds
};
```

---

### **STEP 3: Create Vision API Client**

**Add this NEW class after `ImageProcessor` class:**

```javascript
/**
 * Vision API Client - Gemini 2.0 Flash
 * Handles image recognition with multiple provider fallback
 */
class VisionAPIClient {
    constructor() {
        this.provider = CONFIG.VISION_API;
        this.requestCount = 0; // Track usage
        this.failureCount = 0;
    }

    /**
     * Main entry point - Analyze image and return item category
     */
    async analyzeImage(imageBase64, fallbackToManual = true) {
        console.log('[VISION API] Analyzing image...');
        
        try {
            // Try primary provider (Gemini)
            const result = await this._callGemini(imageBase64);
            
            if (result.confidence >= CONFIG.CONFIDENCE_THRESHOLD) {
                console.log('[VISION API] ✅ Success:', result);
                return result;
            } else {
                console.warn('[VISION API] ⚠️ Low confidence:', result.confidence);
                
                if (fallbackToManual) {
                    return await this._fallbackToManual(imageBase64);
                }
                return result;
            }
            
        } catch (error) {
            console.error('[VISION API] ❌ Error:', error);
            this.failureCount++;
            
            // Fallback strategy
            if (fallbackToManual) {
                console.log('[VISION API] Falling back to manual selection');
                return await this._fallbackToManual(imageBase64);
            }
            
            throw error;
        }
    }

    /**
     * Call Gemini 2.0 Flash API
     */
    async _callGemini(imageBase64) {
        const startTime = performance.now();
        
        // Remove data URL prefix if present
        const base64Image = imageBase64.replace(/^data:image\/(png|jpg|jpeg);base64,/, '');
        
        const requestBody = {
            contents: [{
                parts: [
                    {
                        text: `You are an expert at identifying Moroccan souk items. 

Analyze this image and identify what item is shown.

POSSIBLE ITEMS:
- leather_bag (leather handbag, purse, crossbody bag)
- ceramic_tagine (traditional conical cooking pot)
- ceramic_bowl (ceramic dish, plate, or bowl)
- ceramic_tile (decorative Zellige tile)
- rug_small (small carpet, 1-2 square meters)
- rug_medium (medium carpet, 2-4 square meters)
- babouche_embroidered (decorative slippers with embroidery)
- babouche_plain (simple leather slippers)
- lantern_brass (brass metal lantern)
- lantern_metal (metal lantern, any type)
- argan_oil (bottle of argan oil)
- spices_mixed (spices in bags or containers)
- jewelry_silver (silver jewelry, bracelets, necklaces)
- scarf_silk (silk scarf or shawl)
- leather_wallet (small leather wallet or purse)

Respond ONLY with JSON in this exact format:
{
  "item_id": "ceramic_tagine",
  "confidence": 0.95,
  "reasoning": "Conical shape, terracotta color, traditional Moroccan design"
}

Be specific. If unsure, use the closest match and lower confidence.`
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
                temperature: 0.1, // Low temperature for consistent results
                maxOutputTokens: 200,
                responseMimeType: "application/json"
            }
        };

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
            const error = await response.text();
            throw new Error(`Gemini API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        const responseTime = performance.now() - startTime;
        
        console.log('[VISION API] Response time:', Math.round(responseTime), 'ms');
        this.requestCount++;

        // Parse response
        const resultText = data.candidates[0].content.parts[0].text;
        const parsed = JSON.parse(resultText);

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
            alternatives: [] // Gemini doesn't return alternatives
        };
    }

    /**
     * Fallback to manual category selection
     */
    async _fallbackToManual(imageBase64) {
        console.log('[VISION API] Manual selection triggered');
        
        // Show category selector modal (reuse existing function)
        // This function should be implemented in your main code
        if (typeof window.showCategorySelector === 'function') {
            return await window.showCategorySelector(imageBase64);
        }
        
        throw new Error('Manual selection not available');
    }

    /**
     * Get usage statistics
     */
    getStats() {
        return {
            requestCount: this.requestCount,
            failureCount: this.failureCount,
            successRate: ((this.requestCount - this.failureCount) / this.requestCount * 100).toFixed(1) + '%'
        };
    }
}
```

---

### **STEP 4: Update ItemClassifier Class**

**Find the `ItemClassifier` class (around line 137) and replace `classify()` method:**

```javascript
class ItemClassifier {
    constructor() {
        this.model = null;
        this.labels = ITEM_LABELS;
        this.isLoaded = false;
        this.visionAPI = new VisionAPIClient(); // ✅ NEW: Add API client
    }

    async loadModel() {
        // ✅ No longer needed with API, but keep for compatibility
        console.log('[ML] Using cloud vision API instead of local model');
        this.isLoaded = true;
    }

    async classify(imageTensor) {
        // ✅ REPLACE ENTIRE METHOD:
        
        if (CONFIG.SIMULATION_MODE) {
            // Keep old mock for testing
            return this._mockClassify();
        }

        // Convert tensor to base64 image (if tensor is passed)
        let imageBase64;
        
        if (imageTensor && imageTensor.shape) {
            // TensorFlow tensor - convert to base64
            const canvas = document.createElement('canvas');
            canvas.width = imageTensor.shape[1];
            canvas.height = imageTensor.shape[0];
            
            const ctx = canvas.getContext('2d');
            const imageData = await tf.browser.toPixels(imageTensor, canvas);
            
            imageBase64 = canvas.toDataURL('image/jpeg', 0.8);
        } else if (typeof imageTensor === 'string') {
            // Already base64
            imageBase64 = imageTensor;
        } else if (imageTensor instanceof Blob) {
            // Blob - convert to base64
            imageBase64 = await this._blobToBase64(imageTensor);
        } else {
            throw new Error('Invalid image format');
        }

        // Call Vision API
        try {
            const result = await this.visionAPI.analyzeImage(imageBase64);
            
            // Verify result has required format
            if (!result.topPrediction || !result.topPrediction.label) {
                console.error('[CLASSIFIER] Invalid API response:', result);
                throw new Error('Invalid response format');
            }
            
            return result;
            
        } catch (error) {
            console.error('[CLASSIFIER] Vision API failed:', error);
            
            // Final fallback: manual selection
            if (typeof window.showCategorySelector === 'function') {
                return await window.showCategorySelector(imageBase64);
            }
            
            throw error;
        }
    }

    _blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    // Keep _mockClassify for testing
    _mockClassify() {
        // ... existing code ...
    }
}
```

---

### **STEP 5: Update UI to Show API Status**

**Add API usage display in Price Checker UI:**

```javascript
// Add to the results display
function showPriceResults(data) {
    const { item, priceData, analysis, apiStats } = data;
    
    // ... existing result HTML ...
    
    // ✅ ADD THIS: API Stats Footer
    const apiStatsHTML = apiStats ? `
        <div class="mt-4 p-3 bg-void-800/30 rounded-machined border border-void-700">
            <div class="text-xs text-zinc-500 flex items-center justify-between">
                <span>🤖 Powered by ${apiStats.provider || 'AI Vision'}</span>
                <span>${apiStats.responseTime || '?'}ms</span>
            </div>
            ${apiStats.reasoning ? `
                <div class="text-xs text-zinc-400 mt-1">
                    💭 ${apiStats.reasoning}
                </div>
            ` : ''}
        </div>
    ` : '';
    
    return existingHTML + apiStatsHTML;
}
```

---

### **STEP 6: Add Error Handling & Fallbacks**

**Create robust error handling:**

```javascript
/**
 * Enhanced analyze function with multiple fallbacks
 */
async function analyzeImageWithFallback(imageBlob, vendorPrice) {
    const fallbackChain = [
        {
            name: 'Gemini Vision API',
            handler: async () => {
                const classifier = new ItemClassifier();
                return await classifier.classify(imageBlob);
            }
        },
        {
            name: 'Cached Results',
            handler: async () => {
                // Check if we've seen this image before
                const cached = getCachedResult(imageBlob);
                if (cached) return cached;
                throw new Error('No cache available');
            }
        },
        {
            name: 'Manual Selection',
            handler: async () => {
                return await window.showCategorySelector(imageBlob);
            }
        }
    ];

    for (const fallback of fallbackChain) {
        try {
            console.log(`[ANALYSIS] Trying: ${fallback.name}`);
            const result = await fallback.handler();
            
            if (result && result.topPrediction) {
                console.log(`[ANALYSIS] ✅ Success with: ${fallback.name}`);
                return result;
            }
        } catch (error) {
            console.warn(`[ANALYSIS] ${fallback.name} failed:`, error);
            continue; // Try next fallback
        }
    }

    throw new Error('All analysis methods failed');
}
```

---

### **STEP 7: Rate Limiting & Caching**

**Add request caching to reduce API calls:**

```javascript
/**
 * Simple image cache to avoid duplicate API calls
 */
class ImageCache {
    constructor() {
        this.cache = new Map();
        this.maxSize = 50; // Keep last 50 results
    }

    async getCacheKey(imageBlob) {
        // Create hash from image data
        const arrayBuffer = await imageBlob.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async get(imageBlob) {
        const key = await this.getCacheKey(imageBlob);
        const cached = this.cache.get(key);
        
        if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour
            console.log('[CACHE] Hit!', key.substring(0, 8));
            return cached.result;
        }
        
        return null;
    }

    async set(imageBlob, result) {
        const key = await this.getCacheKey(imageBlob);
        
        this.cache.set(key, {
            result: result,
            timestamp: Date.now()
        });

        // Limit cache size
        if (this.cache.size > this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }
}

// Initialize cache
const imageCache = new ImageCache();

// Use in classifier:
async classify(imageTensor) {
    // Check cache first
    const cached = await imageCache.get(imageTensor);
    if (cached) return cached;
    
    // Call API
    const result = await this.visionAPI.analyzeImage(imageBase64);
    
    // Cache result
    await imageCache.set(imageTensor, result);
    
    return result;
}
```

---

## 🧪 TESTING CHECKLIST

### **Test 1: Basic Functionality**
```
1. Upload a tagine photo
2. Should call Gemini API
3. Should return "ceramic_tagine"
4. Should show confidence > 70%
5. Response time < 3 seconds
✅ PASS / ❌ FAIL
```

### **Test 2: Low Confidence Fallback**
```
1. Upload unclear/blurry photo
2. API returns low confidence (<70%)
3. Should show manual category selector
4. User selects category manually
5. Should work normally
✅ PASS / ❌ FAIL
```

### **Test 3: API Failure**
```
1. Temporarily break API key (wrong key)
2. Upload photo
3. Should show error message
4. Should fallback to manual selection
5. Should still complete analysis
✅ PASS / ❌ FAIL
```

### **Test 4: Rate Limiting**
```
1. Upload same photo twice
2. First call: hits API
3. Second call: uses cache
4. Should be instant (<100ms)
✅ PASS / ❌ FAIL
```

### **Test 5: Multiple Items**
```
Test with 10 different items:
- Tagine
- Leather bag
- Babouche
- Rug
- Lantern
- Argan oil
- Spices
- Jewelry
- Scarf
- Ceramic bowl

Accuracy: ___ / 10 (should be 8+)
✅ PASS / ❌ FAIL
```

---

## 🔒 SECURITY CONSIDERATIONS

### **⚠️ CRITICAL: Never Expose API Key in Frontend**

**Current implementation (TEMPORARY for testing):**
```javascript
const CONFIG = {
    GEMINI_API_KEY: 'AIza...' // ❌ BAD: Exposed in code
};
```

**Production solution:**

**Option A: Serverless Function (Recommended)**
```javascript
// Deploy to Vercel/Netlify
// /api/vision.js
export default async function handler(req, res) {
    const { image } = req.body;
    
    const response = await fetch(GEMINI_API, {
        headers: {
            'Authorization': `Bearer ${process.env.GEMINI_API_KEY}` // ✅ Secure
        },
        body: JSON.stringify({ image })
    });
    
    const result = await response.json();
    res.json(result);
}

// Frontend calls your API:
const result = await fetch('/api/vision', {
    method: 'POST',
    body: JSON.stringify({ image: base64 })
});
```

**Option B: Domain Restriction**
```
In Google Cloud Console:
1. Go to API Key settings
2. Add "Application restrictions"
3. Select "HTTP referrers"
4. Add: https://yourdomain.com/*
5. Key only works on your domain
```

**For now (testing):** Use domain restriction. Later: Move to serverless function.

---

## 💰 COST MONITORING

**Add usage tracker:**

```javascript
class UsageMonitor {
    constructor() {
        this.usageKey = 'alidade_api_usage';
        this.resetDaily();
    }

    resetDaily() {
        const today = new Date().toDateString();
        const stored = localStorage.getItem(this.usageKey);
        const usage = stored ? JSON.parse(stored) : {};
        
        if (usage.date !== today) {
            usage.date = today;
            usage.count = 0;
            usage.cost = 0;
            localStorage.setItem(this.usageKey, JSON.stringify(usage));
        }
    }

    track(provider, success) {
        const usage = JSON.parse(localStorage.getItem(this.usageKey));
        usage.count++;
        
        // Calculate cost (Gemini: $0.00025 per image)
        if (provider === 'gemini') {
            usage.cost += 0.00025;
        }
        
        localStorage.setItem(this.usageKey, JSON.stringify(usage));
        
        // Warn if approaching limits
        if (usage.count > 1400) {
            console.warn('[USAGE] ⚠️ Approaching daily limit:', usage.count, '/1500');
        }
    }

    getStats() {
        return JSON.parse(localStorage.getItem(this.usageKey));
    }
}

const usageMonitor = new UsageMonitor();
```

---

## 🎯 SUCCESS CRITERIA

Implementation is successful when:

- [ ] Gemini API integrated and working
- [ ] 80%+ accuracy on test items
- [ ] Response time < 3 seconds
- [ ] Fallback to manual selection works
- [ ] Error handling graceful (no crashes)
- [ ] Cache reduces duplicate calls
- [ ] Cost monitoring in place
- [ ] Security: API key protected
- [ ] Works on mobile + desktop
- [ ] Users can complete full flow

---

## 📋 DEPLOYMENT CHECKLIST

Before going live:

### **1. Security**
- [ ] API key in environment variable (not code)
- [ ] Domain restriction enabled
- [ ] OR serverless function deployed
- [ ] Rate limiting configured

### **2. Performance**
- [ ] Image caching enabled
- [ ] Response time < 3 seconds average
- [ ] Fallback chain tested

### **3. Monitoring**
- [ ] Usage tracking implemented
- [ ] Error logging to console
- [ ] Daily usage alerts set up

### **4. UX**
- [ ] Loading states clear
- [ ] Error messages helpful
- [ ] Manual fallback obvious
- [ ] API attribution shown ("Powered by Gemini")

### **5. Testing**
- [ ] 10+ real photos tested
- [ ] Accuracy measured (target: 80%+)
- [ ] Offline fallback works
- [ ] Mobile tested

---

## 🚀 QUICK START (15 Minutes)

**Minimal implementation to get started:**

```javascript
// 1. Get API key from https://aistudio.google.com/

// 2. Add to CONFIG:
const CONFIG = {
    GEMINI_API_KEY: 'YOUR_KEY_HERE',
    GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent'
};

// 3. Replace classify() in ItemClassifier:
async classify(imageBase64) {
    const response = await fetch(
        `${CONFIG.GEMINI_ENDPOINT}?key=${CONFIG.GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: "Identify this Moroccan souk item. Respond with JSON: {item_id: string, confidence: number}" },
                        { inline_data: { mime_type: "image/jpeg", data: imageBase64.split(',')[1] } }
                    ]
                }]
            })
        }
    );
    
    const data = await response.json();
    const result = JSON.parse(data.candidates[0].content.parts[0].text);
    
    return {
        topPrediction: {
            label: result.item_id,
            confidence: result.confidence
        }
    };
}

// 4. Test with a photo!
```

That's it! You're live with real AI! 🎉

---

## 🆘 TROUBLESHOOTING

**Problem: "API key not valid"**
```
Solution: 
1. Check key is copied correctly (no spaces)
2. Verify API enabled in Google Cloud Console
3. Wait 5 minutes after creating key
```

**Problem: "Response too slow"**
```
Solution:
1. Reduce image size before sending
2. Use JPEG (smaller than PNG)
3. Compress to 512x512 max
```

**Problem: "Low accuracy"**
```
Solution:
1. Improve prompt with more examples
2. Lower confidence threshold
3. Add manual verification step
```

**Problem: "Rate limit hit"**
```
Solution:
1. Implement caching (see Step 7)
2. Add Hugging Face as fallback
3. Upgrade to paid tier ($0.00025/image)
```

---

**IMPLEMENT THIS NOW. START WITH THE 15-MINUTE QUICK START!** 🚀
