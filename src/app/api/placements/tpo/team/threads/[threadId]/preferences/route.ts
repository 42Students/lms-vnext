import {NextResponse} from "next/server";
import {ZodError} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {AuthorizationError} from "@/modules/permissions/policy";
import {updateTpoTeamThreadPreferences} from "@/modules/placements/tpo-team-preferences-service";
import { route } from "@/security/route";
export const runtime="nodejs";
async function handlePOST(request:Request,{params}:{params:Promise<{threadId:string}>}){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {threadId}=await params;
  const body=await request.json().catch(()=>null) as {action?:unknown}|null;
  const result=await updateTpoTeamThreadPreferences(await getCurrentRequestContext(),{
   threadId,action:body?.action,
  });
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof ZodError)return NextResponse.json({error:"INVALID_REQUEST"},{status:422});
  if(error instanceof AuthorizationError)return NextResponse.json({error:"FORBIDDEN"},{status:403});
  if(error instanceof Error&&error.message==="TEAM_THREAD_NOT_FOUND")
   return NextResponse.json({error:"NOT_FOUND"},{status:404});
  if(error instanceof Error&&error.message==="TEAM_PREFERENCES_PENDING")
   return NextResponse.json({error:"NOT_READY"},{status:503});
  throw error;
 }
}
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);
