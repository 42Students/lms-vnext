import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {listRecruiterCalendarEvents} from "@/modules/placements/recruiter-calendar-service";
import {placementCalendarWindow} from "@/modules/placements/placement-calendar-model";
import {hrCalendarCategorySchema} from "@/modules/placements/hr-calendar-category-model";
import {buildHrCalendarCsv} from "@/modules/placements/hr-calendar-export-model";
export const runtime="nodejs";
export async function GET(request:Request){
 try{
  const p=new URL(request.url).searchParams;
  const allowed=["date","view","category"];
  if([...p.keys()].some(key=>!allowed.includes(key))||
     allowed.some(key=>p.getAll(key).length>1))
   return Response.json({error:"INVALID_QUERY"},{status:400});
  const date=z.iso.date().parse(p.get("date"));
  const view=z.enum(["week","month","agenda"]).parse(p.get("view"));
  const category=hrCalendarCategorySchema.parse(p.get("category")??"ALL");
  const window=placementCalendarWindow(date,view);
  const ctx=await getCurrentRequestContext();
  const calendar=await listRecruiterCalendarEvents(ctx,{from:window.from,to:window.to});
  const result=buildHrCalendarCsv(calendar.events,calendar.resultsDue,category);
  return new Response(result.csv,{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="recruiter-calendar.csv"',
   "Cache-Control":"private, no-store","X-Export-Omitted":String(result.omitted),
  }});
 }catch(error){return apiErrorResponse(error);}
}
