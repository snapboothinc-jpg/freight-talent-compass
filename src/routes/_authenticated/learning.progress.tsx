import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { fetchEnrollments, empName, type EnrollmentRow } from "@/lib/data";
import { qk } from "@/lib/query-keys";
import { PageHeader, StatusBadge, LoadingRows, ErrorState, fmtDate } from "@/components/app/kit";
import { DataTable } from "@/components/app/data-table";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/learning/progress")({
  head: () => ({
    meta: [
      { title: "Learner progress — NextGen" },
      { name: "description", content: "Enrollment and completion status across learners in your scope." },
    ],
  }),
  component: Page,
});

function Page() {
  const enrollments = useQuery({ queryKey: qk.learn.enrollments(), queryFn: () => fetchEnrollments() });

  if (enrollments.error) return <ErrorState error={enrollments.error} onRetry={() => enrollments.refetch()} />;
  if (!enrollments.data) return <LoadingRows />;

  const cols: ColumnDef<EnrollmentRow, unknown>[] = [
    {
      header: "Employee",
      cell: ({ row }) => (
        <Link to="/people/employees/$id" params={{ id: row.original.employee_id }} className="font-bold hover:underline">
          {empName(row.original.employee)}
        </Link>
      ),
    },
    { header: "Course", cell: ({ row }) => row.original.course?.title ?? "—" },
    { header: "Source", accessorKey: "source", cell: ({ getValue }) => String(getValue()).replace(/_/g, " ") },
    { header: "Assigned", accessorKey: "assigned_at", cell: ({ getValue }) => fmtDate(getValue() as string) },
    { header: "Status", accessorKey: "status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      header: "",
      id: "open",
      cell: ({ row }) => (
        <Button asChild size="sm" variant="outline">
          <Link to="/learning/course/$id" params={{ id: row.original.course_id }}>Open</Link>
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Learner progress" description="Enrollments in your scope (own team, department, or all for learning managers)." />
      <DataTable data={enrollments.data} columns={cols} searchPlaceholder="Search enrollments…" />
    </div>
  );
}
