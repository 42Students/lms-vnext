import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {mentorTaskReviewQuerySchema} from "@/modules/projects/mentor-task-review-model";
import {singleValueMentorExportFilters} from "@/modules/projects/mentor-filter-query";
import {getMentorTaskReviews} from "@/modules/projects/mentor-task-review-service";
import {mentorPendingTaskReviewCsv} from "@/modules/projects/mentor-pending-task-review-export";
export const runtime="nodejs";
export async function GET(request:Request){
 try{
  const url=new URL(request.url);
  const filters=singleValueMentorExportFilters(url.searchParams,[
   "search","projectId","assignment","priority","version","age","order",
  ]);
  if(!filters)return NextResponse.json({error:"INVALID_QUERY"},{status:400});
  const query=mentorTaskReviewQuerySchema.parse({...filters,page:1,pageSize:50});
  const ctx=await getCurrentRequestContext();
  const first=await getMentorTaskReviews(ctx,query);
  if(!first.enabled)return NextResponse.json({error:"PROJECT_ACCESS_DENIED"},{status:403});
  const pages=Math.min(4,first.totalPages);
  const rest=await Promise.all(Array.from({length:pages-1},(_,i)=>
   getMentorTaskReviews(ctx,{...query,page:i+2})));
  if(rest.some(row=>!row.enabled))
   return NextResponse.json({error:"PROJECT_ACCESS_DENIED"},{status:403});
  const rows=[...first.items,...rest.flatMap(p=>p.items)];
  const omitted=Math.max(0,first.total-rows.length);
  return new Response(mentorPendingTaskReviewCsv(rows,omitted),{
   headers:{"Content-Type":"text/csv; charset=utf-8",
    "Content-Disposition":'attachment; filename="mentor-pending-task-reviews.csv"',
    "Cache-Control":"private, no-store","X-Export-Omitted":String(omitted)},
  });
 }catch(error){return apiErrorResponse(error);}
}
