#!/usr/bin/env node
'use strict';

const fs = require('fs');

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
    const raw = findLastFlagValue(flagName);
    if (raw === undefined) return fallback;
    return String(raw || '').trim();
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

function parseEnvInteger(name, fallback, min, max) {
    const raw = getEnvValue(name);
    if (!raw) return fallback;
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
        return fallback;
    }
    return parsed;
}

function parseBooleanLike(value, fallback = false) {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) return fallback;
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
    return fallback;
}

function parseTimestamp(rawValue) {
    const raw = String(rawValue || '').trim();
    if (!raw) return null;
    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(raw)
        ? `${raw}T00:00:00Z`
        : raw;
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return date;
}

function sanitizeOutputValue(value) {
    return String(value ?? '').replace(/[\r\n]+/g, ' ').trim();
}

function uniqueItems(values) {
    return Array.from(new Set((values || []).filter(Boolean)));
}

function toSeverityRank(severity) {
    const normalized = String(severity || '').toLowerCase();
    if (normalized === 'critical') return 3;
    if (normalized === 'warning') return 2;
    return 1;
}

function pickHigherSeverity(left, right) {
    return toSeverityRank(left) >= toSeverityRank(right) ? left : right;
}

function buildReminder(report) {
    if (!report.dryRunEnabled) {
        return 'Dry-run is disabled; incident routing is active.';
    }
    if (!report.hasExpiry) {
        return 'Set INTEL_TRIAGE_DRY_RUN_EXPIRES_AT (YYYY-MM-DD) so dry-run cannot stay enabled indefinitely.';
    }
    if (report.expired) {
        return 'Dry-run expiry passed. Switch INTEL_TRIAGE_AUTO_INCIDENT_DRY_RUN=false or move expiry intentionally.';
    }
    if (report.remainingHours <= 24) {
        return 'Dry-run expires within 24h. Plan switch to false when verification window closes.';
    }
    if (report.remainingHours <= report.warningHours) {
        return `Dry-run expires within ${report.warningHours}h. Keep monitoring and schedule switch to false.`;
    }
    return 'Dry-run window is within policy.';
}

function buildSummaryMarkdown(report) {
    const lines = [];
    lines.push('## Intel Triage Dry-Run Guard');
    lines.push('');
    lines.push(`- Dry-run enabled: ${report.dryRunEnabled}`);
    lines.push(`- Severity: ${report.severity}`);
    lines.push(`- Reason codes: ${report.reasonCodes.length > 0 ? report.reasonCodes.join(', ') : 'none'}`);
    lines.push(`- Expires at: ${report.expiresAt || 'not_set'}`);
    lines.push(`- Current UTC: ${report.nowUtc}`);
    lines.push(`- Remaining hours: ${report.remainingHoursText}`);
    lines.push(`- Reminder: ${report.reminder}`);
    lines.push('');
    return lines.join('\n');
}

function appendToStepSummary(markdown) {
    const summaryPath = String(process.env.GITHUB_STEP_SUMMARY || '').trim();
    if (!summaryPath) {
        return { wroteToSummaryFile: false, summaryPath: null };
    }
    fs.appendFileSync(summaryPath, `${markdown}\n`);
    return { wroteToSummaryFile: true, summaryPath };
}

function writeGithubOutputs(report) {
    const outputPath = String(process.env.GITHUB_OUTPUT || '').trim();
    if (!outputPath) {
        return { wroteToGithubOutput: false, outputPath: null };
    }

    const outputs = {
        triage_dry_run_enabled: report.dryRunEnabled ? 'true' : 'false',
        triage_dry_run_has_expiry: report.hasExpiry ? 'true' : 'false',
        triage_dry_run_expired: report.expired ? 'true' : 'false',
        triage_dry_run_expires_at: report.expiresAt || '',
        triage_dry_run_remaining_hours: report.remainingHoursText,
        triage_dry_run_severity: report.severity,
        triage_dry_run_reason_codes: report.reasonCodes.join(','),
        triage_dry_run_reminder: report.reminder,
        triage_dry_run_ok: report.ok ? 'true' : 'false'
    };

    const lines = Object.entries(outputs).map(([key, value]) => `${key}=${sanitizeOutputValue(value)}`);
    fs.appendFileSync(outputPath, `${lines.join('\n')}\n`);
    return { wroteToGithubOutput: true, outputPath };
}

