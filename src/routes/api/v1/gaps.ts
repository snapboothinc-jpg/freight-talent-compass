import { createFileRoute } from "@tanstack/react-router";
import { authenticate, pageParams, paginate, pickSort, pickFilters, apiError } from "@/lib/api/v1.server";

const SORTABLE = ["created_at", "gap", "status"] as const;
const FILTERABLE = ["employee_id", "competency_id", "status"] as const;

export const Route = createFileRoute("/api/v1/gaps")({
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
          .from("competency_gaps")
          .select("id, employee_id, competency_id, required_level, current_level, gap, status, created_at, version")
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
