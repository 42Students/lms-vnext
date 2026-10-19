import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { TenantDomainManager, type TenantDomainClientRow } from "@/components/admin/tenant-domain-manager";
import { getSuperAdminTenantLifecycleDetail } from "@/modules/colleges/admin-tenant-lifecycle-service";
import { CollegeServiceError } from "@/modules/colleges/service";
import { listTenantDomainsWithRuntime } from "@/modules/tenant-domains/runtime";
import { requirePermission } from "@/modules/permissions/policy";
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
 const [rows,managed]=await Promise.all([listTenantDomainsWithRuntime(context,college.id),getManagedCollegeSubdomain(context,college.id)]);
 const domains: TenantDomainClientRow[] = rows.map(domain=>({
  id:domain.id,host:domain.host,isPrimary:domain.isPrimary,isVerified:domain.isVerified,
  verificationToken:domain.verificationToken,
  verifiedAt:domain.verifiedAt?.toISOString()??null,
  lastCheckedAt:domain.lastCheckedAt?.toISOString()??null,
  lastCheckResult:domain.lastCheckResult,
 }));
 return <div className="min-w-0 space-y-6">
   <Link href={`/admin/colleges/${encodeURIComponent(college.id)}`} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle">← College setup</Link>
   <PageHeader eyebrow="Super Admin · Web address" title={college.name}
     description="Manage this college's verified web addresses, including its subdomain. Only a verified address can become primary." />
   <ManagedCollegeSubdomain collegeId={college.id} initial={managed}/>
   <TenantDomainManager collegeId={college.id} domains={domains}/>
   <p className="text-xs text-muted-foreground">Moving an address between colleges is not supported by this manager. Remove it from the previous college after confirming the migration plan; do not bypass host ownership checks.</p>
 </div>;
}
