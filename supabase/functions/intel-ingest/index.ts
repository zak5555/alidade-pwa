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
    sessionId: string;
    source: string;
    occurredAt: string | null;
    context: Record<string, JsonValue>;
};

type GeoSnapshot = {
    lat: number;
    lng: number;
    atMs: number;
};

type SourceRateLimitRule = {
    sourcePattern: string;
    maxEventsPerWindow: number;
    isWildcard: boolean;
};

const CORS_HEADERS: HeadersInit = {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type, x-intel-ingest-key",
    "access-control-allow-methods": "POST, OPTIONS",
    "content-type": "application/json; charset=utf-8"
};
const UTF8_DECODER = new TextDecoder();
const UTF8_ENCODER = new TextEncoder();

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
const MAX_REQUEST_BODY_BYTES = 512 * 1024;
const MAX_EVENT_AGE_MS = 5 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 60 * 1000;
const NONCE_TTL_MS = 15 * 60 * 1000;
const NONCE_MAP_MAX_ENTRIES = 100000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_EVENTS_PER_SESSION_WINDOW = 120;
const SOURCE_RATE_LIMITS_ENV_KEY = "INTEL_INGEST_SOURCE_RATE_LIMITS";
const MAX_TRAVEL_SPEED_MPS = 70;
const SESSION_GEO_TTL_MS = 30 * 60 * 1000;
const SESSION_MAP_MAX_ENTRIES = 5000;
const MAX_EVENT_ID_LENGTH = 128;
const MAX_EVENT_NAME_LENGTH = 128;
const MAX_SESSION_ID_LENGTH = 128;
const MAX_SOURCE_LENGTH = 64;
const MIN_NONCE_LENGTH = 12;
const MAX_NONCE_LENGTH = 160;
const MAX_META_BYTES = 8 * 1024;
const MAX_PAYLOAD_BYTES = 32 * 1024;
const MAX_EVENT_BYTES = 48 * 1024;

const recentNonceMemory = new Map<string, number>();
const sessionRateMemory = new Map<string, number[]>();
const sessionSourceRateMemory = new Map<string, number[]>();
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
    if (!trimmed) return "anonymous";
    const compact = trimmed
        .slice(0, MAX_SESSION_ID_LENGTH)
        .replace(/[^A-Za-z0-9._:-]/g, "");
    return compact || "anonymous";
}

