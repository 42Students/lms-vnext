import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {pullOwnBacklogTask} from "@/modules/projects/learner-backlog-pull-service";
export const runtime="nodejs";
export async function PATCH(request:Request,{params}:{params:Promise<{projectId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {projectId}=await params;
  const task=await pullOwnBacklogTask(await getCurrentRequestContext(),projectId,await request.json());
  return NextResponse.json({task});
 }catch(error){return apiErrorResponse(error);}
}
