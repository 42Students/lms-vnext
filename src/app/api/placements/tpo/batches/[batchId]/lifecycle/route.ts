import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {changeTpoBatchLifecycle} from "@/modules/placements/tpo-batch-lifecycle-service";
import {TpoBatchLifecycleError} from "@/modules/placements/tpo-batch-lifecycle-model";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{batchId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {batchId}=await params;
  const body=await request.json() as unknown;
  if(!body||typeof body!=="object"||Array.isArray(body))
   return NextResponse.json({error:"INVALID_INPUT"},{status:400});
  const item=body as Record<string,unknown>;
  const result=await changeTpoBatchLifecycle(await getCurrentRequestContext(),{
   batchId,action:item["action"],expectedVersion:item["expectedVersion"],
  });
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof TpoBatchLifecycleError){
   const status=error.code==="BATCH_ACTION_STALE"?409:
    error.code==="BATCH_MIGRATION_PENDING"?503:
    error.code==="BATCH_NOT_STARTED"?404:422;
   return NextResponse.json({error:error.code},{status});
  }
  return apiErrorResponse(error);
 }
}
