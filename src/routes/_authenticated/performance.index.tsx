import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ClipboardCheck, Clock, RotateCcw } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fetchAssignments, fetchCycles } from "@/lib/data";
import { qk } from "@/lib/query-keys";
import { usePermissions } from "@/hooks/use-me";
import { PageHeader, Panel, StatCard, EmptyState, StatusBadge, LoadingRows } from "@/components/app/kit";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/performance/")({
  head: () => ({ meta: [{ title: "Performance — NextGen" }, { name: "description", content: "Performance management overview." }] }),
  component: Page,
});

function Page() {
  const { has } = usePermissions();
  const a = useQuery({ queryKey: qk.perf.assignments({ all: true }), queryFn: () => fetchAssignments() });
  const c = useQuery({ queryKey: qk.perf.cycles(), queryFn: fetchCycles });
  const rows = a.data ?? [];
  const n = (s: string[]) => rows.filter((r) => s.includes(r.status)).length;
  const buckets = [0, 20, 40, 60, 80].map((lo) => ({ range: `${lo}–${lo + 20}`, count: rows.filter((r) => r.overall_score != null && r.overall_score >= lo && (lo === 80 ? r.overall_score <= 100 : r.overall_score < lo + 20)).length }));
  return (
    <div>
      <PageHeader title="Performance dashboard" description="Status of evaluations in your scope." />
      {a.isLoading ? <LoadingRows /> : rows.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="No evaluations yet" description="Create a cycle and an active evaluation profile per position, then assign employees." action={has("perf.manage") && <Button asChild><Link to="/performance/cycles">Go to cycles</Link></Button>} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={ClipboardCheck} label="Not started / in progress" value={n(["not_started", "in_progress"])} />
            <StatCard icon={Clock} label="Awaiting review" value={n(["submitted", "under_review"])} tone="warning" />
            <StatCard icon={CheckCircle2} label="Approved" value={n(["approved"])} tone="success" />
            <StatCard icon={RotateCcw} label="Reopened" value={n(["reopened"])} />
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Panel title="Score distribution" description="Submitted and approved evaluations (0–100).">
              <div className="h-56">
                <ResponsiveContainer>
                  <BarChart data={buckets}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="range" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)" }} />
                    <Bar dataKey="count" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
            <Panel title="Cycles">
              <ul className="divide-y">
                {(c.data ?? []).map((cy) => {
                  const inCycle = rows.filter((r) => r.cycle_id === cy.id);
                  const done = inCycle.filter((r) => r.status === "approved").length;
                  return (
                    <li key={cy.id} className="flex items-center justify-between py-2 text-sm">
                      {has("perf.manage") ? <Link to="/performance/cycles/$id" params={{ id: cy.id }} className="font-bold hover:underline">{cy.name}</Link> : <span className="font-bold">{cy.name}</span>}
                      <span className="flex items-center gap-2 font-data">{done}/{inCycle.length} approved <StatusBadge status={cy.status} /></span>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
