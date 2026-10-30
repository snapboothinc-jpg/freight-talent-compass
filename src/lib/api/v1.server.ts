/**
 * Shared helpers for the versioned REST API under /api/v1.
 * Auth: Supabase access token in the Authorization header (same tokens the app uses).
 * Conventions: cursor pagination (?cursor=&limit=), whitelisted sort/filter fields,
 * Idempotency-Key on unsafe methods, ETag/If-Match on updates, standard error format.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export interface ApiUser {
  supabase: SupabaseClient<Database>;
  userId: string;
}

export const apiError = (status: number, code: string, message: string) =>
  Response.json({ error: { code, message } }, { status });

/** Authenticate a bearer token against Lovable Cloud auth; returns an RLS-scoped client. */
export async function authenticate(request: Request): Promise<ApiUser | Response> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!token) return apiError(401, "UNAUTHENTICATED", "Missing bearer token");
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const supabase = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        h.set("apikey", key);
        h.set("Authorization", `Bearer ${token}`);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return apiError(401, "UNAUTHENTICATED", "Invalid or expired token");
  return { supabase, userId: data.user.id };
}

// ---------------- cursor pagination ----------------
export interface PageParams {
  cursor: string | null;
  limit: number;
}

export function pageParams(url: URL, maxLimit = 100): PageParams {
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 25, 1), maxLimit);
  return { cursor: url.searchParams.get("cursor"), limit };
}

/** Cursor is the id of the last row of the previous page (rows are id-ordered). */
export function paginate<T extends { id: string }>(rows: T[], limit: number) {
  const page = rows.slice(0, limit);
  const nextCursor = rows.length > limit ? page[page.length - 1].id : null;
  return { data: page, next_cursor: nextCursor };
}

// ---------------- whitelisted sort/filter ----------------
export function pickSort(url: URL, allowed: readonly string[], fallback: string): { column: string; ascending: boolean } {
  const raw = url.searchParams.get("sort") ?? fallback;
  const desc = raw.startsWith("-");
  const column = desc ? raw.slice(1) : raw;
  if (!allowed.includes(column)) return { column: fallback, ascending: true };
  return { column, ascending: !desc };
}

export function pickFilters(url: URL, allowed: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of allowed) {
    const v = url.searchParams.get(key);
    if (v) out[key] = v;
  }
  return out;
}

// ---------------- idempotency ----------------
export function requireIdempotencyKey(request: Request): string | Response {
  const key = request.headers.get("idempotency-key")?.trim();
  if (!key || key.length > 200) {
    return apiError(400, "INVALID", "An Idempotency-Key header (1–200 chars) is required on this method");
  }
  return key;
}

// ---------------- ETag / If-Match ----------------
/** ETag is derived from the row version: W/"<id>:<version>". */
export function etag(id: string, version: number): string {
  return `W/"${id}:${version}"`;
}

export function checkIfMatch(request: Request, id: string, currentVersion: number): Response | null {
  const header = request.headers.get("if-match");
  if (!header) return apiError(428, "PRECONDITION_REQUIRED", "If-Match header with the current ETag is required");
  if (header !== etag(id, currentVersion)) {
    return apiError(412, "CONFLICT", "The resource changed since you loaded it; refetch and retry");
  }
  return null;
}

export function withEtag(res: Response, id: string, version: number): Response {
  res.headers.set("ETag", etag(id, version));
  return res;
}
