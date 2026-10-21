import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { sendTpoStudentNudges } from "@/modules/placements/tpo-student-nudge-send-service";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  // Older bulk-nudge POSTs supplied a free-text message and recipients but
  // did not choose a pre-written template. Preserve that free-text workflow:
  // the service still validates message length and membership ownership.
  const raw:unknown=await request.json();
  const body=raw!==null&&typeof raw==="object"&&!Array.isArray(raw)
    ?raw as Record<string,unknown>:null;
  const input=body&&!Object.prototype.hasOwnProperty.call(body,"template")
    ?{...body,template:"CUSTOM"}:raw;
  const result=await sendTpoStudentNudges(context,input);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
