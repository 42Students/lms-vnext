import { gridExportFilename } from "@/modules/placements/grid-export-filename";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {hrNotificationsQuerySchema} from "@/modules/placements/hr-notifications-model";
import {listHrNotifications} from "@/modules/placements/hr-notifications-service";
import {buildHrInboxCsv,HR_INBOX_CSV_CAP} from "@/modules/placements/hr-inbox-csv-model";
export const runtime="nodejs";
export async function GET(request:Request){
 try{
  const params=new URL(request.url).searchParams;
  const allowed=["collegeId","unreadOnly","q"];
  if([...params.keys()].some(key=>!allowed.includes(key))||
     allowed.some(key=>params.getAll(key).length>1))
   return NextResponse.json({error:"INVALID_QUERY"},{status:400});
  const query=hrNotificationsQuerySchema.parse({
   collegeId:params.get("collegeId")??undefined,
   unreadOnly:params.get("unreadOnly")??undefined,
   q:params.get("q")??undefined,page:1,
  });
  const context=await getCurrentRequestContext();
  const first=await listHrNotifications(context,query);
  if(first.status!=="READY")return NextResponse.json({error:"COLLEGE_REQUIRED"},{status:403});
  const total=query.unreadOnly==="true"?first.unread:first.total;
  const rows=[...first.rows];
  const pages=Math.min(first.pages,Math.ceil(HR_INBOX_CSV_CAP/25));
  for(let page=2;page<=pages;page++){
   const next=await listHrNotifications(context,{...query,page});
   if(next.status!=="READY"||next.collegeId!==first.collegeId)
    return NextResponse.json({error:"COLLEGE_SCOPE_CHANGED"},{status:403});
   rows.push(...next.rows);
  }
  const result=buildHrInboxCsv(rows,total);
  return new Response(result.csv,{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="' + gridExportFilename("recruiter-notifications", "csv") + '"',
   "Cache-Control":"private, no-store",
   "X-Export-Omitted":String(result.omitted),
  }});
 }catch(error){return apiErrorResponse(error);}
}
