#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

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

function sanitizeOutputValue(value) {
    return String(value ?? '').replace(/[\r\n]+/g, ' ').trim();
}

function deriveActionsFromFailedChecks(failedChecks) {
    const actions = [];
    const criticalCheckIds = new Set([
        'max_delayed',
        'max_p95_delay_ms',
        'max_freshness_seconds',
        'max_rejected',
        'max_reject_rate_pct'
    ]);

    failedChecks.forEach((checkId) => {
        const normalized = String(checkId || '').trim();
        if (!normalized) return;

        if (normalized === 'min_events' || normalized === 'source_min_events') {
            actions.push('Validate intel emit flow (client queue flush + ingest endpoint reachability).');
            return;
        }
        if (normalized === 'min_distinct_sessions') {
            actions.push('Inspect session diversity telemetry; verify sessionId generation and sampling policy.');
            return;
        }
        if (normalized === 'max_delayed') {
            actions.push('Inspect delayed ingest path: edge runtime latency, queue flush cadence, and network quality.');
            return;
        }
        if (normalized === 'max_p95_delay_ms' || normalized === 'max_freshness_seconds') {
            actions.push('Investigate ingest freshness/latency (regional network, edge logs, Supabase load).');
            return;
        }
        if (normalized === 'max_rejected' || normalized === 'max_reject_rate_pct') {
            actions.push('Audit rejected events by source/reason and tune signature, schema, or allowlist policy.');
            return;
        }
        if (normalized === 'allowed_reject_reasons' ||
            normalized === 'allowed_reject_sources' ||
            normalized === 'allowed_reject_source_reasons') {
            actions.push('Review rejection allowlists and update expected source/reason rules to match intended probes.');
            return;
        }
        if (normalized === 'reject_source_min_events' || normalized === 'reject_source_max_events') {
            actions.push('Verify rejection-probe configuration and expected reject-source thresholds.');
            return;
        }

        if (criticalCheckIds.has(normalized)) {
            actions.push('Escalate to ingest stability triage: inspect edge function health and persistence path.');
        } else {
            actions.push(`Review failed check "${normalized}" and adjust thresholds/pipeline behavior.`);
        }
    });

    return uniqueItems(actions);
}

function classifyVerifyReport(report) {
    let severity = 'ok';
    const reasons = [];
    const actions = [];

    const reportOk = report?.ok === true;
    const probeStatus = asNumber(report?.probe?.responseStatus, 0);
    const failedChecks = getFailedCheckIds(report?.health);
    const probeRetriesUsed = asNumber(report?.probe?.retriesUsed, 0);
    const healthRetriesUsed = asNumber(report?.health?.retry?.retriesUsed, 0);
    const totalRejected = asNumber(report?.health?.metrics?.totalRejected, 0);
    const delayedCount = asNumber(report?.health?.metrics?.delayedIngestCount, 0);

    if (!reportOk) {
        severity = pickHigherSeverity(severity, 'critical');
        reasons.push('verify_report_not_ok');
    }

    if (probeStatus === 401 || probeStatus === 403) {
        severity = pickHigherSeverity(severity, 'critical');
        reasons.push('probe_auth_error');
        actions.push('Validate INTEL_INGEST_API_KEY and edge function auth expectations.');
    } else if (probeStatus === 429) {
        severity = pickHigherSeverity(severity, 'critical');
        reasons.push('probe_rate_limited');
        actions.push('Reduce probe pressure or tune ingest rate limits/backoff settings.');
    } else if (probeStatus >= 500) {
        severity = pickHigherSeverity(severity, 'critical');
        reasons.push('probe_server_error');
        actions.push('Check intel-ingest edge logs and Supabase service health.');
    }

    failedChecks.forEach((checkId) => {
        reasons.push(`failed_check:${checkId}`);
    });
    if (failedChecks.length > 0) {
        const criticalChecks = new Set([
            'max_delayed',
            'max_p95_delay_ms',
            'max_freshness_seconds',
            'max_rejected',
            'max_reject_rate_pct'
        ]);
        const hasCriticalCheck = failedChecks.some((checkId) => criticalChecks.has(checkId));
        severity = pickHigherSeverity(severity, hasCriticalCheck ? 'critical' : 'warning');
        actions.push(...deriveActionsFromFailedChecks(failedChecks));
    }

    if (probeRetriesUsed > 0) {
        severity = pickHigherSeverity(severity, 'warning');
        reasons.push('probe_retried');
        actions.push('Transient probe retries observed; monitor network stability and edge responsiveness.');
    }
    if (healthRetriesUsed > 0) {
        severity = pickHigherSeverity(severity, 'warning');
        reasons.push('health_retried');
        actions.push('Health RPC retries observed; inspect Supabase/API intermittency.');
    }
    if (delayedCount > 0) {
        severity = pickHigherSeverity(severity, 'warning');
        reasons.push('delayed_ingest_nonzero');
    }
    if (totalRejected > 0 && reportOk) {
        severity = pickHigherSeverity(severity, 'warning');
        reasons.push('rejections_present_under_ok');
    }

    return {
        type: 'verify',
        severity,
        reasons: uniqueItems(reasons),
        actions: uniqueItems(actions),
        failedCheckIds: failedChecks,
        probeRetriesUsed,
        healthRetriesUsed,
        reportOk
    };
}

