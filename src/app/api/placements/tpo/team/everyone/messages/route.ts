import {NextResponse} from "next/server";
import {ZodError} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {BoundedFormDataError,readBoundedFormData} from "@/lib/bounded-form-data";
import {AuthorizationError} from "@/modules/permissions/policy";
import {postTpoTeamEveryoneMessage} from "@/modules/placements/tpo-team-everyone-service";
import { route } from "@/security/route";
import { CACHE, noStoreJson } from "@/security/responses";
export const runtime="nodejs";
async function handlePOST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  const form=await readBoundedFormData(request,16*1024);
  const result=await postTpoTeamEveryoneMessage(context,{body:form.get("body")});
  if(request.headers.get("accept")?.includes("application/json"))
   return noStoreJson(result);
  return NextResponse.redirect(new URL("/tpo/team/everyone",request.url),303);
 }catch(error){
  if(error instanceof BoundedFormDataError)return NextResponse.json({
   error:error.code==="BODY_TOO_LARGE"?"REQUEST_TOO_LARGE":"INVALID_BODY",
  },{status:error.code==="BODY_TOO_LARGE"?413:400,headers:{"Cache-Control":CACHE.PRIVATE}});
  if(error instanceof ZodError)return NextResponse.json({error:"INVALID_BODY"},{status:422});
  if(error instanceof AuthorizationError)return NextResponse.json({error:"FORBIDDEN"},{status:403});
  if(error instanceof Error&&error.message==="TEAM_TABLES_PENDING")
   return NextResponse.json({error:"TEAM_TABLES_PENDING"},{status:503});
  throw error;
 }
}
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);
