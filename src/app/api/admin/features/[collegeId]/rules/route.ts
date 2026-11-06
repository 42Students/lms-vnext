import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";
import {getSuperAdminCollegeFeatureSnapshot} from "@/modules/module-access/admin-college-rule-read";
import {isSameOriginRequest} from "@/auth/origin";
import {writeSuperAdminCollegeRule} from "@/modules/module-access/admin-college-rule-write";
import {collegeFeatureModuleSchema,collegeRuleWriteSchema} from "@/modules/module-access/admin-college-rule-model";
import {isSuperAdmin} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {collegeId}=params;
    const result=await getSuperAdminCollegeFeatureSnapshot(__ctx,collegeId);
    if(!result)return NextResponse.json({error:"NOT_FOUND",message:"No active college with that ID."},{status:404,headers:{"cache-control":"private, no-store"}});
    return NextResponse.json(result,{headers:{"cache-control":"private, no-store"}});
  },
);

export const PUT = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const context = __actor!;
    const _p=await readBoundedJsonRequest(request,8192);
    if(!_p.ok)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    const input:unknown=_p.value;
    const {collegeId}=params;
    if(!isSuperAdmin(context))throw new AuthorizationError("admin-scope.select");
    requirePermission(context,"admin-scope.select");
    const parsed=collegeRuleWriteSchema.safeParse(input);
    if(!parsed.success){
   const values=input!==null&&typeof input==="object"&&!Array.isArray(input)
     ? input as Record<string,unknown>:null;
   const moduleName=values?.["module"];
   const invalidModule=typeof moduleName==="string"&&moduleName.trim()!==""&&
     !collegeFeatureModuleSchema.safeParse(moduleName).success;
   const message=invalidModule
     ? "Unknown module. Choose Projects, Placements or Electives."
     : typeof moduleName!=="string"||moduleName.trim()===""||
       (values?.["action"]==="SET"&&typeof values?.["enabled"]!=="boolean")
       ? 'Request must include both "module" and "enabled" when setting a rule.'
       : !values||!("expected" in values)
         ? "Include the expected stored rule state before changing a module."
         : "Invalid module rule. Choose Set or Inherit and check the fields.";
   return NextResponse.json({error:"INVALID_REQUEST",message},{status:400,headers:{"cache-control":"private, no-store"}});
  }
    const rule=await writeSuperAdminCollegeRule(context,collegeId,parsed.data);
    return rule?NextResponse.json({rule},{headers:{"cache-control":"private, no-store"}}):
   NextResponse.json({error:"NOT_FOUND",message:"No active college with that ID."},{status:404,headers:{"cache-control":"private, no-store"}});
  },
);
