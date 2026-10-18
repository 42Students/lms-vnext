import {NextResponse} from "next/server";
import {listTpoBatches} from "@/modules/placements/tpo-batch-workspace-read-service";
import {hasMembershipRole} from "@/modules/identity/context";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {tpoReportHasRepeatedSearchParams} from "@/modules/placements/tpo-report-url-guard";
import {getPlacementReportDetails} from "@/modules/placements/report-service";
import {getTpoUnplacedAcademicEvidence} from "@/modules/placements/tpo-unplaced-academic-evidence-service";
import {formatUnplacedPercentage} from "@/modules/placements/tpo-unplaced-academic-evidence-model";
import {getTpoUnplacedLastApplications} from "@/modules/placements/tpo-unplaced-activity-read-service";
import {getTpoStudentsIntelligence} from "@/modules/placements/tpo-students-service";
import {unplacedFilteredExportQuerySchema,tpoUnplacedFilteredCsv}
 from "@/modules/placements/tpo-unplaced-filtered-export-model";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 try{
  const context=await getCurrentRequestContext();
  if(!context.membership||!hasMembershipRole(context,"TPO"))return NextResponse.json({error:"UNAUTHORIZED"},{status:403});
  const params=new URL(request.url).searchParams;
  if(tpoReportHasRepeatedSearchParams(params))return NextResponse.json({error:"INVALID_QUERY"},{
   status:400,headers:{"Cache-Control":"private, no-store"},
  });
  const input=unplacedFilteredExportQuerySchema.parse(Object.fromEntries(params.entries()));
  const collegeId=context.membership.collegeId;
  if(input.batchId){
   const batches=await listTpoBatches(context);
   if(!batches.batches.some(batch=>batch.id===input.batchId))
    return NextResponse.json({error:"INVALID_BATCH"},{status:400});
  }
  const [workspace,students]=await Promise.all([
   getPlacementReportDetails(context,{collegeId,seasonId:input.seasonId,jobId:input.jobId}),
   getTpoStudentsIntelligence(context,{collegeId,batchId:input.batchId,branchId:input.branchId,
    page:1,pageSize:100},{includeExportRows:true}),
  ]);
  const activity=await getTpoUnplacedLastApplications(context,{collegeId,
   seasonId:workspace.selectedSeasonId,jobId:workspace.selectedJobId});
  if(input.branchId&&!students.branches.some(branch=>branch.branchId===input.branchId))
   return NextResponse.json({error:"INVALID_BRANCH"},{status:400});
  const roster=new Map((students.exportRows??[]).map(row=>[row.membershipId,row]));
  const matching=workspace.details.unplaced.filter(row=>roster.has(row.membershipId));
  const visible=matching.slice(0,5000);
  const academic=await getTpoUnplacedAcademicEvidence(context,collegeId,visible.map(row=>row.membershipId));
  const rows=visible.map(student=>{
   const item=roster.get(student.membershipId)!;
   return {displayName:student.displayName,rollNumber:item.rollNumber??null,
    batch:item.cohortName,branch:item.branchName,
    lowestRecordedPercent:formatUnplacedPercentage(academic.get(student.membershipId)?.lowestRecordedPercent??null),
    undergraduatePercent:formatUnplacedPercentage(academic.get(student.membershipId)?.undergraduatePercent??null),
    marksVerified:academic.get(student.membershipId)?.verification??"Not recorded",
    applications:activity.get(student.membershipId)?.applications??0,
    stillInDrive:activity.get(student.membershipId)?.stillInDrive??false,
    lastApplied:activity.get(student.membershipId)?.lastSubmittedAt?.toLocaleDateString("en-IN",{
     timeZone:"Asia/Kolkata",day:"2-digit",month:"short",year:"numeric",
    })??null};
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
