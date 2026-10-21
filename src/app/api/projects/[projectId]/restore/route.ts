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
    const project=await restoreProjectInstance(context,projectId,await request.json());
    return NextResponse.json({project,message:"Project restored"});
  }catch(error){return apiErrorResponse(error);}
}
