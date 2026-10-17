import {NextResponse} from "next/server";
import {ZodError} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {tpoCrmTablesReady} from "@/modules/placements/tpo-crm-storage-readiness";
import {tpoCrmApiErrorResponse} from "@/lib/tpo-crm-api-error";
import {TpoBulkUndoError,undoTpoRecruiterBulkRun} from "@/modules/placements/tpo-bulk-undo-service";

export const runtime="nodejs";
export const dynamic="force-dynamic";

/** Single-winner, five-minute restore; never accepts client-supplied old values. */
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 if(!await tpoCrmTablesReady())
  return NextResponse.json({error:"DB09_MIGRATIONS_PENDING"},{status:503});
 try{
  const payload=await request.json().catch(()=>null);
  const restored=await undoTpoRecruiterBulkRun(await getCurrentRequestContext(),payload);
  return NextResponse.json(restored,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof ZodError)
   return NextResponse.json({error:"INVALID_UNDO_REQUEST"},{status:422});
  if(error instanceof TpoBulkUndoError)
   return NextResponse.json({error:error.code},{status:error.code==="NOT_FOUND"?404:409});
  return tpoCrmApiErrorResponse(error);
 }
}
