// Extracted from app.js: defense threat-matrix runtime block (compatibility-first).

// ---------------------------------------------------------------
// VIEW: DEFENSE MODULE - THREAT MATRIX
// ---------------------------------------------------------------

// THREAT DATABASE (Freemium fallback for Basic, full data from Ultimate pack)
const defenseModulePreviewData = window.ALIDADE_MODULE_PREVIEWS || {};
const BASIC_THREAT_PREVIEW = defenseModulePreviewData.BASIC_THREAT_PREVIEW || [];

const BASIC_DEFENSE_OPEN_THREAT_IDS = new Set(['monkey_snake_ambush', 'orange_juice_roulette', 'the_henna_grab']);
const DEFENSE_LOGISTICS_LOCKED_IDS = new Set(['insertion', 'base', 'cash']);

let THREAT_DATA = BASIC_THREAT_PREVIEW;

let currentThreatView = 'grid'; // 'grid' or 'detail'
let selectedThreat = null;
let currentThreatFilter = 'all';
let defenseContextListenerBound = false;
let defenseLastLiveRiskSignature = '';
// ? PRIORITY 3: Load saved defense tab state
const defenseState = appState.getModule('defense');
let currentDefenseTab = defenseState.currentTab || 'threats'; // 'threats', 'logistics', 'legal'

function resolveDefenseVectorContext() {
    if (!window.contextEngine || typeof window.contextEngine.getContext !== 'function') {
        return null;
    }
    try {
        return window.contextEngine.getContext('vector');
    } catch (_error) {
        return null;
    }
}

function resolveDefenseRiskLevel(score = 0, confidence = 0) {
    const composite = Number(score || 0) * Number(confidence || 0);
    if (composite >= 0.75) return 'HIGH';
    if (composite >= 0.5) return 'MEDIUM';
    return 'LOW';
}

function resolveDefenseRiskCategory(zone = {}) {
    const label = String(zone.areaName || '').toLowerCase();
    if (label.includes('jemaa')) return 'jemaa';
    if (label.includes('souk')) return 'souk';
    if (label.includes('transport') || label.includes('airport') || label.includes('taxi')) return 'transport';
    return 'streets';
}

function resolveDefenseLiveRiskSnapshot() {
    const vectorContext = resolveDefenseVectorContext() || {};
    const riskZones = Array.isArray(vectorContext.riskZones) ? vectorContext.riskZones : [];
    const criticalPoints = Array.isArray(vectorContext.criticalPoints) ? vectorContext.criticalPoints : [];
    const topRiskZone = riskZones[0] || null;
    const nearestCriticalPoint = criticalPoints[0] || null;
    const contextSession = window.contextEngine?.context?.sessionData || null;

    return {
        dangerLevel: String(window.contextEngine?.getCurrentDangerLevel?.() || 'low').toUpperCase(),
        riskZones,
        criticalPoints,
        topRiskZone,
        nearestCriticalPoint,
        baselineIntel: vectorContext.baselineIntel || null,
        contextCache: vectorContext.contextCache || null,
        contextSession
    };
}

function resolveDefenseLiveRiskSignature(snapshot = null) {
    const safeSnapshot = snapshot || resolveDefenseLiveRiskSnapshot();
    const zones = Array.isArray(safeSnapshot.riskZones) ? safeSnapshot.riskZones : [];
    if (!zones.length) {
        return `none:${safeSnapshot.dangerLevel || 'LOW'}`;
    }
    return zones
        .map((zone) => `${zone.id || zone.areaName}:${Math.round((zone.distance || 0) / 25)}:${resolveDefenseRiskLevel(zone.baselineScore, zone.confidence)}`)
        .join('|');
}

function buildDefenseBaselineZoneThreat(zone = {}, index = 0) {
    const areaName = String(zone.areaName || `Zone ${index + 1}`);
    const riskLevel = resolveDefenseRiskLevel(zone.baselineScore, zone.confidence);
    const threatTypes = Array.isArray(zone.threatTypes) ? zone.threatTypes : [];
    const threatList = threatTypes.length > 0 ? threatTypes.join(', ') : 'general scam pressure';
    const distanceMeters = typeof zone.distance === 'number' ? Math.max(0, Math.round(zone.distance)) : null;
    const isInterpolated = zone.source === 'baseline_risk_zone_interpolated' || Boolean(zone.interpolation);

    return {
        id: `baseline_zone_${zone.id || index}`,
        source: isInterpolated ? 'baseline_zone_interpolated' : 'baseline_zone',
        title: `${isInterpolated ? 'PERIMETER ALERT' : 'LIVE ZONE'}: ${areaName.toUpperCase()}`,
        risk: riskLevel,
        loss: distanceMeters !== null ? `${distanceMeters}M` : (isInterpolated ? 'NEAR ZONE' : 'IN ZONE'),
        category: resolveDefenseRiskCategory(zone),
        description: isInterpolated
            ? `Risk perimeter is close. Likely threat vectors: ${threatList}. You are near the active zone edge.`
            : `Active baseline risk zone detected. Main threat vectors: ${threatList}.`,
        counter_measure: isInterpolated
            ? 'Adjust route before entering the hot zone. Stay in visible lanes and avoid static interactions.'
            : 'Keep valuables concealed, stay in busier lanes, and avoid prolonged standstill conversations.',
        verbal_nuke: null
    };
}

function resolveDefenseBaselineThreatCards(filter = 'all') {
    const snapshot = resolveDefenseLiveRiskSnapshot();
    const zones = Array.isArray(snapshot.riskZones) ? snapshot.riskZones : [];
    const normalizedFilter = String(filter || 'all').toLowerCase();

    const cards = zones
        .slice(0, 4)
        .map((zone, index) => buildDefenseBaselineZoneThreat(zone, index));

    if (normalizedFilter === 'all') {
        return cards;
    }
    return cards.filter((card) => card.category === normalizedFilter);
}

function renderDefenseLiveRiskPanelContent() {
    const snapshot = resolveDefenseLiveRiskSnapshot();
    const zoneCount = snapshot.riskZones.length;
    const dangerLevel = snapshot.dangerLevel || 'LOW';
    const topZone = snapshot.topRiskZone;
    const nearestPoint = snapshot.nearestCriticalPoint;
    const nearestLabel = nearestPoint
        ? `${nearestPoint.name} (${typeof nearestPoint.distance === 'number' ? `${Math.round(nearestPoint.distance)}m` : '--'})`
        : 'No support point in range';
    const topZoneLabel = topZone
        ? `${topZone.areaName} (${resolveDefenseRiskLevel(topZone.baselineScore, topZone.confidence)})`
        : 'No active zone';
    const datasetVersion = snapshot.baselineIntel?.datasetVersion || 'n/a';
    const integrityStatus = String(snapshot.baselineIntel?.integrityStatus || 'unknown').toLowerCase();
    const validationWarningCount = Number(snapshot.baselineIntel?.validationWarningCount || 0);
    const checksumMode = snapshot.baselineIntel?.checksumMode || 'n/a';
    const contextCache = snapshot.contextCache || {};
    const restoredFromCache = contextCache.restoredFromCache === true;
    const cacheAgeMs = Number(snapshot.contextSession?.cachedSnapshotAgeMs);
    const cacheAgeMinutes = Number.isFinite(cacheAgeMs) ? Math.max(0, Math.round(cacheAgeMs / 60000)) : null;
    const contextSourceLabel = restoredFromCache
        ? `CACHE${cacheAgeMinutes !== null ? ` (${cacheAgeMinutes}m)` : ''}`
        : 'LIVE GPS';
    const riskSignalMode = topZone
        ? (topZone.source === 'baseline_risk_zone_interpolated' ? 'PERIMETER' : 'DIRECT')
        : 'CLEAR';
    const integrityUiMap = {
        verified: { label: 'VERIFIED', className: 'text-signal-emerald' },
        pending: { label: 'VERIFYING', className: 'text-signal-amber' },
        degraded: { label: 'DEGRADED', className: 'text-signal-crimson' },
        blocked: { label: 'BLOCKED', className: 'text-signal-crimson' },
        unavailable: { label: 'OFFLINE', className: 'text-zinc-400' },
        legacy_unverified: { label: 'LEGACY', className: 'text-signal-cyan' },
        unknown: { label: 'UNKNOWN', className: 'text-zinc-400' }
    };
    const integrityUi = integrityUiMap[integrityStatus] || integrityUiMap.unknown;
    const warningsLabel = validationWarningCount > 0 ? ` • WARN ${validationWarningCount}` : '';

    return `
        <div class="relative p-4 rounded-machined border border-signal-amber/30 bg-void-900/60 overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-r from-signal-amber/5 to-transparent pointer-events-none"></div>
            <div class="relative z-10">
                <div class="flex items-center justify-between mb-3">
                    <p class="text-[10px] text-signal-amber font-mono tracking-[0.18em] uppercase">Live Baseline Risk Intel</p>
                    <span class="text-[10px] px-2 py-0.5 rounded-[2px] border border-signal-amber/40 text-signal-amber font-mono">${dangerLevel}</span>
                </div>
                <div class="grid grid-cols-3 gap-2 mb-3">
                    <div class="p-2 rounded-[2px] bg-void-950/60 border border-void-800">
                        <p class="text-[9px] text-zinc-500 font-mono uppercase">Zones</p>
                        <p class="text-sm font-mono font-bold text-signal-amber">${zoneCount}</p>
                    </div>
                    <div class="p-2 rounded-[2px] bg-void-950/60 border border-void-800 col-span-2">
                        <p class="text-[9px] text-zinc-500 font-mono uppercase">Top Zone</p>
                        <p class="text-[11px] font-mono text-zinc-200 leading-tight">${topZoneLabel}</p>
                    </div>
                </div>
                <div class="space-y-1">
                    <p class="text-[9px] text-zinc-500 font-mono uppercase">Nearest Support</p>
                    <p class="text-xs font-mono text-zinc-300">${nearestLabel}</p>
                    <p class="text-[9px] text-void-500 font-mono uppercase pt-1">Dataset v${datasetVersion}</p>
                    <p class="text-[9px] text-zinc-500 font-mono uppercase">Intel Integrity</p>
                    <p class="text-[10px] font-mono ${integrityUi.className}">${integrityUi.label}${warningsLabel}</p>
                    <p class="text-[9px] text-void-500 font-mono uppercase">Checksum ${checksumMode}</p>
                    <p class="text-[9px] text-zinc-500 font-mono uppercase pt-1">Context Source</p>
                    <p class="text-[10px] font-mono ${restoredFromCache ? 'text-signal-amber' : 'text-signal-emerald'}">${contextSourceLabel}</p>
                    <p class="text-[9px] text-zinc-500 font-mono uppercase pt-1">Risk Signal</p>
                    <p class="text-[10px] font-mono ${riskSignalMode === 'PERIMETER' ? 'text-signal-amber' : 'text-zinc-300'}">${riskSignalMode}</p>
                </div>
            </div>
        </div>
    `;
}

