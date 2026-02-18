/**
 * ALIDADE™ | Feature Gating Logic
 * ═════════════════════════════════
 * Enforces tier limits and calculates usage.
 */

import { FEATURE_LIMITS } from './tier-helpers.js';

function normalizeTier(tier) {
    const value = String(tier || '').trim().toLowerCase();
    return value === 'ultimate' ? 'ultimate' : 'basic';
}

/**
 * Get current user tier with fallbacks
 */
function getCurrentTier() {
    if (window.licenseManager && typeof window.licenseManager.getCurrentTier === 'function') {
        return normalizeTier(window.licenseManager.getCurrentTier());
    }
    // Fallback to legacy global
    return normalizeTier(window.USER_TIER || 'basic');
}

/**
 * Check if a feature is allowed for the current tier
 * @param {string} featureName 
 * @returns {object} { allowed, reason, upgradeNeeded }
 */
export function checkFeatureAccess(featureName) {
    if (window.licenseManager && typeof window.licenseManager.canUseFeature === 'function') {
        const usage = window.licenseManager.canUseFeature(featureName);
        return {
            allowed: Boolean(usage.allowed),
            reason: usage.reason || null,
            upgradeNeeded: usage.upgrade_to || (usage.allowed ? null : 'ultimate'),
            current_usage: usage.current_usage ?? 0,
            limit: usage.limit ?? -1
        };
    }

    const tier = normalizeTier(getCurrentTier());
    const limitConfig = FEATURE_LIMITS[featureName];

    if (!limitConfig) {
        // Unknown feature - default allow or block? Default allow to avoid breaking.
        console.warn(`[GATE] Unknown feature: ${featureName}`);
        return { allowed: true, reason: 'Unknown feature', upgradeNeeded: null };
    }

    const tierConfig = limitConfig[tier];
    if (!tierConfig) {
        return { allowed: false, reason: 'Invalid tier configuration', upgradeNeeded: 'ultimate' };
    }

    // 1. Check boolean access (e.g., advanced_filters)
    if (typeof tierConfig.access === 'boolean' && tierConfig.access === false) {
        return {
            allowed: false,
            reason: `Unlock ${featureName.replace(/_/g, ' ')} with ULTIMATE upgrade`,
            upgradeNeeded: 'ultimate'
        };
    }

    // 2. Check total/lifetime limits (e.g., logistics free tries)
    if (tierConfig.total_limit !== undefined && tierConfig.total_limit !== -1) {
        const usage = getTotalUsage(featureName);
        if (usage >= tierConfig.total_limit) {
            return {
                allowed: false,
                reason: `Limit reached (${tierConfig.total_limit}/${tierConfig.total_limit})`,
                upgradeNeeded: 'ultimate',
                current_usage: usage,
                limit: tierConfig.total_limit
            };
        }
    }

    // 3. Check Daily Limits (e.g., ai_scanner: 3)
    if (tierConfig.daily_limit !== undefined && tierConfig.daily_limit !== -1) {
        const usage = getDailyUsage(featureName);
        if (usage >= tierConfig.daily_limit) {
            return {
                allowed: false,
                reason: `Daily limit reached (${tierConfig.daily_limit}/${tierConfig.daily_limit})`,
                upgradeNeeded: 'ultimate',
                current_usage: usage,
                limit: tierConfig.daily_limit
            };
        }
    }

    // 4. Check Batch processing
    // This is usually checked at call time with specific batch size, 
    // but here we just check if it's strictly 0 (disabled)
    if (featureName === 'batch_processing' && tierConfig.max_batch_size === 0) {
        return {
            allowed: false,
            reason: 'Batch processing requires ULTIMATE tier',
            upgradeNeeded: 'ultimate'
        };
    }

    const hasTotalLimit = tierConfig.total_limit !== undefined;
    const usage = hasTotalLimit ? getTotalUsage(featureName) : getDailyUsage(featureName);
    const limit = hasTotalLimit ? (tierConfig.total_limit ?? -1) : (tierConfig.daily_limit ?? -1);
    return { allowed: true, reason: null, upgradeNeeded: null, current_usage: usage, limit };
}

