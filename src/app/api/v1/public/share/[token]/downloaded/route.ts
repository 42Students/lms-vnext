import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {getPublicCompanyApplicantShare} from "@/modules/placements/company-share/public-service";
import {legacyShareBody,legacyShareCode,legacyShareHeaders,
 legacyShareInvalid,legacyShareVerify} from "@/modules/placements/company-share/legacy-public-controller";
import { route } from "@/security/route";
import { RATE_LIMITS } from "@/security/limits";
export const runtime="nodejs";
async function handlePOST(request:Request,{params}:{params:Promise<{token:string}>}){
 if(!isSameOriginRequest(request))return legacyShareInvalid();
 const {token}=await params;
 const body=await legacyShareBody(request);
 const access=await legacyShareVerify(token,legacyShareCode(body));
 if(!access)return legacyShareInvalid();
 // CSV is the existing audited export event type (including ZIP export).
 // Do not store caller-supplied kind or any code/token in the audit.
 const result=await getPublicCompanyApplicantShare(token,1,"CSV","",access.proof).catch(()=>null);
 if(!result||result.kind!=="READY")return legacyShareInvalid();
 return NextResponse.json({ok:true},{headers:legacyShareHeaders});
}
export const POST = route(
  { auth: "public", publicReason: "Link or form opened without an account (token, slug or anonymous report); the handler validates the token or input and is rate limited per address.", csrf: false, csrfExemptReason: "Links and email clients send no same-origin header; the handler validates the token or applies its own origin check.", rateLimit: RATE_LIMITS.BULK },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);
