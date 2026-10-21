import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {PlacementBatchError} from "@/modules/placements/batch-participation-service";
import {saveTpoBatchRuleOverrides} from "@/modules/placements/tpo-batch-rules-service";
import {getTpoBatch} from "@/modules/placements/tpo-batch-workspace-read-service";
export const runtime="nodejs";
/** Legacy GET /batches/{id}/rules: scoped read, never a write or a guessed
 * college. The full batch and students views use sibling routes. */
export async function GET(_request:Request,{params}:{params:Promise<{batchId:string}>}){
 try{
  const {batchId}=await params;
  const state=await getTpoBatch(await getCurrentRequestContext(),batchId);
  return NextResponse.json({
   batch:state.batch,
   ready:state.ready,
   readiness:state.readiness,
   rulesOverride:state.lifecycle?.rulesOverride??null,
   version:state.lifecycle?.updatedAt?.toISOString()??"none",
   registrationDeadline:state.lifecycle?.registrationDeadline?.toISOString()??null,
   links:{
    batch:"/tpo/batches/"+encodeURIComponent(batchId),
    students:"/tpo/batches/"+encodeURIComponent(batchId)+"/students",
    back:"/tpo/batches",
   },
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export async function POST(request:Request,{params}:{params:Promise<{batchId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {batchId}=await params;
  const result=await saveTpoBatchRuleOverrides(await getCurrentRequestContext(),batchId,await request.json());
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof PlacementBatchError&&error.code==="DB08_ACTION_STALE")
   return NextResponse.json({error:"BATCH_RULES_CHANGED"},{status:409});
  return apiErrorResponse(error);
 }
}
