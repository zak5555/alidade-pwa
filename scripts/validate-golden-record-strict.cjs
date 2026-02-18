#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_FILE = 'golden-record-v1.0.2.json';
const INPUT_FILE = process.argv[2] || DEFAULT_FILE;
const TARGET_PATH = path.resolve(process.cwd(), INPUT_FILE);

const MOROCCO_BOUNDS = Object.freeze({
    latMin: 20,
    latMax: 36.5,
    lngMin: -18,
    lngMax: -0.5
});

const MARRAKECH_HINT_BOUNDS = Object.freeze({
    latMin: 31.45,
    latMax: 31.8,
    lngMin: -8.2,
    lngMax: -7.75
});

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const SEMVER_RE = /^\d+\.\d+\.\d+$/;
const HEX_64_RE = /^[a-f0-9]{64}$/i;
const GEOHASH7_RE = /^[0-9bcdefghjkmnpqrstuvwxyz]{7}$/i;

const ALLOWED_CHANNELS = new Set(['call', 'sms', 'whatsapp']);
const ALLOWED_URGENCY = new Set(['low', 'medium', 'high', 'critical']);
const ALLOWED_BACKOFF = new Set(['linear', 'exponential']);
const ALLOWED_SOURCE_TIERS = new Set([
    'tier_1_institutional',
    'tier_2_verified_local',
    'tier_3_osint',
    'tier_4_unverified'
]);

const errors = [];
const warnings = [];

function pushError(pathKey, message) {
    errors.push({ path: pathKey, message });
}

function pushWarning(pathKey, message) {
    warnings.push({ path: pathKey, message });
}

function isObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
}

function isInt(value) {
    return Number.isInteger(value);
}

function isIsoUtc(value) {
    return isNonEmptyString(value) && ISO_DATE_RE.test(value.trim());
}

function parseIso(value) {
    const ts = Date.parse(value);
    return Number.isNaN(ts) ? null : ts;
}

function inRange(value, min, max) {
    return isFiniteNumber(value) && value >= min && value <= max;
}

function inBounds(lat, lng, bounds) {
    return inRange(lat, bounds.latMin, bounds.latMax) && inRange(lng, bounds.lngMin, bounds.lngMax);
}

function validateSources(sources, basePath) {
    if (!Array.isArray(sources) || sources.length === 0) {
        pushError(basePath, 'sources must be a non-empty array');
        return;
    }

    sources.forEach((source, index) => {
        const sourcePath = `${basePath}[${index}]`;
        if (!isObject(source)) {
            pushError(sourcePath, 'source entry must be an object');
            return;
        }

        if (!isNonEmptyString(source.url) || !/^https?:\/\//i.test(source.url.trim())) {
            pushError(`${sourcePath}.url`, 'must be a valid http(s) URL');
        }

        if (!isNonEmptyString(source.tier)) {
            pushError(`${sourcePath}.tier`, 'must be a non-empty string');
        } else if (!ALLOWED_SOURCE_TIERS.has(source.tier.trim())) {
            pushWarning(`${sourcePath}.tier`, `unexpected tier "${source.tier}"`);
        }

        if (!isFiniteNumber(source.weight) || source.weight <= 0 || source.weight > 1) {
            pushError(`${sourcePath}.weight`, 'must be a number in (0, 1]');
        }

        if (!isIsoUtc(source.accessed_at)) {
            pushError(`${sourcePath}.accessed_at`, 'must be ISO-8601 UTC (YYYY-MM-DDTHH:mm:ss[.sss]Z)');
        }
    });
}

