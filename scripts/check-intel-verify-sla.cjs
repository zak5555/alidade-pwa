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

function parseNumberFlag(flagName, fallback, min, max) {
    const value = findLastFlagValue(flagName);
    if (value === undefined) return fallback;
    const raw = Number(value);
    if (!Number.isFinite(raw) || raw < min || raw > max) {
        throw new Error(`${flagName} must be a number in [${min}, ${max}]`);
    }
    return raw;
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
        'accept': 'application/vnd.github+json',
        'user-agent': 'alidade-intel-sla-watchdog'
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

async function main() {
    const repoInput = parseStringFlag('--repo', resolveDefaultRepo());
    if (!repoInput) {
        throw new Error('Missing --repo or GITHUB_REPOSITORY');
    }
    const { owner, repo } = parseRepo(repoInput);
    const workflowRef = parseStringFlag('--workflow', 'smoke-defense.yml');
    const branch = parseStringFlag('--branch', 'main');
    const requiredJobName = parseStringFlag('--require-success-job', 'intel-verify-full');
    const maxAgeHours = parseNumberFlag('--max-age-hours', 12, 1, 168);
    const perPage = parseIntegerFlag('--per-page', 50, 1, 100);
    const maxPages = parseIntegerFlag('--max-pages', 3, 1, 10);
    const token = parseStringFlag('--token', resolveDefaultToken());

    const nowMs = Date.now();
    const cutoffMs = nowMs - Math.round(maxAgeHours * 60 * 60 * 1000);

    let latestQualifiedRun = null;
    const recentRunSamples = [];
    let inspectedRuns = 0;
    let inspectedJobLists = 0;
    let reachedOlderRuns = false;

    for (let page = 1; page <= maxPages; page += 1) {
        const encodedWorkflow = encodeURIComponent(workflowRef);
        const runsPath = `/repos/${owner}/${repo}/actions/workflows/${encodedWorkflow}/runs?status=completed&per_page=${perPage}&page=${page}`;
        const runsPayload = await githubGet(runsPath, token);
        const runs = Array.isArray(runsPayload?.workflow_runs) ? runsPayload.workflow_runs : [];
        if (runs.length === 0) break;

        for (const run of runs) {
            inspectedRuns += 1;
            const runHeadBranch = String(run?.head_branch || '').trim();
            if (branch && runHeadBranch && runHeadBranch !== branch) {
                continue;
            }
            const createdAtMs = Date.parse(String(run?.created_at || ''));
            if (!Number.isFinite(createdAtMs)) continue;

            if (createdAtMs < cutoffMs) {
                reachedOlderRuns = true;
                break;
            }

            const jobsPath = `/repos/${owner}/${repo}/actions/runs/${run.id}/jobs?per_page=100`;
            const jobsPayload = await githubGet(jobsPath, token);
            inspectedJobLists += 1;
            const jobs = Array.isArray(jobsPayload?.jobs) ? jobsPayload.jobs : [];
            const requiredJob = jobs.find((job) => String(job?.name || '') === requiredJobName) || null;
            const requiredJobConclusion = requiredJob ? String(requiredJob.conclusion || '') : null;

            recentRunSamples.push({
                runId: run.id,
                event: run.event || null,
                headBranch: runHeadBranch || null,
                createdAt: run.created_at || null,
                runConclusion: run.conclusion || null,
                requiredJobConclusion
            });
            if (recentRunSamples.length > 10) {
                recentRunSamples.shift();
            }

            if (requiredJobConclusion === 'success') {
                latestQualifiedRun = {
                    runId: run.id,
                    runUrl: run.html_url || null,
                    createdAt: run.created_at || null,
                    updatedAt: run.updated_at || null,
                    event: run.event || null,
                    workflowName: run.name || null,
                    requiredJobName,
                    requiredJobConclusion
                };
                break;
            }
        }

        if (latestQualifiedRun || reachedOlderRuns) {
            break;
        }
    }

    const ageHours = latestQualifiedRun
        ? Number(((nowMs - Date.parse(latestQualifiedRun.createdAt)) / (60 * 60 * 1000)).toFixed(3))
        : null;

    const report = {
        ok: Boolean(latestQualifiedRun),
        repo: `${owner}/${repo}`,
        workflow: workflowRef,
        branch,
        requiredJobName,
        maxAgeHours,
        inspectedRuns,
        inspectedJobLists,
        reachedOlderRuns,
        latestQualifiedRun: latestQualifiedRun
            ? {
                ...latestQualifiedRun,
                ageHours
            }
            : null,
        recentRunSamples
    };

    console.log(JSON.stringify(report, null, 2));
    if (!report.ok) {
        process.exitCode = 2;
    }
}

main().catch((error) => {
    console.error('[INTEL_VERIFY_SLA] FAIL');
    console.error(error && error.stack ? error.stack : String(error));
    process.exit(1);
});
