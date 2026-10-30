import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { check } from "@/lib/data";
import { reviewAssessment } from "@/lib/api/actions.functions";
import { useAction } from "@/hooks/use-action";
import { qk } from "@/lib/query-keys";
import { PageHeader, StatusBadge, EmptyState, ConfirmDialog, fmtDateTime, NativeSelect } from "@/components/app/kit";
import { DataTable } from "@/components/app/data-table";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/approvals")({
  head: () => ({ meta: [{ title: "Approval center — NextGen" }, { name: "description", content: "Pending approvals you can act on." }] }),
  component: Page,
});

type Task = { id: string; workflow_type: string; record_id: string; record_label: string; status: string; created_at: string; submitted_by: string | null; decided_at: string | null; comments: string | null; submitter: { full_name: string | null; email: string } | null };

const WF: Record<string, string> = { evaluation: "Performance evaluation", competency_assessment: "Competency assessment" };

function Page() {
  const [status, setStatus] = useState("pending");
  const q = useQuery({
    queryKey: [...qk.shared.approvals(), status],
    queryFn: async () => {
      const tasks = check(await supabase.from("approval_tasks").select("*").eq("status", status).order("created_at", { ascending: false }).limit(500)) as Omit<Task, "submitter">[];
      const ids = [...new Set(tasks.map((t) => t.submitted_by).filter(Boolean))] as string[];
      const profiles = ids.length ? (check(await supabase.from("profiles").select("id, full_name, email").in("id", ids)) as { id: string; full_name: string | null; email: string }[]) : [];
      return tasks.map((t) => ({ ...t, submitter: profiles.find((p) => p.id === t.submitted_by) ?? null })) as Task[];
    },
  });
  const [act, setAct] = useState<{ task: Task; decision: "approve" | "reject" } | null>(null);
  const [comments, setComments] = useState("");
  const review = useAction(useServerFn(reviewAssessment), {
    idempotent: true,
    invalidate: [qk.shared.approvals(), qk.comp.all],
    success: "Decision recorded",
    onSuccess: () => {
      setAct(null);
      setComments("");
    },
  });

  const cols: ColumnDef<Task, unknown>[] = [
    { header: "Record", accessorKey: "record_label", cell: ({ row }) => <span className="font-bold">{row.original.record_label}</span> },
    { header: "Workflow", accessorFn: (r) => WF[r.workflow_type] },
    { header: "Submitted by", accessorFn: (r) => r.submitter?.full_name ?? r.submitter?.email ?? "—" },
    { header: "Submitted", accessorKey: "created_at", cell: ({ getValue }) => fmtDateTime(getValue() as string) },
    { header: "Status", accessorKey: "status", cell: ({ getValue }) => <StatusBadge status={getValue() as string} /> },
    {
      header: "Actions",
      id: "actions",
      cell: ({ row }) => {
        const t = row.original;
        if (t.workflow_type === "evaluation")
          return (
            <Button asChild size="sm" variant="outline">
              <Link to="/performance/evaluations/$id" params={{ id: t.record_id }}>
                {t.status === "pending" ? "Review" : "Open"}
              </Link>
            </Button>
          );
        if (t.status !== "pending") return null;
        return (
          <div className="flex gap-1">
            <Button size="sm" onClick={() => setAct({ task: t, decision: "approve" })}>
              Approve
            </Button>
            <Button size="sm" variant="outline" onClick={() => setAct({ task: t, decision: "reject" })}>
              Reject
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader title="Approval center" description="Only items you are allowed to act on are listed. You cannot approve items you submitted." />
      <DataTable
        columns={cols}
        data={q.data}
        loading={q.isLoading}
        error={q.error}
        onRetry={() => q.refetch()}
        searchPlaceholder="Search approvals"
        toolbar={
          <NativeSelect aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </NativeSelect>
        }
        empty={<EmptyState icon={Inbox} title="No approvals" description="Nothing is waiting for your decision." />}
      />
      <ConfirmDialog
        open={!!act}
        onOpenChange={(o) => !o && setAct(null)}
        title={act?.decision === "approve" ? "Approve assessment?" : "Reject assessment?"}
        description={act?.task.record_label}
        confirmLabel={act?.decision === "approve" ? "Approve" : "Reject"}
        destructive={act?.decision === "reject"}
        pending={review.isPending}
        onConfirm={() => act && review.mutate({ id: act.task.record_id, decision: act.decision, comments })}
      >
        <div className="space-y-1.5">
          <Label htmlFor="cm">Comments {act?.decision === "reject" && "(required)"}</Label>
          <Textarea id="cm" value={comments} onChange={(e) => setComments(e.target.value)} maxLength={4000} />
        </div>
      </ConfirmDialog>
    </div>
  );
}
