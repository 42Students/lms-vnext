import {NextResponse} from "next/server";
import {cookies} from "next/headers";
import {getPublicCompanyApplicantShare} from "@/modules/placements/company-share/public-service";
import {companyShareSelectedCsv} from "@/modules/placements/company-share/column-model";
import {companyShareCsvResponseHeaders} from "@/modules/placements/company-share/export-headers-model";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request,{params}:{params:Promise<{token:string}>}){
 const {token}=await params;
 const proof=(await cookies()).get("company_share_access")?.value??null;
 const result=await getPublicCompanyApplicantShare(token,1,"CSV",new URL(request.url).searchParams.get("q")??"",proof);
 if(result.kind!=="READY")return NextResponse.json({error:"SHARE_UNAVAILABLE"},{
  status:404,headers:{"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer"},
 });
 return new Response("\uFEFF"+companyShareSelectedCsv(result.rows,result.selectedColumns,result.truncated),{
  status:200,headers:companyShareCsvResponseHeaders(),
 });
}
