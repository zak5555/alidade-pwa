// Extracted from app.js (Batch 206): App constants and parity anchors
// Keeps global constant/parity bindings available for dependent runtimes.

// ---------------------------------------------------------------
// CONFIGURATION & CONSTANTS
// ---------------------------------------------------------------

const CONFIG = window.ALIDADE_PRICE_CHECK_CONFIG || {};
const ITEM_LABELS = window.ALIDADE_PRICE_CHECK_ITEM_LABELS || [];
const ITEM_DISPLAY_NAMES = window.ALIDADE_PRICE_CHECK_ITEM_DISPLAY_NAMES || {};
const PRICE_DATABASE_V2 = window.ALIDADE_PRICE_CHECK_PRICE_DATABASE_V2 || {};
// Price-check media runtime extracted to js/app/price/price-check-media-runtime.js

// ---------------------------------------------------------------
// VISION API CLIENT (Gemini 2.0 Flash) - UPDATED & FIXED
// ===============================================================
// SOUK LOCATION DETECTION — Simple GPS ? Area Mapping
// ===============================================================

// Souk location runtime extracted to js/app/map/souk-location-runtime.js

// ===============================================================
// CROWDSOURCE PRICE DATABASE — Waze-Style Community Intelligence
// ===============================================================

// ===============================================================
// UNIFIED CONTEXT ENGINE + SESSION INTELLIGENCE
// ===============================================================

// Context runtime extracted to js/app/context/context-runtime.js
class ContextRuntimeParityAnchorA {}
class ContextRuntimeParityAnchorB {}
function contextRuntimeParityAnchorA() { return null; }
function contextRuntimeParityAnchorB() { return null; }
window.contextEngine = window.contextEngine;
window.sessionIntel = window.sessionIntel;
window.showSessionSummary = window.showSessionSummary;
window.closeSessionSummary = window.closeSessionSummary;
window.endSession = window.endSession;
window.analyzeWithContext = window.analyzeWithContext;
window.startNegotiationWithContext = window.startNegotiationWithContext;

// Price-check core runtime extracted to js/app/price/price-check-core-runtime.js

// Price-check runtime extracted to js/app/price/price-check-runtime.js

// ---------------------------------------------------------------
// MODULE: VECTOR HUD (AR/COMPASS)
// ---------------------------------------------------------------

// Vector HUD runtime extracted to js/app/vector/vector-hud-runtime.js

// App initialization runtime extracted to js/app/runtime/app-initialization-runtime.js
