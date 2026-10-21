import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {collegeHiringAnalyticsQuery} from "@/modules/placements/college-hiring-analytics-model";
import {getCollegeHiringFunnel} from "@/modules/placements/college-hiring-funnel-service";
import {collegeHiringFunnelCsv} from "@/modules/placements/college-hiring-funnel-export";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(request:Request){
 try{
  const parsed=collegeHiringAnalyticsQuery(Object.fromEntries(new URL(request.url).searchParams));
  if(!parsed.success)return NextResponse.json({error:"INVALID_REPORT_FILTERS"},{status:400});
  const context=await getCurrentRequestContext();
  const report=await getCollegeHiringFunnel(context,parsed.data);
  const parts=new Intl.DateTimeFormat("en-GB",{
   timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
  }).formatToParts(new Date());
  const datePart=(kind:"year"|"month"|"day")=>
   parts.find(part=>part.type===kind)?.value??"00";
  const filename="hiring-report-"+datePart("year")+"-"+datePart("month")+"-"+datePart("day")+".csv";
  return new NextResponse(collegeHiringFunnelCsv(report),{
   headers:{"Content-Type":"text/csv; charset=utf-8",
    "Content-Disposition":'attachment; filename="'+filename+'"',
    "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"},
  });
 }catch(error){return apiErrorResponse(error);}
}
