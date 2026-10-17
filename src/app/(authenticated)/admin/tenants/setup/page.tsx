import Link from "next/link";
import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {getSuperAdminTenantLifecycleDetail,getSuperAdminTenantLifecycleDirectory} from "@/modules/colleges/admin-tenant-lifecycle-service";
import {CollegeServiceError} from "@/modules/colleges/service";
import {requirePermission,can} from "@/modules/permissions/policy";
import {superAdminTenantSetupSteps} from "@/modules/colleges/admin-tenant-setup-journey";
import {getSuperAdminCollegeReadiness} from "@/modules/colleges/readiness-service";
import {summarizeTenantSetupReadiness} from "@/modules/colleges/admin-tenant-setup-status";
import {listOrganizations} from "@/modules/organizations/service";
import {OrganizationCreateForm} from "@/components/admin/organization-create-form";
import {CollegeCreateForm} from "@/components/admin/college-create-form";

export const dynamic="force-dynamic";
type Tab="STRUCTURE"|"LAUNCH";
function tenantSetupTab(raw:unknown,scoped:boolean):Tab{
 if(raw==="STRUCTURE"||raw==="LAUNCH")return raw;
 return scoped?"LAUNCH":"STRUCTURE";
}

/** SA-tenants-modules-06: one scope-aware URL-persisted Tenant Setup workspace. */
export default async function SuperAdminTenantSetup({
 searchParams,
}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const context=await getCurrentRequestContext();
 requirePermission(context,"admin-scope.select");
 const id=context.adminScope?.collegeId??null;
 const query=await searchParams;
 const tab=tenantSetupTab(query.tab,id!==null);
 const active="border-primary bg-primary-subtle text-primary-text";
 const inactive="border-border text-body hover:bg-surface-subtle";
 const tabLink=(next:Tab)=>"/admin/tenants/setup?tab="+next;
 // Structure forms must never suggest an organization outside this safety scope.
 const organizations=tab==="STRUCTURE"?await listOrganizations(context):[];
 const creatable=organizations.filter(item=>can(context,"college.manage",{organizationId:item.id}));
 const orgCreate=can(context,"organization.manage");
 const list=tab==="STRUCTURE"
  ?await getSuperAdminTenantLifecycleDirectory(context,{status:"ALL",page:1})
  :null;
 let college:Awaited<ReturnType<typeof getSuperAdminTenantLifecycleDetail>>|null=null;
 if(tab==="LAUNCH"&&id){
  try{college=await getSuperAdminTenantLifecycleDetail(context,id);}
  catch(e){if(e instanceof CollegeServiceError&&e.code==="COLLEGE_NOT_FOUND")notFound();throw e;}
  requirePermission(context,"college.read",{organizationId:college.organizationId,collegeId:college.id});
 }
 const readiness=college?await getSuperAdminCollegeReadiness(context,college.id):null;
 const summary=summarizeTenantSetupReadiness(readiness?.evaluation??null);
 return <div className="min-w-0 space-y-6">
  <Link href="/admin/tenants" className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text underline">← Tenant directory</Link>
  <PageHeader eyebrow="Super Admin · Tenant Setup" title="Tenant Setup"
   description="Create the customer and its colleges, then configure one selected college for launch. Scope always controls writes."/>
  <section aria-label="Tenant setup overview" className="grid gap-3 sm:grid-cols-3">
   <article className="rounded-xl border border-border bg-surface p-4">
    <p className="text-xs font-semibold text-muted-foreground">Current step</p>
    <p className="mt-2 font-semibold">{tab==="STRUCTURE"?"1. Tenant structure":"2. Launch setup"}</p>
   </article>
   <article className="rounded-xl border border-border bg-surface p-4">
    <p className="text-xs font-semibold text-muted-foreground">Creation</p>
    <p className="mt-2 text-sm font-semibold">{organizations.length?organizations.length+" authorized active organization(s)":tab==="LAUNCH"?"Completed separately":"Create or select an organization"}</p>
   </article>
   <article className="rounded-xl border border-border bg-surface p-4">
    <p className="text-xs font-semibold text-muted-foreground">College setup</p>
    <p className="mt-2 break-words text-sm font-semibold">{college?.name??(id?"Selected college":"No college selected")}</p>
   </article>
  </section>
  <nav aria-label="Tenant Setup steps" className="flex flex-wrap gap-2">
   <Link href={tabLink("STRUCTURE")} aria-current={tab==="STRUCTURE"?"page":undefined}
    className={"inline-flex min-h-11 items-center rounded-lg border px-4 text-sm font-semibold "+(tab==="STRUCTURE"?active:inactive)}>
    1. Tenant structure
   </Link>
   <Link href={tabLink("LAUNCH")} aria-current={tab==="LAUNCH"?"page":undefined}
    className={"inline-flex min-h-11 items-center rounded-lg border px-4 text-sm font-semibold "+(tab==="LAUNCH"?active:inactive)}>
    2. Launch setup
   </Link>
  </nav>
  {tab==="STRUCTURE"?<>
   <section aria-label="Create organization and college" className="grid min-w-0 gap-4 xl:grid-cols-2">
    <div className="min-w-0 space-y-3 rounded-xl border border-border bg-surface p-4">
     <h2 className="font-semibold text-foreground">Create an organization</h2>
     {orgCreate?<OrganizationCreateForm/>:
      <p role="status" className="text-sm text-body">Organization creation is not permitted in your selected administrative scope.</p>}
    </div>
    <div className="min-w-0 space-y-3 rounded-xl border border-border bg-surface p-4">
     <h2 className="font-semibold text-foreground">Create a college</h2>
     {creatable.length?<CollegeCreateForm organizations={creatable.map(o=>({id:o.id,name:o.name}))}/>:
      <p role="status" className="text-sm text-body">No authorized active organization is available. Create one or change the Super Admin scope.</p>}
    </div>
   </section>
   <section aria-label="Existing organizations and colleges" className="grid min-w-0 gap-4 lg:grid-cols-2">
    <div className="rounded-xl border border-border bg-surface p-4">
     <div className="flex items-center justify-between gap-3">
      <h2 className="font-semibold">Organizations</h2>
      <Link href="/admin/organizations" className="text-sm font-semibold text-primary-text underline">Manage all</Link>
     </div>
     <ul className="mt-3 space-y-2 text-sm text-body">
      {organizations.slice(0,20).map(o=><li key={o.id} className="rounded border border-border p-2">{o.name}</li>)}
     </ul>
     {organizations.length>20?<p className="mt-2 text-xs text-muted-foreground">First 20 shown; use Manage all for the full directory.</p>:null}
    </div>
    <div className="rounded-xl border border-border bg-surface p-4">
     <div className="flex items-center justify-between gap-3">
      <h2 className="font-semibold">Colleges</h2>
      <Link href="/admin/tenants" className="text-sm font-semibold text-primary-text underline">Manage all</Link>
     </div>
     <ul className="mt-3 space-y-2 text-sm text-body">
      {list?.items.map(item=><li key={item.id} className="rounded border border-border p-2">
       <Link href={"/admin/colleges/"+encodeURIComponent(item.id)} className="font-semibold text-primary-text underline">{item.name}</Link>
       {" · "}{item.code} · {item.status}
      </li>)}
     </ul>
     {!list?.items.length?<p role="status" className="text-sm text-body">No colleges in the current scope.</p>:null}
     <p className="mt-2 text-xs text-muted-foreground">First page only. Archived colleges remain marked; no implicit restoration.</p>
    </div>
   </section>
   <Link href={tabLink("LAUNCH")} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Continue to launch setup →</Link>
  </>:college?<>
   <h2 className="text-lg font-semibold">{college.name} · Launch setup</h2>
   <p role="status" className="rounded-xl border border-border bg-surface p-4 text-sm text-body">
    Persisted readiness: {summary.label}. {summary.detail}
   </p>
   <div className="grid gap-3 sm:grid-cols-3">
    {[
     {label:"Web address",href:"/subdomain",description:"Configure and verify the college login domain."},
     {label:"Sign-in",href:"/signin",description:"Review login methods and account access."},
     {label:"Look and feel",href:"/branding",description:"Set visible college branding and identity."},
    ].map(card=><Link key={card.label} href={"/admin/colleges/"+encodeURIComponent(college.id)+card.href}
     className="min-w-0 rounded-xl border border-border bg-surface p-4 hover:border-primary">
     <h3 className="font-semibold text-primary-text">{card.label}</h3>
     <p className="mt-2 text-sm text-body">{card.description}</p>
    </Link>)}
   </div>
   <section aria-label="Launch checklist" className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3">
     <h2 className="text-lg font-semibold">Launch checklist</h2>
     <Link href={"/admin/colleges/"+encodeURIComponent(college.id)+"/readiness"} className="text-sm font-semibold text-primary-text underline">Inspect persisted readiness →</Link>
    </div>
    <ol className="grid min-w-0 gap-3 sm:grid-cols-2">
     {superAdminTenantSetupSteps(college.id).map((step,index)=><li key={step.id} className="min-w-0 rounded-xl border border-border bg-surface p-4">
      <p className="text-xs font-semibold text-muted-foreground">Step {index+1}</p>
      <h3 className="mt-1 break-words font-semibold text-foreground">{step.title}</h3>
      <p className="mt-2 text-sm text-body">{step.description}</p>
      <Link href={step.href} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline">Open workspace →</Link>
     </li>)}
    </ol>
   </section>
   <p className="text-xs text-muted-foreground">Passing persisted checks does not certify live DNS, OTP delivery, teaching, attendance, placements or production launch.</p>
  </>:<section role="status" className="rounded-xl border border-border bg-surface p-5">
    <h2 className="font-semibold">No college selected</h2>
    <p className="mt-2 text-sm text-body">Select a college using the Super Admin safety scope switcher. Launch setup never guesses a tenant.</p>
    <Link href={tabLink("STRUCTURE")} className="mt-3 inline-flex min-h-11 items-center font-semibold text-primary-text underline">Create or select a college →</Link>
  </section>}
 </div>;
}
