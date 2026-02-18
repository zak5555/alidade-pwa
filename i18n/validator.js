/**
 * ALIDADE™ i18n Validation Script
 * ═══════════════════════════════════════════════════════════════
 * Run before deploy to ensure translation completeness
 * 
 * Usage: node i18n/validator.js
 * 
 * Poka-Yoke: Fails build if translations incomplete
 * ═══════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

function validate() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  ALIDADE i18n TRANSLATION VALIDATION');
    console.log('═══════════════════════════════════════════════════════════════\n');

    try {
        // Read and parse translation files (convert ESM to CJS-compatible)
        const i18nDir = path.join(__dirname);

        function loadTranslation(filename) {
            const filePath = path.join(i18nDir, filename);
            let content = fs.readFileSync(filePath, 'utf8');

            // Remove export default and evaluate
            content = content.replace(/export\s+default\s+/, 'module.exports = ');

            // Create a temporary file, evaluate, and delete
            const tempPath = path.join(i18nDir, `_temp_${filename}`);
            fs.writeFileSync(tempPath, content);

            try {
                const translations = require(tempPath);
                return translations;
            } finally {
                fs.unlinkSync(tempPath);
            }
        }

        const en = loadTranslation('en.js');
        const fr = loadTranslation('fr.js');
        const es = loadTranslation('es.js');

        // Extract all keys recursively
        function getAllKeys(obj, prefix = '') {
            let keys = [];
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    const fullKey = prefix ? `${prefix}.${key}` : key;
                    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                        keys = keys.concat(getAllKeys(obj[key], fullKey));
                    } else {
                        keys.push(fullKey);
                    }
                }
            }
            return keys;
        }

        // Get all keys
        const enKeys = getAllKeys(en);
        const frKeys = getAllKeys(fr);
        const esKeys = getAllKeys(es);

        // Find missing keys
        const missing = {
            fr: enKeys.filter(k => !frKeys.includes(k)),
            es: enKeys.filter(k => !esKeys.includes(k))
        };

        // Find extra keys (potential typos or orphaned translations)
        const extra = {
            fr: frKeys.filter(k => !enKeys.includes(k)),
            es: esKeys.filter(k => !enKeys.includes(k))
        };

        // Report
        console.log('📊 TRANSLATION COUNTS:');
        console.log(`   English (master):  ${enKeys.length} keys`);
        console.log(`   French:            ${frKeys.length} keys (${Math.round(frKeys.length / enKeys.length * 100)}%)`);
        console.log(`   Spanish:           ${esKeys.length} keys (${Math.round(esKeys.length / enKeys.length * 100)}%)`);
        console.log('');

        let hasErrors = false;
        let hasWarnings = false;

        // Missing translations (ERRORS)
        if (missing.fr.length > 0) {
            hasErrors = true;
            console.error('❌ FRENCH MISSING KEYS:');
            missing.fr.forEach(k => console.error(`   - ${k}`));
            console.log('');
        }

        if (missing.es.length > 0) {
            hasErrors = true;
            console.error('❌ SPANISH MISSING KEYS:');
            missing.es.forEach(k => console.error(`   - ${k}`));
            console.log('');
        }

        // Extra keys (WARNINGS)
        if (extra.fr.length > 0) {
            hasWarnings = true;
            console.warn('⚠️  FRENCH EXTRA KEYS (not in English):');
            extra.fr.forEach(k => console.warn(`   - ${k}`));
            console.log('');
        }

        if (extra.es.length > 0) {
            hasWarnings = true;
            console.warn('⚠️  SPANISH EXTRA KEYS (not in English):');
            extra.es.forEach(k => console.warn(`   - ${k}`));
            console.log('');
        }

        // Check for empty strings
        function findEmptyStrings(obj, prefix = '') {
            let empty = [];
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    const fullKey = prefix ? `${prefix}.${key}` : key;
                    if (typeof obj[key] === 'object' && obj[key] !== null) {
                        empty = empty.concat(findEmptyStrings(obj[key], fullKey));
                    } else if (obj[key] === '' || obj[key] === null || obj[key] === undefined) {
                        empty.push(fullKey);
                    }
                }
            }
            return empty;
        }

        const emptyFr = findEmptyStrings(fr);
        const emptyEs = findEmptyStrings(es);

        if (emptyFr.length > 0) {
            hasWarnings = true;
            console.warn('⚠️  FRENCH EMPTY VALUES:');
            emptyFr.forEach(k => console.warn(`   - ${k}`));
            console.log('');
        }

        if (emptyEs.length > 0) {
            hasWarnings = true;
            console.warn('⚠️  SPANISH EMPTY VALUES:');
            emptyEs.forEach(k => console.warn(`   - ${k}`));
            console.log('');
        }

        // Summary
        console.log('═══════════════════════════════════════════════════════════════');

        if (hasErrors) {
            console.error('❌ VALIDATION FAILED');
            console.error('   Fix missing translations before deploy!');
            console.log('═══════════════════════════════════════════════════════════════');
            process.exit(1);
        } else if (hasWarnings) {
            console.warn('⚠️  VALIDATION PASSED WITH WARNINGS');
            console.warn('   Review extra/empty keys when possible.');
            console.log('═══════════════════════════════════════════════════════════════');
            process.exit(0);
        } else {
            console.log('✅ VALIDATION PASSED');
            console.log('   All translations complete and aligned!');
            console.log('═══════════════════════════════════════════════════════════════');
            process.exit(0);
        }

    } catch (error) {
        console.error('❌ VALIDATION ERROR:', error.message);
        console.error('   Make sure all translation files exist and are valid.');
        process.exit(1);
    }
}

// Run validation
validate();
