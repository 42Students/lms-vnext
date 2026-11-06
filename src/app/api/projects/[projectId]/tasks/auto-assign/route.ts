import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {autoAssignProjectTasks} from "@/modules/projects/mentor-auto-assign-service";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
async function handlePOST(request:Request,{params}:{params:Promise<{projectId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {projectId}=await params;
  return NextResponse.json(await autoAssignProjectTasks(await getCurrentRequestContext(),projectId));
 }catch(e){return apiErrorResponse(e);}
}
export const POST = secured(handlePOST, { csrf: "enforce" });
