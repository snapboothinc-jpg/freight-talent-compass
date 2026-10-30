import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarRange, CheckCircle2, ClipboardList, Users } from "lucide-react";
import { fetchSessions, fetchPlans, fetchParticipants, empName } from "@/lib/data";
import { qk } from "@/lib/query-keys";
import { PageHeader, Panel, StatCard, StatusBadge, EmptyState, LoadingRows, ErrorState, fmtDateTime } from "@/components/app/kit";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/training/")({
  head: () => ({
    meta: [
      { title: "Training dashboard — NextGen" },
      { name: "description", content: "Sessions, attendance and development plan overview." },
    ],
  }),
  component: Page,
});

function Page() {
  const sessions = useQuery({ queryKey: qk.train.sessions(), queryFn: () => fetchSessions() });
  const plans = useQuery({ queryKey: qk.train.plans(), queryFn: () => fetchPlans() });

  if (sessions.error) return <ErrorState error={sessions.error} onRetry={() => sessions.refetch()} />;
  if (!sessions.data || !plans.data) return <LoadingRows />;

  const upcoming = sessions.data.filter((s) => s.status === "planned" || s.status === "in_progress");
  const completed = sessions.data.filter((s) => s.status === "completed");
  const activePlans = plans.data.filter((p) => p.status === "active");

  return (
    <div>
      <PageHeader
        title="Training dashboard"
        description="Sessions, development plans and training activity in your scope."
        actions={
          <Button asChild variant="outline">
            <Link to="/training/calendar">Training calendar</Link>
          </Button>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Upcoming sessions" value={upcoming.length} icon={CalendarRange} />
        <StatCard label="Completed sessions" value={completed.length} icon={CheckCircle2} tone="success" />
        <StatCard label="Active development plans" value={activePlans.length} icon={ClipboardList} />
        <StatCard label="Total sessions" value={sessions.data.length} icon={Users} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Upcoming sessions">
          {upcoming.length === 0 ? (
            <EmptyState title="No upcoming sessions" description="Schedule a session from the training calendar." />
          ) : (
            <ul className="divide-y">
              {upcoming.slice(0, 8).map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div>
                    <p className="text-sm font-semibold">{s.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {fmtDateTime(s.starts_at)} · {s.venue ?? s.delivery_method.replace(/_/g, " ")}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/training/sessions/$id" params={{ id: s.id }}>Open</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Development plans">
          {plans.data.length === 0 ? (
            <EmptyState title="No development plans" description="Plans are created from accepted AI recommendations or directly." />
          ) : (
            <ul className="divide-y">
              {plans.data.slice(0, 8).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div>
                    <p className="text-sm font-semibold">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{empName(p.employee)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={p.status} />
                    <Button asChild size="sm" variant="outline">
                      <Link to="/training/plans/$id" params={{ id: p.id }}>Open</Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
