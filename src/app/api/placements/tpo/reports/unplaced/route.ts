import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getPlacementReportDetails} from "@/modules/placements/report-service";
import {getTpoStudentsIntelligence} from "@/modules/placements/tpo-students-service";
import {unplacedFilteredExportQuerySchema,tpoUnplacedFilteredCsv}
 from "@/modules/placements/tpo-unplaced-filtered-export-model";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 try{
  const context=await getCurrentRequestContext();
  if(!context.membership)return NextResponse.json({error:"UNAUTHORIZED"},{status:403});
  const input=unplacedFilteredExportQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams.entries()));
  const collegeId=context.membership.collegeId;
  const [workspace,students]=await Promise.all([
   getPlacementReportDetails(context,{collegeId,seasonId:input.seasonId,jobId:input.jobId}),
   getTpoStudentsIntelligence(context,{collegeId,batchId:input.batchId,branchId:input.branchId,
    page:1,pageSize:100},{includeExportRows:true}),
  ]);
  const roster=new Map((students.exportRows??[]).map(row=>[row.membershipId,row]));
  const matching=workspace.details.unplaced.filter(row=>roster.has(row.membershipId));
  const rows=matching.slice(0,5000).map(student=>{
   const item=roster.get(student.membershipId)!;
   return {displayName:student.displayName,rollNumber:item.rollNumber??null,
    batch:item.cohortName,branch:item.branchName,applications:item.applicationCount,
    stillInDrive:item.activeApplicationCount>0};
  });
  return new Response("\uFEFF"+tpoUnplacedFilteredCsv(rows),{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="unplaced-filtered.csv"',
   "Cache-Control":"private, no-store, max-age=0",
   "X-Content-Type-Options":"nosniff","X-Export-Truncated":matching.length>rows.length?"true":"false",
   Vary:"Cookie",
  }});
 }catch(error){const response=apiErrorResponse(error);
  response.headers.set("Cache-Control","private, no-store");return response;}
}
