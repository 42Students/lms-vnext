import {NextResponse} from "next/server";
import {getPublicCompanyApplicantShare} from "@/modules/placements/company-share/public-service";
import {legacyShareHeaders,legacyShareInvalid} from "@/modules/placements/company-share/legacy-public-controller";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(_request:Request,{params}:{params:Promise<{token:string}>}){
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
