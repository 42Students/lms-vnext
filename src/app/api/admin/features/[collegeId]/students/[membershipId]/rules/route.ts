import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";
import {writeSuperAdminStudentRule} from "@/modules/module-access/admin-student-rule-write";
import {getSuperAdminLearnerAccessTrace} from "@/modules/module-access/admin-trace-service";
import {studentRuleSnapshot} from "@/modules/module-access/admin-student-rule-snapshot";
export const runtime="nodejs";
export const PUT = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {collegeId,membershipId}=params;
    const _p=await readBoundedJsonRequest(request,8192);
    if(!_p.ok)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    const input:unknown=_p.value;
    const rule=await writeSuperAdminStudentRule(__ctx,collegeId,membershipId,input);
    return rule?NextResponse.json({rule}):NextResponse.json({error:"NOT_FOUND"},{status:404});
  },
);

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {collegeId,membershipId}=params;
    const result=await getSuperAdminLearnerAccessTrace(__ctx,collegeId,{membershipId});
    if(!result?.selected)return NextResponse.json({error:"NOT_FOUND"},{status:404});
    return NextResponse.json({rules:studentRuleSnapshot(result.selected.modules)},{headers:{"cache-control":"private, no-store"}});
  },
);
