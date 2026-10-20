import {getCurrentRequestContext} from "@/auth/request-context";
import {AdminScopedReadPage} from "@/components/admin/admin-scoped-read-page";
import {listSuperAdminScreeningQueue} from "@/modules/admin-ui/super-admin-placement-screenings-service";
const statuses=["ALL","PENDING","HOLD","REJECTED"] as const;
export default async function SuperAdminScreeningsPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const context=await getCurrentRequestContext();
 return <AdminScopedReadPage backHref="/admin/placements" title="Application Screening Queue" path="/admin/placements/screenings"
  description="Read-only pending, held and rejected screening records from the selected college. Shortlisted outcomes appear in their separate view. Internal notes are private."
  statuses={statuses} searchParams={searchParams} loader={q=>listSuperAdminScreeningQueue(context,q)}/>;
}
