import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {mentorReviewOverviewSchema,mentorDeliveryReviewCsv}
 from "@/modules/projects/mentor-review-overview-model";
import {getMentorDeliveryReviewOverview}
 from "@/modules/projects/mentor-review-overview-service";
export const runtime="nodejs";
type RouteContext={params:Promise<{projectId:string}>};
/** Read-only exact-project Mentor audit summary. No raw feedback, identity or URLs. */
export async function GET(request:Request,{params}:RouteContext){
 try{
  const {projectId}=await params,url=new URL(request.url);
  const query=mentorReviewOverviewSchema.parse({
   projectId,status:url.searchParams.get("status")??undefined,
   feedback:url.searchParams.get("feedback")??undefined,
   version:url.searchParams.get("version")??undefined,page:1,
  });
  const context=await getCurrentRequestContext();
  const first=await getMentorDeliveryReviewOverview(context,query);
  const pages=Math.min(10,first.totalPages);
  const rest=await Promise.all(Array.from({length:pages-1},(_,i)=>
   getMentorDeliveryReviewOverview(context,{...query,page:i+2})));
  const rows=[...first.items,...rest.flatMap(row=>row.items)];
  const omitted=Math.max(0,first.total-rows.length);
  return new Response(mentorDeliveryReviewCsv(rows,omitted),{
   headers:{"Content-Type":"text/csv; charset=utf-8",
    "Content-Disposition":'attachment; filename="mentor-delivery-reviews.csv"',
    "Cache-Control":"private, no-store","X-Export-Omitted":String(omitted)},
  });
 }catch(error){return apiErrorResponse(error);}
}
