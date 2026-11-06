import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { announcementApiError } from "@/lib/announcement-api-error";
import { listVisibleAnnouncementsForMembership } from "@/modules/announcements/service";
import { announcementsRuntimeEnabled } from "@/modules/announcements/readiness";
import { secured } from "@/security/secure-handler";

export const runtime = "nodejs";

async function handleGET() {
  if (!announcementsRuntimeEnabled()) {
    return NextResponse.json({ error: "DB10_ANNOUNCEMENTS_MIGRATIONS_PENDING" }, { status: 503 });
  }
  try {
    const context = await getCurrentRequestContext();
    const announcements = await listVisibleAnnouncementsForMembership(context);
    return NextResponse.json({ announcements });
  } catch (error) {
    return announcementApiError(error);
  }
}
export const GET = secured(handleGET);
