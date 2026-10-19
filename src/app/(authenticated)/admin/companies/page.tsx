import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import Link from "next/link";
import { SuperAdminCompanyMerge } from "@/components/admin/super-admin-company-merge";
import {SuperAdminCompanyRestore} from "@/components/admin/super-admin-company-restore";
import {SuperAdminCompanyVerification} from "@/components/admin/super-admin-company-verification";
import {SuperAdminCompanyEdit} from "@/components/admin/super-admin-company-edit";
import {SuperAdminCompanyIdentities} from "@/components/admin/super-admin-company-identities";
import {SuperAdminCollegeCompanyCreate,SuperAdminCollegeCompanyRelationshipActions}
  from "@/components/admin/super-admin-college-company-actions";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { parseAdminCompanyDirectoryParams } from "@/modules/placements/admin-company-directory-model";
import { listSuperAdminCompanyDirectory } from "@/modules/placements/admin-company-directory-service";
import { findPossibleCompanyDuplicates } from "@/modules/placements/company-curation-candidates-model";
import {listColleges} from "@/modules/colleges/service";
import {findCompanyNameIdentityConflicts} from "@/modules/placements/company-curation-name-conflicts";

export default async function SuperAdminCompaniesPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const parsed = parseAdminCompanyDirectoryParams(params);
  if (!parsed.success) return <div className="min-w-0 space-y-4">
    <PageHeader eyebrow="Super Admin · Placements" title="Companies" />
    <ErrorState title="Invalid company search" description="Check search text or relationship status."
      action={<Link href="/admin/companies" className="font-semibold text-primary-text">Clear filters</Link>} />
  </div>;
  const context = await getCurrentRequestContext();
  const [data, availableColleges] = await Promise.all([
    listSuperAdminCompanyDirectory(context, parsed.data), listColleges(context),
  ]);
  const view=params.view==="GLOBAL"?"GLOBAL":context.adminScope?.collegeId?"COLLEGE":"GLOBAL";
  const candidates = findPossibleCompanyDuplicates(data.rows);
  const nameConflicts=findCompanyNameIdentityConflicts(data.rows);
  return <div className="min-w-0 space-y-5">
    <PageHeader eyebrow="Super Admin · Placements" title="Companies"
      description="Read-only employer relationships within the selected Super Admin organization or college scope. Sensitive CRM contacts and sharing defaults are not displayed." />
    <nav aria-label="Company directory tabs" className="flex flex-wrap gap-3">
      <Link href="/admin/companies?view=GLOBAL"
       aria-current={view==="GLOBAL"?"page":undefined}
       className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle">
       42&apos;s company list
      </Link>
      {context.adminScope?.collegeId?<Link href="/admin/companies?view=COLLEGE"
       aria-current={view==="COLLEGE"?"page":undefined}
       className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle">
       This college&apos;s companies
      </Link>:null}
    </nav>
    {view==="GLOBAL"&&context.adminScope?.collegeId?<p role="status" className="rounded-md border border-warning bg-surface p-3 text-sm text-warning">
      A college is currently selected. The results below remain restricted to that college. Clear the college scope in the header to view 42&apos;s global company catalogue.
    </p>:null}
    {data.query.companyId ? <section role="status" className="rounded-lg border border-border bg-surface p-3 text-sm text-body">
      Inspecting relationships of employer {data.query.companyId.slice(-8)} in the authorized scope.{" "}
      <Link href="/admin/companies" className="font-semibold text-primary-text underline">Show all employers</Link>
    </section> : null}
    <div className="flex flex-wrap gap-3 text-sm">
      <Link href="/admin/companies?status=ALL&companyStatus=ARCHIVED" className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 font-semibold text-primary-text hover:bg-primary-subtle">Show deleted (archived) companies →</Link>
      <Link href="/admin/companies?status=ACTIVE&companyStatus=ACTIVE" className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 font-semibold text-primary-text hover:bg-primary-subtle">Active companies →</Link>
    </div>
    <form method="get" className="grid gap-3 border-b border-border pb-4 sm:grid-cols-2 xl:grid-cols-3">
      <label className="grid gap-1 text-sm font-semibold text-body">Company
        <Input name="q" defaultValue={data.query.q} placeholder="Search company name or domain"
          className="min-h-11 sm:min-h-9" />
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Search in
        <Select name="searchField" defaultValue={data.query.searchField} className="min-h-11 sm:min-h-9">
          <option value="ALL">Name, other name or domain</option><option value="NAME">Name or other name</option><option value="DOMAIN">Any company domain</option>
        </Select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Relationship
        <Select name="status" defaultValue={data.query.status}
          className="min-h-11 sm:min-h-9">
          <option value="ACTIVE">Active</option><option value="ARCHIVED">Archived</option><option value="ALL">All</option>
        </Select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Company status
        <Select name="companyStatus" defaultValue={data.query.companyStatus} className="min-h-11 sm:min-h-9">
          <option value="MATCH">Match relationship filter</option><option value="ACTIVE">Active company</option>
          <option value="ARCHIVED">Archived company</option><option value="ALL">Any company status</option>
        </Select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Trust state
        <Select name="trust" defaultValue={data.query.trust} className="min-h-11 sm:min-h-9">
          <option value="ALL">All</option><option value="TRUSTED">Trusted</option><option value="UNTRUSTED">Not trusted</option>
        </Select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Global verification
        <Select name="verified" defaultValue={data.query.verified}
          className="min-h-11 sm:min-h-9">
          <option value="ALL">All companies</option><option value="NOT_VERIFIED">Only not verified</option>
          <option value="VERIFIED">Verified by 42</option>
        </Select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">College
        <Select name="collegeId" defaultValue={data.query.collegeId ?? ""} className="min-h-11 sm:min-h-9">
          <option value="">All permitted colleges</option>
          {availableColleges.map(college=><option key={college.id} value={college.id}>{college.name}</option>)}
        </Select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Order
        <Select name="sort" defaultValue={data.query.sort} className="min-h-11 sm:min-h-9">
          <option value="NAME">Company name</option><option value="RECENT">Recently changed relationship</option>
        </Select>
      </label>
      {data.query.companyId ? <input type="hidden" name="companyId" value={data.query.companyId}/> : null}
      <label className="grid gap-1 text-sm font-semibold text-body">Relationship owner
        <Select name="owner" defaultValue={data.query.owner} className="min-h-11 sm:min-h-9">
          <option value="ALL">Any owner assignment</option><option value="ASSIGNED">Owner assigned</option><option value="UNASSIGNED">Needs an owner</option>
        </Select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Company website
        <Select name="website" defaultValue={data.query.website} className="min-h-11 sm:min-h-9">
          <option value="ALL">Any website state</option><option value="HAS_WEBSITE">Website recorded</option><option value="MISSING_WEBSITE">Website missing</option>
        </Select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Relationship changed
        <Select name="changedWithin" defaultValue={data.query.changedWithin} className="min-h-11 sm:min-h-9">
          <option value="ALL">Any time</option><option value="7">Past 7 days</option><option value="30">Past 30 days</option><option value="90">Past 90 days</option>
        </Select>
      </label>
      <Button type="submit" className="min-h-11 sm:min-h-9 self-end rounded-[var(--lms-control-radius)] bg-primary px-5 text-sm font-semibold text-on-primary">Filter</Button>
    </form>
    <Link href={"/api/admin/companies/export?" + new URLSearchParams({q:data.query.q,status:data.query.status,owner:data.query.owner,website:data.query.website,changedWithin:data.query.changedWithin,companyStatus:data.query.companyStatus,trust:data.query.trust,verified:data.query.verified,sort:data.query.sort,searchField:data.query.searchField,page:String(data.query.page),...(data.query.collegeId?{collegeId:data.query.collegeId}:{}),...(data.query.companyId?{companyId:data.query.companyId}:{})}).toString()}
      className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle">
      Export matching companies as CSV →
    </Link>
    {context.adminScope?.collegeId?
      <SuperAdminCollegeCompanyCreate collegeId={context.adminScope.collegeId}/>:null}
    <p className="text-xs text-muted-foreground">{data.total} matching college-company relationships · page {data.query.page} of {data.totalPages}; statistics and duplicate suggestions below are page-local.</p>
    <div className="grid gap-3 sm:grid-cols-3">
      {([["Companies in this page", data.distinctCompanies], ["Archived", data.archivedCompaniesOnPage],
        ["Visible now", data.visibleCompaniesOnPage],["With drives",data.relationshipsWithDrivesOnPage],
        ["Relationships", data.relationships],["Trusted relationships", data.trustedRelationships]] as const).map(([label, count]) =>
        <div key={label} className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
          <p className="m-0 text-xs text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{count}</p>
        </div>)}
    </div>
    <section className="min-w-0 space-y-3 border-b border-border pb-4" aria-label="Company curation candidates">
      <div>
        <h2 className="text-base font-semibold text-foreground">Potential duplicate companies</h2>
        <p className="mt-1 text-sm text-body">Different company identities sharing the same website domain within this authorized result page. These are suggestions, not verified merges.</p>
      </div>
      {candidates.length===0?<p className="text-sm text-muted-foreground">No matching domains found in this result page.</p>:
       <ul className="grid gap-2 sm:grid-cols-2">{candidates.map(group=>
        <li key={group.domain} className="min-w-0 rounded-md border border-border p-3">
          <p className="break-all text-sm font-semibold">{group.domain}</p>
          <ul className="mt-2 space-y-1 text-sm text-body">{group.companies.map(company=>
           <li key={company.id} className="break-words">{company.name}</li>)}</ul>
          {context.adminScope?.collegeId ? <SuperAdminCompanyMerge companies={group.companies} /> :
            <p className="text-xs text-muted-foreground">Select one exact college scope to review a merge.</p>}
        </li>)}</ul>}
      {data.truncated?<p className="text-xs text-muted-foreground">Only this 50-row page was checked. Move through pages before concluding there are no duplicate identities.</p>:null}
    </section>
    <section className="min-w-0 space-y-3 border-b border-border pb-4" aria-label="Name identity review">
      <h2 className="text-base font-semibold text-foreground">Same-name identities to review</h2>
      <p className="text-sm text-body">Distinct employer IDs with matching normalized names may be aliases, franchises or unrelated companies. No automatic verification or merge is made.</p>
      {nameConflicts.length===0?<p className="text-sm text-muted-foreground">No distinct IDs share a normalized name in this page.</p>:
       <ul className="grid gap-2 sm:grid-cols-2">{nameConflicts.map(group=><li key={group.key} className="min-w-0 rounded-lg border border-border p-3">
        <h3 className="break-words text-sm font-semibold">{group.label}</h3>
        <p className="mt-2 text-xs text-muted-foreground">{group.companyIds.length} distinct identities · manual verification required</p>
       </li>)}</ul>}
      {data.truncated?<p className="text-xs text-muted-foreground">Only this page of scoped relationships was reviewed.</p>:null}
    </section>
    {data.rows.length ? <div className="grid gap-3 md:grid-cols-2">
      {data.rows.map(row => <article key={row.relationshipId} className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
        <h2 className="m-0 break-words text-base font-semibold text-foreground">{row.name}</h2>
        {row.companyStatus==="ARCHIVED"&&!context.adminScope?.collegeId&&!context.adminScope?.organizationId?
         <SuperAdminCompanyRestore id={row.companyId} name={row.name}/>:null}
        <p className="mt-1 text-sm text-body">{row.collegeName}</p>
        {context.adminScope?.collegeId===row.collegeId?
          <SuperAdminCollegeCompanyRelationshipActions relationshipId={row.relationshipId}
            name={row.name} trusted={row.trusted} status={row.relationshipStatus}
            driveCount={row.driveCount??0} companyStatus={row.companyStatus}/>:null}
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge>{row.companyStatus}</StatusBadge>
          <StatusBadge>{row.relationshipStatus} relationship</StatusBadge>
          {row.trusted ? <StatusBadge tone="success">Trusted</StatusBadge> : null}
          {row.verifiedAt ? <StatusBadge tone="success">Verified by 42</StatusBadge> : null}
        </div>
        {!context.adminScope?.collegeId&&!context.adminScope?.organizationId&&row.companyStatus==="ACTIVE"
          ? <SuperAdminCompanyVerification companyId={row.companyId} name={row.name}
              verified={Boolean(row.verifiedAt)} />:null}
        {row.website ? <p className="mt-2 break-all text-sm text-body">Website: {row.website}</p> : null}
        <p className="mt-1 text-xs text-body">Added by: {row.addedByType??"Not recorded"}</p>
        <p className="mt-1 break-all text-xs text-body">Domains: {row.domains?.length?row.domains.join(", "):"Not registered"}</p>
        <p className="mt-1 text-xs text-body">Other names: {row.aliases?.length?row.aliases.join(", "):"Not registered"}</p>
        {!context.adminScope?.collegeId&&!context.adminScope?.organizationId&&row.companyStatus==="ACTIVE"
          ? <SuperAdminCompanyIdentities companyId={row.companyId} name={row.name}
              domains={row.domains??[]} aliases={row.aliases??[]} />:null}
        {row.industry?<p className="mt-1 text-sm text-body">Industry: {row.industry}</p>:null}
        {row.about?<p className="mt-1 text-sm text-body">{row.about}</p>:null}
        {!context.adminScope?.collegeId&&!context.adminScope?.organizationId&&row.companyStatus==="ACTIVE"
          ? <SuperAdminCompanyEdit company={{id:row.companyId,name:row.name,
              website:row.website,industry:row.industry??null,about:row.about??null,
              logoPublicUrl:row.logoPublicUrl??null,updatedAt:row.updatedAt!.toISOString()}} />:null}
        <dl className="mt-2 grid grid-cols-2 gap-2 text-xs text-body">
          <div><dt className="text-muted-foreground">Domain</dt><dd>{row.primaryDomain??"Not provided"}</dd></div>
          <div><dt className="text-muted-foreground">Linked colleges</dt><dd className="tabular-nums">{row.companyCollegeCount??0}</dd></div>
          <div><dt className="text-muted-foreground">Drives in this college</dt><dd className="tabular-nums">{row.driveCount??0}</dd></div>
          <div><dt className="text-muted-foreground">Last drive activity</dt><dd>{row.lastActiveAt?new Date(row.lastActiveAt).toLocaleDateString("en-IN",{timeZone:"Asia/Kolkata"}):"—"}</dd></div>
        </dl>
        <Link className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline"
          href={`/admin/companies/${encodeURIComponent(row.companyId)}/drives`}>
          Drive history →
        </Link>
        <Link className="mt-2 ml-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline"
          href={"/admin/companies?" + new URLSearchParams({companyId:row.companyId,status:"ALL",companyStatus:"ALL",trust:"ALL"}).toString()}>
          Review this employer&apos;s relationships →
        </Link>
      </article>)}
    </div> : <p className="border-t border-border py-6 text-sm text-muted-foreground">No company relationships match the current scope and filters.</p>}
    {data.truncated ? <p className="text-sm text-muted-foreground">Only 50 matching relationships are shown per page. Review other pages for remaining matches.</p> : null}
    <nav className="flex flex-wrap items-center gap-3 text-sm" aria-label="Company directory pages">
      {data.query.page > 1 ? <Link className="font-semibold text-primary-text" href={"/admin/companies?" + new URLSearchParams({q:data.query.q,status:data.query.status,owner:data.query.owner,website:data.query.website,changedWithin:data.query.changedWithin,searchField:data.query.searchField,companyStatus:data.query.companyStatus,sort:data.query.sort,...(data.query.companyId?{companyId:data.query.companyId}:{}),trust:data.query.trust,page:String(data.query.page-1),...(data.query.collegeId?{collegeId:data.query.collegeId}:{})}).toString()}>Previous</Link> : null}
      {data.query.page < data.totalPages ? <Link className="font-semibold text-primary-text" href={"/admin/companies?" + new URLSearchParams({q:data.query.q,status:data.query.status,owner:data.query.owner,website:data.query.website,changedWithin:data.query.changedWithin,trust:data.query.trust,searchField:data.query.searchField,companyStatus:data.query.companyStatus,sort:data.query.sort,...(data.query.companyId?{companyId:data.query.companyId}:{}),page:String(data.query.page+1),...(data.query.collegeId?{collegeId:data.query.collegeId}:{})}).toString()}>Next</Link> : null}
    </nav>
    <Link href="/admin/placements" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text">← Placement operations</Link>
  </div>;
}
