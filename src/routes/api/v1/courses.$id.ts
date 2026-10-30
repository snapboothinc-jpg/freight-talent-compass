import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { authenticate, apiError, requireIdempotencyKey, checkIfMatch, withEtag } from "@/lib/api/v1.server";

const patchSchema = z
  .object({
    title: z.string().trim().min(3).max(200).optional(),
    description: z.string().max(4000).optional(),
    duration_minutes: z.number().int().min(1).max(100000).optional(),
  })
  .strict();

export const Route = createFileRoute("/api/v1/courses/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const auth = await authenticate(request);
        if (auth instanceof Response) return auth;
        const { data, error } = await auth.supabase
          .from("courses")
          .select("id, title, description, status, duration_minutes, created_at, version")
          .eq("id", params.id)
          .maybeSingle();
        if (error) return apiError(403, "FORBIDDEN", "You do not have access to this resource");
        if (!data) return apiError(404, "NOT_FOUND", "Course not found");
        return withEtag(Response.json({ data }), data.id, data.version);
      },

      PATCH: async ({ request, params }) => {
        const auth = await authenticate(request);
        if (auth instanceof Response) return auth;
        const idem = requireIdempotencyKey(request);
        if (idem instanceof Response) return idem;

        const { data: current, error: readErr } = await auth.supabase
          .from("courses")
          .select("id, version")
          .eq("id", params.id)
          .maybeSingle();
        if (readErr) return apiError(403, "FORBIDDEN", "You do not have access to this resource");
        if (!current) return apiError(404, "NOT_FOUND", "Course not found");

        const precondition = checkIfMatch(request, current.id, current.version);
        if (precondition) return precondition;

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return apiError(400, "INVALID", "Request body must be JSON");
        }
        const parsed = patchSchema.safeParse(body);
        if (!parsed.success) return apiError(400, "INVALID", "Request body failed validation");

        // Idempotent replay: same key + same body returns the stored result.
        const bodyHash = JSON.stringify(parsed.data);
        const { data: prior } = await auth.supabase
          .from("idempotency_keys")
          .select("response")
          .eq("key", idem)
          .eq("user_id", auth.userId)
          .maybeSingle();
        if (prior?.response && typeof prior.response === "object" && (prior.response as { body_hash?: string }).body_hash === bodyHash) {
          return withEtag(Response.json((prior.response as { result: unknown }).result), current.id, current.version + 1);
        }

        // Updates go through the self-authorizing database operation (permission + audit in one transaction).
        const { data: result, error } = await auth.supabase.rpc("save_course", {
          _id: current.id,
          _version: current.version,
          _data: parsed.data,
        });
        if (error) {
          const msg = error.message ?? "";
          if (msg.startsWith("CONFLICT")) return apiError(409, "CONFLICT", "The resource changed; refetch and retry");
          if (msg.startsWith("FORBIDDEN")) return apiError(403, "FORBIDDEN", "You do not have permission to update courses");
          return apiError(400, "INVALID", "Update rejected");
        }

        await auth.supabase.from("idempotency_keys").insert({
          key: idem,
          user_id: auth.userId,
          response: { body_hash: bodyHash, result: { data: result } },
        });

        return withEtag(Response.json({ data: result }), current.id, current.version + 1);
      },
    },
  },
});
