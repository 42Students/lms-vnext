import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {addTpoStudentNotes} from "@/modules/placements/tpo-student-notes-service";
import {readTpoBulkRequestBody,TpoBulkBodyError} from "@/modules/placements/tpo-bulk-request-body";
import { CACHE, privateJson } from "@/security/responses";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request: req, context: __actor }) => {
    const __ctx = __actor!;
    try {
const body=await readTpoBulkRequestBody(req);
const result=await addTpoStudentNotes(__ctx,body);
return privateJson(result);
} catch(error){
  if(error instanceof TpoBulkBodyError)return NextResponse.json({error:error.message},
   {status:error.status,headers:{"Cache-Control":CACHE.PRIVATE}});
  return apiErrorResponse(error);
 }
  },
);