function normalizeSource(meta: Record<string, JsonValue> | undefined): string {
    const raw = typeof meta?.source === "string" ? meta.source : "";
    const trimmed = raw.trim();
    if (!trimmed) return "unknown";
    const compact = trimmed
        .slice(0, MAX_SOURCE_LENGTH)
        .replace(/[^A-Za-z0-9._:-]/g, "");
    return compact || "unknown";
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

function isRecordObject(value: unknown): value is Record<string, JsonValue> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function jsonByteLength(value: unknown): number {
    try {
        const serialized = JSON.stringify(value ?? null);
        return UTF8_ENCODER.encode(serialized).length;
    } catch (_error) {
        return Number.POSITIVE_INFINITY;
    }
}

function isSafeIdentifier(value: string): boolean {
    return /^[A-Za-z0-9:_-]+$/.test(value);
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
    if (!isRecordObject(payload)) return false;

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
    if (recentNonceMemory.size > NONCE_MAP_MAX_ENTRIES) {
        for (const key of recentNonceMemory.keys()) {
            recentNonceMemory.delete(key);
            if (recentNonceMemory.size <= NONCE_MAP_MAX_ENTRIES) break;
        }
    }
}

function checkReplayNonce(sessionId: string, nonce: string, nowMs: number): boolean {
    if (!nonce) return false;
    cleanupNonceMemory(nowMs);
    const key = `${sessionId}::${nonce}`;
    if (recentNonceMemory.has(key)) return false;
    recentNonceMemory.set(key, nowMs + NONCE_TTL_MS);
    return true;
}

function parseSourceRateLimitRules(rawConfig: string): SourceRateLimitRule[] {
    if (!rawConfig) return [];

    const parsedRules: SourceRateLimitRule[] = [];
    for (const entryRaw of rawConfig.split(",")) {
        const entry = normalizeString(entryRaw).trim();
        if (!entry) continue;

        const separatorIndex = entry.includes("=")
            ? entry.indexOf("=")
            : entry.indexOf(":");
        if (separatorIndex <= 0 || separatorIndex >= entry.length - 1) {
            continue;
        }

        const sourcePatternRaw = entry.slice(0, separatorIndex).trim();
        const maxEventsRaw = entry.slice(separatorIndex + 1).trim();
        const maxEvents = Number(maxEventsRaw);
        if (!Number.isInteger(maxEvents) || maxEvents < 1 || maxEvents > 10000) {
            continue;
        }
        if (!sourcePatternRaw) {
            continue;
        }
        if (sourcePatternRaw.includes("*") && sourcePatternRaw !== "*" && !sourcePatternRaw.endsWith("*")) {
            continue;
        }

        parsedRules.push({
            sourcePattern: sourcePatternRaw,
            maxEventsPerWindow: maxEvents,
            isWildcard: sourcePatternRaw === "*" || sourcePatternRaw.endsWith("*")
        });
    }

    return parsedRules;
}

function sourceMatchesPattern(source: string, pattern: string, isWildcard: boolean): boolean {
    if (!isWildcard) {
        return source === pattern;
    }
    if (pattern === "*") {
        return true;
    }
    const prefix = pattern.slice(0, -1);
    return source.startsWith(prefix);
}

function resolveSourceRateLimit(source: string, sourceRules: SourceRateLimitRule[]): number {
    if (!sourceRules.length) return MAX_EVENTS_PER_SESSION_WINDOW;

    let fallbackLimit: number | null = null;
    for (const rule of sourceRules) {
        if (rule.sourcePattern === "*") {
            fallbackLimit = rule.maxEventsPerWindow;
            continue;
        }
        if (sourceMatchesPattern(source, rule.sourcePattern, rule.isWildcard)) {
            return rule.maxEventsPerWindow;
        }
    }
    return fallbackLimit ?? MAX_EVENTS_PER_SESSION_WINDOW;
}

function pruneRateMemory(memory: Map<string, number[]>, nowMs: number): void {
    const memoryPruneThreshold = nowMs - RATE_LIMIT_WINDOW_MS;
    memory.forEach((timestamps, key) => {
        const fresh = timestamps.filter((stamp) => stamp >= memoryPruneThreshold);
        if (fresh.length === 0) {
            memory.delete(key);
            return;
        }
        if (fresh.length !== timestamps.length) {
            memory.set(key, fresh);
        }
    });
    if (memory.size > SESSION_MAP_MAX_ENTRIES) {
        for (const key of memory.keys()) {
            memory.delete(key);
            if (memory.size <= SESSION_MAP_MAX_ENTRIES) break;
        }
    }
}

function consumeRateLimit(
    memory: Map<string, number[]>,
    key: string,
    nowMs: number,
    maxEventsPerWindow: number
): boolean {
    const startWindow = nowMs - RATE_LIMIT_WINDOW_MS;
    const existing = memory.get(key) || [];
    const fresh = existing.filter((stamp) => stamp >= startWindow);
    if (fresh.length >= maxEventsPerWindow) {
        memory.set(key, fresh);
        return false;
    }
    fresh.push(nowMs);
    memory.set(key, fresh);
    return true;
}

function checkSessionRateLimit(
    sessionId: string,
    source: string,
    nowMs: number,
    sourceRateLimitRules: SourceRateLimitRule[]
): boolean {
    pruneRateMemory(sessionRateMemory, nowMs);
    pruneRateMemory(sessionSourceRateMemory, nowMs);

    const sessionAllowed = consumeRateLimit(
        sessionRateMemory,
        sessionId,
        nowMs,
        MAX_EVENTS_PER_SESSION_WINDOW
    );
    if (!sessionAllowed) {
        return false;
    }

    const sourceLimit = resolveSourceRateLimit(source, sourceRateLimitRules);
    const sessionSourceKey = `${sessionId}::${source}`;
    return consumeRateLimit(sessionSourceRateMemory, sessionSourceKey, nowMs, sourceLimit);
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
    const geoPruneThreshold = Date.now() - SESSION_GEO_TTL_MS;
    sessionGeoMemory.forEach((snapshot, key) => {
        if (snapshot.atMs < geoPruneThreshold) {
            sessionGeoMemory.delete(key);
        }
    });
    if (sessionGeoMemory.size > SESSION_MAP_MAX_ENTRIES) {
        for (const key of sessionGeoMemory.keys()) {
            sessionGeoMemory.delete(key);
            if (sessionGeoMemory.size <= SESSION_MAP_MAX_ENTRIES) break;
        }
    }

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
    const data = UTF8_ENCODER.encode(value);
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

function validateEnvelopeShape(event: IntelEventEnvelope): { ok: true } | { ok: false; reason: string } {
    const signatureAlg = normalizeString(event.signature_alg).trim().toLowerCase();
    if (signatureAlg !== "sha256") {
        return { ok: false, reason: "invalid_signature_alg" };
    }

    const eventId = normalizeString(event.id).trim();
    if (eventId && (eventId.length > MAX_EVENT_ID_LENGTH || !isSafeIdentifier(eventId))) {
        return { ok: false, reason: "invalid_event_id" };
    }

    const nonce = normalizeString(event.nonce).trim();
    if (nonce.length < MIN_NONCE_LENGTH || nonce.length > MAX_NONCE_LENGTH || !isSafeIdentifier(nonce)) {
        return { ok: false, reason: "invalid_nonce" };
    }

    if (!isRecordObject(event.payload)) {
        return { ok: false, reason: "payload_not_object" };
    }
    if (!isRecordObject(event.meta)) {
        return { ok: false, reason: "meta_not_object" };
    }

    const payloadBytes = jsonByteLength(event.payload);
    if (!Number.isFinite(payloadBytes) || payloadBytes > MAX_PAYLOAD_BYTES) {
        return { ok: false, reason: "payload_too_large" };
    }

    const metaBytes = jsonByteLength(event.meta);
    if (!Number.isFinite(metaBytes) || metaBytes > MAX_META_BYTES) {
        return { ok: false, reason: "meta_too_large" };
    }

    const eventBytes = jsonByteLength({
        id: eventId || null,
        event_name: event.event_name ?? null,
        occurred_at: event.occurred_at ?? null,
        payload: event.payload,
        meta: event.meta,
        nonce,
        signature: event.signature ?? null,
        signature_alg: signatureAlg
    });
    if (!Number.isFinite(eventBytes) || eventBytes > MAX_EVENT_BYTES) {
        return { ok: false, reason: "event_too_large" };
    }

    return { ok: true };
}

function buildRejection(event: IntelEventEnvelope | null | undefined, reason: string): Rejection {
    const meta = isRecordObject(event?.meta) ? event.meta : {};
    const eventIdRaw = normalizeString(event?.id).trim();
    const eventNameRaw = normalizeString(event?.event_name).trim();
    const occurredAtRaw = normalizeString(event?.occurred_at).trim();

    return {
        eventId: eventIdRaw ? eventIdRaw.slice(0, MAX_EVENT_ID_LENGTH) : null,
        eventName: eventNameRaw ? eventNameRaw.slice(0, MAX_EVENT_NAME_LENGTH) : null,
        reason,
        sessionId: normalizeSessionId(meta),
        source: normalizeSource(meta),
        occurredAt: occurredAtRaw || null,
        context: meta
    };
}

function resolveSupabaseClient(): SupabaseClient | null {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey) return null;
    return createClient(supabaseUrl, serviceRoleKey);
}

async function readRequestBodyBytes(req: Request, maxBytes: number): Promise<{
    ok: true;
    bytes: Uint8Array;
} | {
    ok: false;
    error: string;
    status: number;
    detail?: string;
    maxRequestBodyBytes?: number;
}> {
    if (!req.body) {
        return { ok: true, bytes: new Uint8Array() };
    }

    const reader = req.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (!value || value.byteLength === 0) continue;

            total += value.byteLength;
            if (total > maxBytes) {
                try { await reader.cancel("request_body_too_large"); } catch (_error) { }
                return {
                    ok: false,
                    error: "request_body_too_large",
                    status: 413,
                    maxRequestBodyBytes: maxBytes
                };
            }
            chunks.push(value);
        }
    } catch (_error) {
        return {
            ok: false,
            error: "invalid_body_stream",
            status: 400
        };
    } finally {
        try { reader.releaseLock(); } catch (_error) { }
    }

    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return { ok: true, bytes };
}

