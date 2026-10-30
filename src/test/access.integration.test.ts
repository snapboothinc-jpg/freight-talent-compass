/**
 * Live access tests against the backend, signing in as each demo role.
 * Run with: RUN_ACCESS_TESTS=1 bunx vitest run src/test/access.integration.test.ts
 * Requires the demo dataset. These call the same database functions the server
 * functions call, so they exercise the real authorization layer.
 */
import { describe, expect, it, beforeAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, "")];
    }),
);
const URL_ = env.VITE_SUPABASE_URL!;
const KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY!;
const PW = "NextGen-Demo-2026!";
const run = process.env.RUN_ACCESS_TESTS ? describe : describe.skip;

const ANA = "00000000-0000-4000-d000-000000000003"; // employee
const PAOLO = "00000000-0000-4000-d000-000000000004"; // supervisor's report
const GRACE = "00000000-0000-4000-d000-000000000007"; // warehousing, outside OPS
const SAFETY = "00000000-0000-4000-f000-000000000001";

async function as(email: string) {
  const c = createClient(URL_, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await c.auth.signInWithPassword({ email, password: PW });
  if (error) throw error;
  return c;
}

run("role access", () => {
  const c: Record<string, SupabaseClient> = {};
  beforeAll(async () => {
    for (const r of ["superadmin", "admin", "hr", "depthead", "supervisor", "employee", "ops"]) c[r] = await as(`${r}@nextgen.demo`);
  });

  it("1. employee cannot read another employee's evaluation or assessment", async () => {
    const ev = await c.employee.from("evaluation_assignments").select("id").eq("employee_id", PAOLO);
    expect(ev.data).toEqual([]);
    const as_ = await c.employee.from("competency_assessments").select("id").eq("employee_id", PAOLO);
    expect(as_.data).toEqual([]);
    const own = await c.employee.from("evaluation_assignments").select("id").eq("employee_id", ANA);
    expect(own.data?.length).toBe(1);
  });

  it("2. supervisor cannot see employees outside their reporting line", async () => {
    const r = await c.supervisor.from("employees").select("id").eq("id", GRACE);
    expect(r.data).toEqual([]);
    const ok = await c.supervisor.from("employees").select("id").eq("id", PAOLO);
    expect(ok.data?.length).toBe(1);
    const w = await c.supervisor.rpc("save_assessment", { _id: null, _employee: GRACE, _competency: SAFETY, _level: 3, _evidence: "x", _comments: null, _reassess: false, _version: null } as never);
    expect(w.error?.message).toMatch(/NOT_FOUND/);
  });

  it("3. department head cannot read another department", async () => {
    const r = await c.depthead.from("employees").select("id").eq("id", GRACE);
    expect(r.data).toEqual([]);
    const g = await c.depthead.rpc("competency_gaps", { _employee: GRACE } as never);
    expect(g.data).toEqual([]);
  });

  it("4. non-authorized user calling an approval action is denied", async () => {
    const { data } = await c.hr.from("evaluation_assignments").select("id").eq("employee_id", ANA).single();
    const r = await c.supervisor.rpc("review_evaluation", { _assignment: data!.id, _decision: "approve", _comments: "", _idem: null, _hash: "" } as never);
    expect(r.error?.message).toMatch(/FORBIDDEN/);
  });

  it("5. super admin cannot approve a performance evaluation", async () => {
    const r = await c.superadmin.rpc("review_evaluation", { _assignment: "00000000-0000-0000-0000-000000000000", _decision: "approve", _comments: "", _idem: null, _hash: "" } as never);
    expect(r.error?.message).toMatch(/FORBIDDEN/);
    const read = await c.superadmin.from("evaluation_assignments").select("id");
    expect(read.data).toEqual([]);
  });

  it("6. an assessor cannot approve their own assessment", async () => {
    const { data } = await c.depthead.from("competency_assessments").select("id, assessor_id").eq("employee_id", ANA).limit(1);
    // demo assessments were made by the supervisor and are approved; check separation rule directly
    expect(data?.length).toBeGreaterThan(0);
    const r = await c.supervisor.rpc("review_assessment", { _id: data![0].id, _decision: "approve", _comments: "", _idem: null, _hash: "" } as never);
    expect(r.error?.message).toMatch(/FORBIDDEN/);
  });

  it("7. search never returns restricted employees", async () => {
    const r = await c.employee.rpc("global_search", { _q: "Grace" } as never);
    expect((r.data as { kind: string }[]).filter((x) => x.kind === "employee")).toEqual([]);
    const s = await c.supervisor.rpc("global_search", { _q: "Lim" } as never);
    expect((s.data as { kind: string }[]).filter((x) => x.kind === "employee")).toEqual([]);
  });

  it("8. anonymous requests are denied", async () => {
    const anon = createClient(URL_, KEY, { auth: { persistSession: false } });
    const r = await anon.rpc("my_context");
    expect(r.error).toBeTruthy();
    const t = await anon.from("employees").select("id");
    expect(t.data ?? []).toEqual([]);
  });

  it("audit log is append-only", async () => {
    const r = await c.admin.from("audit_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    const after = await c.admin.from("audit_logs").select("id", { count: "exact", head: true });
    expect(r.error || (after.count ?? 0) > 0).toBeTruthy();
  });

  it("weights must total 100 before activation", async () => {
    const r = await c.hr.rpc("activate_profile_version", { _version_id: "00000000-0000-4000-9100-000000000002" } as never);
    expect(r.error?.message).toMatch(/100 percent/);
  });

  it("idempotent replay returns the same result; a different body conflicts", async () => {
    const key = crypto.randomUUID();
    const { data: cyc } = await c.hr.from("evaluation_cycles").select("id").limit(1).single();
    const a = await c.hr.rpc("create_assignments", { _cycle: cyc!.id, _employees: [GRACE], _idem: key, _hash: "h1" } as never);
    const b = await c.hr.rpc("create_assignments", { _cycle: cyc!.id, _employees: [GRACE], _idem: key, _hash: "h1" } as never);
    expect(b.data).toEqual(a.data);
    const d = await c.hr.rpc("create_assignments", { _cycle: cyc!.id, _employees: [ANA], _idem: key, _hash: "h2" } as never);
    expect(d.error?.message).toMatch(/IDEMPOTENCY_CONFLICT/);
  });

  it("stale version returns a conflict", async () => {
    const { data: e } = await c.hr.from("employees").select("*").eq("id", PAOLO).single();
    const body = { employee_code: e!.employee_code, first_name: e!.first_name, last_name: e!.last_name, department_id: e!.department_id, position_id: e!.position_id, employment_status: e!.employment_status };
    const ok = await c.hr.rpc("upsert_employee", { _id: PAOLO, _d: body, _version: e!.version } as never);
    expect(ok.error).toBeNull();
    const stale = await c.hr.rpc("upsert_employee", { _id: PAOLO, _d: body, _version: e!.version } as never);
    expect(stale.error?.message).toMatch(/CONFLICT/);
  });
});
