# ALIDADE i18n Translation System

## Overview

This directory contains the Poka-Yoke internationalization (i18n) system for ALIDADE PWA.

**Supported Languages:**
- 🇬🇧 English (en) - Master language
- 🇫🇷 French (fr) - Moroccan French context
- 🇪🇸 Spanish (es) - Marrakech context

## Architecture

```
/i18n/
├── index.js      # i18n Controller (lazy loading, caching, fallbacks)
├── en.js         # English translations (MASTER - 100% complete)
├── fr.js         # French translations
├── es.js         # Spanish translations
├── validator.js  # Build-time validation script
└── README.md     # This file
```

## Usage

### In JavaScript

```javascript
// Import (if using modules)
import i18n from './i18n/index.js';

// Initialize (call once on app start)
await i18n.init();

// Translate a key
const text = t('haggle.shock.label'); // "Shock Price"

// With variables
const formula = t('shadow.formula', { base: 7, distance: 5, rate: 7 });
// "Formula: 7 + (5 × 7)"

// Change language
await i18n.setLanguage('fr');

// Get current language
const lang = i18n.getCurrentLanguage(); // 'fr'

// Get available languages
const langs = i18n.getAvailableLanguages();
// [{ code: 'en', name: 'English', flag: '🇬🇧' }, ...]
```

### In HTML

```html
<!-- The t() function is available globally after init -->
<h1>${t('shadow.title')}</h1>
<button onclick="i18n.setLanguage('fr')">${t('settings.language.fr')}</button>
```

### Listen for Language Changes

```javascript
window.addEventListener('languagechange', (e) => {
    console.info('Language changed to:', e.detail.lang);
    renderApp(); // Re-render your UI
});
```

## Poka-Yoke Principles

1. **Lazy Loading**: Only the active language is loaded (saves ~90KB)
2. **3-Tier Fallback**: Current → English → [MISSING: key]
3. **O(1) Lookups**: Translations are flattened to a hash map
4. **Auto-Detection**: Browser language → URL param → localStorage
5. **Validation**: Run validator.js before deploy

## Adding a New Translation Key

1. **Always add to `en.js` first** (master language)
2. Add the same key to `fr.js` and `es.js`
3. Run validation: `node i18n/validator.js`

### Key Naming Convention

```javascript
// Format: module.context.key
{
    haggle: {           // Module name
        prices: {       // Context/section
            shock: {    // Sub-context
                label: "Shock Price",   // The actual key
                desc: "Your opening offer"
            }
        }
    }
}

// Access: t('haggle.prices.shock.label')
```

## Validation

Run before every deploy:

```bash
node i18n/validator.js
```

This will:
- ✅ Check all English keys exist in French and Spanish
- ⚠️ Warn about extra keys (potential typos)
- ⚠️ Warn about empty values
- ❌ FAIL if missing translations

## Bundle Size

| File | Size | Loaded |
|------|------|--------|
| index.js | ~8 KB | Always |
| en.js | ~12 KB | On demand |
| fr.js | ~10 KB | On demand |
| es.js | ~10 KB | On demand |

**Initial load impact: +8 KB**
**Per-language: +10-12 KB (cached)**

## Future Languages

To add a new language (e.g., German):

1. Copy `en.js` to `de.js`
2. Translate all values
3. Add `'de'` to `SUPPORTED` array in `index.js`
4. Add German to `getAvailableLanguages()` in `index.js`
5. Run validator

### Priority Languages for Marrakech:
- Arabic (ar) - RTL support needed
- German (de) - 2nd largest tourist group
- Italian (it) - 3rd largest tourist group
