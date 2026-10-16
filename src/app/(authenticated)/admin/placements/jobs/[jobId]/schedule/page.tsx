import { AdminScopedReadPage } from "@/components/admin/admin-scoped-read-page";
import { getCurrentRequestContext } from "@/auth/request-context";
import { listSuperAdminInterviews } from "@/modules/admin-ui/super-admin-placement-interviews-service";
export default async function DriveSchedulePage({params,searchParams}:{
 params:Promise<{jobId:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const {jobId}=await params;
 const context=await getCurrentRequestContext();
 const path="/admin/placements/jobs/"+encodeURIComponent(jobId)+"/schedule";
 return <AdminScopedReadPage title="Schedule" path={path}
  description="This drive's interview rounds only. Private candidate links remain protected."
  statuses={["ALL","PENDING","SCHEDULED","COMPLETED","CANCELLED"]}
  searchParams={searchParams} loader={query=>listSuperAdminInterviews(context,{...query,jobId})}/>;
}