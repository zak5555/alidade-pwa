/**
 * DEPRECATED ENTRYPOINT
 * Keep this file as a compatibility shim and route all imports
 * to the single canonical manager implementation.
 */
import { LicenseManager } from './js/license-manager.js';
export { LicenseManager };

if (typeof window !== 'undefined') {
    window.LicenseManager = LicenseManager;
    console.warn('[LICENSE] Deprecated import "license-manager-v2.js". Use "./js/license-manager.js" instead.');
}
