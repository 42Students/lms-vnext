import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeCreateForm } from "@/components/admin/college-create-form";
import { OrganizationCreateForm } from "@/components/admin/organization-create-form";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { can } from "@/modules/permissions/policy";
import { listOrganizations } from "@/modules/organizations/service";
import { getSuperAdminCollegeReadiness } from "@/modules/colleges/readiness-service";
import { tenantSetupPresentation, tenantSetupQuerySchema } from "@/modules/colleges/admin-tenant-setup-model";
export default async function TenantSetupPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}) {
 const raw=await searchParams;
 const parsed=tenantSetupQuerySchema.safeParse({tab:raw.tab});
 if(!parsed.success)return <div className="space-y-4">
  <PageHeader eyebrow="Super Admin" title="Tenant Setup"/>
  <ErrorState title="Invalid setup tab" description="Choose Create or Set up."
   action={<Link href="/admin/tenants/setup" className="font-semibold text-primary-text">Back to setup</Link>}/>
 </div>;
 const context=await getCurrentRequestContext();
 const selectedCollegeId=context.adminScope?.collegeId??null;
 const organizations=await listOrganizations(context);
 const availableOrganizations=organizations.filter(x=>can(context,"college.manage",{organizationId:x.id}));
 const state=tenantSetupPresentation({
  tab:parsed.data.tab,selectedCollegeId,
  canCreateOrganization:can(context,"organization.manage"),
  canCreateCollege:availableOrganizations.length>0,
 });
 const readiness=state.showSetup&&selectedCollegeId
  ?await getSuperAdminCollegeReadiness(context,selectedCollegeId):null;
 if(state.showSetup&&selectedCollegeId&&!readiness)notFound();
 const tabs=[{id:"create",label:"1 · Create"},{id:"setup",label:"2 · Set up"}] as const;
 return <div className="space-y-5">
  <PageHeader eyebrow="Super Admin" title="Tenant Setup"
   description="Two-stage tenant onboarding: create organization and college, then select a college scope and inspect its go-live setup."/>
  <nav aria-label="Tenant setup stages" className="flex flex-wrap gap-2">
   {tabs.map(tab=><Link key={tab.id} href={"/admin/tenants/setup?tab="+tab.id}
    aria-current={parsed.data.tab===tab.id?"page":undefined}
    className={"inline-flex min-h-11 items-center rounded-md border px-4 text-sm font-semibold "+
      (parsed.data.tab===tab.id?"border-primary bg-primary-subtle text-primary-text":"border-border text-body")}>
    {tab.label}</Link>)}
  </nav>
  {state.showCreate?<div className="space-y-5">
   {selectedCollegeId?<EmptyState title="Clear the selected college to create a new tenant"
    description="Creating global organizations or colleges while scoped inside a customer is disabled. Use the scope selector to return to global or organization scope."/>:
   <div className="grid gap-5 lg:grid-cols-2">
    <section className="rounded-xl border border-border bg-surface p-5">
     <h2 className="text-lg font-semibold text-foreground">Organization</h2>
     <p className="my-3 text-sm text-body">An organization is the parent tenant boundary.</p>
     {state.canCreateOrganization?<OrganizationCreateForm/>:<p className="text-sm text-muted-foreground">Organization creation requires global scope.</p>}
     <Link href="/admin/organizations" className="mt-3 inline-flex min-h-10 items-center font-semibold text-primary-text">Manage organizations →</Link>
    </section>
    <section className="rounded-xl border border-border bg-surface p-5">
     <h2 className="text-lg font-semibold text-foreground">College</h2>
     <p className="my-3 text-sm text-body">Choose an existing organization before creating its college.</p>
     {state.canCreateCollege?<CollegeCreateForm organizations={availableOrganizations.map(o=>({id:o.id,name:o.name}))}/>:
      <p className="text-sm text-muted-foreground">Create an organization or choose an organization scope first.</p>}
     <Link href="/admin/colleges" className="mt-3 inline-flex min-h-10 items-center font-semibold text-primary-text">Manage colleges →</Link>
    </section>
   </div>}
  </div>:null}
  {state.showSetup?<div className="space-y-5">
   {state.requiresCollege?<EmptyState title="Select a college scope"
    description="Choose the exact college in the Super Admin scope selector to review readiness, domains and branding. Nothing will be inferred from a previous college."/>:null}
   {readiness?<div className="space-y-4">
    <section className="rounded-xl border border-border bg-surface p-5">
     <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="m-0 text-lg font-semibold text-foreground">{readiness.college.name}</h2>
       <p className="mt-1 text-sm text-muted-foreground">{readiness.college.code} · selected college</p></div>
      <StatusBadge tone={readiness.evaluation.overall==="READY"?"success":readiness.evaluation.overall==="NOT_READY"?"error":"warning"}>
       {readiness.evaluation.overall}</StatusBadge>
     </div>
     <p className="mt-3 text-sm text-body">{readiness.evaluation.counts.passed}/{readiness.evaluation.counts.total} checks passed · {readiness.evaluation.counts.unknown} unknown</p>
     <p className="mt-2 text-xs text-muted-foreground">Unknown evidence is not treated as ready. Open the detailed gate for individual remediation.</p>
    </section>
    <div className="grid gap-3 md:grid-cols-3">
     {[
      {label:"Readiness Gate",href:`/admin/colleges/${encodeURIComponent(readiness.college.id)}/readiness`,description:"Go-live checks and remediation"},
      {label:"Tenant Domains",href:"/admin/domains",description:"DNS and verified hostnames"},
      {label:"College Branding",href:`/admin/colleges/${encodeURIComponent(readiness.college.id)}/branding`,description:"Configured login appearance"},
     ].map(link=><Link key={link.label} href={link.href} className="min-h-28 rounded-xl border border-border bg-surface p-4 hover:bg-primary-subtle">
      <p className="font-semibold text-primary-text">{link.label} →</p><p className="mt-2 text-sm text-body">{link.description}</p>
     </Link>)}
    </div>
   </div>:null}
  </div>:null}
  <Link href="/admin/tenants" className="inline-flex min-h-10 items-center font-semibold text-primary-text">← Tenant directory</Link>
 </div>;
}
