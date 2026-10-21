import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
import { getCurrentRequestContext } from "@/auth/request-context";
import { DepartmentCreateForm } from "@/components/admin/department-create-form";
import { DepartmentDirectory } from "@/components/admin/department-directory";
import { EmptyState } from "@/components/ui/empty-state";
import {ErrorState} from "@/components/ui/error-state";
import Link from "next/link";
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
      <div className="min-w-0 space-y-6">
        <PageHeader
          title="Departments"
          description="Department administration requires a college safety scope."
        />
        <AcademicSetupSteps step={1}/>
        <div className="rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4">
          <EmptyState
            title="Select a college to continue"
            description="Choose a college in the header above to see its departments. The selected college determines where departments can be created."
          />
        </div>
      </div>
    );
  }

  // listDepartments checks the active tenant scope and department.read.
  // The dependency-count resolver operates only on IDs from that list.
  const departments = await listDepartments(context,collegeId).catch(()=>null);
  if(!departments)return <div className="min-w-0 space-y-6">
    <PageHeader title="Departments"/>
    <AcademicSetupSteps step={1}/>
    <ErrorState title="Couldn't refresh departments"
      description="The selected college's departments could not be loaded. No rows from another college are shown."
      action={<Link href="/admin/departments" className="font-semibold text-link underline">Retry</Link>}/>
  </div>;
  // Keep tenant-scoped count queries bounded: never issue 3N reads in one burst.
  const usageResults:PromiseSettledResult<Awaited<ReturnType<typeof resolveDepartmentUsage>>>[]=[];
  for(let offset=0;offset<departments.length;offset+=8){
    const batch=await Promise.allSettled(
      departments.slice(offset,offset+8).map(department=>resolveDepartmentUsage(department.id)),
    );
    usageResults.push(...batch);
  }
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
    <div className="min-w-0 space-y-6">
      <PageHeader title="Departments"/>
      <AcademicSetupSteps step={1} />
      <div className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,10fr)_minmax(0,14fr)]">
        <div className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 shadow-sm">
          <DepartmentCreateForm collegeId={collegeId}/>
        </div>
        <div className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 shadow-sm">
          <DepartmentDirectory rows={rows}/>
        </div>
      </div>
    </div>
  );
}
