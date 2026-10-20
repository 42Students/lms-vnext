import {getCurrentRequestContext} from "@/auth/request-context";
import {AdminScopedReadPage} from "@/components/admin/admin-scoped-read-page";
import {listSuperAdminJoining} from "@/modules/admin-ui/super-admin-placement-joining-service";
const statuses=["ALL","PENDING","JOINED","DID_NOT_JOIN","DEFERRED"] as const;
export default async function SuperAdminJoiningPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const context=await getCurrentRequestContext();
 return <AdminScopedReadPage backHref="/admin/placements" title="Joining Outcomes" path="/admin/placements/joining"
  description="Persisted joining outcomes for offers in the selected college. An unrecorded outcome is not assumed to be PENDING. Internal reasons are not projected."
  statuses={statuses} searchParams={searchParams} loader={q=>listSuperAdminJoining(context,q)}/>;
}
