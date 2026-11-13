import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedJsonRequest} from "@/lib/request-body";
import {readDescendantRule,writeDescendantRule} from "@/modules/module-access/admin-descendant-rule-write";
import { privateJson } from "@/security/responses";
const query=z.strictObject({scopeType:z.enum(["DEPARTMENT","PROGRAM","COHORT","SECTION"]),scopeId:z.uuid(),module:z.enum(["projects","placements","electives"])});
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {collegeId}=params;
    const u=new URL(request.url);
    const value=query.parse({scopeType:u.searchParams.get("scopeType"),scopeId:u.searchParams.get("scopeId"),module:u.searchParams.get("module")});
    const result=await readDescendantRule(__ctx,collegeId,value.scopeType,value.scopeId,value.module);
    return result?privateJson(result):NextResponse.json({error:"NOT_FOUND"},{status:404});
  },
);
export const PUT = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {collegeId}=params;
    const _p=await readBoundedJsonRequest(request,8192);
    if(!_p.ok)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    const raw=_p.value;
    const result=await writeDescendantRule(__ctx,collegeId,raw);
    return result?privateJson(result):NextResponse.json({error:"NOT_FOUND"},{status:404});
  },
);
