/**
 * ALIDADE Context Runtime
 * Extracted context/session runtime classes and hooks from app.js.
 */
(function registerAlidadeContextRuntime(windowObj) {
    if (!windowObj) return;

    const contextMapData = windowObj.ALIDADE_CONTEXT_MAP_DATA || {};
    const SOUK_LANDMARKS = contextMapData.SOUK_LANDMARKS || {};
    const CONTEXT_NEGOTIATION_TACTICS = contextMapData.CONTEXT_NEGOTIATION_TACTICS || Object.freeze({});
    const CONTEXT_AREA_BOUNDS = contextMapData.CONTEXT_AREA_BOUNDS || [];

class UnifiedContextEngine {
    constructor() {
        this.contextRuntimePolicy = Object.freeze({
            cacheKey: 'alidade_context_snapshot_v1',
            cacheTtlMs: 45 * 60 * 1000,
            persistDebounceMs: 4000,
            maxCachedCriticalPoints: 6,
            maxCachedRiskZones: 4,
            interpolationRingMeters: 180,
            minInterpolatedRiskScore: 0.15,
            maxInterpolatedZones: 2,
            preAlertDistanceMeters: 120,
            temporalRiskTimezone: 'Africa/Casablanca'
        });
        this.lastContextSnapshotPersistAt = 0;
        this.contextCacheMeta = {
            restoredFromCache: false,
            lastPersistedAt: null,
            lastRestoreReason: null
        };

        this.baselineIntelStore = {
            datasetVersion: null,
            loadedAt: null,
            minTrustToInclude: 0.3,
            integrityStatus: 'unknown',
            validationWarningCount: 0,
            checksumMode: null,
            criticalPoints: [],
            riskZones: [],
            threatTaxonomy: []
        };

        this.context = {
            location: null,
            currentArea: 'unknown',
            nearbyPOIs: [],
            nearbyCriticalPoints: [],
            activeRiskZones: [],
            baselineThreats: [],
            activeThreats: [],
            recentNegotiations: [],
            userBehavior: {
                priceChecks: 0,
                negotiationWins: 0,
                negotiationLosses: 0,
                totalSavings: 0
            },
            sessionData: {
                areaEnteredAt: Date.now(),
                lastPOIId: null,
                lastLocationSource: null,
                lastThreatSource: null,
                lastBaselineRefreshAt: null,
                lastCachedPersistAt: null,
                lastCachedRestoreAt: null,
                lastCachedRestoreSource: null,
                cachedSnapshotAgeMs: null,
                interpolatedRiskZonesCount: 0,
                lastRiskComputationAt: null
            }
        };
        this.lastIntelContextEmitAt = 0;

        this.hydrateBaselineIntelFromGoldenRecord('constructor');
        this.restoreContextFromCache('constructor');
    }

    getDistanceMeters(lat1, lng1, lat2, lng2) {
        if ([lat1, lng1, lat2, lng2].some((value) => typeof value !== 'number' || Number.isNaN(value))) {
            return Number.POSITIVE_INFINITY;
        }

        if (typeof haversineDistance === 'function') {
            return haversineDistance(lat1, lng1, lat2, lng2);
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

    toFiniteNumber(value, fallback = null) {
        if (value === null || value === undefined || value === '') return fallback;
        const normalized = Number(value);
        return Number.isFinite(normalized) ? normalized : fallback;
    }

    clamp01(value, fallback = 0) {
        const numeric = this.toFiniteNumber(value, fallback);
        return Math.max(0, Math.min(1, numeric));
    }

    resolveMarrakechHour(dateObj = new Date()) {
        try {
            const formatter = new Intl.DateTimeFormat('en-GB', {
                hour: '2-digit',
                hour12: false,
                timeZone: this.contextRuntimePolicy.temporalRiskTimezone
            });
            const hour = Number.parseInt(formatter.format(dateObj), 10);
            if (Number.isFinite(hour)) return hour;
        } catch (_error) {
            // Fall back to runtime local time when Intl timezone lookup is unavailable.
        }
        return dateObj.getHours();
    }

    resolveTemporalRiskWindow(hourValue) {
        const safeHour = this.toFiniteNumber(hourValue, this.resolveMarrakechHour());
        if (safeHour >= 0 && safeHour < 6) {
            return { id: 'late_night', label: 'LATE NIGHT', multiplier: 1.3 };
        }
        if (safeHour >= 6 && safeHour < 11) {
            return { id: 'morning', label: 'MORNING', multiplier: 0.95 };
        }
        if (safeHour >= 11 && safeHour < 17) {
            return { id: 'daytime', label: 'DAYTIME', multiplier: 1.0 };
        }
        if (safeHour >= 17 && safeHour < 21) {
            return { id: 'evening_peak', label: 'EVENING PEAK', multiplier: 1.2 };
        }
        return { id: 'night_market', label: 'NIGHT MARKET', multiplier: 1.12 };
    }

    resolveThreatSensitivityBoost(zone = {}, temporalWindow = {}) {
        const threatText = (Array.isArray(zone.threatTypes) ? zone.threatTypes : [])
            .map((item) => String(item || '').toLowerCase())
            .join(' ');
        const windowId = String(temporalWindow.id || '');
        let boost = 0;

        if (/(pickpocket|theft|snatch|steal|rob|scam|harass)/.test(threatText)) {
            boost = ['late_night', 'evening_peak', 'night_market'].includes(windowId) ? 0.18 : 0.08;
        }

        if (/(fake_guide|guide|pressure|overcharge|fraud)/.test(threatText) && windowId === 'evening_peak') {
            boost = Math.max(boost, 0.12);
        }

        return this.clamp01(boost, 0);
    }

    resolveRiskExplainability(zone = {}, temporalWindow = {}, temporalRisk = {}) {
        const isInterpolated = zone.source === 'baseline_risk_zone_interpolated' || Boolean(zone.interpolation);
        const threatList = Array.isArray(zone.threatTypes) ? zone.threatTypes.filter(Boolean).slice(0, 3) : [];
        const hour = this.resolveMarrakechHour();
        const baseRiskPct = Math.round(this.clamp01(zone.baselineScore, 0) * 100);
        const confidencePct = Math.round(this.clamp01(zone.confidence, 0) * 100);
        const adjustedRiskPct = Math.round(this.clamp01(temporalRisk.timeAdjustedComposite, 0) * 100);
        const proximityReason = isInterpolated
            ? `Perimeter warning: approaching ${zone.areaName || 'risk zone'} before entry.`
            : `Inside active risk zone: ${zone.areaName || 'unknown area'}.`;
        const threatReason = threatList.length > 0
            ? `Threat tags: ${threatList.join(', ')}.`
            : 'Baseline zone risk is elevated from trusted static intel.';
        const timeReason = `Time window ${temporalWindow.label || 'UNKNOWN'} (${String(hour).padStart(2, '0')}:00) adjusts exposure.`;
        const confidenceReason = `Composite score ${adjustedRiskPct}% (baseline ${baseRiskPct}% / confidence ${confidencePct}%).`;
        const action = isInterpolated
            ? 'Pre-alert: move to a busier lane now, avoid stopping, keep phone out of sight.'
            : 'Inside risk zone: keep moving, avoid phone display, exit via visible high-footfall lane.';

        return {
            headline: proximityReason,
            reasons: [proximityReason, threatReason, timeReason, confidenceReason],
            action
        };
    }

    decorateRiskZoneSignal(zone = {}) {
        if (!zone || typeof zone !== 'object') return zone;

        const temporalWindow = this.resolveTemporalRiskWindow();
        const proximityWeight = this.clamp01(zone?.interpolation?.proximityScore, 1);
        const baseComposite = this.clamp01(zone.baselineScore, 0) * this.clamp01(zone.confidence, 0) * proximityWeight;
        const threatBoost = this.resolveThreatSensitivityBoost(zone, temporalWindow);
        const timeAdjustedComposite = this.clamp01(baseComposite * temporalWindow.multiplier * (1 + threatBoost), 0);
        const interpolationOffset = this.toFiniteNumber(zone?.interpolation?.offsetMeters, null);
        const preAlertDistance = this.toFiniteNumber(this.contextRuntimePolicy.preAlertDistanceMeters, 120);
        const preAlertArmed = zone.source === 'baseline_risk_zone_interpolated' &&
            interpolationOffset !== null &&
            interpolationOffset <= preAlertDistance &&
            timeAdjustedComposite >= 0.25;

        const temporalRisk = {
            windowId: temporalWindow.id,
            windowLabel: temporalWindow.label,
            multiplier: temporalWindow.multiplier,
            threatBoost,
            baseComposite,
            timeAdjustedComposite
        };
        const explainability = this.resolveRiskExplainability(zone, temporalWindow, temporalRisk);

        return {
            ...zone,
            temporalRisk,
            riskExplainability: explainability,
            preAlert: {
                armed: preAlertArmed,
                distanceMeters: interpolationOffset,
                command: explainability.action
            }
        };
    }

    canUseStorage() {
        try {
            return typeof window?.localStorage !== 'undefined' && window.localStorage !== null;
        } catch (_error) {
            return false;
        }
    }

    getContextCacheKey() {
        return this.contextRuntimePolicy.cacheKey;
    }

    readContextCacheEnvelope() {
        if (!this.canUseStorage()) return null;
        let raw = null;
        try {
            raw = window.localStorage.getItem(this.getContextCacheKey());
        } catch (_error) {
            return null;
        }
        if (!raw) return null;
        try {
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : null;
        } catch (_error) {
            return null;
        }
    }

    normalizeCachedCriticalPoint(point = {}, index = 0) {
        const lat = this.toFiniteNumber(point.lat, null);
        const lng = this.toFiniteNumber(point.lng, null);
        if (lat === null || lng === null) return null;
        return {
            id: String(point.id || point.point_id || `cached_critical_${index}`),
            type: String(point.type || 'critical').toLowerCase(),
            name: String(point.name || 'Critical point'),
            lat,
            lng,
            phone: point.phone || point.dial_display || point.phone_e164 || point.dial_local || null,
            openHours: point.openHours || point.open_hours || null,
            validatedAt: point.validatedAt || point.validated_at || null,
            trustScore: this.toFiniteNumber(point.trustScore ?? point.aggregate_trust_score, 0),
            trustScope: point.trustScope || point.trust_scope || 'cached_context_snapshot',
            distance: this.toFiniteNumber(point.distance, null)
        };
    }

    normalizeCachedRiskZone(zone = {}, index = 0) {
        const centerLat = this.toFiniteNumber(zone?.geometry?.center?.lat, null);
        const centerLng = this.toFiniteNumber(zone?.geometry?.center?.lng, null);
        const radiusMeters = this.toFiniteNumber(
            zone?.geometry?.radiusMeters ?? zone?.geometry?.radius_m,
            0
        );
        if (centerLat === null || centerLng === null || radiusMeters <= 0) return null;

        const interpolation = zone?.interpolation && typeof zone.interpolation === 'object'
            ? {
                mode: String(zone.interpolation.mode || 'proximity_ring'),
                proximityScore: Math.max(0, Math.min(1, this.toFiniteNumber(zone.interpolation.proximityScore, 0))),
                offsetMeters: Math.max(0, this.toFiniteNumber(zone.interpolation.offsetMeters, 0)),
                ringMeters: Math.max(1, this.toFiniteNumber(zone.interpolation.ringMeters, this.contextRuntimePolicy.interpolationRingMeters))
            }
            : null;

        return {
            id: String(zone.id || zone.geohash7 || zone.areaName || `cached_zone_${index}`),
            areaName: String(zone.areaName || zone.area_name || 'Unknown area'),
            baselineScore: Math.max(0, Math.min(1, this.toFiniteNumber(zone.baselineScore ?? zone.baseline_score, 0))),
            confidence: Math.max(0, Math.min(1, this.toFiniteNumber(zone.confidence, 0))),
            threatTypes: Array.isArray(zone.threatTypes)
                ? zone.threatTypes
                : (Array.isArray(zone.threat_types) ? zone.threat_types : []),
            geohash7: zone.geohash7 || null,
            geometry: {
                type: String(zone?.geometry?.type || 'circle').toLowerCase(),
                center: {
                    lat: centerLat,
                    lng: centerLng
                },
                radiusMeters
            },
            expiresAt: zone.expiresAt || zone.expires_at || null,
            validatedAt: zone.validatedAt || zone.validated_at || null,
            lowConfidenceWarning: zone.lowConfidenceWarning === true || zone.low_confidence_warning === true,
            trustScore: this.toFiniteNumber(zone.trustScore ?? zone.aggregate_trust_score, 0),
            distance: this.toFiniteNumber(zone.distance, null),
            isInside: zone.isInside === true,
            source: zone.source || 'cached_risk_zone',
            interpolation
        };
    }

    persistContextSnapshot(source = 'runtime') {
        if (!this.canUseStorage()) return false;

        const location = this.context.location || {};
        const lat = this.toFiniteNumber(location.lat, null);
        const lng = this.toFiniteNumber(location.lng, null);
        if (lat === null || lng === null) return false;

        const now = Date.now();
        if ((now - this.lastContextSnapshotPersistAt) < this.contextRuntimePolicy.persistDebounceMs) {
            return false;
        }

        const envelope = {
            version: 1,
            cachedAt: now,
            source,
            snapshot: {
                location: {
                    lat,
                    lng,
                    accuracy: this.toFiniteNumber(location.accuracy, null),
                    timestamp: this.toFiniteNumber(location.timestamp, now),
                    source: this.context.sessionData.lastLocationSource || 'unknown'
                },
                currentArea: this.context.currentArea || 'unknown',
                nearbyCriticalPoints: (Array.isArray(this.context.nearbyCriticalPoints) ? this.context.nearbyCriticalPoints : [])
                    .slice(0, this.contextRuntimePolicy.maxCachedCriticalPoints),
                activeRiskZones: (Array.isArray(this.context.activeRiskZones) ? this.context.activeRiskZones : [])
                    .slice(0, this.contextRuntimePolicy.maxCachedRiskZones),
                baselineIntel: this.context.baselineIntel
                    ? {
                        datasetVersion: this.context.baselineIntel.datasetVersion || null,
                        integrityStatus: this.context.baselineIntel.integrityStatus || 'unknown',
                        validationWarningCount: this.toFiniteNumber(this.context.baselineIntel.validationWarningCount, 0),
                        checksumMode: this.context.baselineIntel.checksumMode || null
                    }
                    : null
            }
        };

        try {
            window.localStorage.setItem(this.getContextCacheKey(), JSON.stringify(envelope));
            this.lastContextSnapshotPersistAt = now;
            this.contextCacheMeta = {
                ...this.contextCacheMeta,
                restoredFromCache: false,
                lastPersistedAt: now
            };
            this.context.sessionData.lastCachedPersistAt = now;
            return true;
        } catch (_error) {
            return false;
        }
    }

    restoreContextFromCache(source = 'runtime', options = {}) {
        const allowWhenLocationPresent = options.allowWhenLocationPresent === true;
        if (!allowWhenLocationPresent &&
            this.context.location &&
            typeof this.context.location.lat === 'number' &&
            typeof this.context.location.lng === 'number') {
            return false;
        }

        const envelope = this.readContextCacheEnvelope();
        if (!envelope || typeof envelope !== 'object') return false;

        const cachedAt = this.toFiniteNumber(envelope.cachedAt, null);
        if (cachedAt === null) return false;

        const ageMs = Date.now() - cachedAt;
        if (ageMs < 0 || ageMs > this.contextRuntimePolicy.cacheTtlMs) return false;

        const snapshot = envelope.snapshot || {};
        const lat = this.toFiniteNumber(snapshot?.location?.lat, null);
        const lng = this.toFiniteNumber(snapshot?.location?.lng, null);
        if (lat === null || lng === null) return false;

        this.context.location = {
            lat,
            lng,
            accuracy: this.toFiniteNumber(snapshot?.location?.accuracy, null),
            timestamp: this.toFiniteNumber(snapshot?.location?.timestamp, Date.now())
        };
        this.context.currentArea = this.normalizeArea(snapshot.currentArea || this.detectArea(lat, lng));
        this.context.sessionData.lastLocationSource = snapshot?.location?.source || 'cache_restore';

        this.context.nearbyCriticalPoints = (Array.isArray(snapshot.nearbyCriticalPoints) ? snapshot.nearbyCriticalPoints : [])
            .map((point, index) => this.normalizeCachedCriticalPoint(point, index))
            .filter(Boolean)
            .slice(0, this.contextRuntimePolicy.maxCachedCriticalPoints);

        const cachedRiskZones = (Array.isArray(snapshot.activeRiskZones) ? snapshot.activeRiskZones : [])
            .map((zone, index) => this.normalizeCachedRiskZone(zone, index))
            .filter((zone) => zone && !this.isRiskZoneExpired(zone))
            .slice(0, this.contextRuntimePolicy.maxCachedRiskZones);

        const interpolated = cachedRiskZones.length > 0
            ? []
            : this.resolveInterpolatedRiskZones(lat, lng);

        this.context.activeRiskZones = this.mergeRiskZoneSignals(cachedRiskZones, interpolated);
        this.context.baselineThreats = this.buildBaselineThreatsFromZones(this.context.activeRiskZones);
        this.context.sessionData.interpolatedRiskZonesCount = interpolated.length;
        this.context.sessionData.lastRiskComputationAt = Date.now();
        this.context.sessionData.lastCachedRestoreAt = Date.now();
        this.context.sessionData.lastCachedRestoreSource = source;
        this.context.sessionData.cachedSnapshotAgeMs = ageMs;

        if (snapshot.baselineIntel && typeof snapshot.baselineIntel === 'object') {
            this.context.baselineIntel = {
                ...this.context.baselineIntel,
                datasetVersion: snapshot.baselineIntel.datasetVersion || this.baselineIntelStore.datasetVersion,
                integrityStatus: snapshot.baselineIntel.integrityStatus || this.baselineIntelStore.integrityStatus || 'unknown',
                validationWarningCount: this.toFiniteNumber(snapshot.baselineIntel.validationWarningCount, this.baselineIntelStore.validationWarningCount || 0),
                checksumMode: snapshot.baselineIntel.checksumMode || this.baselineIntelStore.checksumMode || null,
                source: `${source}_cache_restore`
            };
        }

        this.contextCacheMeta = {
            restoredFromCache: true,
            lastPersistedAt: cachedAt,
            lastRestoreReason: source
        };

        return true;
    }

    resolveInterpolatedRiskZones(lat, lng) {
        const zones = Array.isArray(this.baselineIntelStore.riskZones)
            ? this.baselineIntelStore.riskZones
            : [];
        const ringMeters = this.contextRuntimePolicy.interpolationRingMeters;

        return zones
            .filter((zone) => !this.isRiskZoneExpired(zone))
            .map((zone) => {
                const centerLat = this.toFiniteNumber(zone.geometry?.center?.lat, null);
                const centerLng = this.toFiniteNumber(zone.geometry?.center?.lng, null);
                const radiusMeters = this.toFiniteNumber(zone.geometry?.radiusMeters, 0);
                if (centerLat === null || centerLng === null || radiusMeters <= 0) return null;

                const distance = this.getDistanceMeters(lat, lng, centerLat, centerLng);
                const offsetMeters = distance - radiusMeters;
                if (!Number.isFinite(distance) || offsetMeters <= 0 || offsetMeters > ringMeters) return null;

                const proximityScore = Math.max(0, Math.min(1, 1 - (offsetMeters / ringMeters)));
                const weightedRisk = (zone.baselineScore || 0) * (zone.confidence || 0) * proximityScore;
                if (weightedRisk < this.contextRuntimePolicy.minInterpolatedRiskScore) return null;

                return {
                    ...zone,
                    distance,
                    isInside: false,
                    source: 'baseline_risk_zone_interpolated',
                    interpolation: {
                        mode: 'proximity_ring',
                        proximityScore,
                        offsetMeters: Math.round(offsetMeters),
                        ringMeters
                    }
                };
            })
            .filter(Boolean)
            .sort((a, b) => {
                const riskA = (a.baselineScore || 0) * (a.confidence || 0) * (a.interpolation?.proximityScore || 0);
                const riskB = (b.baselineScore || 0) * (b.confidence || 0) * (b.interpolation?.proximityScore || 0);
                return riskB - riskA;
            })
            .slice(0, this.contextRuntimePolicy.maxInterpolatedZones);
    }

    mergeRiskZoneSignals(primaryZones = [], secondaryZones = []) {
        const mergedById = new Map();
        [...(Array.isArray(primaryZones) ? primaryZones : []), ...(Array.isArray(secondaryZones) ? secondaryZones : [])]
            .forEach((zone) => {
                if (!zone?.id) return;
                if (!mergedById.has(zone.id)) {
                    mergedById.set(zone.id, zone);
                }
            });
        return [...mergedById.values()]
            .map((zone) => this.decorateRiskZoneSignal(zone))
            .sort((a, b) => {
                const riskA = this.toFiniteNumber(a?.temporalRisk?.timeAdjustedComposite, 0);
                const riskB = this.toFiniteNumber(b?.temporalRisk?.timeAdjustedComposite, 0);
                return riskB - riskA;
            })
            .slice(0, this.contextRuntimePolicy.maxCachedRiskZones);
    }

    resolveGoldenRecordPayload() {
        if (window.ALIDADE_GOLDEN_RECORD && typeof window.ALIDADE_GOLDEN_RECORD === 'object') {
            return window.ALIDADE_GOLDEN_RECORD;
        }
        const utils = window.ALIDADE_GOLDEN_RECORD_UTILS;
        if (utils && typeof utils.getGoldenRecord === 'function') {
            return utils.getGoldenRecord();
        }
        return null;
    }

    resolveGoldenRecordIntegritySnapshot() {
        const securityState = window.__ALIDADE_RUNTIME_SECURITY_STATE__?.goldenRecord || {};
        const meta = window.__ALIDADE_GOLDEN_RECORD_META__ || {};

        const status = String(
            securityState.status ||
            (meta.datasetVersion ? 'verified' : 'unknown')
        ).toLowerCase();

        const warningCount = Number(
            securityState.validationWarningCount ??
            meta.validationWarningCount ??
            0
        );

        return {
            integrityStatus: status || 'unknown',
            validationWarningCount: Number.isFinite(warningCount) ? warningCount : 0,
            checksumMode: securityState.checksumMode || meta.checksumMode || null
        };
    }

    normalizeCriticalPoint(point = {}, index = 0) {
        const lat = this.toFiniteNumber(point.lat, null);
        const lng = this.toFiniteNumber(point.lng, null);
        if (lat === null || lng === null) return null;

        const trustScore = this.toFiniteNumber(point.aggregate_trust_score, 0);
        return {
            id: String(point.point_id || `critical_point_${index}`),
            type: String(point.type || 'critical').toLowerCase(),
            name: String(point.name || 'Critical point'),
            lat,
            lng,
            phone: point.dial_display || point.phone_e164 || point.dial_local || null,
            openHours: point.open_hours || null,
            validatedAt: point.validated_at || null,
            trustScore,
            trustScope: point.trust_scope || 'baseline_static_record'
        };
    }

    isRiskZoneExpired(zone = {}) {
        if (!zone.expiresAt) return false;
        const expiry = Date.parse(zone.expiresAt);
        if (Number.isNaN(expiry)) return false;
        return Date.now() > expiry;
    }

    normalizeRiskZone(zone = {}, index = 0) {
        const geometry = zone.geometry || {};
        const centerLat = this.toFiniteNumber(geometry?.center?.lat, null);
        const centerLng = this.toFiniteNumber(geometry?.center?.lng, null);
        const radiusMeters = this.toFiniteNumber(geometry?.radius_m, 0);
        const baselineScore = Math.max(0, Math.min(1, this.toFiniteNumber(zone.baseline_score, 0)));
        const confidence = Math.max(0, Math.min(1, this.toFiniteNumber(zone.confidence, 0)));
        const trustScore = this.toFiniteNumber(zone.aggregate_trust_score, 0);

        if (geometry?.type === 'circle' && (centerLat === null || centerLng === null || radiusMeters <= 0)) {
            return null;
        }

        return {
            id: String(zone.geohash7 || zone.area_name || `risk_zone_${index}`),
            areaName: String(zone.area_name || 'Unknown area'),
            baselineScore,
            confidence,
            threatTypes: Array.isArray(zone.threat_types) ? zone.threat_types : [],
            geohash7: zone.geohash7 || null,
            geometry: {
                type: geometry?.type || 'unknown',
                center: {
                    lat: centerLat,
                    lng: centerLng
                },
                radiusMeters
            },
            expiresAt: zone.expires_at || null,
            validatedAt: zone.validated_at || null,
            lowConfidenceWarning: zone.low_confidence_warning === true,
            trustScore
        };
    }

    isPointInsideRiskGeometry(lat, lng, geometry = {}) {
        const type = String(geometry.type || '').toLowerCase();
        if (type === 'circle') {
            const centerLat = this.toFiniteNumber(geometry?.center?.lat, null);
            const centerLng = this.toFiniteNumber(geometry?.center?.lng, null);
            const radiusMeters = this.toFiniteNumber(geometry?.radiusMeters, 0);
            if (centerLat === null || centerLng === null || radiusMeters <= 0) return false;
            return this.getDistanceMeters(lat, lng, centerLat, centerLng) <= radiusMeters;
        }
        return false;
    }

    buildBaselineThreatsFromZones(zones = []) {
        return (Array.isArray(zones) ? zones : [])
            .slice(0, 6)
            .map((zone, index) => {
                const proximityScore = zone.interpolation?.proximityScore;
                const weight = typeof proximityScore === 'number' ? Math.max(0, Math.min(1, proximityScore)) : 1;
                const compositeRisk = this.toFiniteNumber(
                    zone?.temporalRisk?.timeAdjustedComposite,
                    (zone.baselineScore || 0) * (zone.confidence || 0) * weight
                );
                const severity = compositeRisk >= 0.75 ? 'high' : (compositeRisk >= 0.5 ? 'medium' : 'low');
                const threatList = (zone.threatTypes || []).slice(0, 3).join(', ');
                const isInterpolated = zone.source === 'baseline_risk_zone_interpolated' || Boolean(zone.interpolation);
                const timeWindow = zone?.temporalRisk?.windowLabel
                    ? ` Time window: ${zone.temporalRisk.windowLabel}.`
                    : '';
                const explainabilityAction = zone?.riskExplainability?.action || null;
                return {
                    id: `baseline_zone_${zone.id || index}`,
                    name: `Baseline Risk: ${zone.areaName}`,
                    severity,
                    status: 'active',
                    advice: explainabilityAction || (isInterpolated
                        ? `Nearby risk perimeter detected around ${zone.areaName}. ${
                            threatList
                                ? `Likely exposure: ${threatList}.`
                                : 'Threat exposure can increase rapidly.'
                        } Keep route flexible and stay in visible lanes.`
                        : (threatList
                            ? `Primary risks: ${threatList}. Keep moving, maintain line-of-sight, secure valuables.`
                            : 'Elevated baseline risk detected. Stay alert and avoid prolonged stops.')) + timeWindow,
                    distance: typeof zone.distance === 'number' ? Math.round(zone.distance) : null,
                    source: zone.source || 'baseline_risk_zone'
                };
            });
    }

    getCombinedThreatFeed() {
        return [...this.context.activeThreats, ...this.context.baselineThreats]
            .slice(0, 12);
    }

    hydrateBaselineIntelFromGoldenRecord(source = 'runtime') {
        const payload = this.resolveGoldenRecordPayload();
        if (!payload || typeof payload !== 'object') {
            return false;
        }
        const integrity = this.resolveGoldenRecordIntegritySnapshot();

        const minTrustToInclude = this.toFiniteNumber(
            payload?.policy_config?.trust_thresholds?.baseline_static_records?.min_to_include,
            0.3
        );
        const safeThreshold = Math.max(0, Math.min(1, minTrustToInclude));

        const criticalPoints = (Array.isArray(payload.critical_points) ? payload.critical_points : [])
            .map((point, index) => this.normalizeCriticalPoint(point, index))
            .filter((point) => point && point.trustScore >= safeThreshold);

        const riskZones = (Array.isArray(payload.baseline_risk_zones) ? payload.baseline_risk_zones : [])
            .map((zone, index) => this.normalizeRiskZone(zone, index))
            .filter((zone) => zone && zone.trustScore >= safeThreshold);

        this.baselineIntelStore = {
            datasetVersion: payload?.metadata?.dataset_version || null,
            loadedAt: payload?.metadata?.generated_at || null,
            minTrustToInclude: safeThreshold,
            integrityStatus: integrity.integrityStatus,
            validationWarningCount: integrity.validationWarningCount,
            checksumMode: integrity.checksumMode,
            criticalPoints,
            riskZones,
            threatTaxonomy: Array.isArray(payload.threat_taxonomy) ? payload.threat_taxonomy : []
        };

        this.context.sessionData.lastBaselineRefreshAt = Date.now();
        this.context.baselineIntel = {
            source,
            datasetVersion: this.baselineIntelStore.datasetVersion,
            criticalPointsCount: criticalPoints.length,
            riskZonesCount: riskZones.length,
            minTrustToInclude: safeThreshold,
            integrityStatus: integrity.integrityStatus,
            validationWarningCount: integrity.validationWarningCount,
            checksumMode: integrity.checksumMode
        };

        this.recomputeBaselineSignalsForCurrentLocation();
        return true;
    }

    recomputeBaselineSignalsForCurrentLocation() {
        const current = this.context.location;
        if (!current || typeof current.lat !== 'number' || typeof current.lng !== 'number') {
            this.context.nearbyCriticalPoints = [];
            this.context.activeRiskZones = [];
            this.context.baselineThreats = [];
            this.context.sessionData.interpolatedRiskZonesCount = 0;
            this.context.sessionData.lastRiskComputationAt = Date.now();
            return;
        }

        this.context.nearbyCriticalPoints = this.getNearbyCriticalPoints(current.lat, current.lng, 1200);
        const insideZones = this.getActiveRiskZones(current.lat, current.lng);
        const interpolatedZones = insideZones.length > 0 ? [] : this.resolveInterpolatedRiskZones(current.lat, current.lng);
        this.context.activeRiskZones = this.mergeRiskZoneSignals(insideZones, interpolatedZones);
        this.context.baselineThreats = this.buildBaselineThreatsFromZones(this.context.activeRiskZones);
        this.context.sessionData.interpolatedRiskZonesCount = interpolatedZones.length;
        this.context.sessionData.lastRiskComputationAt = Date.now();
    }

    normalizeArea(area) {
        const raw = String(area || '').toLowerCase().trim();
        const map = {
            medina: 'souks_main',
            souk: 'souks_main',
            souks: 'souks_main',
            souks_main: 'souks_main',
            souks_interior: 'souks_interior',
            workshops: 'workshops',
            jemaa: 'jemaa',
            gueliz: 'gueliz',
            mellah: 'mellah'
        };
        return map[raw] || 'unknown';
    }

    isInBounds(lat, lng, bounds) {
        return lat >= bounds.south && lat <= bounds.north &&
            lng >= bounds.west && lng <= bounds.east;
    }

    detectArea(lat, lng) {
        for (const area of CONTEXT_AREA_BOUNDS) {
            if (this.isInBounds(lat, lng, area.bounds)) {
                return area.name;
            }
        }

        if (typeof detectSoukArea === 'function') {
            return this.normalizeArea(detectSoukArea(lat, lng));
        }

        return 'unknown';
    }

    getNearbyPOIs(lat, lng, radiusMeters = 500) {
        const basePois = Object.entries(SOUK_LANDMARKS || {}).map(([id, poi]) => ({
            id,
            name: poi.name,
            lat: poi.lat,
            lng: poi.lng,
            type: 'landmark'
        }));

        const overlayPois = Array.isArray(window.MEDINA_LANDMARKS)
            ? window.MEDINA_LANDMARKS.map((poi) => ({
                id: poi.id,
                name: poi.name,
                lat: poi.lat,
                lng: poi.lng,
                type: poi.type || 'landmark',
                icon: poi.icon || null
            }))
            : [];

        const uniqueById = new Map();
        [...basePois, ...overlayPois].forEach((poi) => {
            if (poi?.id && !uniqueById.has(poi.id)) {
                uniqueById.set(poi.id, poi);
            }
        });

        return [...uniqueById.values()]
            .map((poi) => {
                const distance = this.getDistanceMeters(lat, lng, poi.lat, poi.lng);
                return { ...poi, distance };
            })
            .filter((poi) => poi.distance <= radiusMeters)
            .sort((a, b) => a.distance - b.distance);
    }

    async updateLocation(lat, lng, meta = {}) {
        if (typeof lat !== 'number' || typeof lng !== 'number') return;

        const previousArea = this.context.currentArea;
        const detectedArea = this.detectArea(lat, lng);

        this.context.location = {
            lat,
            lng,
            accuracy: meta.accuracy ?? null,
            timestamp: Date.now()
        };
        this.context.currentArea = detectedArea;
        this.context.nearbyPOIs = this.getNearbyPOIs(lat, lng, 500);
        this.context.sessionData.lastLocationSource = meta.source || 'unknown';
        this.context.sessionData.lastCachedRestoreSource = null;
        this.context.sessionData.cachedSnapshotAgeMs = null;
        this.recomputeBaselineSignalsForCurrentLocation();

        if (previousArea !== detectedArea) {
            this.context.sessionData.areaEnteredAt = Date.now();
            if (window.sessionIntel?.logActivity) {
                window.sessionIntel.logActivity('area_transition', {
                    from: previousArea,
                    to: detectedArea
                });
            }
        }

        const nearestPoi = this.context.nearbyPOIs[0];
        if (nearestPoi && nearestPoi.distance <= 80 && this.context.sessionData.lastPOIId !== nearestPoi.id) {
            this.recordVisitedPOI(nearestPoi);
        }

        this.persistContextSnapshot('location_update');
        this.broadcastUpdate('location');
    }

    getNearbyCriticalPoints(lat, lng, radiusMeters = 1200) {
        const points = Array.isArray(this.baselineIntelStore.criticalPoints)
            ? this.baselineIntelStore.criticalPoints
            : [];

        return points
            .map((point) => ({
                ...point,
                distance: this.getDistanceMeters(lat, lng, point.lat, point.lng)
            }))
            .filter((point) => point.distance <= radiusMeters)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 6);
    }

    getActiveRiskZones(lat, lng) {
        const zones = Array.isArray(this.baselineIntelStore.riskZones)
            ? this.baselineIntelStore.riskZones
            : [];

        return zones
            .filter((zone) => !this.isRiskZoneExpired(zone))
            .map((zone) => {
                const centerLat = this.toFiniteNumber(zone.geometry?.center?.lat, null);
                const centerLng = this.toFiniteNumber(zone.geometry?.center?.lng, null);
                const distanceToCenter = centerLat === null || centerLng === null
                    ? Number.POSITIVE_INFINITY
                    : this.getDistanceMeters(lat, lng, centerLat, centerLng);
                return {
                    ...zone,
                    distance: distanceToCenter,
                    isInside: this.isPointInsideRiskGeometry(lat, lng, zone.geometry),
                    source: zone.source || 'baseline_risk_zone'
                };
            })
            .filter((zone) => zone.isInside)
            .sort((a, b) => (b.baselineScore * b.confidence) - (a.baselineScore * a.confidence))
            .slice(0, 4);
    }

    setActiveThreats(threats = [], source = 'unknown') {
        const normalized = (Array.isArray(threats) ? threats : [])
            .map((threat) => ({
                id: threat.id || `threat_${Date.now()}`,
                name: threat.name || threat.title || 'Unknown threat',
                severity: String(threat.severity || threat.risk || 'low').toLowerCase(),
                status: threat.status || 'active',
                advice: threat.advice || threat.counter_measure || '',
                distance: typeof threat.distance === 'number' ? Math.round(threat.distance) : null
            }))
            .slice(0, 12);

        this.context.activeThreats = normalized;
        this.context.sessionData.lastThreatSource = source;
        this.broadcastUpdate('threat');
    }

    recordVisitedPOI(poi) {
        if (!poi?.id) return;
        this.context.sessionData.lastPOIId = poi.id;

        if (window.sessionIntel?.logActivity) {
            window.sessionIntel.logActivity('poi_visited', {
                poiId: poi.id,
                poiName: poi.name,
                poiType: poi.type || 'landmark',
                distance: poi.distance ?? null
            });
        }

        this.broadcastUpdate('poi');
    }

    recordNegotiation(data = {}) {
        const saved = Math.max(0, Number(data.saved || 0));
        const success = Boolean(data.success);
        const area = this.normalizeArea(data.area || this.context.currentArea);

        const entry = {
            ...data,
            area,
            success,
            saved,
            timestamp: Date.now()
        };

        this.context.recentNegotiations.push(entry);
        if (this.context.recentNegotiations.length > 10) {
            this.context.recentNegotiations.shift();
        }

        if (success) this.context.userBehavior.negotiationWins += 1;
        else this.context.userBehavior.negotiationLosses += 1;
        this.context.userBehavior.totalSavings += saved;

        this.broadcastUpdate('negotiation');
    }

    recordPriceCheck(data = {}) {
        this.context.userBehavior.priceChecks += 1;
        this.context.userBehavior.lastPriceCheck = {
            ...data,
            area: this.normalizeArea(data.area || this.context.currentArea),
            timestamp: Date.now()
        };
        this.broadcastUpdate('price');
    }

    getLocationMultiplier() {
        const multipliers = {
            jemaa: 1.4,
            souks_main: 1.2,
            souks_interior: 1.15,
            mellah: 1.05,
            gueliz: 0.95,
            workshops: 0.7,
            unknown: 1.0
        };
        return multipliers[this.context.currentArea] || 1.0;
    }

    getAreaSpecificTactics() {
        const tacticsMap = {
            jemaa: [
                CONTEXT_NEGOTIATION_TACTICS.not_tourist,
                CONTEXT_NEGOTIATION_TACTICS.walk_away_threat,
                CONTEXT_NEGOTIATION_TACTICS.comparison_shop
            ],
            souks_main: [
                CONTEXT_NEGOTIATION_TACTICS.gentle_lower,
                CONTEXT_NEGOTIATION_TACTICS.comparison_shop
            ],
            souks_interior: [
                CONTEXT_NEGOTIATION_TACTICS.gentle_lower,
                CONTEXT_NEGOTIATION_TACTICS.bulk_discount
            ],
            workshops: [
                CONTEXT_NEGOTIATION_TACTICS.quality_question,
                CONTEXT_NEGOTIATION_TACTICS.friend_recommendation
            ],
            gueliz: [
                CONTEXT_NEGOTIATION_TACTICS.quality_question
            ]
        };
        return tacticsMap[this.context.currentArea] || [];
    }

    getNearbyVendorProfiles() {
        const profileByArea = {
            jemaa: ['high_footfall', 'tourist_anchor_pricing'],
            souks_main: ['mixed_quality', 'markup_negotiable'],
            souks_interior: ['artisan_and_reseller_mix'],
            workshops: ['maker_direct', 'quality_discussion_friendly'],
            gueliz: ['semi_fixed_price']
        };
        return profileByArea[this.context.currentArea] || ['unknown_profile'];
    }

    getLocalCrowdData() {
        const crowdStats = window.crowdPriceDB?.getUserStats?.() || {};
        return {
            area: this.context.currentArea,
            contributorRank: crowdStats.rank || 'Scout',
            localDemand: this.context.currentArea === 'jemaa' ? 'high' : 'normal',
            localSupply: this.context.currentArea === 'workshops' ? 'maker_direct' : 'mixed',
            contributionPoints: crowdStats.points || 0
        };
    }

    getLocalNegotiationNorms() {
        const normsMap = {
            jemaa: 'Expect high openers; start firm and keep pace.',
            souks_main: 'Counter calmly and compare stalls before committing.',
            souks_interior: 'Relationship-based haggling works better than hard pressure.',
            workshops: 'Quality questions and respectful detail checks perform best.',
            gueliz: 'More fixed prices; negotiate lightly or bundle.'
        };
        return normsMap[this.context.currentArea] || 'No specific norms available.';
    }

    getCurrentDangerLevel() {
        const combinedThreats = this.getCombinedThreatFeed();
        if (!combinedThreats.length && !this.context.activeRiskZones.length) return 'low';
        if (combinedThreats.some((t) => t.severity === 'high')) return 'high';
        if (combinedThreats.some((t) => t.severity === 'medium')) return 'medium';

        const maxZoneRisk = this.context.activeRiskZones.reduce((maxRisk, zone) => {
            const composite = this.toFiniteNumber(
                zone?.temporalRisk?.timeAdjustedComposite,
                (zone.baselineScore || 0) * (zone.confidence || 0)
            );
            return composite > maxRisk ? composite : maxRisk;
        }, 0);
        if (maxZoneRisk >= 0.75) return 'high';
        if (maxZoneRisk >= 0.5) return 'medium';
        return 'low';
    }

    getTopRiskExplainability() {
        const topZone = this.context.activeRiskZones?.[0];
        if (!topZone) return null;

        const explainability = topZone.riskExplainability || {};
        return {
            areaName: topZone.areaName || null,
            source: topZone.source || 'baseline_risk_zone',
            reasons: Array.isArray(explainability.reasons) ? explainability.reasons : [],
            action: explainability.action || null,
            preAlert: topZone.preAlert || null,
            temporalRisk: topZone.temporalRisk || null
        };
    }

    getRiskRouteHint() {
        const topZone = this.context.activeRiskZones?.[0];
        if (!topZone) {
            return {
                mode: 'clear',
                detourSuggested: false,
                delayMinutes: 0,
                action: 'Route clear. Keep steady pace and stay in visible lanes.',
                why: []
            };
        }

        const adjustedScore = this.toFiniteNumber(topZone?.temporalRisk?.timeAdjustedComposite, 0);
        const isPerimeter = topZone.source === 'baseline_risk_zone_interpolated' || Boolean(topZone.interpolation);
        const shouldDetour = adjustedScore >= 0.62 || (isPerimeter && topZone?.preAlert?.armed === true);
        const delayMinutes = shouldDetour ? (adjustedScore >= 0.75 ? 8 : 5) : 0;
        const action = shouldDetour
            ? `Soft detour suggested near ${topZone.areaName}: use higher-footfall lanes (+~${delayMinutes} min).`
            : `Proceed via ${topZone.areaName} with caution; avoid pauses and blind corners.`;
        const reasons = Array.isArray(topZone?.riskExplainability?.reasons)
            ? topZone.riskExplainability.reasons.slice(0, 2)
            : [];

        return {
            mode: shouldDetour ? 'soft_detour' : 'proceed_with_caution',
            detourSuggested: shouldDetour,
            delayMinutes,
            areaName: topZone.areaName || null,
            action,
            why: reasons,
            score: Number(adjustedScore.toFixed(2))
        };
    }

    getNavigationRecommendations() {
        const recs = [];
        if (this.getCurrentDangerLevel() === 'high') {
            recs.push('High-risk zone detected: keep moving and avoid long stops.');
        }
        if (this.context.currentArea === 'jemaa') {
            recs.push('Tourist-heavy area: verify prices before engaging.');
        }
        if (this.context.activeRiskZones.length > 0) {
            const topRiskZone = this.context.activeRiskZones[0];
            recs.push(`Risk zone active: ${topRiskZone.areaName}. Keep valuables concealed and route via busier lanes.`);
            const explainability = this.getTopRiskExplainability();
            if (Array.isArray(explainability?.reasons) && explainability.reasons.length > 0) {
                recs.push(`Why now: ${explainability.reasons[0]}`);
            }
            if (typeof explainability?.action === 'string' && explainability.action) {
                recs.push(`Immediate action: ${explainability.action}`);
            }
            const routeHint = this.getRiskRouteHint();
            if (routeHint?.detourSuggested) {
                recs.push(`Smart route hint: ${routeHint.action}`);
            }
        }
        if (this.context.nearbyCriticalPoints.length > 0) {
            const nearestCritical = this.context.nearbyCriticalPoints[0];
            recs.push(`Nearest support point: ${nearestCritical.name} (${Math.round(nearestCritical.distance)}m).`);
        }
        if (this.context.nearbyPOIs.length > 0) {
            recs.push(`Closest POI: ${this.context.nearbyPOIs[0].name}`);
        }
        return recs;
    }

    getContext(module) {
        switch (module) {
            case 'price_checker':
                return {
                    location: this.context.currentArea,
                    locationMultiplier: this.getLocationMultiplier(),
                    nearbyVendors: this.getNearbyVendorProfiles(),
                    crowdData: this.getLocalCrowdData(),
                    nearbyPOIs: this.context.nearbyPOIs,
                    activeRiskZones: this.context.activeRiskZones,
                    dangerLevel: this.getCurrentDangerLevel()
                };
            case 'negotiation':
                return {
                    location: this.context.currentArea,
                    recommendedTactics: this.getAreaSpecificTactics(),
                    localNorms: this.getLocalNegotiationNorms(),
                    dangerLevel: this.getCurrentDangerLevel(),
                    activeRiskZones: this.context.activeRiskZones
                };
            case 'vector':
                return {
                    nearbyPOIs: this.context.nearbyPOIs,
                    criticalPoints: this.context.nearbyCriticalPoints,
                    riskZones: this.context.activeRiskZones,
                    threats: this.getCombinedThreatFeed(),
                    recommendations: this.getNavigationRecommendations(),
                    riskExplainability: this.getTopRiskExplainability(),
                    routeHint: this.getRiskRouteHint(),
                    baselineIntel: this.context.baselineIntel || null,
                    contextCache: this.contextCacheMeta
                };
            default:
                return this._snapshot();
        }
    }

    _snapshot() {
        return JSON.parse(JSON.stringify(this.context));
    }

    resolvePowerMode() {
        const modeFromUtils = window.ALIDADE_POWER_RUNTIME_UTILS?.getMode?.();
        const modeFromState = window.__ALIDADE_RUNTIME_SECURITY_STATE__?.power?.mode;
        const normalized = String(modeFromUtils || modeFromState || 'normal').toLowerCase();
        if (normalized === 'power_saver') return 'power_saver';
        if (normalized === 'emergency') return 'emergency';
        if (normalized === 'critical') return 'critical';
        return 'normal';
    }

    getPowerAwareIntelEmitIntervalMs(type) {
        const mode = this.resolvePowerMode();
        const isLocationLike = type === 'location' || type === 'poi';
        if (mode === 'critical') return isLocationLike ? 120000 : 60000;
        if (mode === 'emergency') return isLocationLike ? 60000 : 30000;
        if (mode === 'power_saver') return isLocationLike ? 30000 : 15000;
        return isLocationLike ? 10000 : 5000;
    }

    shouldEmitIntelContextUpdate(type) {
        const criticalTypes = new Set(['threat', 'baseline_intel_failed']);
        if (criticalTypes.has(String(type || ''))) return true;
        const now = Date.now();
        const intervalMs = this.getPowerAwareIntelEmitIntervalMs(type);
        if (now - this.lastIntelContextEmitAt < intervalMs) {
            return false;
        }
        this.lastIntelContextEmitAt = now;
        return true;
    }

    emitIntelContextUpdate(type) {
        const intelUtils = window.ALIDADE_INTEL_EVENT_UTILS;
        if (!intelUtils || typeof intelUtils.emitIntelEvent !== 'function') return;
        if (!this.shouldEmitIntelContextUpdate(type)) return;

        const location = this.context.location || {};
        if (!Number.isFinite(Number(location.lat)) || !Number.isFinite(Number(location.lng))) return;
        const powerMode = this.resolvePowerMode();

        const payload = {
            type: String(type || 'unknown'),
            area: String(this.context.currentArea || 'unknown'),
            lat: Number(location.lat),
            lng: Number(location.lng),
            accuracy: Number.isFinite(Number(location.accuracy)) ? Number(location.accuracy) : null,
            dangerLevel: String(this.getCurrentDangerLevel() || 'unknown'),
            powerMode,
            temporalRiskWindow: this.resolveTemporalRiskWindow().id
        };

        intelUtils.emitIntelEvent('context.update', payload, {
            source: 'context_runtime',
            threatLevel: payload.dangerLevel,
            geohash7: this.context.activeRiskZones?.[0]?.geohash7 || null,
            powerMode,
            throttleIntervalMs: this.getPowerAwareIntelEmitIntervalMs(type)
        }).catch(() => { });
    }

    broadcastUpdate(type) {
        const snapshot = this._snapshot();
        window.dispatchEvent(new CustomEvent('contextUpdate', {
            detail: {
                type,
                context: snapshot
            }
        }));
        this.emitIntelContextUpdate(type);
    }
}

class SessionIntelligence {
    constructor() {
        this.reset();
    }

    reset() {
        this.session = {
            startTime: Date.now(),
            activities: [],
            stats: {
                priceChecks: 0,
                negotiations: 0,
                totalSaved: 0,
                placesVisited: new Set(),
                threatsAvoided: 0
            }
        };
    }

    logActivity(type, data = {}) {
        const location = window.contextEngine?.context?.currentArea || data.area || 'unknown';
        this.session.activities.push({
            type,
            data,
            timestamp: Date.now(),
            location
        });

        if (this.session.activities.length > 500) {
            this.session.activities.shift();
        }

        this.updateStats(type, data);
    }

    updateStats(type, data) {
        switch (type) {
            case 'price_check':
                this.session.stats.priceChecks += 1;
                break;
            case 'negotiation_complete':
                this.session.stats.negotiations += 1;
                if (data.saved) this.session.stats.totalSaved += Number(data.saved) || 0;
                break;
            case 'poi_visited': {
                const id = data.poiId || data.poiName;
                if (id) this.session.stats.placesVisited.add(id);
                break;
            }
            case 'threat_avoided':
                this.session.stats.threatsAvoided += 1;
                break;
            default:
                break;
        }
    }

    generateSummary() {
        const duration = Date.now() - this.session.startTime;
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

        const negotiations = this.session.activities.filter((a) => a.type === 'negotiation_complete');
        const successRate = negotiations.length
            ? (negotiations.filter((n) => n.data.success).length / negotiations.length) * 100
            : 0;

        const itemStats = {};
        negotiations.forEach((n) => {
            const item = n.data.itemType || 'unknown';
            if (!itemStats[item]) itemStats[item] = { count: 0, totalSaved: 0 };
            itemStats[item].count += 1;
            itemStats[item].totalSaved += n.data.saved || 0;
        });

        const bestCategory = Object.entries(itemStats)
            .sort((a, b) => b[1].totalSaved - a[1].totalSaved)[0];

        const areas = [...new Set(this.session.activities.map((a) => a.location).filter(Boolean))];

        return {
            duration: { hours, minutes },
            stats: {
                priceChecks: this.session.stats.priceChecks,
                negotiations: this.session.stats.negotiations,
                totalSaved: this.session.stats.totalSaved,
                placesVisited: this.session.stats.placesVisited,
                placesVisitedCount: this.session.stats.placesVisited.size,
                threatsAvoided: this.session.stats.threatsAvoided
            },
            performance: {
                successRate,
                bestCategory: bestCategory ? bestCategory[0] : 'none',
                avgSavingsPerNegotiation: this.session.stats.negotiations > 0
                    ? this.session.stats.totalSaved / this.session.stats.negotiations
                    : 0
            },
            areas,
            insights: this.generateInsights(bestCategory ? bestCategory[0] : null)
        };
    }

    generateInsights(bestCategory) {
        const insights = [];
        const negotiations = this.session.activities.filter((a) => a.type === 'negotiation_complete');
        const successRate = negotiations.length
            ? (negotiations.filter((n) => n.data.success).length / negotiations.length) * 100
            : 0;

        if (this.session.stats.totalSaved > 0) {
            insights.push({
                type: 'achievement',
                icon: '[+]',
                text: `You saved ${Math.round(this.session.stats.totalSaved)} DH this session.`
            });
        }

        if (successRate >= 70) {
            insights.push({
                type: 'success',
                icon: '[OK]',
                text: `Negotiation success rate is ${successRate.toFixed(0)}%.`
            });
        } else if (negotiations.length >= 2 && successRate < 40) {
            insights.push({
                type: 'improvement',
                icon: '[TIP]',
                text: 'Try stronger anchoring and firmer walk-away timing.'
            });
        }

        const jemaaNegotiations = negotiations.filter((n) => n.location === 'jemaa');
        if (jemaaNegotiations.length >= 2) {
            const jemaaSuccessRate = (jemaaNegotiations.filter((n) => n.data.success).length / jemaaNegotiations.length) * 100;
            if (jemaaSuccessRate < 50) {
                insights.push({
                    type: 'recommendation',
                    icon: '[DO]',
                    text: 'Try more aggressive tactics in Jemaa el-Fna.'
                });
            }
        }

        if (bestCategory && bestCategory !== 'none') {
            const displayName = window.ITEM_DISPLAY_NAMES?.[bestCategory] || bestCategory.replace(/_/g, ' ');
            insights.push({
                type: 'pattern',
                icon: '[PAT]',
                text: `You negotiate best on ${displayName}.`
            });
        }

        if (this.session.stats.threatsAvoided > 0) {
            insights.push({
                type: 'safety',
                icon: '[SAFE]',
                text: `Threat warnings handled: ${this.session.stats.threatsAvoided}.`
            });
        }

        return insights;
    }
}

function closeSessionSummary() {
    document.getElementById('session-summary-modal')?.remove();
}

function showSessionSummary() {
    if (!window.sessionIntel) return;

    closeSessionSummary();
    const summary = window.sessionIntel.generateSummary();
    const displayNames = window.ITEM_DISPLAY_NAMES || {};
    const priceUtils = window.ALIDADE_PRICE_UTILS;

    const insightsHtml = priceUtils && typeof priceUtils.buildSessionInsightsHtml === 'function'
        ? priceUtils.buildSessionInsightsHtml(summary.insights)
        : summary.insights.length > 0
            ? summary.insights.map((insight) => `
            <div class="flex items-start gap-3 bg-void-800 p-3 rounded">
                <div class="text-xl">${insight.icon}</div>
                <div class="text-sm text-zinc-300 leading-relaxed">${insight.text}</div>
            </div>
        `).join('')
            : '<div class="text-sm text-zinc-500 bg-void-800 p-3 rounded">Run a few scans or negotiations to unlock insights.</div>';

    const bestCategoryName = priceUtils && typeof priceUtils.resolveBestCategoryName === 'function'
        ? priceUtils.resolveBestCategoryName(summary.performance.bestCategory, displayNames)
        : summary.performance.bestCategory !== 'none'
            ? (displayNames[summary.performance.bestCategory] || summary.performance.bestCategory.replace(/_/g, ' '))
            : null;

    const modal = priceUtils && typeof priceUtils.buildSessionSummaryModalHtml === 'function'
        ? priceUtils.buildSessionSummaryModalHtml(summary, insightsHtml, bestCategoryName)
        : `
        <div id="session-summary-modal" class="fixed inset-0 bg-black/90 flex items-center justify-center z-[120] p-4">
            <div class="bg-void-900 border border-signal-emerald max-w-md w-full rounded-lg overflow-hidden">
                <div class="bg-gradient-to-r from-signal-emerald to-signal-cyan p-6 text-center">
                    <div class="text-3xl mb-2">*</div>
                    <h2 class="text-2xl font-bold text-white">Session Summary</h2>
                    <p class="text-xs text-white/80 mt-1">
                        ${summary.duration.hours}h ${summary.duration.minutes}m active
                    </p>
                </div>
                <div class="p-6 space-y-4">
                    <div class="grid grid-cols-2 gap-3">
                        <div class="bg-void-800 p-4 rounded text-center">
                            <div class="text-3xl font-mono font-bold text-signal-amber">${Math.round(summary.stats.totalSaved)}</div>
                            <div class="text-xs text-zinc-400 mt-1">DH Saved</div>
                        </div>
                        <div class="bg-void-800 p-4 rounded text-center">
                            <div class="text-3xl font-mono font-bold text-signal-emerald">${summary.performance.successRate.toFixed(0)}%</div>
                            <div class="text-xs text-zinc-400 mt-1">Success Rate</div>
                        </div>
                        <div class="bg-void-800 p-4 rounded text-center">
                            <div class="text-3xl font-mono font-bold text-signal-cyan">${summary.stats.negotiations}</div>
                            <div class="text-xs text-zinc-400 mt-1">Negotiations</div>
                        </div>
                        <div class="bg-void-800 p-4 rounded text-center">
                            <div class="text-3xl font-mono font-bold text-purple-400">${summary.stats.placesVisitedCount}</div>
                            <div class="text-xs text-zinc-400 mt-1">Places Visited</div>
                        </div>
                    </div>

                    <div class="space-y-2">
                        <div class="text-xs text-zinc-500 font-mono uppercase">Insights</div>
                        ${insightsHtml}
                    </div>

                    ${bestCategoryName ? `
                    <div class="bg-gradient-to-r from-signal-emerald/10 to-signal-cyan/10 border border-signal-emerald/30 p-4 rounded">
                        <div class="text-xs text-signal-emerald font-mono uppercase mb-1">Best Category</div>
                        <div class="text-lg font-bold text-white">${bestCategoryName}</div>
                    </div>` : ''}

                    <div class="flex gap-3">
                        <button onclick="closeSessionSummary()" class="flex-1 bg-signal-emerald text-black font-bold py-3 rounded">
                            DONE
                        </button>
                        <button onclick="window.sessionIntel.reset(); closeSessionSummary();" class="flex-1 bg-void-800 text-zinc-300 border border-void-700 font-bold py-3 rounded">
                            NEW SESSION
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modal);
}

window.contextEngine = window.contextEngine || new UnifiedContextEngine();
window.sessionIntel = window.sessionIntel || new SessionIntelligence();
window.showSessionSummary = showSessionSummary;
window.closeSessionSummary = closeSessionSummary;
window.endSession = showSessionSummary;

if (window.contextEngine && typeof window.contextEngine.hydrateBaselineIntelFromGoldenRecord === 'function') {
    window.contextEngine.hydrateBaselineIntelFromGoldenRecord('startup');
}

if (!window.__ALIDADE_CONTEXT_GOLDEN_RECORD_BOUND__) {
    window.__ALIDADE_CONTEXT_GOLDEN_RECORD_BOUND__ = true;
    window.addEventListener('alidade:goldenRecordReady', () => {
        if (!window.contextEngine || typeof window.contextEngine.hydrateBaselineIntelFromGoldenRecord !== 'function') return;
        const updated = window.contextEngine.hydrateBaselineIntelFromGoldenRecord('event_ready');
        if (updated) {
            window.contextEngine.broadcastUpdate('baseline_intel');
        }
    });

    window.addEventListener('alidade:goldenRecordFailed', () => {
        if (!window.contextEngine) return;
        const minTrustToInclude = window.contextEngine.baselineIntelStore?.minTrustToInclude ?? 0.3;
        const securityState = window.__ALIDADE_RUNTIME_SECURITY_STATE__?.goldenRecord || {};
        const integrityStatus = String(securityState.status || 'degraded').toLowerCase();
        const warningCount = Number(securityState.validationWarningCount || 0);
        const checksumMode = securityState.checksumMode || null;

        window.contextEngine.baselineIntelStore = {
            ...window.contextEngine.baselineIntelStore,
            datasetVersion: null,
            loadedAt: null,
            integrityStatus,
            validationWarningCount: Number.isFinite(warningCount) ? warningCount : 0,
            checksumMode,
            criticalPoints: [],
            riskZones: [],
            threatTaxonomy: []
        };

        window.contextEngine.context.baselineIntel = {
            source: 'event_failed',
            datasetVersion: null,
            criticalPointsCount: 0,
            riskZonesCount: 0,
            minTrustToInclude,
            integrityStatus,
            validationWarningCount: Number.isFinite(warningCount) ? warningCount : 0,
            checksumMode
        };
        const restoredFromCache = typeof window.contextEngine.restoreContextFromCache === 'function'
            ? window.contextEngine.restoreContextFromCache('golden_record_failed', { allowWhenLocationPresent: true })
            : false;
        if (!restoredFromCache) {
            window.contextEngine.context.nearbyCriticalPoints = [];
            window.contextEngine.context.activeRiskZones = [];
            window.contextEngine.context.baselineThreats = [];
        }
        window.contextEngine.broadcastUpdate(restoredFromCache ? 'baseline_intel_failed_cache_restore' : 'baseline_intel_failed');
    });

    window.addEventListener('alidade:securityStateChanged', () => {
        if (!window.contextEngine || typeof window.contextEngine.resolveGoldenRecordIntegritySnapshot !== 'function') return;
        const currentBaselineIntel = window.contextEngine.context.baselineIntel;
        if (!currentBaselineIntel || typeof currentBaselineIntel !== 'object') return;

        const integrity = window.contextEngine.resolveGoldenRecordIntegritySnapshot();
        window.contextEngine.baselineIntelStore = {
            ...window.contextEngine.baselineIntelStore,
            integrityStatus: integrity.integrityStatus,
            validationWarningCount: integrity.validationWarningCount,
            checksumMode: integrity.checksumMode
        };
        window.contextEngine.context.baselineIntel = {
            ...currentBaselineIntel,
            integrityStatus: integrity.integrityStatus,
            validationWarningCount: integrity.validationWarningCount,
            checksumMode: integrity.checksumMode
        };
        window.contextEngine.broadcastUpdate('baseline_intel_security_state');
    });
}

window.analyzeWithContext = async function (deepAnalysis, itemCategory, location) {
    const priceUtils = window.ALIDADE_PRICE_UTILS;
    const context = priceUtils && typeof priceUtils.resolveFeatureContext === 'function'
        ? priceUtils.resolveFeatureContext(window.contextEngine, 'price_checker', null)
        : window.contextEngine?.getContext('price_checker') || null;
    const price = await calculateHybridPrice(deepAnalysis, itemCategory, location);
    if (priceUtils && typeof priceUtils.buildAnalyzeWithContextResponse === 'function') {
        return priceUtils.buildAnalyzeWithContextResponse(context, price);
    }
    return { context, price };
};

window.startNegotiationWithContext = function (askingPrice, itemType = 'other') {
    const priceUtils = window.ALIDADE_PRICE_UTILS;
    const context = priceUtils && typeof priceUtils.resolveFeatureContext === 'function'
        ? priceUtils.resolveFeatureContext(window.contextEngine, 'negotiation', {})
        : window.contextEngine?.getContext('negotiation') || {};
    if (priceUtils && typeof priceUtils.buildNegotiationWithContextResponse === 'function') {
        return priceUtils.buildNegotiationWithContextResponse(askingPrice, itemType, context);
    }
    return {
        askingPrice,
        itemType,
        context,
        recommendedTactics: context.recommendedTactics || []
    };
};

})(typeof window !== 'undefined' ? window : null);
