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
    const pageText=search.get("page"),sizeText=search.get("pageSize");
    const page=pageText&&/^[1-9]\\d{0,4}$/.test(pageText)?Number(pageText):null;
    const pageSize=sizeText&&/^[1-9]\\d{0,2}$/.test(sizeText)?Number(sizeText):null;
    if((pageText!==null&&page===null)||(sizeText!==null&&pageSize===null)||
      (pageSize!==null&&pageSize>99))
      return NextResponse.json({error:"INVALID_MEETING_PAGE"},{status:400});
    const state=search.get("state")??"ALL";
    const archive=search.get("archive")??"ACTIVE";
    if(!["ALL","DRAFT","REQUESTED","SCHEDULED","RESCHEDULED","COMPLETED","CANCELLED"].includes(state)||
      !["ACTIVE","INACTIVE","ALL"].includes(archive))
      return NextResponse.json({error:"INVALID_MEETING_FILTER"},{status:400});
    const options={
      q:search.get("q")??undefined,
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
    const body = readMentorProjectCommandBody(request);
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
