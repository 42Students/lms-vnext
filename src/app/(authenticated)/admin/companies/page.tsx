import {Button} from "@/components/ui/button";
import {DataTable,type DataTableColumn} from "@/components/ui/data-table";
import {Banner} from "@/components/ui/banner";
import type {AdminCompanyRow} from "@/modules/placements/admin-company-directory-model";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import {redirect} from "next/navigation";
import { SuperAdminCompanyMerge } from "@/components/admin/super-admin-company-merge";
import {SuperAdminCollegeCompanyCreate,SuperAdminCollegeCompanyRelationshipActions}
  from "@/components/admin/super-admin-college-company-actions";
import { getCurrentRequestContext } from "@/auth/request-context";
import {SuperAdminCollegeCompanyEdit} from "@/components/admin/super-admin-college-company-edit";
import {SuperAdminGlobalCompanyCatalogue,SuperAdminCompanyAvatar,safeCompanyWebsite} from "@/components/admin/super-admin-global-company-catalogue";
import {SuperAdminCompanySearch} from "@/components/admin/super-admin-company-search";
import { PageHeader } from "@/components/ui/page-header";
import { Disclosure } from "@/components/ui/disclosure";
import { Tabs } from "@/components/ui/tabs";
import { Alert } from "@/components/ui/alert";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { parseAdminCompanyDirectoryParams } from "@/modules/placements/admin-company-directory-model";
import { listSuperAdminCompanyDirectory } from "@/modules/placements/admin-company-directory-service";
import { findPossibleCompanyDuplicates } from "@/modules/placements/company-curation-candidates-model";
import {listColleges} from "@/modules/colleges/service";
import {findCompanyNameIdentityConflicts} from "@/modules/placements/company-curation-name-conflicts";
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";
import { Label } from "@/components/ui/label";
import { ButtonLink } from "@/components/ui/button-link";
import { formatNumberIN } from "@/lib/safe-format";
import { createDateFormatter } from "@/lib/format-date";

