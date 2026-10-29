import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readRecruiterJsonBody,RecruiterJsonBodyError} from "@/modules/placements/recruiter-json-request";
import {placementTableExists} from "@/modules/placements/staged-tables";
import {readRecruiterPrivateReview,writeRecruiterPrivateReview,
 RecruiterPrivateReviewConflict,RecruiterPrivateReviewMigrationPending} from "@/modules/placements/recruiter-private-rating-service";
export const runtime="nodejs";
const headers={"Cache-Control":"private, no-store"};
type Params={params:Promise<{jobId:string;applicationId:string}>};
export async function GET(_request:Request,{params}:Params){
 try{
  const {jobId,applicationId}=await params;
  const context=await getCurrentRequestContext();
  if(!hasActiveRecruiter(context)||context.recruiter?.userId!==context.user.id)
   return NextResponse.json({error:"NOT_FOUND"},{status:404,headers});
  if(!await placementTableExists("placement_recruiter_applicant_notes"))
   return NextResponse.json({error:"SERVICE_UNAVAILABLE"},{status:503,headers});
  const body=await readRecruiterPrivateReview(context,jobId,applicationId);
  return NextResponse.json(body,{headers});
 }catch(error){return apiErrorResponse(error);}
}
export async function PATCH(request:Request,{params}:Params){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers});
 try{
  const {jobId,applicationId}=await params;
  const context=await getCurrentRequestContext();
  if(!hasActiveRecruiter(context)||context.recruiter?.userId!==context.user.id)
   return NextResponse.json({error:"NOT_FOUND"},{status:404,headers});
  if(!await placementTableExists("placement_recruiter_applicant_notes"))
   return NextResponse.json({error:"SERVICE_UNAVAILABLE"},{status:503,headers});
  const body=await writeRecruiterPrivateReview(context,
   jobId,applicationId,await readRecruiterJsonBody(request,16*1024));
  return NextResponse.json(body,{headers});
 }catch(error){
  if(error instanceof RecruiterJsonBodyError)
   return NextResponse.json({error:"INVALID_REQUEST"},
    {status:error.kind==="TOO_LARGE"?413:400,headers});
  if(error instanceof RecruiterPrivateReviewConflict)
   return NextResponse.json({error:"CONFLICT"},{status:409,headers});
  if(error instanceof RecruiterPrivateReviewMigrationPending)
   return NextResponse.json({error:"REVIEW_MIGRATION_PENDING"},{status:503,headers});
  return apiErrorResponse(error);
 }
}
