import Link from "next/link";
import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {getSuperAdminTenantLifecycleDetail} from "@/modules/colleges/admin-tenant-lifecycle-service";
import {CollegeServiceError} from "@/modules/colleges/service";
import {requirePermission} from "@/modules/permissions/policy";
import {superAdminTenantSetupSteps} from "@/modules/colleges/admin-tenant-setup-journey";
import {getSuperAdminCollegeReadiness} from "@/modules/colleges/readiness-service";
import {summarizeTenantSetupReadiness} from "@/modules/colleges/admin-tenant-setup-status";
export const dynamic="force-dynamic";
export default async function SuperAdminTenantSetup(){
 const context=await getCurrentRequestContext();
 requirePermission(context,"admin-scope.select");
 const id=context.adminScope?.collegeId;
 if(!id)return <div className="space-y-5">
  <PageHeader eyebrow="Super Admin · Tenant Setup" title="Set up a college"
   description="Select a college in the Super Admin scope switcher to begin."/>
  <Link href="/admin/tenants/create" className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Create organization and college →</Link>
  <div role="status" className="rounded-xl border border-border bg-surface p-5">
   No college selected. Setup cannot default to an unrelated tenant.
   <Link href="/admin/tenants" className="ml-2 font-semibold text-primary-text underline">Browse colleges</Link>
  </div></div>;
 let college:Awaited<ReturnType<typeof getSuperAdminTenantLifecycleDetail>>;
 try{college=await getSuperAdminTenantLifecycleDetail(context,id);}
 catch(e){if(e instanceof CollegeServiceError&&e.code==="COLLEGE_NOT_FOUND")notFound();throw e;}
 requirePermission(context,"college.read",{organizationId:college.organizationId,collegeId:college.id});
 const readiness=await getSuperAdminCollegeReadiness(context,college.id);
 const summary=summarizeTenantSetupReadiness(readiness?.evaluation??null);
 return <div className="min-w-0 space-y-5">
  <Link href="/admin/tenants/create" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline">Create another tenant →</Link>
  <PageHeader eyebrow="Super Admin · Tenant Setup" title={college.name}
   description="Work through college-specific setup without losing the selected administrative scope."/>
  <nav aria-label="Tenant Setup sections" className="flex flex-wrap gap-3">
   <Link href="/admin/tenants/create" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">1. Tenant structure</Link>
   <Link href="/admin/tenants/setup" aria-current="page" className="inline-flex min-h-11 items-center font-semibold text-primary-text">2. Launch setup</Link>
   <Link href={`/activity?collegeId=${encodeURIComponent(college.id)}`} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Activity</Link>
   <Link href={`/api/activity/admin-export?collegeId=${encodeURIComponent(college.id)}`} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Export activity CSV</Link>
  </nav>
  <p className="rounded-xl border border-border bg-surface p-4 text-sm text-body">
   This is a navigation checklist, not automatic completion evidence. Only the Readiness Gate measures persisted setup checks; login and DNS runtime verification still require separate acceptance.
  </p>
  <section aria-label="Persisted setup readiness" className="rounded-xl border border-border bg-surface p-4">
   <h2 className="font-semibold text-foreground">Persisted setup readiness: {summary.label}</h2>
   <p role="status" className="mt-2 text-sm text-body">{summary.detail}</p>
   <Link href={`/admin/colleges/${encodeURIComponent(college.id)}/readiness`} className="mt-3 inline-flex min-h-11 items-center font-semibold text-primary-text underline">Inspect checks and re-evaluate →</Link>
  </section>
  <ol className="grid min-w-0 gap-3 sm:grid-cols-2">
   {superAdminTenantSetupSteps(college.id).map((step,index)=><li key={step.id} className="min-w-0 rounded-xl border border-border bg-surface p-4">
    <p className="text-xs font-semibold text-muted-foreground">Step {index+1}</p>
    <h2 className="mt-1 break-words font-semibold text-foreground">{step.title}</h2>
    <p className="mt-2 text-sm text-body">{step.description}</p>
    <Link href={step.href} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline">Open workspace →</Link>
   </li>)}
  </ol>
 </div>;
}
