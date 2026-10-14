import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {SuperAdminPlacementDetailView} from "@/components/admin/super-admin-placement-detail-view";
import {getSuperAdminApplicationDetail} from "@/modules/admin-ui/super-admin-application-detail-service";
export default async function SuperAdminApplicationDetail({params}:{params:Promise<{applicationId:string}>}){
 const {applicationId}=await params;
 const detail=await getSuperAdminApplicationDetail(await getCurrentRequestContext(),applicationId);
 if(!detail)notFound();
 return <SuperAdminPlacementDetailView data={detail}/>;
}
