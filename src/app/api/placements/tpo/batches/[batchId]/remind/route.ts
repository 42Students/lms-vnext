import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {remindTpoBatch,TpoBatchReminderError} from "@/modules/placements/tpo-batch-reminder-service";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
async function handlePOST(request:Request,{params}:{params:Promise<{batchId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {batchId}=await params;
  return NextResponse.json(await remindTpoBatch(await getCurrentRequestContext(),batchId,await request.json()),
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof TpoBatchReminderError)
   return NextResponse.json({error:error.code},{status:409});
  return apiErrorResponse(error);
 }
}
export const POST = secured(handlePOST, { csrf: "enforce" });
