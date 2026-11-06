import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {submitCollegeInterviewFeedback} from "@/modules/placements/college-round-slot-action-service";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
type Props={params:Promise<{jobId:string}>};
async function handlePOST(request:Request,{params}:Props){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {jobId}=await params;
  return NextResponse.json(await submitCollegeInterviewFeedback(
   await getCurrentRequestContext(),jobId,await request.json()),
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export const POST = secured(handlePOST, { csrf: "enforce" });
