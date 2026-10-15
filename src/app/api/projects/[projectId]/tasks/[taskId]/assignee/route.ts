import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {assignProjectTask} from "@/modules/projects/task-assignment-service";
export const runtime="nodejs";
type RouteContext={params:Promise<{projectId:string;taskId:string}>};
export async function PATCH(request:Request,{params}:RouteContext){
  if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const context=await getCurrentRequestContext();const {projectId,taskId}=await params;
    return NextResponse.json({task:await assignProjectTask(context,projectId,taskId,await request.json())});
  }catch(error){return apiErrorResponse(error);}
}
