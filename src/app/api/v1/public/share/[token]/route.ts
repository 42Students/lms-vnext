import {NextResponse} from "next/server";
import {getPublicCompanyApplicantShare} from "@/modules/placements/company-share/public-service";
import {legacyShareHeaders,legacyShareInvalid} from "@/modules/placements/company-share/legacy-public-controller";
import { route } from "@/security/route";
import { RATE_LIMITS } from "@/security/limits";
export const runtime="nodejs";
export const dynamic="force-dynamic";
async function handleGET(_request:Request,{params}:{params:Promise<{token:string}>}){
 const {token}=await params;
 const result=await getPublicCompanyApplicantShare(token,1,"VIEW","",null).catch(()=>null);
 if(!result||result.kind==="UNAVAILABLE")return legacyShareInvalid();
 // No private applicant record is returned before the access code.
 if(result.kind==="CODE_REQUIRED")return NextResponse.json({
  title:result.title,companyName:result.companyName,
  expiresAt:result.expiresAt,requiresCode:true,
 },{headers:legacyShareHeaders});
 return NextResponse.json({requiresCode:true},{headers:legacyShareHeaders});
}
export const GET = route(
  { auth: "public", publicReason: "Link or form opened without an account (token, slug or anonymous report); the handler validates the token or input and is rate limited per address.", csrf: false, csrfExemptReason: "Links and email clients send no same-origin header; the handler validates the token or applies its own origin check.", rateLimit: RATE_LIMITS.BULK },
  ({ request, params }) => handleGET(request as Parameters<typeof handleGET>[0], { params: Promise.resolve(params) } as Parameters<typeof handleGET>[1]),
);
