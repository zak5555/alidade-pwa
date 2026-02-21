#!/usr/bin/env node
'use strict';

const { createClient } = require('@supabase/supabase-js');

function getEnvValue(name) {
    if (process.env[name]) return String(process.env[name]).trim();
    const fallbackKey = Object.keys(process.env).find((key) => key.replace(/^\uFEFF/, '') === name);
    return fallbackKey ? String(process.env[fallbackKey] || '').trim() : '';
}

function findLastFlagValue(flagName) {
    let valueIndex = -1;
    for (let index = 2; index < process.argv.length; index += 1) {
        if (process.argv[index] === flagName) {
            valueIndex = index + 1;
        }
    }
    if (valueIndex === -1) return undefined;
    if (valueIndex >= process.argv.length) {
        throw new Error(`${flagName} requires a value`);
    }
    const value = process.argv[valueIndex];
    if (String(value).startsWith('--')) {
        throw new Error(`${flagName} requires a value`);
    }
    return value;
}

function parseStringFlag(flagName, fallback) {
    const value = findLastFlagValue(flagName);
    if (value === undefined) return fallback;
    return String(value || '').trim() || fallback;
}

function parseIntegerFlag(flagName, fallback, min, max) {
    const raw = findLastFlagValue(flagName);
    if (raw === undefined) return fallback;
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
        throw new Error(`${flagName} must be an integer in [${min}, ${max}]`);
    }
    return parsed;
}

