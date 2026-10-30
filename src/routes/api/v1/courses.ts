import { createFileRoute } from "@tanstack/react-router";
import { authenticate, pageParams, paginate, pickSort, pickFilters, apiError } from "@/lib/api/v1.server";

const SORTABLE = ["created_at", "title"] as const;
const FILTERABLE = ["status"] as const;

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
