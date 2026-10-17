import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {replaceCollegeProjectLearners} from "@/modules/projects/college-project-roster-service";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{projectId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  const {projectId}=await params;
  const result=await replaceCollegeProjectLearners(context,projectId,await request.json());
  return NextResponse.json(result);
 }catch(error){return apiErrorResponse(error);}
}
