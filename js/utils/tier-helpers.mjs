/**
 * ESM test companion for tier helpers.
 * Kept in sync with js/utils/tier-helpers.js for node-based tests.
 */

const TIER_ORDER = ['basic', 'ultimate'];

const TIER_META = {
    basic: {
        label: 'BASIC',
        color: '#6b7280',
        bgClass: 'bg-gray-500',
        textClass: 'text-gray-400',
        borderClass: 'border-gray-500',
        icon: '🆓'
    },
    ultimate: {
        label: 'ULTIMATE',
        color: '#f59e0b',
        bgClass: 'bg-amber-500',
        textClass: 'text-amber-400',
        borderClass: 'border-amber-500',
        icon: '🚀'
    }
};

export const FEATURE_LIMITS = {
    ai_scanner: {
        basic: { daily_limit: 1, quality: 'basic', history_days: 1 },
        ultimate: { daily_limit: -1, quality: 'ultra', history_days: -1 }
    },
    batch_processing: {
        basic: { max_batch_size: 0 },
        ultimate: { max_batch_size: -1 }
    },
    export: {
        basic: { formats: ['png'], quality: 'basic' },
        ultimate: { formats: ['png', 'jpg', 'pdf', 'svg', 'raw'], quality: 'ultra' }
    },
    storage: {
        basic: { storage_mb: 50, history_days: 1 },
        ultimate: { storage_mb: -1, history_days: -1 }
    },
    advanced_filters: {
        basic: { access: false, presets: 0 },
        ultimate: { access: true, presets: -1 }
    },
    protocols_wallet_execute: {
        basic: { access: false },
        ultimate: { access: true }
    },
    protocols_logistics_optimize: {
        basic: { total_limit: 3 },
        ultimate: { total_limit: -1 }
    }
};

function normalizeTier(tier) {
    const value = String(tier || '').trim().toLowerCase();
    return value === 'ultimate' ? 'ultimate' : 'basic';
}

export function getTierColor(tier) {
    return TIER_META[normalizeTier(tier)]?.bgClass || TIER_META.basic.bgClass;
}

export function getTierTextColor(tier) {
    return TIER_META[normalizeTier(tier)]?.textClass || TIER_META.basic.textClass;
}

export function getTierBorderColor(tier) {
    return TIER_META[normalizeTier(tier)]?.borderClass || TIER_META.basic.borderClass;
}

export function getTierHexColor(tier) {
    return TIER_META[normalizeTier(tier)]?.color || TIER_META.basic.color;
}

export function getTierIcon(tier) {
    return TIER_META[normalizeTier(tier)]?.icon || '🆓';
}

export function getTierLabel(tier) {
    return TIER_META[normalizeTier(tier)]?.label || 'BASIC';
}

export function formatLimit(limit) {
    if (limit === -1 || limit === null || limit === undefined) return '∞';
    return String(limit);
}

export function canUpgradeTo(currentTier, targetTier) {
    const currentRank = TIER_ORDER.indexOf(normalizeTier(currentTier));
    const targetRank = TIER_ORDER.indexOf(normalizeTier(targetTier));
    if (currentRank === -1 || targetRank === -1) return false;
    return targetRank > currentRank;
}

export function getTierRank(tier) {
    return TIER_ORDER.indexOf(normalizeTier(tier));
}

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

    if (target.daily_limit !== undefined && current.daily_limit !== undefined) {
        if (target.daily_limit === -1) {
            return `${targetIcon} Upgrade to ${targetLabel} for unlimited daily scans!`;
        }
        const diff = target.daily_limit - current.daily_limit;
        if (diff > 0) {
            return `${targetIcon} Upgrade to ${targetLabel} for ${diff} more daily scans!`;
        }
    }

    if (target.max_batch_size !== undefined && current.max_batch_size !== undefined) {
        if (current.max_batch_size === 0 && target.max_batch_size > 0) {
            const batchLabel = target.max_batch_size === -1 ? 'unlimited' : `up to ${target.max_batch_size}`;
            return `${targetIcon} Upgrade to ${targetLabel} for batch processing (${batchLabel} items)!`;
        }
        if (target.max_batch_size === -1) {
            return `${targetIcon} Upgrade to ${targetLabel} for unlimited batch processing!`;
        }
    }

    if (target.formats && current.formats) {
        const newFormats = target.formats.filter(f => !current.formats.includes(f));
        if (newFormats.length > 0) {
            return `${targetIcon} Upgrade to ${targetLabel} to export as ${newFormats.map(f => f.toUpperCase()).join(', ')}!`;
        }
    }

    if (target.quality && current.quality && target.quality !== current.quality) {
        return `${targetIcon} Upgrade to ${targetLabel} for ${target.quality}-quality processing!`;
    }

    if (target.storage_mb !== undefined && current.storage_mb !== undefined) {
        if (target.storage_mb === -1) {
            return `${targetIcon} Upgrade to ${targetLabel} for unlimited storage!`;
        }
        return `${targetIcon} Upgrade to ${targetLabel} for ${target.storage_mb >= 1000 ? (target.storage_mb / 1000) + 'GB' : target.storage_mb + 'MB'} storage!`;
    }

    if (current.access === false && target.access === true) {
        return `${targetIcon} Upgrade to ${targetLabel} to unlock ${feature.replace(/_/g, ' ')}!`;
    }

    return `${targetIcon} Upgrade to ${targetLabel} to unlock more features!`;
}

export function getTierMeta(tier) {
    const normalized = normalizeTier(tier);
    return { ...TIER_META[normalized] } || { ...TIER_META.basic };
}
