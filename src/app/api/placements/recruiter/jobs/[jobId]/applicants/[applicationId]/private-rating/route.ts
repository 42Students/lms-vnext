import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {getOwnRecruiterCandidateRating,saveOwnRecruiterCandidateRating}
 from "@/modules/placements/recruiter-private-rating-service";
export const runtime="nodejs";
type Params={params:Promise<{jobId:string;applicationId:string}>};
export async function GET(_request:Request,{params}:Params){
 try{const {jobId,applicationId}=await params;
  return NextResponse.json(await getOwnRecruiterCandidateRating(await getCurrentRequestContext(),jobId,applicationId),{
   headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export async function PATCH(request:Request,{params}:Params){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {jobId,applicationId}=await params;
  const raw:unknown=await request.json();
  return NextResponse.json(await saveOwnRecruiterCandidateRating(
    await getCurrentRequestContext(),jobId,applicationId,raw),{
    headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
