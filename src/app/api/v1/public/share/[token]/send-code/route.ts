import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {legacyShareHeaders,legacyShareInvalid} from "@/modules/placements/company-share/legacy-public-controller";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
async function handlePOST(request:Request){
 if(!isSameOriginRequest(request))return legacyShareInvalid();
 // The legacy mail provider is not connected to the new share code service.
 // Do not claim a code was sent, or expose whether the bearer token exists.
 return NextResponse.json({code:"SHARE_CODE_DELIVERY_UNAVAILABLE",
  message:"Ask the placement cell for the share access code."},
  {status:503,headers:legacyShareHeaders});
}
export const POST = secured(handlePOST);
