import {NextResponse} from "next/server";
import {ZodError} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {AuthorizationError} from "@/modules/permissions/policy";
import {setTpoTeamEveryoneMuted} from "@/modules/placements/tpo-team-everyone-service";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const form=await request.formData().catch(()=>null);
 try{
  await setTpoTeamEveryoneMuted(await getCurrentRequestContext(),{muted:form?.get("muted")==="true"});
  return NextResponse.redirect(new URL("/tpo/team/everyone",request.url),303);
 }catch(error){
  if(error instanceof ZodError)return NextResponse.json({error:"INVALID_BODY"},{status:422});
  if(error instanceof AuthorizationError)return NextResponse.json({error:"FORBIDDEN"},{status:403});
  if(error instanceof Error&&error.message==="TEAM_TABLES_PENDING")
   return NextResponse.json({error:"TEAM_TABLES_PENDING"},{status:503});
  throw error;
 }
}
