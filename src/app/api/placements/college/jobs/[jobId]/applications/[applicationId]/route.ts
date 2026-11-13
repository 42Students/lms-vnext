import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {appendCollegeApplicationNote,attachCollegeApplicationOfferLetter,getCollegeApplicationDetail}
 from "@/modules/placements/college-application-detail-service";
import { CACHE, privateJson } from "@/security/responses";
export const runtime="nodejs";export const dynamic="force-dynamic";
type Params={params:Promise<{jobId:string;applicationId:string}>};
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId,applicationId}=params;
    const detail=await getCollegeApplicationDetail(__ctx,jobId,applicationId);
    return privateJson(detail);
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request: req, context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId,applicationId}=params;
    return NextResponse.json(await appendCollegeApplicationNote(__ctx,
   jobId,applicationId,await boundedRequestJson(req)),{status:201,headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request: req, context: __actor, params }) => {
    const context = __actor!;
    const {jobId,applicationId}=params;
    const raw:unknown=await boundedRequestJson(req);
    let input=raw;
    if(raw&&typeof raw==="object"&&!Array.isArray(raw)&&
     !("offerId" in raw)&&"url" in raw){
    const detail=await getCollegeApplicationDetail(context,jobId,applicationId);
    const active=detail.offers.filter(offer=>offer.status==="ISSUED"||offer.status==="ACCEPTED");
    if(active.length!==1)return NextResponse.json({
      error:active.length===0?"PLACEMENT_OFFER_NOT_FOUND":"PLACEMENT_OFFER_AMBIGUOUS",
      message:active.length===0?"No current offer is available for this application.":
        "More than one current offer was found. Choose the offer explicitly.",
    },{status:active.length===0?404:409,headers:{"Cache-Control":CACHE.PRIVATE}});
    input={...raw,offerId:active[0]!.id};
  }
    return NextResponse.json(await attachCollegeApplicationOfferLetter(
    context,jobId,applicationId,input),{headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
