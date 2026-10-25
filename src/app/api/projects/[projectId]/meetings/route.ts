import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {readMentorProjectCommandBody,MentorProjectCommandBodyError,mentorProjectBodyFailureMessage}
 from "@/modules/projects/mentor-command-body";
import {
  listProjectMeetings,
  scheduleProjectMeeting,
} from "@/modules/projects/meeting-service";
import {replaceLegacyProjectMeetingDraftSection} from "@/modules/projects/project-meeting-plan-service";
import {parseMentorMeetingCollectionPagination} from "@/modules/projects/mentor-meeting-collection-pagination";

export const runtime = "nodejs";
/** Old bulk PUT /{projectId}/meetings maps to this GET collection plus
 * individual POST create and scoped /{meetingId} PATCH/DELETE mutations.
 * Never replace an entire meeting list without per-meeting version tokens. */

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function GET(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const context = await getCurrentRequestContext();
    const { projectId } = await params;
    const search=new URL(request.url).searchParams;
    const keys=[...search.keys()];
    if(keys.some(key=>!["q","state","archive","page","pageSize"].includes(key)||
      search.getAll(key).length!==1))
      return NextResponse.json({error:"INVALID_MEETING_FILTER"},{status:400});
    const paging=parseMentorMeetingCollectionPagination(search);
    if(!paging.valid)
      return NextResponse.json({error:"INVALID_MEETING_PAGE"},{status:400});
    const {page,pageSize}=paging;
    const state=search.get("state")??"ALL";
    const archive=search.get("archive")??"ACTIVE";
    if(!["ALL","DRAFT","REQUESTED","SCHEDULED","RESCHEDULED","COMPLETED","CANCELLED"].includes(state)||
      !["ACTIVE","INACTIVE","ALL"].includes(archive))
      return NextResponse.json({error:"INVALID_MEETING_FILTER"},{status:400});
    const options={
      ...(search.get("q")!==null?{q:search.get("q")??""}:{}),
      state:state as "ALL"|"DRAFT"|"REQUESTED"|"SCHEDULED"|"RESCHEDULED"|"COMPLETED"|"CANCELLED",
      archive:archive as "ACTIVE"|"INACTIVE"|"ALL",
      ...(page!==null||pageSize!==null?{page:page??1,pageSize:(pageSize??25)+1}:{}),
    };
    const meetings=await listProjectMeetings(context,projectId,options);
    if(page!==null||pageSize!==null){
      const size=pageSize??25;
      return NextResponse.json({meetings:meetings.slice(0,size),
        page:page??1,pageSize:size,hasMore:meetings.length>size},
        {headers:{"Cache-Control":"private, no-store"}});
    }
    return NextResponse.json({meetings},{headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    const { projectId } = await params;
    const body = await readMentorProjectCommandBody(request);
    const meeting = await scheduleProjectMeeting(
      context,
      projectId,
      null,
      body,
    );

    return NextResponse.json(
      { meeting, message: "Project meeting scheduled" },
      { status: 201 },
    );
  } catch (error) {
    if(error instanceof MentorProjectCommandBodyError)
      return NextResponse.json({error:error.code,message:mentorProjectBodyFailureMessage(error.status)},
        {status:error.status});
    return apiErrorResponse(error);
  }
}

/** Old meetings PUT submits the entire draft section with the original token.
 * Do not fan out into POST/PATCH requests: a partial write would break legacy
 * replace semantics. Scheduled or completed meetings remain protected.
 */
export async function PUT(request:Request,{params}:RouteContext){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {projectId}=await params;
  const raw=await request.text();
  if(raw.length>250000)
    return NextResponse.json({error:"INVALID_REQUEST"},{status:413});
  let body:unknown;
  try{body=JSON.parse(raw);}catch{
   return NextResponse.json({error:"INVALID_BODY"},{status:400});
  }
  const result=await replaceLegacyProjectMeetingDraftSection(
    await getCurrentRequestContext(),projectId,body);
  return NextResponse.json({...result,message:result.changed?"Meetings updated":"No changes to save"},
    {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
