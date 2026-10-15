import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {requirePermission,can} from "@/modules/permissions/policy";
import {listOrganizations} from "@/modules/organizations/service";
import {OrganizationCreateForm} from "@/components/admin/organization-create-form";
import {CollegeCreateForm} from "@/components/admin/college-create-form";
import {PageHeader} from "@/components/ui/page-header";
export const dynamic="force-dynamic";
export default async function SuperAdminTenantCreateStage(){
 const context=await getCurrentRequestContext();
 requirePermission(context,"admin-scope.select");
 const organizations=await listOrganizations(context);
 const creatable=organizations.filter(item=>can(context,"college.manage",{organizationId:item.id}));
 const orgCreate=can(context,"organization.manage");
 return <div className="min-w-0 space-y-6">
  <Link href="/admin/tenants" className="text-sm font-semibold text-primary-text">← Tenant directory</Link>
  <PageHeader eyebrow="Super Admin · Tenant Setup" title="Create tenant"
   description="Create the organization first, then its college. The existing APIs enforce selected-scope authorization."/>
  <section className="space-y-3 rounded-xl border border-border bg-surface p-4" aria-label="Create organization">
   <h2 className="text-lg font-semibold">1. Organization</h2>
   {orgCreate?<OrganizationCreateForm/>:
    <p role="status" className="text-sm text-body">Organization creation is unavailable in your selected administrative scope.</p>}
   <Link href="/admin/organizations" className="text-sm font-semibold text-primary-text underline">Review organizations</Link>
  </section>
  <section className="space-y-3 rounded-xl border border-border bg-surface p-4" aria-label="Create college">
   <h2 className="text-lg font-semibold">2. College</h2>
   {creatable.length?<CollegeCreateForm advanceToSetup organizations={creatable.map(item=>({id:item.id,name:item.name}))}/>:
    <p role="status" className="text-sm text-body">No organization in the current safety scope can receive a college. Create or select an authorized organization first.</p>}
   <Link href="/admin/colleges" className="text-sm font-semibold text-primary-text underline">Review colleges</Link>
  </section>
  <section className="space-y-2 rounded-xl border border-border bg-surface p-4">
   <h2 className="text-lg font-semibold">3. Set up the college</h2>
   <p className="text-sm text-body">After creation, select that college in the safety-scope switcher before configuring its host, branding, academics and readiness.</p>
   <Link href="/admin/tenants/setup" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline">Continue to setup →</Link>
  </section>
 </div>;
}
