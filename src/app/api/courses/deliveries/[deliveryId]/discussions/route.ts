import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { learnerDiscussionListResponse } from "@/modules/courses/learner-discussion-response-model";
import {
  createCourseDiscussionMessage,
  listCourseDiscussionMessages,
  listCourseDiscussionChanges,
} from "@/modules/courses/discussion-service";

export const runtime = "nodejs";

/** This is a DELIVERY-scoped discussion feed, not the legacy
 * /api/v1/discussion/fetchDiscussion or /post lesson-content thread.
 * Legacy lessonContentId must be mapped through an authorized content read;
 * never silently post to a whole course when a lesson target was requested.
 * Existing vNext clients consume structured paginated GET data and a
 * persisted {message} receipt (201), so don't replace either response with
 * the older 200 Response(OK,OK,...) envelope on this route.
 */
const noStore={"Cache-Control":"private, no-store"};
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

type RouteContext = {
  params: Promise<{
    deliveryId: string;
  }>;
};

export async function GET(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const context =
      await getCurrentRequestContext();
    const { deliveryId } = await params;
    const url=new URL(request.url);
    const envelope=requestedEnvelope(url);
    const query=Object.fromEntries(url.searchParams.entries());
    delete query.envelope;
    // Legacy classroom 'since' was a changed-row feed. Preserve its polling
    // semantics through the append-only/delta API; it must not be interpreted
    // as a beforeCreatedAt history cursor, which would miss tombstones.
    const since=query.since;
    if(since!==undefined){
      const changes=await listCourseDiscussionChanges(context,deliveryId,{
        since,afterId:query.afterId,limit:query.limit,
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
    const context =
      await getCurrentRequestContext();
    const { deliveryId } = await params;
    const body:unknown=await request.json();
    const message=await createCourseDiscussionMessage(context,deliveryId,body);
    const envelope=requestedEnvelope(new URL(request.url));
    return NextResponse.json(
      envelope?legacyEnvelope(message):{message},
      {status:envelope?200:201,headers:noStore},
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
