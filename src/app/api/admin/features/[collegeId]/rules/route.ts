import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getSuperAdminCollegeFeatureSnapshot} from "@/modules/module-access/admin-college-rule-read";
export const runtime="nodejs";
export async function GET(_request:Request,{params}:{params:Promise<{collegeId:string}>}){
 try{
  const {collegeId}=await params;
  const result=await getSuperAdminCollegeFeatureSnapshot(await getCurrentRequestContext(),collegeId);
  if(!result)return NextResponse.json({error:"NOT_FOUND"},{status:404,headers:{"cache-control":"private, no-store"}});
  return NextResponse.json(result,{headers:{"cache-control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}

import {isSameOriginRequest} from "@/auth/origin";
import {writeSuperAdminCollegeRule} from "@/modules/module-access/admin-college-rule-write";
export async function PUT(request:Request,{params}:{params:Promise<{collegeId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  let input:unknown;
  try{input=await request.json();}catch{return NextResponse.json({error:"INVALID_REQUEST"},{status:400});}
  const {collegeId}=await params;
  const rule=await writeSuperAdminCollegeRule(await getCurrentRequestContext(),collegeId,input);
  return rule?NextResponse.json({rule},{headers:{"cache-control":"private, no-store"}}):NextResponse.json({error:"NOT_FOUND"},{status:404});
 }catch(error){return apiErrorResponse(error);}
}