function refreshDefenseLiveRiskPanel() {
    const container = document.getElementById('defense-live-risk-panel');
    if (!container) return null;
    const snapshot = resolveDefenseLiveRiskSnapshot();
    const signature = resolveDefenseLiveRiskSignature(snapshot);
    container.innerHTML = renderDefenseLiveRiskPanelContent();
    return signature;
}

function bindDefenseLiveRiskPanelUpdates() {
    if (defenseContextListenerBound) return;
    defenseContextListenerBound = true;

    window.addEventListener('contextUpdate', () => {
        const panelExists = Boolean(document.getElementById('defense-live-risk-panel'));
        if (!panelExists || currentDefenseTab !== 'threats' || currentThreatView !== 'grid') return;

        const latestSignature = refreshDefenseLiveRiskPanel();
        if (latestSignature && latestSignature !== defenseLastLiveRiskSignature) {
            defenseLastLiveRiskSignature = latestSignature;
            updateThreatFilter(currentThreatFilter || 'all');
        }
    });
}

function escapeDefenseHtml(value = '') {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function resolveGoldenRecordSosContacts() {
    let contacts = [];

    if (window.ALIDADE_GOLDEN_RECORD && Array.isArray(window.ALIDADE_GOLDEN_RECORD.sos_contacts_official)) {
        contacts = window.ALIDADE_GOLDEN_RECORD.sos_contacts_official;
    } else if (
        window.ALIDADE_GOLDEN_RECORD_UTILS &&
        typeof window.ALIDADE_GOLDEN_RECORD_UTILS.getGoldenRecordSection === 'function'
    ) {
        contacts = window.ALIDADE_GOLDEN_RECORD_UTILS.getGoldenRecordSection('sos_contacts_official', []);
    }

    if (!Array.isArray(contacts)) return [];

    return contacts
        .map((contact) => ({
            serviceName: String(contact?.service_name || '').trim(),
            dialLocal: String(contact?.dial_local || '').trim(),
            dialDisplay: String(contact?.dial_display || contact?.phone_e164 || contact?.dial_local || '').trim(),
            phoneE164: String(contact?.phone_e164 || '').trim(),
            trust: Number(contact?.aggregate_trust_score || 0),
            channel: String(contact?.channel || 'call').trim().toLowerCase()
        }))
        .filter((contact) => contact.channel === 'call' && (contact.phoneE164 || contact.dialLocal));
}

function resolveGoldenRecordCriticalPoints() {
    let points = [];

    if (window.ALIDADE_GOLDEN_RECORD && Array.isArray(window.ALIDADE_GOLDEN_RECORD.critical_points)) {
        points = window.ALIDADE_GOLDEN_RECORD.critical_points;
    } else if (
        window.ALIDADE_GOLDEN_RECORD_UTILS &&
        typeof window.ALIDADE_GOLDEN_RECORD_UTILS.getGoldenRecordSection === 'function'
    ) {
        points = window.ALIDADE_GOLDEN_RECORD_UTILS.getGoldenRecordSection('critical_points', []);
    }

    if (!Array.isArray(points)) return [];

    return points
        .map((point, index) => {
            const lat = Number(point?.lat);
            const lng = Number(point?.lng);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                return null;
            }
            return {
                id: String(point?.point_id || `critical_point_${index}`),
                type: String(point?.type || 'unknown').toLowerCase(),
                name: String(point?.name || 'Critical Point'),
                lat,
                lng,
                trust: Number(point?.aggregate_trust_score || 0),
                dialDisplay: String(point?.dial_display || point?.phone_e164 || point?.dial_local || '').trim()
            };
        })
        .filter(Boolean);
}

function resolveDefenseDistanceMeters(lat1, lng1, lat2, lng2) {
    if ([lat1, lng1, lat2, lng2].some((value) => typeof value !== 'number' || Number.isNaN(value))) {
        return Number.POSITIVE_INFINITY;
    }

    if (window.contextEngine && typeof window.contextEngine.getDistanceMeters === 'function') {
        return window.contextEngine.getDistanceMeters(lat1, lng1, lat2, lng2);
    }

    const toRad = (value) => (value * Math.PI) / 180;
    const earthRadiusMeters = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusMeters * c;
}

function resolveDefenseCurrentLocation() {
    const location = window.contextEngine?.context?.location;
    const lat = Number(location?.lat);
    const lng = Number(location?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return null;
    }
    return { lat, lng };
}

function resolveNearestPoliceCriticalPoint() {
    const vectorContext = resolveDefenseVectorContext() || {};
    const nearby = (Array.isArray(vectorContext.criticalPoints) ? vectorContext.criticalPoints : [])
        .map((point, index) => ({
            id: String(point?.id || `nearby_police_${index}`),
            type: String(point?.type || 'unknown').toLowerCase(),
            name: String(point?.name || 'Police point'),
            lat: Number(point?.lat),
            lng: Number(point?.lng),
            trust: Number(point?.trustScore || point?.trust || 0),
            distance: Number(point?.distance)
        }))
        .filter((point) => point.type === 'police' && Number.isFinite(point.lat) && Number.isFinite(point.lng));

    const allPolice = resolveGoldenRecordCriticalPoints()
        .filter((point) => point.type === 'police');

    const unique = new Map();
    [...nearby, ...allPolice].forEach((point) => {
        if (!unique.has(point.id)) {
            unique.set(point.id, point);
        }
    });

    const location = resolveDefenseCurrentLocation();
    const candidates = [...unique.values()].map((point) => {
        const distance = Number.isFinite(point.distance)
            ? point.distance
            : (location ? resolveDefenseDistanceMeters(location.lat, location.lng, point.lat, point.lng) : Number.POSITIVE_INFINITY);
        return {
            ...point,
            distance
        };
    });

    if (!candidates.length) return null;

    return candidates.sort((a, b) => {
        const distanceA = Number.isFinite(a.distance) ? a.distance : Number.POSITIVE_INFINITY;
        const distanceB = Number.isFinite(b.distance) ? b.distance : Number.POSITIVE_INFINITY;
        if (distanceA !== distanceB) return distanceA - distanceB;
        return (b.trust || 0) - (a.trust || 0);
    })[0];
}

function resolveDefenseDialHref(contact = null, fallbackNumber = '') {
    const rawValue = String(contact?.phoneE164 || contact?.dialLocal || fallbackNumber || '').trim();
    const normalized = rawValue.replace(/[^\d+]/g, '');
    return normalized ? `tel:${normalized}` : '#';
}

