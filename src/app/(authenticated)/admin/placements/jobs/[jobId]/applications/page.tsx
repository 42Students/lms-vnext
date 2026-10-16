import { AdminScopedReadPage } from "@/components/admin/admin-scoped-read-page";
import { getCurrentRequestContext } from "@/auth/request-context";
import { listAdminPlacementApplications } from "@/modules/admin-ui/super-admin-placement-applications-service";
export default async function DriveApplicationsPage({params,searchParams}:{
 params:Promise<{jobId:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const {jobId}=await params;
 const context=await getCurrentRequestContext();
 const path="/admin/placements/jobs/"+encodeURIComponent(jobId)+"/applications";
 return <AdminScopedReadPage title="Applications" path={path}
  description="Applications belonging only to this drive in the selected college."
  statuses={["ALL","SUBMITTED","WITHDRAWN"]}
  searchParams={searchParams} loader={query=>listAdminPlacementApplications(context,{...query,jobId})}/>;
}