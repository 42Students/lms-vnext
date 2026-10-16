import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {moveOwnLearnerProjectTask} from "@/modules/projects/learner-task-status-service";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{projectId:string;taskId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {projectId,taskId}=await params;
  const context=await getCurrentRequestContext();
  const body=await request.json();
  const task=await moveOwnLearnerProjectTask(context,projectId,taskId,body);
  return NextResponse.json({task});
 }catch(error){return apiErrorResponse(error);}
}
