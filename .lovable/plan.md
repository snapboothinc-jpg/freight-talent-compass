# HRMS V2 Full System Audit (audit only, no fixes)

## Goal
Produce one evidence-based audit report comparing the uploaded HRMS V2 spec (15 sections, 721 lines) against the real app: code, database, permissions, and live behaviour for all seven roles. Nothing in the app or database is changed.

## What I will do

1. **Turn the spec into a numbered requirement list**
   Pull out every requirement from sections 1–15 (layout, the 2.2 sidebar per role, all six modules, Gemini, admin, reports, cross-module workflow, permissions/audit, validation checklist). Give each one an ID (for example PM-3.5-02). This list is what the completeness percentage is counted from.

2. **Review the code and database (read-only)**
   - Pages, layouts, sidebar/navigation map, sign-in and session handling.
   - Server operations, the AI module, outbox, `/api/v1`, PDF/CSV exports.
   - Every table, relationship, constraint, trigger, RLS policy and rule-enforcing database function, read through live read-only queries.
   - Follow each button to the server operation and database function it calls. Flag anything that is mock, only in the browser, or never wired up.

3. **Check each role live, with demo accounts only**
   Sign in as each of the seven demo roles. Record the actual sidebar, then compare it item by item with spec section 2.2. Open every page the role can reach, try direct URLs to pages it should not reach, and take screenshots in light and dark mode, plus collapsed and mobile sidebar.

4. **Run end-to-end workflows A–F on demo data**
   Run performance, competency, AI-assisted development, learning/training, succession and recognition. For each, check the 12 points: starting record, action, function, database write, status change, authorization, related records, notification, audit row, dashboard update, history, and that data is still there after refresh or a new session. Negative cases: unauthorized role, invalid weights, missing evidence, invalid transition, duplicate submit (idempotency), version conflict, expired session. Demo data is reset before and after with `reset_demo_data()`. Real records are never touched.
   - The AI call is attempted once through the existing module. If it fails, the step is marked BLOCKED with the reason; nothing is invented.

5. **Run the existing tests**
   Run the project's test command, including the live access tests against demo accounts, and record the actual pass/fail results.

6. **Write the report**
   Saved as a downloadable document (`/mnt/documents/HRMS_V2_Audit_Report.md`, plus a PDF copy), with a summary in chat. Sections A–J as you requested:
   - A. Executive summary, with completeness counted from the requirement statuses
   - B. Requirements compliance matrix, using your 9 status labels
   - C. Seven role and sidebar reports
   - D. Page-by-page audit
   - E. Workflow audit (A–F)
   - F. Database and backend
   - G. Security and permissions (P0 issues called out)
   - H. UI/UX
   - I. End-to-end test matrix with evidence
   - J. P0–P3 remediation roadmap with acceptance criteria
   - Final 9-question conclusion

## Ground rules
- Every finding is labeled either verified (live test or query result) or code-reading only.
- No source, schema, configuration or production-data changes. Only demo data is used and reset.
- Spec conflicts with earlier decisions (for example the AI model choice, or the fact that staging and production share one backend) are reported, not resolved.

## Technical notes
- Database reads go through read-only queries. Writes happen only through the app's normal functions, as demo users.
- Browser checks run on the local preview with minted demo sessions.
- Expected effort: large. The report will probably cover roughly 250–400 requirement rows.
