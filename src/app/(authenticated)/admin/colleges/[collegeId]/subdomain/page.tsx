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

export default async function CollegeWebAddress({ params }: {
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
   <section aria-label="Managed college address" className="min-w-0">
     {managedResult.status==="fulfilled" ? <ManagedCollegeSubdomain collegeId={college.id} initial={managedResult.value}/> :
       <ErrorState title="Couldn't load the web address."
         description="The managed college subdomain could not be loaded. Existing custom addresses remain available."
         action={<Link href={"/admin/colleges/"+encodeURIComponent(college.id)+"/subdomain"}
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
