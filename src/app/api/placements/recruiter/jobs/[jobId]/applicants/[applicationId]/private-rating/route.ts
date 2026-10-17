import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readRecruiterPrivateReview,writeRecruiterPrivateReview,
 RecruiterPrivateReviewConflict} from "@/modules/placements/recruiter-private-rating-service";
export const runtime="nodejs";
const headers={"Cache-Control":"private, no-store"};
type Params={params:Promise<{jobId:string;applicationId:string}>};
export async function GET(_request:Request,{params}:Params){
 try{
  const {jobId,applicationId}=await params;
  const body=await readRecruiterPrivateReview(await getCurrentRequestContext(),jobId,applicationId);
  return NextResponse.json(body,{headers});
 }catch(error){return apiErrorResponse(error);}
}
export async function PATCH(request:Request,{params}:Params){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers});
 try{
  const {jobId,applicationId}=await params;
  const body=await writeRecruiterPrivateReview(await getCurrentRequestContext(),
   jobId,applicationId,await request.json());
  return NextResponse.json(body,{headers});
 }catch(error){
  if(error instanceof RecruiterPrivateReviewConflict)
   return NextResponse.json({error:"CONFLICT"},{status:409,headers});
  return apiErrorResponse(error);
 }
}
