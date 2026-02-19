#!/usr/bin/env node
'use strict';

const { spawnSync } = require('child_process');

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
    const raw = String(value || '').trim();
    return raw || fallback;
}

function parseIntegerFlag(flagName, fallback, min, max) {
    const value = findLastFlagValue(flagName);
    if (value === undefined) return fallback;
    const raw = Number(value);
    if (!Number.isInteger(raw) || raw < min || raw > max) {
        throw new Error(`${flagName} must be an integer in [${min}, ${max}]`);
    }
    return raw;
}

function parseNumberFlag(flagName, fallback, min, max) {
    const value = findLastFlagValue(flagName);
    if (value === undefined) return fallback;
    const raw = Number(value);
    if (!Number.isFinite(raw) || raw < min || raw > max) {
        throw new Error(`${flagName} must be a number in [${min}, ${max}]`);
    }
    return raw;
}

function parseCsvFlag(flagName, fallbackCsv) {
    const value = findLastFlagValue(flagName);
    const raw = value === undefined ? fallbackCsv : value;
    return String(raw || '')
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
}

function parseRepo(repoValue) {
    const normalized = String(repoValue || '').trim();
    const parts = normalized.split('/');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
        throw new Error('Repository must be in owner/repo format');
    }
    return { owner: parts[0], repo: parts[1] };
}

function parseRepoFromRemoteUrl(remoteUrl) {
    const normalized = String(remoteUrl || '').trim();
    if (!normalized) return '';

    const httpsMatch = normalized.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/i);
    if (httpsMatch) {
        return `${httpsMatch[1]}/${httpsMatch[2]}`;
    }

    const sshMatch = normalized.match(/^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/i);
    if (sshMatch) {
        return `${sshMatch[1]}/${sshMatch[2]}`;
    }

    return '';
}

function resolveDefaultRepo() {
    const envRepo = String(process.env.GITHUB_REPOSITORY || '').trim();
    if (envRepo) return envRepo;

    const result = spawnSync('git', ['remote', 'get-url', 'origin'], {
        encoding: 'utf8'
    });
    if (result.status !== 0) return '';
    return parseRepoFromRemoteUrl(result.stdout);
}

function resolveDefaultToken() {
    const envToken = String(process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '').trim();
    if (envToken) return envToken;

    const result = spawnSync('gh', ['auth', 'token'], {
        encoding: 'utf8'
    });
    if (result.status !== 0) return '';
    return String(result.stdout || '').trim();
}

async function githubGet(path, token) {
    const headers = {
        accept: 'application/vnd.github+json',
        'user-agent': 'alidade-intel-burnin-trend'
    };
    if (token) {
        headers.authorization = `Bearer ${token}`;
    }

    const response = await fetch(`https://api.github.com${path}`, { headers });
    if (!response.ok) {
        let detail = '';
        try {
            const body = await response.json();
            detail = body && body.message ? ` (${body.message})` : '';
        } catch (_error) {
            detail = '';
        }
        throw new Error(`GitHub API ${path} failed: HTTP ${response.status}${detail}`);
    }
    return response.json();
}

async function listWorkflowRunsInWindow({
    owner,
    repo,
    workflowRef,
    branch,
    sinceMs,
    perPage,
    maxPages,
    token
}) {
    const runs = [];
    const encodedWorkflow = encodeURIComponent(workflowRef);
    let reachedWindowBoundary = false;

    for (let page = 1; page <= maxPages; page += 1) {
        const path = `/repos/${owner}/${repo}/actions/workflows/${encodedWorkflow}/runs?status=completed&per_page=${perPage}&page=${page}`;
        const payload = await githubGet(path, token);
        const pageRuns = Array.isArray(payload?.workflow_runs) ? payload.workflow_runs : [];
        if (pageRuns.length === 0) break;

        for (const run of pageRuns) {
            if (branch && String(run?.head_branch || '') !== branch) {
                continue;
            }

            const createdAtMs = Date.parse(String(run?.created_at || ''));
            if (!Number.isFinite(createdAtMs)) continue;
            if (createdAtMs < sinceMs) {
                reachedWindowBoundary = true;
                break;
            }
            runs.push(run);
        }

        if (reachedWindowBoundary) break;
    }

    return runs;
}

async function listIncidentsInWindow({
    owner,
    repo,
    labels,
    sinceMs,
    perPage,
    maxPages,
    token
}) {
    if (!Array.isArray(labels) || labels.length === 0) {
        return [];
    }

    const incidents = [];
    const encodedLabels = encodeURIComponent(labels.join(','));
    let reachedWindowBoundary = false;

    for (let page = 1; page <= maxPages; page += 1) {
        const path = `/repos/${owner}/${repo}/issues?state=all&labels=${encodedLabels}&sort=created&direction=desc&per_page=${perPage}&page=${page}`;
        const payload = await githubGet(path, token);
        const pageIssues = Array.isArray(payload) ? payload : [];
        if (pageIssues.length === 0) break;

        for (const issue of pageIssues) {
            if (issue && issue.pull_request) continue;
            const createdAtMs = Date.parse(String(issue?.created_at || ''));
            if (!Number.isFinite(createdAtMs)) continue;
            if (createdAtMs < sinceMs) {
                reachedWindowBoundary = true;
                break;
            }
            incidents.push(issue);
        }

        if (reachedWindowBoundary) break;
    }

    return incidents;
}

