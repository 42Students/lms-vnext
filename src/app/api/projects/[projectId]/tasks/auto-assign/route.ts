import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {autoAssignProjectTasks} from "@/modules/projects/mentor-auto-assign-service";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{projectId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {projectId}=await params;
  return NextResponse.json(await autoAssignProjectTasks(await getCurrentRequestContext(),projectId));
 }catch(e){return apiErrorResponse(e);}
}
