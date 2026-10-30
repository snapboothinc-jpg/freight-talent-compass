import { createFileRoute } from "@tanstack/react-router";
import { authenticate, pageParams, paginate, pickSort, pickFilters, apiError } from "@/lib/api/v1.server";

const SORTABLE = ["created_at", "last_name", "employee_code"] as const;
const FILTERABLE = ["department_id", "position_id", "employment_status"] as const;

export const Route = createFileRoute("/api/v1/employees")({
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
          .from("employees")
          .select("id, employee_code, first_name, last_name, email, department_id, position_id, employment_status, hire_date, version")
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
