import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { learnerDiscussionListResponse } from "@/modules/courses/learner-discussion-response-model";
import {
  createCourseDiscussionMessage,
  listCourseDiscussionMessages,
  listCourseDiscussionChanges,
} from "@/modules/courses/discussion-service";

import { CACHE } from "@/security/responses";
export const runtime = "nodejs";

/** This is a DELIVERY-scoped discussion feed, not the legacy
 * /api/v1/discussion/fetchDiscussion or /post lesson-content thread.
 * Legacy lessonContentId must be mapped through an authorized content read;
 * never silently post to a whole course when a lesson target was requested.
 * Existing vNext clients consume structured paginated GET data and a
 * persisted {message} receipt (201), so don't replace either response with
 * the older 200 Response(OK,OK,...) envelope on this route.
 */
const noStore={"Cache-Control":CACHE.PRIVATE};
type LegacyEnvelope<T>={status:"OK";message:"OK";data:T};
/** Opt-in only. Default vNext clients consume cursor page data, not the
 * legacy Java Response.data.data nesting. This adapter intentionally does
 * not convert untrusted numeric course/class IDs into authority.
 */
function legacyEnvelope<T>(data:T):LegacyEnvelope<T>{
 return {status:"OK",message:"OK",data};
}
function requestedEnvelope(url:URL){
 return url.searchParams.get("envelope")==="legacy";
}

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { deliveryId } = params;
    const url=new URL(request.url);
    const envelope=requestedEnvelope(url);
    const query=Object.fromEntries(url.searchParams.entries());
    delete query["envelope"];
    const since=query["since"];
    if(since!==undefined){
      const changes=await listCourseDiscussionChanges(context,deliveryId,{
        since,afterId:query["afterId"],limit:query["limit"],
      });
      return NextResponse.json(envelope?legacyEnvelope(changes.changes):changes,{
        headers:noStore,
      });
    }
    const result=await listCourseDiscussionMessages(context,deliveryId,query);
    const response=learnerDiscussionListResponse(result);
    return NextResponse.json(envelope?legacyEnvelope(response.messages):response,{
      headers: noStore,
    });
  },
);

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { deliveryId } = params;
    const body:unknown=await boundedRequestJson(request);
    const message=await createCourseDiscussionMessage(context,deliveryId,body);
    const envelope=requestedEnvelope(new URL(request.url));
    return NextResponse.json(
      envelope?legacyEnvelope(message):{message},
      {status:envelope?200:201,headers:noStore},
    );
  },
);
