import { route } from "@/security/route";
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
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId,offerId}=params;
    const result=await getTpoOfferLetterAttachment(
   __ctx,jobId,offerId);
    return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId,offerId}=params;
    const raw:unknown=await request.json();
    const result=await attachTpoOfferLetter(
   __ctx,jobId,offerId,raw);
    return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
  },
);
