import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS: HeadersInit = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type, x-projector-key",
  "access-control-allow-methods": "POST, OPTIONS",
  "content-type": "application/json; charset=utf-8",
};

const DEFAULT_LIMIT = 500;
const MAX_LIMIT = 5000;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: CORS_HEADERS,
  });
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toProjectionLimit(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(1, Math.round(parsed)));
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

type ApiKeyMaterial = {
  plainKey: string;
  keyHash: string;
};

async function resolveRequiredApiKeyMaterial(client: ReturnType<typeof createClient>): Promise<ApiKeyMaterial> {
  const plainKey = normalizeString(Deno.env.get("POINTS_PROJECTOR_API_KEY"));
  const envHash = normalizeString(Deno.env.get("POINTS_PROJECTOR_API_KEY_HASH")).toLowerCase();
  if (plainKey) {
    return { plainKey, keyHash: "" };
  }
  if (envHash) {
    return { plainKey: "", keyHash: envHash };
  }

  try {
    const { data, error } = await client.rpc("get_points_projector_api_key_hash");
    if (error) return { plainKey: "", keyHash: "" };
    const dbHash = normalizeString(data).toLowerCase();
    return { plainKey: "", keyHash: dbHash };
  } catch (_error) {
    return { plainKey: "", keyHash: "" };
  }
}

async function isAuthorized(req: Request, material: ApiKeyMaterial): Promise<boolean> {
  const headerKey = normalizeString(req.headers.get("x-projector-key"));
  const bearer = normalizeString(req.headers.get("authorization")).replace(/^Bearer\s+/i, "");
  const candidate = headerKey || bearer;
  if (!material.plainKey && !material.keyHash) return true;
  if (!candidate) return false;
  if (material.plainKey) return candidate === material.plainKey;
  const candidateHash = await sha256Hex(candidate);
  return candidateHash === material.keyHash;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "method_not_allowed" }, 405);
  }

  const supabaseUrl = normalizeString(Deno.env.get("SUPABASE_URL"));
  const serviceRoleKey = normalizeString(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(
      {
        ok: false,
        error: "missing_supabase_env",
        detail: "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required",
      },
      500,
    );
  }

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const requiredApiKey = await resolveRequiredApiKeyMaterial(client);
  if (!await isAuthorized(req, requiredApiKey)) {
    return jsonResponse({ ok: false, error: "unauthorized" }, 401);
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch (_error) {
    body = {};
  }

  const envLimit = toProjectionLimit(Deno.env.get("POINTS_PROJECTOR_DEFAULT_LIMIT"));
  const requestedLimit = toProjectionLimit(body.p_limit ?? body.limit ?? envLimit);
  const startedAt = Date.now();

  const { data, error } = await client.rpc("project_points_from_intel_stream", {
    p_limit: requestedLimit,
  });

  const durationMs = Date.now() - startedAt;
  if (error) {
    return jsonResponse(
      {
        ok: false,
        error: "projection_rpc_failed",
        detail: error.message,
        durationMs,
        requestedLimit,
      },
      500,
    );
  }

  return jsonResponse({
    ok: true,
    requestedLimit,
    durationMs,
    result: data,
  });
});
