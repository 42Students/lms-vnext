import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {changeTpoBatchLifecycle} from "@/modules/placements/tpo-batch-lifecycle-service";
import {TpoBatchLifecycleError} from "@/modules/placements/tpo-batch-lifecycle-model";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "placements.manage" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const {batchId}=params;
const body=await request.json() as unknown;
if(!body||typeof body!=="object"||Array.isArray(body))
   return NextResponse.json({error:"INVALID_INPUT"},{status:400});
const item=body as Record<string,unknown>;
const result=await changeTpoBatchLifecycle(__ctx,{
   batchId,action:item["action"],expectedVersion:item["expectedVersion"],
  });
return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
} catch(error){
  if(error instanceof TpoBatchLifecycleError){
   const status=error.code==="BATCH_ACTION_STALE"?409:
    error.code==="BATCH_MIGRATION_PENDING"?503:
    error.code==="BATCH_NOT_STARTED"?404:422;
   return NextResponse.json({error:error.code},{status});
  }
  return apiErrorResponse(error);
 }
  },
);
