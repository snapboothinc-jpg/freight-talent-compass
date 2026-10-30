import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { fetchDepartments } from "@/lib/data";
import { getReport, logExport } from "@/lib/api/succession.functions";
import { unwrap, ApiError } from "@/lib/api/result";
import { qk } from "@/lib/query-keys";
import { PageHeader, Panel, Field, NativeSelect, Input, DefaultNote } from "@/components/app/kit";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/reports/")({
  head: () => ({
    meta: [
      { title: "Reports — NextGen" },
      { name: "description", content: "Scope-respecting reports from live data with audited CSV export." },
    ],
  }),
  component: Page,
});

const KINDS = [
  { value: "performance", label: "Performance summary" },
  { value: "gaps", label: "Competency gaps" },
  { value: "learning", label: "Learning activity" },
  { value: "training", label: "Training activity" },
  { value: "recognition", label: "Recognition" },
  { value: "succession", label: "Succession coverage" },
] as const;

function toCsv(rows: Record<string, number>): string {
  const lines = [["metric", "value"].join(",")];
  for (const [k, v] of Object.entries(rows)) lines.push([JSON.stringify(k), String(v)].join(","));
  return lines.join("\n");
}

function Page() {
  const departments = useQuery({ queryKey: qk.org.departments(), queryFn: fetchDepartments });
  const run = useServerFn(getReport);
  const log = useServerFn(logExport);
  const [kind, setKind] = useState<(typeof KINDS)[number]["value"]>("performance");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [department, setDepartment] = useState("");
  const [result, setResult] = useState<Record<string, number> | null>(null);
  const [busy, setBusy] = useState(false);

  const filters = () => {
    const f: Record<string, string> = {};
    if (from) f.from = from;
    if (to) f.to = to;
    if (department) f.department = department;
    return f;
  };

  const doRun = async () => {
    setBusy(true);
    try {
      const r = unwrap(await run({ data: { kind, from: from || undefined, to: to || undefined, department: department || undefined } }));
      setResult(r as Record<string, number>);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Report failed");
    } finally {
      setBusy(false);
    }
  };

  const doCsv = async () => {
    if (!result) return;
    try {
      unwrap(await log({ data: { kind: `report_${kind}`, filters: filters() } }));
      const blob = new Blob([toCsv(result)], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${kind}-report-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded — the export was recorded in the audit log");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Export failed");
    }
  };

  return (
    <div>
      <PageHeader title="Reports & exports" description="Reports respect your access scope. Every export is audited." />
      <DefaultNote>Report definitions are defaults that require organizational validation.</DefaultNote>
      <Panel className="mt-4" title="Build a report">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Report" htmlFor="rp-kind" required>
            <NativeSelect id="rp-kind" value={kind} onChange={(e) => { setKind(e.target.value as typeof kind); setResult(null); }}>
              {KINDS.map((k) => (
                <option key={k.value} value={k.value}>{k.label}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="From" htmlFor="rp-from">
            <Input id="rp-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="To" htmlFor="rp-to">
            <Input id="rp-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
          <Field label="Department" htmlFor="rp-dept">
            <NativeSelect id="rp-dept" value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="">All (within your scope)</option>
              {(departments.data ?? []).map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </NativeSelect>
          </Field>
        </div>
        <div className="mt-3 flex gap-2">
          <Button onClick={doRun} disabled={busy}>Run report</Button>
          {result && (
            <Button variant="outline" onClick={doCsv}>
              <Download className="size-4" aria-hidden /> Export CSV
            </Button>
          )}
        </div>
      </Panel>
      {result && (
        <Panel className="mt-6" title={`${KINDS.find((k) => k.value === kind)?.label} — results`}>
          {Object.keys(result).length === 0 ? (
            <p className="text-sm text-muted-foreground">No data in scope for these filters.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 font-semibold">Metric</th>
                  <th className="py-2 text-right font-semibold">Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(result).map(([k, v]) => (
                  <tr key={k} className="border-b last:border-0">
                    <td className="py-2">{k.replace(/_/g, " ")}</td>
                    <td className="py-2 text-right font-data font-semibold">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      )}
    </div>
  );
}
