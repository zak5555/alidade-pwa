import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];

type IntelEventEnvelope = {
    id?: string;
    event_name?: string;
    occurred_at?: string;
    payload?: Record<string, JsonValue>;
    meta?: Record<string, JsonValue>;
    nonce?: string;
    signature?: string;
    signature_alg?: string;
};

type Rejection = {
    eventId: string | null;
    eventName: string | null;
    reason: string;
};

type GeoSnapshot = {
    lat: number;
    lng: number;
    atMs: number;
};

const CORS_HEADERS: HeadersInit = {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type, x-intel-ingest-key",
    "access-control-allow-methods": "POST, OPTIONS",
    "content-type": "application/json; charset=utf-8"
};

const CANONICAL_EVENTS = new Set([
    "price.quote_seen",
    "price.anomaly_detected",
    "price.crowd_submitted",
    "negotiation.round_recorded",
    "hazard.zone_state_changed",
    "sos.armed",
    "sos.triggered",
    "sos.deactivated",
    "context.update"
]);

const MAX_EVENTS_PER_REQUEST = 200;
const MAX_EVENT_AGE_MS = 5 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 60 * 1000;
const NONCE_TTL_MS = 15 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_EVENTS_PER_SESSION_WINDOW = 120;
const MAX_TRAVEL_SPEED_MPS = 70;

const recentNonceMemory = new Map<string, number>();
const sessionRateMemory = new Map<string, number[]>();
const sessionGeoMemory = new Map<string, GeoSnapshot>();

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: CORS_HEADERS
    });
}

function normalizeSessionId(meta: Record<string, JsonValue> | undefined): string {
    const raw = typeof meta?.sessionId === "string" ? meta.sessionId : "";
    const trimmed = raw.trim();
    return trimmed || "anonymous";
}

function normalizeString(value: unknown): string {
    return typeof value === "string" ? value : "";
}

function parseOccurredAtMs(occurredAtRaw: string): number | null {
    const parsed = Date.parse(occurredAtRaw);
    return Number.isFinite(parsed) ? parsed : null;
}

function toFiniteNumber(value: unknown): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function haversineDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const earthRadiusMeters = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusMeters * c;
}

function isCanonicalEvent(eventName: string): boolean {
    return CANONICAL_EVENTS.has(eventName);
}

function validatePayloadSchema(eventName: string, payload: Record<string, JsonValue> | undefined): boolean {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;

    switch (eventName) {
        case "context.update":
            return typeof payload.type === "string" &&
                Number.isFinite(Number(payload.lat)) &&
                Number.isFinite(Number(payload.lng));
        case "sos.armed":
            return typeof payload.method === "string";
        case "sos.triggered":
            return Number.isFinite(Number(payload.tier)) &&
                Number(payload.tier) >= 1 &&
                Number(payload.tier) <= 3;
        case "sos.deactivated":
            return Number.isFinite(Number(payload.durationSec ?? 0));
        case "hazard.zone_state_changed": {
            const state = String(payload.state ?? "").toLowerCase();
            return typeof payload.zoneId === "string" &&
                (state === "clear" || state === "caution" || state === "danger");
        }
        case "price.anomaly_detected":
            return Number.isFinite(Number(payload.askPrice)) &&
                Number.isFinite(Number(payload.expectedPrice));
        default:
            return true;
    }
}

function cleanupNonceMemory(nowMs: number): void {
    recentNonceMemory.forEach((expiresAt, key) => {
        if (expiresAt <= nowMs) recentNonceMemory.delete(key);
    });
}

function checkReplayNonce(sessionId: string, nonce: string, nowMs: number): boolean {
    if (!nonce) return false;
    cleanupNonceMemory(nowMs);
    const key = `${sessionId}::${nonce}`;
    if (recentNonceMemory.has(key)) return false;
    recentNonceMemory.set(key, nowMs + NONCE_TTL_MS);
    return true;
}

function checkSessionRateLimit(sessionId: string, nowMs: number): boolean {
    const startWindow = nowMs - RATE_LIMIT_WINDOW_MS;
    const existing = sessionRateMemory.get(sessionId) || [];
    const fresh = existing.filter((stamp) => stamp >= startWindow);
    if (fresh.length >= MAX_EVENTS_PER_SESSION_WINDOW) {
        sessionRateMemory.set(sessionId, fresh);
        return false;
    }
    fresh.push(nowMs);
    sessionRateMemory.set(sessionId, fresh);
    return true;
}

function extractCoordinates(payload: Record<string, JsonValue> | undefined): { lat: number; lng: number } | null {
    const lat = toFiniteNumber(payload?.lat);
    const lng = toFiniteNumber(payload?.lng);
    if (lat === null || lng === null) return null;
    return { lat, lng };
}

