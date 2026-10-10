import { getCurrentRequestContext } from "@/auth/request-context";
import { DepartmentCreateForm } from "@/components/admin/department-create-form";
import { DepartmentDirectory } from "@/components/admin/department-directory";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  listDepartments,
  resolveDepartmentUsage,
} from "@/modules/departments/service";
import type { DepartmentDirectoryRow } from "@/modules/admin-ui/department-directory";

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

  // listDepartments checks the active tenant scope and department.read.
  // The dependency-count resolver operates only on IDs from that list.
  const departments = await listDepartments(context, collegeId);
  const usageResults = await Promise.allSettled(
    departments.map((department) => resolveDepartmentUsage(department.id)),
  );
  const rows: DepartmentDirectoryRow[] = departments.map((department, index) => {
    const usage = usageResults[index];
    return {
      id: department.id,
      name: department.name,
      createdAt: department.createdAt.toISOString(),
      // A failed partial query is unknown, never a misleading 0.
      usage: usage?.status === "fulfilled" ? usage.value : null,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Departments"
        description="Search, export and maintain departments inside the selected college safety scope."
      />
      <DepartmentCreateForm collegeId={collegeId} />
      <DepartmentDirectory rows={rows} />
    </div>
  );
}
