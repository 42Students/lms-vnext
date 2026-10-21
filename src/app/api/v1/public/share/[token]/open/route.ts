import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {getPublicCompanyApplicantShare} from "@/modules/placements/company-share/public-service";
import {legacyShareBody,legacyShareCode,legacyShareCookie,legacyShareHeaders,
 legacyShareInvalid,legacyShareVerify} from "@/modules/placements/company-share/legacy-public-controller";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(request:Request,{params}:{params:Promise<{token:string}>}){
 if(!isSameOriginRequest(request))return legacyShareInvalid();
 const {token}=await params,code=legacyShareCode(await legacyShareBody(request));
 const access=await legacyShareVerify(token,code);
 if(!access)return legacyShareInvalid();
 const result=await getPublicCompanyApplicantShare(token,1,"VIEW","",access.proof).catch(()=>null);
 if(!result||result.kind!=="READY")return legacyShareInvalid();
 return legacyShareCookie(NextResponse.json(result,{headers:legacyShareHeaders}),access);
}
