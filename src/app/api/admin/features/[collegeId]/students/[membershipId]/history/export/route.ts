import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {studentRuleHistoryCursorSchema} from "@/modules/module-access/admin-student-rule-history-model";
import {listSuperAdminStudentRuleHistory} from "@/modules/module-access/admin-student-rule-history-service";
import {studentRuleHistoryCsv} from "@/modules/module-access/admin-student-rule-history-export";
import { route } from "@/security/route";
import { attachmentHeader } from "@/security/downloads";
export const runtime="nodejs";
async function handleGET(request:Request,{params}:{params:Promise<{collegeId:string;membershipId:string}>}){
 try{
  const input:Record<string,string>={};
  for(const [key,value] of new URL(request.url).searchParams){
   if(Object.hasOwn(input,key))return Response.json({error:"INVALID_REQUEST"},{status:400,headers:{"cache-control":"private, no-store"}});
   input[key]=value;
  }
  const filter=studentRuleHistoryCursorSchema.parse(input);
  const {collegeId,membershipId}=await params;
  const result=await listSuperAdminStudentRuleHistory(await getCurrentRequestContext(),collegeId,membershipId,filter);
  if(!result)return Response.json({error:"NOT_FOUND"},{status:404,headers:{"cache-control":"private, no-store"}});
  return new Response(studentRuleHistoryCsv(result.items),{headers:{
   "content-type":"text/csv; charset=utf-8",
   "content-disposition":attachmentHeader("learner-module-rule-history-page.csv"),
   "cache-control":"private, no-store","x-export-row-count":String(result.items.length)
  }});
 }catch(error){return apiErrorResponse(error);}
}
export const GET = route(
  { auth: "user", permission: "service-enforced", stepUp: true },
  ({ request, params }) => handleGET(request as Parameters<typeof handleGET>[0], { params: Promise.resolve(params) } as Parameters<typeof handleGET>[1]),
);
