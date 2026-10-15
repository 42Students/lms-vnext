import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {writeSuperAdminStudentRule} from "@/modules/module-access/admin-student-rule-write";
import {getSuperAdminLearnerAccessTrace} from "@/modules/module-access/admin-trace-service";
import {studentRuleSnapshot} from "@/modules/module-access/admin-student-rule-snapshot";
export const runtime="nodejs";
export async function PUT(request:Request,{params}:{params:Promise<{collegeId:string;membershipId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {collegeId,membershipId}=await params;
  let input:unknown;
  try{input=await request.json();}catch{return NextResponse.json({error:"INVALID_REQUEST"},{status:400});}
  const rule=await writeSuperAdminStudentRule(await getCurrentRequestContext(),collegeId,membershipId,input);
  return rule?NextResponse.json({rule}):NextResponse.json({error:"NOT_FOUND"},{status:404});
 }catch(error){return apiErrorResponse(error);}
}

export async function GET(_request:Request,{params}:{params:Promise<{collegeId:string;membershipId:string}>}){
 try{
  const {collegeId,membershipId}=await params;
  const result=await getSuperAdminLearnerAccessTrace(await getCurrentRequestContext(),collegeId,{membershipId});
  if(!result?.selected)return NextResponse.json({error:"NOT_FOUND"},{status:404});
  return NextResponse.json({rules:studentRuleSnapshot(result.selected.modules)},{headers:{"cache-control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
