/**
 * DEPRECATED ENTRYPOINT
 * Canonical LicenseManager now lives in ../js/license-manager.js
 */
import { LicenseManager } from '../js/license-manager.js';
export { LicenseManager };

if (typeof window !== 'undefined') {
    window.LicenseManager = LicenseManager;
    console.warn('[LICENSE] Deprecated import "modules/license-manager.js". Use "../js/license-manager.js" instead.');
}