function resolveDefenseEmergencyContacts() {
    const contacts = resolveGoldenRecordSosContacts();
    const sorted = contacts.slice().sort((a, b) => (b.trust || 0) - (a.trust || 0));
    const pick = (predicate) => sorted.find((entry) => {
        try {
            return predicate(entry);
        } catch (_error) {
            return false;
        }
    }) || null;

    const policeEmergency = pick((entry) => entry.dialLocal === '19' || /police secours|dial 19/.test(entry.serviceName.toLowerCase()));
    const medicalEmergency = pick((entry) => entry.dialLocal === '141')
        || pick((entry) => /ambulance|samu|medical emergencies/.test(entry.serviceName.toLowerCase()))
        || pick((entry) => entry.dialLocal === '15' || entry.dialLocal === '150');
    const touristPoliceDirect = pick((entry) => /tourist police|brigade touristique/.test(entry.serviceName.toLowerCase()) && !!entry.phoneE164)
        || pick((entry) => /tourist police|brigade touristique/.test(entry.serviceName.toLowerCase()));
    const nearestPolicePoint = resolveNearestPoliceCriticalPoint();
    const defaultPoliceMapHref = 'https://www.google.com/maps/place/31%C2%B037%2733.1%22N+7%C2%B059%2720.6%22W/@31.6262573,-7.9898583,18.27z/data=!4m4!3m3!8m2!3d31.6258717!4d-7.9890634?entry=ttu&g_ep=EgoyMDI1MTIwOS4wIKXMDSoASAFQAw%3D%3D';
    const nearestPoliceDistance = Number.isFinite(nearestPolicePoint?.distance)
        ? Math.round(nearestPolicePoint.distance)
        : null;

    return {
        policeEmergency: {
            label: policeEmergency?.dialDisplay || '19',
            href: resolveDefenseDialHref(policeEmergency, '19'),
            serviceName: policeEmergency?.serviceName || 'Police emergency line'
        },
        medicalEmergency: {
            label: medicalEmergency?.dialDisplay || '150',
            href: resolveDefenseDialHref(medicalEmergency, '150'),
            serviceName: medicalEmergency?.serviceName || 'Medical emergency line'
        },
        touristPoliceDirect: {
            label: touristPoliceDirect?.dialDisplay || '+212524384601',
            href: resolveDefenseDialHref(touristPoliceDirect, '+212524384601'),
            serviceName: touristPoliceDirect?.serviceName || 'Tourist police direct line'
        },
        nearestPolicePoint: {
            name: nearestPolicePoint?.name || 'Police HQ',
            mapHref: nearestPolicePoint
                ? `https://www.google.com/maps?q=${nearestPolicePoint.lat},${nearestPolicePoint.lng}`
                : defaultPoliceMapHref,
            subtitle: nearestPoliceDistance !== null
                ? `Nearest station (${nearestPoliceDistance}m)`
                : 'Nearest station (map)'
        }
    };
}

function isDefenseFreemiumMode() {
    return normalizeTierTag(USER_TIER || window.USER_TIER || 'BASIC') !== 'ULTIMATE';
}

function isDefenseThreatLocked(threat) {
    if (threat && (threat.source === 'baseline_zone' || threat.source === 'baseline_zone_interpolated')) return false;
    if (!isDefenseFreemiumMode()) return false;
    if (!threat || !threat.id) return true;
    return !BASIC_DEFENSE_OPEN_THREAT_IDS.has(threat.id);
}

function isDefenseLogisticsIntelLocked(accordionId = '') {
    if (!isDefenseFreemiumMode()) return false;
    return DEFENSE_LOGISTICS_LOCKED_IDS.has(String(accordionId || '').trim().toLowerCase());
}

function openDefenseUpgrade(source = 'defense_lock', feature = 'DEFENSE') {
    const safeSource = String(source || 'defense_lock');
    const safeFeature = String(feature || 'DEFENSE').toUpperCase();
    trackLockImpression(safeFeature, safeSource);
    trackTierFunnelEvent('click_upgrade', { source: safeSource, feature: safeFeature });
    window.showUpgradeModal?.('ultimate', safeFeature);
}

function renderDefenseLockedLogisticsBody(accordionId = 'logistics') {
    const lockSource = `defense_logistics_${accordionId}_body`;
    return `
        <div class="p-5 bg-void-950/30">
            ${renderSoukClassifiedPreviewCard({
        source: lockSource,
        feature: 'DEFENSE',
        body: 'Strategic Logistics Intel is restricted to Operatives.',
        cta: 'UNLOCK LOGISTICS INTEL'
    })}
        </div>
    `;
}

function renderDefense() {
    if (ensureUltimateViewData('DEFENSE', renderDefense)) {
        return;
    }

    if (currentThreatView === 'detail' && selectedThreat && isDefenseThreatLocked(selectedThreat)) {
        currentThreatView = 'grid';
        selectedThreat = null;
    }

    if (currentThreatView === 'detail' && selectedThreat) {
        renderThreatDetail(selectedThreat);
    } else {
        renderDefenseHub();
    }
}

function renderDefenseHub() {
    const app = document.getElementById('app');

    const html = `
        <div class="min-h-screen bg-void-950 pb-6 relative">
                <!-- Grid Background -->
                <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiMzMzMiIGZpbGwtb3BhY2l0eT0iMC4yIi8+PC9zdmc+')] opacity-20 pointer-events-none"></div>

                <!-- HEADER with SOS Button -->
                <header class="sticky top-0 z-30 bg-void-950/80 backdrop-blur-md border-b border-void-800 p-4 shadow-lg shadow-void-950/50">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center gap-3">
                            <button onclick="window.alidadeApp.navigateTo('HOME')" class="group p-2.5 rounded-full bg-void-900 border border-void-700 hover:border-signal-amber/50 hover:bg-void-800 transition-all active:scale-90">
                                <span class="group-hover:-translate-x-0.5 transition-transform block">${ICONS.arrowLeft}</span>
                            </button>
                            <div>
                                <p class="text-[9px] text-signal-crimson/80 tracking-[0.2em] uppercase font-mono animate-pulse">${t('defense.header_subtitle')}</p>
                                <h1 class="font-heading text-xl font-black text-white tracking-wide uppercase drop-shadow-md">
                                    <span class="text-signal-crimson">///</span> ${t('defense.survival_command')}
                                </h1>
                            </div>
                        </div>
                        <button 
                            id="sos-btn" 
                            class="relative px-5 py-2 bg-signal-crimson hover:bg-red-600 border border-red-400 rounded-machined font-heading font-bold text-white text-xs tracking-wider transition-all active:scale-95 shadow-[0_0_15px_rgba(220,38,38,0.4)] overflow-hidden group"
                        >
                            <span class="relative z-10 flex items-center gap-2">
                                <span>!</span>
                                ${t('defense.sos_button')}
                            </span>
                            <div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        </button>
                    </div>

                    <!-- MAIN NAVIGATION -->
                    <div class="p-1 bg-void-900 rounded-lg flex gap-1 border border-void-800 shadow-inner">
                        <button class="defense-tab flex-1 py-2 rounded-[4px] text-[10px] font-mono font-bold transition-all whitespace-nowrap text-center relative overflow-hidden" data-tab="threats">
                            <span class="relative z-10 flex items-center justify-center gap-2">> ${t('defense.tabs.threats')}</span>
                        </button>
                        <button class="defense-tab flex-1 py-2 rounded-[4px] text-[10px] font-mono font-bold transition-all whitespace-nowrap text-center relative overflow-hidden" data-tab="logistics">
                            <span class="relative z-10 flex items-center justify-center gap-2">> ${t('defense.tabs.logistics')}</span>
                        </button>
                        <button class="defense-tab flex-1 py-2 rounded-[4px] text-[10px] font-mono font-bold transition-all whitespace-nowrap text-center relative overflow-hidden" data-tab="legal">
                            <span class="relative z-10 flex items-center justify-center gap-2">> ${t('defense.tabs.legal')}</span>
                        </button>
                        <button onclick="window.alidadeApp.navigateTo('TRANSPORT')" class="flex-1 py-2 rounded-[4px] text-[10px] font-mono font-bold text-zinc-500 hover:text-zinc-300 hover:bg-void-800/50 transition-all whitespace-nowrap text-center relative overflow-hidden">
                            <span class="relative z-10 flex items-center justify-center gap-2">> TRANSPORT</span>
                        </button>
                    </div>
                </header>

                <!-- TAB CONTENT CONTAINER -->
                <div id="defense-content" class="px-4 pt-6 pb-24 relative z-10">
                    <!-- Rendered by JS -->
                </div>
            </div>
        `;

    app.innerHTML = html;
    switchDefenseTab(currentDefenseTab);
    attachDefenseTabListeners();
}

function attachDefenseTabListeners() {
    // Tab switching
    document.querySelectorAll('.defense-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            switchDefenseTab(tabName);
        });
    });

    // SOS Button
    const sosBtn = document.getElementById('sos-btn');
    if (sosBtn) {
        sosBtn.addEventListener('click', () => {
            const choice = confirm('EMERGENCY SOS\n\nCall Police (19) or Ambulance (15)?');
            if (choice) {
                window.location.href = 'tel:19';
            } else {
                window.location.href = 'tel:15';
            }
        });
    }
}

