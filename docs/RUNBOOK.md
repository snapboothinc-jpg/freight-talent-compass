# NextGen runbook

## Environment variables
| Variable | Where | Purpose |
|---|---|---|
| VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY | browser (public) | Lovable Cloud client |
| SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY | server | auth middleware, health check |
| SUPABASE_SERVICE_ROLE_KEY | server only | used only for: account creation/deactivation (admin), file type rejection cleanup, signed evidence URLs |

No secret is used in browser code. AI provider variables arrive with Phase 5.

## Setup
1. Migrations live in `drizzle/migrations/` and are applied in order by the platform.
2. Demo accounts (password `NextGen-Demo-2026!`): superadmin@, admin@, hr@, depthead@, supervisor@, employee@, ops@ `nextgen.demo`.
3. Remove demo data: sign in as a non-demo Super Admin and call `remove_demo_data()`.

## Health
`GET /api/public/health` returns `{status, checks}`; 503 when configuration is missing.

## Tests
- Unit: `bunx vitest run src/test/rules.test.ts`
- Live access (mutates demo data): `RUN_ACCESS_TESTS=1 bunx vitest run src/test/access.integration.test.ts`

## Backup and restore
Lovable Cloud takes managed database backups. Restore is requested through Lovable Cloud; after a restore, re-run the access tests. Retention periods are a "Default - requires organizational validation" policy and are not yet configured.

## Environments
Development, staging and production separation is not yet set up; one backend instance serves preview and published app.
