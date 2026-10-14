import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {SuperAdminPlacementDetailView} from "@/components/admin/super-admin-placement-detail-view";
import {getSuperAdminInterviewDetail} from "@/modules/admin-ui/super-admin-interview-detail-service";
export default async function SuperAdminInterviewDetail({params}:{params:Promise<{roundId:string}>}){
 const {roundId}=await params, detail=await getSuperAdminInterviewDetail(await getCurrentRequestContext(),roundId);
 if(!detail)notFound();
 return <SuperAdminPlacementDetailView data={detail}/>;
}
