import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { DepartmentCreateForm } from "@/components/admin/department-create-form";
import { DepartmentDirectory } from "@/components/admin/department-directory";
import { PageHeader } from "@/components/ui/page-header";
import type { DepartmentDirectoryRow } from "@/modules/admin-ui/department-directory";
import {
  listDepartments,
  resolveDepartmentUsage,
} from "@/modules/departments/service";

export default async function CollegeDepartmentsPage() {
  const context = await getCurrentRequestContext();
  const membership = context.membership;

  // The /college layout checks COLLEGE_ADMIN role, including active membership.
  // The service below independently enforces department.read for the membership
  // college. Never consume a client-provided college ID or global admin scope.
  if (!membership) {
    redirect("/dashboard");
  }

  const departments = await listDepartments(context, membership.collegeId);
  const usageResults = await Promise.allSettled(
    departments.map((department) => resolveDepartmentUsage(department.id)),
  );
  const rows: DepartmentDirectoryRow[] = departments.map((department, index) => {
    const usage = usageResults[index];
    return {
      id: department.id,
      name: department.name,
      createdAt: department.createdAt.toISOString(),
      usage: usage?.status === "fulfilled" ? usage.value : null,
    };
  });

  return (
    <div className="min-w-0 overflow-x-clip space-y-6">
      <PageHeader
        eyebrow="College Admin"
        title="Departments"
        description="Create, find, export and manage the departments in your college."
      />
      <Link href="/college/academics" className="inline-flex min-h-[var(--lms-control-height)] items-center text-sm font-semibold text-link underline">Academic periods and sections →</Link>
      <DepartmentCreateForm collegeId={membership.collegeId} />
      <DepartmentDirectory rows={rows} />
    </div>
  );
}
