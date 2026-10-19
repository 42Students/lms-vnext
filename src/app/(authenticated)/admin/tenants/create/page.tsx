import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {can} from "@/modules/permissions/policy";
import {isSuperAdmin} from "@/modules/identity/context";
import {listOrganizations} from "@/modules/organizations/service";
import {OrganizationCreateForm} from "@/components/admin/organization-create-form";
import {CollegeCreateForm} from "@/components/admin/college-create-form";
import {PageHeader} from "@/components/ui/page-header";
import {ErrorState} from "@/components/ui/error-state";
import {preferredNewTenantOrganization} from "@/modules/colleges/admin-tenant-organization-step";
export const dynamic="force-dynamic";
export default async function SuperAdminTenantCreateStage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const context=await getCurrentRequestContext();
 if(!isSuperAdmin(context)||!can(context,"admin-scope.select"))
  return <div className="min-w-0 space-y-5">
   <PageHeader eyebrow="Super Admin · Tenant Setup" title="Create the customer, then make one college launch-ready"/>
   <ErrorState title="Tenant creation access denied"
    description="Your account cannot create or configure platform tenants."
    action={<Link href="/dashboard" className="font-semibold text-primary-text underline">Back to dashboard</Link>}/>
  </div>;
 let organizations:Awaited<ReturnType<typeof listOrganizations>>;
 try{
  organizations=await listOrganizations(context);
 }catch{
  return <div className="min-w-0 space-y-5">
   <PageHeader eyebrow="Super Admin · Tenant Setup" title="Create the customer, then make one college launch-ready"/>
   <ErrorState title="Organization directory unavailable"
    description="Organization choices could not be verified. College creation remains unavailable until your authorized organizations can be loaded."
    action={<Link href="/admin/tenants/create" className="font-semibold text-primary-text">Retry organization directory</Link>}/>
  </div>;
 }
 const creatable=organizations.filter(item=>can(context,"college.manage",{organizationId:item.id}));
 const orgCreate=can(context,"organization.manage");
 const params=await searchParams;
 const preferredId=preferredNewTenantOrganization(params.organizationId,creatable);
 return <div className="min-w-0 space-y-6">
  <PageHeader eyebrow="Super Admin · Tenant Setup" title="Create the customer, then make one college launch-ready"
   description="Creating organizations and colleges is a platform-level action. Domains, branding and readiness checks are college-specific, so the current scope is always visible before you edit."
   actions={<Link href="/admin/tenants" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius,9px)] border border-border px-3.5 text-sm font-semibold text-primary-text sm:min-h-9">← Tenant directory</Link>}/>
  <section className="space-y-3 border-b border-border pb-5" aria-label="Create organization">
   <h2 className="text-lg font-semibold">Create an organization and its colleges</h2>
   {orgCreate?<OrganizationCreateForm advanceToCollege/>:
    <p role="status" className="text-sm text-body">Organization creation is unavailable in your selected administrative scope.</p>}
   <Link href="/admin/organizations" className="inline-flex min-h-11 sm:min-h-9 items-center text-sm font-semibold text-primary-text underline">Review organizations</Link>
  </section>
  <section className="space-y-3 border-b border-border pb-5" aria-label="Create college">
   <h2 className="text-lg font-semibold">2. College</h2>
   {creatable.length?<CollegeCreateForm key={preferredId ?? "default"} preferredOrganizationId={preferredId ?? undefined} advanceToSetup organizations={creatable.map(item=>({id:item.id,name:item.name}))}/>:
    <p role="status" className="text-sm text-body">No organization in the current safety scope can receive a college. Create or select an authorized organization first.</p>}
   <Link href="/admin/colleges" className="inline-flex min-h-11 sm:min-h-9 items-center text-sm font-semibold text-primary-text underline">Review colleges</Link>
  </section>
  <section className="space-y-2 border-b border-border pb-5">
   <h2 className="text-lg font-semibold">Get this college ready to go live</h2>
   <p className="text-sm text-body">After creation, select that college in the safety-scope switcher before configuring its host, branding, academics and readiness.</p>
   <Link href="/admin/tenants/setup" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline">Continue to setup →</Link>
  </section>
 </div>;
}
