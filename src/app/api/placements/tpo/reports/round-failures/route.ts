import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {tpoReportHasRepeatedSearchParams} from "@/modules/placements/tpo-report-url-guard";
import {hasMembershipRole} from "@/modules/identity/context";
import {getPlacementFailureReasonsReport} from "@/modules/placements/report-extra-service";
import {tpoRoundFailureCsvQuerySchema,tpoRoundFailureCsv} from "@/modules/placements/tpo-round-failure-csv-model";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 try{
  const context=await getCurrentRequestContext();
  if(!context.membership||!hasMembershipRole(context,"TPO"))
   return NextResponse.json({error:"UNAUTHORIZED"},{status:403,headers:{"Cache-Control":"private, no-store"}});
  const params=new URL(request.url).searchParams;
  if(tpoReportHasRepeatedSearchParams(params))return NextResponse.json({error:"INVALID_QUERY"},{
   status:400,headers:{"Cache-Control":"private, no-store"},
  });
  const query=tpoRoundFailureCsvQuerySchema.parse(Object.fromEntries(params.entries()));
  const report=await getPlacementFailureReasonsReport(context,{
   collegeId:context.membership.collegeId,...query,
  });
  const rows=report.roundBranchFailureShares.slice(0,5000);
  return new Response(tpoRoundFailureCsv(rows),{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="round-failures-by-branch.csv"',
   "Cache-Control":"private, no-store, max-age=0",
   "X-Content-Type-Options":"nosniff",
   "X-Export-Truncated":String(report.roundBranchFailureShares.length>rows.length),
   Vary:"Cookie",
  }});
 }catch(error){const response=apiErrorResponse(error);response.headers.set("Cache-Control","private, no-store");return response;}
}
