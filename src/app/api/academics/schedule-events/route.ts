import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { readBoundedJsonBody } from "@/lib/bounded-json-body";
import { createSectionScheduleEventInputSchema } from "@/modules/academics/validation";
import {
  createSectionScheduleEvent,
  listSectionScheduleEvents,
} from "@/modules/academics/schedule-service";
import { route } from "@/security/route";

import { CACHE } from "@/security/responses";
export const runtime = "nodejs";

async function handleGET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const params=new URL(request.url).searchParams;
    if (["sectionId", "classId"].some(key => params.getAll(key).length > 1))
      return NextResponse.json({ error: "INVALID_FILTERS" }, {
        status: 400, headers: { "Cache-Control": CACHE.PRIVATE },
      });
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
    },{headers:{"Cache-Control":CACHE.PRIVATE}});
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  ({ request }) => handleGET(request as Parameters<typeof handleGET>[0]),
);

async function handlePOST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    const parsed = await readBoundedJsonBody(request, 16_384);
    if (parsed.kind !== "OK") return NextResponse.json({ error: "INVALID_REQUEST" }, {
      status: parsed.kind === "TOO_LARGE" ? 413 : 400,
      headers: { "Cache-Control": CACHE.PRIVATE },
    });
    let body: unknown = parsed.value;
    if(typeof body==="object"&&body!==null&&!Array.isArray(body)){
      const record=body as Record<string,unknown>;
      if(record["sectionId"]===undefined&&typeof record["classId"]==="string"){
        const {classId,...rest}=record;
        body={...rest,sectionId:classId};
      }
    }
    const event =
      await createSectionScheduleEvent(
        context,
        createSectionScheduleEventInputSchema.parse(body),
      );

    // Keep the vNext event and provide the historic OK acknowledgment.
    return NextResponse.json(
      { event, status: "OK", message: "OK" },
      { status: 201, headers: {"Cache-Control":CACHE.PRIVATE} },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);
