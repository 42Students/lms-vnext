import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {requirePermission} from "@/modules/permissions/policy";
import {RECOVERY_ENTITY_TYPES} from "@/modules/admin-ui/recovery-type-registry";
import {apiErrorResponse} from "@/lib/api-error";
export const runtime="nodejs";
export async function GET(){
 try{
  const context=await getCurrentRequestContext();
  requirePermission(context,"admin-scope.select");
  const mayRestore=context.adminScope?.organizationId||context.adminScope?.collegeId;
  return NextResponse.json({types:RECOVERY_ENTITY_TYPES.map(type=>({
   ...type,available:type.implemented&&(!mayRestore||type.platformLevel),
  }))},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