function classifyHealthReport(report) {
    let severity = 'ok';
    const reasons = [];
    const actions = [];

    const reportOk = report?.ok === true;
    const failedChecks = getFailedCheckIds(report);
    const retriesUsed = asNumber(report?.retryPolicy?.retriesUsed, 0);
    const delayedCount = asNumber(report?.metrics?.delayedIngestCount, 0);
    const totalRejected = asNumber(report?.metrics?.totalRejected, 0);

    if (!reportOk) {
        severity = pickHigherSeverity(severity, 'critical');
        reasons.push('health_report_not_ok');
    }

    failedChecks.forEach((checkId) => {
        reasons.push(`failed_check:${checkId}`);
    });
    if (failedChecks.length > 0) {
        const criticalChecks = new Set([
            'max_delayed',
            'max_p95_delay_ms',
            'max_freshness_seconds',
            'max_rejected',
            'max_reject_rate_pct'
        ]);
        const hasCriticalCheck = failedChecks.some((checkId) => criticalChecks.has(checkId));
        severity = pickHigherSeverity(severity, hasCriticalCheck ? 'critical' : 'warning');
        actions.push(...deriveActionsFromFailedChecks(failedChecks));
    }

    if (retriesUsed > 0) {
        severity = pickHigherSeverity(severity, 'warning');
        reasons.push('health_retried');
        actions.push('Health retries observed; inspect transient RPC/network reliability.');
    }
    if (delayedCount > 0) {
        severity = pickHigherSeverity(severity, 'warning');
        reasons.push('delayed_ingest_nonzero');
    }
    if (totalRejected > 0 && reportOk) {
        severity = pickHigherSeverity(severity, 'warning');
        reasons.push('rejections_present_under_ok');
    }

    return {
        type: 'health',
        severity,
        reasons: uniqueItems(reasons),
        actions: uniqueItems(actions),
        failedCheckIds: failedChecks,
        probeRetriesUsed: 0,
        healthRetriesUsed: retriesUsed,
        reportOk
    };
}

function buildTriage(verifyReports, healthReports) {
    const evaluations = [
        ...verifyReports.map((report) => classifyVerifyReport(report)),
        ...healthReports.map((report) => classifyHealthReport(report))
    ];

    const summary = {
        severity: 'ok',
        reasonCodes: [],
        actions: [],
        totalReports: evaluations.length,
        failedReportCount: 0,
        retriedReports: 0,
        maxProbeRetriesUsed: 0,
        maxHealthRetriesUsed: 0,
        hasCritical: false,
        hasWarnings: false
    };

    evaluations.forEach((evaluation) => {
        summary.severity = pickHigherSeverity(summary.severity, evaluation.severity);
        summary.reasonCodes.push(...evaluation.reasons);
        summary.actions.push(...evaluation.actions);

        if (!evaluation.reportOk || evaluation.failedCheckIds.length > 0) {
            summary.failedReportCount += 1;
        }
        if (evaluation.probeRetriesUsed > 0 || evaluation.healthRetriesUsed > 0) {
            summary.retriedReports += 1;
        }
        summary.maxProbeRetriesUsed = Math.max(summary.maxProbeRetriesUsed, asNumber(evaluation.probeRetriesUsed, 0));
        summary.maxHealthRetriesUsed = Math.max(summary.maxHealthRetriesUsed, asNumber(evaluation.healthRetriesUsed, 0));
    });

    summary.reasonCodes = uniqueItems(summary.reasonCodes).sort();
    summary.actions = uniqueItems(summary.actions);
    summary.hasCritical = summary.severity === 'critical';
    summary.hasWarnings = summary.severity === 'warning' || summary.hasCritical;

    if (summary.totalReports === 0) {
        summary.severity = 'warning';
        summary.reasonCodes = ['no_reports_detected'];
        summary.actions = ['Ensure verify/health commands print JSON reports and tee logs before summary parsing.'];
        summary.hasWarnings = true;
        summary.hasCritical = false;
    }

    return summary;
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
    const triage = buildTriage(verifyReports, healthReports);
    const lines = [];
    lines.push(`## Intel Verify Observability (${lane})`);
    lines.push('');
    lines.push(`- Log file: \`${logFilePath}\``);
    lines.push(`- Parsed JSON objects: ${parsedObjectCount}`);
    lines.push(`- Verify reports: ${verifyReports.length}`);
    lines.push(`- Health-only reports: ${healthReports.length}`);
    lines.push('');
    lines.push('### Triage');
    lines.push(`- Severity: ${triage.severity}`);
    lines.push(`- Failed reports: ${triage.failedReportCount}/${triage.totalReports}`);
    lines.push(`- Retried reports: ${triage.retriedReports}`);
    lines.push(`- Max retries used: probe=${triage.maxProbeRetriesUsed}, health=${triage.maxHealthRetriesUsed}`);
    lines.push(`- Reason codes: ${triage.reasonCodes.length > 0 ? triage.reasonCodes.join(', ') : 'none'}`);
    if (triage.actions.length > 0) {
        lines.push('- Recommended actions:');
        triage.actions.forEach((action, index) => {
            lines.push(`  ${index + 1}. ${action}`);
        });
    }
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

    return {
        markdown: lines.join('\n'),
        triage
    };
}

