import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getMentorBoardReview} from "@/modules/projects/mentor-board-review-service";
import {mentorBoardExportCsv,mentorBoardReviewQuerySchema}
  from "@/modules/projects/mentor-board-review-model";
export const runtime="nodejs";
type RouteContext={params:Promise<{projectId:string}>};
export async function GET(request:Request,{params}:RouteContext){
  try{
    const {projectId}=await params;
    const url=new URL(request.url);
    const query=mentorBoardReviewQuerySchema.parse({
      projectId,status:url.searchParams.get("status")??undefined,
      priority:url.searchParams.get("priority")??undefined,
      sprintId:url.searchParams.get("sprintId")??undefined,
      search:url.searchParams.get("search")??undefined,page:1,
    });
    const data=await getMentorBoardReview(await getCurrentRequestContext(),query);
    if(!data.enabled)return NextResponse.json({error:"PROJECT_ACCESS_DENIED"},{status:403});
    return new Response(mentorBoardExportCsv(data.exportItems,data.exportOmitted),{
      status:200,headers:{"Content-Type":"text/csv; charset=utf-8",
        "Content-Disposition":'attachment; filename="mentor-board.csv"',
        "Cache-Control":"private, no-store",
        "X-Export-Omitted":String(data.exportOmitted)},
    });
  }catch(error){return apiErrorResponse(error);}
}
