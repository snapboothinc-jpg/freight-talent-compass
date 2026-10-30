import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import type { z } from "zod";
import { CalendarRange, Plus } from "lucide-react";
import { fetchCycles } from "@/lib/data";
import { saveCycle } from "@/lib/api/actions.functions";
import { cycleFields } from "@/lib/schemas";
import { useAction } from "@/hooks/use-action";
import { qk } from "@/lib/query-keys";
import { PageHeader, StatusBadge, EmptyState, Field, fmtDate, DefaultNote } from "@/components/app/kit";
import { DataTable } from "@/components/app/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/performance/cycles/")({
  head: () => ({ meta: [{ title: "Evaluation cycles — NextGen" }, { name: "description", content: "Evaluation cycles." }] }),
  component: Page,
});

type Cycle = Awaited<ReturnType<typeof fetchCycles>>[number];

function Page() {
  const q = useQuery({ queryKey: qk.perf.cycles(), queryFn: fetchCycles });
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const cols: ColumnDef<Cycle, unknown>[] = [
    { header: "Name", accessorKey: "name", cell: ({ getValue }) => <span className="font-bold">{getValue() as string}</span> },
    { header: "Period", accessorFn: (r) => `${fmtDate(r.period_start)} – ${fmtDate(r.period_end)}` },
    { header: "Due", accessorKey: "due_date", cell: ({ getValue }) => fmtDate(getValue() as string) },
    { header: "Self-evaluation", accessorFn: (r) => (r.self_evaluation ? "Yes" : "No") },
    { header: "Status", accessorKey: "status", cell: ({ getValue }) => <StatusBadge status={getValue() as string} /> },
  ];
  return (
    <div>
      <PageHeader title="Evaluation cycles" description="Set up a cycle, then assign employees. Each assignment uses the active profile for the employee's position." actions={<Button onClick={() => setCreating(true)}><Plus /> New cycle</Button>} />
      <DataTable columns={cols} data={q.data} loading={q.isLoading} error={q.error} onRetry={() => q.refetch()} onRowClick={(r) => navigate({ to: "/performance/cycles/$id", params: { id: r.id } })} empty={<EmptyState icon={CalendarRange} title="No cycles yet" description="Create a cycle to start evaluating." action={<Button onClick={() => setCreating(true)}>New cycle</Button>} />} />
      {creating && <CycleDialog cycle={null} onClose={() => setCreating(false)} />}
    </div>
  );
}

type F = z.infer<typeof cycleFields>;
export function CycleDialog({ cycle, onClose }: { cycle: Cycle | null; onClose: () => void }) {
  const form = useForm<F>({
    resolver: zodResolver(cycleFields),
    defaultValues: { name: cycle?.name ?? "", description: cycle?.description ?? "", period_start: cycle?.period_start ?? "", period_end: cycle?.period_end ?? "", due_date: cycle?.due_date ?? "", self_evaluation: cycle?.self_evaluation ?? true },
  });
  const save = useAction(useServerFn(saveCycle), { invalidate: [qk.perf.all], success: "Cycle saved", onSuccess: onClose });
  const e = form.formState.errors;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{cycle ? "Edit cycle" : "New cycle"}</DialogTitle>
        </DialogHeader>
        <form id="cy" className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit((v) => save.mutate({ id: cycle?.id ?? null, version: cycle?.version ?? null, data: v }))} noValidate>
          <div className="sm:col-span-2"><Field label="Name" htmlFor="nm" error={e.name?.message} required><Input id="nm" {...form.register("name")} /></Field></div>
          <Field label="Period start" htmlFor="ps" error={e.period_start?.message && "Required"} required><Input id="ps" type="date" {...form.register("period_start")} /></Field>
          <Field label="Period end" htmlFor="pe" error={e.period_end?.message} required><Input id="pe" type="date" {...form.register("period_end")} /></Field>
          <Field label="Due date" htmlFor="dd"><Input id="dd" type="date" {...form.register("due_date")} /></Field>
          <div className="flex items-center gap-2 pt-6">
            <Checkbox id="se" checked={form.watch("self_evaluation")} onCheckedChange={(c) => form.setValue("self_evaluation", c === true)} />
            <label htmlFor="se" className="text-sm font-bold">Include self-evaluation</label>
          </div>
          <div className="sm:col-span-2"><Field label="Description" htmlFor="ds"><Textarea id="ds" {...form.register("description")} /></Field></div>
          <div className="sm:col-span-2"><DefaultNote>Evaluation frequency and self-evaluation use are defaults that require organizational validation.</DefaultNote></div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="cy" disabled={save.isPending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
