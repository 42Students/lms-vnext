import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { collegeAdminSessionDisplay, listCollegeAdminSessions, revokeCollegeAdminSessions } from "@/modules/colleges/admin-session-service";
import { readBoundedJsonRequest } from "@/lib/bounded-json-request";
import { route } from "@/security/route";
export const runtime = "nodejs";
type RouteContext = {params:Promise<{collegeId:string}>};
async function handleGET(request:Request,{params}:RouteContext){
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
  // Raw SQL results are surfaced as unknown records by the DB driver.
  // Validate the session projection before formatting its sensitive fields.
  const sessionRow=z.object({
   id:z.uuid(),device_name:z.string().nullable(),user_agent:z.string().nullable(),
   ip_address:z.string().nullable(),last_seen_at:z.union([z.date(),z.string()]),
   created_at:z.union([z.date(),z.string()]),expires_at:z.union([z.date(),z.string()]),
  });
  const sessions=result.devices.map(raw=>{
   const row=sessionRow.parse(raw);
   return {id:row.id,...collegeAdminSessionDisplay(row),
    createdAt:row.created_at,expiresAt:row.expires_at};
  });
  return NextResponse.json({...result,sessions,sessionCount:sessions.length},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handleGET(request as Parameters<typeof handleGET>[0], { params: Promise.resolve(params) } as Parameters<typeof handleGET>[1]),
);
async function handlePOST(request:Request,{params}:RouteContext){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const _parsed=await readBoundedJsonRequest(request,8192);
  if(!_parsed.ok)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  const input=z.strictObject({userId:z.uuid(),confirm:z.literal(true)}).parse(_parsed.value);
  // Unlike the legacy bodyless revoke endpoint, explicit target UUID and
  // confirmation guard against cross-college or accidental sign-outs.
  const result=await revokeCollegeAdminSessions(await getCurrentRequestContext(),(await params).collegeId,input.userId);
  return NextResponse.json({...result,ok:result.revoked>0,
   partial:false,refreshSessions:true,
   message:result.revoked===0?"No active sessions to revoke.":result.message,
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);
