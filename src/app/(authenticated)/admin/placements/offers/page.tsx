import {getCurrentRequestContext} from "@/auth/request-context";
import {AdminScopedReadPage} from "@/components/admin/admin-scoped-read-page";
import {listSuperAdminOffers} from "@/modules/admin-ui/super-admin-placement-offers-service";
const statuses=["ALL","ISSUED","ACCEPTED","DECLINED","WITHDRAWN"] as const;
export default async function SuperAdminOffersPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const context=await getCurrentRequestContext();
 return <AdminScopedReadPage backHref="/admin/placements" title="Placement Offers" path="/admin/placements/offers"
  description="Read-only offer revisions and lifecycle from the selected college. No offer changes, private evidence files or candidate contact fields."
  statuses={statuses} searchParams={searchParams} loader={q=>listSuperAdminOffers(context,q)}/>;
}
