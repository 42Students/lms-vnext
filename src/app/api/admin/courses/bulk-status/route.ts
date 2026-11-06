import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";
import {bulkSuperAdminCourseVisibility} from "@/modules/courses/super-admin-course-bulk-visibility";
import { secured } from "@/security/secure-handler";

export const runtime="nodejs";
async function handlePOST(request:Request){
 if(!isSameOriginRequest(request))return Response.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const parsed=await readBoundedJsonRequest(request,16384);
  if(!parsed.ok)return Response.json({error:"INVALID_REQUEST"},{status:400});
  const result=await bulkSuperAdminCourseVisibility(await getCurrentRequestContext(),parsed.value);
  return Response.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export const POST = secured(handlePOST);
