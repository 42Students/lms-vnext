import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { announcementApiError } from "@/lib/announcement-api-error";
import { restoreAnnouncement } from "@/modules/announcements/service";
import { announcementsRuntimeEnabled } from "@/modules/announcements/readiness";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ announcementId: string }> },
) {
  if (!announcementsRuntimeEnabled()) {
    return NextResponse.json({ error: "DB10_ANNOUNCEMENTS_MIGRATIONS_PENDING" }, { status: 503 });
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { announcementId } = await params;
    let body: unknown;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 }); }
    return NextResponse.json({
      announcement: await restoreAnnouncement(context, announcementId, body),
    });
  } catch (error) {
    return announcementApiError(error);
  }
}
