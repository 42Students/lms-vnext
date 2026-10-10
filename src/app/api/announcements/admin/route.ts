import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { announcementApiError } from "@/lib/announcement-api-error";
import {
  createAnnouncement,
  listAnnouncementsForAdmin,
} from "@/modules/announcements/service";
import { announcementsRuntimeEnabled } from "@/modules/announcements/readiness";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!announcementsRuntimeEnabled()) {
    return NextResponse.json({ error: "DB10_ANNOUNCEMENTS_MIGRATIONS_PENDING" }, { status: 503 });
  }
  try {
    const context = await getCurrentRequestContext();
    const params = new URL(request.url).searchParams;
    const page = await listAnnouncementsForAdmin(context, {
      includeDeleted: params.get("includeDeleted") ?? undefined,
      beforeCreatedAt: params.get("beforeCreatedAt") ?? undefined,
      beforeId: params.get("beforeId") ?? undefined,
      limit: params.get("limit") ?? undefined,
    });
    return NextResponse.json(page);
  } catch (error) {
    return announcementApiError(error);
  }
}

export async function POST(request: Request) {
  if (!announcementsRuntimeEnabled()) {
    return NextResponse.json({ error: "DB10_ANNOUNCEMENTS_MIGRATIONS_PENDING" }, { status: 503 });
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    let body: unknown;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 }); }
    const announcement = await createAnnouncement(context, body);
    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    return announcementApiError(error);
  }
}
