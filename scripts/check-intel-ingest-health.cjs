#!/usr/bin/env node
'use strict';

const { createClient } = require('@supabase/supabase-js');

function parseIntegerFlag(flagName, fallback, min, max) {
    const index = process.argv.indexOf(flagName);
    if (index === -1) return fallback;
    const raw = process.argv[index + 1];
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
        throw new Error(`${flagName} must be an integer in [${min}, ${max}]`);
    }
    return parsed;
}

async function main() {
    const supabaseUrl = String(process.env.SUPABASE_URL || '').trim();
    const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
    }

    const windowMinutes = parseIntegerFlag('--window-minutes', 15, 1, 1440);
    const minEvents = parseIntegerFlag('--min-events', 0, 0, 1000000);
    const maxDelayed = parseIntegerFlag('--max-delayed', 25, 0, 1000000);

    const client = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    });

    const { data, error } = await client.rpc('get_intel_ingest_health', {
        window_minutes: windowMinutes
    });

    if (error) {
        throw new Error(`RPC get_intel_ingest_health failed: ${error.message}`);
    }

    const metrics = data && typeof data === 'object' ? data : {};
    const totalEvents = Number(metrics.totalEvents || 0);
    const delayedIngestCount = Number(metrics.delayedIngestCount || 0);

    const checks = [
        {
            id: 'min_events',
            required: `>= ${minEvents}`,
            value: totalEvents,
            ok: totalEvents >= minEvents
        },
        {
            id: 'max_delayed',
            required: `<= ${maxDelayed}`,
            value: delayedIngestCount,
            ok: delayedIngestCount <= maxDelayed
        }
    ];

    const ok = checks.every((check) => check.ok);

    const report = {
        ok,
        windowMinutes,
        checks,
        metrics
    };

    console.log(JSON.stringify(report, null, 2));
    if (!ok) {
        process.exitCode = 2;
    }
}

main().catch((error) => {
    console.error('[INTEL_INGEST_HEALTH] FAIL');
    console.error(error && error.stack ? error.stack : String(error));
    process.exit(1);
});
