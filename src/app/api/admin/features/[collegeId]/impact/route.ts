import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {readModuleDisableImpact} from "@/modules/module-access/admin-module-impact-service";
export const runtime="nodejs";
export async function GET(request:Request,{params}:{params:Promise<{collegeId:string}>}){
 try{
  const {collegeId}=await params;
  const module=new URL(request.url).searchParams.get("module")??"";
  const result=await readModuleDisableImpact(await getCurrentRequestContext(),collegeId,module);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
