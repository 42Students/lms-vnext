import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {getPublicCompanyApplicantShare} from "@/modules/placements/company-share/public-service";
import {legacyShareBody,legacyShareCode,legacyShareHeaders,
 legacyShareInvalid,legacyShareVerify} from "@/modules/placements/company-share/legacy-public-controller";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{token:string}>}){
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
