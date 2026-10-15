import {getCurrentRequestContext} from "@/auth/request-context";
import {bugTrackerApiError} from "@/lib/bug-tracker-api-error";
import {listBugTrackerIssuesForAdmin} from "@/modules/bug-tracker/admin-service";
import {trackerAdminRuntimeEnabled} from "@/modules/bug-tracker/readiness";
import {parseAuditFindingsSearchParams,trackerAuditFindingsInput} from "@/modules/bug-tracker/audit-findings-board-model";
import {auditFindingsCsv} from "@/modules/bug-tracker/audit-findings-csv-model";
export const runtime="nodejs";
export async function GET(request:Request){
 if(!trackerAdminRuntimeEnabled())return Response.json({error:"DB10_TRACKER_MIGRATIONS_PENDING"},{status:503,headers:{"cache-control":"private, no-store"}});
 const raw:Record<string,string>={};
 for(const [key,value] of new URL(request.url).searchParams){
  if(Object.hasOwn(raw,key))return Response.json({error:"INVALID_REQUEST"},{status:400});
  raw[key]=value;
 }
 const parsed=parseAuditFindingsSearchParams(raw);
 if(!parsed)return Response.json({error:"INVALID_REQUEST"},{status:400});
 try{
  const data=await listBugTrackerIssuesForAdmin(await getCurrentRequestContext(),trackerAuditFindingsInput(parsed));
  return new Response(auditFindingsCsv(data.items),{headers:{
   "content-type":"text/csv; charset=utf-8",
   "content-disposition":'attachment; filename="audit-findings-page.csv"',
   "cache-control":"private, no-store","x-export-row-count":String(data.items.length),
  }});
 }catch(error){return bugTrackerApiError(error);}
}
