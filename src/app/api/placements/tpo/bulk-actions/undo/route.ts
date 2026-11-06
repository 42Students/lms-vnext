import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {undoTpoStudentBulkRun,TpoStudentBulkUndoError} from "@/modules/placements/tpo-bulk-students-undo-service";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
async function handlePOST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const raw=await request.json();
  const result=await undoTpoStudentBulkRun(await getCurrentRequestContext(),raw);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof TpoStudentBulkUndoError)return NextResponse.json({error:error.code},{status:409});
  return apiErrorResponse(error);
 }
}
export const POST = secured(handlePOST, { csrf: "enforce" });
