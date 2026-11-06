import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {moveOwnLearnerProjectTask} from "@/modules/projects/learner-task-status-service";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
async function handlePOST(request:Request,{params}:{params:Promise<{projectId:string;taskId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {projectId,taskId}=await params;
  const context=await getCurrentRequestContext();
  const body=await request.json();
  const task=await moveOwnLearnerProjectTask(context,projectId,taskId,body);
  return NextResponse.json({task});
 }catch(error){return apiErrorResponse(error);}
}
export const POST = secured(handlePOST, { csrf: "enforce" });