function validateChecksum(payload, metadata) {
    const declared = String(metadata.checksum_sha256 || '').trim().toLowerCase();
    if (!HEX_64_RE.test(declared)) {
        pushError('metadata.checksum_sha256', 'must be a 64-char hex string');
        return;
    }

    const clone = JSON.parse(JSON.stringify(payload));
    delete clone.metadata.checksum_sha256;
    const compact = crypto.createHash('sha256').update(JSON.stringify(clone)).digest('hex');
    const pretty = crypto.createHash('sha256').update(JSON.stringify(clone, null, 2)).digest('hex');

    if (declared !== compact && declared !== pretty) {
        pushError('metadata.checksum_sha256', `mismatch (declared=${declared}, compact=${compact}, pretty=${pretty})`);
    }

    const howToVerify = Array.isArray(metadata.checksum_how_to_verify) ? metadata.checksum_how_to_verify.join(' ') : '';
    if (/JSON\.stringify\(doc,\s*null,\s*2\)/i.test(howToVerify) && declared === compact && declared !== pretty) {
        pushWarning(
            'metadata.checksum_how_to_verify',
            'documentation says pretty serialization, but checksum currently matches compact serialization'
        );
    }
}

function validateMetadata(payload, nowTs) {
    const metadata = payload.metadata;
    if (!isObject(metadata)) {
        pushError('metadata', 'must be an object');
        return null;
    }

    if (!isNonEmptyString(metadata.dataset_version) || !SEMVER_RE.test(metadata.dataset_version.trim())) {
        pushError('metadata.dataset_version', 'must follow semantic version format x.y.z');
    }

    if (!isIsoUtc(metadata.generated_at)) {
        pushError('metadata.generated_at', 'must be ISO-8601 UTC');
    } else {
        const generatedTs = parseIso(metadata.generated_at);
        if (generatedTs !== null && generatedTs > nowTs + 5 * 60 * 1000) {
            pushError('metadata.generated_at', 'cannot be in the future');
        }
    }

    if (!isNonEmptyString(metadata.coverage_area)) {
        pushWarning('metadata.coverage_area', 'is missing or empty');
    }

    if (!Array.isArray(metadata.source_files) || metadata.source_files.length === 0) {
        pushError('metadata.source_files', 'must be a non-empty array');
    }

    if (!isNonEmptyString(metadata.validation_status)) {
        pushWarning('metadata.validation_status', 'is missing or empty');
    }

    if (Object.prototype.hasOwnProperty.call(metadata, 'patched_at')) {
        if (!isIsoUtc(metadata.patched_at)) {
            pushError('metadata.patched_at', 'must be ISO-8601 UTC when present');
        } else if (isIsoUtc(metadata.generated_at)) {
            const generatedTs = parseIso(metadata.generated_at);
            const patchedTs = parseIso(metadata.patched_at);
            if (generatedTs !== null && patchedTs !== null && patchedTs < generatedTs) {
                pushError('metadata.patched_at', 'cannot be earlier than metadata.generated_at');
            }
        }
    }

    if (!isNonEmptyString(metadata.checksum_algorithm) || metadata.checksum_algorithm.trim().toUpperCase() !== 'SHA-256') {
        pushError('metadata.checksum_algorithm', 'must be "SHA-256"');
    }

    if (!isNonEmptyString(metadata.checksum_covers)) {
        pushWarning('metadata.checksum_covers', 'is missing or empty');
    }

    validateChecksum(payload, metadata);
    return metadata;
}

