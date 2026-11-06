import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {readModuleDisableImpact} from "@/modules/module-access/admin-module-impact-service";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
async function handleGET(request:Request,{params}:{params:Promise<{collegeId:string}>}){
 try{
  const {collegeId}=await params;
  const moduleName=new URL(request.url).searchParams.get("module")??"";
  const result=await readModuleDisableImpact(await getCurrentRequestContext(),collegeId,moduleName);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export const GET = secured(handleGET);
