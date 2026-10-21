import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {appendCollegeApplicationNote,attachCollegeApplicationOfferLetter,getCollegeApplicationDetail}
 from "@/modules/placements/college-application-detail-service";
export const runtime="nodejs";export const dynamic="force-dynamic";
type Params={params:Promise<{jobId:string;applicationId:string}>};
export async function GET(_req:Request,{params}:Params){
 try{const {jobId,applicationId}=await params;
  const detail=await getCollegeApplicationDetail(await getCurrentRequestContext(),jobId,applicationId);
  return NextResponse.json(detail,{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiErrorResponse(e);}
}
export async function POST(req:Request,{params}:Params){
 if(!isSameOriginRequest(req))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{const {jobId,applicationId}=await params;
  return NextResponse.json(await appendCollegeApplicationNote(await getCurrentRequestContext(),
   jobId,applicationId,await req.json()),{status:201,headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiErrorResponse(e);}
}
export async function PATCH(req:Request,{params}:Params){
 if(!isSameOriginRequest(req))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{const {jobId,applicationId}=await params;
  const context=await getCurrentRequestContext();
  const raw:unknown=await req.json();
  let input=raw;
  // The old application-level URL action has no offerId. Resolve only a
  // genuine, unique ACTIVE offer inside this already-authorized application;
  // never invent an offer or attach a letter to an unrelated historic offer.
  if(raw&&typeof raw==="object"&&!Array.isArray(raw)&&
     !("offerId" in raw)&&"url" in raw){
    const detail=await getCollegeApplicationDetail(context,jobId,applicationId);
    const active=detail.offers.filter(offer=>offer.status==="ISSUED"||offer.status==="ACCEPTED");
    if(active.length!==1)return NextResponse.json({
      error:active.length===0?"PLACEMENT_OFFER_NOT_FOUND":"PLACEMENT_OFFER_AMBIGUOUS",
      message:active.length===0?"No current offer is available for this application.":
        "More than one current offer was found. Choose the offer explicitly.",
    },{status:active.length===0?404:409,headers:{"Cache-Control":"private, no-store"}});
    input={...raw,offerId:active[0]!.id};
  }
  return NextResponse.json(await attachCollegeApplicationOfferLetter(
    context,jobId,applicationId,input),{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiErrorResponse(e);}
}
