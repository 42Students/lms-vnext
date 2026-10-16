import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {moveMentorBacklogTask} from "@/modules/projects/mentor-backlog-service";
export const runtime="nodejs";
export async function PATCH(request:Request,{params}:{params:Promise<{projectId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {projectId}=await params;
  const result=await moveMentorBacklogTask(await getCurrentRequestContext(),projectId,await request.json());
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