function validatePolicyConfig(payload) {
    const policy = payload.policy_config;
    if (!isObject(policy)) {
        pushError('policy_config', 'must be an object');
        return null;
    }

    const riskScoring = policy.risk_scoring;
    if (!isObject(riskScoring)) {
        pushError('policy_config.risk_scoring', 'must be an object');
    } else {
        const bw = riskScoring.baseline_weight;
        const rw = riskScoring.realtime_event_weight;
        const threshold = riskScoring.confidence_threshold;

        if (!inRange(bw, 0, 1)) pushError('policy_config.risk_scoring.baseline_weight', 'must be in [0,1]');
        if (!inRange(rw, 0, 1)) pushError('policy_config.risk_scoring.realtime_event_weight', 'must be in [0,1]');
        if (isFiniteNumber(bw) && isFiniteNumber(rw)) {
            const sum = bw + rw;
            if (Math.abs(sum - 1) > 0.000001) {
                pushError('policy_config.risk_scoring', `weights must sum to 1 (got ${sum})`);
            }
        }
        if (!inRange(threshold, 0, 1)) {
            pushError('policy_config.risk_scoring.confidence_threshold', 'must be in [0,1]');
        }
        if (!isNonEmptyString(riskScoring.decay_function)) {
            pushError('policy_config.risk_scoring.decay_function', 'must be a non-empty string');
        }
        if (!isInt(riskScoring.decay_half_life_hours) || riskScoring.decay_half_life_hours <= 0) {
            pushError('policy_config.risk_scoring.decay_half_life_hours', 'must be a positive integer');
        }
        if (!isInt(riskScoring.min_events_for_confidence) || riskScoring.min_events_for_confidence < 1) {
            pushError('policy_config.risk_scoring.min_events_for_confidence', 'must be an integer >= 1');
        }
    }

    const freshness = policy.data_freshness;
    if (!isObject(freshness)) {
        pushError('policy_config.data_freshness', 'must be an object');
    } else {
        Object.entries(freshness).forEach(([key, value]) => {
            if (!isInt(value) || value <= 0) {
                pushError(`policy_config.data_freshness.${key}`, 'must be a positive integer (days)');
            }
        });
    }

    const ingestion = policy.ingestion_queue;
    if (!isObject(ingestion)) {
        pushError('policy_config.ingestion_queue', 'must be an object');
    } else {
        if (!isInt(ingestion.batch_size) || ingestion.batch_size <= 0) {
            pushError('policy_config.ingestion_queue.batch_size', 'must be a positive integer');
        }
        if (!isInt(ingestion.flush_interval_ms) || ingestion.flush_interval_ms < 1000) {
            pushError('policy_config.ingestion_queue.flush_interval_ms', 'must be an integer >= 1000');
        }

        const priorities = ingestion.priority_tiers;
        if (!isObject(priorities)) {
            pushError('policy_config.ingestion_queue.priority_tiers', 'must be an object');
        } else {
            const vals = Object.values(priorities);
            vals.forEach((value, idx) => {
                if (!isInt(value) || value < 1) {
                    pushError(`policy_config.ingestion_queue.priority_tiers[${idx}]`, 'must be positive integers');
                }
            });
            if (new Set(vals).size !== vals.length) {
                pushError('policy_config.ingestion_queue.priority_tiers', 'priority values must be unique');
            }
        }

        const retry = ingestion.retry_strategy;
        if (!isObject(retry) || !isObject(retry.default)) {
            pushError('policy_config.ingestion_queue.retry_strategy.default', 'must be an object');
        } else {
            const defaultRetry = retry.default;
            if (!isInt(defaultRetry.max_retry_attempts) || defaultRetry.max_retry_attempts < 1) {
                pushError('policy_config.ingestion_queue.retry_strategy.default.max_retry_attempts', 'must be >= 1');
            }
            if (!isInt(defaultRetry.retry_backoff_ms) || defaultRetry.retry_backoff_ms < 1) {
                pushError('policy_config.ingestion_queue.retry_strategy.default.retry_backoff_ms', 'must be >= 1');
            }
            if (!ALLOWED_BACKOFF.has(defaultRetry.backoff_type)) {
                pushError('policy_config.ingestion_queue.retry_strategy.default.backoff_type', 'must be linear|exponential');
            }
        }

        if (isObject(retry) && isObject(retry.sos_event) && isObject(retry.default)) {
            if (
                isInt(retry.default.max_retry_attempts) &&
                isInt(retry.sos_event.max_retry_attempts) &&
                retry.sos_event.max_retry_attempts < retry.default.max_retry_attempts
            ) {
                pushError(
                    'policy_config.ingestion_queue.retry_strategy.sos_event.max_retry_attempts',
                    'must be >= default.max_retry_attempts'
                );
            }
        }
    }

    const geospatial = policy.geospatial;
    if (!isObject(geospatial)) {
        pushError('policy_config.geospatial', 'must be an object');
    } else {
        if (!isInt(geospatial.geohash_precision) || geospatial.geohash_precision < 5 || geospatial.geohash_precision > 12) {
            pushError('policy_config.geospatial.geohash_precision', 'must be an integer in [5,12]');
        }
        ['risk_aggregation_radius_m', 'safe_zone_radius_m', 'grid_cell_size_m'].forEach((field) => {
            if (!isFiniteNumber(geospatial[field]) || geospatial[field] <= 0) {
                pushError(`policy_config.geospatial.${field}`, 'must be a positive number');
            }
        });
    }

    const trust = policy.trust_thresholds;
    if (!isObject(trust)) {
        pushError('policy_config.trust_thresholds', 'must be an object');
    } else {
        const incoming = trust.incoming_crowd_events;
        if (!isObject(incoming)) {
            pushError('policy_config.trust_thresholds.incoming_crowd_events', 'must be an object');
        } else {
            const a = incoming.reject_below;
            const b = incoming.require_human_review_below;
            const c = incoming.min_to_auto_accept;
            if (!inRange(a, 0, 1) || !inRange(b, 0, 1) || !inRange(c, 0, 1)) {
                pushError('policy_config.trust_thresholds.incoming_crowd_events', 'all thresholds must be in [0,1]');
            } else if (!(a <= b && b <= c)) {
                pushError('policy_config.trust_thresholds.incoming_crowd_events', 'must satisfy reject <= review <= auto_accept');
            }
        }

        const baseline = trust.baseline_static_records;
        if (!isObject(baseline)) {
            pushError('policy_config.trust_thresholds.baseline_static_records', 'must be an object');
        } else {
            const include = baseline.min_to_include;
            const review = baseline.flag_for_review_below;
            if (!inRange(include, 0, 1) || !inRange(review, 0, 1)) {
                pushError('policy_config.trust_thresholds.baseline_static_records', 'thresholds must be in [0,1]');
            } else if (include > review) {
                pushError('policy_config.trust_thresholds.baseline_static_records', 'min_to_include must be <= flag_for_review_below');
            }
        }

        const riskEngine = trust.risk_engine;
        if (!isObject(riskEngine)) {
            pushError('policy_config.trust_thresholds.risk_engine', 'must be an object');
        } else {
            const display = riskEngine.min_confidence_to_display;
            const alert = riskEngine.min_confidence_to_alert;
            const trustMin = riskEngine.min_trust_for_risk_update;
            if (!inRange(display, 0, 1) || !inRange(alert, 0, 1) || !inRange(trustMin, 0, 1)) {
                pushError('policy_config.trust_thresholds.risk_engine', 'thresholds must be in [0,1]');
            } else if (display > alert) {
                pushError('policy_config.trust_thresholds.risk_engine', 'min_confidence_to_display must be <= min_confidence_to_alert');
            }
        }
    }

    return policy;
}

