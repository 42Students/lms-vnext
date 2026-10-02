import { getCurrentRequestContext } from "@/auth/request-context";
import { DepartmentActions } from "@/components/admin/department-actions";
import { DepartmentCreateForm } from "@/components/admin/department-create-form";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
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
  {
    key: "actions",
    header: <span className="sr-only">Actions</span>,
    className: "text-right",
    cell: (department) => (
      <DepartmentActions
        departmentId={department.id}
        name={department.name}
      />
    ),
  },
];

export default async function SuperAdminDepartmentsPage() {
  const context = await getCurrentRequestContext();
  const collegeId = context.adminScope?.collegeId ?? null;

  if (!collegeId) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Super Admin"
          title="Departments"
          description="Department administration requires a college safety scope."
        />
        <EmptyState
          title="Select a college scope"
          description="Use the Super Admin scope selector in the top bar to choose a college before viewing or changing departments."
        />
      </div>
    );
  }

  const departments = await listDepartments(
    context,
    collegeId,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Departments"
        description="Only departments inside the selected college safety scope are shown."
      />
      <DepartmentCreateForm collegeId={collegeId} />
      <DataTable
        columns={columns}
        rows={departments}
        getRowKey={(department) => department.id}
      />
    </div>
  );
}
