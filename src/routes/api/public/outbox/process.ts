import { createFileRoute } from "@tanstack/react-router";

/**
 * Outbox processor endpoint. Called by a scheduler (pg_cron / external cron) with a
 * shared secret. Runs public.process_outbox, which handles pending notification,
 * email, and AI events with exponential-backoff retries and a dead-letter state.
 * The secret is compared in constant time; its value is never logged or returned.
 */
export const Route = createFileRoute("/api/public/outbox/process")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["OUTBOX_PROCESSOR_SECRET"];
        if (!secret) {
          return Response.json({ error: { code: "NOT_CONFIGURED", message: "Outbox processor secret is not configured" } }, { status: 503 });
        }
        const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
        if (!timingSafeEqual(provided, secret)) {
          return Response.json({ error: { code: "UNAUTHENTICATED", message: "Invalid credentials" } }, { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.rpc("process_outbox", { _limit: 50 });
        if (error) {
          return Response.json({ error: { code: "INTERNAL", message: "Outbox processing failed" } }, { status: 500 });
        }
        return Response.json({ ok: true, result: data });
      },
    },
  },
});

function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
