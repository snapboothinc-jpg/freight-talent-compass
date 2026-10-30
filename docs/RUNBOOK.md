# NextGen runbook

## Environment variables
| Variable | Where | Purpose |
|---|---|---|
| VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY | browser (public) | Lovable Cloud client |
| SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY | server | auth middleware, health check |
| SUPABASE_SERVICE_ROLE_KEY | server only | account creation/deactivation (admin), file type rejection cleanup, signed evidence URLs, outbox processing |
| LOVABLE_API_KEY | server only | Lovable AI provider (default) |
| GEMINI_API_KEY | server only | direct Gemini provider; switching providers is this variable plus the AI settings page |
| OUTBOX_PROCESSOR_SECRET | server only | bearer secret for the outbox processing endpoint |

No secret is used in browser code, logged, or returned in errors. The AI settings
page names a missing variable (e.g. `LOVABLE_API_KEY`) but never its value.

## Setup
1. Migrations live in `drizzle/migrations/` and are applied in order by the platform.
2. Demo accounts (password `NextGen-Demo-2026!`): superadmin@, admin@, hr@, depthead@, supervisor@, employee@, ops@ `nextgen.demo`.
3. Remove demo data: sign in as a non-demo Super Admin and call `remove_demo_data()`. Reset for a fresh demo run: `reset_demo_data()`. Both cover Phase 5–6 demo rows.

## Health
`GET /api/public/health` returns `{status, checks}`; 503 when configuration is missing.

## Outbox
Notifications, emails and AI calls are written to `public.outbox_events` in the same
transaction as the business change. Processing is asynchronous:

- Endpoint: `POST /api/public/outbox/process` with header `Authorization: Bearer $OUTBOX_PROCESSOR_SECRET`.
- Schedule it with an external cron (e.g. every minute) against the stable URL
  `https://project--<project-id>.lovable.app/api/public/outbox/process`.
- Behavior: `notification` events are marked sent; `email` events retry with
  exponential backoff (2^n minutes) up to 7 attempts, then move to the `dead`
  (dead-letter) state; unknown kinds go straight to `dead`.
- The processor runs as `service_role` only; the endpoint rejects callers without the secret.

## REST API (/api/v1)
- OpenAPI description: `GET /api/v1/openapi.json`.
- Auth: Supabase access token in `Authorization: Bearer <token>`; all data is RLS-scoped.
- Pagination: `?cursor=<id>&limit=<1-100>`; response carries `next_cursor`.
- Sorting/filtering: whitelisted fields only (`sort`, plus documented query params).
- Unsafe methods require an `Idempotency-Key` UUID header; replays with the same key
  and body return the stored result, a different body returns 409.
- Updates require `If-Match` with the ETag from the last GET (`W/"<id>:<version>"`);
  mismatches return 412, a missing header 428.
- Errors use the standard shape `{ "error": { "code", "message" } }`.

## Tests
- Unit (business rules): `bunx vitest run src/test/rules.test.ts`
- Live access (mutates demo data; resets it first): `RUN_ACCESS_TESTS=1 bunx vitest run src/test/access.integration.test.ts`

## Backup and restore
Lovable Cloud takes managed database backups. Restore is requested through Lovable Cloud; after a restore, re-run the access tests. Retention periods are a "Default - requires organizational validation" policy and are not yet configured.

## Environments
**Current state: one backend instance serves both the preview and the published app.**
Separate staging and production environments are NOT yet set up — this is an open item.

To set them up with Lovable Cloud:
1. Create a second Lovable project (or a second Cloud backend) for staging. Each Cloud
   backend has its own database, auth users, storage and keys — that separation is the
   point; never point staging at the production backend.
2. Apply the same migrations in order to the staging backend.
3. Set staging's own secrets (`GEMINI_API_KEY`/`LOVABLE_API_KEY`, `OUTBOX_PROCESSOR_SECRET`)
   on the staging environment only.
4. Promote by merging to the production project and publishing; never copy production
   data into staging — use `reset_demo_data()`/seeded demo data there.

## Account security
- Two-factor sign-in for Admin and Super Admin: **not yet built** (open item).
- Idle session timeout: **not yet built** (open item).
- Refresh token rotation: handled by Lovable Cloud auth (managed); no app code needed.
