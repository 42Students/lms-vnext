import { boundedRequestJson } from "@/lib/bounded-request-json";
import {NextResponse} from "next/server";
import {ZodError} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {tpoCrmTablesReady} from "@/modules/placements/tpo-crm-storage-readiness";
import {tpoCrmApiErrorResponse} from "@/lib/tpo-crm-api-error";
import {TpoBulkUndoError,undoTpoRecruiterBulkRun} from "@/modules/placements/tpo-bulk-undo-service";
import { route } from "@/security/route";

import { privateJson } from "@/security/responses";
export const runtime="nodejs";
export const dynamic="force-dynamic";

/** Single-winner, five-minute restore; never accepts client-supplied old values. */
async function handlePOST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 if(!await tpoCrmTablesReady())
  return NextResponse.json({error:"DB09_MIGRATIONS_PENDING"},{status:503});
 try{
  const payload=await boundedRequestJson(request, 8 * 1024 * 1024).catch(()=>null);
  const restored=await undoTpoRecruiterBulkRun(await getCurrentRequestContext(),payload);
  return privateJson(restored);
 }catch(error){
  if(error instanceof ZodError)
   return NextResponse.json({error:"INVALID_UNDO_REQUEST"},{status:422});
  if(error instanceof TpoBulkUndoError)
   return NextResponse.json({error:error.code},{status:error.code==="NOT_FOUND"?404:409});
  return tpoCrmApiErrorResponse(error);
 }
}
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);
