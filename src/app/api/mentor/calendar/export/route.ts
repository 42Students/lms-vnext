import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {listMyMentorCalendarMeetings} from "@/modules/projects/mentor-calendar-service";
import {mentorCalendarFiltersSchema,filterMentorCalendar}
 from "@/modules/projects/mentor-calendar-filter-model";
import {mentorCalendarCsv} from "@/modules/projects/mentor-calendar-export-model";
export const runtime="nodejs";
export async function GET(request:Request){
 try{
  const url=new URL(request.url);
  const query=mentorCalendarFiltersSchema.parse({
   sprint:url.searchParams.get("sprint")??undefined,
   join:url.searchParams.get("join")??undefined,
   projectId:url.searchParams.get("projectId")??undefined,
   attention:url.searchParams.get("attention")??undefined,
   status:url.searchParams.get("status")??undefined,
   type:url.searchParams.get("type")??undefined,
   projectState:url.searchParams.get("projectState")??undefined,
   search:url.searchParams.get("search")??undefined,
   period:url.searchParams.get("period")??undefined,
  });
  const context=await getCurrentRequestContext();
  if(!(await resolveOptionalModuleAccess(context)).projects.enabled)
   return NextResponse.json({error:"PROJECT_ACCESS_DENIED"},{status:403});
  const records=await listMyMentorCalendarMeetings(context);
  const matched=filterMentorCalendar(records,query,new Date());
  const rows=matched.slice(0,200),omitted=matched.length-rows.length;
  return new Response(mentorCalendarCsv(rows,omitted),{
   headers:{"Content-Type":"text/csv; charset=utf-8",
    "Content-Disposition":'attachment; filename="mentor-meetings-calendar.csv"',
    "Cache-Control":"private, no-store","X-Export-Omitted":String(omitted)},
  });
 }catch(error){return apiErrorResponse(error);}
}
