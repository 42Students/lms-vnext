import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
import { getCurrentRequestContext } from "@/auth/request-context";
import { DepartmentCreateForm } from "@/components/admin/department-create-form";
import { DepartmentDirectory } from "@/components/admin/department-directory";

import {Alert} from "@/components/ui/alert";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {RECOVERY_ENTITY_TYPES,isRecoveryEntityType} from "@/modules/admin-ui/recovery-type-registry";
import {ErrorState} from "@/components/ui/error-state";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import {
  listDepartments,
  resolveDepartmentUsage,
} from "@/modules/departments/service";
import type { DepartmentDirectoryRow } from "@/modules/admin-ui/department-directory";

export default async function SuperAdminDepartmentsPage({
  searchParams,
}: {searchParams:Promise<{type?:string|string[]}>}) {
  const context = await getCurrentRequestContext();
  const collegeId = context.adminScope?.collegeId ?? null;
  const params=await searchParams;
  const requestedType=params.type??"department";
  const validType=isRecoveryEntityType(requestedType);
  const selectedType=validType?requestedType:"department";
  const recoveryType=RECOVERY_ENTITY_TYPES.find(item=>item.value===selectedType)!;
  const recoveryChooser=<section aria-label="Deleted Items" className="min-w-0 space-y-3 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
    <h2 className="text-base font-semibold text-[var(--lms-heading)]">Deleted Items</h2>
    <form method="get" action="/admin/departments" className="flex flex-wrap items-end gap-3">
      <label className="grid min-w-0 gap-2 text-sm font-semibold text-body">
        Entity type
        <Select name="type" defaultValue={selectedType}>
          {RECOVERY_ENTITY_TYPES.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}
        </Select>
      </label>
      <Button type="submit" variant="secondary">View</Button>
    </form>
    {!validType?<Alert tone="warning">Unknown deleted item type. Select a supported entity type.</Alert>:null}
    <p className="text-xs text-muted-foreground">
      Recoveries require the selected tenant safety scope. Restoring a parent does not restore its children.
    </p>
    {recoveryType.platformLevel?<Link href={"/admin/organizations?type="+selectedType}
      className="inline-flex min-h-9 items-center text-sm font-semibold text-link underline">
      Open platform Deleted Items
    </Link>:collegeId?<Alert tone="info">
      {recoveryType.label} recovery must be performed within this selected college.
      {recoveryType.implemented?" Use the authorized restore action shown here.":" The restore operation is not yet available; no archived records have been changed."}
    </Alert>:<Alert tone="warning" title="College scope required">
      Select a college in the header before searching for archived {recoveryType.label.toLowerCase()} records.
    </Alert>}
  </section>;

  if (!collegeId) {
    return (
      <div className="min-w-0 space-y-6">
        <PageHeader
          title="Departments"
          description="Department administration requires a college safety scope."
        />
        <AcademicSetupSteps step={1}/>
        {recoveryChooser}
        <Alert tone="warning">
          <div className="flex items-start gap-3">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className="mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 7v6m0 4h.01"/></svg>
            <div>
              <strong>Select a college to continue</strong>
              <p>Choose a college in the header above to manage its departments and archived records.</p>
            </div>
          </div>
        </Alert>
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
  const incompleteUsage=usageResults.filter(result=>result.status==="rejected").length;
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
      {incompleteUsage>0?<Alert tone="warning">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>Could not load dependency counts for {incompleteUsage} department(s). Their usage remains unknown; no archive decision should rely on a missing count.</span>
          <Link href="/admin/departments" className="font-semibold text-primary-text underline">Retry counts</Link>
        </div>
      </Alert>:null}
      {recoveryChooser}
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
