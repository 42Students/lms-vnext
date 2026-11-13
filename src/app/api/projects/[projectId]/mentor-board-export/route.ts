import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {singleValueMentorExportFilters} from "@/modules/projects/mentor-filter-query";
import {getMentorBoardReview} from "@/modules/projects/mentor-board-review-service";
import {mentorBoardExportCsv,mentorBoardReviewQuerySchema}
  from "@/modules/projects/mentor-board-review-model";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
type RouteContext={params:Promise<{projectId:string}>};
export const GET = route(
  { auth: "user", permission: "service-enforced", stepUp: true },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {projectId}=params;
    const url=new URL(request.url);
    const filters=singleValueMentorExportFilters(url.searchParams,
      ["status","priority","sprintId","search"]);
    if(!filters)return NextResponse.json({error:"INVALID_QUERY"},{status:400,
      headers:{"Cache-Control":CACHE.PRIVATE}});
    const query=mentorBoardReviewQuerySchema.parse({projectId,...filters,page:1});
    const data=await getMentorBoardReview(__ctx,query);
    if(!data.enabled)return NextResponse.json({error:"PROJECT_ACCESS_DENIED"},{status:403});
    return new Response(mentorBoardExportCsv(data.exportItems,data.exportOmitted),{
      status:200,headers:{"Content-Type":"text/csv; charset=utf-8",
        "Content-Disposition":'attachment; filename="mentor-board.csv"',
        "Cache-Control":CACHE.PRIVATE,
        "X-Export-Omitted":String(data.exportOmitted)},
    });
  },
);
