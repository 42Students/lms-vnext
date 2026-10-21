import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";
import {applyCollegeStudentModuleBulk,previewCollegeStudentModuleBulk}
 from "@/modules/module-access/college-student-bulk-rule-service";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
   return Response.json({error:"INVALID_ORIGIN"},{status:403});
 try{
   const command=await readBoundedJsonRequest(request,16384);
   if(!command.ok)return Response.json({error:"INVALID_REQUEST"},{status:400});
   const raw:unknown=command.value;
   if(!raw||typeof raw!=="object"||Array.isArray(raw)||!("action" in raw))
     return Response.json({error:"INVALID_REQUEST"},{status:400});
   if(raw.action==="PREVIEW")
     return Response.json(await previewCollegeStudentModuleBulk(
       await getCurrentRequestContext(),raw),{headers:{"Cache-Control":"private, no-store"}});
   if(raw.action==="APPLY")
     return Response.json(await applyCollegeStudentModuleBulk(
       await getCurrentRequestContext(),raw),{headers:{"Cache-Control":"private, no-store"}});
   return Response.json({error:"INVALID_REQUEST"},{status:400});
 }catch(error){return apiErrorResponse(error);}
}
