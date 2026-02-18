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
    return process.argv[valueIndex];
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
        accept: 'application/vnd.github+json',
        'user-agent': 'alidade-intel-remediation-dispatcher',
        authorization: `Bearer ${token}`
    };
    const response = await fetch(`https://api.github.com${path}`, { headers });
    if (!response.ok) {
        const body = await response.text();
        throw new Error(`GitHub API ${path} failed: HTTP ${response.status} ${body}`.trim());
    }
    return response.json();
}

async function githubPost(path, token, payload) {
    const headers = {
        accept: 'application/vnd.github+json',
        'content-type': 'application/json',
        'user-agent': 'alidade-intel-remediation-dispatcher',
        authorization: `Bearer ${token}`
    };
    const response = await fetch(`https://api.github.com${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
    });
    if (response.status !== 204) {
        const body = await response.text();
        throw new Error(`GitHub API ${path} dispatch failed: HTTP ${response.status} ${body}`.trim());
    }
}

async function findRecentNonSkippedFullRun({
    owner,
    repo,
    workflowRef,
    branch,
    requiredJobName,
    cooldownMinutes,
    perPage,
    maxPages,
    token
}) {
    const nowMs = Date.now();
    const cutoffMs = nowMs - Math.round(cooldownMinutes * 60 * 1000);
    const recentSamples = [];

    for (let page = 1; page <= maxPages; page += 1) {
        const encodedWorkflow = encodeURIComponent(workflowRef);
        const runsPath = `/repos/${owner}/${repo}/actions/workflows/${encodedWorkflow}/runs?branch=${encodeURIComponent(branch)}&per_page=${perPage}&page=${page}`;
        const runsPayload = await githubGet(runsPath, token);
        const runs = Array.isArray(runsPayload?.workflow_runs) ? runsPayload.workflow_runs : [];
        if (runs.length === 0) break;

        for (const run of runs) {
            const createdAtMs = Date.parse(String(run?.created_at || ''));
            if (!Number.isFinite(createdAtMs)) continue;
            if (createdAtMs < cutoffMs) return { match: null, recentSamples };
            if (String(run?.event || '') !== 'workflow_dispatch') continue;

            const jobsPath = `/repos/${owner}/${repo}/actions/runs/${run.id}/jobs?per_page=100`;
            const jobsPayload = await githubGet(jobsPath, token);
            const jobs = Array.isArray(jobsPayload?.jobs) ? jobsPayload.jobs : [];
            const fullJob = jobs.find((job) => String(job?.name || '') === requiredJobName) || null;
            if (!fullJob) continue;

            const jobConclusion = String(fullJob.conclusion || '');
            const jobStatus = String(fullJob.status || '');
            recentSamples.push({
                runId: run.id,
                createdAt: run.created_at || null,
                runStatus: run.status || null,
                runConclusion: run.conclusion || null,
                jobStatus: jobStatus || null,
                jobConclusion: jobConclusion || null
            });
            if (recentSamples.length > 10) {
                recentSamples.shift();
            }

            if (jobConclusion !== 'skipped') {
                return {
                    match: {
                        runId: run.id,
                        runUrl: run.html_url || null,
                        createdAt: run.created_at || null,
                        runStatus: run.status || null,
                        runConclusion: run.conclusion || null,
                        jobStatus: jobStatus || null,
                        jobConclusion: jobConclusion || null
                    },
                    recentSamples
                };
            }
        }
    }

    return { match: null, recentSamples };
}

async function main() {
    const repoInput = parseStringFlag('--repo', resolveDefaultRepo());
    if (!repoInput) {
        throw new Error('Missing --repo or GITHUB_REPOSITORY');
    }
    const { owner, repo } = parseRepo(repoInput);
    const workflowRef = parseStringFlag('--workflow', 'smoke-defense.yml');
    const branch = parseStringFlag('--branch', 'main');
    const requiredJobName = parseStringFlag('--require-job', 'intel-verify-full');
    const verifyProfile = parseStringFlag('--verify-profile', 'full');
    const slaMaxAgeHours = parseStringFlag('--sla-max-age-hours', '12');
    const cooldownMinutes = parseNumberFlag('--cooldown-minutes', 30, 1, 240);
    const perPage = parseIntegerFlag('--per-page', 30, 1, 100);
    const maxPages = parseIntegerFlag('--max-pages', 3, 1, 10);
    const token = parseStringFlag('--token', resolveDefaultToken());

    if (!token) {
        throw new Error('Missing GitHub token (use GITHUB_TOKEN, GH_TOKEN, or --token)');
    }

    const lookup = await findRecentNonSkippedFullRun({
        owner,
        repo,
        workflowRef,
        branch,
        requiredJobName,
        cooldownMinutes,
        perPage,
        maxPages,
        token
    });

    if (lookup.match) {
        console.log(JSON.stringify({
            ok: true,
            dispatched: false,
            reason: 'cooldown_active',
            repo: `${owner}/${repo}`,
            workflow: workflowRef,
            branch,
            requiredJobName,
            cooldownMinutes,
            latestRun: lookup.match,
            recentSamples: lookup.recentSamples
        }, null, 2));
        return;
    }

    const encodedWorkflow = encodeURIComponent(workflowRef);
    const dispatchPath = `/repos/${owner}/${repo}/actions/workflows/${encodedWorkflow}/dispatches`;
    await githubPost(dispatchPath, token, {
        ref: branch,
        inputs: {
            verify_profile: verifyProfile,
            sla_max_age_hours: String(slaMaxAgeHours)
        }
    });

    console.log(JSON.stringify({
        ok: true,
        dispatched: true,
        reason: 'stale_sla_dispatch_submitted',
        repo: `${owner}/${repo}`,
        workflow: workflowRef,
        branch,
        requiredJobName,
        verifyProfile,
        cooldownMinutes,
        slaMaxAgeHours
    }, null, 2));
}

main().catch((error) => {
    console.error('[INTEL_REMEDIATION_DISPATCH] FAIL');
    console.error(error && error.stack ? error.stack : String(error));
    process.exit(1);
});
