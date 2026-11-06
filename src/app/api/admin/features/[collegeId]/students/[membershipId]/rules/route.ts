import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";
import {writeSuperAdminStudentRule} from "@/modules/module-access/admin-student-rule-write";
import {getSuperAdminLearnerAccessTrace} from "@/modules/module-access/admin-trace-service";
import {studentRuleSnapshot} from "@/modules/module-access/admin-student-rule-snapshot";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
async function handlePUT(request:Request,{params}:{params:Promise<{collegeId:string;membershipId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {collegeId,membershipId}=await params;
  const _p=await readBoundedJsonRequest(request,8192);
  if(!_p.ok)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  const input:unknown=_p.value;
  const rule=await writeSuperAdminStudentRule(await getCurrentRequestContext(),collegeId,membershipId,input);
  return rule?NextResponse.json({rule}):NextResponse.json({error:"NOT_FOUND"},{status:404});
 }catch(error){return apiErrorResponse(error);}
}
export const PUT = secured(handlePUT, { csrf: "enforce" });

async function handleGET(_request:Request,{params}:{params:Promise<{collegeId:string;membershipId:string}>}){
 try{
  const {collegeId,membershipId}=await params;
  const result=await getSuperAdminLearnerAccessTrace(await getCurrentRequestContext(),collegeId,{membershipId});
  if(!result?.selected)return NextResponse.json({error:"NOT_FOUND"},{status:404});
  return NextResponse.json({rules:studentRuleSnapshot(result.selected.modules)},{headers:{"cache-control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export const GET = secured(handleGET);
