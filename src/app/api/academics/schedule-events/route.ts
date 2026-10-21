import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createSectionScheduleEvent,
  listSectionScheduleEvents,
} from "@/modules/academics/schedule-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const params=new URL(request.url).searchParams;
    const section=params.get("sectionId"),oldClass=params.get("classId");
    if(section&&oldClass&&section!==oldClass)
      return NextResponse.json({error:"AMBIGUOUS_SECTION"},{status:400});
    // Historical numeric class IDs are not UUID section grants.
    const sectionId=section??oldClass??"";
    const events =
      await listSectionScheduleEvents(
        context,
        sectionId,
      );

    return NextResponse.json({events,
      count:events.length,sectionId,
    },{headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    let body:unknown;
    try{body=await request.json();}
    catch{return NextResponse.json({error:"INVALID_REQUEST"},{status:400});}
    if(typeof body==="object"&&body!==null&&!Array.isArray(body)){
      const record=body as Record<string,unknown>;
      if(record.sectionId===undefined&&typeof record.classId==="string"){
        const {classId,...rest}=record;
        body={...rest,sectionId:classId};
      }
    }
    const event =
      await createSectionScheduleEvent(
        context,
        body,
      );

    // Keep the vNext event and provide the historic OK acknowledgment.
    return NextResponse.json(
      { event, status: "OK", message: "OK" },
      { status: 201, headers: {"Cache-Control":"private, no-store"} },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