function checkGeoPlausibility(
    sessionId: string,
    payload: Record<string, JsonValue> | undefined,
    occurredAtMs: number
): boolean {
    const coordinates = extractCoordinates(payload);
    if (!coordinates) return true;

    const previous = sessionGeoMemory.get(sessionId);
    sessionGeoMemory.set(sessionId, {
        lat: coordinates.lat,
        lng: coordinates.lng,
        atMs: occurredAtMs
    });

    if (!previous) return true;
    const deltaMs = Math.max(1, occurredAtMs - previous.atMs);
    if (deltaMs <= 0) return false;

    const distanceMeters = haversineDistanceMeters(previous.lat, previous.lng, coordinates.lat, coordinates.lng);
    const speedMps = distanceMeters / (deltaMs / 1000);
    return speedMps <= MAX_TRAVEL_SPEED_MPS;
}

async function sha256Hex(value: string): Promise<string> {
    const data = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}

function timingSafeEquals(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let mismatch = 0;
    for (let i = 0; i < a.length; i += 1) {
        mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return mismatch === 0;
}

function buildSignatureCanonical(envelope: IntelEventEnvelope): string {
    return JSON.stringify({
        id: envelope.id ?? null,
        event_name: envelope.event_name ?? null,
        occurred_at: envelope.occurred_at ?? null,
        payload: envelope.payload ?? {},
        meta: envelope.meta ?? {},
        nonce: envelope.nonce ?? null
    });
}

async function verifyEnvelopeSignature(envelope: IntelEventEnvelope, secret: string): Promise<boolean> {
    const providedSignature = normalizeString(envelope.signature).trim().toLowerCase();
    if (!providedSignature) return false;

    const canonical = buildSignatureCanonical(envelope);
    const computed = await sha256Hex(`${secret}.${canonical}`);
    return timingSafeEquals(providedSignature, computed);
}

function resolveSupabaseClient(): SupabaseClient | null {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey) return null;
    return createClient(supabaseUrl, serviceRoleKey);
}

async function persistAcceptedEvents(
    client: SupabaseClient | null,
    acceptedEvents: IntelEventEnvelope[]
): Promise<{ persistedCount: number; persistenceWarning: string | null }> {
    if (!client) {
        return { persistedCount: 0, persistenceWarning: "supabase_client_unavailable" };
    }
    if (Deno.env.get("INTEL_INGEST_PERSIST") !== "1") {
        return { persistedCount: 0, persistenceWarning: "persistence_disabled" };
    }
    if (acceptedEvents.length === 0) {
        return { persistedCount: 0, persistenceWarning: null };
    }

    const rows = acceptedEvents.map((event) => ({
        event_id: event.id ?? null,
        event_name: event.event_name ?? null,
        occurred_at: event.occurred_at ?? null,
        session_id: normalizeSessionId(event.meta),
        payload: event.payload ?? {},
        context: event.meta ?? {},
        nonce: event.nonce ?? null,
        signature: event.signature ?? null
    }));

    const rowsWithEventId = rows
        .filter((row) => normalizeString(row.event_id).trim().length > 0)
        .map((row) => ({ ...row, event_id: normalizeString(row.event_id).trim() }));
    const rowsWithoutEventId = rows.filter((row) => normalizeString(row.event_id).trim().length === 0);

    let persistedCount = 0;
    const warnings: string[] = [];

    if (rowsWithEventId.length > 0) {
        const { error, count } = await client
            .from("intel_event_stream")
            .upsert(rowsWithEventId, {
                onConflict: "event_id",
                ignoreDuplicates: true,
                count: "exact"
            });
        if (error) {
            warnings.push(`persist_with_event_id_failed:${error.message}`);
        } else {
            persistedCount += Number.isFinite(Number(count)) ? Number(count) : rowsWithEventId.length;
        }
    }

    if (rowsWithoutEventId.length > 0) {
        const { error, count } = await client
            .from("intel_event_stream")
            .insert(rowsWithoutEventId, { count: "exact" });
        if (error) {
            warnings.push(`persist_without_event_id_failed:${error.message}`);
        } else {
            persistedCount += Number.isFinite(Number(count)) ? Number(count) : rowsWithoutEventId.length;
        }
    }

    if (warnings.length > 0) {
        return {
            persistedCount,
            persistenceWarning: warnings.join("|")
        };
    }
    return { persistedCount, persistenceWarning: null };
}

