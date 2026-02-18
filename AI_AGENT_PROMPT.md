# 🚨 TIER SYSTEM INTEGRATION - AI AGENT INSTRUCTIONS

## CONTEXT
I have an existing ALIDADE web app with a license system. The database migration is already done (FREE/LITE/ULTIMATE tiers are in the database). I need to add tier-based UI components and feature locks to the frontend.

---

## CURRENT STATE

### ✅ What's Already Done:
1. **Database**: Migration complete - `feature_flags` table has `free_tier`, `lite_tier`, `ultimate_tier` columns
2. **Backend**: Supabase configured, users table has `license_tier` column
3. **Files**: I have existing `license-manager.js`, `app.js`, `index.html`

### ❌ What's Missing:
1. Tier badge UI not showing
2. Usage counter not displaying  
3. Feature locks not applied
4. Upgrade modal not working

---

## YOUR TASK

Integrate the tier system into my existing app using the **simplest possible approach**.

### Requirements:

1. **Use the provided file**: `tier-integration.js`
   - This is a standalone script that works with my existing code
   - No need to modify `license-manager.js` or `app.js`
   - Just add it to the page

2. **Add UI containers** to `index.html`:
   - Badge container: `<div id="tier-badge"></div>`
   - Counter container: `<div id="tier-counter"></div>`

3. **Add feature locks** using `data-feature` attributes:
   - Batch processing: `data-feature="batch_processing"`
   - Advanced filters: `data-feature="advanced_filters"`
   - API access: `data-feature="api_access"`

---

## FILES PROVIDED

### Core Integration File:
- **tier-integration.js** - Main file to add (standalone, works with existing code)

### Reference/Documentation:
- **GUIDE_SIMPLE.md** - Step-by-step guide
- **test-simple.html** - Working test page to reference

### Alternative (if needed):
- **tier-system-complete.js** - Full replacement for license-manager (more complex)
- **tier-system.css** - Optional styling

---

## STEP-BY-STEP INSTRUCTIONS FOR YOU (AI AGENT)

### Step 1: Add the Integration Script
```html
<!-- In index.html, before </body> -->
<script src="js/tier-integration.js"></script>
```

### Step 2: Add UI Containers
Find the appropriate locations in `index.html` and add:

```html
<!-- In header/navbar area -->
<div id="tier-badge"></div>

<!-- In dashboard/main content area -->
<div id="tier-counter"></div>
```

### Step 3: Apply Feature Locks
Find existing feature elements and add `data-feature` attributes:

```html
<!-- Example: Batch processing button -->
<button id="batch-btn" data-feature="batch_processing">
  Batch Process
</button>

<!-- Example: Advanced filters panel -->
<div id="filters-panel" data-feature="advanced_filters">
  <!-- existing content -->
</div>

<!-- Example: API docs section -->
<div id="api-section" data-feature="api_access">
  <!-- existing content -->
</div>
```

### Step 4: Verify Integration
The script will automatically:
- ✅ Read tier from localStorage or window.licenseManager
- ✅ Render badge and counter
- ✅ Apply locks to elements with `data-feature`
- ✅ Show upgrade modal when locked features are clicked

---

## IMPORTANT RULES

### ✅ DO:
1. **Keep it simple** - Just add the script tag and containers
2. **Use existing HTML structure** - Find natural places for badge/counter
3. **Preserve existing code** - Don't modify license-manager.js or app.js
4. **Test incrementally** - Add one thing at a time

### ❌ DON'T:
1. **Don't rewrite existing files** - tier-integration.js works standalone
2. **Don't add complex dependencies** - Everything needed is in one file
3. **Don't modify CSS extensively** - The script has inline styles
4. **Don't overthink** - This is a simple copy-paste task

---

## TESTING CHECKLIST

After integration, verify:

### Console Output:
```
✅ ALIDADE Tier System - Ready!
Current tier: free (or lite/ultimate)
Current usage: 0
```

### Visual Elements:
- [ ] Badge visible in header (FREE 🆓 / LITE ⚡ / ULTIMATE 🚀)
- [ ] Counter visible in dashboard (X/Y or ∞)
- [ ] Locked features have overlay with 🔒
- [ ] Clicking lock opens upgrade modal
- [ ] Modal has correct tier benefits
- [ ] "Upgrade Now" links to Gumroad

