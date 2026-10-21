import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getLegacyProjectDeliveryHistory} from "@/modules/projects/project-legacy-delivery-history-service";
export const runtime="nodejs";
export async function GET(request:Request,{params}:{
 params:Promise<{projectId:string}>;
}){
 try{
   const {projectId}=await params;
   const raw=new URL(request.url).searchParams.get("limit");
   const limit=raw&&/^[0-9]{1,3}$/.test(raw)?Number(raw):100;
   const data=await getLegacyProjectDeliveryHistory(
     await getCurrentRequestContext(),projectId,limit);
   return NextResponse.json(data,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
