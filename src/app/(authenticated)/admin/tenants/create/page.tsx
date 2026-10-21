import { PageBackLink } from "@/components/ui/page-back-link";
import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {can} from "@/modules/permissions/policy";
import {isSuperAdmin} from "@/modules/identity/context";
import {listOrganizations} from "@/modules/organizations/service";
import {OrganizationCreateForm} from "@/components/admin/organization-create-form";
import {CollegeCreateForm} from "@/components/admin/college-create-form";
import {PageHeader} from "@/components/ui/page-header";
import {ErrorState} from "@/components/ui/error-state";
import {Banner} from "@/components/ui/banner";
import {preferredNewTenantOrganization} from "@/modules/colleges/admin-tenant-organization-step";
export const dynamic="force-dynamic";
export default async function SuperAdminTenantCreateStage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const context=await getCurrentRequestContext();
 if(!isSuperAdmin(context)||!can(context,"admin-scope.select"))
  return <div className="min-w-0 space-y-5">
   <PageHeader title="Create the customer, then make one college launch-ready" actions={<PageBackLink href="/dashboard" label="Dashboard"/>}/>
   <ErrorState title="Tenant creation access denied"
    description="Your account cannot create or configure platform tenants."
    action={<PageBackLink href="/dashboard" label="Back to dashboard" />}/>
  </div>;
 let organizations:Awaited<ReturnType<typeof listOrganizations>>;
 try{
  organizations=await listOrganizations(context);
 }catch{
  return <div className="min-w-0 space-y-5">
   <PageHeader title="Create the customer, then make one college launch-ready" actions={<PageBackLink href="/admin/tenants" label="Tenant directory"/>}/>
   <ErrorState title="Organization directory unavailable"
    description="Organization choices could not be verified. College creation remains unavailable until your authorized organizations can be loaded."
    action={<Link href="/admin/tenants/create" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] w-full md:w-auto">Retry organization directory</Link>}/>
  </div>;
 }
 const creatable=organizations.filter(item=>can(context,"college.manage",{organizationId:item.id}));
 const orgCreate=can(context,"organization.manage");
 const params=await searchParams;
 const preferredId=preferredNewTenantOrganization(params.organizationId,creatable);
 return <div className="min-w-0 space-y-4 md:space-y-5">
  <PageBackLink href="/admin/tenants" label="Tenant directory" />
  <PageHeader title="Create the customer, then make one college launch-ready"
   description="Creating organizations and colleges is a platform-level action. Domains, branding and readiness checks are college-specific, so the current scope is always visible before you edit."/>
  <section className="min-w-0 space-y-3 border-b border-border pb-4" aria-label="Create organization">
   <h2 className="m-0 break-words text-lg font-semibold leading-7 text-[var(--lms-heading)]">Create an organization and its colleges</h2>
   {orgCreate?<OrganizationCreateForm advanceToCollege/>:
    <Banner tone="warning">Organization creation is unavailable in your selected administrative scope.</Banner>}
   <Link href="/admin/organizations" className="inline-flex min-h-11 min-[768px]:min-h-9 items-center text-sm font-semibold text-primary-text underline">Review organizations</Link>
  </section>
  <section className="min-w-0 space-y-3 border-b border-border pb-4" aria-label="Create college">
   <h2 className="m-0 break-words text-lg font-semibold leading-7 text-[var(--lms-heading)]">2. College</h2>
   {preferredId?<Banner tone="info" role="status">Organization chosen for the next step. The college form has this verified, authorized organization preselected; your current safety scope is unchanged.</Banner>:null}
   {creatable.length?<CollegeCreateForm key={preferredId ?? "default"} preferredOrganizationId={preferredId ?? undefined} advanceToSetup organizations={creatable.map(item=>({id:item.id,name:item.name}))}/>: 
    <Banner tone="warning">No organization in the current safety scope can receive a college. Create or select an authorized organization first.</Banner>}
   <Link href="/admin/colleges" className="inline-flex min-h-11 min-[768px]:min-h-9 items-center text-sm font-semibold text-primary-text underline">Review colleges</Link>
  </section>
  <section className="min-w-0 space-y-2 pt-1">
   <h2 className="m-0 break-words text-lg font-semibold leading-7 text-[var(--lms-heading)]">Get this college ready to go live</h2>
   <p className="text-sm text-body">After creating a college, the workflow verifies its identity, selects it in the safety-scope switcher and opens Launch setup. If automatic scope selection fails, choose the created college in the header before continuing. Creation and scope selection are separate audited actions.</p>
   <Link href="/admin/tenants/setup" className="inline-flex min-h-11 min-[768px]:min-h-9 items-center text-sm font-semibold text-primary-text underline">Continue to setup →</Link>
  </section>
 </div>;
}
