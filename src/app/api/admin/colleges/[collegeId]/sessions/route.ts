import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { collegeAdminSessionDisplay, listCollegeAdminSessions, revokeCollegeAdminSessions } from "@/modules/colleges/admin-session-service";
export const runtime = "nodejs";
type RouteContext = {params:Promise<{collegeId:string}>};
export async function GET(request:Request,{params}:RouteContext){
 try{
  // get() silently takes the first occurrence. Reject duplicated userId
  // or unexpected query keys rather than permitting ambiguous admin target
  // selection while enumerating private device sessions.
  const rawParams=new URL(request.url).searchParams;
  const raw=Object.fromEntries(
   [...new Set(rawParams.keys())].map(key=>[key,rawParams.getAll(key)]),
  );
  const {userId:[userId]}=z.strictObject({
   userId:z.array(z.uuid()).length(1),
  }).parse(raw);
  // Legacy numeric faculty IDs and adminType are not trusted as canonical
  // identities. The target must be a verified, college-scoped user UUID.
  const result=await listCollegeAdminSessions(await getCurrentRequestContext(),(await params).collegeId,userId!);
  const sessions=result.devices.map(row=>({
   id:row.id,...collegeAdminSessionDisplay(row),
   createdAt:row.created_at,expiresAt:row.expires_at,
  }));
  return NextResponse.json({...result,sessions,sessionCount:sessions.length},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export async function POST(request:Request,{params}:RouteContext){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const input=z.strictObject({userId:z.uuid(),confirm:z.literal(true)}).parse(await request.json());
  // Unlike the legacy bodyless revoke endpoint, explicit target UUID and
  // confirmation guard against cross-college or accidental sign-outs.
  const result=await revokeCollegeAdminSessions(await getCurrentRequestContext(),(await params).collegeId,input.userId);
  return NextResponse.json({...result,ok:result.revoked>0,
   partial:false,refreshSessions:true,
   message:result.revoked===0?"No active sessions to revoke.":result.message,
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
