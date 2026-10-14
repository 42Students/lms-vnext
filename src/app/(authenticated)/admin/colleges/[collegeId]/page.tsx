import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { CollegeServiceError } from "@/modules/colleges/service";
import { getSuperAdminTenantLifecycleDetail } from "@/modules/colleges/admin-tenant-lifecycle-service";
import { tenantSetupLinksAvailable } from "@/modules/colleges/admin-tenant-lifecycle-model";
export default async function TenantDetail({params}:{params:Promise<{collegeId:string}>}) {
 const {collegeId}=await params;
 let item:Awaited<ReturnType<typeof getSuperAdminTenantLifecycleDetail>>;
 try {item=await getSuperAdminTenantLifecycleDetail(await getCurrentRequestContext(),collegeId);}
 catch(error){if(error instanceof CollegeServiceError&&error.code==="COLLEGE_NOT_FOUND") notFound();throw error;}
 const fields=[
  ["Organization",item.organizationName],["College code",item.code],
  ["College status",item.status],["Organization status",item.organizationStatus],
  ["City",item.city??"Not recorded"],["State",item.state??"Not recorded"],
  ["Country",item.country??"Not recorded"],
  ["Created (IST)",new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(item.createdAt)],
 ];
 return <div className="space-y-5">
  <PageHeader eyebrow="Super Admin · Tenant" title={item.name} description="Read-only tenant identity and setup links in the authorized scope."/>
  <dl className="grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2">
   {fields.map(([label,value])=><div key={label}><dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
    <dd className="mt-1 break-words text-sm text-body">{value}</dd></div>)}
  </dl>
  <div className="flex flex-wrap gap-3">
   {tenantSetupLinksAvailable(item.status,item.organizationStatus) ? <>
   <Link href={`/admin/colleges/${encodeURIComponent(item.id)}/readiness`} className="rounded-md border border-border px-4 py-3 text-sm font-semibold text-primary-text">Readiness</Link>
   <Link href={`/admin/colleges/${encodeURIComponent(item.id)}/branding`} className="rounded-md border border-border px-4 py-3 text-sm font-semibold text-primary-text">Branding</Link>
   </> : <p className="text-sm text-muted-foreground">Setup links are unavailable while this college or its organization is archived.</p>}
   <Link href="/admin/tenants" className="rounded-md border border-border px-4 py-3 text-sm font-semibold text-primary-text">Tenant directory</Link>
  </div>
 </div>;
}
