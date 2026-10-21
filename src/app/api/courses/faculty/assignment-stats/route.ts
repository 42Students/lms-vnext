import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {
 getFacultyAssignmentSubmissionStats,
 getFacultyAssignmentSubmissionStatsBulk,
} from "@/modules/courses/faculty-submission-review-service";
export const runtime="nodejs";
/** Single and max-100 bulk legacy stats, now keyed by authorized UUIDs. */
export async function GET(request:Request){
 try{
  const context=await getCurrentRequestContext();
  const url=new URL(request.url);
  const stats=await getFacultyAssignmentSubmissionStats(context,
    url.searchParams.get("deliveryId")??"",url.searchParams.get("assignmentId")??"");
  return NextResponse.json({status:"success",message:"Submission stats retrieved",stats},
    {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  const stats=await getFacultyAssignmentSubmissionStatsBulk(context,await request.json());
  return NextResponse.json({status:"success",message:"Submission stats retrieved",stats},
    {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
