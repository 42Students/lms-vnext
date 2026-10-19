import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import {TenantRestoreAction} from "@/components/admin/tenant-restore-action";
import { CollegeServiceError } from "@/modules/colleges/service";
import { getSuperAdminTenantLifecycleDetail } from "@/modules/colleges/admin-tenant-lifecycle-service";
import { tenantSetupLinksAvailable } from "@/modules/colleges/admin-tenant-lifecycle-model";
import { superAdminVerificationHref } from "@/modules/verification/admin-links";
export default async function TenantDetail({params}:{params:Promise<{collegeId:string}>}) {
 const {collegeId}=await params;
 const context=await getCurrentRequestContext();
 let item:Awaited<ReturnType<typeof getSuperAdminTenantLifecycleDetail>>;
 try {item=await getSuperAdminTenantLifecycleDetail(context,collegeId);}
 catch(error){if(error instanceof CollegeServiceError&&error.code==="COLLEGE_NOT_FOUND") notFound();throw error;}
 const fields=[
  ["Organization",item.organizationName],["College code",item.code],
  ["College status",item.status],["Organization status",item.organizationStatus],
  ["City",item.city??"Not recorded"],["State",item.state??"Not recorded"],
  ["Country",item.country??"Not recorded"],
  ["Created (IST)",new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(item.createdAt)],
 ];
 return <div className="min-w-0 space-y-5">
  <PageHeader eyebrow="Super Admin · Tenant" title={item.name} description="Read-only tenant identity and setup links in the authorized scope."/>
  <nav aria-label="College tabs" className="flex flex-wrap items-center gap-3">
   <Link href={`/admin/colleges/${encodeURIComponent(item.id)}`}
     aria-current="page" className="inline-flex min-h-11 items-center font-semibold text-primary-text">College</Link>
   <Link href={`/activity?collegeId=${encodeURIComponent(item.id)}`}
     className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Activity</Link>
   <Link href={`/api/activity/admin-export?collegeId=${encodeURIComponent(item.id)}`}
     className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Export activity CSV</Link>
  </nav>
  <dl className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
   {fields.map(([label,value])=><div key={label}><dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
    <dd className="mt-1 break-words text-sm text-body">{value}</dd></div>)}
  </dl>
  {item.status==="ARCHIVED"&&item.organizationStatus==="ACTIVE"?
   <section aria-label="Restore archived college" className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
    <p className="text-sm text-body">This college is archived. Restore only after checking the organization and its deployment readiness.</p>
    <TenantRestoreAction kind="college" id={item.id} name={item.name}/>
   </section>:null}
  {item.status==="ARCHIVED"&&item.organizationStatus!=="ACTIVE"?
   <p role="status" className="border-t border-border pt-4 text-sm text-body">
    Restore the parent organization before restoring this college.
   </p>:null}
  <div className="flex flex-wrap gap-3">
   {tenantSetupLinksAvailable(item.status,item.organizationStatus) ? <>
   {context.adminScope?.collegeId===item.id ? <Link href="/admin/tenants/setup" className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle">Set up this college</Link> : null}
   <Link href={`/admin/colleges/${encodeURIComponent(item.id)}/readiness`} className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle">Readiness</Link>
   <Link href={`/admin/colleges/${encodeURIComponent(item.id)}/branding`} className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle">Branding</Link>
   {superAdminVerificationHref(item.id,item.status,item.organizationStatus) ? <Link href={superAdminVerificationHref(item.id,item.status,item.organizationStatus)!} className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle">Profile Verification</Link> : null}
   <Link href={`/admin/colleges/${encodeURIComponent(item.id)}/admins`} className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle">Admins</Link>
   <Link href={`/admin/colleges/${encodeURIComponent(item.id)}/signin`} className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle">Sign-in Methods</Link>
   <Link href={`/admin/colleges/${encodeURIComponent(item.id)}/subdomain`} className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle">Web address</Link>
   </> : <p className="text-sm text-muted-foreground">Setup links are unavailable while this college or its organization is archived.</p>}
   <Link href="/admin/tenants" className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle">Tenant directory</Link>
  </div>
 </div>;
}