function main() {
    const dryRunRaw = parseStringFlag('--dry-run', getEnvValue('INTEL_TRIAGE_AUTO_INCIDENT_DRY_RUN') || 'false');
    const expiresAtRaw = parseStringFlag('--expires-at', getEnvValue('INTEL_TRIAGE_DRY_RUN_EXPIRES_AT'));
    const nowIsoRaw = parseStringFlag('--now-iso', '');
    const warningHours = parseIntegerFlag('--warning-hours',
        parseEnvInteger('INTEL_TRIAGE_DRY_RUN_WARNING_HOURS', 48, 1, 720),
        1, 720);
    const strict = parseIntegerFlag(
        '--strict',
        parseBooleanLike(getEnvValue('INTEL_TRIAGE_DRY_RUN_STRICT'), false) ? 1 : 0,
        0,
        1
    ) === 1;
    const writeGithubOutput = parseIntegerFlag('--write-github-output', 1, 0, 1) === 1;

    const dryRunEnabled = parseBooleanLike(dryRunRaw, false);
    const nowDate = nowIsoRaw ? parseTimestamp(nowIsoRaw) : new Date();
    if (!nowDate || Number.isNaN(nowDate.getTime())) {
        throw new Error('--now-iso must be a valid ISO timestamp');
    }

    const expiresAtDate = parseTimestamp(expiresAtRaw);
    const hasExpiry = Boolean(String(expiresAtRaw || '').trim());
    const expiryInvalid = hasExpiry && !expiresAtDate;
    const remainingHoursRaw = expiresAtDate
        ? Number(((expiresAtDate.getTime() - nowDate.getTime()) / 3600000).toFixed(2))
        : null;
    const expired = dryRunEnabled && Boolean(expiresAtDate) && remainingHoursRaw <= 0;

    let severity = 'ok';
    const reasonCodes = [];

    if (!dryRunEnabled) {
        reasonCodes.push('dry_run_disabled');
    } else {
        if (!hasExpiry) {
            severity = pickHigherSeverity(severity, 'warning');
            reasonCodes.push('dry_run_missing_expiry');
        } else if (expiryInvalid) {
            severity = pickHigherSeverity(severity, 'warning');
            reasonCodes.push('dry_run_invalid_expiry');
        } else if (expired) {
            severity = pickHigherSeverity(severity, 'critical');
            reasonCodes.push('dry_run_expired');
        } else if (remainingHoursRaw !== null && remainingHoursRaw <= warningHours) {
            severity = pickHigherSeverity(severity, 'warning');
            reasonCodes.push('dry_run_near_expiry');
        } else {
            reasonCodes.push('dry_run_within_window');
        }
    }

    const normalizedReasonCodes = uniqueItems(reasonCodes);
    const report = {
        ok: !(strict && (severity === 'critical' || normalizedReasonCodes.includes('dry_run_missing_expiry') || normalizedReasonCodes.includes('dry_run_invalid_expiry'))),
        strict,
        dryRunEnabled,
        hasExpiry: hasExpiry && !expiryInvalid,
        expiryInvalid,
        expiresAt: expiresAtDate ? expiresAtDate.toISOString() : (hasExpiry ? String(expiresAtRaw || '').trim() : ''),
        nowUtc: nowDate.toISOString(),
        remainingHours: remainingHoursRaw,
        remainingHoursText: remainingHoursRaw === null ? 'n/a' : String(remainingHoursRaw),
        expired,
        warningHours,
        severity,
        reasonCodes: normalizedReasonCodes,
        reminder: ''
    };
    report.reminder = buildReminder(report);

    const markdown = buildSummaryMarkdown(report);
    const summaryResult = appendToStepSummary(markdown);
    if (!summaryResult.wroteToSummaryFile) {
        console.log(markdown);
    }

    const outputResult = writeGithubOutput
        ? writeGithubOutputs(report)
        : { wroteToGithubOutput: false, outputPath: null };

    console.log(JSON.stringify({
        ok: report.ok,
        dryRunEnabled: report.dryRunEnabled,
        severity: report.severity,
        reasonCodes: report.reasonCodes,
        expiresAt: report.expiresAt || null,
        nowUtc: report.nowUtc,
        remainingHours: report.remainingHours,
        expired: report.expired,
        reminder: report.reminder,
        wroteToSummaryFile: summaryResult.wroteToSummaryFile,
        wroteToGithubOutput: outputResult.wroteToGithubOutput
    }, null, 2));

    if (!report.ok) {
        process.exitCode = 2;
    }
}

main();
