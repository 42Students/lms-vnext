import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {updateProjectWorkspaceBrief} from "@/modules/projects/workspace-brief-service";
export const runtime="nodejs";
export async function PATCH(request:Request,{params}:{params:Promise<{projectId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {projectId}=await params;
  return NextResponse.json(await updateProjectWorkspaceBrief(await getCurrentRequestContext(),
    projectId,await request.json()));
 }catch(error){return apiErrorResponse(error);}
}