function validateSosContacts(payload, policy) {
    const list = payload.sos_contacts_official;
    if (!Array.isArray(list) || list.length === 0) {
        pushError('sos_contacts_official', 'must be a non-empty array');
        return;
    }

    const seenService = new Set();
    const seenDial = new Set();
    const baselineMinTrust = policy?.trust_thresholds?.baseline_static_records?.min_to_include;

    list.forEach((row, index) => {
        const rowPath = `sos_contacts_official[${index}]`;
        if (!isObject(row)) {
            pushError(rowPath, 'row must be an object');
            return;
        }

        if (!isNonEmptyString(row.service_name)) {
            pushError(`${rowPath}.service_name`, 'must be a non-empty string');
        } else {
            const key = row.service_name.trim().toLowerCase();
            if (seenService.has(key)) pushWarning(`${rowPath}.service_name`, 'duplicate service_name');
            seenService.add(key);
        }

        if (!isNonEmptyString(row.channel) || !ALLOWED_CHANNELS.has(row.channel.trim().toLowerCase())) {
            pushError(`${rowPath}.channel`, 'must be one of: call|sms|whatsapp');
        }

        if (!Array.isArray(row.languages) || row.languages.length === 0) {
            pushError(`${rowPath}.languages`, 'must be a non-empty array');
        }

        if (!isNonEmptyString(row.dial_local) || !/^\d{2,12}$/.test(row.dial_local.trim())) {
            pushError(`${rowPath}.dial_local`, 'must be numeric with 2-12 digits');
        } else {
            const dialKey = row.dial_local.trim();
            const duplicateKey = `${dialKey}:${String(row.channel || '').toLowerCase()}`;
            if (seenDial.has(duplicateKey)) pushWarning(`${rowPath}.dial_local`, `duplicate dial/channel pair ${duplicateKey}`);
            seenDial.add(duplicateKey);
        }

        if (row.phone_e164 !== null && row.phone_e164 !== undefined) {
            if (!isNonEmptyString(row.phone_e164) || !/^\+\d{8,15}$/.test(row.phone_e164.trim())) {
                pushError(`${rowPath}.phone_e164`, 'must be null or E.164 format +[8-15 digits]');
            }
        }

        if (!isIsoUtc(row.validated_at)) {
            pushError(`${rowPath}.validated_at`, 'must be ISO-8601 UTC');
        }

        if (!inRange(row.aggregate_trust_score, 0, 1)) {
            pushError(`${rowPath}.aggregate_trust_score`, 'must be in [0,1]');
        } else if (isFiniteNumber(baselineMinTrust) && row.aggregate_trust_score < baselineMinTrust) {
            pushError(`${rowPath}.aggregate_trust_score`, `must be >= baseline min_to_include (${baselineMinTrust})`);
        }

        validateSources(row.sources, `${rowPath}.sources`);
    });
}

