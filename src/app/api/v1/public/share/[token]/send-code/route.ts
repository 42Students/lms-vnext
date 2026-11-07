import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {legacyShareHeaders,legacyShareInvalid} from "@/modules/placements/company-share/legacy-public-controller";
import { route } from "@/security/route";
export const runtime="nodejs";
async function handlePOST(request:Request){
 if(!isSameOriginRequest(request))return legacyShareInvalid();
 // The legacy mail provider is not connected to the new share code service.
 // Do not claim a code was sent, or expose whether the bearer token exists.
 return NextResponse.json({code:"SHARE_CODE_DELIVERY_UNAVAILABLE",
  message:"Ask the placement cell for the share access code."},
  {status:503,headers:legacyShareHeaders});
}
export const POST = route(
  { auth: "public", publicReason: "Link or form opened without an account (token, slug or anonymous report); the handler validates the token or input and is rate limited per address.", csrf: false, csrfExemptReason: "Links and email clients send no same-origin header; the handler validates the token or applies its own origin check.", rateLimit: { limit: 3000, windowMs: 60_000 } },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);