function summarizeRuns(runs) {
    const conclusionCounts = {};
    const eventStats = {};

    runs.forEach((run) => {
        const conclusion = String(run?.conclusion || 'unknown');
        const event = String(run?.event || 'unknown');
        conclusionCounts[conclusion] = (conclusionCounts[conclusion] || 0) + 1;
        if (!eventStats[event]) {
            eventStats[event] = { total: 0, success: 0 };
        }
        eventStats[event].total += 1;
        if (conclusion === 'success') {
            eventStats[event].success += 1;
        }
    });

    let successStreak = 0;
    for (const run of runs) {
        if (String(run?.conclusion || '') === 'success') {
            successStreak += 1;
            continue;
        }
        break;
    }

    const totalRuns = runs.length;
    const successRuns = conclusionCounts.success || 0;
    const nonSuccessRuns = totalRuns - successRuns;
    const successRatePercent = totalRuns > 0
        ? Number(((successRuns / totalRuns) * 100).toFixed(3))
        : null;

    return {
        totalRuns,
        successRuns,
        nonSuccessRuns,
        successRatePercent,
        successStreak,
        conclusionCounts,
        eventStats
    };
}

function summarizeIncidents(incidents, totalRuns) {
    const open = incidents.filter((issue) => String(issue?.state || '') === 'open').length;
    const closed = incidents.filter((issue) => String(issue?.state || '') === 'closed').length;
    const total = incidents.length;
    const incidentRatePer100Runs = totalRuns > 0
        ? Number(((total / totalRuns) * 100).toFixed(3))
        : null;

    return {
        total,
        open,
        closed,
        incidentRatePer100Runs,
        sample: incidents.slice(0, 10).map((issue) => ({
            number: issue?.number || null,
            state: issue?.state || null,
            title: issue?.title || null,
            createdAt: issue?.created_at || null,
            updatedAt: issue?.updated_at || null,
            url: issue?.html_url || null
        }))
    };
}

async function main() {
    const repoInput = parseStringFlag('--repo', resolveDefaultRepo());
    if (!repoInput) {
        throw new Error('Missing --repo or GITHUB_REPOSITORY');
    }
    const { owner, repo } = parseRepo(repoInput);
    const workflowRef = parseStringFlag('--workflow', 'smoke-defense.yml');
    const branch = parseStringFlag('--branch', 'main');
    const windowDays = parseIntegerFlag('--window-days', 30, 1, 365);
    const incidentLabels = parseCsvFlag('--incident-labels', 'ops,intel,sla');
    const perPage = parseIntegerFlag('--per-page', 100, 1, 100);
    const maxPages = parseIntegerFlag('--max-pages', 10, 1, 100);
    const minSuccessRatePct = parseNumberFlag('--min-success-rate-pct', 0, 0, 100);
    const maxIncidentRatePer100Runs = parseNumberFlag('--max-incident-rate-per-100-runs', 100, 0, 10000);
    const token = parseStringFlag('--token', resolveDefaultToken());

    if (!token) {
        throw new Error('Missing GitHub token (use GITHUB_TOKEN, GH_TOKEN, or --token)');
    }

    const nowMs = Date.now();
    const sinceMs = nowMs - (windowDays * 24 * 60 * 60 * 1000);
    const sinceIso = new Date(sinceMs).toISOString();
    const untilIso = new Date(nowMs).toISOString();

    const runs = await listWorkflowRunsInWindow({
        owner,
        repo,
        workflowRef,
        branch,
        sinceMs,
        perPage,
        maxPages,
        token
    });
    const runSummary = summarizeRuns(runs);

    const incidents = await listIncidentsInWindow({
        owner,
        repo,
        labels: incidentLabels,
        sinceMs,
        perPage,
        maxPages,
        token
    });
    const incidentSummary = summarizeIncidents(incidents, runSummary.totalRuns);

    const checks = [
        {
            id: 'min_success_rate_pct',
            required: `>= ${minSuccessRatePct}`,
            value: runSummary.successRatePercent,
            ok: runSummary.successRatePercent !== null && runSummary.successRatePercent >= minSuccessRatePct
        },
        {
            id: 'max_incident_rate_per_100_runs',
            required: `<= ${maxIncidentRatePer100Runs}`,
            value: incidentSummary.incidentRatePer100Runs,
            ok: incidentSummary.incidentRatePer100Runs !== null &&
                incidentSummary.incidentRatePer100Runs <= maxIncidentRatePer100Runs
        }
    ];

    const ok = runSummary.totalRuns > 0 && checks.every((check) => check.ok);

    const report = {
        ok,
        repo: `${owner}/${repo}`,
        workflow: workflowRef,
        branch,
        windowDays,
        window: {
            since: sinceIso,
            until: untilIso
        },
        runSummary,
        incidentSummary: {
            labels: incidentLabels,
            ...incidentSummary
        },
        checks
    };

    console.log(JSON.stringify(report, null, 2));
    if (!ok) {
        process.exitCode = 2;
    }
}

main().catch((error) => {
    console.error('[INTEL_BURNIN_TREND] FAIL');
    console.error(error && error.stack ? error.stack : String(error));
    process.exit(1);
});
