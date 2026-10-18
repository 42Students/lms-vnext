import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {singleValueMentorExportFilters} from "@/modules/projects/mentor-filter-query";
import {mentorTaskHistoryQuerySchema} from "@/modules/projects/mentor-task-history-model";
import {getMentorTaskReviewHistory} from "@/modules/projects/mentor-task-history-service";
import {mentorReviewedTasksCsv} from "@/modules/projects/mentor-task-review-export-model";
export const runtime="nodejs";
/** Own assigned Mentor project review history only; capped, no raw feedback. */
export async function GET(request:Request){
  try{
    const url=new URL(request.url);
    const filters=singleValueMentorExportFilters(url.searchParams,
      ["decision","priority","order","search"]);
    if(!filters)return NextResponse.json({error:"INVALID_QUERY"},{status:400,
      headers:{"Cache-Control":"private, no-store"}});
    const query=mentorTaskHistoryQuerySchema.parse({...filters,page:1});
    const context=await getCurrentRequestContext();
    const first=await getMentorTaskReviewHistory(context,query);
    if(!first.enabled)return NextResponse.json({error:"PROJECT_ACCESS_DENIED"},{status:403});
    const pages=Math.min(10,first.totalPages);
    const rest=await Promise.all(Array.from({length:pages-1},(_,index)=>
      getMentorTaskReviewHistory(context,{...query,page:index+2})));
    if(rest.some(page=>!page.enabled))
      return NextResponse.json({error:"PROJECT_ACCESS_DENIED"},{status:403});
    const rows=[...first.items,...rest.flatMap(row=>row.items)];
    const omitted=Math.max(0,first.total-rows.length);
    return new Response(mentorReviewedTasksCsv(rows,omitted),{
      headers:{"Content-Type":"text/csv; charset=utf-8",
        "Content-Disposition":'attachment; filename="mentor-reviewed-tasks.csv"',
        "Cache-Control":"private, no-store","X-Export-Omitted":String(omitted)},
    });
  }catch(error){return apiErrorResponse(error);}
}
