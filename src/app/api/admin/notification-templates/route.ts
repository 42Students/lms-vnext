import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {isSuperAdmin} from "@/modules/identity/context";
import {zeptoMailTemplateReadiness,logInitialZeptoMailTemplateReadiness} from "@/modules/notifications/zeptomail-template-readiness";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
export const dynamic="force-dynamic";
async function handleGET(){
 try{
  const context=await getCurrentRequestContext();
  if(!isSuperAdmin(context)||context.adminScope?.collegeId||context.adminScope?.organizationId)
   return NextResponse.json({error:"FORBIDDEN"},{status:403,headers:{"Cache-Control":"private, no-store"}});
  logInitialZeptoMailTemplateReadiness();
  return NextResponse.json(zeptoMailTemplateReadiness(),{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export const GET = secured(handleGET);
