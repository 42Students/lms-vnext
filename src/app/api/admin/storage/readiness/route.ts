import {getCurrentRequestContext} from "@/auth/request-context";
import {isSuperAdmin} from "@/modules/identity/context";
import {apiErrorResponse} from "@/lib/api-error";
import {privateR2SetupState} from "@/modules/storage/r2-config";

export const runtime="nodejs";
export const dynamic="force-dynamic";

/** Optional-storage capability probe. It never exposes bucket names or credentials
 * and does not make unrelated app readiness depend on R2 provisioning. */
export async function GET(){
 try{
  const context=await getCurrentRequestContext();
  if(!isSuperAdmin(context))
   return Response.json({error:"FORBIDDEN"},{status:403,headers:{"Cache-Control":"private, no-store"}});
  const readiness=privateR2SetupState();
  return Response.json({storage:"private-r2",...readiness},{status:readiness.status,
   headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
