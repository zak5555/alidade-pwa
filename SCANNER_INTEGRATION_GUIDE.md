# 🔌 SCANNER → NEGOTIATION INTEGRATION GUIDE

## Quick Reference: How to Connect the Scanner to Negotiation

### 📍 Location to Modify
Find the **AI Scanner result handler** in the Souk Ops module (likely in `renderSouk()` function).

---

### ✅ Code to Add (After Item Classification)

```javascript
// After Gemini/AI successfully identifies an item:
function handleScannerResult(classificationResult) {
    // classificationResult should have: item_id, fairPrice, askingPrice, category, name
    
    // 1. UPDATE CALCULATOR STATE (for Negotiation module)
    appState.setModule('calculator', {
        selectedItem: {
            item_id: classificationResult.item_id,
            name: classificationResult.name,
            fairPrice: classificationResult.fairPrice,
            askingPrice: classificationResult.askingPrice,
            category: classificationResult.category
        },
        price: classificationResult.askingPrice
    });
    
    // 2. UPDATE HAGGLE STATE (for Wizard flow)
    appState.setModule('haggle', {
        vendorOffer: classificationResult.askingPrice,
        fairPrice: classificationResult.fairPrice,
        itemType: classificationResult.category,
        stage: 1, // Reset to stage 1
        shockPrice: 0,
        walkAwayPrice: 0
    });
    
    // 3. NAVIGATE TO NEGOTIATION
    window.alidadeApp.navigateTo('NEGOTIATION');
    
    // Optional: Show success toast
    console.log('[SCANNER] Item data transferred to Negotiation module:', classificationResult);
}
```

---

### 🔍 How to Find the Right Place

1. **Search for:** `renderSouk` or `PriceChecker` or `classifyItem`
2. **Look for:** Where the AI/Gemini returns classification results
3. **Find:** The success callback or result handler
4. **Add:** The state update code above **before** navigating

---

### 📋 Example Integration Pattern

```javascript
// EXAMPLE: Typical scanner flow
async function analyzePriceWithAI(imageData) {
    try {
        // Call AI/Gemini
        const result = await geminiAPI.classifyItem(imageData);
        
        // ✅ ADD THIS BLOCK HERE:
        appState.setModule('calculator', {
            selectedItem: {
                item_id: result.item_id,
                name: result.name,
                fairPrice: result.fairPrice,
                askingPrice: result.askingPrice,
                category: result.category
            },
            price: result.askingPrice
        });
        
        appState.setModule('haggle', {
            vendorOffer: result.askingPrice,
            fairPrice: result.fairPrice,
            itemType: result.category,
            stage: 1
        });
        
        // Navigate to Negotiation
        window.alidadeApp.navigateTo('NEGOTIATION');
        
    } catch (error) {
        console.error('[SCANNER] Classification failed:', error);
    }
}
```

---

### ⚠️ Important Notes

1. **Data Structure:** Ensure `classificationResult` has all required fields:
   - `item_id` (string)
   - `name` (string)
   - `fairPrice` (number)
   - `askingPrice` (number)
   - `category` (string: 'leather', 'ceramics', 'spices', etc.)

2. **State Persistence:** The `appState.setModule()` calls automatically save to localStorage

3. **Navigation:** Use `window.alidadeApp.navigateTo('NEGOTIATION')` to switch views

4. **Testing:** After adding, test the flow:
   - Scan an item
   - Check console for state updates
   - Verify Negotiation module loads without crash
   - Confirm Wizard shows correct prices

---

### 🧪 Quick Test

```javascript
// Test the integration manually in console:
appState.setModule('calculator', {
    selectedItem: {
        item_id: 'test_item',
        name: 'Test Leather Bag',
        fairPrice: 200,
        askingPrice: 800,
        category: 'leather'
    },
    price: 800
});

window.alidadeApp.navigateTo('NEGOTIATION');
// Should load without crash and show Wizard with prices
```

---

### ✅ Success Criteria

After integration, you should see:
1. Scanner identifies item ✅
2. State updates in console ✅
3. Navigation to Negotiation ✅
4. Wizard shows correct prices ✅
5. No crashes or errors ✅

---

**Need Help?** Check `NEGOTIATION_FIX_COMPLETE.md` for full context.
