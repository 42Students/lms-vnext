import {NextResponse} from "next/server";
import {ZodError} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {AuthorizationError} from "@/modules/permissions/policy";
import {updateTpoTeamThreadPreferences} from "@/modules/placements/tpo-team-preferences-service";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{threadId:string}>}){
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
