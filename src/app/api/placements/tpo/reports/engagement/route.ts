import { route } from "@/security/route";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {tpoReportHasRepeatedSearchParams} from "@/modules/placements/tpo-report-url-guard";
import {hasMembershipRole} from "@/modules/identity/context";
import {getPlacementReportWorkspace} from "@/modules/placements/report-service";
import {getPlacementLeadsReport} from "@/modules/placements/report-extra-service";
import {filterCompanyEngagement} from "@/modules/placements/tpo-company-engagement-filter-model";
import {getTpoRecordedRanDrives} from "@/modules/placements/tpo-engagement-ran-drives-service";
import {joinTpoCompanyEngagementWithPlacement} from "@/modules/placements/tpo-company-engagement-model";
import {companyEngagementCsv,companyEngagementCsvQuerySchema} from "@/modules/placements/tpo-company-engagement-csv-model";
import {NextResponse} from "next/server";
import { ROLE } from "@/modules/identity/roles";
import { CACHE, privateJson } from "@/security/responses";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    try {
if(!context.membership||!hasMembershipRole(context,ROLE.TPO))
   return NextResponse.json({error:"UNAUTHORIZED"},{status:403});
const params=new URL(request.url).searchParams;
if(tpoReportHasRepeatedSearchParams(params))return NextResponse.json({error:"INVALID_QUERY"},{
   status:400,headers:{"Cache-Control":CACHE.PRIVATE},
  });
const input=companyEngagementCsvQuerySchema.parse(Object.fromEntries(params.entries()));
const collegeId=context.membership.collegeId;
const [report,leads]=await Promise.all([
   getPlacementReportWorkspace(context,{collegeId,seasonId:input.seasonId,jobId:input.jobId}),
   getPlacementLeadsReport(context,collegeId),
  ]);
const ranDrives=await getTpoRecordedRanDrives(context,{collegeId,
   seasonId:report.selectedSeasonId,jobId:report.selectedJobId});
const selected=filterCompanyEngagement(joinTpoCompanyEngagementWithPlacement(leads.companyEngagement,report.report.byCompany,ranDrives),input.companyId??null);
if(!selected.valid)return privateJson({error:"INVALID_COMPANY"}, { status: 400 });
const all=selected.rows;
const rows=all.slice(0,5000).map(row=>{
   return {companyName:row.companyName,contacts:row.contacts,invited:row.invited,joined:row.joined,
    drives:row.ranDrives,placed:row.placed};
  });
return new Response("\uFEFF"+companyEngagementCsv(rows),{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="recruiter-engagement.csv"',
   "Cache-Control":CACHE.PRIVATE_STRICT,"X-Content-Type-Options":"nosniff",
   "X-Export-Truncated":all.length>rows.length?"true":"false",Vary:"Cookie",
  }});
} catch(error){
  const response=apiErrorResponse(error);response.headers.set("Cache-Control","private, no-store");
  return response;
 }
  },
);
