import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getTpoInterviewLegacyStatus} from "@/modules/placements/tpo-interview-legacy-status-service";
export const runtime="nodejs";
export async function GET(_request:Request,{params}:{
 params:Promise<{jobId:string;slotId:string}>;
}){
 try{
  const {jobId,slotId}=await params;
  const state=await getTpoInterviewLegacyStatus(
   await getCurrentRequestContext(),jobId,slotId);
  return NextResponse.json(state,{headers:{"cache-control":"no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
