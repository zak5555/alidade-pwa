/**
 * Tier helper tests (2-tier model: basic + ultimate)
 * Run: node js/utils/tier-helpers.test.mjs
 */

let passed = 0;
let failed = 0;
const failures = [];

function describe(label, fn) {
    console.log(`\n--- ${label} ---`);
    fn();
}

function it(label, fn) {
    try {
        fn();
        passed++;
        console.log(`  [OK] ${label}`);
    } catch (error) {
        failed++;
        failures.push({ label, error: error.message });
        console.log(`  [FAIL] ${label}`);
        console.log(`    -> ${error.message}`);
    }
}

function expect(actual) {
    return {
        toBe(expected) {
            if (actual !== expected) {
                throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
            }
        },
        toContain(expected) {
            if (typeof actual !== 'string' || !actual.includes(expected)) {
                throw new Error(`Expected ${JSON.stringify(actual)} to contain ${JSON.stringify(expected)}`);
            }
        }
    };
}

import {
    getTierColor,
    getTierTextColor,
    getTierBorderColor,
    getTierHexColor,
    getTierIcon,
    getTierLabel,
    formatLimit,
    canUpgradeTo,
    getTierRank,
    calculateUpgradeValue,
    getTierMeta
} from './tier-helpers.mjs';

describe('Tier lookups normalize legacy values', () => {
    it('maps lite to basic color', () => {
        expect(getTierColor('lite')).toBe('bg-gray-500');
    });
    it('maps free to basic label', () => {
        expect(getTierLabel('free')).toBe('BASIC');
    });
    it('returns ultimate values as-is', () => {
        expect(getTierLabel('ultimate')).toBe('ULTIMATE');
    });
});

describe('Rank and upgrade checks', () => {
    it('basic -> ultimate is valid', () => {
        expect(canUpgradeTo('basic', 'ultimate')).toBe(true);
    });
    it('ultimate -> basic is not valid', () => {
        expect(canUpgradeTo('ultimate', 'basic')).toBe(false);
    });
    it('same tier is not valid upgrade', () => {
        expect(canUpgradeTo('basic', 'basic')).toBe(false);
    });
    it('ranks are stable', () => {
        expect(getTierRank('basic')).toBe(0);
        expect(getTierRank('ultimate')).toBe(1);
    });
});

describe('Upgrade copy reflects strict BASIC limits', () => {
    it('scanner copy highlights unlimited upgrade', () => {
        const value = calculateUpgradeValue('basic', 'ultimate', 'ai_scanner');
        expect(value).toContain('unlimited daily scans');
    });
    it('advanced filters copy highlights unlock', () => {
        const value = calculateUpgradeValue('basic', 'ultimate', 'advanced_filters');
        expect(value).toContain('unlock');
    });
});

describe('Misc helpers', () => {
    it('formatLimit handles infinity', () => {
        expect(formatLimit(-1)).toBe('∞');
    });
    it('returns consistent metadata', () => {
        const meta = getTierMeta('basic');
        expect(meta.label).toBe('BASIC');
    });
    it('exposes style lookups', () => {
        expect(getTierTextColor('ultimate')).toBe('text-amber-400');
        expect(getTierBorderColor('basic')).toBe('border-gray-500');
        expect(getTierHexColor('ultimate')).toBe('#f59e0b');
        expect(getTierIcon('basic')).toBe('🆓');
    });
});

console.log('\n============================');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log('============================');

if (failed > 0) {
    failures.forEach(f => console.log(`- ${f.label}: ${f.error}`));
    process.exit(1);
}

process.exit(0);
