import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { authenticate, pageParams, paginate, pickSort, pickFilters, apiError, requireIdempotencyKey } from "@/lib/api/v1.server";

const SORTABLE = ["created_at", "title"] as const;
const FILTERABLE = ["status"] as const;

const patchSchema = z
  .object({
    title: z.string().trim().min(3).max(200).optional(),
    description: z.string().max(4000).optional(),
    duration_minutes: z.number().int().min(1).max(100000).optional(),
  })
  .strict();

export const Route = createFileRoute("/api/v1/courses")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await authenticate(request);
        if (auth instanceof Response) return auth;
        const url = new URL(request.url);
        const { cursor, limit } = pageParams(url);
        const sort = pickSort(url, SORTABLE, "created_at");
        const filters = pickFilters(url, FILTERABLE);

        let q = auth.supabase
          .from("courses")
          .select("id, title, description, status, duration_minutes, created_at, version")
          .order(sort.column, { ascending: sort.ascending })
          .order("id")
          .limit(limit + 1);
        for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
        if (cursor) q = q.gt("id", cursor);

        const { data, error } = await q;
        if (error) return apiError(403, "FORBIDDEN", "You do not have access to this resource");
        return Response.json(paginate(data ?? [], limit));
      },
    },
  },
});

export const coursePatchSchema = patchSchema;
export { requireIdempotencyKey };
