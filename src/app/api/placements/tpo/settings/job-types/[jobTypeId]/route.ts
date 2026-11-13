import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {setTpoJobTypeActive,renameTpoJobType,removeTpoJobType,TpoConfigError} from "@/modules/placements/tpo-job-type-write-service";
import { privateJson } from "@/security/responses";
export const runtime="nodejs";
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const {jobTypeId}=params,body=await boundedRequestJson(request) as unknown;
if(!body||typeof body!=="object"||Array.isArray(body))
   return NextResponse.json({error:"INVALID_INPUT"},{status:400});
const fields=body as Record<string,unknown>;
const result=await setTpoJobTypeActive(__ctx,{
   jobTypeId,active:fields["active"],expectedVersion:fields["expectedVersion"],
  });
return privateJson(result);
} catch(error){
  if(error instanceof TpoConfigError)return NextResponse.json({error:error.code},{
   status:error.code==="TPO_SETTINGS_STALE"||error.code==="TPO_JOB_TYPE_LAST_ACTIVE"||error.code==="TPO_JOB_TYPE_BUILTIN"?409:error.code==="TPO_SETTINGS_PENDING"?503:404});
  return apiErrorResponse(error);
 }
  },
);

export const PUT = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const {jobTypeId}=params;
const body=await boundedRequestJson(request) as {label?:unknown;expectedVersion?:unknown};
const result=await renameTpoJobType(__ctx,{
   jobTypeId,label:body?.label,expectedVersion:body?.expectedVersion,
  });
return privateJson(result);
} catch(error){
  if(error instanceof TpoConfigError)return NextResponse.json({error:error.code},{
   status:error.code==="TPO_SETTINGS_STALE"||error.code==="TPO_JOB_TYPE_EXISTS"||error.code==="TPO_JOB_TYPE_BUILTIN"?409:
    error.code==="TPO_SETTINGS_PENDING"?503:404});
  return apiErrorResponse(error);
 }
  },
);

export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const {jobTypeId}=params;
const body=await boundedRequestJson(request) as {expectedVersion?:unknown};
const result=await removeTpoJobType(__ctx,{
   jobTypeId,expectedVersion:body?.expectedVersion,
  });
return privateJson(result);
} catch(error){
  if(error instanceof TpoConfigError)return NextResponse.json({error:error.code},{
   status:error.code==="TPO_SETTINGS_STALE"||error.code==="TPO_JOB_TYPE_IN_USE"||
    error.code==="TPO_JOB_TYPE_BUILTIN"?409:error.code==="TPO_SETTINGS_PENDING"?503:404});
  return apiErrorResponse(error);
 }
  },
);