function appendToStepSummary(markdown) {
    const summaryPath = String(process.env.GITHUB_STEP_SUMMARY || '').trim();
    if (summaryPath) {
        fs.appendFileSync(summaryPath, `${markdown}\n`);
        return { wroteToSummaryFile: true, summaryPath };
    }
    return { wroteToSummaryFile: false, summaryPath: null };
}

function writeGithubOutputs(outputs) {
    const outputPath = String(process.env.GITHUB_OUTPUT || '').trim();
    if (!outputPath) {
        return { wroteToGithubOutput: false, outputPath: null };
    }

    const lines = Object.entries(outputs).map(([key, value]) => `${key}=${sanitizeOutputValue(value)}`);
    fs.appendFileSync(outputPath, `${lines.join('\n')}\n`);
    return { wroteToGithubOutput: true, outputPath };
}

function main() {
    const lane = parseStringFlag('--lane', 'unknown');
    const logFilePath = parseStringFlag('--log-file', '');
    const strict = parseIntegerFlag('--strict', 0, 0, 1) === 1;
    const writeOutputs = parseIntegerFlag('--write-github-output', 1, 0, 1) === 1;

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

    const summary = buildSummaryMarkdown({
        lane,
        logFilePath,
        verifyReports,
        healthReports,
        parsedObjectCount: objects.length
    });

    const summaryResult = appendToStepSummary(summary.markdown);
    if (!summaryResult.wroteToSummaryFile) {
        console.log(summary.markdown);
    }

    const githubOutputResult = writeOutputs ? writeGithubOutputs({
        triage_severity: summary.triage.severity,
        triage_reason_codes: summary.triage.reasonCodes.join(','),
        triage_action_count: summary.triage.actions.length,
        triage_failed_report_count: summary.triage.failedReportCount,
        triage_total_reports: summary.triage.totalReports,
        triage_retried_reports: summary.triage.retriedReports,
        triage_max_probe_retries_used: summary.triage.maxProbeRetriesUsed,
        triage_max_health_retries_used: summary.triage.maxHealthRetriesUsed,
        triage_has_critical: summary.triage.hasCritical ? 'true' : 'false',
        triage_has_warnings: summary.triage.hasWarnings ? 'true' : 'false',
        parsed_object_count: objects.length,
        verify_report_count: verifyReports.length,
        health_report_count: healthReports.length,
        lane
    }) : { wroteToGithubOutput: false, outputPath: null };

    console.log(JSON.stringify({
        ok: true,
        lane,
        logFilePath: path.normalize(logFilePath),
        parsedObjectCount: objects.length,
        verifyReportCount: verifyReports.length,
        healthReportCount: healthReports.length,
        triage: summary.triage,
        wroteToSummaryFile: summaryResult.wroteToSummaryFile,
        wroteToGithubOutput: githubOutputResult.wroteToGithubOutput
    }, null, 2));
}

main();