function validateCriticalPoints(payload, policy) {
    const list = payload.critical_points;
    if (!Array.isArray(list) || list.length === 0) {
        pushError('critical_points', 'must be a non-empty array');
        return;
    }

    const seenId = new Set();
    const baselineMinTrust = policy?.trust_thresholds?.baseline_static_records?.min_to_include;
    let inMarrakechHint = 0;

    list.forEach((row, index) => {
        const rowPath = `critical_points[${index}]`;
        if (!isObject(row)) {
            pushError(rowPath, 'row must be an object');
            return;
        }

        if (!isNonEmptyString(row.point_id) || !/^[a-z0-9_-]+$/i.test(row.point_id.trim())) {
            pushError(`${rowPath}.point_id`, 'must be alphanumeric/underscore/hyphen');
        } else {
            const pointId = row.point_id.trim().toLowerCase();
            if (seenId.has(pointId)) pushError(`${rowPath}.point_id`, `duplicate point_id ${pointId}`);
            seenId.add(pointId);
        }

        if (!isNonEmptyString(row.type)) {
            pushError(`${rowPath}.type`, 'must be a non-empty string');
        }
        if (!isNonEmptyString(row.name)) {
            pushError(`${rowPath}.name`, 'must be a non-empty string');
        }

        if (!inRange(row.lat, -90, 90) || !inRange(row.lng, -180, 180)) {
            pushError(`${rowPath}.lat/lng`, 'must be valid coordinates');
        } else {
            if (!inBounds(row.lat, row.lng, MOROCCO_BOUNDS)) {
                pushError(`${rowPath}.lat/lng`, 'must be within Morocco bounds');
            }
            if (inBounds(row.lat, row.lng, MARRAKECH_HINT_BOUNDS)) {
                inMarrakechHint += 1;
            }
        }

        if (!isIsoUtc(row.validated_at)) {
            pushError(`${rowPath}.validated_at`, 'must be ISO-8601 UTC');
        }

        const hasDial = isNonEmptyString(row.dial_local) && /^\d{2,12}$/.test(row.dial_local.trim());
        const hasE164 = isNonEmptyString(row.phone_e164) && /^\+\d{8,15}$/.test(row.phone_e164.trim());
        if (!hasDial && !hasE164) {
            pushError(`${rowPath}.dial_local/phone_e164`, 'at least one callable number is required');
        }
        if (row.phone_e164 !== null && row.phone_e164 !== undefined && !hasE164) {
            pushError(`${rowPath}.phone_e164`, 'must be null or E.164 format');
        }

        if (typeof row.verified_phone !== 'boolean') {
            if (!isNonEmptyString(row.verified_phone) || !/^\+\d{8,15}$/.test(row.verified_phone.trim())) {
                pushError(`${rowPath}.verified_phone`, 'must be boolean or E.164 string');
            }
        }

        if (!inRange(row.aggregate_trust_score, 0, 1)) {
            pushError(`${rowPath}.aggregate_trust_score`, 'must be in [0,1]');
        } else if (isFiniteNumber(baselineMinTrust) && row.aggregate_trust_score < baselineMinTrust) {
            pushError(`${rowPath}.aggregate_trust_score`, `must be >= baseline min_to_include (${baselineMinTrust})`);
        }

        validateSources(row.sources, `${rowPath}.sources`);
    });

    if (inMarrakechHint === 0) {
        pushWarning('critical_points', 'no points found in Marrakech hint bounds (dataset might target another city)');
    }
}

