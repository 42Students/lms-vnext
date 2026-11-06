import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {restoreGlobalCompany} from "@/modules/placements/super-admin-company-restore-service";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
async function handlePOST(request:Request){
 if(!isSameOriginRequest(request))return Response.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const parsed=await readBoundedJsonRequest(request,8192);
  if(!parsed.ok)return Response.json({error:"INVALID_REQUEST"},{status:400});
  return Response.json(await restoreGlobalCompany(await getCurrentRequestContext(),parsed.value),
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export const POST = secured(handlePOST);
