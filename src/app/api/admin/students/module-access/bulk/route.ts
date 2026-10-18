import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";
import {updateSuperAdminStudentRulesInBulk} from "@/modules/module-access/super-admin-student-bulk-rule-service";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return Response.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const command=await readBoundedJsonRequest(request,8192);
  if(!command.ok)return Response.json({error:"INVALID_REQUEST"},{status:400});
  return Response.json(await updateSuperAdminStudentRulesInBulk(
   await getCurrentRequestContext(),command.value),
   {headers:{"Cache-Control":"private, no-store"}});
 }
 catch(error){return apiErrorResponse(error);}
}
