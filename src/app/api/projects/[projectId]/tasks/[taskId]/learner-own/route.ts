import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {deleteLearnerOwnTask} from "@/modules/projects/learner-own-task-service";
export const runtime="nodejs";
export async function DELETE(request:Request,{params}:{
 params:Promise<{projectId:string;taskId:string}>;
}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {projectId,taskId}=await params;
  const result=await deleteLearnerOwnTask(await getCurrentRequestContext(),{projectId},taskId);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
