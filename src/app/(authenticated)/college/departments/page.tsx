import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { isSuperAdmin } from "@/modules/identity/context";
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
  const collegeId=context.membership?.collegeId ??
    (isSuperAdmin(context)?context.adminScope?.collegeId:null);
  // Global administrators may work only in their selected college. Without a
  // scoped college there are no directory reads or mutation controls.
  if (!collegeId) return <div className="min-w-0 space-y-4">
    <PageHeader title="Departments"/>
    <Alert tone="warning" title="Admin not assigned to a college">
      You must be assigned to a college to view and manage departments. Contact your administrator.
    </Alert>
  </div>;

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
      usage: usage?.status === "fulfilled" ? usage.value : null,
    };
  });

  return (
    <div className="min-w-0 max-w-full space-y-[var(--lms-space-4)]">
      <PageHeader
        title="Departments"
        description="Create, find, export and manage the departments in your college."
        actions={<Link href="/college/academics" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Academic periods and sections →</Link>}
      />
      <DepartmentCreateForm collegeId={collegeId} />
      <DepartmentDirectory rows={rows} />
    </div>
  );
}
