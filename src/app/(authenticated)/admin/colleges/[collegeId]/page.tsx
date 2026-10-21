import Link from "next/link";
import { notFound } from "next/navigation";
import { collegeIdSchema } from "@/modules/colleges/validation";
import { AuthorizationError } from "@/modules/permissions/policy";
import { ErrorState } from "@/components/ui/error-state";
import { Banner } from "@/components/ui/banner";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { Tabs } from "@/components/ui/tabs";
import {TenantRestoreAction} from "@/components/admin/tenant-restore-action";
import { CollegeServiceError } from "@/modules/colleges/service";
import { getSuperAdminTenantLifecycleDetail } from "@/modules/colleges/admin-tenant-lifecycle-service";
import { tenantSetupLinksAvailable } from "@/modules/colleges/admin-tenant-lifecycle-model";
import { superAdminVerificationHref } from "@/modules/verification/admin-links";
export default async function TenantDetail({params}:{params:Promise<{collegeId:string}>}) {
 const {collegeId}=await params;
 const context=await getCurrentRequestContext();
 if (!collegeIdSchema.safeParse(collegeId).success) return <div className="min-w-0 space-y-4">
   <PageHeader title="Manage College" actions={<PageBackLink href="/admin/colleges" label="Colleges" />}/>
   <ErrorState title="Missing collegeId"
     description="This drawer requires a valid college record. Return to Colleges and select a college to manage."
     action={<Link href="/admin/colleges" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Back to colleges</Link>}/>
 </div>;
 let item:Awaited<ReturnType<typeof getSuperAdminTenantLifecycleDetail>>;
 try {item=await getSuperAdminTenantLifecycleDetail(context,collegeId);}
 catch(error){
   if(error instanceof CollegeServiceError&&error.code==="COLLEGE_NOT_FOUND") notFound();
   if(error instanceof AuthorizationError) throw error;
   return <div className="min-w-0 space-y-4">
     <PageHeader title="Manage College" actions={<PageBackLink href="/admin/colleges" label="Colleges"/>}/>
     <ErrorState title="College setup unavailable"
       description="This college's setup information could not be loaded. No changes have been made."
       action={<Link href={"/admin/colleges/"+encodeURIComponent(collegeId)}
         className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Retry college setup</Link>}/>
   </div>;
 }
 const fields=[
  ["Organization",item.organizationName],["College code",item.code],
  ["College status",item.status],["Organization status",item.organizationStatus],
  ["City",item.city??"Not recorded"],["State",item.state??"Not recorded"],
  ["Country",item.country??"Not recorded"],
  ["Created (IST)",new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(item.createdAt)],
 ];
 return <div className="min-w-0 space-y-[var(--lms-space-6)]">
  <PageHeader title={item.name} description="Read-only tenant identity and setup links in the authorized scope."
   actions={<PageBackLink href="/admin/tenants" label="Tenant directory"/>}/>
  <Banner tone="info" role="status">
   Manage College is divided into separate pages for Branding, Admins, Sign-in Methods and Web address.
   Save or discard edits in the active section before leaving it. Do not switch college scope
   while a save is pending. This overview has no unsaved form changes to discard.
  </Banner>
  <div className="min-w-0">
   <Tabs ariaLabel="College tabs" renderPanel={false} value="college" items={[
    {value:"college",label:"College",href:`/admin/colleges/${encodeURIComponent(item.id)}`},
    {value:"activity",label:"Activity",href:`/activity?collegeId=${encodeURIComponent(item.id)}`},
   ]}/>

  </div>
  <div className="grid min-w-0 gap-[var(--lms-space-3)] sm:grid-cols-2 lg:grid-cols-3">
   {tenantSetupLinksAvailable(item.status,item.organizationStatus) ? <>
   {context.adminScope?.collegeId===item.id ? <Link href="/admin/tenants/setup" className="inline-flex min-h-11 md:min-h-9 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white">Set up this college</Link> : null}
   <Link href={`/admin/colleges/${encodeURIComponent(item.id)}/readiness`} className="inline-flex min-h-11 md:min-h-9 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white">Readiness</Link>
   <Link href={`/admin/colleges/${encodeURIComponent(item.id)}/branding`} className="inline-flex min-h-11 md:min-h-9 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white">Branding</Link>
   {superAdminVerificationHref(item.id,item.status,item.organizationStatus) ? <Link href={superAdminVerificationHref(item.id,item.status,item.organizationStatus)!} className="inline-flex min-h-11 md:min-h-9 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white">Profile Verification</Link> : null}
   <Link href={`/admin/colleges/${encodeURIComponent(item.id)}/admins`} className="inline-flex min-h-11 md:min-h-9 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white">Admins</Link>
   <Link href={`/admin/colleges/${encodeURIComponent(item.id)}/signin`} className="inline-flex min-h-11 md:min-h-9 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white">Sign-in Methods</Link>
   <Link href={`/admin/colleges/${encodeURIComponent(item.id)}/subdomain`} className="inline-flex min-h-11 md:min-h-9 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white">Web address</Link>
   </> : <p className="text-sm text-muted-foreground">Setup links are unavailable while this college or its organization is archived.</p>}
  </div>
  <dl className="grid gap-4 border-t border-border pt-4 md:grid-cols-2">
   {fields.map(([label,value])=><div key={label}><dt className="text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">{label}</dt>
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

  <div className="flex min-w-0 justify-start print:hidden">
   <Link href={`/api/activity/admin-export?collegeId=${encodeURIComponent(item.id)}`}
     className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white">Export activity CSV</Link>
  </div>
 </div>;
}
