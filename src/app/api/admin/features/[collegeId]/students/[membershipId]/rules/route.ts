import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {writeSuperAdminStudentRule} from "@/modules/module-access/admin-student-rule-write";
export const runtime="nodejs";
export async function PUT(request:Request,{params}:{params:Promise<{collegeId:string;membershipId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {collegeId,membershipId}=await params;
  const input:unknown=await request.json();
  const rule=await writeSuperAdminStudentRule(await getCurrentRequestContext(),collegeId,membershipId,input);
  return rule?NextResponse.json({rule}):NextResponse.json({error:"NOT_FOUND"},{status:404});
 }catch(error){return apiErrorResponse(error);}
}
