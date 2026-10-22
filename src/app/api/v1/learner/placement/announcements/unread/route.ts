import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { announcementApiError } from "@/lib/announcement-api-error";
import { announcementsRuntimeEnabled } from "@/modules/announcements/readiness";
import { listVisibleAnnouncementsForMembership } from "@/modules/announcements/service";
import { listOwnLearnerAnnouncementReceipts } from "@/modules/announcements/learner-announcement-receipts-service";
import { requireLearnerPlacementAccess } from "@/modules/placements/learner-participation-guard";
import { hasMembershipRole } from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";

export const runtime = "nodejs";

/** Learner-only placement announcement unread count, never personal alert count. */
export async function GET() {
  if (!announcementsRuntimeEnabled()) {
    return NextResponse.json({ error: "DB10_ANNOUNCEMENTS_MIGRATIONS_PENDING" }, { status: 503 });
  }
  try {
    const context = await getCurrentRequestContext();
    if (!hasMembershipRole(context, "LEARNER")) {
      throw new AuthorizationError("placements.read");
    }
    const own = await requireLearnerPlacementAccess(context);
    requirePermission(context, "placements.read", {
      collegeId: own.collegeId,
      organizationId: own.organizationId,
    });
    const announcements = await listVisibleAnnouncementsForMembership(context);
    // This feed is paginated. Do not report an incomplete total as exact.
    if (announcements.length >= 100) {
      return NextResponse.json({ error: "ANNOUNCEMENT_COUNT_INCOMPLETE" }, { status: 503 });
    }
    const receipts = await listOwnLearnerAnnouncementReceipts(
      context, announcements.map(announcement => announcement.id),
    );
    const receiptByAnnouncement = new Map(receipts.map(receipt => [receipt.announcementId, receipt]));
    if (announcements.some(announcement => !receiptByAnnouncement.has(announcement.id))) {
      return NextResponse.json({ error: "ANNOUNCEMENT_READ_STATE_UNKNOWN" }, { status: 503 });
    }
    return NextResponse.json({
      unread: receipts.filter(receipt => receipt.readAt === null).length,
    });
  } catch (error) {
    return announcementApiError(error);
  }
}
