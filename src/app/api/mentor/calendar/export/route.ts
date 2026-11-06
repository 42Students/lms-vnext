import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {listMyMentorCalendarMeetings} from "@/modules/projects/mentor-calendar-service";
import {mentorCalendarFiltersSchema,filterMentorCalendar}
 from "@/modules/projects/mentor-calendar-filter-model";
import {mentorCalendarCsv} from "@/modules/projects/mentor-calendar-export-model";
import {singleValueMentorExportFilters} from "@/modules/projects/mentor-filter-query";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const url=new URL(request.url);
    const filters=singleValueMentorExportFilters(url.searchParams,[
   "sprint","join","projectId","attention","status",
   "type","projectState","search","period",
  ]);
    if(!filters)return NextResponse.json({error:"INVALID_QUERY"},{status:400});
    const query=mentorCalendarFiltersSchema.parse(filters);
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
  },
);