function validateRiskZones(payload, policy, taxonomyCodes) {
    const list = payload.baseline_risk_zones;
    if (!Array.isArray(list) || list.length === 0) {
        pushError('baseline_risk_zones', 'must be a non-empty array');
        return;
    }

    const riskScoringThreshold = policy?.risk_scoring?.confidence_threshold;
    const maxAgeDays = policy?.data_freshness?.baseline_max_age_days;
    const baselineMinTrust = policy?.trust_thresholds?.baseline_static_records?.min_to_include;
    const seenNames = new Set();

    list.forEach((row, index) => {
        const rowPath = `baseline_risk_zones[${index}]`;
        if (!isObject(row)) {
            pushError(rowPath, 'row must be an object');
            return;
        }

        if (!isNonEmptyString(row.area_name)) {
            pushError(`${rowPath}.area_name`, 'must be a non-empty string');
        } else {
            const key = row.area_name.trim().toLowerCase();
            if (seenNames.has(key)) pushWarning(`${rowPath}.area_name`, 'duplicate area_name');
            seenNames.add(key);
        }

        if (!inRange(row.baseline_score, 0, 1)) {
            pushError(`${rowPath}.baseline_score`, 'must be in [0,1]');
        }
        if (!inRange(row.confidence, 0, 1)) {
            pushError(`${rowPath}.confidence`, 'must be in [0,1]');
        }

        if (!Array.isArray(row.threat_types) || row.threat_types.length === 0) {
            pushError(`${rowPath}.threat_types`, 'must be a non-empty array');
        } else {
            row.threat_types.forEach((threat, tIndex) => {
                if (!isNonEmptyString(threat)) {
                    pushError(`${rowPath}.threat_types[${tIndex}]`, 'must be a non-empty string');
                    return;
                }
                if (!taxonomyCodes.has(threat.trim())) {
                    pushError(`${rowPath}.threat_types[${tIndex}]`, `unknown threat code "${threat}"`);
                }
            });
        }

        if (!isIsoUtc(row.validated_at)) {
            pushError(`${rowPath}.validated_at`, 'must be ISO-8601 UTC');
        }
        if (!isIsoUtc(row.expires_at)) {
            pushError(`${rowPath}.expires_at`, 'must be ISO-8601 UTC');
        }
        if (isIsoUtc(row.validated_at) && isIsoUtc(row.expires_at)) {
            const validated = parseIso(row.validated_at);
            const expires = parseIso(row.expires_at);
            if (validated !== null && expires !== null) {
                if (expires <= validated) {
                    pushError(`${rowPath}.expires_at`, 'must be later than validated_at');
                }
                if (isInt(maxAgeDays)) {
                    const diffDays = Math.round((expires - validated) / (24 * 60 * 60 * 1000));
                    if (diffDays > maxAgeDays) {
                        pushError(`${rowPath}.expires_at`, `exceeds baseline_max_age_days (${maxAgeDays})`);
                    }
                }
            }
        }

        if (!isNonEmptyString(row.geohash7) || !GEOHASH7_RE.test(row.geohash7.trim())) {
            pushError(`${rowPath}.geohash7`, 'must be a valid 7-char geohash');
        }

        if (!Array.isArray(row.grid_coverage) || row.grid_coverage.length === 0) {
            pushError(`${rowPath}.grid_coverage`, 'must be a non-empty array');
        } else {
            row.grid_coverage.forEach((cell, cIndex) => {
                if (!isNonEmptyString(cell) || !GEOHASH7_RE.test(cell.trim())) {
                    pushError(`${rowPath}.grid_coverage[${cIndex}]`, 'must be a valid 7-char geohash');
                }
            });
        }

        if (!isObject(row.geometry)) {
            pushError(`${rowPath}.geometry`, 'must be an object');
        } else if (row.geometry.type === 'circle') {
            const center = row.geometry.center;
            if (!isObject(center) || !inRange(center.lat, -90, 90) || !inRange(center.lng, -180, 180)) {
                pushError(`${rowPath}.geometry.center`, 'must contain valid lat/lng');
            }
            if (!isFiniteNumber(row.geometry.radius_m) || row.geometry.radius_m <= 0) {
                pushError(`${rowPath}.geometry.radius_m`, 'must be a positive number');
            }
        } else if (!isNonEmptyString(row.geometry.type)) {
            pushError(`${rowPath}.geometry.type`, 'must be a non-empty string');
        }

        if (!inRange(row.aggregate_trust_score, 0, 1)) {
            pushError(`${rowPath}.aggregate_trust_score`, 'must be in [0,1]');
        } else if (isFiniteNumber(baselineMinTrust) && row.aggregate_trust_score < baselineMinTrust) {
            pushError(`${rowPath}.aggregate_trust_score`, `must be >= baseline min_to_include (${baselineMinTrust})`);
        }

        if (typeof row.low_confidence_warning !== 'boolean') {
            pushError(`${rowPath}.low_confidence_warning`, 'must be boolean');
        } else if (inRange(riskScoringThreshold, 0, 1)) {
            const expectedWarning = row.confidence < riskScoringThreshold;
            if (row.low_confidence_warning !== expectedWarning) {
                pushError(
                    `${rowPath}.low_confidence_warning`,
                    `must reflect confidence threshold ${riskScoringThreshold} (expected ${expectedWarning})`
                );
            }
        }

        validateSources(row.sources, `${rowPath}.sources`);
    });
}