function normalizeSupabaseUrl(rawUrl) {
    const normalized = String(rawUrl || '').trim();
    if (!normalized) return '';
    const withProtocol = /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`;
    try {
        const parsed = new URL(withProtocol);
        return `${parsed.origin}`.replace(/\/+$/, '');
    } catch (_error) {
        return '';
    }
}

function decodeBase64UrlJson(segment) {
    try {
        const normalized = String(segment || '').replace(/-/g, '+').replace(/_/g, '/');
        const paddingLength = (4 - (normalized.length % 4)) % 4;
        const padded = normalized + '='.repeat(paddingLength);
        const decoded = Buffer.from(padded, 'base64').toString('utf8');
        return JSON.parse(decoded);
    } catch (_error) {
        return null;
    }
}

function isLikelySupabaseServiceRoleKey(value) {
    const normalized = String(value || '').trim();
    if (!normalized) return false;

    if (/^sb_secret_[A-Za-z0-9_-]{20,}$/.test(normalized)) {
        return true;
    }

    const jwtParts = normalized.split('.');
    if (jwtParts.length === 3) {
        const payload = decodeBase64UrlJson(jwtParts[1]);
        if (payload && String(payload.role || '').toLowerCase() === 'service_role') {
            return true;
        }
    }
    return false;
}

function toIsoString(value) {
    const parsed = Date.parse(String(value || ''));
    if (!Number.isFinite(parsed)) return null;
    return new Date(parsed).toISOString();
}

function toEpochMs(value) {
    const parsed = Date.parse(String(value || ''));
    return Number.isFinite(parsed) ? parsed : null;
}

function createCheck(id, required, value, ok) {
    return {
        id,
        required,
        value,
        ok: Boolean(ok)
    };
}

function sampleDuplicateMetrics(rows) {
    const eventRuleCounts = new Map();
    const fingerprintStatusCounts = new Map();
    let duplicateEventRuleCount = 0;
    let duplicateFingerprintStatusCount = 0;

    for (const row of rows) {
        const eventId = String(row?.event_id || '').trim();
        const ruleVersion = String(row?.rule_version || '').trim() || 'v1';
        const fingerprint = String(row?.fingerprint || '').trim();
        const status = String(row?.status || '').trim() || 'unknown';

        const eventRuleKey = `${eventId}::${ruleVersion}`;
        if (eventId) {
            const next = (eventRuleCounts.get(eventRuleKey) || 0) + 1;
            eventRuleCounts.set(eventRuleKey, next);
            if (next === 2) duplicateEventRuleCount += 1;
        }

        if (status !== 'rejected' && fingerprint) {
            const fingerprintStatusKey = `${fingerprint}::${ruleVersion}::${status}`;
            const next = (fingerprintStatusCounts.get(fingerprintStatusKey) || 0) + 1;
            fingerprintStatusCounts.set(fingerprintStatusKey, next);
            if (next === 2) duplicateFingerprintStatusCount += 1;
        }
    }

    return {
        duplicateEventRuleCount,
        duplicateFingerprintStatusCount
    };
}

function writeGithubOutput(report) {
    const outputPath = process.env.GITHUB_OUTPUT;
    if (!outputPath) return false;

    const fs = require('fs');
    const lines = [];
    lines.push(`points_projector_health_ok=${report.ok ? 'true' : 'false'}`);
    lines.push(`points_projector_lag_rows=${report.metrics.lagRows}`);
    lines.push(`points_projector_lag_seconds=${report.metrics.lagSeconds}`);
    lines.push(`points_projector_cursor=${report.metrics.cursorId}`);
    lines.push(`points_projector_latest_stream_id=${report.metrics.latestStreamId}`);
    lines.push(`points_projector_duplicate_event_rule_sample=${report.metrics.duplicateEventRuleSample}`);
    lines.push(`points_projector_duplicate_fingerprint_sample=${report.metrics.duplicateFingerprintSample}`);
    fs.appendFileSync(outputPath, `${lines.join('\n')}\n`);
    return true;
}

async function main() {
    const supabaseUrl = normalizeSupabaseUrl(parseStringFlag('--supabase-url', getEnvValue('SUPABASE_URL')));
    const serviceRoleKey = parseStringFlag('--service-role-key', getEnvValue('SUPABASE_SERVICE_ROLE_KEY'));
    const projectorName = parseStringFlag('--projector-name', 'crowd_points_v1');
    const eventName = parseStringFlag('--event-name', 'price.crowd_submitted');
    const maxLagRows = parseIntegerFlag('--max-lag-rows', 500, 0, 1000000);
    const maxLagSeconds = parseIntegerFlag('--max-lag-seconds', 60, 0, 86400);
    const sampleSize = parseIntegerFlag('--sample-size', 500, 10, 5000);
    const softFail = parseIntegerFlag('--soft-fail', 0, 0, 1) === 1;
    const writeGithubOutputFlag = parseIntegerFlag('--write-github-output', 0, 0, 1) === 1;

    const missing = [];
    if (!supabaseUrl) missing.push('SUPABASE_URL');
    if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
    if (missing.length > 0) {
        throw new Error(`Missing required values: ${missing.join(', ')}`);
    }
    if (!isLikelySupabaseServiceRoleKey(serviceRoleKey)) {
        throw new Error(
            'SUPABASE_SERVICE_ROLE_KEY format looks invalid. Expected a service_role JWT or sb_secret_ key.'
        );
    }

    const client = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    });

    const nowMs = Date.now();
    const checks = [];

    const stateResult = await client
        .from('points_projection_state')
        .select('projector_name,last_stream_id,updated_at')
        .eq('projector_name', projectorName)
        .maybeSingle();

    const stateError = stateResult.error ? String(stateResult.error.message || stateResult.error) : '';
    const state = stateResult.data || null;
    checks.push(
        createCheck(
            'projection_state_present',
            'row exists for projector',
            state ? projectorName : stateError || 'missing',
            Boolean(state)
        )
    );

    const latestStreamResult = await client
        .from('intel_event_stream')
        .select('id,occurred_at')
        .eq('event_name', eventName)
        .order('id', { ascending: false })
        .limit(1);

    const latestStreamError = latestStreamResult.error ? String(latestStreamResult.error.message || latestStreamResult.error) : '';
    const latestStreamRow = Array.isArray(latestStreamResult.data) && latestStreamResult.data.length > 0
        ? latestStreamResult.data[0]
        : null;

    const cursorId = Number(state?.last_stream_id || 0);
    const latestStreamId = Number(latestStreamRow?.id || 0);
    const lagRows = Math.max(0, latestStreamId - cursorId);

    checks.push(
        createCheck(
            'cursor_not_ahead',
            'cursor <= latest_stream_id',
            `${cursorId} <= ${latestStreamId}`,
            cursorId <= latestStreamId
        )
    );

    checks.push(
        createCheck(
            'lag_rows_threshold',
            `<= ${maxLagRows}`,
            lagRows,
            lagRows <= maxLagRows
        )
    );

    let lagSeconds = 0;
    let oldestUnprojectedAt = null;
    if (lagRows > 0 && cursorId >= 0) {
        const oldestUnprojectedResult = await client
            .from('intel_event_stream')
            .select('id,occurred_at')
            .eq('event_name', eventName)
            .gt('id', cursorId)
            .order('id', { ascending: true })
            .limit(1);

        const oldestUnprojectedRow = Array.isArray(oldestUnprojectedResult.data) && oldestUnprojectedResult.data.length > 0
            ? oldestUnprojectedResult.data[0]
            : null;
        oldestUnprojectedAt = toIsoString(oldestUnprojectedRow?.occurred_at);
        const oldestMs = toEpochMs(oldestUnprojectedRow?.occurred_at);
        lagSeconds = oldestMs === null ? maxLagSeconds + 1 : Math.max(0, Math.round((nowMs - oldestMs) / 1000));
    }

    checks.push(
        createCheck(
            'lag_seconds_threshold',
            `<= ${maxLagSeconds}`,
            lagSeconds,
            lagSeconds <= maxLagSeconds
        )
    );

    const ledgerSampleResult = await client
        .from('points_ledger')
        .select('event_id,rule_version,fingerprint,status')
        .order('id', { ascending: false })
        .limit(sampleSize);

    const ledgerSampleError = ledgerSampleResult.error ? String(ledgerSampleResult.error.message || ledgerSampleResult.error) : '';
    const ledgerSampleRows = Array.isArray(ledgerSampleResult.data) ? ledgerSampleResult.data : [];
    const sampleDupes = sampleDuplicateMetrics(ledgerSampleRows);

    checks.push(
        createCheck(
            'duplicate_event_rule_in_sample',
            '= 0',
            sampleDupes.duplicateEventRuleCount,
            sampleDupes.duplicateEventRuleCount === 0
        )
    );
    checks.push(
        createCheck(
            'duplicate_fingerprint_status_in_sample',
            '= 0',
            sampleDupes.duplicateFingerprintStatusCount,
            sampleDupes.duplicateFingerprintStatusCount === 0
        )
    );

    const cursorUpdatedAt = toIsoString(state?.updated_at);
    const cursorUpdatedAtMs = toEpochMs(state?.updated_at);
    const cursorUpdatedLagSeconds = cursorUpdatedAtMs === null
        ? null
        : Math.max(0, Math.round((nowMs - cursorUpdatedAtMs) / 1000));

    const errors = []
        .concat(stateError ? [{ source: 'points_projection_state', message: stateError }] : [])
        .concat(latestStreamError ? [{ source: 'intel_event_stream', message: latestStreamError }] : [])
        .concat(ledgerSampleError ? [{ source: 'points_ledger', message: ledgerSampleError }] : []);

    if (errors.length > 0) {
        checks.push(createCheck('query_errors', '= 0', errors.length, false));
    }

    const report = {
        ok: checks.every((check) => check.ok),
        checks,
        metrics: {
            projectorName,
            eventName,
            cursorId,
            latestStreamId,
            lagRows,
            lagSeconds,
            oldestUnprojectedAt,
            cursorUpdatedAt,
            cursorUpdatedLagSeconds,
            ledgerSampleSize: ledgerSampleRows.length,
            duplicateEventRuleSample: sampleDupes.duplicateEventRuleCount,
            duplicateFingerprintSample: sampleDupes.duplicateFingerprintStatusCount,
            stateExists: Boolean(state),
            errors
        }
    };

    if (writeGithubOutputFlag) {
        writeGithubOutput(report);
    }

    console.log(JSON.stringify(report, null, 2));
    if (!report.ok && !softFail) {
        process.exitCode = 2;
    }
}

main().catch((error) => {
    console.error('[POINTS_PROJECTOR_HEALTH] FAIL');
    console.error(error && error.stack ? error.stack : String(error));
    process.exit(1);
});

