import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {deleteBlockedDate,BlockedDateError} from "@/modules/placements/tpo-blocked-date-write-service";
import { privateJson } from "@/security/responses";
export const runtime="nodejs";
export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const {dateId}=params;
const body=await boundedRequestJson(request) as unknown;
if(!body||typeof body!=="object"||Array.isArray(body))
   return NextResponse.json({error:"INVALID_INPUT"},{status:400});
const input=body as Record<string,unknown>;
const result=await deleteBlockedDate(__ctx,{id:dateId,expectedVersion:input["expectedVersion"]});
return privateJson(result);
} catch(error){
  if(error instanceof BlockedDateError)return NextResponse.json({error:error.code},{
   status:error.code==="DATE_STALE"?409:error.code==="DATE_PENDING"?503:404});
  return apiErrorResponse(error);
 }
  },
);
