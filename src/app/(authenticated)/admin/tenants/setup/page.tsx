import {LaunchReadinessChecklist} from "@/components/admin/launch-readiness-checklist";
import {PageBackLink} from "@/components/ui/page-back-link";
import Link from "next/link";
import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {Tabs} from "@/components/ui/tabs";
import {Badge} from "@/components/ui/badge";
import {ErrorState} from "@/components/ui/error-state";
import {Banner} from "@/components/ui/banner";
import {EmptyState} from "@/components/ui/empty-state";
import {getSuperAdminTenantLifecycleDetail,getSuperAdminTenantLifecycleDirectory} from "@/modules/colleges/admin-tenant-lifecycle-service";
import {CollegeServiceError} from "@/modules/colleges/service";
import {can,requirePermission} from "@/modules/permissions/policy";
import {isSuperAdmin} from "@/modules/identity/context";
import {parseSuperAdminTenantSetupQuery,selectedSuperAdminTenantSetupTab} from "@/modules/admin-ui/tenant-setup-query-model";
import {superAdminTenantSetupSteps} from "@/modules/colleges/admin-tenant-setup-journey";
import {getSuperAdminCollegeReadiness} from "@/modules/colleges/readiness-service";
import {summarizeTenantSetupReadiness} from "@/modules/colleges/admin-tenant-setup-status";
import {listOrganizations} from "@/modules/organizations/service";
import {OrganizationCreateForm} from "@/components/admin/organization-create-form";
import {CollegeCreateForm} from "@/components/admin/college-create-form";
import {TenantSetupOrganizationList} from "@/components/admin/tenant-setup-organization-list";
import {ManagedCollegeSubdomain} from "@/components/admin/managed-college-subdomain";
import {getManagedCollegeSubdomain} from "@/modules/tenant-domains/managed-subdomain-service";
import {CollegeSigninMethodForm} from "@/components/admin/college-signin-method-form";
import {readAdminCollegeSignInPolicy} from "@/modules/colleges/admin-signin-policy-service";
import {CollegeLogoUploader} from "@/components/admin/college-logo-uploader";
import {CollegeBrandingForm} from "@/components/admin/college-branding-form";
import {getCollegeBranding} from "@/modules/colleges/branding-service";

export const dynamic="force-dynamic";
type Tab="STRUCTURE"|"LAUNCH";

