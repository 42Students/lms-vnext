import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {previewOwnOfferAcceptanceImpact} from "@/modules/placements/offer-service";

import { CACHE } from "@/security/responses";
export const runtime="nodejs";
export const dynamic="force-dynamic";

/** LEARNER-placements-R02: GET is read-only and only returns the learner's own impact. */
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const {offerId}=params;
const result=await previewOwnOfferAcceptanceImpact(__ctx,offerId);
return NextResponse.json(result,{headers:{"Cache-Control":CACHE.PRIVATE_STRICT,"Vary":"Cookie"}});
} catch(error){
  const response=apiErrorResponse(error);
  response.headers.set("Cache-Control","private, no-store, max-age=0");
  return response;
 }
  },
);