function validateThreatTaxonomy(payload) {
    const list = payload.threat_taxonomy;
    if (!Array.isArray(list) || list.length === 0) {
        pushError('threat_taxonomy', 'must be a non-empty array');
        return new Set();
    }

    const seenCode = new Set();
    const codes = new Set();

    list.forEach((row, index) => {
        const rowPath = `threat_taxonomy[${index}]`;
        if (!isObject(row)) {
            pushError(rowPath, 'row must be an object');
            return;
        }

        if (!isNonEmptyString(row.threat_code) || !/^[a-z0-9_]+$/i.test(row.threat_code.trim())) {
            pushError(`${rowPath}.threat_code`, 'must be alphanumeric/underscore');
        } else {
            const code = row.threat_code.trim();
            if (seenCode.has(code)) pushError(`${rowPath}.threat_code`, `duplicate threat_code "${code}"`);
            seenCode.add(code);
            codes.add(code);
        }

        if (!isInt(row.severity_default) || row.severity_default < 1 || row.severity_default > 5) {
            pushError(`${rowPath}.severity_default`, 'must be an integer in [1,5]');
        }

        ['ui_label_ar', 'ui_label_fr', 'ui_label_en', 'recommended_action', 'category'].forEach((field) => {
            if (!isNonEmptyString(row[field])) {
                pushError(`${rowPath}.${field}`, 'must be a non-empty string');
            }
        });

        if (!isNonEmptyString(row.response_urgency) || !ALLOWED_URGENCY.has(row.response_urgency.trim().toLowerCase())) {
            pushError(`${rowPath}.response_urgency`, 'must be low|medium|high|critical');
        }

        if (typeof row.police_required !== 'boolean') {
            pushError(`${rowPath}.police_required`, 'must be boolean');
        }

        if (!Array.isArray(row.evidence_collection) || row.evidence_collection.length === 0) {
            pushWarning(`${rowPath}.evidence_collection`, 'should be a non-empty array');
        }
        if (!Array.isArray(row.escalation_triggers) || row.escalation_triggers.length === 0) {
            pushWarning(`${rowPath}.escalation_triggers`, 'should be a non-empty array');
        }
    });

    return codes;
}

