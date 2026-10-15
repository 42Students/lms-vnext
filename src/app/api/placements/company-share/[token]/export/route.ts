import {NextResponse} from "next/server";
import {getPublicCompanyApplicantShare} from "@/modules/placements/company-share/public-service";
import {tpoShareableShortlistCsv} from "@/modules/placements/tpo-shareable-shortlist-model";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request,{params}:{params:Promise<{token:string}>}){
 const {token}=await params;
 const result=await getPublicCompanyApplicantShare(token,1,"CSV",new URL(request.url).searchParams.get("q")??"");
 if(result.kind!=="READY")return NextResponse.json({error:"SHARE_UNAVAILABLE"},{
  status:404,headers:{"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer"},
 });
 return new Response("\uFEFF"+tpoShareableShortlistCsv(result.rows,result.truncated),{
  status:200,headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="company-shortlisted-applicants.csv"',
   "Cache-Control":"private, no-store",
   "X-Content-Type-Options":"nosniff",
   "Referrer-Policy":"no-referrer",
  },
 });
}
