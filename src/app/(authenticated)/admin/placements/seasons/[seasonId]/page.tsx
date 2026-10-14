import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {SuperAdminPlacementDetailView} from "@/components/admin/super-admin-placement-detail-view";
import {getSuperAdminSeasonDetail} from "@/modules/admin-ui/super-admin-season-detail-service";
export default async function SuperAdminSeasonDetail({params}:{params:Promise<{seasonId:string}>}){
 const {seasonId}=await params,detail=await getSuperAdminSeasonDetail(await getCurrentRequestContext(),seasonId);
 if(!detail)notFound();
 return <SuperAdminPlacementDetailView data={detail}/>;
}
