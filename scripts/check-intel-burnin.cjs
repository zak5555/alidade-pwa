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
        'user-agent': 'alidade-intel-burnin-checker'
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

async function listRecentWorkflowRuns({
    owner,
    repo,
    workflowRef,
    branch,
    limit,
    perPage,
    maxPages,
    token
}) {
    const runs = [];
    const encodedWorkflow = encodeURIComponent(workflowRef);

    for (let page = 1; page <= maxPages; page += 1) {
        const path = `/repos/${owner}/${repo}/actions/workflows/${encodedWorkflow}/runs?status=completed&per_page=${perPage}&page=${page}`;
        const payload = await githubGet(path, token);
        const pageRuns = Array.isArray(payload?.workflow_runs) ? payload.workflow_runs : [];
        if (pageRuns.length === 0) break;

        for (const run of pageRuns) {
            if (branch && String(run?.head_branch || '') !== branch) {
                continue;
            }
            runs.push(run);
            if (runs.length >= limit) {
                return runs;
            }
        }
    }

    return runs;
}

async function listOpenIncidents({
    owner,
    repo,
    labels,
    maxResults,
    token
}) {
    if (!Array.isArray(labels) || labels.length === 0) {
        return [];
    }

    const encodedLabels = encodeURIComponent(labels.join(','));
    const issues = [];
    const perPage = 100;
    const maxPages = Math.max(1, Math.ceil(maxResults / perPage));

    for (let page = 1; page <= maxPages; page += 1) {
        const path = `/repos/${owner}/${repo}/issues?state=open&labels=${encodedLabels}&per_page=${perPage}&page=${page}`;
        const payload = await githubGet(path, token);
        const pageIssues = Array.isArray(payload) ? payload : [];
        if (pageIssues.length === 0) break;

        for (const issue of pageIssues) {
            if (issue && issue.pull_request) continue;
            issues.push(issue);
            if (issues.length >= maxResults) return issues;
        }
    }

    return issues;
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

    return {
        totalRuns: runs.length,
        successStreak,
        conclusionCounts,
        eventStats
    };
}

function formatRunSample(run) {
    return {
        runId: run?.id || null,
        event: run?.event || null,
        conclusion: run?.conclusion || null,
        createdAt: run?.created_at || null,
        url: run?.html_url || null
    };
}

function formatIssueSample(issue) {
    return {
        number: issue?.number || null,
        title: issue?.title || null,
        createdAt: issue?.created_at || null,
        updatedAt: issue?.updated_at || null,
        url: issue?.html_url || null
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
    const minSuccessStreak = parseIntegerFlag('--min-success-streak', 8, 1, 500);
    const lookbackLimit = parseIntegerFlag('--lookback-limit', 30, 1, 500);
    const perPage = parseIntegerFlag('--per-page', 100, 1, 100);
    const maxPages = parseIntegerFlag('--max-pages', 5, 1, 50);
    const maxOpenIncidents = parseIntegerFlag('--max-open-incidents', 0, 0, 1000);
    const requiredSuccessEvents = parseCsvFlag('--require-success-events', '');
    const incidentLabels = parseCsvFlag('--incident-labels', 'ops,intel,sla');
    const incidentSampleLimit = parseIntegerFlag('--incident-sample-limit', 20, 1, 200);
    const token = parseStringFlag('--token', resolveDefaultToken());

    if (!token) {
        throw new Error('Missing GitHub token (use GITHUB_TOKEN, GH_TOKEN, or --token)');
    }

    const runs = await listRecentWorkflowRuns({
        owner,
        repo,
        workflowRef,
        branch,
        limit: lookbackLimit,
        perPage,
        maxPages,
        token
    });
    const runSummary = summarizeRuns(runs);

    const missingRequiredEventSuccesses = requiredSuccessEvents.filter((event) => {
        const stat = runSummary.eventStats[event];
        return !stat || stat.success < 1;
    });

    const openIncidents = await listOpenIncidents({
        owner,
        repo,
        labels: incidentLabels,
        maxResults: incidentSampleLimit,
        token
    });

    const ok =
        runSummary.successStreak >= minSuccessStreak &&
        openIncidents.length <= maxOpenIncidents &&
        missingRequiredEventSuccesses.length === 0;

    const report = {
        ok,
        repo: `${owner}/${repo}`,
        workflow: workflowRef,
        branch,
        minSuccessStreak,
        lookbackLimit,
        maxOpenIncidents,
        requiredSuccessEvents,
        missingRequiredEventSuccesses,
        runSummary,
        recentRuns: runs.slice(0, 10).map(formatRunSample),
        openIncidentSummary: {
            labels: incidentLabels,
            count: openIncidents.length,
            sample: openIncidents.slice(0, 10).map(formatIssueSample)
        }
    };

    console.log(JSON.stringify(report, null, 2));
    if (!ok) {
        process.exitCode = 2;
    }
}

main().catch((error) => {
    console.error('[INTEL_BURNIN] FAIL');
    console.error(error && error.stack ? error.stack : String(error));
    process.exit(1);
});
