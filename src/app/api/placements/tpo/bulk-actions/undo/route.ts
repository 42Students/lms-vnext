import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {undoTpoStudentBulkRun,TpoStudentBulkUndoError} from "@/modules/placements/tpo-bulk-students-undo-service";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    try {
const raw=await boundedRequestJson(request, 8 * 1024 * 1024);
const result=await undoTpoStudentBulkRun(__ctx,raw);
return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
} catch(error){
  if(error instanceof TpoStudentBulkUndoError)return NextResponse.json({error:error.code},{status:409});
  return apiErrorResponse(error);
 }
  },
);
