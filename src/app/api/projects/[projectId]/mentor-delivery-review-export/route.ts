import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {singleValueMentorExportFilters} from "@/modules/projects/mentor-filter-query";
import {mentorReviewOverviewSchema,mentorDeliveryReviewCsv}
 from "@/modules/projects/mentor-review-overview-model";
import {getMentorDeliveryReviewOverview}
 from "@/modules/projects/mentor-review-overview-service";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
type RouteContext={params:Promise<{projectId:string}>};
/** Read-only exact-project Mentor audit summary. No raw feedback, identity or URLs. */
export const GET = route(
  { auth: "user", permission: "service-enforced", stepUp: true },
  async ({ request, context: __actor, params }) => {
    const context = __actor!;
    const {projectId}=params,url=new URL(request.url);
    const filters=singleValueMentorExportFilters(url.searchParams,
   ["status","feedback","version"]);
    if(!filters)return NextResponse.json({error:"INVALID_QUERY"},{status:400,
   headers:{"Cache-Control":CACHE.PRIVATE}});
    const query=mentorReviewOverviewSchema.parse({projectId,...filters,page:1});
    const first=await getMentorDeliveryReviewOverview(context,query);
    const pages=Math.min(10,first.totalPages);
    const rest=await Promise.all(Array.from({length:pages-1},(_,i)=>
   getMentorDeliveryReviewOverview(context,{...query,page:i+2})));
    const rows=[...first.items,...rest.flatMap(row=>row.items)];
    const omitted=Math.max(0,first.total-rows.length);
    return new Response(mentorDeliveryReviewCsv(rows,omitted),{
   headers:{"Content-Type":"text/csv; charset=utf-8",
    "Content-Disposition":'attachment; filename="mentor-delivery-reviews.csv"',
    "Cache-Control":CACHE.PRIVATE,"X-Export-Omitted":String(omitted)},
  });
  },
);
