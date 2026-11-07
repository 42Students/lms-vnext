import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {legacyShareBody,legacyShareCode,legacyShareCookie,legacyShareInvalid,
 legacyShareVerify} from "@/modules/placements/company-share/legacy-public-controller";
import { route } from "@/security/route";
export const runtime="nodejs";
async function handlePOST(request:Request,{params}:{params:Promise<{token:string}>}){
 if(!isSameOriginRequest(request))return legacyShareInvalid();
 const {token}=await params,access=await legacyShareVerify(token,
  legacyShareCode(await legacyShareBody(request)));
 if(!access)return legacyShareInvalid();
 // The existing export route performs a second code-bound proof check,
 // restricts resumés to CLEAN scanned private objects and audits the read.
 // 303 converts the legacy POST into that guarded GET without URL credentials.
 const url=new URL("/api/placements/company-share/"+
  encodeURIComponent(token)+"/export?format=zip",request.url);
 return legacyShareCookie(NextResponse.redirect(url,303),access);
}
export const POST = route(
  { auth: "public", publicReason: "Link or form opened without an account (token, slug or anonymous report); the handler validates the token or input and is rate limited per address.", csrf: false, csrfExemptReason: "Links and email clients send no same-origin header; the handler validates the token or applies its own origin check.", rateLimit: { limit: 3000, windowMs: 60_000 } },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);
