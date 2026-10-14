import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {mentorProjectActivityQuerySchema} from "@/modules/projects/mentor-project-activity-model";
import {getMentorProjectActivityHistory}
  from "@/modules/projects/mentor-project-activity-service";
import {mentorActivityCsv} from "@/modules/projects/mentor-project-activity-export-model";
export const runtime="nodejs";
type RouteContext={params:Promise<{projectId:string}>};
/** Read-only, strict project and current Mentor scope; no external sending. */
export async function GET(request:Request,{params}:RouteContext){
  try{
    const {projectId}=await params;
    const url=new URL(request.url);
    const query=mentorProjectActivityQuerySchema.parse({
      projectId,importance:url.searchParams.get("importance")??undefined,page:1,
    });
    const context=await getCurrentRequestContext();
    const first=await getMentorProjectActivityHistory(context,query);
    if(!first.enabled)return NextResponse.json({error:"PROJECT_ACCESS_DENIED"},{status:403});
    const pages=Math.min(10,first.totalPages);
    const rest=await Promise.all(Array.from({length:pages-1},(_,i)=>
      getMentorProjectActivityHistory(context,{...query,page:i+2})));
    if(rest.some(page=>!page.enabled))
      return NextResponse.json({error:"PROJECT_ACCESS_DENIED"},{status:403});
    const rows=[...first.items,...rest.flatMap(page=>page.items)];
    const omitted=Math.max(0,first.total-rows.length);
    return new Response(mentorActivityCsv(rows,omitted),{
      headers:{"Content-Type":"text/csv; charset=utf-8",
        "Content-Disposition":'attachment; filename="mentor-project-activity.csv"',
        "Cache-Control":"private, no-store",
        "X-Export-Omitted":String(omitted)},
    });
  }catch(error){return apiErrorResponse(error);}
}
