import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {restoreProjectInstance} from "@/modules/projects/instance-restore-service";
export const runtime="nodejs";
type RouteContext={params:Promise<{projectId:string}>};
export async function POST(request:Request,{params}:RouteContext){
  if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const context=await getCurrentRequestContext();
    const {projectId}=await params;
    const payload:unknown=await request.json();
    // A historical collegeId must match the selected authorized college.
    if(payload&&typeof payload==="object"&&!Array.isArray(payload)&&
      "collegeId" in payload){
      const claimed=(payload as {collegeId?:unknown}).collegeId;
      if(typeof claimed!=="string"||claimed!==context.adminScope?.collegeId)
        return NextResponse.json({error:"PROJECT_NOT_FOUND"},{status:404});
    }
    const clean=payload&&typeof payload==="object"&&!Array.isArray(payload)?
      Object.fromEntries(Object.entries(payload).filter(([key])=>key!=="collegeId")):payload;
    const project=await restoreProjectInstance(context,projectId,clean);
    return NextResponse.json({project,data:project,status:"OK",message:"Project restored"});
  }catch(error){return apiErrorResponse(error);}
}
