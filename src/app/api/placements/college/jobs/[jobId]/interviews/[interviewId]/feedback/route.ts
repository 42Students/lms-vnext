import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {getCollegeInterviewFeedback,recordCollegeInterviewFeedback} from "@/modules/placements/college-interview-feedback-service";

export const runtime="nodejs";
type Context={params:Promise<{jobId:string;interviewId:string}>};
export async function GET(_request:Request,{params}:Context){
 try{
  const {jobId,interviewId}=await params;
  const data=await getCollegeInterviewFeedback(await getCurrentRequestContext(),jobId,interviewId);
  return NextResponse.json(data,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export async function POST(request:Request,{params}:Context){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {jobId,interviewId}=await params;
  const data=await recordCollegeInterviewFeedback(await getCurrentRequestContext(),
   jobId,interviewId,await request.json());
  return NextResponse.json(data,{status:201,headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
