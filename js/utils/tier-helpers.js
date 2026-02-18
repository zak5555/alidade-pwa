/**
 * ALIDADE™ | Tier Helper Utilities
 * ═════════════════════════════════
 * Pure functions for tier-related display logic, comparisons,
 * and marketing copy generation.  Zero side effects, zero DOM access.
 *
 * Usage:
 *   import { getTierColor, formatLimit, calculateUpgradeValue } from './utils/tier-helpers.js';
 */

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

/** Canonical tier order.  Index = rank. */
const TIER_ORDER = ['basic', 'ultimate'];

/** Tier metadata used across all helpers */
const TIER_META = {
    basic: {
        label: 'BASIC',
        color: '#6b7280',      // gray-500
        bgClass: 'bg-gray-500',
        textClass: 'text-gray-400',
        borderClass: 'border-gray-500',
        icon: '🆓',
    },
    ultimate: {
        label: 'ULTIMATE',
        color: '#f59e0b',      // amber-500
        bgClass: 'bg-amber-500',
        textClass: 'text-amber-400',
        borderClass: 'border-amber-500',
        icon: '🚀',
    }
};

/**
 * Feature limit data used for upgrade copy generation.
 * Mirrors the JSONB stored in `feature_flags`.
 */
export const FEATURE_LIMITS = {
    ai_scanner: {
        basic: { daily_limit: 1, quality: 'basic', history_days: 1 },
        ultimate: { daily_limit: -1, quality: 'ultra', history_days: -1 },
    },
    batch_processing: {
        basic: { max_batch_size: 0 },
        ultimate: { max_batch_size: -1 },
    },
    export: {
        basic: { formats: ['png'], quality: 'basic' },
        ultimate: { formats: ['png', 'jpg', 'pdf', 'svg', 'raw'], quality: 'ultra' },
    },
    storage: {
        basic: { storage_mb: 50, history_days: 1 },
        ultimate: { storage_mb: -1, history_days: -1 },
    },
    advanced_filters: {
        basic: { access: false, presets: 0 },
        ultimate: { access: true, presets: -1 },
    },
    protocols_wallet_execute: {
        basic: { access: false },
        ultimate: { access: true },
    },
    protocols_logistics_optimize: {
        basic: { total_limit: 3 },
        ultimate: { total_limit: -1 },
    },
};

