import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { listDepartments } from "@/modules/departments/service";

type DepartmentRow = Awaited<
  ReturnType<typeof listDepartments>
>[number];

const columns: DataTableColumn<DepartmentRow>[] = [
  {
    key: "name",
    header: "Department",
    cell: (department) => (
      <span className="font-semibold text-foreground">
        {department.name}
      </span>
    ),
  },
  {
    key: "created",
    header: "Created",
    cell: (department) =>
      department.createdAt.toISOString().slice(0, 10),
  },
];

export default async function CollegeDepartmentsPage() {
  const context = await getCurrentRequestContext();
  const membership = context.membership;

  if (!membership) {
    redirect("/dashboard");
  }

  const departments = await listDepartments(
    context,
    membership.collegeId,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="College Admin"
        title="Departments"
        description="Active departments in your college. Cross-college access is denied by the service layer."
      />
      <DataTable
        columns={columns}
        rows={departments}
        getRowKey={(department) => department.id}
      />
    </div>
  );
}
