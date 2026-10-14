import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {SuperAdminPlacementDetailView} from "@/components/admin/super-admin-placement-detail-view";
import {getSuperAdminJobSettingsDetail} from "@/modules/admin-ui/super-admin-job-settings-detail-service";
export default async function SuperAdminJobSettingsDetail({params}:{params:Promise<{jobId:string}>}){
 const {jobId}=await params,detail=await getSuperAdminJobSettingsDetail(await getCurrentRequestContext(),jobId);
 if(!detail)notFound();
 return <SuperAdminPlacementDetailView data={detail}/>;
}
