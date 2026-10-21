import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { Banner } from "@/components/ui/banner";
import { EmptyState } from "@/components/ui/empty-state";
import { PageBackLink } from "@/components/ui/page-back-link";
import {AdminScopedReadPage} from "@/components/admin/admin-scoped-read-page";
import {listAdminPlacementApplications} from "@/modules/admin-ui/super-admin-placement-applications-service";
import {getSuperAdminHiringReportFilters} from "@/modules/admin-ui/super-admin-hiring-report-filters-service";
const statuses=["ALL","SUBMITTED","WITHDRAWN"] as const;
export default async function SuperAdminApplicationsPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const context=await getCurrentRequestContext();
 const raw=await searchParams;
 const jobId=typeof raw.jobId==="string"&&
  /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(raw.jobId)
  ?raw.jobId:null;
 const shortlisted=raw.shortlisted==="true";
 if(!context.adminScope?.collegeId)return <div className="min-w-0 space-y-4">
  <PageHeader title="Applications" actions={<PageBackLink href="/admin/placements" label="Placement overview"/>}/>
  <Banner tone="warning" role="alert">
    Organization context required for job application search. Select a college in
    the Super Admin scope switcher; no application records were loaded.
    Legacy organization-wide searches require an authenticated organization scope,
    while this editable directory remains college-scoped.
  </Banner>
  <EmptyState title="Select a college to continue"
    description="A selected-college permission scope is required before viewing learner applications."/>
 </div>;
 const applicationFilters=await getSuperAdminHiringReportFilters(context)
   .then(value=>value).catch(()=>undefined);
 return <div className="min-w-0 space-y-4">
  <nav aria-label="Application views" className="flex min-w-0 flex-wrap items-center gap-4 text-sm">
    <span className="text-muted-foreground">Applications retrieved from live database · selected college</span>
    <Link href="/admin/placements/applications" className="font-semibold text-link underline">Refresh applications</Link>
    {jobId?<Link href={"/admin/placements/jobs/"+encodeURIComponent(jobId)+"/applications"+
       (shortlisted?"?shortlisted=true":"")} className="font-semibold text-link underline">
      Open {shortlisted?"shortlisted":"job"} applications
    </Link>:null}
    {shortlisted&&!jobId?<span role="status" className="text-muted-foreground">
      Shortlisted view requires a selected drive.
    </span>:null}
  </nav>
  <AdminScopedReadPage compactReadLayout backHref="/admin/placements" applicationFilters={applicationFilters} title="Applications" path="/admin/placements/applications" statuses={statuses}
  exportPath="/api/admin/placements/applications/export" exportFilename="super-admin-placement-applications-ist.csv"
  description="Persisted applications by job, academic cohort and hiring stage in the selected college. Open details for an authorized scoped application and hiring-stage history; private contact, resume and screening notes are withheld until a separate permissioned detail contract is available."
  searchParams={searchParams} loader={query=>listAdminPlacementApplications(context,query)}/>
 </div>;
}
