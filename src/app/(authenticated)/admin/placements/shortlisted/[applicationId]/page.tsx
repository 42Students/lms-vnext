import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {SuperAdminPlacementDetailView} from "@/components/admin/super-admin-placement-detail-view";
import {getSuperAdminShortlistedDetail} from "@/modules/admin-ui/super-admin-shortlisted-detail-service";
export default async function SuperAdminShortlistedDetail({params}:{params:Promise<{applicationId:string}>}){
 const {applicationId}=await params,detail=await getSuperAdminShortlistedDetail(await getCurrentRequestContext(),applicationId);
 if(!detail)notFound();
 return <SuperAdminPlacementDetailView data={detail}/>;
}
