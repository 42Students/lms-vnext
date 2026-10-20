import {getCurrentRequestContext} from "@/auth/request-context";
import {AdminScopedReadPage} from "@/components/admin/admin-scoped-read-page";
import {listAdminPlacementApplications} from "@/modules/admin-ui/super-admin-placement-applications-service";
import {getSuperAdminHiringReportFilters} from "@/modules/admin-ui/super-admin-hiring-report-filters-service";
const statuses=["ALL","SUBMITTED","WITHDRAWN"] as const;
export default async function SuperAdminApplicationsPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const context=await getCurrentRequestContext();
 const applicationFilters=context.adminScope?.collegeId?await getSuperAdminHiringReportFilters(context):undefined;
 return <AdminScopedReadPage backHref="/admin/placements" applicationFilters={applicationFilters} title="Applications" path="/admin/placements/applications" statuses={statuses}
  exportPath="/api/admin/placements/applications/export" exportFilename="super-admin-placement-applications-ist.csv"
  description="Persisted applications by job, academic cohort and hiring stage in the selected college. No private contact or screening notes are displayed."
  searchParams={searchParams} loader={query=>listAdminPlacementApplications(context,query)}/>;
}
