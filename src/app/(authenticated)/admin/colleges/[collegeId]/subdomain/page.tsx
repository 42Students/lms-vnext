import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { Banner } from "@/components/ui/banner";
import Link from "next/link";
import { PageBackLink } from "@/components/ui/page-back-link";
import { Disclosure } from "@/components/ui/disclosure";
import { TenantDomainManager, type TenantDomainClientRow } from "@/components/admin/tenant-domain-manager";
import { getSuperAdminTenantLifecycleDetail } from "@/modules/colleges/admin-tenant-lifecycle-service";
import { CollegeServiceError } from "@/modules/colleges/service";
import { listTenantDomainsWithRuntime } from "@/modules/tenant-domains/runtime";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import {ManagedCollegeSubdomain} from "@/components/admin/managed-college-subdomain";
import {getManagedCollegeSubdomain} from "@/modules/tenant-domains/managed-subdomain-service";

function CollegeWebAddressLoading() {
 return <div className="min-w-0 space-y-4" aria-busy="true" aria-label="Loading web address">
  <PageHeader title="Web address"/>
  <div className="min-w-0 rounded-lg border border-border bg-surface p-4">
   <div className="h-5 w-32 animate-pulse rounded bg-muted"/>
   <div className="mt-4 h-4 w-3/4 animate-pulse rounded bg-muted"/>
   <div className="mt-4 h-10 w-full max-w-md animate-pulse rounded bg-muted"/>
  </div>
 </div>;
}
export default function CollegeWebAddress({params}:{params:Promise<{collegeId:string}>}) {
 return <Suspense fallback={<CollegeWebAddressLoading/>}>
  <CollegeWebAddressContent params={params}/>
 </Suspense>;
}
async function CollegeWebAddressContent({ params }: {
 params: Promise<{collegeId: string}>;
}) {
 const {collegeId} = await params;
 const context = await getCurrentRequestContext();
 let college: Awaited<ReturnType<typeof getSuperAdminTenantLifecycleDetail>>;
 try { college = await getSuperAdminTenantLifecycleDetail(context,collegeId); }
 catch(error) { if(error instanceof CollegeServiceError && error.code==="COLLEGE_NOT_FOUND") notFound(); throw error; }
 requirePermission(context,"college.manage",{organizationId:college.organizationId,collegeId:college.id});
 const [rowsResult,managedResult]=await Promise.allSettled([
   listTenantDomainsWithRuntime(context,college.id),
   getManagedCollegeSubdomain(context,college.id),
 ]);
 if(rowsResult.status==="rejected"&&rowsResult.reason instanceof AuthorizationError)throw rowsResult.reason;
 if(managedResult.status==="rejected"&&managedResult.reason instanceof AuthorizationError)throw managedResult.reason;
 const rows=rowsResult.status==="fulfilled"?rowsResult.value:[];
 const domains: TenantDomainClientRow[] = rows.map(domain=>({
  id:domain.id,host:domain.host,isPrimary:domain.isPrimary,isVerified:domain.isVerified,
  verificationToken:domain.verificationToken,
  verifiedAt:domain.verifiedAt?.toISOString()??null,
  lastCheckedAt:domain.lastCheckedAt?.toISOString()??null,
  lastCheckResult:domain.lastCheckResult,
 }));
 return <div className="min-w-0 max-w-full space-y-[var(--lms-space-6)]">
   <PageHeader title={college.name}
     description="Manage this college's verified web addresses, including its subdomain. Only a verified address can become primary."
     actions={<PageBackLink href={`/admin/colleges/${encodeURIComponent(college.id)}`} label="College setup"/>}/>
   <Banner tone="info" role="status">
     Save or discard web-address edits before switching the selected college or leaving this setup section.
   </Banner>
   <section aria-label="Web address" className="min-w-0 rounded-lg border border-border bg-surface p-4">
     <div className="flex flex-wrap items-center justify-between gap-3">
       <h2 className="text-base font-semibold text-[var(--lms-heading)]">Web address</h2>
       <Link href={"/admin/colleges/"+encodeURIComponent(college.id)+"/subdomain?reload=1"}
         className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle">
         <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
           <path d="M20 11a8 8 0 1 0-2.2 5.5"/><path d="M20 4v7h-7"/>
         </svg>
         Reload
       </Link>
     </div>
     <p className="my-3 max-w-3xl text-sm text-body">
       The address students and staff open to sign in.
       {managedResult.status==="fulfilled"&&managedResult.value.ready?
        " It works straight away, with HTTPS, as soon as you allot it.":
        " Allotment becomes available after the platform wildcard DNS and HTTPS certificate are verified."}
     </p>
     {managedResult.status==="fulfilled"&&managedResult.value.currentHost?
       <p role="status" className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-success bg-success-subtle px-3 py-2 text-sm">
         <strong>Live at</strong>
         <a href={"https://"+managedResult.value.currentHost} target="_blank" rel="noopener noreferrer"
           className="break-all font-semibold text-primary-text underline">{managedResult.value.currentHost} ↗</a>
       </p>:null}
     {managedResult.status==="fulfilled" ? <ManagedCollegeSubdomain collegeId={college.id} initial={managedResult.value}/> :
       <ErrorState title="Couldn't load the web address"
         description="The managed college subdomain could not be loaded. Existing custom addresses remain available."
         action={<Link href={"/admin/colleges/"+encodeURIComponent(college.id)+"/subdomain?reload=1"}
           className="font-semibold text-primary-text underline">Retry web address</Link>}/>}
   </section>
   <Disclosure ariaLabel="Verified custom addresses" title="Verified custom addresses" className="min-w-0" contentClassName="pt-[var(--lms-space-3)] pb-[var(--lms-space-4)]">
     {rowsResult.status==="fulfilled" ? <TenantDomainManager collegeId={college.id} domains={domains}/> :
       <ErrorState title="Couldn't load the web address."
         description="Custom-domain settings could not be loaded. No address changes were made."
         action={<Link href={"/admin/colleges/"+encodeURIComponent(college.id)+"/subdomain"}
           className="font-semibold text-primary-text underline">Retry custom addresses</Link>}/>}

   </Disclosure>
   <p className="text-xs text-muted-foreground">Moving an address between colleges is not supported by this manager. Remove it from the previous college after confirming the migration plan; do not bypass host ownership checks.</p>
 </div>;
}
