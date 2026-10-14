import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {SuperAdminPlacementDetailView} from "@/components/admin/super-admin-placement-detail-view";
import {getSuperAdminOfferDetail} from "@/modules/admin-ui/super-admin-offer-detail-service";
export default async function SuperAdminOfferDetail({params}:{params:Promise<{offerId:string}>}){
 const {offerId}=await params,detail=await getSuperAdminOfferDetail(await getCurrentRequestContext(),offerId);
 if(!detail)notFound();
 return <SuperAdminPlacementDetailView data={detail}/>;
}
