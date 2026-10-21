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
 if(!context.adminScope?.collegeId)return <div className="min-w-0 space-y-4">
  <PageHeader title="Applications" actions={<PageBackLink href="/admin/placements" label="Placement overview"/>}/>
  <Banner tone="warning" role="alert">
    Organization context required for job application search. Select a college in
    the Super Admin scope switcher; no application records were loaded.
  </Banner>
  <EmptyState title="Select a college to continue"
    description="A selected-college permission scope is required before viewing learner applications."/>
 </div>;
 const applicationFilters=await getSuperAdminHiringReportFilters(context)
   .then(value=>value).catch(()=>undefined);
 return <AdminScopedReadPage compactReadLayout backHref="/admin/placements" applicationFilters={applicationFilters} title="Applications" path="/admin/placements/applications" statuses={statuses}
  exportPath="/api/admin/placements/applications/export" exportFilename="super-admin-placement-applications-ist.csv"
  description="Persisted applications by job, academic cohort and hiring stage in the selected college. Open details for an authorized scoped application and hiring-stage history; private contact, resume and screening notes are withheld until a separate permissioned detail contract is available."
  searchParams={searchParams} loader={query=>listAdminPlacementApplications(context,query)}/>;
}
