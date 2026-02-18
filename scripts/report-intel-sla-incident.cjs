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

function parseBooleanFlag(flagName, fallback) {
    const value = findLastFlagValue(flagName);
    if (value === undefined) return fallback;
    const normalized = String(value || '').trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
    throw new Error(`${flagName} must be one of: true/false, 1/0, yes/no`);
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

async function githubRequest(path, token, method = 'GET', payload) {
    const headers = {
        accept: 'application/vnd.github+json',
        'content-type': 'application/json',
        'user-agent': 'alidade-intel-sla-incident-reporter',
        authorization: `Bearer ${token}`
    };

    const response = await fetch(`https://api.github.com${path}`, {
        method,
        headers,
        body: payload ? JSON.stringify(payload) : undefined
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`GitHub API ${path} failed: HTTP ${response.status} ${body}`.trim());
    }

    if (response.status === 204) return null;
    return response.json();
}

function buildIncidentTitle(prefix, workflowRef, branch) {
    return `${prefix} ${workflowRef} stale on ${branch}`;
}

function buildIncidentBody({
    repo,
    workflowRef,
    branch,
    requiredJob,
    slaMaxAgeHours,
    slaOutcome,
    remediationOutcome,
    remediationDispatched,
    remediationReason,
    remediationRunId,
    remediationRunUrl,
    remediationRunConclusion
}) {
    const timestamp = new Date().toISOString();
    const remediationRunLine = remediationRunUrl
        ? `[run #${remediationRunId || 'unknown'}](${remediationRunUrl})`
        : (remediationRunId || 'none');

    return [
        '## Intel SLA Incident',
        '',
        `- Timestamp (UTC): ${timestamp}`,
        `- Repository: ${repo}`,
        `- Workflow: ${workflowRef}`,
        `- Branch: ${branch}`,
        `- Required Job: ${requiredJob}`,
        `- SLA Threshold (hours): ${slaMaxAgeHours}`,
        `- SLA Check Outcome: ${slaOutcome || 'unknown'}`,
        `- Remediation Step Outcome: ${remediationOutcome || 'unknown'}`,
        `- Remediation Dispatched: ${remediationDispatched}`,
        `- Remediation Reason: ${remediationReason || 'none'}`,
        `- Latest Remediation Run: ${remediationRunLine}`,
        `- Latest Remediation Run Conclusion: ${remediationRunConclusion || 'unknown'}`,
        '',
        'Action: investigate intel-verify-full freshness and remediation pipeline.'
    ].join('\n');
}

async function findOpenIssueByTitle(owner, repo, token, title) {
    const issues = await githubRequest(`/repos/${owner}/${repo}/issues?state=open&per_page=100`, token, 'GET');
    if (!Array.isArray(issues)) return null;
    return issues.find((issue) => !issue.pull_request && String(issue.title || '').trim() === title) || null;
}

async function main() {
    const repoInput = parseStringFlag('--repo', resolveDefaultRepo());
    if (!repoInput) {
        throw new Error('Missing --repo or GITHUB_REPOSITORY');
    }
    const { owner, repo } = parseRepo(repoInput);
    const token = parseStringFlag('--token', resolveDefaultToken());
    const workflowRef = parseStringFlag('--workflow', 'smoke-defense.yml');
    const branch = parseStringFlag('--branch', 'main');
    const requiredJob = parseStringFlag('--required-job', 'intel-verify-full');
    const slaMaxAgeHours = parseStringFlag('--sla-max-age-hours', '12');
    const slaOutcome = parseStringFlag('--sla-outcome', 'unknown');
    const remediationOutcome = parseStringFlag('--remediation-outcome', 'unknown');
    const remediationDispatched = parseBooleanFlag('--remediation-dispatched', false);
    const remediationReason = parseStringFlag('--remediation-reason', '');
    const remediationRunId = parseStringFlag('--remediation-run-id', '');
    const remediationRunUrl = parseStringFlag('--remediation-run-url', '');
    const remediationRunConclusion = parseStringFlag('--remediation-run-conclusion', '');
    const titlePrefix = parseStringFlag('--title-prefix', '[INTEL_SLA_INCIDENT]');
    const dryRun = parseBooleanFlag('--dry-run', false);

    if (!token) {
        throw new Error('Missing GitHub token (use GITHUB_TOKEN, GH_TOKEN, or --token)');
    }

    const title = buildIncidentTitle(titlePrefix, workflowRef, branch);
    const body = buildIncidentBody({
        repo: `${owner}/${repo}`,
        workflowRef,
        branch,
        requiredJob,
        slaMaxAgeHours,
        slaOutcome,
        remediationOutcome,
        remediationDispatched,
        remediationReason,
        remediationRunId,
        remediationRunUrl,
        remediationRunConclusion
    });

    const existingIssue = await findOpenIssueByTitle(owner, repo, token, title);

    if (dryRun) {
        console.log(JSON.stringify({
            ok: true,
            dryRun: true,
            action: existingIssue ? 'would_comment' : 'would_create',
            title,
            existingIssue: existingIssue
                ? { number: existingIssue.number, url: existingIssue.html_url || null }
                : null
        }, null, 2));
        return;
    }

    if (existingIssue) {
        const comment = [
            '### New SLA Failure Signal',
            '',
            body
        ].join('\n');
        const commentPayload = { body: comment };
        const createdComment = await githubRequest(
            `/repos/${owner}/${repo}/issues/${existingIssue.number}/comments`,
            token,
            'POST',
            commentPayload
        );
        console.log(JSON.stringify({
            ok: true,
            action: 'commented',
            issueNumber: existingIssue.number,
            issueUrl: existingIssue.html_url || null,
            commentUrl: createdComment?.html_url || null,
            title
        }, null, 2));
        return;
    }

    const issuePayload = { title, body };
    const createdIssue = await githubRequest(`/repos/${owner}/${repo}/issues`, token, 'POST', issuePayload);
    console.log(JSON.stringify({
        ok: true,
        action: 'created',
        issueNumber: createdIssue?.number || null,
        issueUrl: createdIssue?.html_url || null,
        title
    }, null, 2));
}

main().catch((error) => {
    console.error('[INTEL_SLA_INCIDENT] FAIL');
    console.error(error && error.stack ? error.stack : String(error));
    process.exit(1);
});
