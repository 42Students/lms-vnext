import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {finishCollegeInterview,CollegeInterviewLifecycleError}
 from "@/modules/placements/college-interview-lifecycle-service";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
async function handlePOST(request:Request,{params}:{params:Promise<{interviewId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {interviewId}=await params;
  const raw=await request.json() as Record<string,unknown>;
  const result=await finishCollegeInterview(await getCurrentRequestContext(),{
   id:interviewId,status:raw["status"],expectedVersion:raw["expectedVersion"],
   reason:raw["reason"],
  });
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof CollegeInterviewLifecycleError)
   return NextResponse.json({error:error.code},{status:error.code==="INTERVIEW_STORAGE_PENDING"?503:409});
  return apiErrorResponse(error);
 }
}
export const POST = secured(handlePOST, { csrf: "enforce" });
