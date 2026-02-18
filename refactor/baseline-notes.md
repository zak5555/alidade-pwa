# app.js Baseline (Frozen)

Date: 2026-02-15  
Source: `app.js` + `index.html`  
Audit script: `scripts/refactor/audit-app-contract.mjs`

## Snapshot Metrics

- File: `app.js`
- Lines: `24,760`
- Characters: `1,183,350`
- Declarations: `329` (`23` classes, `306` functions)
- Window exports: `153` assignments (`135` unique names)
- Duplicate declaration names: `12`

## Highest-Risk Findings

1. Dual bootstrap/init paths exist.
   - `app.js:16760` (`init` + `bootstrap`)
   - `app.js:24621` (`initializeAlidadeApp`)
2. Global API is overwritten in-place.
   - `window.updateUIByTier` at `app.js:5002`
   - overwritten again at `app.js:24607`
3. Duplicate function declarations that may shadow behavior by order.
   - `switchLanguage` (`app.js:6242`, `app.js:13448`)
   - `switchProtocolTab` (`app.js:13219`, `app.js:13566`)
   - `renderNegotiation` (`app.js:10135`, `app.js:15340`)
4. Multiple distance helpers with different semantic units.
   - `haversineDistance` in km: `app.js:9715`, `app.js:17883`
   - `haversineDistance` in meters: `app.js:19894`
5. Script-order coupling with external files loaded after `app.js`.
   - `index.html:565` (`app.js`)
   - `index.html:568` (`js/tactical-briefing.js`)
   - `index.html:569` (`js/tactical-briefing-ui.js`)
   - `index.html:572` (`js/vector-nav-v2.js`)

## Contract Rules For Migration

- No behavior changes while extracting.
- Keep all current `window.*` APIs available.
- Preserve script load order semantics.
- Resolve duplicates only after parity checks prove no regression.