async function parseRequestJsonBody(req: Request): Promise<{
    ok: true;
    payload: { events?: IntelEventEnvelope[] };
} | {
    ok: false;
    error: string;
    status: number;
    detail?: string;
    maxRequestBodyBytes?: number;
}> {
    const contentType = normalizeString(req.headers.get("content-type")).toLowerCase();
    if (contentType && !contentType.includes("application/json")) {
        return {
            ok: false,
            error: "unsupported_media_type",
            status: 415,
            detail: "content-type must include application/json"
        };
    }

    const bodyRead = await readRequestBodyBytes(req, MAX_REQUEST_BODY_BYTES);
    if (!bodyRead.ok) {
        return bodyRead;
    }
    if (bodyRead.bytes.byteLength > MAX_REQUEST_BODY_BYTES) {
        return {
            ok: false,
            error: "request_body_too_large",
            status: 413,
            maxRequestBodyBytes: MAX_REQUEST_BODY_BYTES
        };
    }

    const bodyText = UTF8_DECODER.decode(bodyRead.bytes);
    let payload: { events?: IntelEventEnvelope[] } | null = null;
    try {
        payload = JSON.parse(bodyText);
    } catch (_error) {
        return {
            ok: false,
            error: "invalid_json",
            status: 400
        };
    }
    return { ok: true, payload: payload || {} };
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

async function persistRejectedEvents(
    client: SupabaseClient | null,
    rejectedEvents: Rejection[]
): Promise<{ rejectedPersistedCount: number; rejectionPersistenceWarning: string | null }> {
    if (!client) {
        return { rejectedPersistedCount: 0, rejectionPersistenceWarning: "supabase_client_unavailable" };
    }
    if (Deno.env.get("INTEL_INGEST_PERSIST") !== "1") {
        return { rejectedPersistedCount: 0, rejectionPersistenceWarning: "persistence_disabled" };
    }
    if (rejectedEvents.length === 0) {
        return { rejectedPersistedCount: 0, rejectionPersistenceWarning: null };
    }

    const rows = rejectedEvents.map((rejection) => ({
        event_id: rejection.eventId,
        event_name: rejection.eventName,
        occurred_at: rejection.occurredAt && Number.isFinite(Date.parse(rejection.occurredAt))
            ? rejection.occurredAt
            : null,
        session_id: rejection.sessionId || "anonymous",
        source: rejection.source || "unknown",
        reason: rejection.reason,
        context: rejection.context || {}
    }));

    const { error, count } = await client
        .from("intel_event_rejections")
        .insert(rows, { count: "exact" });

    if (error) {
        return {
            rejectedPersistedCount: 0,
            rejectionPersistenceWarning: `persist_rejections_failed:${error.message}`
        };
    }

    return {
        rejectedPersistedCount: Number.isFinite(Number(count)) ? Number(count) : rows.length,
        rejectionPersistenceWarning: null
    };
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

    const contentLengthRaw = normalizeString(req.headers.get("content-length")).trim();
    if (contentLengthRaw) {
        const contentLength = Number(contentLengthRaw);
        if (!Number.isFinite(contentLength) || contentLength < 0) {
            return jsonResponse({ ok: false, error: "invalid_content_length" }, 400);
        }
        if (contentLength > MAX_REQUEST_BODY_BYTES) {
            return jsonResponse({
                ok: false,
                error: "request_body_too_large",
                maxRequestBodyBytes: MAX_REQUEST_BODY_BYTES
            }, 413);
        }
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
    const sourceRateLimitRules = parseSourceRateLimitRules(
        normalizeString(Deno.env.get(SOURCE_RATE_LIMITS_ENV_KEY)).trim()
    );

    const parsedBody = await parseRequestJsonBody(req);
    if (!parsedBody.ok) {
        return jsonResponse({
            ok: false,
            error: parsedBody.error,
            detail: parsedBody.detail,
            maxRequestBodyBytes: parsedBody.maxRequestBodyBytes
        }, parsedBody.status);
    }
    const payload = parsedBody.payload;

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
        const envelopeShape = validateEnvelopeShape(event);
        if (!envelopeShape.ok) {
            rejectedEvents.push(buildRejection(event, envelopeShape.reason));
            continue;
        }

        const eventName = normalizeString(event?.event_name).trim();
        const eventId = normalizeString(event?.id).trim() || null;
        const occurredAt = normalizeString(event?.occurred_at).trim();
        const nonce = normalizeString(event?.nonce).trim();
        const eventMeta = isRecordObject(event?.meta) ? event.meta : undefined;
        const sessionId = normalizeSessionId(eventMeta);
        const source = normalizeSource(eventMeta);
        const nowMs = Date.now();
        const occurredAtMs = parseOccurredAtMs(occurredAt);

        if (!eventName || !isCanonicalEvent(eventName)) {
            rejectedEvents.push(buildRejection(event, "unknown_event"));
            continue;
        }
        if (!occurredAtMs) {
            rejectedEvents.push(buildRejection(event, "invalid_occurred_at"));
            continue;
        }
        const eventAgeMs = nowMs - occurredAtMs;
        if (eventAgeMs > MAX_EVENT_AGE_MS || eventAgeMs < -MAX_FUTURE_SKEW_MS) {
            rejectedEvents.push(buildRejection(event, "stale_or_future_event"));
            continue;
        }
        if (!validatePayloadSchema(eventName, event.payload)) {
            rejectedEvents.push(buildRejection(event, "schema_validation_failed"));
            continue;
        }
        if (!checkSessionRateLimit(sessionId, source, nowMs, sourceRateLimitRules)) {
            rejectedEvents.push(buildRejection(event, "rate_limit_exceeded"));
            continue;
        }
        if (!checkReplayNonce(sessionId, nonce, nowMs)) {
            rejectedEvents.push(buildRejection(event, "replay_nonce_detected"));
            continue;
        }
        if (!checkGeoPlausibility(sessionId, event.payload, occurredAtMs)) {
            rejectedEvents.push(buildRejection(event, "geo_implausible"));
            continue;
        }
        const signatureOk = await verifyEnvelopeSignature(event, signingSecret);
        if (!signatureOk) {
            rejectedEvents.push(buildRejection(event, "invalid_signature"));
            continue;
        }

        acceptedEvents.push(event);
    }

    const supabase = resolveSupabaseClient();
    const persistence = await persistAcceptedEvents(supabase, acceptedEvents);
    const rejectionPersistence = await persistRejectedEvents(supabase, rejectedEvents);
    const status = rejectedEvents.length > 0 ? 202 : 200;

    return jsonResponse({
        ok: rejectedEvents.length === 0,
        acceptedCount: acceptedEvents.length,
        rejectedCount: rejectedEvents.length,
        persistedCount: persistence.persistedCount,
        persistenceWarning: persistence.persistenceWarning,
        rejectedPersistedCount: rejectionPersistence.rejectedPersistedCount,
        rejectionPersistenceWarning: rejectionPersistence.rejectionPersistenceWarning,
        rejected: rejectedEvents.slice(0, 50)
    }, status);
});