### Manual Test:
```javascript
// In Console:
localStorage.setItem('alidade_user_license', JSON.stringify({
    license_tier: 'free',
    daily_scans_count: 2
}));
location.reload();
// Badge should show FREE, counter should show 2/3
```

---

## CURRENT FILE STRUCTURE

```
project/
├── index.html                   # Main app page
├── activate.html               # License activation page
├── js/
│   ├── app.js                  # Main app logic (DON'T MODIFY)
│   ├── license-manager.js      # License system (DON'T MODIFY)
│   ├── tier-integration.js     # ← ADD THIS FILE
│   └── ui-components.js        # UI helpers
└── css/
    ├── style.css              # Main styles
    └── upgrade-modal.css      # Modal styles (already exists)
```

---

## TIER CONFIGURATION

The script uses these rules:

### Feature Access:
| Feature | FREE | LITE | ULTIMATE |
|---------|------|------|----------|
| `batch_processing` | 🔒 Locked | ✅ Unlocked | ✅ Unlocked |
| `advanced_filters` | 🔒 Locked | ✅ Unlocked | ✅ Unlocked |
| `api_access` | 🔒 Locked | 🔒 Locked | ✅ Unlocked |

### Daily Limits:
- FREE: 3 scans/day
- LITE: 50 scans/day
- ULTIMATE: ∞ unlimited

### Gumroad Links:
- LITE: `https://alidade.gumroad.com/l/tjfusb`
- ULTIMATE: `https://alidade.gumroad.com/l/srdcyy`

---

## EXPECTED OUTPUT

### What I Should See:

1. **In Header/Navbar:**
   ```
   [FREE 🆓]  ← Badge
   ```

2. **In Dashboard:**
   ```
   Daily Usage: 2/3
   [████████░░] 67%  ← Progress bar (green/yellow/red)
   ```

3. **Locked Features:**
   ```
   ┌─────────────────────┐
   │    [BLURRED]        │
   │       🔒            │
   │  BATCH PROCESSING   │
   │ [Upgrade to LITE ⚡] │
   └─────────────────────┘
   ```

4. **Upgrade Modal (when clicking lock):**
   ```
   ╔═══════════════════════╗
   ║  ⚡                    ║
   ║  Upgrade to LITE      ║
   ║                       ║
   ║  ✓ 50 daily scans     ║
   ║  ✓ Batch processing   ║
   ║  ✓ Advanced filters   ║
   ║                       ║
   ║     £4.99             ║
   ║  [UPGRADE NOW]        ║
   ║  [Maybe Later]        ║
   ╚═══════════════════════╝
   ```

---

## TROUBLESHOOTING GUIDE

### Problem: Badge not showing
**Fix:** Check if `<div id="tier-badge"></div>` exists in HTML

### Problem: Counter not showing  
**Fix:** Check if `<div id="tier-counter"></div>` exists in HTML

### Problem: Locks not applied
**Fix:** Ensure `data-feature="feature_name"` is on the element

### Problem: Modal not opening
**Fix:** Check Console for errors, verify script loaded

### Problem: Wrong tier showing
**Fix:** Check localStorage:
```javascript
console.log(localStorage.getItem('alidade_user_license'));
```

---

## FINAL NOTES

- **This is a non-destructive integration** - Your existing code stays intact
- **The script is self-contained** - No external dependencies
- **It auto-updates** - Checks localStorage every second
- **It's production-ready** - Tested and working

---

## YOUR ACTION ITEMS

1. ✅ Copy `tier-integration.js` to `js/` folder
2. ✅ Add script tag to `index.html`
3. ✅ Add `<div id="tier-badge"></div>` in appropriate location
4. ✅ Add `<div id="tier-counter"></div>` in appropriate location
5. ✅ Add `data-feature` attributes to lockable features
6. ✅ Test in browser
7. ✅ Verify Console logs
8. ✅ Report results

---

## REFERENCE

If you need examples, look at `test-simple.html` - it's a working implementation.

**NOW GO INTEGRATE! 🚀**
