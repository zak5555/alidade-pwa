// 1. Imports (Deno style)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Configuration
const GUMROAD_PRODUCT_MAPPING: Record<string, string> = {
    'VgNVKs1iF8nVy97PTpRAsA==': 'basic',
    'kgeSRfdx1vyIJfjKCFhEnA==': 'ultimate',
}

console.log("[BOOT] Gumroad Webhook Function Initialized")
console.log("[BOOT] Product mapping:", JSON.stringify(GUMROAD_PRODUCT_MAPPING))

serve(async (req: Request) => {
    // 1. Setup Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("[FATAL] Missing Supabase Environment Variables")
        return new Response(JSON.stringify({ error: 'Server Configuration Error' }), { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 2. HTTP Method Check
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ message: 'Method not allowed' }), { status: 405 })
    }

    try {
        // 3. Parse Request
        const contentType = req.headers.get('content-type') || ''
        let payload: any = {}

        if (contentType.includes('application/json')) {
            payload = await req.json()
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
            const formData = await req.formData()
            payload = Object.fromEntries(formData.entries())
        } else {
            console.error("[PARSE] Unsupported Content-Type:", contentType)
            return new Response(JSON.stringify({ error: 'Unsupported Content-Type' }), { status: 400 })
        }

        console.log("[PARSE] Full payload keys:", Object.keys(payload).join(', '))

        // 4. Extract & Validate Data
        const sale_id = payload.sale_id
        const product_id = payload.product_id
        const product_permalink = payload.product_permalink || payload.permalink || 'N/A'
        const email = payload.email
        const license_key = payload.license_key
        const price = payload.price

        console.log(`[EXTRACT] sale_id=${sale_id}`)
        console.log(`[EXTRACT] product_id=[${product_id}] (type: ${typeof product_id})`)
        console.log(`[EXTRACT] product_permalink=${product_permalink}`)
        console.log(`[EXTRACT] email=${email}`)
        console.log(`[EXTRACT] license_key=${license_key || '(none)'}`)
        console.log(`[EXTRACT] price=${price}`)

        if (!email || !product_id) {
            console.error("[VALIDATE] Missing required fields: email or product_id")
            return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
        }

        // 5. Determine Tier
        const trimmedProductId = String(product_id).trim()
        console.log(`[TIER] Looking up trimmed product_id: [${trimmedProductId}]`)
        console.log(`[TIER] Available mappings: ${JSON.stringify(Object.keys(GUMROAD_PRODUCT_MAPPING))}`)

        const newTier = GUMROAD_PRODUCT_MAPPING[trimmedProductId]
        const matchStatus = newTier ? `mapped_to_${newTier}` : 'unmapped'

        console.log(`[TIER] Result: newTier=[${newTier}] matchStatus=[${matchStatus}]`)

        // Log to webhook_debug table for inspection
        try {
            await supabase.from('webhook_debug').insert({
                product_id: trimmedProductId,
                payload: payload,
                match_status: matchStatus
            })
        } catch (dbgErr) {
            console.warn("[DEBUG_TABLE] Failed to log:", dbgErr)
        }

        if (!newTier) {
            console.warn(`[TIER] ❌ Unknown Product ID: [${trimmedProductId}]. Ignoring.`)
            return new Response(JSON.stringify({ message: 'Product ID not mapped, ignoring' }), { status: 200 })
        }

        console.log(`[FLOW] ✅ Processing Order: ${sale_id} for ${email} -> Tier: ${newTier}`)

        // 6. User Management Logic
        let userId: string | null = null

        const { data: existingProfile } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single()

        if (existingProfile) {
            console.log(`[USER] Found in public.users: ${existingProfile.id}`)
            userId = existingProfile.id
        } else {
            console.log(`[USER] Not found. Creating auth user...`)

            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: email,
                email_confirm: true,
                user_metadata: { source: 'gumroad' }
            })

            if (!authError && authData.user) {
                userId = authData.user.id
                console.log(`[USER] Created new Auth User: ${userId}`)
            } else {
                console.warn("[USER] Auth creation failed:", authError?.message)

                if (authError?.message?.includes("already registered") || authError?.status === 422) {
                    console.error("[USER] CRITICAL: Exists in Auth but not Public. Cannot resolve ID.")
                    return new Response(JSON.stringify({ error: 'User consistency error. Contact support.' }), { status: 500 })
                }

                return new Response(JSON.stringify({ error: 'Auth User Creation Failed' }), { status: 500 })
            }
        }

        // 7. Update User License
        if (userId) {
            const finalKey = license_key || sale_id
            console.log(`[DB] Upserting license: userId=${userId}, tier=${newTier}, key=${finalKey}`)

            const { error: updateError } = await supabase
                .from('users')
                .upsert({
                    id: userId,
                    email: email,
                    license_tier: newTier,
                    license_key: finalKey,
                    gumroad_order_id: sale_id,
                    metadata: {
                        gumroad_price: price,
                        purchase_date: new Date().toISOString()
                    }
                })

            if (updateError) {
                console.error("[DB] ❌ Failed to update user license:", updateError)
                return new Response(JSON.stringify({ error: 'Database Update Failed' }), { status: 500 })
            }

            console.log("[DB] ✅ License upserted successfully")

            // 8. Log Usage
            await supabase.from('usage_logs').insert({
                user_id: userId,
                feature_name: 'license_system',
                action: 'purchase',
                metadata: { product_id: trimmedProductId, sale_id, tier: newTier, price }
            })

            // ═══════════════════════════════════════════════════════
            // 9. SEND LICENSE KEY EMAIL — TIER-AGNOSTIC
            //    Logic: if we have an email and a key, SEND IT.
            //    No tier check. Period.
            // ═══════════════════════════════════════════════════════
            console.log(`[EMAIL] ▶ Starting email sequence. email=${email}, key=${finalKey}, tier=${newTier}`)

            if (email && finalKey) {
                console.log(`[EMAIL] ✅ Condition passed (email && key both truthy). Drafting email for [${newTier}]...`)

                const resendApiKey = Deno.env.get('RESEND_API_KEY')
                console.log(`[EMAIL] RESEND_API_KEY present: ${!!resendApiKey}`)

                if (resendApiKey) {
                    const tierLabel = newTier.toUpperCase()
                    const isUltimate = newTier === 'ultimate'
                    const subject = `Welcome to ALIDADE ${tierLabel} — Your Access Key`

                    const html = `
                    <div style="font-family: monospace; color: #333; padding: 20px;">
                        <h2 style="color: ${isUltimate ? '#d97706' : '#52525b'};">ALIDADE // ${tierLabel}</h2>
                        <p>Access Granted.</p>

                        <div style="background: #f4f4f5; padding: 15px; border-radius: 4px; margin: 20px 0;">
                            <strong>YOUR ACCESS KEY:</strong><br>
                            <code style="font-size: 18px; font-weight: bold;">${finalKey}</code>
                        </div>

                        <p>To activate:</p>
                        <ol>
                            <li>Open ALIDADE PWA</li>
                            <li>Go to Settings > Account</li>
                            <li>Tap "Paste License Key"</li>
                        </ol>

                        <p>Return to base:<br>
                        <a href="https://alidade.app">https://alidade.app</a>
                        </p>
                    </div>
                    `

                    console.log(`[EMAIL] Sending via Resend API to ${email}...`)

                    try {
                        const res = await fetch('https://api.resend.com/emails', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${resendApiKey}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                from: 'ALIDADE Command <system@alidade.app>',
                                to: [email],
                                subject: subject,
                                html: html
                            })
                        })

                        const resBody = await res.text()
                        console.log(`[EMAIL] Resend response status: ${res.status}`)
                        console.log(`[EMAIL] Resend response body: ${resBody}`)

                        if (res.ok) {
                            console.log(`[EMAIL] ✅ Email sent successfully to ${email} for tier [${newTier}]`)
                        } else {
                            console.error(`[EMAIL] ❌ Resend API returned ${res.status}: ${resBody}`)
                        }
                    } catch (emailErr) {
                        console.error("[EMAIL] ❌ fetch() to Resend threw:", emailErr)
                    }
                } else {
                    console.error("[EMAIL] ❌ RESEND_API_KEY is not set. Cannot send email.")
                }
            } else {
                console.warn(`[EMAIL] ⚠ Skipped: email=${!!email}, key=${!!finalKey}`)
            }

            return new Response(JSON.stringify({ message: 'License updated', userId, tier: newTier }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        return new Response(JSON.stringify({ error: 'Failed to resolve User ID' }), { status: 500 })

    } catch (err) {
        console.error("[FATAL] Unexpected Error:", err)
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 })
    }
})