function switchDefenseTab(tabName) {
    currentDefenseTab = tabName;
    appState.setModule('defense', { currentTab: tabName });

    // Update tab button styles
    document.querySelectorAll('.defense-tab').forEach(btn => {
        // Clear any old indicators first
        const indicator = btn.querySelector('.tab-indicator');
        if (indicator) indicator.remove();

        if (btn.getAttribute('data-tab') === tabName) {
            // Active State
            btn.classList.remove('text-zinc-500', 'hover:bg-void-800/50');
            btn.classList.add('bg-void-800', 'text-signal-amber', 'shadow-sm', 'border-void-700');
            btn.classList.add('border'); // Ensure border class is added
        } else {
            // Inactive State
            btn.classList.remove('bg-void-800', 'text-signal-amber', 'shadow-sm', 'border-void-700', 'border');
            btn.classList.add('text-zinc-500', 'hover:bg-void-800/50', 'hover:text-zinc-300');
        }
    });

    // Content rendering with transition
    const contentContainer = document.getElementById('defense-content');
    if (!contentContainer) return;

    // Fade out
    contentContainer.style.transition = 'opacity 0.2s ease-out, transform 0.2s ease-out';
    contentContainer.style.opacity = '0';
    contentContainer.style.transform = 'translateY(4px)';

    setTimeout(() => {
        if (tabName === 'threats') {
            contentContainer.innerHTML = renderThreatsTabContent();
            // Ensure filters are reset or initialized
            updateThreatFilter('all');
        } else if (tabName === 'logistics') {
            contentContainer.innerHTML = renderLogisticsTabContent();
        } else if (tabName === 'legal') {
            contentContainer.innerHTML = renderLegalTabContent();
        }

        // Trigger reflow
        void contentContainer.offsetWidth;

        // Fade in
        contentContainer.style.opacity = '1';
        contentContainer.style.transform = 'translateY(0)';

        // Attach listeners
        if (tabName === 'threats') attachThreatsTabListeners();
        if (tabName === 'logistics') attachAccordionListeners();
    }, 200);
}

// ---------------------------------------------------------------
// TAB 1: THREATS (Existing Scam Matrix)
// ---------------------------------------------------------------

function renderThreatsTabContent() {
    const showThreatTransportShortcut = false;
    return `
            <div class="mb-5 flex items-center gap-3 opacity-60">
                <div class="h-[1px] flex-1 bg-void-800"></div>
                <p class="text-[9px] text-zinc-500 font-mono italic tracking-widest uppercase text-center">
                    "Psychological Armor // Anti-Scam Database"
                </p>
                <div class="h-[1px] flex-1 bg-void-800"></div>
            </div>

            <div id="defense-live-risk-panel" class="mb-4">
                ${renderDefenseLiveRiskPanelContent()}
            </div>

            <!-- Filter Tabs -->
            <div class="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar px-1">
                <button class="threat-filter px-5 py-2 rounded-machined text-[10px] font-mono font-bold transition-all whitespace-nowrap border" data-filter="all">ALL SECTORS</button>
                <button class="threat-filter px-5 py-2 rounded-machined text-[10px] font-mono font-bold transition-all whitespace-nowrap border" data-filter="jemaa">JEMAA</button>
                <button class="threat-filter px-5 py-2 rounded-machined text-[10px] font-mono font-bold transition-all whitespace-nowrap border" data-filter="restaurants">DINING</button>
                <button class="threat-filter px-5 py-2 rounded-machined text-[10px] font-mono font-bold transition-all whitespace-nowrap border" data-filter="souk">SOUK OPS</button>
                <button class="threat-filter px-5 py-2 rounded-machined text-[10px] font-mono font-bold transition-all whitespace-nowrap border" data-filter="streets">STREETS</button>
                <button class="threat-filter px-5 py-2 rounded-machined text-[10px] font-mono font-bold transition-all whitespace-nowrap border" data-filter="transport">TRANSPORT</button>
            </div>

            ${showThreatTransportShortcut ? `
            <!-- TRANSPORT SHIELD ACCESS -->
            <button onclick="window.alidadeApp.navigateTo('TRANSPORT')" class="group w-full p-1 mb-6 rounded-machined bg-gradient-to-r from-blue-600/20 to-void-900 border border-blue-500/30 hover:border-blue-400/60 shadow-[0_0_15px_rgba(37,99,235,0.1)] active:scale-[0.99] transition-all">
                <div class="flex items-center justify-between bg-void-950/50 p-4 rounded-machined">
                    <div class="flex items-center gap-4">
                        <div class="p-3 bg-blue-500/10 rounded-full text-blue-400 text-xl border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">*</div>
                        <div class="text-left space-y-1">
                            <h3 class="font-heading font-bold text-blue-100 text-sm tracking-wide">TRANSPORT SHIELD</h3>
                            <p class="text-[10px] text-blue-300/60 font-mono tracking-wider uppercase">Rental Protocol // Taxi Strategy</p>
                        </div>
                    </div>
                    <div class="text-blue-500/50 group-hover:text-blue-400 group-hover:translate-x-1 transition-all">
                        ${ICONS.arrowRight || '>'}
                    </div>
                </div>
            </button>
            ` : ''}

            <!-- Threat Cards Grid -->
            <div id="threat-grid" class="space-y-3">
                <!-- Rendered by JS -->
            </div>

            <!-- Gray Rock Footer -->
            <div class="mt-6 p-4 bg-void-900/80 rounded-[2px] border border-void-800">
                <p class="text-xs text-void-500 text-center font-mono italic">
                    [TACTIC] <strong class="text-zinc-300">Gray Rock Method</strong>: Be boring, uninteresting, unmemorable.
                </p>
            </div>
        `;
}

function attachThreatsTabListeners() {
    // Filter buttons
    document.querySelectorAll('.threat-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');
            updateThreatFilter(filter);
        });
    });

    defenseLastLiveRiskSignature = refreshDefenseLiveRiskPanel() || defenseLastLiveRiskSignature;
    bindDefenseLiveRiskPanelUpdates();
}

// ---------------------------------------------------------------
// TAB 2: LOGISTICS (Survival Kit - Accordions)
// ---------------------------------------------------------------