/**
 * Get daily usage count for a feature
 */
function getDailyUsage(featureName) {
    const key = getStorageKey(featureName);
    const data = JSON.parse(localStorage.getItem(key) || '0');
    return parseInt(data, 10) || 0;
}

/**
 * Generate daily storage key: usage_ai_scanner_2026-02-13
 */
function getStorageKey(featureName) {
    const today = new Date().toISOString().split('T')[0];
    return `usage_${featureName}_${today}`;
}

function getTotalUsage(featureName) {
    const key = getTotalStorageKey(featureName);
    const data = JSON.parse(localStorage.getItem(key) || '0');
    return parseInt(data, 10) || 0;
}

function getTotalStorageKey(featureName) {
    return `usage_total_${featureName}`;
}

/**
 * Increment usage for a feature
 * Resets if date changed (handled by unique key)
 * @param {string} featureName 
 * @returns {object} { count, limit, remaining }
 */
export function incrementUsage(featureName) {
    if (window.licenseManager && typeof window.licenseManager.incrementFeatureUsage === 'function') {
        return window.licenseManager.incrementFeatureUsage(featureName);
    }

    const tier = getCurrentTier();
    const limitConfig = FEATURE_LIMITS[featureName];

    // If no limit exists or unlimited, just return
    if (!limitConfig || !limitConfig[tier]) return { count: 0, limit: -1, remaining: -1 };

    const tierConfig = limitConfig[tier];
    const hasTotalLimit = tierConfig.total_limit !== undefined;
    const limit = hasTotalLimit ? (tierConfig.total_limit ?? -1) : (tierConfig.daily_limit ?? -1);

    // Increment
    const key = hasTotalLimit ? getTotalStorageKey(featureName) : getStorageKey(featureName);
    const current = hasTotalLimit ? getTotalUsage(featureName) : getDailyUsage(featureName);
    const newVal = current + 1;

    localStorage.setItem(key, newVal.toString());

    // Clean up old keys (optional optimization)
    // For now, let's keep it simple.

    return {
        count: newVal,
        limit,
        remaining: limit === -1 ? -1 : Math.max(0, limit - newVal),
        scope: hasTotalLimit ? 'total' : 'daily'
    };
}

/**
 * Main Enforcement Function
 * Usage: if (!enforceLimit('ai_scanner', (r, t) => openModal(r, t))) return;
 */
export function enforceLimit(featureName, onBlock) {
    const status = checkFeatureAccess(featureName);

    if (status.allowed) {
        // Pass check, but we usually increment AFTER the action is confirmed?
        // Or should this function auto-increment?
        // The prompt says "In AI Scanner button click... if (!enforceLimit... return". 
        // It does NOT say enforceLimit increments. 
        // But prompt item 2 says "incrementUsage ... Updates: increment on each use".
        // Usually we check permission BEFORE, and increment AFTER success.
        // However, for simple gates, we might increment here.
        // Let's stick to PURE check here. The user said:
        // "Update: increment on each use" under "DAILY LIMIT TRACKING".
        // It implies we need to call incrementUsage() separately or include it?
        // Re-reading: "CREATE FUNCTION: enforceLimit... Calls checkFeatureAccess... If allowed -> return true".
        // It does NOT say it increments. 
        // SO: We need to call incrementUsage() manually after the action happens.
        return true;
    }

    // Blocked
    if (typeof onBlock === 'function') {
        onBlock(status.reason, status.upgradeNeeded);
    }

    return false;
}

// Expose globally for app.js
if (typeof window !== 'undefined') {
    window.checkFeatureAccess = checkFeatureAccess;
    window.incrementUsage = incrementUsage;
    window.enforceLimit = enforceLimit;
    window.getCurrentTier = getCurrentTier;
}
