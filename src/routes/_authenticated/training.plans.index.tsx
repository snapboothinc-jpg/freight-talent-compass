import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { fetchPlans, fetchEmployees, empName, type PlanRow } from "@/lib/data";
import { saveDevelopmentPlan } from "@/lib/api/development.functions";
import { unwrap, ApiError } from "@/lib/api/result";
import { usePermissions } from "@/hooks/use-me";
import { qk } from "@/lib/query-keys";
import { PageHeader, StatusBadge, LoadingRows, ErrorState, Field, NativeSelect, fmtDate } from "@/components/app/kit";
import { DataTable } from "@/components/app/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/training/plans/")({
  head: () => ({
    meta: [
      { title: "Development plans — NextGen" },
      { name: "description", content: "Employee development plans with objectives, activities and progress." },
    ],
  }),
  component: Page,
});

function Page() {
  const { any, employeeId } = usePermissions();
  const qc = useQueryClient();
  const plans = useQuery({ queryKey: qk.train.plans(), queryFn: () => fetchPlans() });
  const employees = useQuery({ queryKey: qk.org.employees(), queryFn: fetchEmployees });
  const save = useServerFn(saveDevelopmentPlan);

  const [editing, setEditing] = useState<PlanRow | "new" | null>(null);
  const [form, setForm] = useState({ employee_id: "", title: "", objectives: "", target_date: "", status: "draft", notes: "" });
  const [busy, setBusy] = useState(false);

  if (plans.error) return <ErrorState error={plans.error} onRetry={() => plans.refetch()} />;
  if (!plans.data) return <LoadingRows />;

  const canManage = any("train.manage", "hr.employees", "team.view");

  const openEdit = (p: PlanRow | "new") => {
    setEditing(p);
    setForm(
      p === "new"
        ? { employee_id: "", title: "", objectives: "", target_date: "", status: "draft", notes: "" }
        : {
            employee_id: p.employee_id,
            title: p.title,
            objectives: p.objectives ?? "",
            target_date: p.target_date ?? "",
            status: p.status,
            notes: p.notes ?? "",
          },
    );
  };

  const doSave = async () => {
    setBusy(true);
    try {
      const existing = editing === "new" ? null : editing;
      unwrap(
        await save({
          data: {
            id: existing?.id ?? null,
            version: existing?.version ?? null,
            data: {
              employee_id: form.employee_id || undefined,
              title: form.title,
              objectives: form.objectives || undefined,
              target_date: form.target_date || undefined,
              status: form.status as "draft" | "active" | "completed" | "cancelled",
              notes: form.notes || undefined,
            },
          },
        }),
      );
      toast.success("Plan saved");
      setEditing(null);
      qc.invalidateQueries({ queryKey: qk.train.all });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not save the plan");
    } finally {
      setBusy(false);
    }
  };

  const cols: ColumnDef<PlanRow, unknown>[] = [
    {
      header: "Employee",
      cell: ({ row }) => (
        <Link to="/people/employees/$id" params={{ id: row.original.employee_id }} className="font-bold hover:underline">
          {empName(row.original.employee)}
        </Link>
      ),
    },
    { header: "Plan", accessorKey: "title" },
    { header: "Responsible", cell: ({ row }) => empName(row.original.responsible) },
    { header: "Target", accessorKey: "target_date", cell: ({ getValue }) => fmtDate(getValue() as string) },
    { header: "Status", accessorKey: "status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      header: "",
      id: "actions",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button asChild size="sm" variant="outline">
            <Link to="/training/plans/$id" params={{ id: row.original.id }}>Open</Link>
          </Button>
          {canManage && (
            <Button size="sm" variant="outline" onClick={() => openEdit(row.original)}>Edit</Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Development plans"
        description="Plans link gaps to courses, learning paths and training. Accepted AI recommendations land here."
        actions={
          canManage ? (
            <Button onClick={() => openEdit("new")}>
              <Plus className="size-4" aria-hidden /> New plan
            </Button>
          ) : undefined
        }
      />
      <DataTable data={plans.data} columns={cols} searchPlaceholder="Search plans…" />

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "New development plan" : "Edit development plan"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            {editing === "new" && (
              <Field label="Employee" htmlFor="pl-emp" required>
                <NativeSelect id="pl-emp" value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })}>
                  <option value="">Choose employee…</option>
                  {(employees.data ?? []).map((e) => (
                    <option key={e.id} value={e.id}>{empName(e)} ({e.employee_code})</option>
                  ))}
                </NativeSelect>
              </Field>
            )}
            <Field label="Title" htmlFor="pl-title" required>
              <Input id="pl-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={160} />
            </Field>
            <Field label="Objectives" htmlFor="pl-obj">
              <Textarea id="pl-obj" value={form.objectives} onChange={(e) => setForm({ ...form, objectives: e.target.value })} rows={2} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Target date" htmlFor="pl-date">
                <Input id="pl-date" type="date" value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })} />
              </Field>
              <Field label="Status" htmlFor="pl-status">
                <NativeSelect id="pl-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </NativeSelect>
              </Field>
            </div>
            <Field label="Notes" htmlFor="pl-notes">
              <Textarea id="pl-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={busy}>Cancel</Button>
            <Button onClick={doSave} disabled={busy || form.title.length < 3 || (editing === "new" && !form.employee_id)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {employeeId && null}
    </div>
  );
}