function authorizeRequest(req: Request, requiredApiKey: string): boolean {
    if (!requiredApiKey) return true;

    const headerKey = normalizeString(req.headers.get("x-intel-ingest-key")).trim();
    const bearer = normalizeString(req.headers.get("authorization")).replace(/^Bearer\s+/i, "").trim();
    const candidate = headerKey || bearer;
    return timingSafeEquals(candidate, requiredApiKey);
}

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: CORS_HEADERS });
    }

    if (req.method !== "POST") {
        return jsonResponse({ ok: false, error: "method_not_allowed" }, 405);
    }

    const persistEnabled = Deno.env.get("INTEL_INGEST_PERSIST") === "1";
    const requiredApiKey = normalizeString(Deno.env.get("INTEL_INGEST_API_KEY")).trim();
    if (persistEnabled && !requiredApiKey) {
        return jsonResponse({
            ok: false,
            error: "missing_ingest_api_key",
            detail: "Set INTEL_INGEST_API_KEY when INTEL_INGEST_PERSIST=1"
        }, 500);
    }

    if (!authorizeRequest(req, requiredApiKey)) {
        return jsonResponse({ ok: false, error: "unauthorized" }, 401);
    }

    const signingSecret = normalizeString(Deno.env.get("INTEL_INGEST_SIGNING_SECRET")).trim();
    if (!signingSecret) {
        return jsonResponse({
            ok: false,
            error: "missing_signing_secret",
            detail: "Set INTEL_INGEST_SIGNING_SECRET in function secrets"
        }, 500);
    }

    let payload: { events?: IntelEventEnvelope[] } | null = null;
    try {
        payload = await req.json();
    } catch (_error) {
        return jsonResponse({ ok: false, error: "invalid_json" }, 400);
    }

    const incomingEvents = Array.isArray(payload?.events) ? payload.events : [];
    if (incomingEvents.length === 0) {
        return jsonResponse({ ok: false, error: "empty_events" }, 400);
    }
    if (incomingEvents.length > MAX_EVENTS_PER_REQUEST) {
        return jsonResponse({
            ok: false,
            error: "request_too_large",
            maxEventsPerRequest: MAX_EVENTS_PER_REQUEST
        }, 413);
    }

    const acceptedEvents: IntelEventEnvelope[] = [];
    const rejectedEvents: Rejection[] = [];

    for (const event of incomingEvents) {
        const eventName = normalizeString(event?.event_name).trim();
        const eventId = normalizeString(event?.id).trim() || null;
        const occurredAt = normalizeString(event?.occurred_at).trim();
        const nonce = normalizeString(event?.nonce).trim();
        const sessionId = normalizeSessionId(event?.meta);
        const nowMs = Date.now();
        const occurredAtMs = parseOccurredAtMs(occurredAt);

        if (!eventName || !isCanonicalEvent(eventName)) {
            rejectedEvents.push({ eventId, eventName: eventName || null, reason: "unknown_event" });
            continue;
        }
        if (!occurredAtMs) {
            rejectedEvents.push({ eventId, eventName, reason: "invalid_occurred_at" });
            continue;
        }
        const eventAgeMs = nowMs - occurredAtMs;
        if (eventAgeMs > MAX_EVENT_AGE_MS || eventAgeMs < -MAX_FUTURE_SKEW_MS) {
            rejectedEvents.push({ eventId, eventName, reason: "stale_or_future_event" });
            continue;
        }
        if (!validatePayloadSchema(eventName, event.payload)) {
            rejectedEvents.push({ eventId, eventName, reason: "schema_validation_failed" });
            continue;
        }
        if (!checkSessionRateLimit(sessionId, nowMs)) {
            rejectedEvents.push({ eventId, eventName, reason: "rate_limit_exceeded" });
            continue;
        }
        if (!checkReplayNonce(sessionId, nonce, nowMs)) {
            rejectedEvents.push({ eventId, eventName, reason: "replay_nonce_detected" });
            continue;
        }
        if (!checkGeoPlausibility(sessionId, event.payload, occurredAtMs)) {
            rejectedEvents.push({ eventId, eventName, reason: "geo_implausible" });
            continue;
        }
        const signatureOk = await verifyEnvelopeSignature(event, signingSecret);
        if (!signatureOk) {
            rejectedEvents.push({ eventId, eventName, reason: "invalid_signature" });
            continue;
        }

        acceptedEvents.push(event);
    }

    const supabase = resolveSupabaseClient();
    const persistence = await persistAcceptedEvents(supabase, acceptedEvents);
    const status = rejectedEvents.length > 0 ? 202 : 200;

    return jsonResponse({
        ok: rejectedEvents.length === 0,
        acceptedCount: acceptedEvents.length,
        rejectedCount: rejectedEvents.length,
        persistedCount: persistence.persistedCount,
        persistenceWarning: persistence.persistenceWarning,
        rejected: rejectedEvents.slice(0, 50)
    }, status);
});
