import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {addTpoStudentNotes} from "@/modules/placements/tpo-student-notes-service";
import {readTpoBulkRequestBody,TpoBulkBodyError} from "@/modules/placements/tpo-bulk-request-body";
export const runtime="nodejs";
export async function POST(req:Request){
 if(!isSameOriginRequest(req))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  // A 2k-character note and 100 UUIDs fit comfortably below 64KiB. Reject
  // chunked oversized requests before buffering or invoking private writers.
  const body=await readTpoBulkRequestBody(req);
  const result=await addTpoStudentNotes(await getCurrentRequestContext(),body);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof TpoBulkBodyError)return NextResponse.json({error:error.message},
   {status:error.status,headers:{"Cache-Control":"private, no-store"}});
  return apiErrorResponse(error);
 }
}
