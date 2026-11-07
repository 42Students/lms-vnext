import { and, desc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { getDb } from "@/db/client";
import { activityEvents, db10Announcements } from "@/db/schema";
import { apiErrorResponse } from "@/lib/api-error";
import { hasMembershipRole } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { requirePersistedTpoMembership } from "@/modules/placements/tpo-persisted-actor-service";
import { deliverDueTpoNotices } from "@/modules/announcements/tpo-notice-delivery-service";
import { route } from "@/security/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ noticeId: string }> };

async function scopedNotice(noticeId: string) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    throw new AuthorizationError("placements.manage");
  }
  await requirePersistedTpoMembership(context, context.membership.collegeId);
  const id = z.string().uuid().parse(noticeId);
  const [notice] = await getDb().select({
    id: db10Announcements.id,
    collegeId: db10Announcements.collegeId,
    scheduledAt: db10Announcements.scheduledAt,
  }).from(db10Announcements).where(and(
    eq(db10Announcements.id, id),
    eq(db10Announcements.collegeId, context.membership.collegeId),
    eq(db10Announcements.senderType, "TPO"),
    eq(db10Announcements.receiverType, "COLLEGE"),
  )).limit(1);
  return notice ?? null;
}

async function handleGET(_request: Request, { params }: Params) {
  try {
    const notice = await scopedNotice((await params).noticeId);
    if (!notice) return NextResponse.json({error: "NOTICE_NOT_FOUND"},{status:404});
    const [event] = await getDb().select({
      eventType: activityEvents.eventType,
      occurredAt: activityEvents.occurredAt,
      metadata: activityEvents.metadata,
    }).from(activityEvents).where(and(
      eq(activityEvents.collegeId, notice.collegeId),
      eq(activityEvents.subjectType, "announcement"),
      eq(activityEvents.subjectId, notice.id),
      inArray(activityEvents.eventType, [
        "placements.tpo_notice.delivery_failed",
        "placements.tpo_notice.delivery_succeeded",
      ]),
    )).orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id)).limit(1);
    const failed = event?.eventType === "placements.tpo_notice.delivery_failed";
    return NextResponse.json({
      noticeId: notice.id,
      status: failed ? "FAILED" : event ? "SENT" : "PENDING",
      error: failed && event.metadata?.["deliveryError"] === "AUDIENCE_UNAVAILABLE"
        ? "Audience could not be resolved for this notice."
        : failed ? "The notice could not be delivered. Retry after checking the audience." : null,
      retryable: failed,
      lastAttemptAt: event?.occurredAt.toISOString() ?? null,
    }, {headers: {"Cache-Control":"private, no-store"}});
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handleGET(request as Parameters<typeof handleGET>[0], { params: Promise.resolve(params) } as Parameters<typeof handleGET>[1]),
);

async function handlePOST(request: Request, { params }: Params) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  }
  try {
    const notice = await scopedNotice((await params).noticeId);
    if (!notice) return NextResponse.json({error:"NOTICE_NOT_FOUND"},{status:404});
    const outcome = await deliverDueTpoNotices(new Date(),notice.id);
    if (!outcome.ready) {
      return NextResponse.json({error:"DELIVERY_UNAVAILABLE"},{status:503});
    }
    if (!outcome.scanned) {
      return NextResponse.json({
        error:"NOTICE_NOT_DUE",message:"This notice is scheduled, already delivered, or no longer eligible."
      },{status:409});
    }
    if (outcome.failed) {
      return NextResponse.json({
        error:"DELIVERY_RETRYABLE_FAILURE",
        message:"The notice could not be delivered. Review the audience and retry.",
      },{status:503});
    }
    return NextResponse.json({
      status:"OK",noticeId:notice.id,delivered:outcome.delivered,
    }, {headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);