export default async function SuperAdminCompaniesPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const parsed = parseAdminCompanyDirectoryParams(params);
  if (!parsed.success) return <div className="min-w-0 space-y-4">
    <PageHeader title="Companies" />
    <ErrorState title="Invalid company search" description="Check search text or relationship status."
      action={<TextLink href="/admin/companies" className="inline-flex min-h-11 items-center md:min-h-9 w-full md:w-auto justify-center rounded-[var(--lms-control-radius)] px-4">Clear filters</TextLink>} />
  </div>;
  const context=await getCurrentRequestContext();
  const view=params["view"]==="GLOBAL"?"GLOBAL":context.adminScope?.collegeId?"COLLEGE":"GLOBAL";
  const scoped=Boolean(context.adminScope?.collegeId||context.adminScope?.organizationId);
  if(view==="GLOBAL"&&scoped)return <div className="min-w-0 space-y-5">
   <PageHeader title="Companies" description="Global company catalogue"/>
   <Tabs ariaLabel="Company directory tabs" renderPanel={false} value="GLOBAL"
    items={[{value:"GLOBAL",label:"42's curated company list",href:"/admin/companies?view=GLOBAL"},
     ...(context.adminScope?.collegeId?[{value:"COLLEGE",label:"This college's companies",href:"/admin/companies?view=COLLEGE"}]:[])]}/>
   <Banner tone="warning" role="alert">
    Clear the selected organization and college scope in the Super Admin header before opening the platform-wide company catalogue. This Global tab never shows a college-only list under a global heading.
   </Banner>
   {context.adminScope?.collegeId?<TextLink href="/admin/companies?view=COLLEGE">
     View this college&apos;s companies</TextLink>:null}
  </div>;
  if(view==="GLOBAL")return <SuperAdminGlobalCompanyCatalogue context={context} filters={parsed.data}/>;
  const [directoryResult,collegesResult]=await Promise.allSettled([
   listSuperAdminCompanyDirectory(context,parsed.data),listColleges(context),
  ]);
  if(directoryResult.status==="rejected"){
   const retryQuery=new URLSearchParams(Object.entries(params).filter((v):v is [string,string]=>typeof v[1]==="string"));
   const retry="/admin/companies"+(retryQuery.size?"?"+retryQuery.toString():"");
   return <div className="min-w-0 space-y-5">
    <PageHeader title="Companies"/>
    <ErrorState title="Couldn't load companies" description="The authorized company directory could not be loaded. Existing filters are preserved, but no stale company rows from another scope are shown."
     action={<TextLink href={retry}>Retry companies</TextLink>}/>
   </div>;
  }
  const data=directoryResult.value;
  if(data.query.page>data.totalPages){
   const corrected=new URLSearchParams(Object.entries(params)
    .filter((entry):entry is [string,string]=>typeof entry[1]==="string"));
   corrected.set("page",String(data.totalPages));
   corrected.set("view","COLLEGE");
   redirect("/admin/companies?"+corrected.toString());
  }
  const availableColleges=collegesResult.status==="fulfilled"?collegesResult.value:[];
  const candidates=findPossibleCompanyDuplicates(data.rows);
  const nameConflicts=findCompanyNameIdentityConflicts(data.rows);
  // Sort is applied by SQL before pagination, never page-locally.
  const collegeRows=data.rows;
  const collegeColumns:DataTableColumn<AdminCompanyRow>[]=[
   {key:"company",header:"Company",mobilePriority:"primary",sortable:true,
    sortDirection:data.query.sort==="NAME"?"ascending":data.query.sort==="NAME_DESC"?"descending":"none",cell:row=><div className={"flex min-w-0 items-start gap-3 "+(row.companyStatus==="ARCHIVED"?"opacity-60":"")}>
     <SuperAdminCompanyAvatar name={row.name} url={row.logoPublicUrl??null}/>
     <div className="min-w-0 space-y-1">
      <p className="font-semibold text-[var(--lms-heading)]">{row.name}</p>
      {safeCompanyWebsite(row.website)?<TextLink href={safeCompanyWebsite(row.website)!}
       className="inline-flex min-h-11 md:min-h-9 items-center break-all text-sm">Visit ↗</TextLink>:null}
      {row.aliases?.length?<p className="break-words text-xs text-muted-foreground">Also known as {row.aliases.join(", ")}</p>:null}
      <p className="break-all text-xs text-muted-foreground">Domains: {row.domains?.length?row.domains.join(", "):"None"}</p>
      <div className="flex flex-wrap gap-2">
       <StatusBadge tone={row.relationshipStatus==="ACTIVE"?"success":"neutral"}>{row.relationshipStatus}</StatusBadge>
       {row.trusted?<StatusBadge tone="success">Trusted</StatusBadge>:null}
       {row.companyStatus==="ARCHIVED"?<StatusBadge tone="neutral">Deleted</StatusBadge>:null}
       {row.verifiedAt?<StatusBadge tone="success">Verified by 42</StatusBadge>:<StatusBadge tone="neutral">Not verified</StatusBadge>}
      </div>
     </div>
    </div>},
   {key:"contact",header:"Contact",mobilePriority:"secondary",cell:row=>
    context.adminScope?.collegeId===row.collegeId
     ? <div className="min-w-0 space-y-1 text-xs">
       <span className="block break-words text-body">{row.contactPersonName?.trim()||"No contact person"}</span>
       {row.contactEmail?<TextLink href={"mailto:"+row.contactEmail}
        className="block break-all">{row.contactEmail}</TextLink>:
        <span className="block text-muted-foreground">No contact email</span>}
      </div>
     : <span className="text-xs text-muted-foreground">Private to the selected college</span>},
   {key:"website",header:"Website",cell:row=>safeCompanyWebsite(row.website)?<TextLink href={safeCompanyWebsite(row.website)!} className="break-all">Visit ↗</TextLink>:"—"},
   {key:"drives",header:"Drives",className:"tabular-nums",sortable:true,
    sortDirection:data.query.sort==="DRIVES"?"descending":data.query.sort==="DRIVES_ASC"?"ascending":"none",cell:row=><span>{row.driveCount??0}</span>},
   {key:"active",header:"Last active",sortable:true,
    sortDirection:data.query.sort==="LAST_ACTIVE"?"descending":data.query.sort==="LAST_ACTIVE_ASC"?"ascending":"none",cell:row=><span>{row.lastActiveAt?
    createDateFormatter("en-IN", {timeZone:"Asia/Kolkata",day:"2-digit",month:"short",year:"numeric"}).format(new Date(row.lastActiveAt)):
    "Never posted"}</span>},

   {key:"actions",header:"Actions",mobilePriority:"action",cell:row=><div className="min-w-0 space-y-2">
     {context.adminScope?.collegeId===row.collegeId&&row.relationshipStatus==="ACTIVE"&&row.companyStatus==="ACTIVE"?<SuperAdminCollegeCompanyEdit relationshipId={row.relationshipId} company={{
       id:row.companyId,name:row.name,website:row.website??null,
       industry:row.industry??null,about:row.about??null,
       logoPublicUrl:row.logoPublicUrl??null,
       updatedAt:row.updatedAt?.toISOString()??null,
      }}/>:null}
     {context.adminScope?.collegeId===row.collegeId?<SuperAdminCollegeCompanyRelationshipActions
      relationshipId={row.relationshipId} name={row.name} trusted={row.trusted}
      status={row.relationshipStatus} driveCount={row.driveCount??0} companyStatus={row.companyStatus}/>:null}
     {context.adminScope?.collegeId===row.collegeId&&row.companyStatus==="ACTIVE"?
      <Disclosure title="Merge" className="min-w-0">
       <SuperAdminCompanyMerge companies={[{id:row.companyId,name:row.name}]}/>
      </Disclosure>:null}
     <TextLink href={"/admin/companies/"+encodeURIComponent(row.companyId)+"/drives"}
     
      className="inline-flex min-h-11 md:min-h-9 items-center">History</TextLink>
     <Disclosure title="Company details" contentClassName="space-y-2 pb-3">
      <p className="text-xs text-body">Added by: {row.addedByType??"—"}</p>
      <p className="break-all text-xs text-body">Domains: {row.domains?.length?row.domains.join(", "):"None"}</p>
      <p className="text-xs text-body">Other names: {row.aliases?.length?row.aliases.join(", "):"None"}</p>
      {row.industry?<p className="text-xs text-body">Industry: {row.industry}</p>:null}
      {row.about?<p className="text-xs text-body">{row.about}</p>:null}
      <p className="text-xs text-body">Linked colleges: {row.companyCollegeCount??0}</p>
      <TextLink href={"/admin/companies?"+new URLSearchParams({companyId:row.companyId,status:"ALL",companyStatus:"ALL",trust:"ALL",view:"COLLEGE"}).toString()}
       className="inline-flex min-h-11 md:min-h-9 items-center">Review relationships</TextLink>
     </Disclosure>
    </div>},
  ];
  return <div className="min-w-0 space-y-[var(--lms-space-6)]">
    <PageHeader title="Companies"
      description={"College-owned employer relationships. Sensitive CRM contact information is not shown without a scoped need-to-know read."} />
    <Tabs ariaLabel="Company directory tabs" renderPanel={false} value={view}
      items={[
        {value:"GLOBAL",label:"42's company list",href:"/admin/companies?view=GLOBAL"},
        ...(context.adminScope?.collegeId
          ? [{value:"COLLEGE",label:"This college's companies",href:"/admin/companies?view=COLLEGE"}]
          : []),
      ]} />
    {collegesResult.status==="rejected"?<Banner tone="warning" role="alert">
     College dropdown choices could not be loaded. Verified company rows remain visible; retry this directory to restore the dropdown.
    </Banner>:null}
    {data.query.companyId ? <Alert tone="info">
      Inspecting relationships of employer {data.query.companyId.slice(-8)} in the authorized scope.{" "}
      <TextLink href="/admin/companies">Show all employers</TextLink>
    </Alert> : null}
    <div className="flex flex-wrap gap-3 text-sm">
      <ButtonLink variant="secondary" href="/admin/companies?status=ALL&companyStatus=ARCHIVED">Show deleted (archived) companies →</ButtonLink>
      <ButtonLink variant="secondary" href="/admin/companies?status=ACTIVE&companyStatus=ACTIVE">Active companies →</ButtonLink>
    </div>
    {context.adminScope?.collegeId?
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
       <Heading level={2} size="lg" className="text-[var(--lms-heading)]">This college's companies</Heading>
       <SuperAdminCollegeCompanyCreate collegeId={context.adminScope.collegeId}/>
      </div>:null}
    <div className="grid min-w-0 grid-cols-2 border-t border-border md:grid-cols-3">
      {([["Companies in this page", data.distinctCompanies], ["Archived", data.archivedCompaniesOnPage],
        ["Visible now", data.visibleCompaniesOnPage],["With drives",data.relationshipsWithDrivesOnPage],
        ["Relationships", data.relationships],["Trusted relationships", data.trustedRelationships]] as const).map(([label, count]) =>
        <div key={label} className="min-w-0 border-b border-border px-[var(--lms-space-4)] py-[var(--lms-space-3)]">
          <p className="m-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">{label}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{count}</p>
        </div>)}
    </div>
    <p className="text-xs leading-5 text-muted-foreground">Search company names, other names and domains. For industry-specific review, open More filters to narrow the college relationship set. Filter changes reset to the first page.</p>
    <SuperAdminCompanySearch key={"COLLEGE:"+data.query.q+":"+data.query.status+":"+data.query.companyStatus}
      mode="COLLEGE" initialQuery={data.query.q}
      initialDeleted={data.query.status==="ALL"&&data.query.companyStatus==="ALL"}/>
     <form method="get" className="grid min-w-0 items-end gap-[var(--lms-space-3)] border-b border-border pb-[var(--lms-space-4)] md:grid-cols-[minmax(0,1fr)_auto]">
      <Input type="hidden" name="view" value={view} />
      <Label stack>Company
        <Input type="search" name="q" defaultValue={data.query.q} placeholder="Search by name or industry"
          className="min-h-11 md:min-h-9" />
      </Label>
      <Disclosure title="More filters" className="min-w-0 order-last md:col-span-2"
        contentClassName="grid min-w-0 gap-[var(--lms-space-3)] pb-[var(--lms-space-4)] md:grid-cols-2 xl:grid-cols-3">
      <Label stack>Search in
        <Select name="searchField" defaultValue={data.query.searchField} className="min-h-11 md:min-h-9">
          <option value="ALL">Name, other name or domain</option><option value="NAME">Name or other name</option><option value="DOMAIN">Any company domain</option>
        </Select>
      </Label>
      <Label stack>Relationship
        <Select name="status" defaultValue={data.query.status}
          className="min-h-11 md:min-h-9">
          <option value="ACTIVE">Active</option><option value="ARCHIVED">Archived</option><option value="ALL">All</option>
        </Select>
      </Label>
      <Label stack>Company status
        <Select name="companyStatus" defaultValue={data.query.companyStatus} className="min-h-11 md:min-h-9">
          <option value="MATCH">Match relationship filter</option><option value="ACTIVE">Active company</option>
          <option value="ARCHIVED">Archived company</option><option value="ALL">Any company status</option>
        </Select>
      </Label>
      <Label stack>Trust state
        <Select name="trust" defaultValue={data.query.trust} className="min-h-11 md:min-h-9">
          <option value="ALL">All</option><option value="TRUSTED">Trusted</option><option value="UNTRUSTED">Not trusted</option>
        </Select>
      </Label>
      <Label stack>Global verification
        <Select name="verified" defaultValue={data.query.verified}
          className="min-h-11 md:min-h-9">
          <option value="ALL">All companies</option><option value="NOT_VERIFIED">Only not verified</option>
          <option value="VERIFIED">Verified by 42</option>
        </Select>
      </Label>
      <Label stack>College
        <Select name="collegeId" defaultValue={data.query.collegeId ?? ""} className="min-h-11 md:min-h-9">
          <option value="">All permitted colleges</option>
          {availableColleges.map(college=><option key={college.id} value={college.id}>{college.name}</option>)}
        </Select>
      </Label>
      <Label stack>Order
        <Select name="sort" defaultValue={data.query.sort} className="min-h-11 md:min-h-9">
          <option value="LAST_ACTIVE">Last active (newest)</option><option value="NAME">Company name (A–Z)</option><option value="DRIVES">Drives (most)</option><option value="RECENT">Recently changed relationship</option>
        </Select>
      </Label>
      {data.query.companyId ? <Input type="hidden" name="companyId" value={data.query.companyId}/> : null}
      <Label stack>Relationship owner
        <Select name="owner" defaultValue={data.query.owner} className="min-h-11 md:min-h-9">
          <option value="ALL">Any owner assignment</option><option value="ASSIGNED">Owner assigned</option><option value="UNASSIGNED">Needs an owner</option>
        </Select>
      </Label>
      <Label stack>Company website
        <Select name="website" defaultValue={data.query.website} className="min-h-11 md:min-h-9">
          <option value="ALL">Any website state</option><option value="HAS_WEBSITE">Website recorded</option><option value="MISSING_WEBSITE">Website missing</option>
        </Select>
      </Label>
      <Label stack>Relationship changed
        <Select name="changedWithin" defaultValue={data.query.changedWithin} className="min-h-11 md:min-h-9">
          <option value="ALL">Any time</option><option value="7">Past 7 days</option><option value="30">Past 30 days</option><option value="90">Past 90 days</option>
        </Select>
      </Label>
      </Disclosure>
      <Button type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto self-end px-4 md:col-start-2 md:row-start-1">Filter</Button>
    </form>
    <p role="status" className="text-sm text-body">Showing {formatNumberIN(data.rows.length)} of {formatNumberIN(data.total)} college-company relationships · page {data.query.page} of {data.totalPages}.</p>

    {data.total>0?<ButtonLink variant="secondary" href={"/api/admin/companies/export?" + new URLSearchParams({q:data.query.q,status:data.query.status,owner:data.query.owner,website:data.query.website,changedWithin:data.query.changedWithin,companyStatus:data.query.companyStatus,trust:data.query.trust,verified:data.query.verified,sort:data.query.sort,searchField:data.query.searchField,page:String(data.query.page),...(data.query.collegeId?{collegeId:data.query.collegeId}:{}),...(data.query.companyId?{companyId:data.query.companyId}:{})}).toString()}>
      ↓ Export CSV (matching filters; up to 2,000 rows)
    </ButtonLink>:<Button type="button" variant="secondary" disabled>Export CSV</Button>}
    <DataTable caption="This college's companies" columns={collegeColumns} rows={collegeRows}
      sortHref={(key,next)=>{
       const sort=key==="company"?(next==="ascending"?"NAME":"NAME_DESC"):
         key==="drives"?(next==="ascending"?"DRIVES_ASC":"DRIVES"):
         next==="ascending"?"LAST_ACTIVE_ASC":"LAST_ACTIVE";
       return "/admin/companies?"+new URLSearchParams({
        q:data.query.q,status:data.query.status,companyStatus:data.query.companyStatus,
        owner:data.query.owner,website:data.query.website,verified:data.query.verified,
        searchField:data.query.searchField,changedWithin:data.query.changedWithin,
        trust:data.query.trust,view:"COLLEGE",sort,page:"1",
        ...(data.query.collegeId?{collegeId:data.query.collegeId}:{}),
        ...(data.query.companyId?{companyId:data.query.companyId}:{}),
       }).toString();
      }}
      getRowKey={row=>row.relationshipId}
      empty={<EmptyState title={data.query.q?"No matching companies":"No companies yet"}
       description={data.query.q?"No company relationships match your search.":"No companies yet — add one to start reusing it across job postings."}/>}/>
    <p className="text-xs text-muted-foreground">Results contain up to 10 scoped relationships per page. Dates and default page-local ordering use IST; “Never posted” means no drive activity has been recorded.</p>
    {data.truncated ? <p className="text-sm text-muted-foreground">Only 10 matching relationships are shown per page. Review other pages for remaining matches.</p> : null}
    <nav className="flex flex-wrap items-center gap-3 text-sm" aria-label="Company directory pages">
      {data.query.page > 1 ? <ButtonLink variant="secondary" href={"/admin/companies?" + new URLSearchParams({q:data.query.q,status:data.query.status,owner:data.query.owner,website:data.query.website,changedWithin:data.query.changedWithin,searchField:data.query.searchField,companyStatus:data.query.companyStatus,verified:data.query.verified,view,sort:data.query.sort,...(data.query.companyId?{companyId:data.query.companyId}:{}),trust:data.query.trust,page:String(data.query.page-1),...(data.query.collegeId?{collegeId:data.query.collegeId}:{})}).toString()}>Previous</ButtonLink> : null}
      {data.query.page < data.totalPages ? <ButtonLink variant="secondary" href={"/admin/companies?" + new URLSearchParams({q:data.query.q,status:data.query.status,owner:data.query.owner,website:data.query.website,changedWithin:data.query.changedWithin,trust:data.query.trust,searchField:data.query.searchField,companyStatus:data.query.companyStatus,verified:data.query.verified,view,sort:data.query.sort,...(data.query.companyId?{companyId:data.query.companyId}:{}),page:String(data.query.page+1),...(data.query.collegeId?{collegeId:data.query.collegeId}:{})}).toString()}>Next</ButtonLink> : null}
    </nav>
    <Disclosure title="Company curation" className="min-w-0" contentClassName="space-y-[var(--lms-space-4)] pb-[var(--lms-space-4)]">
    <section className="min-w-0 space-y-3 border-b border-border pb-4" aria-label="Company curation candidates">
      <div>
        <Heading level={2} className="text-[var(--lms-heading)] text-[length:var(--lms-font-lg)] leading-[26px] md:text-[length:var(--lms-font-xl)] md:leading-[28px]">Potential duplicate companies</Heading>
        <p className="mt-1 text-sm text-body">Different company identities sharing the same website domain within this authorized result page. These are suggestions, not verified merges.</p>
      </div>
      {candidates.length===0?<EmptyState title="No matching domains" description="No matching domains found in this result page."/>:
       <ul className="grid gap-2 md:grid-cols-2">{candidates.map(group=>
        <li key={group.domain} className="min-w-0 rounded-[var(--lms-control-radius)] border border-border bg-surface p-3">
          <p className="break-all text-sm font-semibold">{group.domain}</p>
          <ul className="mt-2 space-y-1 text-sm text-body">{group.companies.map(company=>
           <li key={company.id} className="break-words">{company.name}</li>)}</ul>
          {context.adminScope?.collegeId ? <SuperAdminCompanyMerge companies={group.companies} /> :
            <p className="text-xs text-muted-foreground">Select one exact college scope to review a merge.</p>}
        </li>)}</ul>}
      {data.truncated?<p className="text-xs text-muted-foreground">Only this 10-row page was checked. Move through pages before concluding there are no duplicate identities.</p>:null}
    </section>
    <section className="min-w-0 space-y-3 border-b border-border pb-4" aria-label="Name identity review">
      <Heading level={2} className="text-[var(--lms-heading)] text-[length:var(--lms-font-lg)] leading-[26px] md:text-[length:var(--lms-font-xl)] md:leading-[28px]">Same-name identities to review</Heading>
      <p className="text-sm text-body">Distinct employer IDs with matching normalized names may be aliases, franchises or unrelated companies. No automatic verification or merge is made.</p>
      {nameConflicts.length===0?<EmptyState title="No duplicate names" description="No distinct IDs share a normalized name in this page."/>:
       <ul className="grid gap-2 md:grid-cols-2">{nameConflicts.map(group=><li key={group.key} className="min-w-0 border-b border-border py-3">
        <Heading level={3} className="break-words text-[var(--lms-heading)] text-[length:var(--lms-font-md)] leading-[24px] md:text-[length:var(--lms-font-lg)] md:leading-[26px]">{group.label}</Heading>
        <p className="mt-2 text-xs text-muted-foreground">{group.companyIds.length} distinct identities · manual verification required</p>
       </li>)}</ul>}
      {data.truncated?<p className="text-xs text-muted-foreground">Only this page of scoped relationships was reviewed.</p>:null}
    </section>
    </Disclosure>

    <TextLink href="/admin/placements" className="inline-flex min-h-11 items-center text-sm">← Placement operations</TextLink>
  </div>;
}
