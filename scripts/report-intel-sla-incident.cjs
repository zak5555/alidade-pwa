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

function parseModeFlag(flagName, fallback) {
    const value = findLastFlagValue(flagName);
    if (value === undefined) return fallback;
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) return fallback;
    if (normalized !== 'open' && normalized !== 'resolve') {
        throw new Error(`${flagName} must be "open" or "resolve"`);
    }
    return normalized;
}

function parseCsvList(rawValue) {
    const raw = String(rawValue || '').trim();
    if (!raw) return [];
    const values = raw.split(',')
        .map((value) => String(value || '').trim())
        .filter((value) => value.length > 0);
    const seen = new Set();
    const unique = [];
    values.forEach((value) => {
        if (seen.has(value)) return;
        seen.add(value);
        unique.push(value);
    });
    return unique;
}

function parseCsvFlag(flagName, fallbackRawValue = '') {
    const value = findLastFlagValue(flagName);
    if (value === undefined) return parseCsvList(fallbackRawValue);
    return parseCsvList(value);
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

function mergeUniqueValues(...groups) {
    const seen = new Set();
    const merged = [];
    groups.forEach((group) => {
        const values = Array.isArray(group) ? group : [];
        values.forEach((value) => {
            const normalized = String(value || '').trim();
            if (!normalized || seen.has(normalized)) return;
            seen.add(normalized);
            merged.push(normalized);
        });
    });
    return merged;
}

function extractIssueLabelNames(issue) {
    const labels = Array.isArray(issue?.labels) ? issue.labels : [];
    return labels
        .map((label) => {
            if (typeof label === 'string') return label;
            return String(label?.name || '');
        })
        .map((label) => label.trim())
        .filter((label) => label.length > 0);
}

function extractIssueAssignees(issue) {
    const assignees = Array.isArray(issue?.assignees) ? issue.assignees : [];
    return assignees
        .map((assignee) => String(assignee?.login || '').trim())
        .filter((assignee) => assignee.length > 0);
}

function isHttpStatusError(error, statusCode) {
    const message = String(error && error.message ? error.message : error || '');
    return message.includes(`HTTP ${statusCode}`);
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

function buildResolutionComment({
    repo,
    workflowRef,
    branch,
    requiredJob,
    slaMaxAgeHours,
    slaOutcome
}) {
    const timestamp = new Date().toISOString();
    return [
        '### SLA Recovery Signal',
        '',
        `- Timestamp (UTC): ${timestamp}`,
        `- Repository: ${repo}`,
        `- Workflow: ${workflowRef}`,
        `- Branch: ${branch}`,
        `- Required Job: ${requiredJob}`,
        `- SLA Threshold (hours): ${slaMaxAgeHours}`,
        `- SLA Check Outcome: ${slaOutcome || 'success'}`,
        '',
        'Status: resolved automatically because SLA health is back within threshold.'
    ].join('\n');
}

async function findOpenIssueByTitle(owner, repo, token, title) {
    const issues = await githubRequest(`/repos/${owner}/${repo}/issues?state=open&per_page=100`, token, 'GET');
    if (!Array.isArray(issues)) return null;
    return issues.find((issue) => !issue.pull_request && String(issue.title || '').trim() === title) || null;
}

async function createIncidentIssue({
    owner,
    repo,
    token,
    title,
    body,
    labels,
    assignees
}) {
    const basePayload = { title, body, labels };
    if (!Array.isArray(assignees) || assignees.length === 0) {
        const createdIssue = await githubRequest(`/repos/${owner}/${repo}/issues`, token, 'POST', basePayload);
        return { createdIssue, assigneeFallback: false };
    }

    try {
        const createdIssue = await githubRequest(`/repos/${owner}/${repo}/issues`, token, 'POST', {
            ...basePayload,
            assignees
        });
        return { createdIssue, assigneeFallback: false };
    } catch (error) {
        if (!isHttpStatusError(error, 422)) {
            throw error;
        }
        const createdIssue = await githubRequest(`/repos/${owner}/${repo}/issues`, token, 'POST', basePayload);
        return {
            createdIssue,
            assigneeFallback: true,
            assigneeFallbackReason: String(error && error.message ? error.message : error || '')
        };
    }
}

async function patchIncidentIssueMetadata({
    owner,
    repo,
    token,
    issueNumber,
    labels,
    assignees
}) {
    const basePayload = { labels };
    if (!Array.isArray(assignees) || assignees.length === 0) {
        const updatedIssue = await githubRequest(
            `/repos/${owner}/${repo}/issues/${issueNumber}`,
            token,
            'PATCH',
            basePayload
        );
        return { updatedIssue, assigneeFallback: false };
    }

    try {
        const updatedIssue = await githubRequest(
            `/repos/${owner}/${repo}/issues/${issueNumber}`,
            token,
            'PATCH',
            {
                ...basePayload,
                assignees
            }
        );
        return { updatedIssue, assigneeFallback: false };
    } catch (error) {
        if (!isHttpStatusError(error, 422)) {
            throw error;
        }
        const updatedIssue = await githubRequest(
            `/repos/${owner}/${repo}/issues/${issueNumber}`,
            token,
            'PATCH',
            basePayload
        );
        return {
            updatedIssue,
            assigneeFallback: true,
            assigneeFallbackReason: String(error && error.message ? error.message : error || '')
        };
    }
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
    const mode = parseModeFlag('--mode', 'open');
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
    const labels = parseCsvFlag('--labels', process.env.INTEL_SLA_INCIDENT_LABELS || 'ops,incident,intel,sla,priority:p1');
    const assignees = parseCsvFlag('--assignees', process.env.INTEL_SLA_INCIDENT_ASSIGNEES || '');

    if (!token) {
        throw new Error('Missing GitHub token (use GITHUB_TOKEN, GH_TOKEN, or --token)');
    }

    const title = buildIncidentTitle(titlePrefix, workflowRef, branch);
    const incidentBody = buildIncidentBody({
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
    const resolutionComment = buildResolutionComment({
        repo: `${owner}/${repo}`,
        workflowRef,
        branch,
        requiredJob,
        slaMaxAgeHours,
        slaOutcome
    });

    const existingIssue = await findOpenIssueByTitle(owner, repo, token, title);

    if (mode === 'resolve') {
        if (dryRun) {
            console.log(JSON.stringify({
                ok: true,
                dryRun: true,
                mode,
                action: existingIssue ? 'would_close' : 'would_noop',
                title,
                labels,
                assignees,
                existingIssue: existingIssue
                    ? { number: existingIssue.number, url: existingIssue.html_url || null }
                    : null
            }, null, 2));
            return;
        }

        if (!existingIssue) {
            console.log(JSON.stringify({
                ok: true,
                mode,
                action: 'no_open_issue',
                title,
                labels,
                assignees
            }, null, 2));
            return;
        }

        const commentPayload = { body: resolutionComment };
        const createdComment = await githubRequest(
            `/repos/${owner}/${repo}/issues/${existingIssue.number}/comments`,
            token,
            'POST',
            commentPayload
        );
        const updatedIssue = await githubRequest(
            `/repos/${owner}/${repo}/issues/${existingIssue.number}`,
            token,
            'PATCH',
            { state: 'closed' }
        );
        console.log(JSON.stringify({
            ok: true,
            mode,
            action: 'closed',
            issueNumber: existingIssue.number,
            issueUrl: updatedIssue?.html_url || existingIssue.html_url || null,
            commentUrl: createdComment?.html_url || null,
            title,
            labels,
            assignees
        }, null, 2));
        return;
    }

    if (dryRun) {
        console.log(JSON.stringify({
            ok: true,
            dryRun: true,
            mode,
            action: existingIssue ? 'would_comment' : 'would_create',
            title,
            labels,
            assignees,
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
            incidentBody
        ].join('\n');
        const commentPayload = { body: comment };
        const createdComment = await githubRequest(
            `/repos/${owner}/${repo}/issues/${existingIssue.number}/comments`,
            token,
            'POST',
            commentPayload
        );
        const mergedLabels = mergeUniqueValues(extractIssueLabelNames(existingIssue), labels);
        const mergedAssignees = mergeUniqueValues(extractIssueAssignees(existingIssue), assignees);
        const metadataUpdate = await patchIncidentIssueMetadata({
            owner,
            repo,
            token,
            issueNumber: existingIssue.number,
            labels: mergedLabels,
            assignees: mergedAssignees
        });

        console.log(JSON.stringify({
            ok: true,
            mode,
            action: 'commented',
            issueNumber: existingIssue.number,
            issueUrl: existingIssue.html_url || null,
            commentUrl: createdComment?.html_url || null,
            title,
            labels: mergedLabels,
            assignees: mergedAssignees,
            assigneeFallback: Boolean(metadataUpdate.assigneeFallback),
            assigneeFallbackReason: metadataUpdate.assigneeFallbackReason || null
        }, null, 2));
        return;
    }

    const createResult = await createIncidentIssue({
        owner,
        repo,
        token,
        title,
        body: incidentBody,
        labels,
        assignees
    });
    const createdIssue = createResult.createdIssue;
    console.log(JSON.stringify({
        ok: true,
        mode,
        action: 'created',
        issueNumber: createdIssue?.number || null,
        issueUrl: createdIssue?.html_url || null,
        title,
        labels,
        assignees,
        assigneeFallback: Boolean(createResult.assigneeFallback),
        assigneeFallbackReason: createResult.assigneeFallbackReason || null
    }, null, 2));
}

main().catch((error) => {
    console.error('[INTEL_SLA_INCIDENT] FAIL');
    console.error(error && error.stack ? error.stack : String(error));
    process.exit(1);
});
