import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getMentorPortfolioActivity} from "@/modules/projects/mentor-portfolio-service";
import {mentorActivityQuerySchema} from "@/modules/projects/mentor-portfolio-model";
import {mentorPortfolioActivityCsv} from "@/modules/projects/mentor-portfolio-activity-export-model";
export const runtime="nodejs";

/** Current, college-scoped Mentor projects only; never exports raw activity metadata. */
export async function GET(request:Request){
 try{
  const params=new URL(request.url).searchParams;
  const query=mentorActivityQuerySchema.parse({
   projectId:params.get("projectId")??undefined,
   projectStatus:params.get("projectStatus")??undefined,
   assignment:params.get("assignment")??undefined,
   search:params.get("search")??undefined,
   order:params.get("order")??undefined,
   window:params.get("window")??undefined,
   importance:params.get("importance")??undefined,
   view:params.get("view")??undefined,
   page:1,pageSize:50,
  });
  const context=await getCurrentRequestContext();
  const first=await getMentorPortfolioActivity(context,query);
  if(!first.enabled) return NextResponse.json({error:"PROJECT_ACCESS_DENIED"},{status:403});
  const rows=[...first.items];
  const pages=Math.min(4,first.totalPages);
  for(let page=2;page<=pages;page++){
   const next=await getMentorPortfolioActivity(context,{...query,page});
   if(!next.enabled)return NextResponse.json({error:"PROJECT_ACCESS_DENIED"},{status:403});
   rows.push(...next.items);
  }
  const omitted=Math.max(0,first.total-rows.length);
  return new Response(mentorPortfolioActivityCsv(rows,omitted),{
   headers:{
    "Content-Type":"text/csv; charset=utf-8",
    "Content-Disposition":'attachment; filename="mentor-portfolio-activity.csv"',
    "Cache-Control":"private, no-store",
    "X-Export-Omitted":String(omitted),
   },
  });
 }catch(error){return apiErrorResponse(error);}
}
