
const dns = require('dns');
const https = require('https');

const HOSTNAME = 'tynugwtetlclqowlguai.supabase.co';

console.log(`\n--- 1. DNS Lookup Test for: ${HOSTNAME} ---`);

dns.lookup(HOSTNAME, (err, address, family) => {
    if (err) {
        console.error(`❌ DNS Lookup Failed: ${err.message}`);
        console.error(`   Code: ${err.code}`);
        return; // Stop if DNS fails
    }
    console.log(`✅ DNS Resolved: ${address} (IPv${family})`);

    // Proceed to Connection Test
    console.log(`\n--- 2. HTTPS Connection Test ---`);
    const options = {
        hostname: HOSTNAME,
        port: 443,
        path: '/', // Root usually returns 404 but proves connectivity
        method: 'GET',
        timeout: 5000 // 5s timeout
    };

    const req = https.request(options, (res) => {
        console.log(`✅ Connected!`);
        console.log(`   Status Code: ${res.statusCode}`);
        console.log(`   Headers: ${JSON.stringify(res.headers)}`);

        res.on('data', () => { }); // Consume stream
    });

    req.on('error', (e) => {
        console.error(`❌ Connection Failed: ${e.message}`);
    });

    req.on('timeout', () => {
        req.destroy();
        console.error(`❌ Connection Timed Out (5000ms)`);
    });

    req.end();
});

// Try Fetch if available (Node 18+)
if (typeof fetch !== 'undefined') {
    console.log(`\n--- 3. Native Fetch Test ---`);
    fetch(`https://${HOSTNAME}/`)
        .then(res => console.log(`✅ Fetch Success: ${res.status} ${res.statusText}`))
        .catch(err => console.error(`❌ Fetch Failed: ${err.message}`));
} else {
    console.log(`\n--- 3. Native Fetch Test Skipped (Not available in this Node version) ---`);
}
