import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {hasMembershipRole} from "@/modules/identity/context";
import {getPlacementReportWorkspace} from "@/modules/placements/report-service";
import {getPlacementLeadsReport} from "@/modules/placements/report-extra-service";
import {getTpoRecordedRanDrives} from "@/modules/placements/tpo-engagement-ran-drives-service";
import {joinTpoCompanyEngagementWithPlacement} from "@/modules/placements/tpo-company-engagement-model";
import {companyEngagementCsv,companyEngagementCsvQuerySchema} from "@/modules/placements/tpo-company-engagement-csv-model";
import {NextResponse} from "next/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 try{
  const context=await getCurrentRequestContext();
  if(!context.membership||!hasMembershipRole(context,"TPO"))
   return NextResponse.json({error:"UNAUTHORIZED"},{status:403});
  const input=companyEngagementCsvQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams.entries()));
  const collegeId=context.membership.collegeId;
  const [report,leads]=await Promise.all([
   getPlacementReportWorkspace(context,{collegeId,...input}),
   getPlacementLeadsReport(context,collegeId),
  ]);
  const ranDrives=await getTpoRecordedRanDrives(context,{collegeId,
   seasonId:report.selectedSeasonId,jobId:report.selectedJobId});
  const all=joinTpoCompanyEngagementWithPlacement(leads.companyEngagement,report.report.byCompany,ranDrives);
  const rows=all.slice(0,5000).map(row=>{
   return {companyName:row.companyName,contacts:row.contacts,invited:row.invited,joined:row.joined,
    drives:row.ranDrives,placed:row.placed};
  });
  return new Response("\uFEFF"+companyEngagementCsv(rows),{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="recruiter-engagement.csv"',
   "Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff",
   "X-Export-Truncated":all.length>rows.length?"true":"false",Vary:"Cookie",
  }});
 }catch(error){
  const response=apiErrorResponse(error);response.headers.set("Cache-Control","private, no-store");
  return response;
 }
}
