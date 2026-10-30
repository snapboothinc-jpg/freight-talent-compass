import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  fetchCandidates, fetchCriticalPositions, fetchEmployees, fetchReadinessClasses,
  fetchReadinessAssessments, fetchSuccessionActivities, fetchAccessGrants, fetchDepartments,
  empName, type CandidateRow,
} from "@/lib/data";
import { saveCandidate, saveReadinessAssessment, saveSuccessionActivity, grantSuccessionAccess, revokeSuccessionAccess } from "@/lib/api/succession.functions";
import { unwrap, ApiError } from "@/lib/api/result";
import { usePermissions } from "@/hooks/use-me";
import { qk } from "@/lib/query-keys";
import { PageHeader, Panel, StatusBadge, LoadingRows, ErrorState, Field, NativeSelect, fmtDate, DefaultNote } from "@/components/app/kit";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/app/data-table";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { check } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/succession/candidates")({
  head: () => ({
    meta: [
      { title: "Succession candidates — NextGen" },
      { name: "description", content: "Candidates, readiness assessments, and development activities." },
    ],
  }),
  component: Page,
});

const emptyCandidate = { critical_position_id: "", employee_id: "", readiness_class_id: "", notes: "", status: "active" as const };

function Page() {
  const { has } = usePermissions();
  const qc = useQueryClient();
  const candidates = useQuery({ queryKey: qk.succ.candidates(), queryFn: () => fetchCandidates() });
  const positions = useQuery({ queryKey: qk.succ.positions(), queryFn: fetchCriticalPositions });
  const employees = useQuery({ queryKey: qk.org.employees(), queryFn: fetchEmployees });
  const classes = useQuery({ queryKey: qk.succ.classes(), queryFn: fetchReadinessClasses });

  const saveCand = useServerFn(saveCandidate);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyCandidate);
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState<CandidateRow | null>(null);

  if (candidates.error) return <ErrorState error={candidates.error} onRetry={() => candidates.refetch()} />;
  if (!candidates.data) return <LoadingRows />;

  const canManage = has("succession.manage");

  const doSave = async () => {
    setBusy(true);
    try {
      unwrap(
        await saveCand({
          data: {
            id: null,
            version: null,
            data: {
              ...form,
              readiness_class_id: form.readiness_class_id || undefined,
              notes: form.notes || undefined,
            },
          },
        }),
      );
      toast.success("Candidate added");
      setOpen(false);
      setForm(emptyCandidate);
      qc.invalidateQueries({ queryKey: qk.succ.all });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not save the candidate");
    } finally {
      setBusy(false);
    }
  };

  const cols: ColumnDef<CandidateRow, unknown>[] = [
    { header: "Candidate", cell: ({ row }) => <span className="font-bold">{row.original.employee ? empName(row.original.employee) : "—"}</span> },
    { header: "Critical position", cell: ({ row }) => row.original.critical_position?.position?.title ?? "—" },
    { header: "Department", cell: ({ row }) => row.original.critical_position?.department?.name ?? "—" },
    { header: "Readiness", cell: ({ row }) => (row.original.readiness_class ? <StatusBadge status="approved" label={row.original.readiness_class.label} /> : <span className="text-muted-foreground">Not assessed</span>) },
    { header: "Status", accessorKey: "status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      header: "",
      id: "actions",
      cell: ({ row }) => (
        <div className="text-right">
          <Button size="sm" variant="outline" onClick={() => setDetail(row.original)}>Open</Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Succession candidates"
        description="Readiness classes are configurable defaults that require organizational validation."
        actions={canManage ? <Button onClick={() => setOpen(true)}>Add candidate</Button> : undefined}
      />
      <Panel>
        <DataTable data={candidates.data} columns={cols} searchPlaceholder="Search candidates…" />
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add candidate</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label="Critical position" htmlFor="sc-pos" required>
              <NativeSelect id="sc-pos" value={form.critical_position_id} onChange={(e) => setForm({ ...form, critical_position_id: e.target.value })}>
                <option value="">Choose…</option>
                {(positions.data ?? []).filter((p) => p.status === "active").map((p) => (
                  <option key={p.id} value={p.id}>{p.position?.title} — {p.department?.name}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Employee" htmlFor="sc-emp" required>
              <NativeSelect id="sc-emp" value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })}>
                <option value="">Choose…</option>
                {(employees.data ?? []).map((emp) => (
                  <option key={emp.id} value={emp.id}>{empName(emp)} ({emp.employee_code})</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Readiness class" htmlFor="sc-class">
              <NativeSelect id="sc-class" value={form.readiness_class_id} onChange={(e) => setForm({ ...form, readiness_class_id: e.target.value })}>
                <option value="">Not assessed</option>
                {(classes.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Notes" htmlFor="sc-notes">
              <Textarea id="sc-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} maxLength={4000} />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={doSave} disabled={busy || !form.critical_position_id || !form.employee_id}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CandidateDetail candidate={detail} onClose={() => setDetail(null)} canManage={canManage} />
      <AccessGrants canManage={canManage} />
    </div>
  );
}

function CandidateDetail({ candidate, onClose, canManage }: { candidate: CandidateRow | null; onClose: () => void; canManage: boolean }) {
  const qc = useQueryClient();
  const assessments = useQuery({
    queryKey: [...qk.succ.all, "assess", candidate?.id],
    queryFn: () => fetchReadinessAssessments(candidate!.id),
    enabled: !!candidate,
  });
  const activities = useQuery({
    queryKey: [...qk.succ.all, "acts", candidate?.id],
    queryFn: () => fetchSuccessionActivities(candidate!.id),
    enabled: !!candidate,
  });
  const classes = useQuery({ queryKey: qk.succ.classes(), queryFn: fetchReadinessClasses });
  const saveAssess = useServerFn(saveReadinessAssessment);
  const saveAct = useServerFn(saveSuccessionActivity);

  const [assessForm, setAssessForm] = useState({ summary: "", readiness_class_id: "" });
  const [actForm, setActForm] = useState({ title: "", description: "", target_date: "" });
  const [busy, setBusy] = useState(false);

  const doAssess = async () => {
    if (!candidate) return;
    setBusy(true);
    try {
      unwrap(await saveAssess({ data: { candidate_id: candidate.id, summary: assessForm.summary, readiness_class_id: assessForm.readiness_class_id || null } }));
      toast.success("Readiness assessment recorded");
      setAssessForm({ summary: "", readiness_class_id: "" });
      qc.invalidateQueries({ queryKey: qk.succ.all });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  const doAct = async () => {
    if (!candidate) return;
    setBusy(true);
    try {
      unwrap(
        await saveAct({
          data: { id: null, candidate_id: candidate.id, title: actForm.title, description: actForm.description || undefined, status: "planned", target_date: actForm.target_date || undefined },
        }),
      );
      toast.success("Development activity added");
      setActForm({ title: "", description: "", target_date: "" });
      qc.invalidateQueries({ queryKey: qk.succ.all });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!candidate} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{candidate?.employee ? empName(candidate.employee) : "Candidate"}</DialogTitle>
        </DialogHeader>
        {candidate && (
          <div className="grid gap-4">
            <p className="text-sm text-muted-foreground">
              {candidate.critical_position?.position?.title} · {candidate.critical_position?.department?.name}
            </p>
            <div>
              <h3 className="text-sm font-bold">Readiness assessments</h3>
              {!assessments.data?.length ? (
                <p className="text-sm text-muted-foreground">None recorded.</p>
              ) : (
                <ul className="mt-1 space-y-1 text-sm">
                  {assessments.data.map((a) => (
                    <li key={a.id}>
                      <span className="font-semibold">{a.readiness_class?.label ?? "Unclassified"}</span> · {fmtDate(a.assessment_date)} ·{" "}
                      {a.assessor ? empName(a.assessor) : "—"}
                      <p className="text-xs text-muted-foreground">{a.summary}</p>
                    </li>
                  ))}
                </ul>
              )}
              {canManage && (
                <div className="mt-2 grid gap-2 rounded-md border p-3">
                  <Field label="Summary" htmlFor="ra-summary">
                    <Textarea id="ra-summary" value={assessForm.summary} onChange={(e) => setAssessForm({ ...assessForm, summary: e.target.value })} rows={2} maxLength={4000} />
                  </Field>
                  <Field label="Readiness class" htmlFor="ra-class">
                    <NativeSelect id="ra-class" value={assessForm.readiness_class_id} onChange={(e) => setAssessForm({ ...assessForm, readiness_class_id: e.target.value })}>
                      <option value="">Unclassified</option>
                      {(classes.data ?? []).map((c) => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </NativeSelect>
                  </Field>
                  <div>
                    <Button size="sm" onClick={doAssess} disabled={busy || assessForm.summary.length < 3}>Record assessment</Button>
                  </div>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold">Development activities</h3>
              {!activities.data?.length ? (
                <p className="text-sm text-muted-foreground">None planned.</p>
              ) : (
                <ul className="mt-1 space-y-1 text-sm">
                  {activities.data.map((a) => (
                    <li key={a.id} className="flex items-center gap-2">
                      <StatusBadge status={a.status} />
                      <span>{a.title}</span>
                      {a.target_date && <span className="text-xs text-muted-foreground">by {fmtDate(a.target_date)}</span>}
                    </li>
                  ))}
                </ul>
              )}
              {canManage && (
                <div className="mt-2 grid gap-2 rounded-md border p-3">
                  <Field label="Title" htmlFor="sa-title">
                    <Input id="sa-title" value={actForm.title} onChange={(e) => setActForm({ ...actForm, title: e.target.value })} maxLength={200} />
                  </Field>
                  <Field label="Target date" htmlFor="sa-date">
                    <Input id="sa-date" type="date" value={actForm.target_date} onChange={(e) => setActForm({ ...actForm, target_date: e.target.value })} />
                  </Field>
                  <div>
                    <Button size="sm" onClick={doAct} disabled={busy || actForm.title.length < 3}>Add activity</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AccessGrants({ canManage }: { canManage: boolean }) {
  const qc = useQueryClient();
  const grants = useQuery({ queryKey: qk.succ.grants(), queryFn: fetchAccessGrants });
  const departments = useQuery({ queryKey: qk.org.departments(), queryFn: fetchDepartments });
  const profiles = useQuery({
    queryKey: ["profiles-list"],
    queryFn: async () => check(await supabase.from("profiles").select("user_id, full_name, email")) as { user_id: string; full_name: string | null; email: string }[],
    enabled: canManage,
  });
  const grant = useServerFn(grantSuccessionAccess);
  const revoke = useServerFn(revokeSuccessionAccess);
  const [form, setForm] = useState({ user_id: "", department_id: "" });
  const [busy, setBusy] = useState(false);

  if (!canManage) return null;

  const doGrant = async () => {
    setBusy(true);
    try {
      unwrap(await grant({ data: form }));
      toast.success("Access granted");
      setForm({ user_id: "", department_id: "" });
      qc.invalidateQueries({ queryKey: qk.succ.grants() });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not grant access");
    } finally {
      setBusy(false);
    }
  };

  const doRevoke = async (id: string) => {
    try {
      unwrap(await revoke({ data: { id } }));
      toast.success("Access revoked");
      qc.invalidateQueries({ queryKey: qk.succ.grants() });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not revoke");
    }
  };

  return (
    <Panel title="Department access grants" className="mt-6" description="Department Heads can see succession records only for departments explicitly granted here.">
      <div className="mb-3 flex flex-wrap gap-2">
        <NativeSelect aria-label="User" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} className="w-64">
          <option value="">User…</option>
          {(profiles.data ?? []).map((p) => (
            <option key={p.user_id} value={p.user_id}>{p.full_name ?? p.email}</option>
          ))}
        </NativeSelect>
        <NativeSelect aria-label="Department" value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })} className="w-56">
          <option value="">Department…</option>
          {(departments.data ?? []).map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </NativeSelect>
        <Button onClick={doGrant} disabled={busy || !form.user_id || !form.department_id}>Grant</Button>
      </div>
      {!grants.data?.length ? (
        <p className="text-sm text-muted-foreground">No grants yet.</p>
      ) : (
        <ul className="divide-y text-sm">
          {grants.data.map((g) => (
            <li key={g.id} className="flex items-center justify-between py-2">
              <span>
                <span className="font-semibold">{g.profile?.full_name ?? g.profile?.email}</span> — {g.department?.name}
              </span>
              <Button size="sm" variant="outline" onClick={() => doRevoke(g.id)}>Revoke</Button>
            </li>
          ))}
        </ul>
      )}
      <DefaultNote />
    </Panel>
  );
}
