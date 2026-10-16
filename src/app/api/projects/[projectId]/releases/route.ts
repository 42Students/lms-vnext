import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {writeMentorProjectRelease} from "@/modules/projects/mentor-release-write-service";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{projectId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {projectId}=await params;
  const result=await writeMentorProjectRelease(await getCurrentRequestContext(),projectId,null,"POST",await request.json());
  return NextResponse.json(result,{status:201});
 }catch(error){return apiErrorResponse(error);}
}