function renderLogisticsTabContent() {
    return `
            <div class="mb-5 flex items-center gap-3 opacity-60">
                <div class="h-[1px] flex-1 bg-void-800"></div>
                <p class="text-[9px] text-zinc-500 font-mono italic tracking-widest uppercase text-center">
                    "Field Manual // Survival Kit Intel"
                </p>
                <div class="h-[1px] flex-1 bg-void-800"></div>
            </div>

            <div class="space-y-4">
                <!-- ACCORDION 1: INSERTION -->
                <div class="accordion-item group border border-void-800 rounded-machined overflow-hidden bg-void-900/40 hover:border-void-700 transition-colors">
                    <button class="accordion-header w-full p-4 flex items-center justify-between text-left transition-all hover:bg-void-800/50 active:scale-[0.99]" data-accordion="insertion">
                        <div class="flex items-center gap-4">
                            <span class="text-xl filter grayscale group-hover:grayscale-0 transition-all">*</span>
                            <div>
                                <h3 class="font-heading font-bold text-white text-sm tracking-wide">INSERTION PROTOCOL</h3>
                                <p class="text-[10px] text-zinc-500 font-mono tracking-wider">ARRIVAL LOGISTICS</p>
                            </div>
                        </div>
                        <span class="accordion-icon text-zinc-600 group-hover:text-signal-amber transition-transform duration-300">?</span>
                    </button>
                    <div class="accordion-content hidden border-t border-void-800" id="accordion-insertion">
                        <div class="p-5 bg-void-950/30 space-y-4 text-sm">
                            <!-- Step 0 -->
                            <div class="p-4 bg-blue-900/10 border border-blue-500/20 border-l-[3px] border-l-blue-500 rounded-[2px] relative overflow-hidden">
                                <div class="absolute inset-0 bg-blue-500/5 pointer-events-none"></div>
                                <h4 class="font-bold text-blue-400 mb-1 text-xs uppercase tracking-wider">Step 0: Go Offline</h4>
                                <p class="text-zinc-400 text-xs">Lost your offline file? <a href="https://drive.google.com/file/d/10yFXAItmumggvM1DICqDYQVkhy3jUV84/view?usp=sharing" target="_blank" rel="noopener noreferrer" class="text-blue-400 underline decoration-dotted hover:text-blue-300 underline-offset-4">DOWNLOAD DEPLOYMENT KIT (PDF)</a></p>
                            </div>
                            <!-- Step 1 -->
                            <div class="p-4 bg-emerald-900/10 border border-emerald-500/20 border-l-[3px] border-l-signal-emerald rounded-[2px]">
                                <h4 class="font-bold text-emerald-400 mb-2 text-xs uppercase tracking-wider">Step 1: Currency Logistics</h4>
                                <p class="text-white font-bold mb-2 text-xs italic">"The FIRST Rule: Marrakech is a Cash Economy."</p>
                                <div class="space-y-1 text-zinc-400 text-xs font-mono">
                                    <p><span class="text-signal-crimson">[AVOID]:</span> Airport Exchange booths (+5% fees).</p>
                                    <p><span class="text-emerald-400">? ACTION:</span> Use ATM inside arrival hall.</p>
                                    <p><span class="text-signal-amber">[FUNDS]:</span> Withdraw 1000 - 1500 DH.</p>
                                    <p><span class="text-blue-400">[INTEL]:</span> Exchange rest at Hotel Ali or Al Barid Bank.</p>
                                </div>
                            </div>
                            <!-- Step 2 -->
                            <div class="p-4 bg-purple-900/10 border border-purple-500/20 border-l-[3px] border-l-purple-500 rounded-[2px]">
                                <h4 class="font-bold text-purple-400 mb-2 text-xs uppercase tracking-wider">Step 2: Comms (SIM Cards)</h4>
                                <div class="space-y-1 text-zinc-400 text-xs font-mono">
                                    <p><span class="text-signal-amber">[PRIMARY]:</span> Maroc Telecom (IAM). Best signal.</p>
                                    <p><span class="text-zinc-500">[ALT]:</span> Orange.</p>
                                    <p><span class="text-signal-crimson">[AVOID]:</span> Inwi (inside Medina).</p>
                                    <p><span class="text-emerald-400">[PROTOCOL]:</span> Buy at official store. Avoid street sellers.</p>
                                </div>
                            </div>
                            <!-- Step 3 -->
                            <div class="p-4 bg-void-800/30 border border-void-700 border-l-[3px] border-l-zinc-500 rounded-[2px]">
                                <h4 class="font-bold text-white mb-2 text-xs uppercase tracking-wider">Step 3: Transport Vector</h4>
                                <div class="space-y-3 text-zinc-400 text-xs">
                                    <p><span class="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded-[2px] border border-blue-500/20 font-mono mr-1">OPTION A</span> <strong>Taxi Kiosk.</strong> Pay at window. Get Receipt. Rates: Day ~70-80 DH, Night ~100-110 DH.</p>
                                    <p><span class="px-1.5 py-0.5 bg-signal-emerald/20 text-emerald-400 rounded-[2px] border border-signal-emerald/20 font-mono mr-1">OPTION B</span> <strong>Bus #19.</strong> 30 DH. HACK: Buy Return (50 DH, 14 days).</p>
                                    <p><span class="px-1.5 py-0.5 bg-signal-amber/20 text-signal-amber rounded-[2px] border border-signal-amber/20 font-mono mr-1">OPTION C</span> <strong>Private Transfer.</strong> 150-250 DH.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ACCORDION 2: BASE & DEPARTURE -->
                <div class="accordion-item group border border-void-800 rounded-machined overflow-hidden bg-void-900/40 hover:border-void-700 transition-colors">
                    <button class="accordion-header w-full p-4 flex items-center justify-between text-left transition-all hover:bg-void-800/50 active:scale-[0.99]" data-accordion="base">
                        <div class="flex items-center gap-4">
                            <span class="text-xl filter grayscale group-hover:grayscale-0 transition-all">*</span>
                            <div>
                                <h3 class="font-heading font-bold text-white text-sm tracking-wide">BASE & EXFIL</h3>
                                <p class="text-[10px] text-zinc-500 font-mono tracking-wider">IN/OUT STRATEGY</p>
                            </div>
                        </div>
                        <span class="accordion-icon text-zinc-600 group-hover:text-signal-amber transition-transform duration-300">?</span>
                    </button>
                    <div class="accordion-content hidden border-t border-void-800" id="accordion-base">
                        <div class="p-5 bg-void-950/30 space-y-4 text-sm">
                            <!-- Phase 2 -->
                            <div class="p-4 bg-emerald-900/10 border border-emerald-500/20 border-l-[3px] border-l-signal-emerald rounded-[2px]">
                                <h4 class="font-bold text-emerald-400 mb-2 text-xs uppercase tracking-wider">Phase 2: Establishing Base (30-Min Rule)</h4>
                                <div class="space-y-1 text-zinc-400 text-xs font-mono">
                                    <p><span class="text-blue-400">[MAPS]:</span> Drop pin at Riad door immediately.</p>
                                    <p><span class="text-purple-400">[COMMS]:</span> Test Wifi speed.</p>
                                    <p><span class="text-signal-amber">[UTILITY]:</span> Hot water/AC check immediately.</p>
                                    <p><span class="text-emerald-400">[RESET]:</span> Unpack essentials, power nap.</p>
                                </div>
                            </div>
                            <!-- Phase 3 -->
                            <div class="p-4 bg-red-900/10 border border-red-500/20 border-l-[3px] border-l-red-500 rounded-[2px]">
                                <h4 class="font-bold text-red-400 mb-2 text-xs uppercase tracking-wider">Phase 3: Exfiltration (Departure)</h4>
                                <div class="space-y-1 text-zinc-400 text-xs font-mono">
                                    <p><span class="text-signal-crimson">[RULE] PAPER PASS:</span> Digital passes often <strong class="text-white">REJECTED</strong>. Print boarding pass (Ryanair/EasyJet mandatory).</p>
                                    <p><span class="text-signal-amber">? TIMING:</span> Arrive 3 Hours before. Multiple security layers.</p>
                                    <p><span class="text-emerald-400">[CASHOUT]:</span> Spend coins or convert BEFORE passport control.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ACCORDION 3: CASH OPS -->
                <div class="accordion-item group border border-void-800 rounded-machined overflow-hidden bg-void-900/40 hover:border-void-700 transition-colors">
                    <button class="accordion-header w-full p-4 flex items-center justify-between text-left transition-all hover:bg-void-800/50 active:scale-[0.99]" data-accordion="cash">
                        <div class="flex items-center gap-4">
                            <span class="text-xl filter grayscale group-hover:grayscale-0 transition-all">*</span>
                            <div>
                                <h3 class="font-heading font-bold text-white text-sm tracking-wide">CASH OPERATIONS</h3>
                                <p class="text-[10px] text-zinc-500 font-mono tracking-wider">BANKING INTEL</p>
                            </div>
                        </div>
                        <span class="accordion-icon text-zinc-600 group-hover:text-signal-amber transition-transform duration-300">?</span>
                    </button>
                    <div class="accordion-content hidden border-t border-void-800" id="accordion-cash">
                        <div class="p-5 bg-void-950/30 space-y-4 text-sm">
                            <!-- Bank Hierarchy -->
                            <div class="p-4 bg-amber-900/10 border border-amber-500/20 border-l-[3px] border-l-signal-amber rounded-[2px]">
                                <h4 class="font-bold text-signal-amber mb-2 text-xs uppercase tracking-wider">The Bank Hierarchy:</h4>
                                <div class="space-y-1 text-zinc-400 text-xs font-mono">
                                    <p><span class="text-signal-amber">[TARGET]:</span> Al Barid Bank (Post Office). Yellow/Blue. Low fee.</p>
                                    <p><span class="text-zinc-500">[BACKUP]:</span> Attijariwafa. Flat fee (~35 MAD).</p>
                                    <p><span class="text-signal-crimson">[AVOID]:</span> Societe Generale / BMCI (High fees).</p>
                                </div>
                            </div>
                            <!-- Conversion Trick -->
                            <div class="p-3 bg-emerald-900/10 border border-emerald-500/20 border-l-[3px] border-l-signal-emerald rounded-[2px]">
                                <h4 class="font-bold text-emerald-400 mb-1 text-xs uppercase tracking-wider">The Conversion Trick:</h4>
                                <p class="text-zinc-400 text-xs">Always <strong class="text-white">DECLINE CONVERSION</strong> on screen. Save 10-15%.</p>
                            </div>
                            <!-- 200 DH Crisis -->
                            <div class="p-3 bg-red-900/10 border border-red-500/20 border-l-[3px] border-l-red-500 rounded-[2px]">
                                <h4 class="font-bold text-red-400 mb-1 text-xs uppercase tracking-wider">The 200 DH Crisis:</h4>
                                <p class="text-zinc-400 text-xs">Taxi/Shops have no change. Break notes at <strong class="text-white">BIM / Marjane / Carrefour</strong>.</p>
                            </div>
                            <!-- Cash Drought -->
                            <div class="p-3 bg-purple-900/10 border border-purple-500/20 border-l-[3px] border-l-purple-500 rounded-[2px]">
                                <h4 class="font-bold text-purple-400 mb-1 text-xs uppercase tracking-wider">Cash Drought:</h4>
                                <p class="text-zinc-400 text-xs">ATMs in Medina run out <strong class="text-red-400">Saturday Evening</strong>. Withdraw <strong class="text-emerald-400">Friday Morning</strong>.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ACCORDION 4: STREET LOGISTICS -->
                <div class="accordion-item group border border-void-800 rounded-machined overflow-hidden bg-void-900/40 hover:border-void-700 transition-colors">
                    <button class="accordion-header w-full p-4 flex items-center justify-between text-left transition-all hover:bg-void-800/50 active:scale-[0.99]" data-accordion="street">
                        <div class="flex items-center gap-4">
                            <span class="text-xl filter grayscale group-hover:grayscale-0 transition-all">*</span>
                            <div>
                                <h3 class="font-heading font-bold text-white text-sm tracking-wide">STREET LOGISTICS</h3>
                                <p class="text-[10px] text-zinc-500 font-mono tracking-wider">AMENITIES</p>
                            </div>
                        </div>
                        <span class="accordion-icon text-zinc-600 group-hover:text-signal-amber transition-transform duration-300">?</span>
                    </button>
                    <div class="accordion-content hidden border-t border-void-800" id="accordion-street">
                        <div class="p-5 bg-void-950/30 space-y-4 text-sm">
                            <!-- Toilets -->
                            <div class="p-4 bg-blue-900/10 border border-blue-500/20 border-l-[3px] border-l-blue-500 rounded-[2px]">
                                <h4 class="font-bold text-blue-400 mb-2 text-xs uppercase tracking-wider">Nature Calls (Toilets):</h4>
                                <div class="space-y-1 text-zinc-400 text-xs font-mono">
                                    <p><strong class="text-white">Medina:</strong> Café de France (Buy water).</p>
                                    <p><strong class="text-white">Gueliz:</strong> Carré Eden Mall (Basement, Cleanest/Free).</p>
                                    <p><strong class="text-white">Oasis:</strong> Cyber Park (Free).</p>
                                </div>
                            </div>
                            <!-- Dead Battery -->
                            <div class="p-4 bg-amber-900/10 border border-amber-500/20 border-l-[3px] border-l-signal-amber rounded-[2px]">
                                <h4 class="font-bold text-signal-amber mb-2 text-xs uppercase tracking-wider">Dead Battery / Signal:</h4>
                                <div class="space-y-1 text-zinc-400 text-xs font-mono">
                                    <p><strong class="text-white">Plugs:</strong> Starbucks (Carré Eden), Café des Épices.</p>
                                    <p><strong class="text-white">Wifi:</strong> Cyber Park (Free Open Air), McDonald's.</p>
                                </div>
                            </div>
                            <!-- Luggage -->
                            <div class="p-4 bg-purple-900/10 border border-purple-500/20 border-l-[3px] border-l-purple-500 rounded-[2px]">
                                <h4 class="font-bold text-purple-400 mb-2 text-xs uppercase tracking-wider">Luggage Drop-off:</h4>
                                <div class="space-y-1 text-zinc-400 text-xs font-mono">
                                    <p><strong class="text-white">CTM Station (Gueliz):</strong> Secure lockers.</p>
                                    <p><strong class="text-white">Supratours (Train Station).</strong></p>
                                    <p class="text-signal-crimson">TIP: Do not leave bags at random shops.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ACCORDION 5: TRANSPORT RULES -->
                <div class="accordion-item group border border-void-800 rounded-machined overflow-hidden bg-void-900/40 hover:border-void-700 transition-colors">
                    <button class="accordion-header w-full p-4 flex items-center justify-between text-left transition-all hover:bg-void-800/50 active:scale-[0.99]" data-accordion="transport">
                        <div class="flex items-center gap-4">
                            <span class="text-xl filter grayscale group-hover:grayscale-0 transition-all">*</span>
                            <div>
                                <h3 class="font-heading font-bold text-white text-sm tracking-wide">TRANSPORT RULES</h3>
                                <p class="text-[10px] text-zinc-500 font-mono tracking-wider">TAXI & APPS</p>
                            </div>
                        </div>
                        <span class="accordion-icon text-zinc-600 group-hover:text-signal-amber transition-transform duration-300">?</span>
                    </button>
                    <div class="accordion-content hidden border-t border-void-800" id="accordion-transport">
                        <div class="p-5 bg-void-950/30 space-y-4 text-sm">
                            <!-- Petit Taxi -->
                            <div class="p-4 bg-amber-900/10 border border-amber-500/20 border-l-[3px] border-l-signal-amber rounded-[2px]">
                                <h4 class="font-bold text-signal-amber mb-1 text-xs uppercase tracking-wider">Petit Taxi:</h4>
                                <p class="text-zinc-400 text-xs">"<strong class="text-white font-mono">Khdem Compteur</strong>" (Turn on meter). Min fare <strong class="text-emerald-400">7.5 DH</strong>.</p>
                            </div>
                            <!-- InDrive Dead Drops -->
                            <div class="p-4 bg-red-900/10 border border-red-500/20 border-l-[3px] border-l-red-500 rounded-[2px]">
                                <h4 class="font-bold text-red-400 mb-2 text-xs uppercase tracking-wider">InDrive Dead Drops (Safety):</h4>
                                <p class="text-white font-bold mb-2 text-xs">NEVER order to a taxi rank.</p>
                                <div class="space-y-1 text-zinc-400 text-xs font-mono">
                                    <p><strong class="text-white">Bab Laksour:</strong> Walk 100m away.</p>
                                    <p><strong class="text-white">Dar El Bacha:</strong> Side alley to Riad Laarous.</p>
                                    <p><strong class="text-white">Riad Laarous:</strong> Near Pharmacy/School.</p>
                                    <p><strong class="text-white">Bab Doukkala:</strong> Walk to Shell Station.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
}

function attachAccordionListeners() {
    document.querySelectorAll('.accordion-header').forEach(header => {
        const headerAccordionId = header.getAttribute('data-accordion');
        if (isDefenseLogisticsIntelLocked(headerAccordionId)) {
            const titleEl = header.querySelector('h3');
            if (titleEl && !titleEl.dataset.lockDecorated) {
                titleEl.dataset.lockDecorated = '1';
                titleEl.insertAdjacentHTML('beforeend', ' <span class="text-signal-amber text-xs font-mono">LOCK</span>');
            }
        }

        header.addEventListener('click', () => {
            const accordionId = header.getAttribute('data-accordion');
            const content = document.getElementById(`accordion-${accordionId}`);
            if (!content) return;
            const icon = header.querySelector('.accordion-icon');
            const isOpen = !content.classList.contains('hidden');

            // Close all accordions
            document.querySelectorAll('.accordion-content').forEach(c => c.classList.add('hidden'));
            document.querySelectorAll('.accordion-icon').forEach(i => {
                i.style.transform = 'rotate(0deg)';
            });

            // Open clicked one if it was closed
            if (!isOpen) {
                if (isDefenseLogisticsIntelLocked(accordionId)) {
                    trackLockImpression('DEFENSE', `defense_logistics_${accordionId}_preview`);
                    content.innerHTML = renderDefenseLockedLogisticsBody(accordionId);
                }
                content.classList.remove('hidden');
                if (icon) {
                    icon.style.transform = 'rotate(180deg)';
                }
            }
        });
    });
}

// ---------------------------------------------------------------
// TAB 3: LEGAL & SOS (Emergency)
// ---------------------------------------------------------------

function renderLegalTabContent() {
    const emergencyContacts = resolveDefenseEmergencyContacts();
    const medicalDialLabel = escapeDefenseHtml(emergencyContacts.medicalEmergency.label || '150');
    const policeDialLabel = escapeDefenseHtml(emergencyContacts.policeEmergency.label || '19');
    const touristDialLabel = escapeDefenseHtml(emergencyContacts.touristPoliceDirect.label || '+212524384601');
    const medicalServiceLabel = escapeDefenseHtml(emergencyContacts.medicalEmergency.serviceName || 'Medical emergency line');
    const policeServiceLabel = escapeDefenseHtml(emergencyContacts.policeEmergency.serviceName || 'Police emergency line');
    const touristServiceLabel = escapeDefenseHtml(emergencyContacts.touristPoliceDirect.serviceName || 'Tourist police direct line');
    const policeMapHref = escapeDefenseHtml(emergencyContacts.nearestPolicePoint.mapHref || '#');
    const policeMapName = escapeDefenseHtml(emergencyContacts.nearestPolicePoint.name || 'POLICE HQ');
    const policeMapSubtitle = escapeDefenseHtml(emergencyContacts.nearestPolicePoint.subtitle || 'NEAREST STATION (MAP)');

    return `
            <div class="mb-5 flex items-center gap-3 opacity-60">
                <div class="h-[1px] flex-1 bg-void-800"></div>
                <p class="text-[9px] text-zinc-500 font-mono italic tracking-widest uppercase text-center">
                    "Emergency Extraction // Legal Protocol"
                </p>
                <div class="h-[1px] flex-1 bg-void-800"></div>
            </div>

            <!-- EMERGENCY LINKS GRID -->
            <div class="p-1 bg-void-900/30 rounded-machined border border-red-900/30 mb-6 relative overflow-hidden">
                <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiMzMzMiIGZpbGwtb3BhY2l0eT0iMC4yIi8+PC9zdmc+')] opacity-50 pointer-events-none"></div>
                <div class="absolute top-0 right-0 p-3 opacity-20 text-red-500 text-4xl font-black pointer-events-none">SOS</div>
                
                <div class="p-4 relative z-10">
                    <h3 class="font-heading text-sm font-bold text-red-400 mb-4 flex items-center gap-2 tracking-wide">
                        <span class="animate-pulse">[!]</span> CRITICAL CONTACTS
                    </h3>
                    
                    <div class="grid grid-cols-1 gap-2">
                        <!-- POLICE -->
                        <a href="${policeMapHref}" 
                           target="_blank" 
                           rel="noopener noreferrer"
                           class="group flex items-center justify-between p-3 bg-blue-900/20 border border-blue-500/20 hover:border-blue-400/50 rounded-[4px] transition-all active:scale-[0.98]">
                            <div class="flex items-center gap-3">
                                <div class="p-2 bg-blue-500/10 rounded-full text-blue-400">*</div>
                                <div>
                                    <div class="text-blue-100 font-bold text-xs tracking-wide">${policeMapName}</div>
                                    <div class="text-[10px] text-blue-300/60 font-mono">${policeMapSubtitle}</div>
                                </div>
                            </div>
                            <span class="text-blue-500 group-hover:translate-x-1 transition-transform">></span>
                        </a>

                        <div class="grid grid-cols-2 gap-2">
                             <!-- AMBULANCE -->
                            <a href="${emergencyContacts.medicalEmergency.href}" 
                               class="group flex flex-col items-center justify-center gap-2 p-4 bg-red-900/20 border border-red-500/20 hover:border-red-400/50 rounded-[4px] transition-all active:scale-[0.98] text-center">
                                <div class="text-2xl mb-1">+</div>
                                <div class="text-red-100 font-bold text-xs tracking-wide">MEDICAL</div>
                                <div class="text-[10px] text-red-400 font-mono font-bold bg-red-500/10 px-2 py-0.5 rounded">DIAL ${medicalDialLabel}</div>
                                <div class="text-[9px] text-red-200/70 font-mono">${medicalServiceLabel}</div>
                            </a>

                            <!-- POLICE EMERGENCY -->
                            <a href="${emergencyContacts.policeEmergency.href}" 
                               class="group flex flex-col items-center justify-center gap-2 p-4 bg-amber-900/20 border border-amber-500/20 hover:border-amber-400/50 rounded-[4px] transition-all active:scale-[0.98] text-center">
                                <div class="text-2xl mb-1">!</div>
                                <div class="text-amber-100 font-bold text-xs tracking-wide">POLICE EMERGENCY</div>
                                <div class="text-[10px] text-amber-400 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded">DIAL ${policeDialLabel}</div>
                                <div class="text-[9px] text-amber-200/70 font-mono">${policeServiceLabel}</div>
                            </a>
                        </div>

                        <!-- TOURIST POLICE DIRECT -->
                        <a href="${emergencyContacts.touristPoliceDirect.href}"
                           class="group flex items-center justify-between p-3 bg-amber-900/20 border border-amber-500/20 hover:border-amber-400/50 rounded-[4px] transition-all active:scale-[0.98]">
                            <div class="flex items-center gap-3">
                                <div class="p-2 bg-amber-500/10 rounded-full text-amber-400">*</div>
                                <div>
                                    <div class="text-amber-100 font-bold text-xs tracking-wide">TOURIST POLICE DIRECT</div>
                                    <div class="text-[10px] text-amber-300/70 font-mono">${touristServiceLabel}</div>
                                </div>
                            </div>
                            <span class="text-[10px] text-amber-400 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded">CALL ${touristDialLabel}</span>
                        </a>
                         
                        <!-- EMBASSY -->
                          <a href="https://www.embassypages.com/morocco" 
                            target="_blank" 
                            rel="noopener noreferrer"
                           class="group flex items-center justify-between p-3 bg-void-800/40 border border-void-700 hover:border-purple-400/50 rounded-[4px] transition-all active:scale-[0.98] mt-1">
                            <div class="flex items-center gap-3">
                                <div class="p-2 bg-purple-500/10 rounded-full text-purple-400">*</div>
                                <div>
                                    <div class="text-zinc-200 font-bold text-xs tracking-wide">EMBASSY DIRECTORY</div>
                                    <div class="text-[10px] text-zinc-500 font-mono">FIND YOUR CONSULATE</div>
                                </div>
                            </div>
                            <span class="text-zinc-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-transform">></span>
                        </a>
                    </div>
                </div>
            </div>

            <!-- DISCLAIMER -->
             <div class="p-4 bg-void-900/30 border border-void-800 rounded-machined text-center">
                <p class="text-[10px] text-zinc-600 font-mono leading-relaxed">
                    DISCLAIMER: This app provides guidance only. In a life-threatening emergency, always contact local authorities directly. We are not responsible for third-party services.
                </p>
            </div>

            <!-- LEGAL EXTRACTION -->

        <div class="p-4 bg-void-900/20 border border-signal-amber/30 rounded-machined relative overflow-hidden">
            <div class="absolute top-0 right-0 p-2 opacity-10 text-signal-amber text-6xl font-black pointer-events-none select-none">!</div>

            <h3 class="font-heading text-sm font-bold text-signal-amber mb-4 flex items-center gap-2 tracking-wide relative z-10">
                LEGAL PROTOCOLS (THEFT & INSURANCE)
            </h3>

            <div class="p-3 bg-red-900/10 border border-red-500/30 rounded-[4px] mb-4 relative z-10">
                <p class="text-xs text-red-400 font-bold leading-relaxed">
                    <span class="mr-1">[!]</span> CONSTANT: Insurance requires "PV" (Proces-Verbal). A standard police receipt is null/void.
                </p>
            </div>

            <div class="space-y-2 text-xs relative z-10">
                <div class="p-3 bg-void-950/50 rounded-[4px] border-l-2 border-blue-500 flex gap-3">
                    <div class="text-blue-500 font-bold font-mono">01</div>
                    <div class="text-zinc-400">
                        <span class="text-blue-400 font-bold">LOCATE:</span> Go to <strong class="text-white">Brigade Touristique</strong> (Jemaa el-Fna, adj. Post Office).
                    </div>
                </div>

                <div class="p-3 bg-void-950/50 rounded-[4px] border-l-2 border-signal-amber flex gap-3">
                    <div class="text-signal-amber font-bold font-mono">02</div>
                    <div class="text-zinc-400">
                        <span class="text-signal-amber font-bold">ASSET:</span> Bring a translator (Guide/Riad Manager). Reports are Arabic-only.
                    </div>
                </div>

                <div class="p-3 bg-void-950/50 rounded-[4px] border-l-2 border-signal-emerald flex gap-3">
                    <div class="text-signal-emerald font-bold font-mono">03</div>
                    <div class="text-zinc-400">
                        <span class="text-signal-emerald font-bold">VERIFY:</span> Ensure report states "<strong class="text-white">Vol à l'arrache</strong>" (Snatch) or "<strong class="text-white">Vol avec violence</strong>". Simple "Loss" is <span class="text-red-400">UNINSURED</span>.
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ---------------------------------------------------------------
// LEGACY: renderThreatGrid (kept for backwards compatibility)
// ---------------------------------------------------------------

function renderThreatGrid() {
    // Redirect to new hub
    renderDefenseHub();
}

function renderThreatCards(threats) {
    const grid = document.getElementById('threat-grid');
    if (!grid) return;
    const threatById = new Map((Array.isArray(threats) ? threats : []).map((threat) => [threat.id, threat]));

    if (threats.length === 0) {
        grid.innerHTML = `
        <div class="text-center text-void-500 py-8 font-mono text-sm">
            No threats found in this category
        </div>
        `;
        return;
    }

    const hasLockedCards = isDefenseFreemiumMode() && threats.some((threat) => isDefenseThreatLocked(threat));
    if (hasLockedCards) {
        trackLockImpression('DEFENSE', 'defense_threats_grid');
    }

    grid.innerHTML = threats.map(threat => {
        const isHigh = threat.risk === 'HIGH';
        const riskTailwindColor = isHigh ? 'red' : 'amber';
        const lockedForBasic = isDefenseThreatLocked(threat);

        // Protocol 7 Card
        const borderClass = isHigh ? 'border-red-500/30 group-hover:border-red-500/60' : 'border-amber-500/30 group-hover:border-amber-500/60';
        const bgClass = isHigh ? 'bg-gradient-to-br from-red-900/10 to-transparent' : 'bg-gradient-to-br from-amber-900/10 to-transparent';
        const safeLoss = escapeHtml(threat.loss || '--');
        const lossMarkup = lockedForBasic
            ? `<span class="inline-flex items-center gap-1 text-zinc-300 bg-void-950/30 px-1.5 py-0.5 rounded-[2px] border border-void-800 select-none">
                    <span class="blur-[2.5px]">${safeLoss}</span>
                    <span class="text-[8px] text-signal-amber/90 tracking-wider uppercase">Classified</span>
               </span>`
            : `<span class="text-zinc-300 bg-void-950/30 px-1.5 py-0.5 rounded-[2px] border border-void-800">${safeLoss}</span>`;
        const intelCta = lockedForBasic
            ? `<button type="button" class="px-2 py-1 rounded-[2px] bg-signal-amber/20 border border-signal-amber/40 text-signal-amber text-[10px] font-mono font-bold tracking-wider uppercase shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                    UNLOCK INTEL
               </button>`
            : `<div class="flex items-center gap-1 text-${riskTailwindColor}-500 text-[10px] font-mono font-bold hover:translate-x-1 transition-transform opacity-60 group-hover:opacity-100">
                    <span>ACCESS INTEL</span> 
                    <span>></span>
               </div>`;

        return `
        <div
    class="threat-card group relative overflow-hidden rounded-machined border ${borderClass} ${bgClass} p-4 cursor-pointer transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] active:scale-[0.98]"
    data-threat-id="${threat.id}"
    data-threat-locked="${lockedForBasic ? '1' : '0'}"
        >
                    <!-- Tech Deco corners -->
                    <div class="absolute top-0 right-0 w-2 h-2 border-t border-r border-${riskTailwindColor}-500/40 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div class="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-${riskTailwindColor}-500/40 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <!--Scanline -->
                    <div class="absolute inset-0 bg-gradient-to-b from-transparent via-${riskTailwindColor}-500/5 to-transparent -translate-y-full group-hover:translate-y-full transition-transform duration-1000"></div>

                    <div class="relative z-10 flex items-start justify-between mb-3">
                        <h3 class="font-heading text-sm font-bold text-white flex-1 tracking-wide leading-tight group-hover:text-${riskTailwindColor}-400 transition-colors">${threat.title}</h3>
                        <span class="px-2 py-0.5 rounded-[2px] text-[9px] font-mono font-bold ${isHigh ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}">
                            ${threat.risk}
                        </span>
                    </div>
                    
                    <div class="relative z-10 flex items-end justify-between border-t border-void-800/50 pt-3 mt-1 group-hover:border-${riskTailwindColor}-500/20 transition-colors">
                        <div class="text-[10px] font-mono">
                            <span class="text-void-500 uppercase tracking-wider block mb-0.5">EST. LOSS</span>
                            ${lossMarkup}
                        </div>
                        ${intelCta}
                    </div>
                </div>
        `;
    }).join('');

    // Attach card click listeners
    document.querySelectorAll('.threat-card').forEach(card => {
        card.addEventListener('click', () => {
            const isLocked = card.getAttribute('data-threat-locked') === '1';
            if (isLocked) {
                const threatId = card.getAttribute('data-threat-id') || 'unknown';
                openDefenseUpgrade(`defense_threat_${threatId}_lock`, 'DEFENSE');
                return;
            }
            const threatId = card.getAttribute('data-threat-id');
            selectedThreat = threatById.get(threatId) || THREAT_DATA.find(t => t.id === threatId);
            currentThreatView = 'detail';
            renderDefense();
        });
    });
}

function renderThreatDetail(threat) {
    if (!threat) return;
    if (isDefenseThreatLocked(threat)) {
        openDefenseUpgrade(`defense_threat_${threat.id || 'unknown'}_detail`, 'DEFENSE');
        return;
    }

    const app = document.getElementById('app');
    // Keep deterministic color mapping: HIGH = red, MEDIUM = amber
    const isHigh = threat.risk === 'HIGH';
    const riskTailwindColor = isHigh ? 'red' : 'amber';

    // Check if audio exists
    const hasAudio = threat.verbal_nuke && threat.verbal_nuke.audio;

    const html = `
        <div class="min-h-screen bg-void-950 flex flex-col">
                <header class="sticky top-0 z-30 bg-void-950/90 backdrop-blur-md border-b border-${riskTailwindColor}-500/30 p-4 shadow-lg shadow-black/40">
                    <div class="flex items-center gap-3 mb-2">
                        <button id="back-to-grid" class="group p-2 rounded-full bg-void-900 border border-void-700 hover:border-${riskTailwindColor}-500/50 hover:bg-void-800 transition-all active:scale-95">
                            <span class="group-hover:-translate-x-0.5 transition-transform block">${ICONS.arrowLeft}</span>
                        </button>
                        <div class="flex flex-col">
                            <h1 class="font-heading text-lg font-bold text-white tracking-wide uppercase leading-none mb-1">${threat.title}</h1>
                            <div class="flex items-center gap-2">
                                <span class="px-2 py-0.5 rounded-[2px] text-[9px] font-mono font-bold border ${isHigh ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}">
                                    ${threat.risk} RISK
                                </span>
                                <span class="text-[10px] text-zinc-500 font-mono tracking-wide">EST. LOSS: ${threat.loss}</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div class="p-5 space-y-6 pb-24 overflow-y-auto">
                    <!-- TRAP SECTION -->
                    <section class="relative bg-void-900/40 border border-${riskTailwindColor}-500/30 rounded-machined p-5 overflow-hidden">
                         <div class="absolute top-0 right-0 p-2 opacity-10 text-${riskTailwindColor}-500 text-6xl font-black pointer-events-none select-none">!</div>
                        <div class="flex items-center gap-3 mb-3 relative z-10">
                            <div class="p-2 bg-${riskTailwindColor}-500/10 rounded-full border border-${riskTailwindColor}-500/20">
                                <span class="text-${riskTailwindColor}-500 text-lg">!</span>
                            </div>
                            <h2 class="font-heading text-sm font-bold text-${riskTailwindColor}-400 tracking-wider">THE TRAP</h2>
                        </div>
                        <p class="text-sm text-zinc-300 leading-relaxed whitespace-pre-line relative z-10">${threat.description}</p>
                    </section>

                    <!-- COUNTER MOVE -->
                    <section class="bg-emerald-900/10 border border-signal-emerald/30 rounded-machined p-5">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="p-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                <span class="text-emerald-400 text-lg">+</span>
                            </div>
                            <h2 class="font-heading text-sm font-bold text-emerald-400 tracking-wider">COUNTER-MOVE</h2>
                        </div>
                        <p class="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">${threat.counter_measure}</p>
                    </section>

                    ${threat.verbal_nuke && threat.verbal_nuke.phrase ? `
                    <!-- VERBAL NUKE -->
                    <section class="bg-amber-900/10 border border-signal-amber/30 rounded-machined p-5 relative overflow-hidden">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="p-2 bg-amber-500/10 rounded-full border border-amber-500/20">
                                <span class="text-signal-amber text-lg">#</span>
                            </div>
                            <h2 class="font-heading text-sm font-bold text-signal-amber tracking-wider">VERBAL NUKE</h2>
                        </div>
                        
                        <div class="bg-void-950/80 rounded-[4px] p-5 mb-4 border border-signal-amber/10 shadow-inner relative">
                            <!-- Tactical Deco -->
                             <div class="absolute top-2 right-2 flex gap-1">
                                <div class="w-1 h-1 bg-signal-amber rounded-full animate-pulse"></div>
                                <div class="w-1 h-1 bg-void-700 rounded-full"></div>
                             </div>

                            <p class="font-mono text-xl font-bold text-white mb-2 tracking-tight text-center">"${threat.verbal_nuke.phrase}"</p>
                            <p class="text-xs text-signal-amber font-mono mb-1 text-center uppercase tracking-widest opacity-80">${threat.verbal_nuke.phonetic}</p>
                            <div class="w-full h-[1px] bg-void-800 my-2"></div>
                            <p class="text-[10px] text-zinc-500 italic text-center uppercase tracking-wider">MEANING: ${threat.verbal_nuke.meaning}</p>
                        </div>

                        <button id="play-audio" 
                                data-audio="${hasAudio ? threat.verbal_nuke.audio : ''}"
                                class="group w-full py-4 ${hasAudio ? 'bg-signal-amber text-black hover:bg-amber-400' : 'bg-void-800 text-zinc-600 cursor-not-allowed'} border border-signal-amber/50 rounded-[4px] font-heading font-black text-xs tracking-widest transition-all active:scale-[0.98] shadow-[0_4px_15px_rgba(245,158,11,0.2)] flex items-center justify-center gap-3 relative overflow-hidden">
                            ${hasAudio ? '<div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>' : ''}
                            <span class="relative z-10 text-lg">></span>
                            <span class="relative z-10">${hasAudio ? 'DEPLOY AUDIO COUNTERMEASURE' : 'AUDIO UNAVAILABLE'}</span>
                        </button>
                    </section>
                    ` : ''}
                </div>
            </div>
        `;

    app.innerHTML = html;
    attachThreatDetailListeners();
}

function updateThreatFilter(filter) {
    currentThreatFilter = filter;

    // Update button states
    document.querySelectorAll('.threat-filter').forEach(btn => {
        if (btn.getAttribute('data-filter') === filter) {
            btn.classList.add('bg-signal-crimson/20', 'text-signal-crimson', 'border-signal-crimson', 'shadow-[0_0_10px_rgba(220,38,38,0.2)]');
            btn.classList.remove('bg-void-900/50', 'text-zinc-500', 'border-void-800');
        } else {
            btn.classList.remove('bg-signal-crimson/20', 'text-signal-crimson', 'border-signal-crimson', 'shadow-[0_0_10px_rgba(220,38,38,0.2)]');
            btn.classList.add('bg-void-900/50', 'text-zinc-500', 'border-void-800');
        }
    });

    // Filter and render threats
    const filtered = filter === 'all'
        ? THREAT_DATA
        : THREAT_DATA.filter(t => t.category === filter);

    const baselineThreatCards = resolveDefenseBaselineThreatCards(filter);
    renderThreatCards([...baselineThreatCards, ...filtered]);
}

function attachThreatGridListeners() {
    // SOS Button
    const sosBtn = document.getElementById('sos-btn');
    if (sosBtn) {
        sosBtn.addEventListener('click', () => {
            const choice = confirm('EMERGENCY SOS\n\nCall Police (19) or Ambulance (15)?');
            if (choice) {
                window.location.href = 'tel:19';
            } else {
                window.location.href = 'tel:15';
            }
        });
    }

    // Filter buttons
    document.querySelectorAll('.threat-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');
            updateThreatFilter(filter);
        });
    });
}

function attachThreatDetailListeners() {
    const backBtn = document.getElementById('back-to-grid');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            currentThreatView = 'grid';
            selectedThreat = null;
            renderDefense();
        });
    }

    const audioBtn = document.getElementById('play-audio');
    if (audioBtn) {
        audioBtn.addEventListener('click', () => {
            const audioSrc = audioBtn.getAttribute('data-audio');

            if (audioSrc) {
                const originalText = audioBtn.innerHTML;
                audioBtn.innerHTML = `<span>></span> <span>PLAYING...</span>`;
                audioBtn.classList.add('bg-white');

                const audio = new Audio(audioSrc);
                audio.play()
                    .then(() => {
                        setTimeout(() => {
                            audioBtn.innerHTML = originalText;
                            audioBtn.classList.remove('bg-white');
                        }, 1500);
                    })
                    .catch(err => {
                        console.error("Audio play failed:", err);
                        alert("Audio file not found: " + audioSrc);
                        audioBtn.innerHTML = originalText;
                        audioBtn.classList.remove('bg-white');
                    });
            }
        });
    }
}
