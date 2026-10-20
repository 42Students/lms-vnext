import {getCurrentRequestContext} from "@/auth/request-context";
import {AdminScopedReadPage} from "@/components/admin/admin-scoped-read-page";
import {listSuperAdminPlacementSeasons} from "@/modules/admin-ui/super-admin-placement-seasons-service";
const statuses=["ALL","ACTIVE","CLOSED"] as const;
export default async function SuperAdminSeasonsPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const context=await getCurrentRequestContext();
 return <AdminScopedReadPage backHref="/admin/placements" title="Placement Seasons" path="/admin/placements/seasons"
  description="Read-only selected-college placement seasons, registered date ranges and active/closed lifecycle; no implicit global season selection."
  statuses={statuses} searchParams={searchParams} loader={q=>listSuperAdminPlacementSeasons(context,q)}/>;
}