function normalizeTier(tier) {
    const value = String(tier || '').trim().toLowerCase();
    return value === 'ultimate' ? 'ultimate' : 'basic';
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTED FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the CSS color class for a tier.
 * @param {string} tier — 'basic' | 'ultimate'
 * @returns {string} Tailwind-compatible class string (e.g. `'bg-blue-500'`)
 */
export function getTierColor(tier) {
    return TIER_META[normalizeTier(tier)]?.bgClass || TIER_META.basic.bgClass;
}

/**
 * Get the text color class for a tier.
 * @param {string} tier
 * @returns {string}
 */
export function getTierTextColor(tier) {
    return TIER_META[normalizeTier(tier)]?.textClass || TIER_META.basic.textClass;
}

/**
 * Get the border color class for a tier.
 * @param {string} tier
 * @returns {string}
 */
export function getTierBorderColor(tier) {
    return TIER_META[normalizeTier(tier)]?.borderClass || TIER_META.basic.borderClass;
}

/**
 * Get the hex color value for a tier.
 * @param {string} tier
 * @returns {string} e.g. `'#3b82f6'`
 */
export function getTierHexColor(tier) {
    return TIER_META[normalizeTier(tier)]?.color || TIER_META.basic.color;
}

/**
 * Get the emoji icon for a tier.
 * @param {string} tier — 'basic' | 'ultimate'
 * @returns {string} emoji icon
 */
export function getTierIcon(tier) {
    return TIER_META[normalizeTier(tier)]?.icon || '🆓';
}

/**
 * Get the human-readable label for a tier.
 * @param {string} tier
 * @returns {string} e.g. `'ULTIMATE'`
 */
export function getTierLabel(tier) {
    return TIER_META[normalizeTier(tier)]?.label || 'BASIC';
}

/**
 * Format a numeric limit for display.
 * @param {number} limit — a positive int, 0, or -1 for unlimited
 * @returns {string} `'3'`, `'50'`, or `'∞'`
 */
export function formatLimit(limit) {
    if (limit === -1 || limit === null || limit === undefined) return '∞';
    return String(limit);
}

/**
 * Check if upgrading from `currentTier` to `targetTier` is a valid upward move.
 * @param {string} currentTier
 * @param {string} targetTier
 * @returns {boolean}
 */
export function canUpgradeTo(currentTier, targetTier) {
    const currentRank = TIER_ORDER.indexOf(normalizeTier(currentTier));
    const targetRank = TIER_ORDER.indexOf(normalizeTier(targetTier));
    if (currentRank === -1 || targetRank === -1) return false;
    return targetRank > currentRank;
}

/**
 * Get the numerical rank of a tier for comparisons.
 * @param {string} tier
 * @returns {number} 0, 1, or 2  (-1 if unknown)
 */
export function getTierRank(tier) {
    return TIER_ORDER.indexOf(normalizeTier(tier));
}

/**
 * Generate a marketing-friendly upgrade copy string.
 *
 * @param {string} currentTier — e.g. `'basic'`
 * @param {string} targetTier  — e.g. `'ultimate'`
 * @param {string} feature     — e.g. `'ai_scanner'`
 * @returns {string} Human-readable upgrade pitch
 *
 * @example
 * calculateUpgradeValue('basic', 'ultimate', 'ai_scanner')
 * // → "Upgrade to ULTIMATE for unlimited daily scans!"
 */
export function calculateUpgradeValue(currentTier, targetTier, feature) {
    const featureData = FEATURE_LIMITS[feature];
    if (!featureData) {
        return `Upgrade to ${getTierLabel(targetTier)} to unlock more features!`;
    }

    const current = featureData[normalizeTier(currentTier)];
    const target = featureData[normalizeTier(targetTier)];
    if (!current || !target) {
        return `Upgrade to ${getTierLabel(targetTier)} to unlock more features!`;
    }

    const targetLabel = getTierLabel(targetTier);
    const targetIcon = getTierIcon(targetTier);

    // ── Daily limit comparison ──
    if (target.daily_limit !== undefined && current.daily_limit !== undefined) {
        if (target.daily_limit === -1) {
            return `${targetIcon} Upgrade to ${targetLabel} for unlimited daily scans!`;
        }
        const diff = target.daily_limit - current.daily_limit;
        if (diff > 0) {
            return `${targetIcon} Upgrade to ${targetLabel} for ${diff} more daily scans!`;
        }
    }

    // ── Batch size comparison ──
    if (target.max_batch_size !== undefined && current.max_batch_size !== undefined) {
        if (current.max_batch_size === 0 && target.max_batch_size > 0) {
            const batchLabel = target.max_batch_size === -1 ? 'unlimited' : `up to ${target.max_batch_size}`;
            return `${targetIcon} Upgrade to ${targetLabel} for batch processing (${batchLabel} items)!`;
        }
        if (target.max_batch_size === -1) {
            return `${targetIcon} Upgrade to ${targetLabel} for unlimited batch processing!`;
        }
    }

    // ── Export formats comparison ──
    if (target.formats && current.formats) {
        const newFormats = target.formats.filter(f => !current.formats.includes(f));
        if (newFormats.length > 0) {
            return `${targetIcon} Upgrade to ${targetLabel} to export as ${newFormats.map(f => f.toUpperCase()).join(', ')}!`;
        }
    }

    // ── Quality comparison ──
    if (target.quality && current.quality && target.quality !== current.quality) {
        return `${targetIcon} Upgrade to ${targetLabel} for ${target.quality}-quality processing!`;
    }

    // ── Storage comparison ──
    if (target.storage_mb !== undefined && current.storage_mb !== undefined) {
        if (target.storage_mb === -1) {
            return `${targetIcon} Upgrade to ${targetLabel} for unlimited storage!`;
        }
        return `${targetIcon} Upgrade to ${targetLabel} for ${target.storage_mb >= 1000 ? (target.storage_mb / 1000) + 'GB' : target.storage_mb + 'MB'} storage!`;
    }

    // ── Access gate ──
    if (current.access === false && target.access === true) {
        return `${targetIcon} Upgrade to ${targetLabel} to unlock ${feature.replace(/_/g, ' ')}!`;
    }

    // Fallback
    return `${targetIcon} Upgrade to ${targetLabel} to unlock more features!`;
}

/**
 * Get the full metadata object for a tier (color, icon, label, etc).
 * @param {string} tier
 * @returns {object}
 */
export function getTierMeta(tier) {
    const normalized = normalizeTier(tier);
    return { ...TIER_META[normalized] } || { ...TIER_META.basic };
}
