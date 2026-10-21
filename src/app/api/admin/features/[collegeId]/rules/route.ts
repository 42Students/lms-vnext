import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getSuperAdminCollegeFeatureSnapshot} from "@/modules/module-access/admin-college-rule-read";
import {isSameOriginRequest} from "@/auth/origin";
import {writeSuperAdminCollegeRule} from "@/modules/module-access/admin-college-rule-write";
import {collegeFeatureModuleSchema,collegeRuleWriteSchema} from "@/modules/module-access/admin-college-rule-model";
import {isSuperAdmin} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
export const runtime="nodejs";
export async function GET(_request:Request,{params}:{params:Promise<{collegeId:string}>}){
 try{
  const {collegeId}=await params;
  const result=await getSuperAdminCollegeFeatureSnapshot(await getCurrentRequestContext(),collegeId);
  if(!result)return NextResponse.json({error:"NOT_FOUND",message:"No active college with that ID."},{status:404,headers:{"cache-control":"private, no-store"}});
  return NextResponse.json(result,{headers:{"cache-control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}

export async function PUT(request:Request,{params}:{params:Promise<{collegeId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  let input:unknown;
  try{input=await request.json();}catch{return NextResponse.json({error:"INVALID_REQUEST"},{status:400});}
  const {collegeId}=await params;
  const context=await getCurrentRequestContext();
  // vNext rule writes are versioned: SET/INHERIT plus the expected persisted
  // value, never the legacy bare {module,enabled} toggle that can lose locks.
  // Authorize before disclosing field-level validation to callers.
  if(!isSuperAdmin(context))throw new AuthorizationError("admin-scope.select");
  requirePermission(context,"admin-scope.select");
  const parsed=collegeRuleWriteSchema.safeParse(input);
  if(!parsed.success){
   const values=input!==null&&typeof input==="object"&&!Array.isArray(input)
     ? input as Record<string,unknown>:null;
   const moduleName=values?.module;
   const invalidModule=typeof moduleName==="string"&&moduleName.trim()!==""&&
     !collegeFeatureModuleSchema.safeParse(moduleName).success;
   const message=invalidModule
     ? "Unknown module. Choose Projects, Placements or Electives."
     : typeof moduleName!=="string"||moduleName.trim()===""||
       (values?.action==="SET"&&typeof values?.enabled!=="boolean")
       ? 'Request must include both "module" and "enabled" when setting a rule.'
       : !values||!("expected" in values)
         ? "Include the expected stored rule state before changing a module."
         : "Invalid module rule. Choose Set or Inherit and check the fields.";
   return NextResponse.json({error:"INVALID_REQUEST",message},{status:400,headers:{"cache-control":"private, no-store"}});
  }
  const rule=await writeSuperAdminCollegeRule(context,collegeId,parsed.data);
  return rule?NextResponse.json({rule},{headers:{"cache-control":"private, no-store"}}):
   NextResponse.json({error:"NOT_FOUND",message:"No active college with that ID."},{status:404,headers:{"cache-control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
