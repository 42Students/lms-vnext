import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {getBatchEligibilityImportPreview} from "@/modules/placements/tpo-batch-import-service";
import {eligibilityImportRowSchema} from "@/modules/placements/tpo-eligibility-import-model";
import {decidePlacementParticipation,PlacementBatchError} from "@/modules/placements/batch-participation-service";
import {placementTableExists} from "@/modules/placements/staged-tables";
export const runtime="nodejs";
const inputSchema=z.object({
 rows:z.array(eligibilityImportRowSchema).min(1).max(200),
 expectedVersions:z.record(z.string().uuid(),z.string().min(1)),
 confirmed:z.literal(true),
}).strict();
export async function POST(request:Request,{params}:{params:Promise<{batchId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {batchId}=await params,body=inputSchema.parse(await request.json());
  const context=await getCurrentRequestContext();
  const preview=await getBatchEligibilityImportPreview(context,batchId,{rows:body.rows});
  if(!await placementTableExists("placement_eligibility_events"))
   return NextResponse.json({error:"BATCH_MIGRATION_PENDING"},{status:503});
  const changes:{scopeType:"MEMBERSHIP";scopeId:string;status:"ELIGIBLE"|"INELIGIBLE";
   reason:string|null;expectedVersion:string}[]=[];
  for(let index=0;index<preview.preview.length;index++){
   const candidate=preview.preview[index],row=preview.rows[index];
   if(candidate.status!=="matched"||!candidate.membershipId||!candidate.expectedVersion)continue;
   const version=body.expectedVersions[candidate.membershipId];
   if(!version||version!==candidate.expectedVersion)
    return NextResponse.json({error:"IMPORT_PREVIEW_STALE"},{status:409});
   changes.push({scopeType:"MEMBERSHIP",scopeId:candidate.membershipId,status:row.decision,
     reason:row.decision==="INELIGIBLE"?row.reason:null,expectedVersion:version});
  }
  if(!changes.length)return NextResponse.json({error:"NO_MATCHED_ROWS"},{status:422});
  const outcome=await decidePlacementParticipation(context,{
   collegeId:context.membership!.collegeId,expectedCohortId:batchId,changes,
  });
  return NextResponse.json({actionId:outcome.actionId,changedCount:outcome.changedCount,
    skipped:preview.skipped,matched:changes.length},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof PlacementBatchError&&error.code==="DB08_ACTION_STALE")
   return NextResponse.json({error:"IMPORT_PREVIEW_STALE"},{status:409});
  return apiErrorResponse(error);
 }
}
