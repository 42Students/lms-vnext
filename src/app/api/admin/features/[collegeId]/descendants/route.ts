import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readDescendantRule,writeDescendantRule} from "@/modules/module-access/admin-descendant-rule-write";
const query=z.strictObject({scopeType:z.enum(["DEPARTMENT","PROGRAM","COHORT","SECTION"]),scopeId:z.uuid(),module:z.enum(["projects","placements","electives"])});
export async function GET(request:Request,{params}:{params:Promise<{collegeId:string}>}){
 try{
  const {collegeId}=await params;
  const u=new URL(request.url);
  const value=query.parse({scopeType:u.searchParams.get("scopeType"),scopeId:u.searchParams.get("scopeId"),module:u.searchParams.get("module")});
  const result=await readDescendantRule(await getCurrentRequestContext(),collegeId,value.scopeType,value.scopeId,value.module);
  return result?NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}}):NextResponse.json({error:"NOT_FOUND"},{status:404});
 }catch(error){return apiErrorResponse(error);}
}
export async function PUT(request:Request,{params}:{params:Promise<{collegeId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {collegeId}=await params,raw=await request.json();
  const result=await writeDescendantRule(await getCurrentRequestContext(),collegeId,raw);
  return result?NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}}):NextResponse.json({error:"NOT_FOUND"},{status:404});
 }catch(error){return apiErrorResponse(error);}
}
