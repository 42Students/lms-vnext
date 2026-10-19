import { Select } from "@/components/ui/select";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { ErrorState } from "@/components/ui/error-state";
import { PlacementEmployerRelationships } from "@/components/placements/placement-employer-relationships";
import {CollegeCompanyCreate} from "@/components/placements/college-company-create";
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
  if (!context.membership || !hasMembershipRole(context, "COLLEGE_ADMIN")) {
    redirect("/dashboard");
  }
  const parsed=parseCollegeCompaniesQuery(await searchParams);
  if(!parsed.success) return <ErrorState title="Invalid company search"
    description="Check search text or page." />;
  const query=parsed.data;
  const collegeId=context.membership.collegeId;
  const [data,owners]=await Promise.all([
    listCollegeCompanyDirectory(context,query),
    listPlacementRelationshipOwners(context,collegeId),
  ]);
  if(query.page>data.totalPages) {
    redirect(collegeCompaniesHref({...query,page:data.totalPages}));
  }

  const exportParams=new URLSearchParams({q:query.q,status:query.status,pageSize:String(query.pageSize),sort:query.sort,showDeleted:query.showDeleted});
  return <div className="min-w-0 overflow-x-clip space-y-6">
    <PageHeader eyebrow="Placements" title="Companies" description="Maintain each recruiting company once and reuse it across drives." />
    <CollegeCompanyCreate collegeId={collegeId}/>
    <a href={"/api/college/companies/export?"+exportParams.toString()} className="font-semibold text-link underline">Export CSV</a>
    <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-border p-4">
      <label className="grid min-w-0 flex-1 gap-1 text-sm">Company
        <input name="q" type="search" maxLength={100} defaultValue={query.q}
          className="min-h-11 rounded-[var(--lms-control-radius)] border border-border px-3 text-base sm:text-sm" />
      </label>
      <label className="grid gap-1 text-sm">Status
        <Select name="status" defaultValue={query.status} className="min-h-11 rounded-[var(--lms-control-radius)] border border-border px-3 text-base sm:text-sm">
          <option value="ACTIVE">Active companies</option><option value="ARCHIVED">Archived companies</option>
        </Select>
      </label>
      <label className="grid gap-1 text-sm">Sort
        <Select name="sort" defaultValue={query.sort} className="min-h-11 rounded-[var(--lms-control-radius)] border border-border px-3 text-base sm:text-sm">
          <option value="LAST_ACTIVE">Last active</option><option value="COMPANY">Company</option><option value="DRIVES">Drive count</option>
        </Select>
      </label>
      <label className="grid gap-1 text-sm">Rows
        <Select name="pageSize" defaultValue={query.pageSize} className="min-h-11 rounded-[var(--lms-control-radius)] border border-border px-3 text-base sm:text-sm">
          {[10,20,50,100].map(size=><option key={size} value={size}>{size}</option>)}
        </Select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input name="showDeleted" type="checkbox" value="1" defaultChecked={query.showDeleted==="1"}/>Show deleted
      </label>
      <button type="submit" className="min-h-11 rounded-[var(--lms-control-radius)] bg-primary px-4 font-semibold text-on-primary">Filter</button>
    </form>
    <p role="status" className="text-sm text-body">Showing {data.items.length} of {data.total} companies {query.showDeleted==="1"?"(including deleted)":""}, searching name &amp; industry only.</p>
    <PlacementEmployerRelationships key={[query.q,query.page,query.pageSize,query.sort,query.showDeleted].join(":")}
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
        drives:item.drives,
        lastActive:item.lastActive,
        isTrusted: item.isTrusted,
        ownerMembershipId: item.ownerMembershipId,
      }))}
      owners={owners}
    />
    <nav aria-label="Company pages" className="flex flex-wrap items-center gap-4 text-sm">
      <span>Page {query.page} of {data.totalPages}</span>
      {query.page>1?<Link href={collegeCompaniesHref({...query,page:query.page-1})}>Previous</Link>:null}
      {query.page<data.totalPages?<Link href={collegeCompaniesHref({...query,page:query.page+1})}>Next</Link>:null}
    </nav>
  </div>;
}
