import {getCurrentRequestContext} from "@/auth/request-context";
import {AdminScopedReadPage} from "@/components/admin/admin-scoped-read-page";
import {listSuperAdminInterviews} from "@/modules/admin-ui/super-admin-placement-interviews-service";
const statuses=["ALL","PENDING","SCHEDULED","COMPLETED","CANCELLED"] as const;
export default async function SuperAdminInterviewsPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const context=await getCurrentRequestContext();
 return <AdminScopedReadPage backHref="/admin/placements" title="Placement Interviews / Rounds" path="/admin/placements/interviews"
  description="Selected-college persisted rounds; scheduled times shown in IST. Private meeting links, venue and candidate comments are not projected."
  statuses={statuses} searchParams={searchParams} loader={q=>listSuperAdminInterviews(context,q)}/>;
}
