import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {isSameOriginRequest} from "@/auth/origin";
import {updateMentorProjectOverview} from "@/modules/projects/mentor-overview-edit-service";
export const runtime="nodejs";
export async function PATCH(request:Request,{params}:{params:Promise<{projectId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {projectId}=await params;
  const updated=await updateMentorProjectOverview(await getCurrentRequestContext(),projectId,await request.json());
  return NextResponse.json({project:updated},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
