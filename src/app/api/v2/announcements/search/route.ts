import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSuperAdmin } from "@/modules/identity/context";
import { announcementApiError } from "@/lib/announcement-api-error";
import { announcementsRuntimeEnabled } from "@/modules/announcements/readiness";
import { searchLegacyAnnouncementsForGlobalSuperAdmin } from "@/modules/announcements/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!announcementsRuntimeEnabled()) {
    return NextResponse.json({ error: "DB10_ANNOUNCEMENTS_MIGRATIONS_PENDING" }, { status: 503 });
  }
  try {
    const context = await getCurrentRequestContext();
    if (!isSuperAdmin(context) || context.adminScope?.collegeId ||
        context.adminScope?.organizationId) {
      return NextResponse.json({
        status: "error",
        message: "Announcement search is GLOBAL-only. Use /api/v1/announcements/* scoped APIs.",
        data: null,
      }, { status: 403, headers: { "Cache-Control": "private, no-store" } });
    }
    const params = new URL(request.url).searchParams;
    const query = params.get("query") ?? "";
    const limit = params.get("limit") ?? "15";
    const data = await searchLegacyAnnouncementsForGlobalSuperAdmin(context, query, limit);
    return NextResponse.json({
      status: "success", message: "Announcements retrieved",
      version: 2, idFormat: "uuid",
      data: data.map(row => ({ ...row, receiverValue: null })),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return announcementApiError(error);
  }
}
