import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {singleValueMentorExportFilters} from "@/modules/projects/mentor-filter-query";
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
  const filters=singleValueMentorExportFilters(url.searchParams,
   ["status","feedback","version"]);
  if(!filters)return NextResponse.json({error:"INVALID_QUERY"},{status:400,
   headers:{"Cache-Control":"private, no-store"}});
  const query=mentorReviewOverviewSchema.parse({projectId,...filters,page:1});
  const context=await getCurrentRequestContext();
  const first=await getMentorDeliveryReviewOverview(context,query);
  if(!first.enabled)return NextResponse.json({error:"PROJECT_ACCESS_DENIED"},{status:403,
   headers:{"Cache-Control":"private, no-store"}});
  const pages=Math.min(10,first.totalPages);
  const rest=await Promise.all(Array.from({length:pages-1},(_,i)=>
   getMentorDeliveryReviewOverview(context,{...query,page:i+2})));
  // A disabled entitlement or revoked membership during pagination must not
  // yield a partial CSV with records from an earlier authorized page.
  if(rest.some(page=>!page.enabled))
   return NextResponse.json({error:"PROJECT_ACCESS_DENIED"},{status:403,
    headers:{"Cache-Control":"private, no-store"}});
  const rows=[...first.items,...rest.flatMap(row=>row.items)];
  const omitted=Math.max(0,first.total-rows.length);
  return new Response(mentorDeliveryReviewCsv(rows,omitted),{
   headers:{"Content-Type":"text/csv; charset=utf-8",
    "Content-Disposition":'attachment; filename="mentor-delivery-reviews.csv"',
    "Cache-Control":"private, no-store","X-Export-Omitted":String(omitted)},
  });
 }catch(error){return apiErrorResponse(error);}
}
