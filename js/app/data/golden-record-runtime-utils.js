/**
 * ALIDADE Golden Record Runtime Utilities
 * Secure loader + checksum gate for golden-record datasets.
 */
(function bootstrapGoldenRecordRuntimeUtils(windowObj) {
    if (!windowObj) return;

    const goldenRecordUtils = windowObj.ALIDADE_GOLDEN_RECORD_UTILS || (windowObj.ALIDADE_GOLDEN_RECORD_UTILS = {});
    const runtimeState = windowObj.__ALIDADE_GOLDEN_RECORD_STATE__ || (windowObj.__ALIDADE_GOLDEN_RECORD_STATE__ = {
        status: 'idle',
        promise: null,
        error: null,
        meta: null
    });

    const REQUIRED_ROOT_KEYS = Object.freeze({
        metadata: 'object',
        policy_config: 'object',
        sos_contacts_official: 'array',
        critical_points: 'array',
        baseline_risk_zones: 'array',
        threat_taxonomy: 'array'
    });
    const ISO_UTC_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
    const SEMVER_REGEX = /^\d+\.\d+\.\d+$/;
    const GEOHASH7_REGEX = /^[0-9bcdefghjkmnpqrstuvwxyz]{7}$/i;
    const FUTURE_DRIFT_MS = 5 * 60 * 1000;
    const MOROCCO_BOUNDS = Object.freeze({
        latMin: 20,
        latMax: 36.5,
        lngMin: -18,
        lngMax: -0.5
    });

    function isObject(value) {
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function isNonEmptyString(value) {
        return typeof value === 'string' && value.trim().length > 0;
    }

    function isFiniteNumber(value) {
        return typeof value === 'number' && Number.isFinite(value);
    }

    function inRange(value, min, max) {
        return isFiniteNumber(value) && value >= min && value <= max;
    }

    function isIsoUtc(value) {
        if (!isNonEmptyString(value) || !ISO_UTC_REGEX.test(value.trim())) {
            return false;
        }
        return !Number.isNaN(Date.parse(value));
    }

    function validE164(value) {
        return isNonEmptyString(value) && /^\+\d{8,15}$/.test(value.trim());
    }

    function validDialLocal(value) {
        return isNonEmptyString(value) && /^\d{2,12}$/.test(value.trim());
    }

    function validateSourcesShape(list, pathPrefix, errors) {
        if (!Array.isArray(list) || list.length === 0) {
            errors.push(`${pathPrefix} must be a non-empty array`);
            return;
        }

        list.forEach((source, index) => {
            const sourcePrefix = `${pathPrefix}[${index}]`;
            if (!isObject(source)) {
                errors.push(`${sourcePrefix} must be an object`);
                return;
            }
            if (!isNonEmptyString(source.url) || !/^https?:\/\//i.test(source.url.trim())) {
                errors.push(`${sourcePrefix}.url must be a valid http(s) URL`);
            }
            if (!inRange(source.weight, 0, 1) || source.weight <= 0) {
                errors.push(`${sourcePrefix}.weight must be > 0 and <= 1`);
            }
            if (!isIsoUtc(source.accessed_at)) {
                errors.push(`${sourcePrefix}.accessed_at must be ISO-8601 UTC`);
            }
        });
    }

    function deepFreeze(value, seen = new WeakSet()) {
        if (!value || typeof value !== 'object' || seen.has(value)) return value;
        seen.add(value);

        Object.getOwnPropertyNames(value).forEach((key) => {
            deepFreeze(value[key], seen);
        });

        return Object.freeze(value);
    }

    function cloneWithoutChecksum(payload) {
        const clone = JSON.parse(JSON.stringify(payload || {}));
        if (clone.metadata && Object.prototype.hasOwnProperty.call(clone.metadata, 'checksum_sha256')) {
            delete clone.metadata.checksum_sha256;
        }
        return clone;
    }

    async function sha256Hex(text, localWindow) {
        const targetWindow = localWindow || windowObj;
        const cryptoObj = targetWindow.crypto;
        const TextEncoderCtor = targetWindow.TextEncoder || (typeof TextEncoder === 'function' ? TextEncoder : null);

        if (!cryptoObj || !cryptoObj.subtle || typeof cryptoObj.subtle.digest !== 'function') {
            throw new Error('SubtleCrypto SHA-256 is unavailable in this runtime');
        }
        if (!TextEncoderCtor) {
            throw new Error('TextEncoder is unavailable in this runtime');
        }

        const encoded = new TextEncoderCtor().encode(String(text || ''));
        const hashBuffer = await cryptoObj.subtle.digest('SHA-256', encoded);
        const bytes = new Uint8Array(hashBuffer);
        return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    }

    function serializeResult(status, extra = {}) {
        return {
            status,
            record: windowObj.ALIDADE_GOLDEN_RECORD || null,
            meta: runtimeState.meta,
            error: runtimeState.error,
            ...extra
        };
    }

    if (typeof goldenRecordUtils.getGoldenRecordState !== 'function') {
        goldenRecordUtils.getGoldenRecordState = function getGoldenRecordState() {
            return {
                status: runtimeState.status,
                hasRecord: Boolean(windowObj.ALIDADE_GOLDEN_RECORD),
                error: runtimeState.error ? String(runtimeState.error.message || runtimeState.error) : null,
                meta: runtimeState.meta
            };
        };
    }

    if (typeof goldenRecordUtils.getGoldenRecord !== 'function') {
        goldenRecordUtils.getGoldenRecord = function getGoldenRecord() {
            return windowObj.ALIDADE_GOLDEN_RECORD || null;
        };
    }

    if (typeof goldenRecordUtils.getGoldenRecordSection !== 'function') {
        goldenRecordUtils.getGoldenRecordSection = function getGoldenRecordSection(sectionName, fallback = null) {
            const record = windowObj.ALIDADE_GOLDEN_RECORD;
            if (!record || !Object.prototype.hasOwnProperty.call(record, sectionName)) {
                return fallback;
            }
            return record[sectionName];
        };
    }

    if (typeof goldenRecordUtils.validateGoldenRecordShape !== 'function') {
        goldenRecordUtils.validateGoldenRecordShape = function validateGoldenRecordShape(payload) {
            const errors = [];
            const warnings = [];

            if (!isObject(payload)) {
                return { ok: false, errors: ['Payload must be an object'], warnings };
            }

            Object.entries(REQUIRED_ROOT_KEYS).forEach(([key, expected]) => {
                const value = payload[key];
                if (expected === 'array' && !Array.isArray(value)) {
                    errors.push(`Missing or invalid array: ${key}`);
                    return;
                }
                if (expected === 'object' && !isObject(value)) {
                    errors.push(`Missing or invalid object: ${key}`);
                }
            });

            const metadata = payload.metadata || {};
            if (!isNonEmptyString(metadata.dataset_version) || !SEMVER_REGEX.test(metadata.dataset_version.trim())) {
                errors.push('metadata.dataset_version must be a semantic version string (x.y.z)');
            }
            if (!isIsoUtc(metadata.generated_at)) {
                errors.push('metadata.generated_at must be ISO-8601 UTC');
            } else if (Date.parse(metadata.generated_at) > Date.now() + FUTURE_DRIFT_MS) {
                errors.push('metadata.generated_at cannot be in the future');
            }
            if (
                typeof metadata.checksum_sha256 !== 'string' ||
                !/^[a-f0-9]{64}$/i.test(metadata.checksum_sha256.trim())
            ) {
                errors.push('metadata.checksum_sha256 must be a 64-char hex string');
            }

            const policy = payload.policy_config || {};
            const riskScoring = policy.risk_scoring || {};
            const trustThresholds = policy.trust_thresholds || {};
            const baselineTrust = trustThresholds?.baseline_static_records?.min_to_include;
            const baselineFlag = trustThresholds?.baseline_static_records?.flag_for_review_below;
            const riskConfidenceThreshold = riskScoring.confidence_threshold;
            const baselineWeight = riskScoring.baseline_weight;
            const realtimeWeight = riskScoring.realtime_event_weight;

            if (!inRange(riskConfidenceThreshold, 0, 1)) {
                errors.push('policy_config.risk_scoring.confidence_threshold must be in [0,1]');
            }
            if (!inRange(baselineTrust, 0, 1)) {
                errors.push('policy_config.trust_thresholds.baseline_static_records.min_to_include must be in [0,1]');
            }
            if (!inRange(baselineFlag, 0, 1)) {
                errors.push('policy_config.trust_thresholds.baseline_static_records.flag_for_review_below must be in [0,1]');
            }
            if (inRange(baselineTrust, 0, 1) && inRange(baselineFlag, 0, 1) && baselineTrust > baselineFlag) {
                errors.push('policy_config.trust_thresholds.baseline_static_records must satisfy min_to_include <= flag_for_review_below');
            }
            if (!inRange(baselineWeight, 0, 1) || !inRange(realtimeWeight, 0, 1)) {
                errors.push('policy_config.risk_scoring baseline/realtime weights must be in [0,1]');
            } else if (Math.abs((baselineWeight + realtimeWeight) - 1) > 0.000001) {
                errors.push('policy_config.risk_scoring baseline/realtime weights must sum to 1');
            }

            const taxonomyCodes = new Set();
            const seenThreatCodes = new Set();
            (Array.isArray(payload.threat_taxonomy) ? payload.threat_taxonomy : []).forEach((threat, index) => {
                const threatPrefix = `threat_taxonomy[${index}]`;
                if (!isObject(threat)) {
                    errors.push(`${threatPrefix} must be an object`);
                    return;
                }

                const code = isNonEmptyString(threat.threat_code) ? threat.threat_code.trim() : '';
                if (!code || !/^[a-z0-9_]+$/i.test(code)) {
                    errors.push(`${threatPrefix}.threat_code must be alphanumeric/underscore`);
                } else {
                    if (seenThreatCodes.has(code)) {
                        errors.push(`${threatPrefix}.threat_code duplicates "${code}"`);
                    }
                    seenThreatCodes.add(code);
                    taxonomyCodes.add(code);
                }

                if (!Number.isInteger(threat.severity_default) || threat.severity_default < 1 || threat.severity_default > 5) {
                    errors.push(`${threatPrefix}.severity_default must be an integer in [1,5]`);
                }
                if (!isNonEmptyString(threat.ui_label_en)) {
                    errors.push(`${threatPrefix}.ui_label_en must be a non-empty string`);
                }
                if (!isNonEmptyString(threat.recommended_action)) {
                    errors.push(`${threatPrefix}.recommended_action must be a non-empty string`);
                }
            });

            const seenServiceNames = new Set();
            (Array.isArray(payload.sos_contacts_official) ? payload.sos_contacts_official : []).forEach((entry, index) => {
                const entryPrefix = `sos_contacts_official[${index}]`;
                if (!isObject(entry)) {
                    errors.push(`${entryPrefix} must be an object`);
                    return;
                }

                if (!isNonEmptyString(entry.service_name)) {
                    errors.push(`${entryPrefix}.service_name must be a non-empty string`);
                } else {
                    const normalized = entry.service_name.trim().toLowerCase();
                    if (seenServiceNames.has(normalized)) {
                        warnings.push(`${entryPrefix}.service_name duplicates "${normalized}"`);
                    }
                    seenServiceNames.add(normalized);
                }

                if (!Array.isArray(entry.languages) || entry.languages.length === 0) {
                    errors.push(`${entryPrefix}.languages must be a non-empty array`);
                }
                if (!isNonEmptyString(entry.channel)) {
                    errors.push(`${entryPrefix}.channel must be a non-empty string`);
                }
                if (!validDialLocal(entry.dial_local)) {
                    errors.push(`${entryPrefix}.dial_local must be numeric (2-12 digits)`);
                }
                if (entry.phone_e164 !== null && entry.phone_e164 !== undefined && !validE164(entry.phone_e164)) {
                    errors.push(`${entryPrefix}.phone_e164 must be null or E.164 format`);
                }
                if (!isIsoUtc(entry.validated_at)) {
                    errors.push(`${entryPrefix}.validated_at must be ISO-8601 UTC`);
                }
                if (!inRange(entry.aggregate_trust_score, 0, 1)) {
                    errors.push(`${entryPrefix}.aggregate_trust_score must be in [0,1]`);
                } else if (inRange(baselineTrust, 0, 1) && entry.aggregate_trust_score < baselineTrust) {
                    errors.push(`${entryPrefix}.aggregate_trust_score below baseline trust threshold`);
                }

                validateSourcesShape(entry.sources, `${entryPrefix}.sources`, errors);
            });

            const seenPointIds = new Set();
            (Array.isArray(payload.critical_points) ? payload.critical_points : []).forEach((point, index) => {
                const pointPrefix = `critical_points[${index}]`;
                if (!isObject(point)) {
                    errors.push(`${pointPrefix} must be an object`);
                    return;
                }

                const pointId = isNonEmptyString(point.point_id) ? point.point_id.trim() : '';
                if (!pointId || !/^[a-z0-9_-]+$/i.test(pointId)) {
                    errors.push(`${pointPrefix}.point_id must be alphanumeric/underscore/hyphen`);
                } else if (seenPointIds.has(pointId)) {
                    errors.push(`${pointPrefix}.point_id duplicates "${pointId}"`);
                } else {
                    seenPointIds.add(pointId);
                }

                if (!isNonEmptyString(point.type)) {
                    errors.push(`${pointPrefix}.type must be a non-empty string`);
                }
                if (!isNonEmptyString(point.name)) {
                    errors.push(`${pointPrefix}.name must be a non-empty string`);
                }
                if (!inRange(point.lat, -90, 90) || !inRange(point.lng, -180, 180)) {
                    errors.push(`${pointPrefix}.lat/lng must be valid coordinates`);
                } else if (
                    !inRange(point.lat, MOROCCO_BOUNDS.latMin, MOROCCO_BOUNDS.latMax) ||
                    !inRange(point.lng, MOROCCO_BOUNDS.lngMin, MOROCCO_BOUNDS.lngMax)
                ) {
                    warnings.push(`${pointPrefix}.lat/lng is outside Morocco bounds`);
                }

                if (!isIsoUtc(point.validated_at)) {
                    errors.push(`${pointPrefix}.validated_at must be ISO-8601 UTC`);
                }
                if (!inRange(point.aggregate_trust_score, 0, 1)) {
                    errors.push(`${pointPrefix}.aggregate_trust_score must be in [0,1]`);
                } else if (inRange(baselineTrust, 0, 1) && point.aggregate_trust_score < baselineTrust) {
                    errors.push(`${pointPrefix}.aggregate_trust_score below baseline trust threshold`);
                }

                const hasCallableNumber = validDialLocal(point.dial_local) || validE164(point.phone_e164) || validE164(point.verified_phone);
                if (!hasCallableNumber) {
                    errors.push(`${pointPrefix} requires at least one callable number (dial_local|phone_e164|verified_phone)`);
                }
                if (point.phone_e164 !== null && point.phone_e164 !== undefined && !validE164(point.phone_e164)) {
                    errors.push(`${pointPrefix}.phone_e164 must be null or E.164 format`);
                }
                if (
                    point.verified_phone !== null &&
                    point.verified_phone !== undefined &&
                    typeof point.verified_phone !== 'boolean' &&
                    !validE164(point.verified_phone)
                ) {
                    errors.push(`${pointPrefix}.verified_phone must be boolean or E.164 format`);
                }

                validateSourcesShape(point.sources, `${pointPrefix}.sources`, errors);
            });

            const maxBaselineAgeDays = policy?.data_freshness?.baseline_max_age_days;
            (Array.isArray(payload.baseline_risk_zones) ? payload.baseline_risk_zones : []).forEach((zone, index) => {
                const zonePrefix = `baseline_risk_zones[${index}]`;
                if (!isObject(zone)) {
                    errors.push(`${zonePrefix} must be an object`);
                    return;
                }

                if (!isNonEmptyString(zone.area_name)) {
                    errors.push(`${zonePrefix}.area_name must be a non-empty string`);
                }
                if (!inRange(zone.baseline_score, 0, 1)) {
                    errors.push(`${zonePrefix}.baseline_score must be in [0,1]`);
                }
                if (!inRange(zone.confidence, 0, 1)) {
                    errors.push(`${zonePrefix}.confidence must be in [0,1]`);
                }

                if (!Array.isArray(zone.threat_types) || zone.threat_types.length === 0) {
                    errors.push(`${zonePrefix}.threat_types must be a non-empty array`);
                } else {
                    zone.threat_types.forEach((threatType, threatIndex) => {
                        if (!isNonEmptyString(threatType)) {
                            errors.push(`${zonePrefix}.threat_types[${threatIndex}] must be a non-empty string`);
                            return;
                        }
                        if (!taxonomyCodes.has(threatType.trim())) {
                            errors.push(`${zonePrefix}.threat_types[${threatIndex}] references unknown code "${threatType}"`);
                        }
                    });
                }

                if (!isIsoUtc(zone.validated_at)) {
                    errors.push(`${zonePrefix}.validated_at must be ISO-8601 UTC`);
                }
                if (!isIsoUtc(zone.expires_at)) {
                    errors.push(`${zonePrefix}.expires_at must be ISO-8601 UTC`);
                }
                if (isIsoUtc(zone.validated_at) && isIsoUtc(zone.expires_at)) {
                    const validatedAtTs = Date.parse(zone.validated_at);
                    const expiresAtTs = Date.parse(zone.expires_at);
                    if (expiresAtTs <= validatedAtTs) {
                        errors.push(`${zonePrefix}.expires_at must be later than validated_at`);
                    } else if (Number.isInteger(maxBaselineAgeDays)) {
                        const maxMs = maxBaselineAgeDays * 24 * 60 * 60 * 1000;
                        if ((expiresAtTs - validatedAtTs) > maxMs) {
                            errors.push(`${zonePrefix}.expires_at exceeds configured baseline_max_age_days`);
                        }
                    }
                }

                if (!isNonEmptyString(zone.geohash7) || !GEOHASH7_REGEX.test(zone.geohash7.trim())) {
                    errors.push(`${zonePrefix}.geohash7 must be a valid 7-char geohash`);
                }
                if (!Array.isArray(zone.grid_coverage) || zone.grid_coverage.length === 0) {
                    errors.push(`${zonePrefix}.grid_coverage must be a non-empty array`);
                } else {
                    zone.grid_coverage.forEach((cell, cellIndex) => {
                        if (!isNonEmptyString(cell) || !GEOHASH7_REGEX.test(cell.trim())) {
                            errors.push(`${zonePrefix}.grid_coverage[${cellIndex}] must be a valid 7-char geohash`);
                        }
                    });
                }

                if (!isObject(zone.geometry)) {
                    errors.push(`${zonePrefix}.geometry must be an object`);
                } else if (String(zone.geometry.type || '').toLowerCase() === 'circle') {
                    const center = zone.geometry.center;
                    if (!isObject(center) || !inRange(center.lat, -90, 90) || !inRange(center.lng, -180, 180)) {
                        errors.push(`${zonePrefix}.geometry.center must contain valid coordinates`);
                    }
                    if (!isFiniteNumber(zone.geometry.radius_m) || zone.geometry.radius_m <= 0) {
                        errors.push(`${zonePrefix}.geometry.radius_m must be a positive number`);
                    }
                }

                if (!inRange(zone.aggregate_trust_score, 0, 1)) {
                    errors.push(`${zonePrefix}.aggregate_trust_score must be in [0,1]`);
                } else if (inRange(baselineTrust, 0, 1) && zone.aggregate_trust_score < baselineTrust) {
                    errors.push(`${zonePrefix}.aggregate_trust_score below baseline trust threshold`);
                }

                if (typeof zone.low_confidence_warning !== 'boolean') {
                    errors.push(`${zonePrefix}.low_confidence_warning must be boolean`);
                } else if (inRange(riskConfidenceThreshold, 0, 1)) {
                    const expectedWarning = zone.confidence < riskConfidenceThreshold;
                    if (zone.low_confidence_warning !== expectedWarning) {
                        errors.push(`${zonePrefix}.low_confidence_warning inconsistent with confidence threshold`);
                    }
                }

                validateSourcesShape(zone.sources, `${zonePrefix}.sources`, errors);
            });

            return {
                ok: errors.length === 0,
                errors,
                warnings
            };
        };
    }

    if (typeof goldenRecordUtils.computeGoldenRecordChecksumHashes !== 'function') {
        goldenRecordUtils.computeGoldenRecordChecksumHashes = async function computeGoldenRecordChecksumHashes(payload, options = {}) {
            const targetWindow = options.windowObj || windowObj;
            const normalized = cloneWithoutChecksum(payload);
            const compactString = JSON.stringify(normalized);
            const prettyString = JSON.stringify(normalized, null, 2);

            const compact = await sha256Hex(compactString, targetWindow);
            const pretty = await sha256Hex(prettyString, targetWindow);
            return { compact, pretty };
        };
    }

    if (typeof goldenRecordUtils.verifyGoldenRecordChecksum !== 'function') {
        goldenRecordUtils.verifyGoldenRecordChecksum = async function verifyGoldenRecordChecksum(payload, options = {}) {
            const declared = String(payload?.metadata?.checksum_sha256 || '').trim().toLowerCase();
            if (!/^[a-f0-9]{64}$/.test(declared)) {
                return {
                    ok: false,
                    mode: null,
                    declared,
                    compact: null,
                    pretty: null
                };
            }

            const hashes = await goldenRecordUtils.computeGoldenRecordChecksumHashes(payload, options);
            const compact = String(hashes.compact || '').toLowerCase();
            const pretty = String(hashes.pretty || '').toLowerCase();
            const mode = declared === compact ? 'compact' : (declared === pretty ? 'pretty' : null);

            return {
                ok: Boolean(mode),
                mode,
                declared,
                compact,
                pretty
            };
        };
    }

    if (typeof goldenRecordUtils.ensureGoldenRecordLoaded !== 'function') {
        goldenRecordUtils.ensureGoldenRecordLoaded = function ensureGoldenRecordLoaded(options = {}) {
            if (runtimeState.status === 'ready' && windowObj.ALIDADE_GOLDEN_RECORD) {
                return Promise.resolve(serializeResult('ready'));
            }
            if (runtimeState.promise) {
                return runtimeState.promise;
            }

            const targetWindow = options.windowObj || windowObj;
            const logger = options.consoleObj || console;
            const fetchImpl = typeof options.fetchFn === 'function'
                ? options.fetchFn
                : (typeof targetWindow.fetch === 'function' ? targetWindow.fetch.bind(targetWindow) : null);
            const dataUrl = String(options.dataUrl || './golden-record-v1.0.2.json');
            const failOpen = options.failOpen !== false;

            if (!fetchImpl) {
                const missingFetchError = new Error('fetch is unavailable; cannot load golden record');
                runtimeState.status = 'failed';
                runtimeState.error = missingFetchError;
                return Promise.resolve(serializeResult('failed'));
            }

            runtimeState.status = 'loading';
            runtimeState.error = null;

            const requestPromise = fetchImpl(dataUrl, { cache: 'no-store' })
                .then((response) => {
                    if (!response || response.ok !== true) {
                        const status = response ? response.status : 'unknown';
                        throw new Error(`Golden record request failed (HTTP ${status})`);
                    }
                    return response.json();
                })
                .then(async (payload) => {
                    const shape = goldenRecordUtils.validateGoldenRecordShape(payload);
                    if (!shape.ok) {
                        throw new Error(`Golden record schema invalid: ${shape.errors.join('; ')}`);
                    }
                    if (Array.isArray(shape.warnings) && shape.warnings.length > 0) {
                        logger.warn(`[GOLDEN_RECORD] Schema warnings (${shape.warnings.length})`, shape.warnings.slice(0, 5));
                    }

                    const checksum = await goldenRecordUtils.verifyGoldenRecordChecksum(payload, { windowObj: targetWindow });
                    if (!checksum.ok) {
                        throw new Error(
                            `Golden record checksum mismatch (declared=${checksum.declared}, compact=${checksum.compact}, pretty=${checksum.pretty})`
                        );
                    }

                    const frozenRecord = options.freezeRecord === false ? payload : deepFreeze(payload);
                    const loadedAt = new Date().toISOString();
                    const metadata = frozenRecord.metadata || {};

                    windowObj.ALIDADE_GOLDEN_RECORD = frozenRecord;
                    runtimeState.status = 'ready';
                    runtimeState.error = null;
                    runtimeState.meta = {
                        dataUrl,
                        loadedAt,
                        datasetVersion: metadata.dataset_version || null,
                        generatedAt: metadata.generated_at || null,
                        checksumMode: checksum.mode,
                        checksumDeclared: checksum.declared,
                        checksumComputed: checksum.mode === 'pretty' ? checksum.pretty : checksum.compact,
                        validationWarningCount: Array.isArray(shape.warnings) ? shape.warnings.length : 0
                    };
                    windowObj.__ALIDADE_GOLDEN_RECORD_META__ = runtimeState.meta;

                    targetWindow.dispatchEvent(new CustomEvent('alidade:goldenRecordReady', {
                        detail: runtimeState.meta
                    }));

                    if (checksum.mode === 'pretty') {
                        logger.warn('[GOLDEN_RECORD] Loaded with pretty-serialized checksum compatibility mode');
                    }

                    return serializeResult('ready');
                })
                .catch((error) => {
                    runtimeState.status = 'failed';
                    runtimeState.error = error;
                    runtimeState.meta = {
                        dataUrl,
                        failedAt: new Date().toISOString()
                    };
                    windowObj.__ALIDADE_GOLDEN_RECORD_META__ = runtimeState.meta;

                    targetWindow.dispatchEvent(new CustomEvent('alidade:goldenRecordFailed', {
                        detail: {
                            dataUrl,
                            message: String(error?.message || error || 'unknown error')
                        }
                    }));

                    logger.warn('[GOLDEN_RECORD] Integrity gate failed:', error);

                    if (failOpen) {
                        return serializeResult('failed');
                    }
                    throw error;
                })
                .finally(() => {
                    runtimeState.promise = null;
                });

            runtimeState.promise = requestPromise;
            return requestPromise;
        };
    }
})(typeof window !== 'undefined' ? window : null);
