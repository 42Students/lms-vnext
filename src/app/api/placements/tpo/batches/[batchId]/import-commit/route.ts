import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {getBatchEligibilityImportPreview} from "@/modules/placements/tpo-batch-import-service";
import {tpoSheetRowSchema} from "@/modules/placements/tpo-eligibility-sheet-model";
import {decidePlacementParticipation,PlacementBatchError} from "@/modules/placements/batch-participation-service";
import {placementTableExists} from "@/modules/placements/staged-tables";
export const runtime="nodejs";
const inputSchema=z.object({
 rows:z.array(tpoSheetRowSchema).min(1).max(5000),
 expectedVersions:z.record(z.string().uuid(),z.string().min(1)),
 previewMemberIds:z.array(z.string().uuid().nullable()).min(1).max(5000).optional(),
 confirmed:z.literal(true),
}).strict();
export async function POST(request:Request,{params}:{params:Promise<{batchId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {batchId}=await params,body=inputSchema.parse(await request.json());
  const context=await getCurrentRequestContext();
  const preview=await getBatchEligibilityImportPreview(context,batchId,{rows:body.rows});
  // Never silently apply the matched subset while any source row is unusable.
  if(preview.skipped>0)return NextResponse.json({error:"IMPORT_HAS_UNUSABLE_ROWS"},{status:422});
  if(!await placementTableExists("placement_eligibility_events"))
   return NextResponse.json({error:"BATCH_MIGRATION_PENDING"},{status:503});
  // Lock the preview's roll->membership mapping against roster edits and collisions.
  const rollIdentifiers=body.rows.some(row=>!z.string().uuid().safeParse(row.studentCode).success);
  if(rollIdentifiers&&!body.previewMemberIds)return NextResponse.json({error:"IMPORT_PREVIEW_STALE"},{status:409});
  if(body.previewMemberIds&&body.previewMemberIds.length!==body.rows.length)
   return NextResponse.json({error:"IMPORT_PREVIEW_STALE"},{status:409});
  const changes:{scopeType:"MEMBERSHIP";scopeId:string;status:"ELIGIBLE"|"INELIGIBLE"|"NOT_DECIDED";
   reason:string|null;expectedVersion:string}[]=[];
  for(let index=0;index<preview.preview.length;index++){
   const candidate=preview.preview[index],row=preview.rows[index];
   if(body.previewMemberIds&&candidate.membershipId!==body.previewMemberIds[index])
    return NextResponse.json({error:"IMPORT_PREVIEW_STALE"},{status:409});
   if(candidate.status!=="matched"||!candidate.membershipId||!candidate.expectedVersion)
    return NextResponse.json({error:"IMPORT_HAS_UNUSABLE_ROWS"},{status:422});
   const version=body.expectedVersions[candidate.membershipId];
   if(!version||version!==candidate.expectedVersion)
    return NextResponse.json({error:"IMPORT_PREVIEW_STALE"},{status:409});
   if(row.decision==="INVALID")return NextResponse.json({error:"IMPORT_HAS_UNUSABLE_ROWS"},{status:422});
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
