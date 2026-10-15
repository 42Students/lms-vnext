import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { adminCompaniesQuerySchema } from "@/modules/placements/admin-company-directory-model";
import { listSuperAdminCompanyDirectory } from "@/modules/placements/admin-company-directory-service";
import { findPossibleCompanyDuplicates } from "@/modules/placements/company-curation-candidates-model";
import {listColleges} from "@/modules/colleges/service";
import {findCompanyNameIdentityConflicts} from "@/modules/placements/company-curation-name-conflicts";

export default async function SuperAdminCompaniesPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const parsed = adminCompaniesQuerySchema.safeParse({
    q: params.q, status: params.status, trust: params.trust, page: params.page, collegeId: params.collegeId,
  });
  if (!parsed.success) return <div className="space-y-4">
    <PageHeader eyebrow="Super Admin · Placements" title="Companies" />
    <ErrorState title="Invalid company search" description="Check search text or relationship status."
      action={<Link href="/admin/companies" className="font-semibold text-primary-text">Clear filters</Link>} />
  </div>;
  const context = await getCurrentRequestContext();
  const [data, availableColleges] = await Promise.all([
    listSuperAdminCompanyDirectory(context, parsed.data), listColleges(context),
  ]);
  const candidates = findPossibleCompanyDuplicates(data.rows);
  const nameConflicts=findCompanyNameIdentityConflicts(data.rows);
  return <div className="space-y-5">
    <PageHeader eyebrow="Super Admin · Placements" title="Companies"
      description="Read-only employer relationships within the selected Super Admin organization or college scope. Sensitive CRM contacts and sharing defaults are not displayed." />
    <form className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 xl:grid-cols-[1fr_auto_auto_auto_auto]">
      <label className="grid gap-1 text-sm font-semibold text-body">Company
        <input name="q" defaultValue={data.query.q} placeholder="Search companies"
          className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Relationship
        <select name="status" defaultValue={data.query.status}
          className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
          <option value="ACTIVE">Active</option><option value="ARCHIVED">Archived</option><option value="ALL">All</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Trust state
        <select name="trust" defaultValue={data.query.trust} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
          <option value="ALL">All</option><option value="TRUSTED">Trusted</option><option value="UNTRUSTED">Not trusted</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">College
        <select name="collegeId" defaultValue={data.query.collegeId ?? ""} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
          <option value="">All permitted colleges</option>
          {availableColleges.map(college=><option key={college.id} value={college.id}>{college.name}</option>)}
        </select>
      </label>
      <button type="submit" className="min-h-11 self-end rounded-md bg-primary px-5 text-sm font-semibold text-on-primary">Filter</button>
    </form>
    <p className="text-xs text-muted-foreground">{data.total} matching college-company relationships · page {data.query.page} of {data.totalPages}; statistics and duplicate suggestions below are page-local.</p>
    <div className="grid gap-3 sm:grid-cols-3">
      {([["Companies in this page", data.distinctCompanies], ["Relationships", data.relationships],
        ["Trusted relationships", data.trustedRelationships]] as const).map(([label, count]) =>
        <div key={label} className="rounded-xl border border-border bg-surface p-4">
          <p className="m-0 text-xs text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{count}</p>
        </div>)}
    </div>
    <section className="min-w-0 space-y-3 rounded-xl border border-border bg-surface p-4" aria-label="Company curation candidates">
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
        </li>)}</ul>}
      {data.truncated?<p className="text-xs text-muted-foreground">Only this 50-row page was checked. Move through pages before concluding there are no duplicate identities.</p>:null}
    </section>
    <section className="min-w-0 space-y-3 rounded-xl border border-border bg-surface p-4" aria-label="Name identity review">
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
      {data.rows.map(row => <article key={row.relationshipId} className="min-w-0 rounded-xl border border-border bg-surface p-4">
        <h2 className="m-0 break-words text-base font-semibold text-foreground">{row.name}</h2>
        <p className="mt-1 text-sm text-body">{row.collegeName}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge>{row.companyStatus}</StatusBadge>
          <StatusBadge>{row.relationshipStatus} relationship</StatusBadge>
          {row.trusted ? <StatusBadge tone="success">Trusted</StatusBadge> : null}
        </div>
        {row.website ? <p className="mt-2 break-all text-sm text-body">Website: {row.website}</p> : null}
      </article>)}
    </div> : <p className="rounded-xl border border-border bg-surface p-6 text-sm text-muted-foreground">No company relationships match the current scope and filters.</p>}
    {data.truncated ? <p className="text-sm text-muted-foreground">Only 50 matching relationships are shown per page. Review other pages for remaining matches.</p> : null}
    <nav className="flex flex-wrap items-center gap-3 text-sm" aria-label="Company directory pages">
      {data.query.page > 1 ? <Link className="font-semibold text-primary-text" href={"/admin/companies?" + new URLSearchParams({q:data.query.q,status:data.query.status,trust:data.query.trust,page:String(data.query.page-1),...(data.query.collegeId?{collegeId:data.query.collegeId}:{})}).toString()}>Previous</Link> : null}
      {data.query.page < data.totalPages ? <Link className="font-semibold text-primary-text" href={"/admin/companies?" + new URLSearchParams({q:data.query.q,status:data.query.status,trust:data.query.trust,page:String(data.query.page+1),...(data.query.collegeId?{collegeId:data.query.collegeId}:{})}).toString()}>Next</Link> : null}
    </nav>
    <Link href="/admin/placements" className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text">← Placement operations</Link>
  </div>;
}
