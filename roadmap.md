# NextGen roadmap

## Done (this session)
- [x] Skills installed (80 skills + 1 nested group), license file, index
- [x] Phase 1: foundation, brand tokens, fonts, light/dark, app shell, shared components, protected routing
- [x] Phase 2: Cloud, schema, 7 roles, RLS, central policy, users and roles admin, employees, departments, positions, reporting lines
- [x] Phase 3: notifications, approval center, audit log, shared Zod schemas, scoped global search, private evidence storage
- [x] Phase 4: cycles, versioned profiles and builder, assignments, evaluation form with draft, submit, review and reopen; competency library, proficiency framework, requirements, assessments with evidence, gaps, Not Assessed, history

## In progress (Phases 5–6 session)
- [~] Phase 5 database: stage 1 applied (learning tables, permissions, settings, RLS — migration 0006). Staged next: training/AI/outbox tables, then RPCs and demo data (full script at docs/pending/phase5_learning_training_ai.sql)
- [ ] Phase 5 app: AI recommendations module + queue, learning pages (catalog, player, quizzes, paths), training pages (plans, calendar, sessions, attendance, results, effectiveness)

## Open (next sessions)
- [ ] Phase 5: AI recommendations (Lovable default model), learning (courses, player, quizzes, paths), training (plans, sessions, attendance, results, reassessment link)
- [ ] Phase 6: succession, recognition, reports with PDF export, integration settings
- [ ] /api/v1 REST surface and OpenAPI contract tests
- [ ] Outbox worker for email and AI side effects
- [ ] MFA requirement for Super Admin and Admin, session idle timeout
- [ ] Separate staging and production environments
- [ ] Playwright end-to-end suite kept in the repo (flows were verified manually this session)
