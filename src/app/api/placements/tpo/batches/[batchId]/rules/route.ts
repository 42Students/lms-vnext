import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
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
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {batchId}=params;
    const state=await getTpoBatch(__ctx,batchId);
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
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const {batchId}=params;
const result=await saveTpoBatchRuleOverrides(__ctx,batchId,await boundedRequestJson(request));
return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
} catch(error){
  if(error instanceof PlacementBatchError&&error.code==="DB08_ACTION_STALE")
   return NextResponse.json({error:"BATCH_RULES_CHANGED"},{status:409});
  return apiErrorResponse(error);
 }
  },
);
