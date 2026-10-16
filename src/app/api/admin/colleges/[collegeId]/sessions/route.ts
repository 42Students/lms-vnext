import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { listCollegeAdminSessions, revokeCollegeAdminSessions } from "@/modules/colleges/admin-session-service";
export const runtime = "nodejs";
type RouteContext = {params:Promise<{collegeId:string}>};
export async function GET(request:Request,{params}:RouteContext){
 try{
  const userId=z.uuid().parse(new URL(request.url).searchParams.get("userId"));
  const result=await listCollegeAdminSessions(await getCurrentRequestContext(),(await params).collegeId,userId);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export async function POST(request:Request,{params}:RouteContext){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const input=z.strictObject({userId:z.uuid(),confirm:z.literal(true)}).parse(await request.json());
  const result=await revokeCollegeAdminSessions(await getCurrentRequestContext(),(await params).collegeId,input.userId);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
