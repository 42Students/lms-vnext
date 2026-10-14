import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {SuperAdminPlacementDetailView} from "@/components/admin/super-admin-placement-detail-view";
import {getSuperAdminJoiningDetail} from "@/modules/admin-ui/super-admin-joining-detail-service";
export default async function SuperAdminJoiningDetail({params}:{params:Promise<{offerId:string}>}){
 const {offerId}=await params,detail=await getSuperAdminJoiningDetail(await getCurrentRequestContext(),offerId);
 if(!detail)notFound();
 return <SuperAdminPlacementDetailView data={detail}/>;
}
