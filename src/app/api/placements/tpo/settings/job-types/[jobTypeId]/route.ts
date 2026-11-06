import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {setTpoJobTypeActive,renameTpoJobType,removeTpoJobType,TpoConfigError} from "@/modules/placements/tpo-job-type-write-service";
export const runtime="nodejs";
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobTypeId}=params,body=await request.json() as unknown;
    if(!body||typeof body!=="object"||Array.isArray(body))
   return NextResponse.json({error:"INVALID_INPUT"},{status:400});
    const fields=body as Record<string,unknown>;
    const result=await setTpoJobTypeActive(__ctx,{
   jobTypeId,active:fields["active"],expectedVersion:fields["expectedVersion"],
  });
    return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
  },
);

export const PUT = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobTypeId}=params;
    const body=await request.json() as {label?:unknown;expectedVersion?:unknown};
    const result=await renameTpoJobType(__ctx,{
   jobTypeId,label:body?.label,expectedVersion:body?.expectedVersion,
  });
    return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
  },
);

export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobTypeId}=params;
    const body=await request.json() as {expectedVersion?:unknown};
    const result=await removeTpoJobType(__ctx,{
   jobTypeId,expectedVersion:body?.expectedVersion,
  });
    return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
  },
);
