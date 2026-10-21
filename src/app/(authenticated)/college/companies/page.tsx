import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { FilterBar } from "@/components/ui/filter-bar";
import { StatTile } from "@/components/ui/stat-tile";
import { Pagination } from "@/components/ui/pagination";
import { Checkbox } from "@/components/ui/checkbox";
import { redirect } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole, isSuperAdmin } from "@/modules/identity/context";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { ErrorState } from "@/components/ui/error-state";
import { PlacementEmployerRelationships } from "@/components/placements/placement-employer-relationships";
import { CollegeCompanyCreate } from "@/components/placements/college-company-create";
import {
  listPlacementRelationshipOwners,
} from "@/modules/placements/company-service";
import { listCollegeCompanyDirectory } from "@/modules/placements/college-company-directory-service";
import { parseCollegeCompaniesQuery, collegeCompaniesHref } from "@/modules/placements/college-company-directory-model";

/** College-only employer relationships. Never render the Super Admin directory. */
export default async function CollegeCompaniesPage({
  searchParams,
}: {searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const context = await getCurrentRequestContext();
  const collegeId = context.membership && hasMembershipRole(context,"COLLEGE_ADMIN")
    ? context.membership.collegeId
    : isSuperAdmin(context) ? context.adminScope?.collegeId : null;
  if (!collegeId) return <div className="min-w-0 space-y-4">
    <PageHeader title="Companies"/>
    <Alert tone="warning" title="Admin not assigned to a college">
      You must be assigned to a college to manage companies. Contact your administrator.
    </Alert>
  </div>;
  if (!hasMembershipRole(context,"COLLEGE_ADMIN") && !isSuperAdmin(context))
    redirect("/dashboard");
  const parsed=parseCollegeCompaniesQuery(await searchParams);
  if(!parsed.success) return <div className="min-w-0 space-y-4"><PageHeader title="Companies"/>
    <ErrorState title="Invalid company search" description="Check search text or page."
      action={<Link href="/college/companies" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Clear company filters</Link>}/>
  </div>;
  const query=parsed.data;
  // A failed company read must never look like an empty company directory.
  // Counts are independently scoped to this college, not platform-wide.
  const [dataResult,ownersResult,activeResult,deletedResult,allActiveResult]=await Promise.allSettled([
    listCollegeCompanyDirectory(context,query),
    listPlacementRelationshipOwners(context,collegeId),
    listCollegeCompanyDirectory(context,{q:"",page:1,pageSize:10,status:"ACTIVE",showDeleted:"0",sort:"LAST_ACTIVE"}),
    listCollegeCompanyDirectory(context,{q:"",page:1,pageSize:10,status:"ARCHIVED",showDeleted:"1",sort:"LAST_ACTIVE"}),
    listCollegeCompanyDirectory(context,{q:"",page:1,pageSize:10,status:"ACTIVE",showDeleted:"0",sort:"LAST_ACTIVE"},{exportAll:true}),
  ]);
  if(dataResult.status==="rejected"||ownersResult.status==="rejected")
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Companies"/>
      <ErrorState title="Failed to load companies"
        description="Couldn't refresh companies. Check your connection and retry."
        action={<Link href={collegeCompaniesHref(query)}
          className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Retry</Link>}/>
    </div>;
  const data=dataResult.value,owners=ownersResult.value;
  const activeCount=activeResult.status==="fulfilled"?activeResult.value.total:null;
  const deletedCount=deletedResult.status==="fulfilled"?deletedResult.value.total:null;
  const withDrives=allActiveResult.status==="fulfilled"
    ?allActiveResult.value.truncated?"2,000+":allActiveResult.value.items.filter(item=>item.drives>0).length
    :null;
  if(query.page>data.totalPages) {
    redirect(collegeCompaniesHref({...query,page:data.totalPages}));
  }

  const exportParams=new URLSearchParams({q:query.q,status:query.status,pageSize:String(query.pageSize),sort:query.sort,showDeleted:query.showDeleted});
  return <div className="min-w-0 max-w-full space-y-[var(--lms-space-4)]">
    <nav aria-label="Placements sections" className="flex min-w-0 flex-wrap gap-5 border-b border-border text-sm font-semibold">
      <Link href="/college/placements" className="inline-flex min-h-11 items-center border-b-2 border-transparent text-body hover:text-primary-text">Placements</Link>
      <Link href="/college/companies" aria-current="page" className="inline-flex min-h-11 items-center border-b-2 border-[var(--lms-primary)] text-primary-text">Companies</Link>
      <Link href="/college/placements/analytics" className="inline-flex min-h-11 items-center border-b-2 border-transparent text-body hover:text-primary-text">Analytics</Link>
    </nav>
    <PageHeader title="Companies" description="Maintain each recruiting company once and reuse it across drives. Deleted records stay recoverable without cluttering the default working list."
      actions={data.total>0?<a href={"/api/college/companies/export?"+exportParams.toString()}
        className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:text-[var(--lms-primary-text)]">Export CSV</a>
        :<Button type="button" disabled variant="secondary">Export CSV</Button>} />
    <section aria-label="Company overview" className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile label="Companies" value={activeCount??"Unavailable"}/>
      <StatTile label="Deleted" value={deletedCount??"Unavailable"}/>
      <StatTile label="Visible now" value={data.total}
        detail={query.q||query.showDeleted==="1"?"After search and filters":"Current working list"}/>
      <StatTile label="With drives" value={withDrives??"Unavailable"}/>
    </section>
    <CollegeCompanyCreate collegeId={collegeId}/>
    <FilterBar title="Filters" activeCount={Number(Boolean(query.q)) + Number(query.status !== "ACTIVE") + Number(query.sort !== "LAST_ACTIVE") + Number(query.pageSize !== 10) + Number(query.showDeleted === "1")}
      search={<label className="grid min-w-0 gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
        Company
        <Input name="q" type="search" form="college-company-filters" maxLength={100}
          placeholder="Search by name or industry" defaultValue={query.q} className="min-h-11 w-full min-w-0 md:min-h-9 md:w-[260px]" />
        {query.q?<Link href={collegeCompaniesHref({...query,q:"",page:1})}
          className="text-xs font-semibold text-link underline">Clear search</Link>:null}
      </label>}
      action={<Button variant="primary" type="submit" form="college-company-filters" className="min-h-11 md:min-h-9">Filter</Button>}>
      <form id="college-company-filters" method="get" className="grid min-w-0 gap-[8px] md:grid-cols-2 xl:grid-cols-4" aria-label="Filter companies">
        <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Status
          <Select name="status" defaultValue={query.status}>
            <option value="ACTIVE">Active companies</option><option value="ARCHIVED">Archived companies</option>
          </Select>
        </label>
        <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Sort
          <Select name="sort" defaultValue={query.sort}>
            <option value="LAST_ACTIVE">Last active</option><option value="COMPANY">Company</option><option value="DRIVES">Drive count</option>
          </Select>
        </label>
        <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Rows per page
          <Select name="pageSize" defaultValue={query.pageSize}>
            {[10,20,50,100].map(size=><option key={size} value={size}>{size}</option>)}
          </Select>
        </label>
        <label className="flex min-h-11 min-w-0 items-center gap-[var(--lms-space-2)] text-sm text-body">
          <Checkbox name="showDeleted" value="1" defaultChecked={query.showDeleted==="1"}/>Show deleted
        </label>
        <Button variant="primary" type="submit" className="min-h-11 w-full md:hidden">Filter</Button>
      </form>
    </FilterBar>
    <nav aria-label="Sort companies" className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <span>Sort by:</span>
      {([["LAST_ACTIVE","Last active"],["COMPANY","Company"],["DRIVES","Drives"]] as const).map(([value,label])=>
        <Link key={value} href={collegeCompaniesHref({...query,sort:value,page:1})}
          aria-current={query.sort===value?"true":undefined}
          className={"inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border px-3 font-semibold hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-[var(--lms-primary-text)] "+
            (query.sort===value?"border-[var(--lms-primary)] bg-primary-subtle text-primary-text":"border-border text-body")}>
          {label}{query.sort===value?" ↓":""}
        </Link>)}
      <Link href={collegeCompaniesHref(query)} className="ml-auto inline-flex min-h-9 items-center font-semibold text-link underline">
        Refresh companies
      </Link>
    </nav>
    <p role="status" className="text-sm leading-[22px] text-[var(--lms-muted-text)]">Showing {data.items.length} of {data.total} companies {query.showDeleted==="1"?"(including deleted)":""}, searching name &amp; industry only.</p>
    <PlacementEmployerRelationships key={[query.q,query.status,query.page,query.pageSize,query.sort,query.showDeleted].join(":")}
      relationships={data.items.map(item => ({
        relationshipId: item.relationshipId,
        companyId: item.companyId,
        name: item.name,
        websiteUrl: item.websiteUrl,
        primaryDomain: item.primaryDomain,
        verifiedAt:item.verifiedAt,
        companyStatus:item.companyStatus,
        relationshipStatus:item.relationshipStatus,
        industry:item.industry,
        contactName:item.contactName,
        contactEmail:item.contactEmail,
        drives:item.drives,
        lastActive:item.lastActive,
        isTrusted: item.isTrusted,
        ownerMembershipId: item.ownerMembershipId,
      }))}
      owners={owners}
    />
    <Pagination label="Company pages" page={query.page} pageCount={data.totalPages}
      hrefForPage={page=>collegeCompaniesHref({...query,page})}/>
  </div>;
}
