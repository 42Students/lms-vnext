import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {setTpoJobTypeCountsAsPlaced,TpoConfigError} from "@/modules/placements/tpo-job-type-write-service";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const {jobTypeId}=params;
const body=await boundedRequestJson(request) as {countsAsPlaced?:unknown;expectedVersion?:unknown};
return NextResponse.json(await setTpoJobTypeCountsAsPlaced(__ctx,{
   jobTypeId,countsAsPlaced:body?.countsAsPlaced,expectedVersion:body?.expectedVersion,
  }),{headers:{"Cache-Control":CACHE.PRIVATE}});
} catch(error){
  if(error instanceof TpoConfigError)return NextResponse.json({error:error.code},{
   status:error.code==="TPO_SETTINGS_STALE"||error.code==="TPO_JOB_TYPE_BUILTIN"?409:error.code==="TPO_SETTINGS_PENDING"?503:404});
  return apiErrorResponse(error);}
  },
);
