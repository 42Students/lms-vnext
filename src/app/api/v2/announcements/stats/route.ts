import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSuperAdmin } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { announcementApiError } from "@/lib/announcement-api-error";
import { announcementsRuntimeEnabled } from "@/modules/announcements/readiness";
import { announcementStatisticsForAdmin } from "@/modules/announcements/service";
import { route } from "@/security/route";

import { CACHE } from "@/security/responses";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handleGET() {
  if (!announcementsRuntimeEnabled()) {
    return NextResponse.json({ error: "DB10_ANNOUNCEMENTS_MIGRATIONS_PENDING" }, { status: 503 });
  }
  try {
    const context = await getCurrentRequestContext();
    if (!isSuperAdmin(context)) {
      return NextResponse.json({ error: "FORBIDDEN" },
        { status: 403, headers: { "Cache-Control": CACHE.PRIVATE } });
    }
    requirePermission(context, "admin-scope.select");
    // Unlike the old in-process cache, scoped Super Admin must only learn the
    // selected college/organization count; global total needs global scope.
    const counts = await announcementStatisticsForAdmin(context);
    return NextResponse.json({
      status: "success", message: "Stats retrieved",
      data: { totalAnnouncements: counts.total - counts.deleted, ...counts },
    }, { headers: { "Cache-Control": CACHE.PRIVATE } });
  } catch (error) {
    return announcementApiError(error);
  }
}
export const GET = route(
  { auth: "user", permission: "admin-scope.select" },
  () => handleGET(),
);
