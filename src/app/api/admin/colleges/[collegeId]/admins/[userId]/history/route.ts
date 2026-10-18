import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {listCollegeAdminHistory} from "@/modules/colleges/admin-session-service";
import {collegeAdminHistoryCsv} from "@/modules/colleges/admin-history-export-model";
import {parseAdminSessionHistoryPage} from "@/modules/colleges/admin-session-query-model";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request,{params}:{params:Promise<{collegeId:string;userId:string}>}){
 try{
  const {collegeId,userId}=await params;
  const search = new URL(request.url).searchParams;
  const raw:Record<string,string|string[]|undefined>={};
  for(const key of search.keys()){
    const values=search.getAll(key);
    raw[key]=values.length===1?values[0]:values;
  }
  const page=parseAdminSessionHistoryPage(raw);
  if(page===null)return new Response("Choose a valid history page without repeated or unrelated filters.",{
    status:400,headers:{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"private, no-store"},
  });
  const data=await listCollegeAdminHistory(await getCurrentRequestContext(),collegeId,userId,page);
  return new Response(collegeAdminHistoryCsv(data.events),{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="college-admin-history.csv"',
   "Cache-Control":"private, no-store, max-age=0",
   "X-Content-Type-Options":"nosniff",
   "X-Export-Truncated":String(data.truncated),
   Vary:"Cookie",
  }});
 }catch(error){
  const response=apiErrorResponse(error);response.headers.set("Cache-Control","private, no-store");
  return response;
 }
}
