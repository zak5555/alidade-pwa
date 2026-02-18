
const SOS_SETTINGS_KEY = 'alidade_sos_settings_v1';
const SOS_CONTACTS_KEY = 'alidade_emergency_contacts';
const SOS_INCIDENT_QUEUE_KEY = 'alidade_sos_incident_queue_v1';
const SOS_AUDIT_TIMELINE_KEY = 'alidade_sos_audit_timeline_v1';
const SOS_AUDIT_MAX_ENTRIES = 120;
const SOS_QUEUE_MAX_ENTRIES = 120;
const SOS_MOCK_LATENCY_MS = 180;

const DEFAULT_SOS_SETTINGS = {
    shakeEnabled: true,
    buttonEnabled: true,
    motionPermission: 'unknown',
    autoEscalationEnabled: true,
    autoEscalateTier1AfterSec: 90,
    autoEscalateTier2AfterSec: 150
};

const SOS_EMERGENCY_PHRASES = [
    {
        english: 'Help! Police!',
        arabic: 'Ø§Ù„Ø¹ÙˆÙ†! Ø§Ù„Ø¨ÙˆÙ„ÙŠØ³!',
        phonetic: 'al-3awn! al-bou-lees!'
    },
    {
        english: 'Leave me alone!',
        arabic: 'Ø®Ù„ÙŠÙ†ÙŠ Ø¨Ø­Ø§Ù„ÙŠ!',
        phonetic: 'khal-lee-nee b7a-lee!'
    },
    {
        english: 'I need a doctor',
        arabic: 'Ø¨ØºÙŠØª Ø·Ø¨ÙŠØ¨',
        phonetic: 'bghit t-beeb'
    },
    {
        english: 'Call the police',
        arabic: 'Ø¹ÙŠØ· Ù„Ù„Ø¨ÙˆÙ„ÙŠØ³',
        phonetic: '3ayyat lel-bou-lees'
    },
    {
        english: "I'm lost",
        arabic: 'Ø£Ù†Ø§ ØªØ§ÙŠÙ‡',
        phonetic: 'ana ta-yeh'
    },
    {
        english: 'Where is the hospital?',
        arabic: 'ÙÙŠÙ† Ø§Ù„Ø³Ø¨ÙŠØ·Ø§Ø±ØŸ',
        phonetic: 'feen as-sbi-tar?'
    },
    {
        english: "I don't understand",
        arabic: 'Ù…Ø§ ÙÙ‡Ù…ØªØ´',
        phonetic: 'ma fhemt-sh'
    }
];

function safeParseJSON(value, fallback) {
    try {
        return value ? JSON.parse(value) : fallback;
    } catch (error) {
        console.warn('[SOS] Failed to parse JSON:', error);
        return fallback;
    }
}

function isFunction(value) {
    return typeof value === 'function';
}

function escapeHtml(value = '') {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function clampInteger(value, min, max, fallback) {
    const num = Number(value);
    if (!Number.isFinite(num)) return fallback;
    const rounded = Math.round(num);
    if (rounded < min) return min;
    if (rounded > max) return max;
    return rounded;
}

function getToast() {
    return isFunction(window.showToast)
        ? window.showToast.bind(window)
        : (message) => console.log('[SOS][TOAST]', message);
}

async function mockFetch(url, options = {}) {
    const payload = {
        url,
        method: options.method || 'GET',
        body: options.body || null,
        timestamp: Date.now(),
        mocked: true
    };

    console.log('[SOS][MOCK_FETCH]', payload);
    await new Promise((resolve) => setTimeout(resolve, SOS_MOCK_LATENCY_MS));

    return {
        ok: true,
        status: 200,
        async json() {
            return payload;
        }
    };
}

class SOSIncidentQueueManager {
    constructor(fetcher, options = {}) {
        this.fetcher = fetcher;
        this.storageKey = options.storageKey || SOS_INCIDENT_QUEUE_KEY;
        this.maxEntries = Number(options.maxEntries || SOS_QUEUE_MAX_ENTRIES);
        this.queue = safeParseJSON(localStorage.getItem(this.storageKey), []) || [];
        this.flushing = false;
        this.lastFlushAt = null;
        this.lastFlushError = null;
    }

    saveQueue() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
        } catch (error) {
            console.warn('[SOS] Failed to persist incident queue:', error);
        }
    }

    getStats() {
        return {
            pending: this.queue.length,
            flushing: this.flushing,
            lastFlushAt: this.lastFlushAt,
            lastFlushError: this.lastFlushError
        };
    }

    normalizeHeaders(headers = {}) {
        if (!headers) return {};
        if (typeof headers.entries === 'function') {
            return Object.fromEntries(headers.entries());
        }
        if (Array.isArray(headers)) {
            return Object.fromEntries(headers);
        }
        return { ...headers };
    }

    normalizeBody(body) {
        if (typeof body === 'string') return body;
        if (body === null || body === undefined) return null;
        try {
            return JSON.stringify(body);
        } catch (_error) {
            return String(body);
        }
    }

    enqueue(url, options = {}, meta = {}) {
        const item = {
            id: `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
            createdAt: new Date().toISOString(),
            url: String(url || ''),
            method: String(options.method || 'POST').toUpperCase(),
            headers: this.normalizeHeaders(options.headers || {}),
            body: this.normalizeBody(options.body),
            attempts: 0,
            nextAttemptAt: Date.now(),
            lastError: null,
            meta: {
                type: String(meta.type || 'unknown'),
                priority: String(meta.priority || 'normal')
            }
        };

        this.queue.push(item);
        if (this.queue.length > this.maxEntries) {
            this.queue.splice(0, this.queue.length - this.maxEntries);
        }
        this.saveQueue();
        return item;
    }

    async flush(options = {}) {
        if (this.flushing) {
            return { ok: false, skipped: true, reason: 'already_flushing', pending: this.queue.length };
        }

        const force = options.force === true;
        const maxItems = Math.max(1, Number(options.maxItems || 20));
        if (!force && typeof navigator !== 'undefined' && navigator && navigator.onLine === false) {
            return { ok: false, skipped: true, reason: 'offline', pending: this.queue.length };
        }

        this.flushing = true;
        let processed = 0;
        let succeeded = 0;
        let failed = 0;
        const now = Date.now();

        try {
            for (let i = 0; i < this.queue.length && processed < maxItems; i += 1) {
                const item = this.queue[i];
                if (!item) continue;
                if (!force && Number(item.nextAttemptAt || 0) > now) continue;

                processed += 1;
                try {
                    const response = await this.fetcher(item.url, {
                        method: item.method || 'POST',
                        headers: item.headers || { 'Content-Type': 'application/json' },
                        body: item.body
                    });
                    if (response && response.ok === false) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    this.queue.splice(i, 1);
                    i -= 1;
                    succeeded += 1;
                } catch (error) {
                    item.attempts = Number(item.attempts || 0) + 1;
                    const backoffMs = Math.min(120000, 1000 * (2 ** Math.min(6, item.attempts)));
                    item.nextAttemptAt = Date.now() + backoffMs;
                    item.lastError = String(error?.message || error || 'unknown');
                    failed += 1;
                }
            }

            this.lastFlushAt = new Date().toISOString();
            this.lastFlushError = failed > 0 ? `${failed} item(s) failed` : null;
            this.saveQueue();
            return {
                ok: failed === 0,
                processed,
                succeeded,
                failed,
                pending: this.queue.length
            };
        } finally {
            this.flushing = false;
        }
    }
}

class LocationSharing {
    constructor(fetcher = mockFetch) {
        this.fetcher = fetcher;
        this.watchId = null;
        this.updateInterval = null;
        this.sessionId = null;
        this.shareLink = null;
        this.lastPosition = null;
    }

    async startSharing(tier) {
        this.sessionId = this.generateSessionId();
        this.shareLink = `https://alidade.app/track/${this.sessionId}`;
        const updateFrequency = tier === 3 ? 10000 : 30000;

        if ('geolocation' in navigator) {
            this.watchId = navigator.geolocation.watchPosition(
                (position) => {
                    this.lastPosition = position;
                    this.updateLocation(this.sessionId, position);
                },
                (error) => console.error('[SOS] GPS watch error:', error),
                {
                    enableHighAccuracy: true,
                    maximumAge: 0,
                    timeout: 5000
                }
            );
        } else {
            console.warn('[SOS] Geolocation unavailable');
        }

        this.updateInterval = setInterval(() => {
            this.heartbeat(this.sessionId);
        }, updateFrequency);

        return this.shareLink;
    }

    async updateLocation(sessionId, position) {
        if (!position?.coords) return;

        const data = {
            sessionId,
            timestamp: Date.now(),
            location: {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
                altitude: position.coords.altitude,
                heading: position.coords.heading,
                speed: position.coords.speed
            },
            battery: await this.getBatteryLevel(),
            status: 'active'
        };

        try {
            await this.fetcher('https://api.alidade.app/sos/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            this.storeLocalBackup(data);
        } catch (error) {
            console.error('[SOS] Failed to submit location update:', error);
        }
    }

    async heartbeat(sessionId) {
        try {
            await this.fetcher('https://api.alidade.app/sos/heartbeat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, timestamp: Date.now() })
            });
        } catch (error) {
            console.error('[SOS] Heartbeat failed:', error);
        }
    }

    async getBatteryLevel() {
        if (!isFunction(navigator.getBattery)) return null;
        try {
            const battery = await navigator.getBattery();
            return Math.round(battery.level * 100);
        } catch (error) {
            console.warn('[SOS] Battery API failed:', error);
            return null;
        }
    }

    generateSessionId() {
        return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    }

    stopSharing() {
        if (this.watchId !== null && 'geolocation' in navigator) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }

        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    storeLocalBackup(data) {
        try {
            const openRequest = indexedDB.open('alidade_sos', 1);
            openRequest.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('locations')) {
                    db.createObjectStore('locations', { keyPath: 'timestamp' });
                }
            };
            openRequest.onsuccess = (event) => {
                const db = event.target.result;
                const tx = db.transaction(['locations'], 'readwrite');
                tx.objectStore('locations').put(data);
            };
        } catch (error) {
            console.warn('[SOS] IndexedDB backup failed:', error);
        }
    }
}

class EmergencyContacts {
    constructor(fetcher = mockFetch) {
        this.fetcher = fetcher;
        this.contacts = this.loadContacts();
    }

    loadContacts() {
        return safeParseJSON(localStorage.getItem(SOS_CONTACTS_KEY), []) || [];
    }

    saveContacts(contacts) {
        localStorage.setItem(SOS_CONTACTS_KEY, JSON.stringify(contacts));
        this.contacts = contacts;
    }

    addContact(contact) {
        const clean = {
            name: String(contact.name || '').trim(),
            phone: String(contact.phone || '').trim(),
            email: String(contact.email || '').trim(),
            userId: String(contact.userId || '').trim()
        };

        if (!clean.name) throw new Error('Contact name is required');
        if (!clean.phone && !clean.email) throw new Error('Phone or email is required');
        if (this.contacts.length >= 5) throw new Error('Maximum 5 contacts allowed');

        this.saveContacts([...this.contacts, clean]);
        return clean;
    }

