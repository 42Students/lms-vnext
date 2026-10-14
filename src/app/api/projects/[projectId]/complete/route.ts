import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {completeMentorProject} from "@/modules/projects/mentor-closeout-service";
export const runtime="nodejs";
export async function POST(request:Request,{
  params,
}:{params:Promise<{projectId:string}>}){
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const context=await getCurrentRequestContext();
    const {projectId}=await params;
    const updated=await completeMentorProject(context,{projectId},await request.json());
    return NextResponse.json({projectId:updated.id,status:updated.status});
  }catch(error){return apiErrorResponse(error);}
}
