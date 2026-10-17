import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {PlacementBatchError} from "@/modules/placements/batch-participation-service";
import {saveTpoBatchRuleOverrides} from "@/modules/placements/tpo-batch-rules-service";
export const runtime="nodejs";
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