/** SA-tenants-modules-06: one scope-aware URL-persisted Tenant Setup workspace. */
export default async function SuperAdminTenantSetup({
 searchParams,
}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const context=await getCurrentRequestContext();
 if(!isSuperAdmin(context)||!can(context,"admin-scope.select"))
  return <div className="min-w-0 space-y-4 md:space-y-6">
   <PageHeader title="Tenant Setup" actions={<PageBackLink href="/dashboard" label="Dashboard"/>}/>
   <ErrorState title="Tenant setup access denied"
    description="Your account cannot configure Super Admin tenants."
    action={<PageBackLink href="/dashboard" label="Back to dashboard" />}/>
  </div>;
 const parsed=parseSuperAdminTenantSetupQuery(await searchParams);
 if(!parsed.success)return <div className="min-w-0 space-y-4 md:space-y-6">
  <PageHeader title="Tenant Setup" actions={<PageBackLink href="/admin/tenants" label="Tenant directory"/>}/>
  <ErrorState title="Invalid tenant setup step"
   description="Select a valid Tenant structure or Launch setup step."
   action={<Link href="/admin/tenants/setup"
    className="inline-flex items-center min-h-11 md:min-h-9 font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto">Clear filters</Link>}/>
 </div>;
 const id=context.adminScope?.collegeId??null;
 const tab=selectedSuperAdminTenantSetupTab(parsed.data,id!==null);
 const tabLink=(next:Tab)=>"/admin/tenants/setup?tab="+(next==="STRUCTURE"?"structure":"identity");
 // A selected organization or college is not a global structure workspace.
 // Never fetch global lists or offer platform-wide tenant mutations in this state.
 const globallyScoped=!context.adminScope?.organizationId&&!context.adminScope?.collegeId;
 let organizations:Awaited<ReturnType<typeof listOrganizations>>=[];
 let list:Awaited<ReturnType<typeof getSuperAdminTenantLifecycleDirectory>>|null=null;
 let college:Awaited<ReturnType<typeof getSuperAdminTenantLifecycleDetail>>|null=null;
 let readiness:Awaited<ReturnType<typeof getSuperAdminCollegeReadiness>>|null=null;
 let managed:Awaited<ReturnType<typeof getManagedCollegeSubdomain>>|null=null;
 let signin:Awaited<ReturnType<typeof readAdminCollegeSignInPolicy>>|null=null;
 let branding:Awaited<ReturnType<typeof getCollegeBranding>>|null=null;
 let organizationFailed=false,collegesFailed=false,readinessFailed=false;
 let managedFailed=false,signinFailed=false,brandingFailed=false,detailFailed=false;
 if(tab==="STRUCTURE"&&globallyScoped){
  const [organizationsResult,collegesResult]=await Promise.allSettled([
   listOrganizations(context),getSuperAdminTenantLifecycleDirectory(context,{status:"ALL",page:1}),
  ]);
  if(organizationsResult.status==="fulfilled")organizations=organizationsResult.value;
  else organizationFailed=true;
  if(collegesResult.status==="fulfilled")list=collegesResult.value;
  else collegesFailed=true;
 }else if(tab==="LAUNCH"&&id){
  try {
   college=await getSuperAdminTenantLifecycleDetail(context,id);
   requirePermission(context,"college.read",{organizationId:college.organizationId,collegeId:college.id});
  }catch(error){
   if(error instanceof CollegeServiceError&&error.code==="COLLEGE_NOT_FOUND")notFound();
   detailFailed=true;
  }
  if(college){
   const allowed=can(context,"college.manage",{collegeId:college.id,organizationId:college.organizationId});
   const [r,m,si,b]=await Promise.allSettled([
    getSuperAdminCollegeReadiness(context,college.id),
    allowed?getManagedCollegeSubdomain(context,college.id):Promise.resolve(null),
    allowed?readAdminCollegeSignInPolicy(context,college.id):Promise.resolve(null),
    allowed?getCollegeBranding(context,college.id):Promise.resolve(null),
   ]);
   if(r.status==="fulfilled")readiness=r.value;else readinessFailed=true;
   if(m.status==="fulfilled")managed=m.value;else managedFailed=true;
   if(si.status==="fulfilled")signin=si.value;else signinFailed=true;
   if(b.status==="fulfilled")branding=b.value;else brandingFailed=true;
  }
 }
 const creatable=organizationFailed?[]:organizations.filter(item=>can(context,"college.manage",{organizationId:item.id}));
 const orgCreate=globallyScoped&&!organizationFailed&&can(context,"organization.manage");
 const summary=summarizeTenantSetupReadiness(readiness?.evaluation??null);
 const retry=<Link href={tabLink(tab)} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Retry</Link>;
 return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
  <PageBackLink href="/admin/tenants" label="Tenant directory" />
  <PageHeader eyebrow="Tenant lifecycle" title="Create the customer, then make one college launch-ready"
   description="Tenant Setup · Create a customer, set up its colleges, and get the selected college ready for launch." />
  <section aria-label="Tenant setup overview" className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
   <div className="mb-3 flex flex-wrap items-center gap-2">
    <strong className="text-sm">Tenant lifecycle</strong>
    <Badge tone="neutral">{id?(college?"College: "+college.name:"College-scoped"):context.adminScope?.organizationId?"Organization-scoped":"Platform view"}</Badge>
   </div>
   <div className="grid min-w-0 gap-3 md:grid-cols-3">
   <article className="border-b border-border pb-4">
    <p className="text-xs font-semibold text-muted-foreground">Current step</p>
    <p className="mt-2 break-words font-semibold">{tab==="STRUCTURE"?"1. Tenant structure":"2. Launch setup"}</p>
   </article>
   <article className="border-b border-border pb-4">
    <p className="text-xs font-semibold text-muted-foreground">Creation</p>
    <p className="mt-2 text-sm font-semibold">{orgCreate?"Available":"Locked"}</p>
    <p className="mt-1 text-xs text-muted-foreground">{orgCreate?"Create an organization or college":"Clear scoped selection to manage tenants"}</p>
   </article>
   <article className="border-b border-border pb-4">
    <p className="text-xs font-semibold text-muted-foreground">College setup</p>
    <p className="mt-2 break-words text-sm font-semibold">{id?"Available":"Select"}</p>
    <p className="mt-1 text-xs text-muted-foreground">{college?.name??(id?"Selected college":"Pick a college first")}</p>
   </article>
   </div>
  </section>
  <div className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
  <Tabs ariaLabel="Tenant Setup steps" renderPanel={false} value={tab}
    items={[
      {value:"STRUCTURE",label:"1. Tenant structure",href:tabLink("STRUCTURE")},
      {value:"LAUNCH",label:"2. Launch setup",href:tabLink("LAUNCH")},
    ]}/>
  {tab==="STRUCTURE"&&!globallyScoped?
   <Banner tone="warning" role="alert">
    {id?"You're working inside one college, so creating is turned off. Switch to Platform view to add organizations and colleges.":"You're working inside one organization, so creating is turned off. Switch to Platform view to manage the tenant structure."}
   </Banner>:
   tab==="STRUCTURE"?<>
    <section aria-label="Organization setup" className="min-w-0 space-y-4 border-b border-border pb-6">
     <h2 className="text-lg font-semibold text-[var(--lms-heading)]">Organizations</h2>
     {organizationFailed?<Banner tone="error" action={retry}>
      Organizations could not be loaded. College creation and organization changes are disabled until the authorized directory is available.
     </Banner>:null}
     {orgCreate?<div className="min-w-0 space-y-3">
      <h3 className="font-semibold text-body">Create New Organization</h3>
      <OrganizationCreateForm/>
     </div>:!organizationFailed?<Banner tone="warning">Organization creation is not permitted in this administrative scope.</Banner>:null}
     {!organizationFailed?<div className="min-w-0 space-y-3 border-t border-border pt-4">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
       <h3 className="font-semibold text-body">Existing Organizations</h3>
       <Link href="/admin/organizations" className="font-semibold text-primary-text underline">Manage all</Link>
      </div>
      <TenantSetupOrganizationList rows={organizations.map(o=>({
       id:o.id,name:o.name,canManage:can(context,"organization.manage",{organizationId:o.id}),
      }))}/>
     </div>:null}
    </section>
    <section aria-label="College setup" className="min-w-0 space-y-4 border-b border-border pb-6">
     <h2 className="text-lg font-semibold text-[var(--lms-heading)]">Colleges</h2>
     {collegesFailed?<Banner tone="error" action={retry}>
      Colleges could not be loaded. Retry the college directory before interpreting this as an empty roster.
     </Banner>:null}
     <div className="min-w-0 space-y-3">
      <h3 className="font-semibold text-body">Create New College</h3>
      {creatable.length&&list&&!organizationFailed?
       <CollegeCreateForm organizations={creatable.map(o=>({id:o.id,name:o.name}))}/>:
       <Banner tone="warning">No verified, authorized active organization is available for college creation. Create an organization or retry the directory.</Banner>}
     </div>
     {!collegesFailed?<div className="min-w-0 space-y-3 border-t border-border pt-4">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
       <h3 className="font-semibold text-body">Existing Colleges</h3>
       <Link href="/admin/tenants" className="font-semibold text-primary-text underline">Manage all</Link>
      </div>
      <ul className="min-w-0 divide-y divide-border text-sm text-body">
       {list?.items.map(item=><li key={item.id} className="min-w-0 py-2">
        <Link href={"/admin/colleges/"+encodeURIComponent(item.id)} className="font-semibold text-primary-text underline">{item.name}</Link>
        {" · "}{item.code} · {item.status}
       </li>)}
      </ul>
      {list&&!list.items.length?<EmptyState title="No colleges in the current scope" description="Create the first college from an authorized active organization."/>:null}
      <p className="text-xs text-muted-foreground">First college directory page only. Open Manage all for the full authorized directory.</p>
     </div>:null}
    </section>
    <Link href={tabLink("LAUNCH")} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Continue to launch setup →</Link>
  </>:college?<>
   <div className="space-y-2">
     <h2 className="m-0 break-words text-lg font-semibold leading-7 text-[var(--lms-heading)]">Get this college ready to go live</h2>
     <Badge tone="info">Working on: {college.name}</Badge>
     <p className="max-w-3xl text-sm text-body">Set this college's web address, sign-in method and branding. Platform domains, OTP and SMS delivery are managed under <Link href="/admin/settings" className="font-semibold text-link underline">Tenant Settings</Link>.</p>
   </div>
   {readinessFailed?<Banner tone="error" action={retry}>
    College readiness could not be loaded. Launch is not verified; retry this readiness check before proceeding.
   </Banner>:
   <Banner tone={summary.label==="Persisted checks pass"?"success":summary.label==="Not ready"?"error":"warning"}>
    Persisted readiness: {summary.label}. {summary.detail}
   </Banner>}
   <nav aria-label="Jump to launch sections" className="flex flex-wrap gap-3 text-sm">
    <a href="#college-identity" className="font-semibold text-link underline">Identity settings</a>
    <a href="#college-branding" className="font-semibold text-link underline">Branding</a>
    <a href="#college-readiness" className="font-semibold text-link underline">Launch checklist</a>
   </nav>
   <section id="college-identity" aria-label="College identity editors" className="min-w-0 space-y-4">
    <div className="grid min-w-0 items-start gap-6 2xl:grid-cols-2">
     <div className="min-w-0 space-y-3 rounded-[var(--lms-canvas-radius)] border border-border p-4">
      {managed?<ManagedCollegeSubdomain collegeId={college.id} initial={managed}/>:
       <Banner tone={managedFailed?"error":"warning"} action={<Link href={"/admin/colleges/"+encodeURIComponent(college.id)+"/subdomain"} className="font-semibold underline">Open web address settings</Link>}>
        {managedFailed?"Couldn't load the web address. Retry the scoped editor.":"Web address controls require selected-college management permission."}
       </Banner>}
     </div>
     <div className="min-w-0 space-y-3 rounded-[var(--lms-canvas-radius)] border border-border p-4">
      {signin?<CollegeSigninMethodForm collegeId={college.id}
       method={signin.policy.kind==="CONFIGURED"?signin.policy.method:"EMAIL_AND_PHONE"}
       version={signin.version??0}
       ready={signin.policy.kind!=="MIGRATION_PENDING"&&signin.policy.kind!=="INVALID_POLICY"}/>:
       <Banner tone={signinFailed?"error":"warning"} action={<Link href={"/admin/colleges/"+encodeURIComponent(college.id)+"/signin"} className="font-semibold underline">Open sign-in settings</Link>}>
        {signinFailed?"Couldn't load sign-in methods. Retry the scoped editor.":"Sign-in settings require selected-college management permission."}
       </Banner>}
     </div>
    </div>
    <section id="college-branding" aria-label="Look and feel" className="min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-border p-4">
     <h3 className="text-lg font-semibold text-[var(--lms-heading)]">Look and feel</h3>
     {branding?<>
      <CollegeLogoUploader collegeId={college.id} currentUrl={branding.uploadedLogoUrl} canEdit/>
      <CollegeBrandingForm key={college.id} collegeId={college.id} collegeName={branding.collegeName}
       canEdit uploadedLogoUrl={branding.uploadedLogoUrl} initialVersion={branding.version}
       initial={{
        logoUrl:branding.logoUrl,faviconUrl:branding.faviconUrl,
        loginBackgroundUrl:branding.loginBackgroundUrl,
        loginBackgroundUrlMobile:branding.loginBackgroundUrlMobile,
        primaryColor:branding.primaryColor,secondaryColor:branding.secondaryColor,
        supportEmail:branding.supportEmail,supportPhone:branding.supportPhone,
        termsUrl:branding.termsUrl,privacyUrl:branding.privacyUrl,
       }}/>
     </>:<Banner tone={brandingFailed?"error":"warning"}
      action={<Link href={"/admin/colleges/"+encodeURIComponent(college.id)+"/branding"} className="font-semibold underline">Open branding settings</Link>}>
      {brandingFailed?"Couldn't load branding. Retry the scoped logo and appearance editor.":"Branding controls require selected-college management permission."}
     </Banner>}
    </section>
   </section>
   <LaunchReadinessChecklist collegeId={college.id} collegeName={college.name}
     readiness={readiness?.evaluation??null} loadFailed={readinessFailed}
     logo={brandingFailed?"UNKNOWN":branding?.uploadedLogoUrl||branding?.logoUrl?"PRESENT":"MISSING"} />
   <section aria-label="Launch checklist" className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3">
     <h2 className="m-0 break-words text-lg font-semibold leading-7 text-[var(--lms-heading)]">Launch checklist</h2>
     <Link href={"/admin/colleges/"+encodeURIComponent(college.id)+"/readiness"} className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lms-link-text)] underline underline-offset-4 hover:text-[var(--lms-primary-text)] md:min-h-9 active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Inspect persisted readiness →</Link>
    </div>
    <ol className="grid min-w-0 gap-x-6 gap-y-2 2xl:grid-cols-2">
     {superAdminTenantSetupSteps(college.id).map((step,index)=><li key={step.id} className="min-w-0 border-b border-border py-4">
      <p className="text-xs font-semibold text-muted-foreground">Step {index+1}</p>
      <h3 className="mt-1 break-words font-semibold text-[var(--lms-heading)] text-[var(--lms-font-md)] leading-[24px] min-[768px]:text-[var(--lms-font-lg)] min-[768px]:leading-[26px]">{step.title}</h3>
      <p className="mt-2 text-sm text-body">{step.description}</p>
      <Link href={step.href} className="mt-3 inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Open workspace →</Link>
     </li>)}
    </ol>
   </section>
   <p className="text-xs text-muted-foreground">Passing persisted checks does not certify live DNS, OTP delivery, teaching, attendance, placements or production launch.</p>
  </>:detailFailed?<ErrorState title="Tenant setup unavailable" description="The selected college could not be verified. No launch edits have been made." action={retry}/>:<EmptyState title="Pick a college first"
   description="Choose a college in the header to see what needs to be set up before launch. No other college will be selected automatically."
   action={<Link href={tabLink("STRUCTURE")} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto">Create or select a college →</Link>}/>}
 </div>;
}
