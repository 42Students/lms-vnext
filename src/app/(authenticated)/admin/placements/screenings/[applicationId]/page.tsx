import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {SuperAdminPlacementDetailView} from "@/components/admin/super-admin-placement-detail-view";
import {getSuperAdminScreeningDetail} from "@/modules/admin-ui/super-admin-screening-detail-service";
export default async function SuperAdminScreeningDetail({params}:{params:Promise<{applicationId:string}>}){
 const {applicationId}=await params,detail=await getSuperAdminScreeningDetail(await getCurrentRequestContext(),applicationId);
 if(!detail)notFound();
 return <SuperAdminPlacementDetailView data={detail}/>;
}
