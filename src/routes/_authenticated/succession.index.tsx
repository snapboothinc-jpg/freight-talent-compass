import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { Briefcase, Users, ShieldCheck } from "lucide-react";
import { fetchCriticalPositions, fetchCandidates, fetchAccessGrants, fetchReadinessClasses } from "@/lib/data";
import { logSuccessionView } from "@/lib/api/succession.functions";
import { qk } from "@/lib/query-keys";
import { PageHeader, Panel, StatCard, EmptyState, LoadingRows, ErrorState, StatusBadge, DefaultNote } from "@/components/app/kit";

export const Route = createFileRoute("/_authenticated/succession/")({
  head: () => ({
    meta: [
      { title: "Succession — NextGen" },
      { name: "description", content: "Critical positions and succession readiness. Restricted and audited." },
    ],
  }),
  component: Page,
});

function Page() {
  const logView = useServerFn(logSuccessionView);
  const positions = useQuery({ queryKey: qk.succ.positions(), queryFn: fetchCriticalPositions });
  const candidates = useQuery({ queryKey: qk.succ.candidates(), queryFn: () => fetchCandidates() });
  const grants = useQuery({ queryKey: qk.succ.grants(), queryFn: fetchAccessGrants });
  const classes = useQuery({ queryKey: qk.succ.classes(), queryFn: fetchReadinessClasses });

  useEffect(() => {
    logView({ data: { record_type: "dashboard", record_id: null } }).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (positions.error) return <ErrorState error={positions.error} onRetry={() => positions.refetch()} />;
  if (!positions.data || !candidates.data) return <LoadingRows />;

  const active = positions.data.filter((p) => p.status === "active");
  const uncovered = active.filter((p) => !candidates.data.some((c) => c.critical_position_id === p.id && c.status === "active"));

  return (
    <div>
      <PageHeader
        title="Succession dashboard"
        description="Restricted area. Every view and change is audited. Employees never see these records, including their own."
      />
      <DefaultNote>Readiness classifications and coverage thresholds are defaults that require organizational validation.</DefaultNote>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Active critical positions" value={active.length} icon={Briefcase} />
        <StatCard label="Active candidates" value={candidates.data.filter((c) => c.status === "active").length} icon={Users} />
        <StatCard label="Positions without a candidate" value={uncovered.length} icon={ShieldCheck} tone={uncovered.length ? "warning" : "success"} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Uncovered critical positions">
          {uncovered.length === 0 ? (
            <EmptyState title="Full coverage" description="Every active critical position has at least one candidate." />
          ) : (
            <ul className="divide-y">
              {uncovered.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-semibold">{p.position?.title}</p>
                    <p className="text-xs text-muted-foreground">{p.department?.name}</p>
                  </div>
                  <StatusBadge status="open" label={p.criticality} />
                </li>
              ))}
            </ul>
          )}
          <Link to="/succession/positions" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
            Manage critical positions
          </Link>
        </Panel>
        <Panel title="Readiness classes">
          <DefaultNote />
          <ul className="mt-2 divide-y">
            {(classes.data ?? []).map((c) => (
              <li key={c.id} className="py-2 text-sm">
                <span className="font-semibold">{c.label}</span>{" "}
                <span className="font-data text-xs text-muted-foreground">({c.code})</span>
                {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">Department access grants: {grants.data?.length ?? 0}</p>
        </Panel>
      </div>
    </div>
  );
}
