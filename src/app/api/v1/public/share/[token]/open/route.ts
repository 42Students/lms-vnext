import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {getPublicCompanyApplicantShare} from "@/modules/placements/company-share/public-service";
import {legacyShareBody,legacyShareCode,legacyShareCookie,legacyShareHeaders,
 legacyShareInvalid,legacyShareVerify} from "@/modules/placements/company-share/legacy-public-controller";
import { route } from "@/security/route";
export const runtime="nodejs";
export const dynamic="force-dynamic";
async function handlePOST(request:Request,{params}:{params:Promise<{token:string}>}){
 if(!isSameOriginRequest(request))return legacyShareInvalid();
 const {token}=await params,code=legacyShareCode(await legacyShareBody(request));
 const access=await legacyShareVerify(token,code);
 if(!access)return legacyShareInvalid();
 const result=await getPublicCompanyApplicantShare(token,1,"VIEW","",access.proof).catch(()=>null);
 if(!result||result.kind!=="READY")return legacyShareInvalid();
 return legacyShareCookie(NextResponse.json(result,{headers:legacyShareHeaders}),access);
}
export const POST = route(
  { auth: "public", publicReason: "Link or form opened without an account (token, slug or anonymous report); the handler validates the token or input and is rate limited per address.", csrf: false, csrfExemptReason: "Links and email clients send no same-origin header; the handler validates the token or applies its own origin check.", rateLimit: { limit: 3000, windowMs: 60_000 } },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);
