import {apiErrorResponse} from "@/lib/api-error";
import {getCurrentRequestContext} from "@/auth/request-context";
import {collegePolicyHistoryQuery} from "@/modules/module-access/admin-college-rule-history-model";
import {listCollegeFeatureHistory} from "@/modules/module-access/admin-college-rule-history-service";
import {collegePolicyHistoryCsv} from "@/modules/module-access/admin-college-rule-history-export";
export const runtime="nodejs";
export async function GET(request:Request,{params}:{params:Promise<{collegeId:string}>}){
 try{
  const input:Record<string,string>={};
  for(const [key,value] of new URL(request.url).searchParams){
   if(Object.hasOwn(input,key))return Response.json({error:"INVALID_REQUEST"},{status:400,headers:{"cache-control":"private, no-store"}});
   input[key]=value;
  }
  const cursor=collegePolicyHistoryQuery.parse(input);
  const {collegeId}=await params;
  const result=await listCollegeFeatureHistory(await getCurrentRequestContext(),collegeId,cursor);
  if(!result)return Response.json({error:"NOT_FOUND"},{status:404,headers:{"cache-control":"private, no-store"}});
  return new Response(collegePolicyHistoryCsv(result.items),{headers:{
   "content-type":"text/csv; charset=utf-8",
   "content-disposition":'attachment; filename="college-feature-rule-history-page.csv"',
   "cache-control":"private, no-store",
   "x-export-row-count":String(result.items.length),
  }});
 }catch(error){return apiErrorResponse(error);}
}