    removeContact(index) {
        const updated = this.contacts.filter((_, i) => i !== index);
        this.saveContacts(updated);
        return updated;
    }

    composeMessage(tier, shareLink, location) {
        const severityText = {
            1: 'âš ï¸ UNCOMFORTABLE',
            2: 'ðŸ†˜ NEED HELP',
            3: 'ðŸš¨ EMERGENCY'
        };

        const locationText = location
            ? `Location: https://maps.google.com/?q=${location.lat},${location.lng}`
            : 'Location unavailable';

        return [
            `${severityText[tier]} - ALIDADE SOS ALERT`,
            '',
            'I need assistance in Marrakech.',
            '',
            locationText,
            '',
            `Live tracking: ${shareLink || 'Pending...'}`,
            '',
            `Sent: ${new Date().toLocaleString()}`
        ].join('\n');
    }

    async notifyAll(tier, shareLink, currentLocation) {
        const message = this.composeMessage(tier, shareLink, currentLocation);
        for (const contact of this.contacts) {
            // Continue even if one method fails.
            // eslint-disable-next-line no-await-in-loop
            await this.notifyContact(contact, message);
        }
    }

    async notifyContact(contact, message) {
        try {
            await this.fetcher('https://api.alidade.app/sos/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contact,
                    message,
                    priority: 'urgent'
                })
            });
        } catch (error) {
            console.error('[SOS] Mock notification failed:', error);
        }

        if (contact.phone && navigator.share) {
            try {
                await navigator.share({
                    title: 'ALIDADE SOS ALERT',
                    text: message
                });
                return;
            } catch (error) {
                console.warn('[SOS] Web Share unavailable for this attempt:', error);
            }
        }

        if (contact.phone) {
            try {
                const whatsappUrl = `https://wa.me/${contact.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
            } catch (error) {
                console.warn('[SOS] WhatsApp fallback failed:', error);
            }
        }

        if (contact.email) {
            try {
                const mailtoUrl = `mailto:${contact.email}?subject=ALIDADE%20SOS%20ALERT&body=${encodeURIComponent(message)}`;
                window.open(mailtoUrl, '_blank');
            } catch (error) {
                console.warn('[SOS] Email fallback failed:', error);
            }
        }
    }
}

class EmergencySOS {
    constructor(options = {}) {
        this.fetcher = options.fetcher || mockFetch;
        this.toast = getToast();
        this.auditTimeline = this.loadAuditTimeline();
        this.incidentQueue = new SOSIncidentQueueManager(this.fetcher, {
            storageKey: SOS_INCIDENT_QUEUE_KEY,
            maxEntries: SOS_QUEUE_MAX_ENTRIES
        });
        this.resilientFetch = this.createResilientSosFetch();
        this.contacts = new EmergencyContacts(this.resilientFetch);
        this.locationSharing = null;
        this.activeAlert = null;
        this.tier = null;
        this.countdownInterval = null;
        this.timerInterval = null;
        this.queueFlushInterval = null;
        this.autoEscalationInFlight = false;
        this.shakeHandler = this.handleShakeMotion.bind(this);
        this.onlineHandler = this.handleOnlineStatus.bind(this);
        this.securityStateHandler = this.handleSecurityStateChanged.bind(this);
        this.shakeState = { lastShake: 0, count: 0, cooldownUntil: 0 };

        this.settings = this.normalizeSettings(
            safeParseJSON(localStorage.getItem(SOS_SETTINGS_KEY), {})
        );

        this.motionPermissionRequired = !!(
            window.DeviceMotionEvent &&
            isFunction(window.DeviceMotionEvent.requestPermission)
        );
    }

    init() {
        this.injectStyles();
        this.refreshWidget();
        this.refreshShakeListener();
        this.startQueueWorkers();
        window.addEventListener('online', this.onlineHandler);
        window.addEventListener('alidade:securityStateChanged', this.securityStateHandler);
        this.recordAudit('sos_system_initialized', 'info', {
            queuePending: this.incidentQueue.getStats().pending
        });
    }

    normalizeEscalationSeconds(value, fallback) {
        return clampInteger(value, 15, 900, fallback);
    }

    normalizeSettings(rawSettings = {}) {
        const safeRaw = rawSettings && typeof rawSettings === 'object' ? rawSettings : {};
        const merged = {
            ...DEFAULT_SOS_SETTINGS,
            ...safeRaw
        };
        const tier1 = this.normalizeEscalationSeconds(
            merged.autoEscalateTier1AfterSec,
            DEFAULT_SOS_SETTINGS.autoEscalateTier1AfterSec
        );
        const tier2Raw = this.normalizeEscalationSeconds(
            merged.autoEscalateTier2AfterSec,
            DEFAULT_SOS_SETTINGS.autoEscalateTier2AfterSec
        );
        const tier2 = Math.max(tier1 + 15, tier2Raw);
        const permission = ['unknown', 'granted', 'denied'].includes(merged.motionPermission)
            ? merged.motionPermission
            : 'unknown';
        return {
            shakeEnabled: merged.shakeEnabled !== false,
            buttonEnabled: merged.buttonEnabled !== false,
            motionPermission: permission,
            autoEscalationEnabled: merged.autoEscalationEnabled !== false,
            autoEscalateTier1AfterSec: tier1,
            autoEscalateTier2AfterSec: tier2
        };
    }

    updateAutoEscalationSettings(patch = {}) {
        const previous = {
            autoEscalationEnabled: this.settings.autoEscalationEnabled,
            autoEscalateTier1AfterSec: this.settings.autoEscalateTier1AfterSec,
            autoEscalateTier2AfterSec: this.settings.autoEscalateTier2AfterSec
        };
        this.settings = this.normalizeSettings({
            ...this.settings,
            ...(patch && typeof patch === 'object' ? patch : {})
        });
        this.saveSettings();

        const changed = previous.autoEscalationEnabled !== this.settings.autoEscalationEnabled ||
            previous.autoEscalateTier1AfterSec !== this.settings.autoEscalateTier1AfterSec ||
            previous.autoEscalateTier2AfterSec !== this.settings.autoEscalateTier2AfterSec;
        if (changed) {
            this.recordAudit('sos_auto_escalation_config_updated', 'info', {
                enabled: this.settings.autoEscalationEnabled,
                tier2AfterSec: this.settings.autoEscalateTier1AfterSec,
                tier3AfterSec: this.settings.autoEscalateTier2AfterSec
            });
        }

        this.updateAutoEscalationStatus();
        this.refreshSettingsPanels();
    }

    emitIntelEvent(eventName, payload = {}, meta = {}) {
        const intelUtils = window.ALIDADE_INTEL_EVENT_UTILS;
        if (!intelUtils || !isFunction(intelUtils.emitIntelEvent)) return;
        const safeMeta = {
            source: 'emergency_sos',
            sessionId: this.activeAlert?.sessionId || null,
            ...meta
        };
        intelUtils.emitIntelEvent(eventName, payload, safeMeta).catch(() => { });
    }

    loadAuditTimeline() {
        const parsed = safeParseJSON(localStorage.getItem(SOS_AUDIT_TIMELINE_KEY), []);
        return Array.isArray(parsed) ? parsed : [];
    }

    saveAuditTimeline() {
        try {
            localStorage.setItem(SOS_AUDIT_TIMELINE_KEY, JSON.stringify(this.auditTimeline));
        } catch (error) {
            console.warn('[SOS] Failed to persist audit timeline:', error);
        }
    }

    compactAuditDetails(details = {}) {
        const safe = {};
        Object.entries(details || {}).forEach(([key, value]) => {
            if (value === null || value === undefined) {
                safe[key] = value;
            } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                safe[key] = value;
            } else {
                try {
                    safe[key] = JSON.stringify(value);
                } catch (_error) {
                    safe[key] = String(value);
                }
            }
        });
        return safe;
    }

    recordAudit(type, level = 'info', details = {}) {
        const entry = {
            id: `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
            at: new Date().toISOString(),
            type: String(type || 'unknown'),
            level: String(level || 'info'),
            details: this.compactAuditDetails(details)
        };
        this.auditTimeline.push(entry);
        if (this.auditTimeline.length > SOS_AUDIT_MAX_ENTRIES) {
            this.auditTimeline.splice(0, this.auditTimeline.length - SOS_AUDIT_MAX_ENTRIES);
        }
        this.saveAuditTimeline();
        window.dispatchEvent(new CustomEvent('alidade:sosAuditUpdated', {
            detail: {
                latest: entry,
                total: this.auditTimeline.length
            }
        }));
        return entry;
    }

    getLatestAuditSummary() {
        const last = this.auditTimeline[this.auditTimeline.length - 1] || null;
        if (!last) return 'No activity yet';
        return `${last.type} @ ${new Date(last.at).toLocaleTimeString()}`;
    }

    createResilientSosFetch() {
        return async (url, options = {}) => {
            try {
                const response = await this.fetcher(url, options);
                if (response && response.ok === false) {
                    throw new Error(`HTTP ${response.status}`);
                }
                return response;
            } catch (error) {
                const urlText = String(url || '');
                if (/\/sos\//i.test(urlText)) {
                    this.incidentQueue.enqueue(urlText, options, {
                        type: 'network_retry',
                        priority: /heartbeat|update/i.test(urlText) ? 'high' : 'urgent'
                    });
                    this.recordAudit('incident_queued', 'warning', {
                        url: urlText,
                        message: String(error?.message || error || 'unknown')
                    });
                    this.refreshSettingsPanels();
                }
                throw error;
            }
        };
    }

    async flushIncidentQueue(force = false) {
        const result = await this.incidentQueue.flush({ force, maxItems: 25 });
        const pending = this.incidentQueue.getStats().pending;

        if (result && result.skipped) {
            this.recordAudit('queue_flush_skipped', 'info', {
                reason: result.reason,
                pending
            });
            return result;
        }

        this.recordAudit('queue_flushed', result?.failed > 0 ? 'warning' : 'success', {
            processed: result?.processed || 0,
            succeeded: result?.succeeded || 0,
            failed: result?.failed || 0,
            pending
        });
        return result;
    }

    startQueueWorkers() {
        if (this.queueFlushInterval) {
            clearInterval(this.queueFlushInterval);
        }
        this.queueFlushInterval = setInterval(() => {
            this.flushIncidentQueue(false).catch((error) => {
                this.recordAudit('queue_flush_error', 'warning', {
                    message: String(error?.message || error || 'unknown')
                });
            });
        }, 30000);
    }

    handleOnlineStatus() {
        this.recordAudit('network_online', 'info', {
            pending: this.incidentQueue.getStats().pending
        });
        this.flushIncidentQueue(true).catch(() => { });
    }

    handleSecurityStateChanged(event) {
        const state = event?.detail?.state || {};
        this.recordAudit('golden_record_security_state', 'info', {
            status: state.status || 'unknown',
            mode: state.mode || 'unknown',
            datasetVersion: state.datasetVersion || null
        });
    }

    injectStyles() {
        if (document.getElementById('emergency-sos-styles')) return;
        const style = document.createElement('style');
        style.id = 'emergency-sos-styles';
        style.textContent = `
            .sos-widget-button {
                position: fixed;
                left: 16px;
                bottom: 96px;
                width: 60px;
                height: 60px;
                border-radius: 9999px;
                border: 3px solid #fff;
                background: radial-gradient(circle at 30% 30%, #ff9a9a, #ef4444 65%, #9f1239);
                box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.55), 0 12px 26px rgba(0, 0, 0, 0.45);
                z-index: 90;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                color: #fff;
                font-size: 22px;
                font-weight: 700;
                animation: sosPulse 1.6s infinite;
            }

            .sos-widget-label {
                position: fixed;
                left: 82px;
                bottom: 112px;
                z-index: 89;
                padding: 4px 8px;
                font-size: 10px;
                font-family: 'JetBrains Mono', monospace;
                font-weight: 700;
                letter-spacing: 0.12em;
                color: #fca5a5;
                border: 1px solid rgba(239, 68, 68, 0.45);
                background: rgba(10, 10, 10, 0.88);
                border-radius: 2px;
            }

            @keyframes sosPulse {
                0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.55), 0 12px 26px rgba(0, 0, 0, 0.45); }
                70% { transform: scale(1.05); box-shadow: 0 0 0 12px rgba(239, 68, 68, 0), 0 14px 26px rgba(0, 0, 0, 0.55); }
                100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0), 0 12px 26px rgba(0, 0, 0, 0.45); }
            }

            .sos-fake-call-avatar {
                width: 136px;
                height: 136px;
                border-radius: 9999px;
                background: linear-gradient(140deg, #22c55e 0%, #06b6d4 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 60px;
                color: #fff;
                box-shadow: 0 0 0 8px rgba(255, 255, 255, 0.08);
            }

            .sos-ring-ripple {
                position: absolute;
                inset: -8px;
                border-radius: 9999px;
                border: 2px solid rgba(34, 197, 94, 0.6);
                animation: sosRipple 1.6s infinite;
            }

            @keyframes sosRipple {
                0% { transform: scale(0.92); opacity: 0.9; }
                100% { transform: scale(1.2); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    saveSettings() {
        this.settings = this.normalizeSettings(this.settings);
        localStorage.setItem(SOS_SETTINGS_KEY, JSON.stringify(this.settings));
    }

    isShakePermissionGranted() {
        return !this.motionPermissionRequired || this.settings.motionPermission === 'granted';
    }

    isShakeAvailable() {
        return !!window.DeviceMotionEvent && this.settings.shakeEnabled && this.isShakePermissionGranted();
    }

    async requestShakePermission(userInitiated = false) {
        if (!this.motionPermissionRequired) return true;
        if (!userInitiated) return false;

        try {
            const result = await window.DeviceMotionEvent.requestPermission();
            this.settings.motionPermission = result === 'granted' ? 'granted' : 'denied';
            this.saveSettings();
            this.refreshShakeListener();
            this.refreshSettingsPanels();

            if (result === 'granted') {
                this.toast('Shake gesture enabled', 'success', 1800);
                return true;
            }

            this.toast('Shake permission denied', 'warning', 2200);
            return false;
        } catch (error) {
            console.warn('[SOS] Motion permission request failed:', error);
            this.settings.motionPermission = 'denied';
            this.saveSettings();
            this.refreshSettingsPanels();
            this.toast('Could not enable shake gesture', 'error', 2200);
            return false;
        }
    }

    refreshShakeListener() {
        window.removeEventListener('devicemotion', this.shakeHandler);
        if (!this.isShakeAvailable()) return;
        window.addEventListener('devicemotion', this.shakeHandler, { passive: true });
    }

    handleShakeMotion(event) {
        if (!this.settings.shakeEnabled || !this.isShakePermissionGranted()) return;
        if (!event?.accelerationIncludingGravity) return;

        const { x = 0, y = 0, z = 0 } = event.accelerationIncludingGravity;
        const totalAcceleration = Math.abs(x) + Math.abs(y) + Math.abs(z);
        const threshold = 25;
        const now = Date.now();

        if (now < this.shakeState.cooldownUntil) return;
        if (totalAcceleration <= threshold) return;

        if (now - this.shakeState.lastShake < 1000) {
            this.shakeState.count += 1;
            if (this.shakeState.count >= 3) {
                this.shakeState.cooldownUntil = now + 8000;
                this.shakeState.count = 0;
                this.quickActivate('shake');
            }
        } else {
            this.shakeState.count = 1;
        }

        this.shakeState.lastShake = now;
    }

    refreshWidget() {
        const oldButton = document.getElementById('sos-quick-button');
        const oldLabel = document.getElementById('sos-quick-label');
        if (oldButton) oldButton.remove();
        if (oldLabel) oldLabel.remove();

        if (!this.settings.buttonEnabled) return;

        const button = document.createElement('button');
        button.id = 'sos-quick-button';
        button.className = 'sos-widget-button';
        button.type = 'button';
        button.innerHTML = 'ðŸš¨';
        button.setAttribute('aria-label', 'Quick Emergency SOS');
        button.addEventListener('click', () => this.quickActivate('button'));
        document.body.appendChild(button);

        const label = document.createElement('div');
        label.id = 'sos-quick-label';
        label.className = 'sos-widget-label';
        label.textContent = 'SOS READY';
        document.body.appendChild(label);
    }

    quickActivate(method) {
        if (this.activeAlert) {
            const overlay = document.getElementById('sos-active-overlay');
            if (overlay) overlay.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        console.log(`[SOS] Quick activation via ${method}`);
        this.recordAudit('sos_quick_activate', 'warning', { method: String(method || 'unknown') });
        this.emitIntelEvent('sos.armed', {
            method: String(method || 'unknown')
        }, {
            priorityClass: 'sos_event'
        });
        if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
        if (window.Haptics) window.Haptics.trigger('error');
        this.showTierSelection();
    }

    showTierSelection() {
        this.cancel();
        this.recordAudit('sos_tier_selection_opened', 'warning', {});

        const overlay = document.createElement('div');
        overlay.id = 'sos-tier-selection';
        overlay.className = 'fixed inset-0 bg-black/95 z-[220] flex items-center justify-center p-4';
        overlay.innerHTML = `
            <div class="max-w-md w-full space-y-3">
                <div class="text-center mb-6">
                    <div class="text-signal-crimson text-6xl font-bold mb-2" id="sos-countdown">3</div>
                    <div class="text-zinc-400 text-sm">Select severity now or Tier 1 starts automatically</div>
                </div>

                <button data-sos-tier="1" class="w-full p-6 bg-signal-amber/20 border-2 border-signal-amber rounded-lg text-left hover:bg-signal-amber/30 active:scale-95 transition-all">
                    <div class="flex items-center gap-4">
                        <div class="text-5xl">ðŸ˜°</div>
                        <div class="flex-1">
                            <div class="text-lg font-bold text-signal-amber mb-1">UNCOMFORTABLE</div>
                            <div class="text-xs text-zinc-300">Share location and notify contacts</div>
                        </div>
                    </div>
                </button>

                <button data-sos-tier="2" class="w-full p-6 bg-orange-500/15 border-2 border-orange-400 rounded-lg text-left hover:bg-orange-500/25 active:scale-95 transition-all">
                    <div class="flex items-center gap-4">
                        <div class="text-5xl">ðŸ˜¨</div>
                        <div class="flex-1">
                            <div class="text-lg font-bold text-orange-300 mb-1">NEED HELP</div>
                            <div class="text-xs text-zinc-300">+ Fake call and emergency phrases card</div>
                        </div>
                    </div>
                </button>

                <button data-sos-tier="3" class="w-full p-6 bg-signal-crimson/20 border-2 border-signal-crimson rounded-lg text-left hover:bg-signal-crimson/30 active:scale-95 transition-all">
                    <div class="flex items-center gap-4">
                        <div class="text-5xl">ðŸ†˜</div>
                        <div class="flex-1">
                            <div class="text-lg font-bold text-signal-crimson mb-1">DANGER</div>
                            <div class="text-xs text-zinc-300">+ Alarm, strobe, emergency call prompt</div>
                        </div>
                    </div>
                </button>

                <button data-sos-cancel class="w-full py-3 bg-void-800 text-zinc-300 rounded hover:bg-void-700 transition-colors">
                    CANCEL (False alarm)
                </button>
            </div>
        `;

        overlay.addEventListener('click', (event) => {
            const tierButton = event.target.closest('[data-sos-tier]');
            if (tierButton) {
                const tier = Number(tierButton.getAttribute('data-sos-tier'));
                this.activateTier(tier);
                return;
            }

            if (event.target.closest('[data-sos-cancel]')) {
                this.cancel();
            }
        });

        document.body.appendChild(overlay);

        let countdown = 3;
        const countdownEl = overlay.querySelector('#sos-countdown');
        this.countdownInterval = setInterval(() => {
            countdown -= 1;
            if (countdownEl) countdownEl.textContent = String(countdown);
            if (countdown <= 0) {
                this.activateTier(1);
            }
        }, 1000);
    }

    cancel() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
        document.getElementById('sos-tier-selection')?.remove();
    }

    async activateTier(tier) {
        if (![1, 2, 3].includes(tier)) return;
        this.cancel();

        if (!this.activeAlert) {
            this.activeAlert = {
                startTime: Date.now(),
                tier,
                tier1Complete: false,
                tier2Complete: false,
                tier3Complete: false,
                shareLink: null,
                sessionId: null,
                locationSharing: null,
                mediaRecorder: null,
                recordingStream: null,
                alarmAudio: null,
                fakeCallAudio: null,
                fakeCallVibrationInterval: null,
                strobeInterval: null,
                strobeOverlay: null,
                torchTrack: null,
                torchStream: null,
                autoEscalation: {
                    tier2Triggered: false,
                    tier3Triggered: false,
                    lastTriggerAt: null
                }
            };
        }

        this.tier = Math.max(this.tier || 0, tier);
        this.activeAlert.tier = this.tier;
        this.ensureAutoEscalationState();
        if (this.tier >= 2) this.activeAlert.autoEscalation.tier2Triggered = true;
        if (this.tier >= 3) this.activeAlert.autoEscalation.tier3Triggered = true;
        this.recordAudit('sos_tier_activated', this.tier >= 3 ? 'critical' : 'warning', {
            tier: this.tier
        });
        this.emitIntelEvent('sos.triggered', {
            tier: this.tier,
            escalated: this.tier > 1
        }, {
            priorityClass: 'sos_event',
            threatLevel: this.tier >= 3 ? 'critical' : (this.tier === 2 ? 'high' : 'medium')
        });
        this.showActiveAlert();

        if (this.tier >= 1 && !this.activeAlert.tier1Complete) {
            await this.tier1_ShareLocation();
            await this.tier1_NotifyContacts();
            await this.tier1_StartRecording();
            this.activeAlert.tier1Complete = true;
        }

        if (this.tier >= 2 && !this.activeAlert.tier2Complete) {
            await this.tier2_FakeCall();
            await this.tier2_ShowPhrases();
            await this.tier2_SendSMSToPolice();
            this.activeAlert.tier2Complete = true;
        }

        if (this.tier >= 3 && !this.activeAlert.tier3Complete) {
            await this.tier3_SoundAlarm();
            await this.tier3_StrobeLight();
            await this.tier3_CallEmergency();
            await this.tier3_ContinuousUpdates();
            this.activeAlert.tier3Complete = true;
        }

        this.updateActiveAlertContent();
    }

    async tier1_ShareLocation() {
        this.locationSharing = new LocationSharing(this.resilientFetch);
        const shareLink = await this.locationSharing.startSharing(this.tier);
        this.activeAlert.shareLink = shareLink;
        this.activeAlert.locationSharing = this.locationSharing;
        this.activeAlert.sessionId = this.locationSharing.sessionId;
        this.updateActiveAlertContent();
        console.log('[SOS] Tier 1 location sharing active:', shareLink);
        this.recordAudit('sos_location_sharing_started', 'warning', {
            tier: this.tier,
            sessionId: this.activeAlert.sessionId || null
        });
    }

    async tier1_NotifyContacts() {
        const position = await this.getCurrentPositionSafe();
        await this.contacts.notifyAll(this.tier, this.activeAlert?.shareLink, position?.coords || null);
        console.log('[SOS] Tier 1 contacts notified');
        this.recordAudit('sos_contacts_notified', 'warning', {
            contactsCount: this.contacts.contacts.length,
            tier: this.tier
        });
    }

    async tier1_StartRecording() {
        if (!navigator.mediaDevices || !window.MediaRecorder) {
            console.warn('[SOS] Audio recording unavailable');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) chunks.push(event.data);
            };

            recorder.onstop = () => {
                if (chunks.length === 0) return;
                const blob = new Blob(chunks, { type: 'audio/webm' });
                this.saveRecording(blob);
            };

            recorder.start();
            this.activeAlert.mediaRecorder = recorder;
            this.activeAlert.recordingStream = stream;
            console.log('[SOS] Tier 1 audio recording started');
            this.recordAudit('sos_audio_recording_started', 'warning', {});
        } catch (error) {
            console.error('[SOS] Recording failed:', error);
            this.recordAudit('sos_audio_recording_failed', 'warning', {
                message: String(error?.message || error || 'unknown')
            });
        }
    }

    async tier2_FakeCall() {
        this.stopFakeCall();

        const fakeCallUI = document.createElement('div');
        fakeCallUI.id = 'sos-fake-call';
        fakeCallUI.className = 'fixed inset-0 z-[310] bg-gradient-to-b from-black via-void-900 to-void-950 text-white';
        fakeCallUI.innerHTML = `
            <div class="h-full flex flex-col items-center justify-between py-14 px-6">
                <div class="text-center space-y-2">
                    <div class="text-zinc-400 text-sm tracking-widest uppercase font-mono">Incoming Call</div>
                    <div class="text-zinc-500 text-xs">Slide excuse mode active</div>
                </div>

                <div class="text-center space-y-6">
                    <div class="relative mx-auto w-fit">
                        <div class="sos-ring-ripple"></div>
                        <div class="sos-fake-call-avatar">ðŸ‘¤</div>
                    </div>
                    <div>
                        <div class="text-4xl font-bold tracking-tight">Dad</div>
                        <div class="text-signal-emerald text-sm uppercase tracking-widest font-mono mt-1">Mobile</div>
                    </div>
                </div>

                <div class="w-full max-w-xs space-y-4">
                    <div class="flex justify-center gap-10">
                        <button type="button" data-sos-fake-dismiss class="w-20 h-20 rounded-full bg-signal-crimson text-3xl flex items-center justify-center active:scale-95">ðŸ“ž</button>
                        <button type="button" data-sos-fake-dismiss class="w-20 h-20 rounded-full bg-signal-emerald text-3xl flex items-center justify-center active:scale-95">âœ…</button>
                    </div>
                    <p class="text-center text-[11px] text-zinc-500 font-mono">Use this as a social exit. Tap either button to dismiss.</p>
                </div>
            </div>
        `;

        fakeCallUI.addEventListener('click', (event) => {
            if (event.target.closest('[data-sos-fake-dismiss]') || event.target === fakeCallUI) {
                this.stopFakeCall();
            }
        });

        document.body.appendChild(fakeCallUI);

        if (navigator.vibrate) {
            navigator.vibrate([1000, 500, 1000, 500, 1000]);
            this.activeAlert.fakeCallVibrationInterval = setInterval(() => {
                navigator.vibrate([500, 300, 500, 900]);
            }, 2200);
        }

        try {
            const ringtone = new Audio('assets/audio/ringtone.mp3');
            ringtone.loop = true;
            ringtone.volume = 1;
            this.activeAlert.fakeCallAudio = ringtone;
            await ringtone.play();
        } catch (error) {
            console.warn('[SOS] Ringtone autoplay blocked:', error);
        }

        console.log('[SOS] Tier 2 fake call started');
        this.recordAudit('sos_fake_call_started', 'warning', {});
    }

    stopFakeCall() {
        document.getElementById('sos-fake-call')?.remove();

        if (this.activeAlert?.fakeCallAudio) {
            this.activeAlert.fakeCallAudio.pause();
            this.activeAlert.fakeCallAudio.currentTime = 0;
            this.activeAlert.fakeCallAudio = null;
        }

        if (this.activeAlert?.fakeCallVibrationInterval) {
            clearInterval(this.activeAlert.fakeCallVibrationInterval);
            this.activeAlert.fakeCallVibrationInterval = null;
        }

        if (navigator.vibrate && this.tier !== 3) {
            navigator.vibrate(0);
        }
    }

    async tier2_ShowPhrases() {
        this.removePhrasesCard();

        const phrasesCard = document.createElement('div');
        phrasesCard.id = 'emergency-phrases-card';
        phrasesCard.className = 'fixed left-0 right-0 bottom-0 z-[305] bg-void-900 border-t-2 border-signal-amber p-4 pb-6 max-h-[52vh] overflow-y-auto';
        phrasesCard.innerHTML = `
            <div class="max-w-md mx-auto">
                <div class="flex items-center justify-between mb-3">
                    <div>
                        <h3 class="text-signal-amber font-bold text-sm tracking-wider uppercase">Emergency Phrases</h3>
                        <p class="text-[11px] text-zinc-500">Tap speak to project your message fast.</p>
                    </div>
                    <button type="button" data-sos-close-phrases class="w-8 h-8 rounded bg-void-800 text-zinc-400 hover:text-white">âœ•</button>
                </div>
                <div class="space-y-2">
                    ${SOS_EMERGENCY_PHRASES.map((phrase, index) => `
                        <div class="bg-void-800/80 border border-void-700 rounded p-3">
                            <div class="text-white text-sm font-semibold mb-1">${phrase.english}</div>
                            <div class="text-signal-amber text-base font-bold mb-1" dir="rtl">${phrase.arabic}</div>
                            <div class="text-zinc-500 text-[11px] font-mono mb-3">${phrase.phonetic}</div>
                            <div class="flex gap-2">
                                <button type="button" data-sos-speak="${index}" class="flex-1 py-2 bg-signal-emerald/20 border border-signal-emerald/40 text-signal-emerald rounded text-xs font-mono font-bold hover:bg-signal-emerald/30">ðŸ”Š SPEAK</button>
                                <button type="button" data-sos-copy="${index}" class="flex-1 py-2 bg-void-700 border border-void-600 text-zinc-300 rounded text-xs font-mono font-bold hover:bg-void-600">ðŸ“‹ COPY</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        phrasesCard.addEventListener('click', (event) => {
            if (event.target.closest('[data-sos-close-phrases]')) {
                this.removePhrasesCard();
                return;
            }

            const speakButton = event.target.closest('[data-sos-speak]');
            if (speakButton) {
                const idx = Number(speakButton.getAttribute('data-sos-speak'));
                const phrase = SOS_EMERGENCY_PHRASES[idx];
                if (phrase) this.speakPhrase(phrase);
                return;
            }

            const copyButton = event.target.closest('[data-sos-copy]');
            if (copyButton) {
                const idx = Number(copyButton.getAttribute('data-sos-copy'));
                const phrase = SOS_EMERGENCY_PHRASES[idx];
                if (phrase) {
                    navigator.clipboard?.writeText(`${phrase.english}\n${phrase.arabic}\n${phrase.phonetic}`);
                    this.toast('Phrase copied', 'success', 1200);
                }
            }
        });

        document.body.appendChild(phrasesCard);
        this.recordAudit('sos_phrases_card_opened', 'warning', {});
    }

    removePhrasesCard() {
        document.getElementById('emergency-phrases-card')?.remove();
    }

    speakPhrase(phrase) {
        if (!window.speechSynthesis) {
            this.toast('Speech synthesis not available on this device', 'warning', 2000);
            return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(phrase.arabic);
        utterance.lang = 'ar-MA';
        utterance.rate = 0.95;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
        if (window.Haptics) window.Haptics.trigger('light');
    }

    async tier2_SendSMSToPolice() {
        const policeNumber = '0524384601';
        const position = await this.getCurrentPositionSafe();
        const mapLink = position
            ? `https://maps.google.com/?q=${position.coords.latitude},${position.coords.longitude}`
            : 'Unknown';

        const message = [
            'TOURIST EMERGENCY',
            '',
            'I need assistance.',
            '',
            `Location: ${mapLink}`,
            '',
            `Tracking: ${this.activeAlert?.shareLink || 'Pending...'}`,
            '',
            `Time: ${new Date().toLocaleString()}`
        ].join('\n');

        try {
            await this.resilientFetch('https://api.alidade.app/sos/police-draft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ policeNumber, message })
            });
            this.recordAudit('sos_police_sms_draft_prepared', 'warning', { policeNumber });
        } catch (error) {
            console.error('[SOS] Failed to queue police SMS:', error);
            this.recordAudit('sos_police_sms_draft_failed', 'warning', {
                message: String(error?.message || error || 'unknown')
            });
        }

        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isMobile) {
            const shouldOpen = window.confirm('Prepare SMS to Tourist Police now?');
            if (shouldOpen) {
                const smsUrl = `sms:${policeNumber}?body=${encodeURIComponent(message)}`;
                window.location.href = smsUrl;
            }
        } else {
            console.log('[SOS] Desktop environment detected, SMS draft prepared');
        }
    }

    async tier3_SoundAlarm() {
        try {
            const alarm = new Audio('assets/audio/police.mp3');
            alarm.loop = true;
            alarm.volume = 1;
            this.activeAlert.alarmAudio = alarm;
            await alarm.play();
            this.recordAudit('sos_alarm_started', 'critical', { source: 'police.mp3' });
        } catch (error) {
            console.warn('[SOS] Police alarm file failed, fallback to ringtone:', error);
            try {
                const fallback = new Audio('assets/audio/ringtone.mp3');
                fallback.loop = true;
                fallback.volume = 1;
                this.activeAlert.alarmAudio = fallback;
                await fallback.play();
                this.recordAudit('sos_alarm_started', 'critical', { source: 'ringtone.mp3' });
            } catch (fallbackError) {
                console.error('[SOS] Alarm fallback failed:', fallbackError);
                this.recordAudit('sos_alarm_failed', 'critical', {
                    message: String(fallbackError?.message || fallbackError || 'unknown')
                });
            }
        }

        this.continuousVibrate();
    }

    async tier3_StrobeLight() {
        const torchStarted = await this.startTorchStrobe();
        if (!torchStarted) {
            this.startScreenStrobe();
            this.recordAudit('sos_strobe_started', 'critical', { mode: 'screen' });
        } else {
            this.recordAudit('sos_strobe_started', 'critical', { mode: 'torch' });
        }
    }

    async startTorchStrobe() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            return false;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' } }
            });
            const track = stream.getVideoTracks()[0];
            if (!track || !isFunction(track.getCapabilities)) {
                stream.getTracks().forEach((item) => item.stop());
                return false;
            }

            const capabilities = track.getCapabilities();
            if (!capabilities.torch) {
                stream.getTracks().forEach((item) => item.stop());
                return false;
            }

            let torchOn = false;
            const interval = setInterval(async () => {
                torchOn = !torchOn;
                try {
                    await track.applyConstraints({ advanced: [{ torch: torchOn }] });
                } catch (error) {
                    console.warn('[SOS] Torch toggle failed:', error);
                }
            }, 200);

            this.activeAlert.strobeInterval = interval;
            this.activeAlert.torchTrack = track;
            this.activeAlert.torchStream = stream;
            console.log('[SOS] Tier 3 torch strobe active');
            return true;
        } catch (error) {
            console.warn('[SOS] Torch strobe unavailable:', error);
            return false;
        }
    }

    startScreenStrobe() {
        this.stopStrobeEffects();

        const overlay = document.createElement('div');
        overlay.id = 'sos-screen-strobe';
        overlay.className = 'fixed inset-0 pointer-events-none z-[140]';
        overlay.style.background = 'rgba(255, 255, 255, 0.92)';
        overlay.style.mixBlendMode = 'screen';
        document.body.appendChild(overlay);

        let white = true;
        const interval = setInterval(() => {
            white = !white;
            overlay.style.background = white
                ? 'rgba(255, 255, 255, 0.95)'
                : 'rgba(239, 68, 68, 0.78)';
        }, 120);

        this.activeAlert.strobeOverlay = overlay;
        this.activeAlert.strobeInterval = interval;
        console.log('[SOS] Tier 3 screen strobe fallback active');
    }

    async tier3_CallEmergency() {
        const confirmed = window.confirm('Call Tourist Police now? (+212 524 38 46 01)');
        if (confirmed) {
            this.recordAudit('sos_emergency_call_prompt_confirmed', 'critical', {});
            window.location.href = 'tel:+212524384601';
        } else {
            this.recordAudit('sos_emergency_call_prompt_declined', 'warning', {});
        }
    }

    async tier3_ContinuousUpdates() {
        console.log('[SOS] Tier 3 continuous updates active (10s)');
    }

    continuousVibrate() {
        if (!navigator.vibrate) return;
        const loop = () => {
            if (!this.activeAlert || this.tier !== 3) return;
            navigator.vibrate([200, 100]);
            setTimeout(loop, 300);
        };
        loop();
    }

    async getCurrentPositionSafe() {
        if (!('geolocation' in navigator)) return null;
        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                (position) => resolve(position),
                () => resolve(null),
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        });
    }

    showActiveAlert() {
        if (!this.activeAlert) return;

        const existing = document.getElementById('sos-active-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'sos-active-overlay';
        overlay.className = 'fixed inset-0 bg-signal-crimson/95 z-[230] flex items-center justify-center p-4';
        overlay.innerHTML = `
            <div class="max-w-md w-full text-center space-y-5">
                <div id="sos-active-emoji" class="text-8xl animate-pulse">ðŸ˜°</div>

                <div>
                    <div id="sos-active-title" class="text-white text-2xl font-bold mb-2">SOFT ALERT ACTIVE</div>
                    <div id="sos-active-subtitle" class="text-white/80 text-sm">Contacts notified â€¢ Location shared</div>
                </div>

                <div class="bg-black/30 rounded-lg p-4">
                    <div class="text-white/70 text-xs mb-1">ALERT DURATION</div>
                    <div id="sos-timer" class="text-white text-4xl font-mono font-bold">00:00</div>
                    <div id="sos-auto-escalation-status" class="text-[11px] text-white/70 font-mono mt-2">Auto escalation status initializing...</div>
                </div>

                <div id="sos-share-link-box" class="bg-black/30 rounded-lg p-4 hidden">
                    <div class="text-white/70 text-xs mb-2">TRACKING LINK</div>
                    <div id="sos-share-link-text" class="text-white text-xs font-mono break-all mb-2"></div>
                    <button type="button" data-sos-copy-link class="px-4 py-2 bg-white/20 text-white rounded text-xs hover:bg-white/30">ðŸ“‹ COPY LINK</button>
                </div>

                <div class="space-y-2">
                    <button id="sos-escalate-button" type="button" class="w-full py-4 bg-white text-signal-crimson font-bold text-lg rounded hover:opacity-90">
                        â¬†ï¸ ESCALATE
                    </button>
                    <button data-sos-deactivate type="button" class="w-full py-3 bg-black/30 text-white rounded hover:bg-black/40">
                        âœ“ I'M SAFE - DEACTIVATE
                    </button>
                </div>

                <div class="text-white/70 text-xs">Emergency contacts are being updated in real time.</div>
            </div>
        `;

        overlay.addEventListener('click', (event) => {
            if (event.target.closest('[data-sos-copy-link]')) {
                if (this.activeAlert?.shareLink) {
                    navigator.clipboard?.writeText(this.activeAlert.shareLink);
                    this.toast('Tracking link copied', 'success', 1200);
                }
                return;
            }

            if (event.target.closest('#sos-escalate-button')) {
                this.escalate();
                return;
            }

            if (event.target.closest('[data-sos-deactivate]')) {
                this.deactivate();
            }
        });

        document.body.appendChild(overlay);
        this.startTimer();
        this.updateActiveAlertContent();
    }

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        const timerEl = document.getElementById('sos-timer');
        if (!timerEl || !this.activeAlert) return;

        this.timerInterval = setInterval(() => {
            if (!this.activeAlert) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
                return;
            }

            const elapsed = Math.floor((Date.now() - this.activeAlert.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');
            timerEl.textContent = `${minutes}:${seconds}`;
            this.updateAutoEscalationStatus(elapsed);
            this.handleAutoEscalation(elapsed);
        }, 1000);
    }

    ensureAutoEscalationState() {
        if (!this.activeAlert) return null;
        if (!this.activeAlert.autoEscalation || typeof this.activeAlert.autoEscalation !== 'object') {
            this.activeAlert.autoEscalation = {
                tier2Triggered: false,
                tier3Triggered: false,
                lastTriggerAt: null
            };
        }
        return this.activeAlert.autoEscalation;
    }

    formatSecondsClock(totalSeconds) {
        const safe = Math.max(0, Number(totalSeconds || 0));
        const minutes = Math.floor(safe / 60).toString().padStart(2, '0');
        const seconds = Math.floor(safe % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    }

    updateAutoEscalationStatus(elapsedSeconds = null) {
        const labelEl = document.getElementById('sos-auto-escalation-status');
        if (!labelEl) return;

        if (!this.activeAlert) {
            labelEl.textContent = 'Auto escalation idle';
            labelEl.className = 'text-[11px] text-zinc-400 font-mono mt-2';
            return;
        }

        if (!this.settings.autoEscalationEnabled) {
            labelEl.textContent = 'Auto escalation disabled (manual control)';
            labelEl.className = 'text-[11px] text-zinc-300 font-mono mt-2';
            return;
        }

        if (this.tier >= 3) {
            labelEl.textContent = 'Auto escalation complete (Tier 3 reached)';
            labelEl.className = 'text-[11px] text-signal-emerald font-mono mt-2';
            return;
        }

        const elapsed = Number.isFinite(Number(elapsedSeconds))
            ? Number(elapsedSeconds)
            : Math.floor((Date.now() - (this.activeAlert.startTime || Date.now())) / 1000);
        const nextTier = this.tier + 1;
        const threshold = this.tier === 1
            ? this.settings.autoEscalateTier1AfterSec
            : this.settings.autoEscalateTier2AfterSec;
        const remaining = Math.max(0, Number(threshold || 0) - elapsed);
        labelEl.textContent = `Auto escalation to Tier ${nextTier} in ${this.formatSecondsClock(remaining)}`;
        labelEl.className = remaining <= 12
            ? 'text-[11px] text-signal-amber font-mono mt-2'
            : 'text-[11px] text-white/75 font-mono mt-2';
    }

    handleAutoEscalation(elapsedSeconds) {
        if (!this.activeAlert || !this.settings.autoEscalationEnabled) return;
        if (this.autoEscalationInFlight) return;
        if (this.tier >= 3) return;

        const autoState = this.ensureAutoEscalationState();
        const elapsed = Number(elapsedSeconds || 0);
        let targetTier = null;
        let threshold = null;

        if (this.tier === 1 && !autoState.tier2Triggered && elapsed >= this.settings.autoEscalateTier1AfterSec) {
            targetTier = 2;
            threshold = this.settings.autoEscalateTier1AfterSec;
            autoState.tier2Triggered = true;
        } else if (this.tier === 2 && !autoState.tier3Triggered && elapsed >= this.settings.autoEscalateTier2AfterSec) {
            targetTier = 3;
            threshold = this.settings.autoEscalateTier2AfterSec;
            autoState.tier3Triggered = true;
        }

        if (!targetTier) return;

        autoState.lastTriggerAt = new Date().toISOString();
        this.autoEscalationInFlight = true;
        this.recordAudit('sos_auto_escalation_triggered', targetTier >= 3 ? 'critical' : 'warning', {
            fromTier: this.tier,
            toTier: targetTier,
            elapsedSec: elapsed,
            thresholdSec: threshold
        });

        this.activateTier(targetTier)
            .then(() => {
                this.toast(`Auto escalation: Tier ${targetTier} activated`, targetTier >= 3 ? 'error' : 'warning', 1700);
            })
            .catch((error) => {
                if (targetTier === 2) autoState.tier2Triggered = false;
                if (targetTier === 3) autoState.tier3Triggered = false;
                this.recordAudit('sos_auto_escalation_failed', 'warning', {
                    toTier: targetTier,
                    message: String(error?.message || error || 'unknown')
                });
            })
            .finally(() => {
                this.autoEscalationInFlight = false;
                this.updateAutoEscalationStatus();
            });
    }

    updateActiveAlertContent() {
        if (!this.activeAlert) return;

        const emojiEl = document.getElementById('sos-active-emoji');
        const titleEl = document.getElementById('sos-active-title');
        const subtitleEl = document.getElementById('sos-active-subtitle');
        const shareBox = document.getElementById('sos-share-link-box');
        const shareText = document.getElementById('sos-share-link-text');
        const escalateButton = document.getElementById('sos-escalate-button');

        const tierInfo = {
            1: { emoji: 'ðŸ˜°', title: 'SOFT ALERT ACTIVE', subtitle: 'Contacts notified â€¢ Location shared' },
            2: { emoji: 'ðŸ˜¨', title: 'URGENT HELP REQUESTED', subtitle: 'Fake call active â€¢ Phrases card ready' },
            3: { emoji: 'ðŸ†˜', title: 'EMERGENCY MODE', subtitle: 'Alarm active â€¢ Strobe active â€¢ Call prompt sent' }
        }[this.tier] || { emoji: 'ðŸš¨', title: 'SOS ACTIVE', subtitle: 'Emergency workflow running' };

        if (emojiEl) emojiEl.textContent = tierInfo.emoji;
        if (titleEl) titleEl.textContent = tierInfo.title;
        if (subtitleEl) subtitleEl.textContent = tierInfo.subtitle;

        if (shareBox && shareText) {
            if (this.activeAlert.shareLink) {
                shareBox.classList.remove('hidden');
                shareText.textContent = this.activeAlert.shareLink;
            } else {
                shareBox.classList.add('hidden');
            }
        }

        if (escalateButton) {
            if (this.tier >= 3) {
                escalateButton.classList.add('hidden');
            } else {
                escalateButton.classList.remove('hidden');
                escalateButton.textContent = `â¬†ï¸ ESCALATE TO TIER ${this.tier + 1}`;
            }
        }
        this.updateAutoEscalationStatus();
    }

    escalate() {
        if (!this.activeAlert || this.tier >= 3) return;
        const newTier = this.tier + 1;
        const confirmed = window.confirm(`Escalate to Tier ${newTier}?`);
        if (!confirmed) return;
        this.recordAudit('sos_escalated', newTier >= 3 ? 'critical' : 'warning', {
            fromTier: this.tier,
            toTier: newTier
        });
        this.activateTier(newTier);
    }

    async deactivate(requireConfirmation = true) {
        if (!this.activeAlert) return;
        if (requireConfirmation) {
            const confirmed = window.confirm("Are you sure you're safe? This stops all emergency alerts.");
            if (!confirmed) return;
        }

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        if (this.activeAlert.locationSharing) {
            this.activeAlert.locationSharing.stopSharing();
        }

        if (this.activeAlert.mediaRecorder && this.activeAlert.mediaRecorder.state !== 'inactive') {
            this.activeAlert.mediaRecorder.stop();
        }

        if (this.activeAlert.recordingStream) {
            this.activeAlert.recordingStream.getTracks().forEach((track) => track.stop());
            this.activeAlert.recordingStream = null;
        }

        if (this.activeAlert.alarmAudio) {
            this.activeAlert.alarmAudio.pause();
            this.activeAlert.alarmAudio.currentTime = 0;
            this.activeAlert.alarmAudio = null;
        }

        this.stopFakeCall();
        this.stopStrobeEffects();
        this.removePhrasesCard();

        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }

        navigator.vibrate?.(0);
        document.getElementById('sos-active-overlay')?.remove();
        document.getElementById('sos-tier-selection')?.remove();

        await this.sendSafeNotification();
        const durationSec = Math.max(0, Math.floor((Date.now() - Number(this.activeAlert.startTime || Date.now())) / 1000));
        this.emitIntelEvent('sos.deactivated', {
            tier: Number(this.tier || 0),
            durationSec
        }, {
            priorityClass: 'sos_event'
        });

        this.autoEscalationInFlight = false;
        this.activeAlert = null;
        this.tier = null;

        this.recordAudit('sos_deactivated', 'success', {});
        if (window.Haptics) window.Haptics.trigger('success');
        this.toast("âœ… Emergency deactivated. Glad you're safe!", 'success', 3000);
    }

    stopStrobeEffects() {
        if (this.activeAlert?.strobeInterval) {
            clearInterval(this.activeAlert.strobeInterval);
            this.activeAlert.strobeInterval = null;
        }

        if (this.activeAlert?.strobeOverlay) {
            this.activeAlert.strobeOverlay.remove();
            this.activeAlert.strobeOverlay = null;
        }

        if (this.activeAlert?.torchTrack) {
            try {
                this.activeAlert.torchTrack.applyConstraints({ advanced: [{ torch: false }] });
            } catch (error) {
                console.warn('[SOS] Failed to disable torch:', error);
            }
            this.activeAlert.torchTrack.stop();
            this.activeAlert.torchTrack = null;
        }

        if (this.activeAlert?.torchStream) {
            this.activeAlert.torchStream.getTracks().forEach((track) => track.stop());
            this.activeAlert.torchStream = null;
        }

        document.getElementById('sos-screen-strobe')?.remove();
    }

    async sendSafeNotification() {
        const message = [
            'âœ… ALL CLEAR',
            '',
            "I'm safe now. Emergency resolved.",
            '',
            `Time: ${new Date().toLocaleString()}`
        ].join('\n');

        for (const contact of this.contacts.contacts) {
            // Continue notifying all contacts even if one method fails.
            // eslint-disable-next-line no-await-in-loop
            await this.contacts.notifyContact(contact, message);
        }
        this.recordAudit('sos_all_clear_broadcast', 'success', {
            contactsCount: this.contacts.contacts.length
        });
    }

    async runTamperDrill() {
        const utils = window.ALIDADE_GOLDEN_RECORD_UTILS;
        const currentRecord = (utils && isFunction(utils.getGoldenRecord))
            ? utils.getGoldenRecord()
            : window.ALIDADE_GOLDEN_RECORD;

        if (!utils || !isFunction(utils.verifyGoldenRecordChecksum) || !currentRecord) {
            this.recordAudit('tamper_drill_unavailable', 'warning', {
                hasUtils: Boolean(utils),
                hasRecord: Boolean(currentRecord)
            });
            this.toast('Tamper drill unavailable: golden record not loaded', 'warning', 2200);
            return { ok: false, reason: 'unavailable' };
        }

        let detected = false;
        let verdict = null;
        try {
            const tamperedRecord = JSON.parse(JSON.stringify(currentRecord));
            tamperedRecord.metadata = tamperedRecord.metadata || {};
            tamperedRecord.metadata.checksum_sha256 = '0'.repeat(64);
            verdict = await utils.verifyGoldenRecordChecksum(tamperedRecord, { windowObj: window });
            detected = Boolean(verdict && verdict.ok === false);
        } catch (error) {
            this.recordAudit('tamper_drill_error', 'warning', {
                message: String(error?.message || error || 'unknown')
            });
            this.toast('Tamper drill failed to execute', 'error', 2200);
            return { ok: false, reason: 'error' };
        }

        this.recordAudit('tamper_drill_executed', detected ? 'success' : 'critical', {
            detected,
            declared: verdict?.declared || null,
            compact: verdict?.compact || null
        });

        window.dispatchEvent(new CustomEvent('alidade:securityDrillExecuted', {
            detail: {
                at: new Date().toISOString(),
                subsystem: 'golden_record',
                detected,
                mode: 'checksum_tamper_simulation'
            }
        }));

        if (detected) {
            this.toast('Tamper drill PASS: integrity gate detected mutation', 'success', 2400);
        } else {
            this.toast('Tamper drill FAIL: detector did not flag mutation', 'error', 2800);
        }
        this.refreshSettingsPanels();
        return { ok: detected, detected };
    }

    showAuditTimelineModal() {
        const existing = document.getElementById('sos-audit-modal');
        if (existing) existing.remove();

        const entries = [...this.auditTimeline].reverse().slice(0, 60);
        const rowsHtml = entries.length > 0
            ? entries.map((entry) => {
                const levelClass = entry.level === 'critical'
                    ? 'text-signal-crimson'
                    : entry.level === 'warning'
                        ? 'text-signal-amber'
                        : entry.level === 'success'
                            ? 'text-signal-emerald'
                            : 'text-zinc-400';
                const detailsText = escapeHtml(Object.entries(entry.details || {})
                    .map(([key, value]) => `${key}=${value}`)
                    .join(' | '));
                return `
                    <div class="border border-void-700 bg-void-900 rounded p-2">
                        <div class="flex items-center justify-between gap-2">
                            <div class="text-[10px] font-mono ${levelClass} uppercase">${escapeHtml(entry.level || 'info')}</div>
                            <div class="text-[10px] font-mono text-zinc-500">${escapeHtml(new Date(entry.at).toLocaleString())}</div>
                        </div>
                        <div class="text-xs font-mono text-white mt-1">${escapeHtml(entry.type || 'unknown')}</div>
                        <div class="text-[10px] font-mono text-zinc-500 mt-1">${detailsText || 'no details'}</div>
                    </div>
                `;
            }).join('')
            : `<div class="text-xs text-zinc-500">No audit events captured yet.</div>`;

        const modal = document.createElement('div');
        modal.id = 'sos-audit-modal';
        modal.className = 'fixed inset-0 bg-black/80 z-[280] flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="w-full max-w-2xl max-h-[85vh] overflow-hidden bg-void-950 border border-void-700 rounded">
                <div class="p-3 border-b border-void-700 flex items-center justify-between">
                    <div>
                        <h3 class="text-sm font-mono text-white uppercase tracking-wider">SOS Audit Timeline</h3>
                        <p class="text-[10px] text-zinc-500 font-mono">Last 60 events â€¢ local device log</p>
                    </div>
                    <button type="button" data-sos-close-audit class="px-2 py-1 bg-void-800 border border-void-700 text-zinc-300 text-xs rounded">Close</button>
                </div>
                <div class="p-3 flex gap-2 border-b border-void-700">
                    <button type="button" data-sos-copy-audit class="px-3 py-1 bg-void-800 border border-void-700 text-zinc-300 text-xs rounded">Copy JSON</button>
                    <button type="button" data-sos-clear-audit class="px-3 py-1 bg-signal-crimson/20 border border-signal-crimson/40 text-signal-crimson text-xs rounded">Clear Timeline</button>
                </div>
                <div class="p-3 space-y-2 overflow-y-auto max-h-[60vh]">${rowsHtml}</div>
            </div>
        `;

        modal.addEventListener('click', (event) => {
            if (event.target === modal || event.target.closest('[data-sos-close-audit]')) {
                modal.remove();
                return;
            }
            if (event.target.closest('[data-sos-copy-audit]')) {
                navigator.clipboard?.writeText(JSON.stringify(entries, null, 2));
                this.toast('Audit timeline copied', 'success', 1300);
                return;
            }
            if (event.target.closest('[data-sos-clear-audit]')) {
                const confirmed = window.confirm('Clear SOS audit timeline on this device?');
                if (!confirmed) return;
                this.auditTimeline = [];
                this.saveAuditTimeline();
                this.recordAudit('audit_timeline_cleared', 'info', {});
                modal.remove();
                this.showAuditTimelineModal();
            }
        });

        document.body.appendChild(modal);
    }

    async computeSha256Hex(value) {
        const text = typeof value === 'string' ? value : JSON.stringify(value);
        if (!window.crypto?.subtle || !window.TextEncoder) {
            return null;
        }
        try {
            const data = new TextEncoder().encode(text);
            const digest = await window.crypto.subtle.digest('SHA-256', data);
            return Array.from(new Uint8Array(digest))
                .map((byte) => byte.toString(16).padStart(2, '0'))
                .join('');
        } catch (error) {
            console.warn('[SOS] Failed to compute SHA-256 snapshot digest:', error);
            return null;
        }
    }

    buildIncidentSnapshotPayload(options = {}) {
        const includeQueueItems = options.includeQueueItems !== false;
        const maxAuditEntries = clampInteger(options.maxAuditEntries, 10, SOS_AUDIT_MAX_ENTRIES, 60);
        const safeAuditEntries = [...this.auditTimeline].slice(-maxAuditEntries);
        const queueStats = this.incidentQueue.getStats();
        const queueItems = includeQueueItems
            ? [...this.incidentQueue.queue].slice(-40).map((item) => ({
                id: item.id,
                url: item.url,
                method: item.method,
                attempts: item.attempts,
                createdAt: item.createdAt,
                lastError: item.lastError,
                meta: item.meta
            }))
            : [];
        const runtimeSecurity = window.__ALIDADE_RUNTIME_SECURITY_STATE__?.goldenRecord || null;

        return {
            schema: 'alidade.sos.incident_snapshot.v1',
            generatedAt: new Date().toISOString(),
            module: 'emergency-sos',
            security: runtimeSecurity,
            device: {
                online: typeof navigator === 'undefined' ? null : navigator.onLine !== false,
                userAgent: typeof navigator === 'undefined' ? null : (navigator.userAgent || null),
                powerMode: window.ALIDADE_POWER_RUNTIME_UTILS?.getMode?.() || null
            },
            sos: {
                active: Boolean(this.activeAlert),
                tier: Number(this.tier || 0),
                settings: {
                    autoEscalationEnabled: this.settings.autoEscalationEnabled,
                    autoEscalateTier1AfterSec: this.settings.autoEscalateTier1AfterSec,
                    autoEscalateTier2AfterSec: this.settings.autoEscalateTier2AfterSec
                },
                activeAlert: this.activeAlert
                    ? {
                        startTime: this.activeAlert.startTime || null,
                        tier: this.activeAlert.tier || null,
                        shareLink: this.activeAlert.shareLink || null,
                        sessionId: this.activeAlert.sessionId || null,
                        autoEscalation: this.activeAlert.autoEscalation || null
                    }
                    : null,
                queue: {
                    stats: queueStats,
                    items: queueItems
                },
                audit: {
                    count: safeAuditEntries.length,
                    entries: safeAuditEntries
                }
            }
        };
    }

    async buildSignedAuditSnapshot(options = {}) {
        const payload = this.buildIncidentSnapshotPayload(options);
        const canonical = JSON.stringify(payload);
        const digestHex = await this.computeSha256Hex(canonical);
        return {
            ...payload,
            signature: {
                algorithm: 'SHA-256',
                digestHex,
                canonicalization: 'json_stringify_v1',
                signedAt: new Date().toISOString()
            }
        };
    }

    async copySignedAuditSnapshot() {
        const snapshot = await this.buildSignedAuditSnapshot({
            includeQueueItems: false,
            maxAuditEntries: 80
        });
        const encoded = JSON.stringify(snapshot, null, 2);
        if (!navigator.clipboard?.writeText) {
            this.toast('Clipboard not available on this device', 'warning', 1800);
            return { ok: false, reason: 'clipboard_unavailable' };
        }
        try {
            await navigator.clipboard.writeText(encoded);
            this.recordAudit('sos_signed_snapshot_copied', 'info', {
                digest: snapshot.signature?.digestHex || null,
                entries: snapshot.sos?.audit?.count || 0
            });
            this.toast('Signed snapshot copied', 'success', 1500);
            return { ok: true, snapshot };
        } catch (error) {
            this.recordAudit('sos_signed_snapshot_copy_failed', 'warning', {
                message: String(error?.message || error || 'unknown')
            });
            this.toast('Failed to copy signed snapshot', 'error', 1800);
            return { ok: false, reason: 'copy_failed' };
        }
    }

    async exportIncidentPackage() {
        const snapshot = await this.buildSignedAuditSnapshot({
            includeQueueItems: true,
            maxAuditEntries: SOS_AUDIT_MAX_ENTRIES
        });
        const encoded = JSON.stringify(snapshot, null, 2);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `alidade-sos-incident-${timestamp}.json`;

        if (!window.URL || !isFunction(window.URL.createObjectURL) || typeof Blob === 'undefined') {
            const copied = await this.copySignedAuditSnapshot();
            if (copied.ok) {
                this.toast('Export fallback: signed snapshot copied instead', 'warning', 2200);
            }
            return { ok: copied.ok, mode: 'clipboard_fallback', filename, snapshot };
        }

        try {
            const blob = new Blob([encoded], { type: 'application/json;charset=utf-8' });
            const objectUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = objectUrl;
            link.download = filename;
            link.rel = 'noopener';
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => {
                try {
                    window.URL.revokeObjectURL(objectUrl);
                } catch (_error) { }
            }, 1000);

            this.recordAudit('sos_incident_package_exported', 'info', {
                filename,
                digest: snapshot.signature?.digestHex || null,
                entries: snapshot.sos?.audit?.count || 0
            });
            this.toast('Incident package exported', 'success', 1800);
            return { ok: true, mode: 'download', filename, snapshot };
        } catch (error) {
            this.recordAudit('sos_incident_package_export_failed', 'warning', {
                message: String(error?.message || error || 'unknown')
            });
            this.toast('Incident export failed', 'error', 2000);
            return { ok: false, mode: 'download', filename, snapshot };
        }
    }

    saveRecording(blob) {
        try {
            const url = URL.createObjectURL(blob);
            this.activeAlert = this.activeAlert || {};
            this.activeAlert.recordingUrl = url;
            this.toast('Audio evidence captured', 'success', 1800);
        } catch (error) {
            console.warn('[SOS] Failed to save recording URL:', error);
        }
    }

    toggleShake(enabled) {
        this.settings.shakeEnabled = !!enabled;
        this.saveSettings();
        this.refreshShakeListener();
        this.refreshSettingsPanels();
    }

    toggleButton(enabled) {
        this.settings.buttonEnabled = !!enabled;
        this.saveSettings();
        this.refreshWidget();
        this.refreshSettingsPanels();
    }

    async showAddContactForm() {
        const existing = document.getElementById('sos-contact-form-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'sos-contact-form-modal';
        modal.className = 'fixed inset-0 bg-black/80 z-[260] flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="w-full max-w-md bg-void-900 border border-void-700 rounded p-4">
                <h3 class="text-white font-bold mb-3">Add Emergency Contact</h3>
                <div class="space-y-3">
                    <input id="sos-contact-name" type="text" placeholder="Name" class="w-full px-3 py-2 bg-void-800 border border-void-700 rounded text-white">
                    <input id="sos-contact-phone" type="tel" placeholder="Phone (optional)" class="w-full px-3 py-2 bg-void-800 border border-void-700 rounded text-white">
                    <input id="sos-contact-email" type="email" placeholder="Email (optional)" class="w-full px-3 py-2 bg-void-800 border border-void-700 rounded text-white">
                </div>
                <div class="mt-4 flex gap-2">
                    <button type="button" data-sos-save-contact class="flex-1 py-2 bg-signal-emerald text-black font-bold rounded">Save</button>
                    <button type="button" data-sos-close-contact class="flex-1 py-2 bg-void-800 text-zinc-300 border border-void-700 rounded">Cancel</button>
                </div>
            </div>
        `;

        modal.addEventListener('click', (event) => {
            if (event.target === modal || event.target.closest('[data-sos-close-contact]')) {
                modal.remove();
                return;
            }

            if (event.target.closest('[data-sos-save-contact]')) {
                const name = modal.querySelector('#sos-contact-name')?.value || '';
                const phone = modal.querySelector('#sos-contact-phone')?.value || '';
                const email = modal.querySelector('#sos-contact-email')?.value || '';

                try {
                    this.contacts.addContact({ name, phone, email });
                    modal.remove();
                    this.toast('Emergency contact saved', 'success', 1800);
                    this.refreshSettingsPanels();
                } catch (error) {
                    this.toast(error.message || 'Failed to save contact', 'error', 2200);
                }
            }
        });

        document.body.appendChild(modal);
    }

    renderSettingsCard() {
        const needsPermissionButton = this.motionPermissionRequired && this.settings.motionPermission !== 'granted';
        const permissionLabel = !this.motionPermissionRequired
            ? 'Not required on this device'
            : this.settings.motionPermission === 'granted'
                ? 'Granted'
                : this.settings.motionPermission === 'denied'
                    ? 'Denied'
                    : 'Not granted';
        const queueStats = this.incidentQueue.getStats();
        const queueStatusLabel = queueStats.flushing
            ? 'Flushing now...'
            : queueStats.pending > 0
                ? `${queueStats.pending} pending incident(s)`
                : 'Queue empty';
        const latestAuditLabel = this.getLatestAuditSummary();
        const autoEscalationLabel = this.settings.autoEscalationEnabled
            ? `Tier 2 @ ${this.settings.autoEscalateTier1AfterSec}s • Tier 3 @ ${this.settings.autoEscalateTier2AfterSec}s`
            : 'Disabled (manual escalation only)';

        return `
            <div class="ballistic-glass p-4">
                <h3 class="text-sm font-mono text-zinc-400 mb-4 uppercase tracking-wider">ðŸš¨ Emergency SOS</h3>

                <div class="space-y-3">
                    <label class="flex items-center justify-between p-3 bg-void-800/70 rounded border border-void-700">
                        <span class="text-sm text-zinc-200">Shake to activate</span>
                        <input type="checkbox" data-sos-toggle-shake ${this.settings.shakeEnabled ? 'checked' : ''} class="w-5 h-5 accent-signal-emerald">
                    </label>

                    <label class="flex items-center justify-between p-3 bg-void-800/70 rounded border border-void-700">
                        <span class="text-sm text-zinc-200">Show floating SOS button</span>
                        <input type="checkbox" data-sos-toggle-button ${this.settings.buttonEnabled ? 'checked' : ''} class="w-5 h-5 accent-signal-emerald">
                    </label>

                    <div class="p-3 bg-void-800/70 rounded border border-void-700">
                        <div class="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1">Shake Permission</div>
                        <div class="text-sm ${this.settings.motionPermission === 'granted' ? 'text-signal-emerald' : 'text-signal-amber'}">${permissionLabel}</div>
                        ${needsPermissionButton ? `
                            <button type="button" data-sos-grant-shake class="mt-3 w-full py-2 bg-signal-crimson text-white font-bold rounded hover:bg-red-500">
                                Enable Shake Gesture (iOS)
                            </button>
                        ` : ''}
                    </div>

                    <div class="p-3 bg-void-800/70 rounded border border-void-700">
                        <div class="flex items-center justify-between mb-2">
                            <div class="text-xs font-mono text-zinc-400 uppercase tracking-wider">Emergency Contacts</div>
                            <div class="text-[10px] font-mono text-zinc-500">${this.contacts.contacts.length}/5</div>
                        </div>
                        <div class="space-y-2 mb-3">
                            ${this.contacts.contacts.length > 0
                ? this.contacts.contacts.map((contact, index) => `
                                      <div class="flex items-center justify-between bg-void-900 border border-void-700 rounded px-2 py-2">
                                          <div>
                                              <div class="text-sm text-white font-semibold">${contact.name}</div>
                                              <div class="text-[11px] text-zinc-500">${contact.phone || contact.email}</div>
                                          </div>
                                          <button type="button" data-sos-remove-contact="${index}" class="text-signal-crimson text-xs font-mono px-2 py-1 border border-signal-crimson/40 rounded hover:bg-signal-crimson/10">
                                              REMOVE
                                          </button>
                                      </div>
                                  `).join('')
                : `<div class="text-xs text-zinc-500 py-2">No emergency contacts configured yet.</div>`
            }
                        </div>
                        <button type="button" data-sos-add-contact class="w-full py-2 bg-signal-emerald text-black font-bold rounded hover:bg-emerald-400">
                            + Add Contact
                        </button>
                    </div>

                    <div class="p-3 bg-void-800/70 rounded border border-void-700">
                        <div class="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1">Incident Queue</div>
                        <div class="text-sm ${queueStats.pending > 0 ? 'text-signal-amber' : 'text-signal-emerald'}">${queueStatusLabel}</div>
                        <div class="text-[11px] text-zinc-500 mt-1">Audit: ${latestAuditLabel}</div>
                    </div>

                    <div class="p-3 bg-void-800/70 rounded border border-void-700">
                        <div class="flex items-center justify-between mb-2">
                            <div class="text-xs font-mono text-zinc-400 uppercase tracking-wider">Auto Escalation</div>
                            <label class="flex items-center gap-2 text-[11px] text-zinc-300">
                                <span>Enabled</span>
                                <input type="checkbox" data-sos-toggle-auto-escalation ${this.settings.autoEscalationEnabled ? 'checked' : ''} class="w-4 h-4 accent-signal-amber">
                            </label>
                        </div>
                        <div class="text-[11px] text-zinc-500 mb-2">${autoEscalationLabel}</div>
                        <div class="grid grid-cols-2 gap-2">
                            <label class="bg-void-900 border border-void-700 rounded px-2 py-2">
                                <div class="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">Tier 2 After</div>
                                <input
                                    type="number"
                                    min="15"
                                    max="900"
                                    step="5"
                                    data-sos-tier1-threshold
                                    value="${this.settings.autoEscalateTier1AfterSec}"
                                    ${this.settings.autoEscalationEnabled ? '' : 'disabled'}
                                    class="w-full bg-void-950 border border-void-700 rounded px-2 py-1 text-sm text-zinc-200 disabled:opacity-50"
                                >
                            </label>
                            <label class="bg-void-900 border border-void-700 rounded px-2 py-2">
                                <div class="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">Tier 3 After</div>
                                <input
                                    type="number"
                                    min="15"
                                    max="900"
                                    step="5"
                                    data-sos-tier2-threshold
                                    value="${this.settings.autoEscalateTier2AfterSec}"
                                    ${this.settings.autoEscalationEnabled ? '' : 'disabled'}
                                    class="w-full bg-void-950 border border-void-700 rounded px-2 py-1 text-sm text-zinc-200 disabled:opacity-50"
                                >
                            </label>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-2">
                        <button type="button" data-sos-test class="py-2 bg-void-800 border border-void-700 text-zinc-300 rounded text-xs font-mono hover:bg-void-700">
                            Test SOS
                        </button>
                        <button type="button" data-sos-open-phrases class="py-2 bg-void-800 border border-void-700 text-zinc-300 rounded text-xs font-mono hover:bg-void-700">
                            Phrases Card
                        </button>
                    </div>

                    <div class="grid grid-cols-2 gap-2">
                        <button type="button" data-sos-run-drill class="py-2 bg-void-800 border border-void-700 text-zinc-300 rounded text-[10px] font-mono hover:bg-void-700">
                            Tamper Drill
                        </button>
                        <button type="button" data-sos-flush-queue class="py-2 bg-void-800 border border-void-700 text-zinc-300 rounded text-[10px] font-mono hover:bg-void-700">
                            Flush Queue
                        </button>
                        <button type="button" data-sos-open-audit class="py-2 bg-void-800 border border-void-700 text-zinc-300 rounded text-[10px] font-mono hover:bg-void-700">
                            Audit Log
                        </button>
                        <button type="button" data-sos-copy-snapshot class="py-2 bg-void-800 border border-void-700 text-zinc-300 rounded text-[10px] font-mono hover:bg-void-700">
                            Copy Signed Snapshot
                        </button>
                        <button type="button" data-sos-export-incident class="py-2 bg-void-800 border border-void-700 text-zinc-300 rounded text-[10px] font-mono hover:bg-void-700">
                            Export Incident
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    attachSettingsHandlers(root = document) {
        const bindOnce = (selector, handler) => {
            root.querySelectorAll(selector).forEach((element) => {
                if (element.dataset.sosBound === '1') return;
                element.dataset.sosBound = '1';
                element.addEventListener('click', handler);
            });
        };

        root.querySelectorAll('[data-sos-toggle-shake]').forEach((element) => {
            if (element.dataset.sosBound === '1') return;
            element.dataset.sosBound = '1';
            element.addEventListener('change', (event) => {
                this.toggleShake(event.target.checked);
            });
        });

        root.querySelectorAll('[data-sos-toggle-button]').forEach((element) => {
            if (element.dataset.sosBound === '1') return;
            element.dataset.sosBound = '1';
            element.addEventListener('change', (event) => {
                this.toggleButton(event.target.checked);
            });
        });

        root.querySelectorAll('[data-sos-toggle-auto-escalation]').forEach((element) => {
            if (element.dataset.sosBound === '1') return;
            element.dataset.sosBound = '1';
            element.addEventListener('change', (event) => {
                this.updateAutoEscalationSettings({
                    autoEscalationEnabled: !!event.target.checked
                });
            });
        });

        const bindEscalationThreshold = (selector, key) => {
            root.querySelectorAll(selector).forEach((element) => {
                if (element.dataset.sosBound === '1') return;
                element.dataset.sosBound = '1';

                const commitValue = () => {
                    this.updateAutoEscalationSettings({
                        [key]: Number(element.value)
                    });
                    element.value = String(this.settings[key]);
                };

                element.addEventListener('change', commitValue);
                element.addEventListener('blur', commitValue);
                element.addEventListener('keydown', (event) => {
                    if (event.key !== 'Enter') return;
                    event.preventDefault();
                    commitValue();
                });
            });
        };

        bindEscalationThreshold('[data-sos-tier1-threshold]', 'autoEscalateTier1AfterSec');
        bindEscalationThreshold('[data-sos-tier2-threshold]', 'autoEscalateTier2AfterSec');

        bindOnce('[data-sos-grant-shake]', async () => {
            await this.requestShakePermission(true);
        });

        bindOnce('[data-sos-add-contact]', () => {
            this.showAddContactForm();
        });

        bindOnce('[data-sos-test]', () => {
            this.quickActivate('test');
        });

        bindOnce('[data-sos-open-phrases]', () => {
            this.tier2_ShowPhrases();
        });

        bindOnce('[data-sos-run-drill]', async () => {
            await this.runTamperDrill();
        });

        bindOnce('[data-sos-flush-queue]', async () => {
            const result = await this.flushIncidentQueue(true);
            const failedCount = Number(result?.failed || 0);
            const succeededCount = Number(result?.succeeded || 0);
            if (result?.skipped) {
                this.toast(`Queue flush skipped: ${result.reason || 'unknown'}`, 'warning', 1800);
            } else if (failedCount > 0) {
                this.toast(`Queue flush partial: ${succeededCount} sent, ${failedCount} failed`, 'warning', 2400);
            } else {
                this.toast(`Queue flush completed: ${succeededCount} sent`, 'success', 1800);
            }
            this.refreshSettingsPanels();
        });

        bindOnce('[data-sos-open-audit]', () => {
            this.showAuditTimelineModal();
        });

        bindOnce('[data-sos-copy-snapshot]', async () => {
            await this.copySignedAuditSnapshot();
        });

        bindOnce('[data-sos-export-incident]', async () => {
            await this.exportIncidentPackage();
        });

        root.querySelectorAll('[data-sos-remove-contact]').forEach((element) => {
            if (element.dataset.sosBound === '1') return;
            element.dataset.sosBound = '1';
            element.addEventListener('click', () => {
                const index = Number(element.getAttribute('data-sos-remove-contact'));
                this.contacts.removeContact(index);
                this.refreshSettingsPanels();
                this.toast('Contact removed', 'info', 1200);
            });
        });
    }

    refreshSettingsPanels() {
        document.querySelectorAll('.js-sos-settings-card').forEach((container) => {
            container.innerHTML = this.renderSettingsCard();
            this.attachSettingsHandlers(container);
        });
    }
}

let singleton = null;

export function initEmergencySOS(options = {}) {
    if (singleton) {
        singleton.refreshWidget();
        singleton.refreshSettingsPanels();
        return singleton;
    }

    singleton = new EmergencySOS(options);
    singleton.init();

    window.emergencySOS = singleton;
    window.emergencyContacts = singleton.contacts;
    window.renderEmergencySOSSettingsCard = () => singleton.renderSettingsCard();
    window.attachEmergencySOSSettingsHandlers = (root) => singleton.attachSettingsHandlers(root || document);
    window.refreshEmergencySOSWidget = () => singleton.refreshWidget();
    window.requestSOSShakePermission = () => singleton.requestShakePermission(true);

    console.log('[SOS] Emergency SOS module initialized');
    return singleton;
}

export {
    EmergencySOS,
    EmergencyContacts,
    LocationSharing,
    SOSIncidentQueueManager,
    SOS_EMERGENCY_PHRASES
};
