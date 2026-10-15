import {getCurrentRequestContext} from "@/auth/request-context";
import {AdminScopedReadPage} from "@/components/admin/admin-scoped-read-page";
import {listAdminPlacementApplications} from "@/modules/admin-ui/super-admin-placement-applications-service";
const statuses=["ALL","SUBMITTED","WITHDRAWN"] as const;
export default async function SuperAdminApplicationsPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const context=await getCurrentRequestContext();
 return <AdminScopedReadPage title="Applications" path="/admin/placements/applications" statuses={statuses}
  exportPath="/api/admin/placements/applications/export" exportFilename="super-admin-placement-applications-ist.csv"
  description="Read-only persisted applications by job and applicant in the selected college. No contact, screening notes or invented selection states."
  searchParams={searchParams} loader={query=>listAdminPlacementApplications(context,query)}/>;
}
