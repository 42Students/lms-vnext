import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {rescreenCollegeApplication} from "@/modules/placements/college-application-detail-service";
export const runtime="nodejs";
type Ctx={params:Promise<{jobId:string;applicationId:string}>};
export async function POST(req:Request,{params}:Ctx){
 if(!isSameOriginRequest(req))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {jobId,applicationId}=await params;
  const result=await rescreenCollegeApplication(await getCurrentRequestContext(),
   jobId,applicationId,await req.json());
  // The retired legacy automated scoring integration must not be implied
  // by a successful rules/evidence re-screen. Consumers can distinguish a
  // live deterministic eligibility check from unavailable provider scoring.
  return NextResponse.json({
   ...result,screeningProvider:"PERSISTED_ELIGIBILITY_RULES",
   automatedScoringAvailable:false,
   automatedScoringUnavailableReason:"AUTOMATED_SCORING_MODULE_DISABLED",
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
