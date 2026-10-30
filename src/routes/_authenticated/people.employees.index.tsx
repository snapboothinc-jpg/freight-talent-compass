import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Users } from "lucide-react";
import { fetchEmployees, fetchCurrentSupervisors, empName, type EmployeeRow } from "@/lib/data";
import { usePermissions } from "@/hooks/use-me";
import { qk } from "@/lib/query-keys";
import { PageHeader, StatusBadge, EmptyState, fmtDate } from "@/components/app/kit";
import { DataTable } from "@/components/app/data-table";
import { Button } from "@/components/ui/button";
import { EmployeeDialog } from "@/components/app/employee-dialog";

export const Route = createFileRoute("/_authenticated/people/employees/")({
  head: () => ({ meta: [{ title: "Employees — NextGen" }, { name: "description", content: "Employee records in your scope." }] }),
  component: Page,
});

function Page() {
  const { any } = usePermissions();
  const canEdit = any("hr.employees", "admin.org");
  const navigate = useNavigate();
  const q = useQuery({ queryKey: qk.org.employees(), queryFn: fetchEmployees });
  const sups = useQuery({ queryKey: [...qk.org.all, "supervisors"], queryFn: fetchCurrentSupervisors });
  const [creating, setCreating] = useState(false);
  const cols: ColumnDef<EmployeeRow, unknown>[] = [
    { header: "ID", accessorKey: "employee_code" },
    { header: "Name", accessorFn: (r) => empName(r), cell: ({ getValue }) => <span className="font-bold">{getValue() as string}</span> },
    { header: "Department", accessorFn: (r) => r.department?.name ?? "—" },
    { header: "Position", accessorFn: (r) => r.position?.title ?? "—" },
    { header: "Supervisor", accessorFn: (r) => empName(q.data?.find((e) => e.id === sups.data?.find((s) => s.employee_id === r.id)?.supervisor_id)) },
    { header: "Hired", accessorKey: "hire_date", cell: ({ getValue }) => fmtDate(getValue() as string) },
    { header: "Account", accessorFn: (r) => (r.user_id ? "Linked" : "None") },
    { header: "Status", accessorKey: "employment_status", cell: ({ getValue }) => <StatusBadge status={getValue() as string} /> },
  ];
  return (
    <div>
      <PageHeader title="Employees" description="Only employees in your scope are listed." actions={canEdit && <Button onClick={() => setCreating(true)}><Plus /> New employee</Button>} />
      <DataTable
        columns={cols}
        data={q.data}
        loading={q.isLoading}
        error={q.error}
        onRetry={() => q.refetch()}
        searchPlaceholder="Search by name, ID, department…"
        onRowClick={(r) => navigate({ to: "/people/employees/$id", params: { id: r.id } })}
        empty={<EmptyState icon={Users} title="No employees in your scope" description={canEdit ? "Add employee records, then link them to user accounts." : "Records appear here when people report to you or your department."} action={canEdit && <Button onClick={() => setCreating(true)}>New employee</Button>} />}
      />
      {creating && <EmployeeDialog employee={null} onClose={() => setCreating(false)} />}
    </div>
  );
}
