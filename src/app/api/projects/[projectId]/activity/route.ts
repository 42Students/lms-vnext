import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getProjectActivityPage} from "@/modules/projects/activity-service";
import {parseLearnerProjectActivityFilters} from "@/modules/projects/learner-project-activity-filter-model";

export const runtime="nodejs";
export async function GET(request:Request,{params}:{
 params:Promise<{projectId:string}>;
}){
 try{
  const {projectId}=await params;
  const url=new URL(request.url);
  const parsed=parseLearnerProjectActivityFilters({
    category:url.searchParams.get("category")??url.searchParams.get("sourceTab")??undefined,
    from:url.searchParams.get("fromDate")??url.searchParams.get("from")??undefined,
    to:url.searchParams.get("toDate")??url.searchParams.get("to")??undefined,
    beforeTime:url.searchParams.get("beforeTime")??undefined,
    beforeId:url.searchParams.get("beforeId")??undefined,
  });
  if(!parsed.success)return NextResponse.json({error:"INVALID_ACTIVITY_CURSOR"},{status:400});
  // Access is checked inside the query against the current project and college.
  const page=await getProjectActivityPage(await getCurrentRequestContext(),projectId,parsed.data);
  const last=page.events.at(-1);
  return NextResponse.json({
    events:page.events.map(({cursorOccurredAt,...event})=>event),
    hasMore:page.hasMore,
    nextCursor:last&&page.hasMore?{time:last.cursorOccurredAt,id:last.id}:null,
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
