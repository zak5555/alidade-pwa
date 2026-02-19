#!/usr/bin/env node
'use strict';

const fs = require('fs');

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

function extractJsonObjectsFromLog(sourceText) {
    const source = String(sourceText || '');
    const objects = [];
    let depth = 0;
    let start = -1;
    let inString = false;
    let escaping = false;

    for (let index = 0; index < source.length; index += 1) {
        const char = source[index];

        if (depth === 0) {
            if (char === '{') {
                depth = 1;
                start = index;
                inString = false;
                escaping = false;
            }
            continue;
        }

        if (inString) {
            if (escaping) {
                escaping = false;
            } else if (char === '\\') {
                escaping = true;
            } else if (char === '"') {
                inString = false;
            }
            continue;
        }

        if (char === '"') {
            inString = true;
            continue;
        }

        if (char === '{') {
            depth += 1;
            continue;
        }

        if (char === '}') {
            depth -= 1;
            if (depth === 0 && start >= 0) {
                const candidate = source.slice(start, index + 1);
                try {
                    const parsed = JSON.parse(candidate);
                    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                        objects.push(parsed);
                    }
                } catch (_error) {
                    // Ignore non-JSON brace blocks found in logs.
                }
                start = -1;
            }
        }
    }

    return objects;
}

function formatBool(value) {
    return value === true ? 'true' : value === false ? 'false' : 'n/a';
}

function asNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function getFailedCheckIds(healthReport) {
    const checks = Array.isArray(healthReport?.checks) ? healthReport.checks : [];
    return checks
        .filter((check) => check && check.ok === false)
        .map((check) => String(check.id || '').trim())
        .filter(Boolean);
}

function buildVerifyReportLines(report, index) {
    const probeAttempts = asNumber(report?.probe?.attempts, 1);
    const probeRetriesUsed = asNumber(report?.probe?.retriesUsed, Math.max(0, probeAttempts - 1));
    const healthAttempts = asNumber(report?.health?.retry?.attempts, 1);
    const healthRetriesUsed = asNumber(report?.health?.retry?.retriesUsed, Math.max(0, healthAttempts - 1));
    const failedChecks = getFailedCheckIds(report?.health);
    const totalEvents = asNumber(report?.health?.metrics?.totalEvents, 0);
    const totalRejected = asNumber(report?.health?.metrics?.totalRejected, 0);
    const delayedCount = asNumber(report?.health?.metrics?.delayedIngestCount, 0);

    const lines = [];
    lines.push(`### Verify Report ${index + 1}`);
    lines.push(`- Overall ok: ${formatBool(report?.ok)}`);
    lines.push(`- Probe: status=${report?.probe?.responseStatus ?? 'n/a'} accepted=${report?.probe?.acceptedCount ?? 0} rejected=${report?.probe?.rejectedCount ?? 0} attempts=${probeAttempts} retriesUsed=${probeRetriesUsed}`);
    lines.push(`- Health: window=${report?.health?.windowMinutes ?? 'n/a'} totalEvents=${totalEvents} totalRejected=${totalRejected} delayed=${delayedCount} attempts=${healthAttempts} retriesUsed=${healthRetriesUsed}`);
    lines.push(`- Failed checks: ${failedChecks.length > 0 ? failedChecks.join(', ') : 'none'}`);
    return lines;
}

function buildHealthReportLines(report, index) {
    const attempts = asNumber(report?.retryPolicy?.attempts, 1);
    const retriesUsed = asNumber(report?.retryPolicy?.retriesUsed, Math.max(0, attempts - 1));
    const failedChecks = getFailedCheckIds(report);
    const totalEvents = asNumber(report?.metrics?.totalEvents, 0);
    const totalRejected = asNumber(report?.metrics?.totalRejected, 0);
    const delayedCount = asNumber(report?.metrics?.delayedIngestCount, 0);

    const lines = [];
    lines.push(`### Health Report ${index + 1}`);
    lines.push(`- Overall ok: ${formatBool(report?.ok)}`);
    lines.push(`- Window: ${report?.windowMinutes ?? 'n/a'} min`);
    lines.push(`- Metrics: totalEvents=${totalEvents} totalRejected=${totalRejected} delayed=${delayedCount}`);
    lines.push(`- Retry: attempts=${attempts} retriesUsed=${retriesUsed}`);
    lines.push(`- Failed checks: ${failedChecks.length > 0 ? failedChecks.join(', ') : 'none'}`);
    return lines;
}

function buildSummaryMarkdown({ lane, logFilePath, verifyReports, healthReports, parsedObjectCount }) {
    const lines = [];
    lines.push(`## Intel Verify Observability (${lane})`);
    lines.push('');
    lines.push(`- Log file: \`${logFilePath}\``);
    lines.push(`- Parsed JSON objects: ${parsedObjectCount}`);
    lines.push(`- Verify reports: ${verifyReports.length}`);
    lines.push(`- Health-only reports: ${healthReports.length}`);
    lines.push('');

    verifyReports.forEach((report, index) => {
        lines.push(...buildVerifyReportLines(report, index));
        lines.push('');
    });

    healthReports.forEach((report, index) => {
        lines.push(...buildHealthReportLines(report, index));
        lines.push('');
    });

    if (verifyReports.length === 0 && healthReports.length === 0) {
        lines.push('- No intel verify/health JSON report detected in log.');
        lines.push('');
    }

    return lines.join('\n');
}

function appendToStepSummary(markdown) {
    const summaryPath = String(process.env.GITHUB_STEP_SUMMARY || '').trim();
    if (summaryPath) {
        fs.appendFileSync(summaryPath, `${markdown}\n`);
        return { wroteToSummaryFile: true, summaryPath };
    }
    return { wroteToSummaryFile: false, summaryPath: null };
}

function main() {
    const lane = parseStringFlag('--lane', 'unknown');
    const logFilePath = parseStringFlag('--log-file', '');
    const strict = parseIntegerFlag('--strict', 0, 0, 1) === 1;

    if (!logFilePath) {
        throw new Error('Missing --log-file value');
    }

    const source = fs.readFileSync(logFilePath, 'utf8');
    const objects = extractJsonObjectsFromLog(source);
    const verifyReports = objects.filter((item) => item && typeof item === 'object' && item.probe && item.health);
    const healthReports = objects.filter((item) => {
        if (!item || typeof item !== 'object') return false;
        if (item.probe || item.health) return false;
        return Array.isArray(item.checks) && Object.prototype.hasOwnProperty.call(item, 'metrics');
    });

    if (strict && verifyReports.length === 0 && healthReports.length === 0) {
        throw new Error('No intel verify/health report object found in log');
    }

    const markdown = buildSummaryMarkdown({
        lane,
        logFilePath,
        verifyReports,
        healthReports,
        parsedObjectCount: objects.length
    });

    const summaryResult = appendToStepSummary(markdown);
    if (!summaryResult.wroteToSummaryFile) {
        console.log(markdown);
    }

    console.log(JSON.stringify({
        ok: true,
        lane,
        logFilePath,
        parsedObjectCount: objects.length,
        verifyReportCount: verifyReports.length,
        healthReportCount: healthReports.length,
        wroteToSummaryFile: summaryResult.wroteToSummaryFile
    }, null, 2));
}

main();
