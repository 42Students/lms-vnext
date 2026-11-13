import { boundedRequestJson } from "@/lib/request-body";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { announcementApiError } from "@/lib/announcement-api-error";
import {
  deleteAnnouncement,
  updateAnnouncement,
} from "@/modules/announcements/service";
import { announcementsRuntimeEnabled } from "@/modules/announcements/readiness";
import { route } from "@/security/route";

import { CACHE } from "@/security/responses";
export const runtime = "nodejs";
type RouteContext = { params: Promise<{ announcementId: string }> };

async function handlePATCH(request: Request, { params }: RouteContext) {
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
    try { body = await boundedRequestJson(request); }
    catch { return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 }); }
    // Shared broadcasts use a single tenant-scoped, version-checked
    // transaction in the service, not a single recipient update.
    const announcement=await updateAnnouncement(context,announcementId,body);
    return NextResponse.json({
      status:"UPDATED",announcement,
      actionScope:announcement.broadcastGroupId?"BROADCAST_GROUP":"SINGLE_NOTICE",
    },{headers:{"Cache-Control":CACHE.PRIVATE}});
  } catch (error) {
    return announcementApiError(error);
  }
}
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePATCH(request as Parameters<typeof handlePATCH>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePATCH>[1]),
);

async function handleDELETE(request: Request, { params }: RouteContext) {
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
    try { body = await boundedRequestJson(request); }
    catch { return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 }); }
    const announcement=await deleteAnnouncement(context,announcementId,body);
    return NextResponse.json({
      status:"DELETED",announcement,
      actionScope:announcement.broadcastGroupId?"BROADCAST_GROUP":"SINGLE_NOTICE",
    },{headers:{"Cache-Control":CACHE.PRIVATE}});
  } catch (error) {
    return announcementApiError(error);
  }
}
export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handleDELETE(request as Parameters<typeof handleDELETE>[0], { params: Promise.resolve(params) } as Parameters<typeof handleDELETE>[1]),
);
