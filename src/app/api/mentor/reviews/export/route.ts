import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getMentorReviewQueue} from "@/modules/projects/mentor-portfolio-service";
import {mentorReviewQuerySchema} from "@/modules/projects/mentor-portfolio-model";
import {singleValueMentorExportFilters} from "@/modules/projects/mentor-filter-query";
import {mentorReviewExportCsv} from "@/modules/projects/mentor-review-export-model";
export const runtime="nodejs";

/** Capped metadata export from the live persisted Mentor assignment scope only. */
export async function GET(request:Request){
 try{
  const filters=singleValueMentorExportFilters(new URL(request.url).searchParams,[
   "projectId","projectStatus","assignment","search","order","age",
  ]);
  if(!filters)return NextResponse.json({error:"INVALID_QUERY"},{status:400,
   headers:{"Cache-Control":"private, no-store"}});
  const query=mentorReviewQuerySchema.parse({...filters,page:1,pageSize:50});
  const context=await getCurrentRequestContext();
  const first=await getMentorReviewQueue(context,query);
  if(!first.enabled)return NextResponse.json({error:"PROJECT_ACCESS_DENIED"},{status:403,
   headers:{"Cache-Control":"private, no-store"}});
  const rows=[...first.items];
  for(let page=2;page<=Math.min(first.totalPages,4);page++){
   const next=await getMentorReviewQueue(context,{...query,page});
   if(!next.enabled)return NextResponse.json({error:"PROJECT_ACCESS_DENIED"},{status:403,
    headers:{"Cache-Control":"private, no-store"}});
   rows.push(...next.items);
  }
  const titles=new Map(first.projects.map(row=>[row.id,row.title]));
  const csv=mentorReviewExportCsv(rows.map(row=>({
   projectId:row.projectId,
   projectTitle:titles.get(row.projectId)??"Assigned project",
   occurredAt:new Date(row.occurredAt),
  })),Math.max(0,first.total-rows.length));
  return new Response(csv,{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="mentor-delivery-reviews.csv"',
   "Cache-Control":"private, no-store",
   "X-Export-Omitted":String(Math.max(0,first.total-rows.length)),
  }});
 }catch(error){return apiErrorResponse(error);}
}