function validateRootShape(payload) {
    if (!isObject(payload)) {
        pushError('$', 'dataset root must be an object');
        return;
    }

    const required = [
        'metadata',
        'policy_config',
        'sos_contacts_official',
        'critical_points',
        'baseline_risk_zones',
        'threat_taxonomy'
    ];

    required.forEach((key) => {
        if (!Object.prototype.hasOwnProperty.call(payload, key)) {
            pushError('$', `missing root key "${key}"`);
        }
    });
}

function run() {
    if (!fs.existsSync(TARGET_PATH)) {
        console.error(`[GOLDEN_RECORD_STRICT] FAIL`);
        console.error(JSON.stringify({
            file: TARGET_PATH,
            errors: [{ path: '$', message: 'file does not exist' }],
            warnings: []
        }, null, 2));
        process.exit(1);
    }

    let payload = null;
    try {
        payload = JSON.parse(fs.readFileSync(TARGET_PATH, 'utf8'));
    } catch (error) {
        console.error('[GOLDEN_RECORD_STRICT] FAIL');
        console.error(JSON.stringify({
            file: TARGET_PATH,
            errors: [{ path: '$', message: `invalid JSON: ${error.message}` }],
            warnings: []
        }, null, 2));
        process.exit(1);
    }

    const nowTs = Date.now();
    validateRootShape(payload);
    const metadata = validateMetadata(payload, nowTs);
    const policy = validatePolicyConfig(payload);
    const taxonomyCodes = validateThreatTaxonomy(payload);
    validateSosContacts(payload, policy);
    validateCriticalPoints(payload, policy);
    validateRiskZones(payload, policy, taxonomyCodes);

    const summary = {
        file: path.relative(process.cwd(), TARGET_PATH),
        datasetVersion: metadata?.dataset_version || null,
        generatedAt: metadata?.generated_at || null,
        counts: {
            sos_contacts_official: Array.isArray(payload?.sos_contacts_official) ? payload.sos_contacts_official.length : 0,
            critical_points: Array.isArray(payload?.critical_points) ? payload.critical_points.length : 0,
            baseline_risk_zones: Array.isArray(payload?.baseline_risk_zones) ? payload.baseline_risk_zones.length : 0,
            threat_taxonomy: Array.isArray(payload?.threat_taxonomy) ? payload.threat_taxonomy.length : 0
        },
        errors,
        warnings
    };

    if (errors.length > 0) {
        console.error('[GOLDEN_RECORD_STRICT] FAIL');
        console.error(JSON.stringify(summary, null, 2));
        process.exit(1);
    }

    if (warnings.length > 0) {
        console.warn('[GOLDEN_RECORD_STRICT] PASS_WITH_WARNINGS');
    } else {
        console.log('[GOLDEN_RECORD_STRICT] PASS');
    }
    console.log(JSON.stringify(summary, null, 2));
}

run();
