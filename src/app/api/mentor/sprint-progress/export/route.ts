import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {singleValueMentorExportFilters} from "@/modules/projects/mentor-filter-query";
import {csvSafeCell} from "@/modules/projects/mentor-board-review-model";
import {mentorSprintProgressQuerySchema} from "@/modules/projects/mentor-sprint-progress-model";
import {getMentorSprintProgress} from "@/modules/projects/mentor-sprint-progress-service";
export const runtime="nodejs";
export async function GET(request:Request){
  try{
    const url=new URL(request.url);
    const filters=singleValueMentorExportFilters(url.searchParams,
      ["projectId","taskAttention","order","state","release","search"]);
    if(!filters)return NextResponse.json({error:"INVALID_QUERY"},{status:400,
      headers:{"Cache-Control":"private, no-store"}});
    const query=mentorSprintProgressQuerySchema.parse({...filters,page:1});
    const context=await getCurrentRequestContext();
    const first=await getMentorSprintProgress(context,query);
    if(!first.enabled)return NextResponse.json({error:"PROJECT_ACCESS_DENIED"},{status:403});
    const rows=[...first.items];
    const pages=Math.min(5,first.totalPages);
    for(let page=2;page<=pages;page++){
      const next=await getMentorSprintProgress(context,{...query,page});
      if(!next.enabled)return NextResponse.json({error:"PROJECT_ACCESS_DENIED"},{status:403});
      rows.push(...next.items);
    }
    const omitted=Math.max(0,first.total-rows.length);
    const csv=["Project,Sprint,Release,Sprint status,Release status,Tasks,Done,In review,Blocked,Completion percent"];
    for(const row of rows){
      const fields=[row.projectTitle,row.title,row.releaseTitle,row.status,row.releaseStatus,
        row.tasks.total,row.tasks.completed,row.tasks.inReview,row.tasks.blocked,
        row.tasks.completionPercent===null?"Unknown":row.tasks.completionPercent];
      csv.push(fields.map(csvSafeCell).join(","));
    }
    if(omitted>0)csv.push(["","Export truncated",omitted+" additional sprints","","","","","","",""]
      .map(csvSafeCell).join(","));
    return new Response("\uFEFF"+csv.join("\r\n")+"\r\n",{
      headers:{"Content-Type":"text/csv; charset=utf-8",
        "Content-Disposition":'attachment; filename="mentor-sprint-progress.csv"',
        "Cache-Control":"private, no-store","X-Export-Omitted":String(omitted)},
    });
  }catch(error){return apiErrorResponse(error);}
}
