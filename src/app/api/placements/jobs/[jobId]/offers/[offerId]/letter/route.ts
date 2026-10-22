import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {
 getTpoOfferLetterAttachment,attachTpoOfferLetter,
} from "@/modules/placements/tpo-offer-lifecycle-service";

export const runtime="nodejs";
type Route={params:Promise<{jobId:string;offerId:string}>};

/** A selected-college TPO-only reference, never a direct storage upload or
 * publicly readable object path. File uploads still use signed storage APIs. */
export async function GET(_request:Request,{params}:Route){
 try{
  const {jobId,offerId}=await params;
  const result=await getTpoOfferLetterAttachment(
   await getCurrentRequestContext(),jobId,offerId);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export async function POST(request:Request,{params}:Route){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {jobId,offerId}=await params;
  const raw:unknown=await request.json();
  const result=await attachTpoOfferLetter(
   await getCurrentRequestContext(),jobId,offerId,raw);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
