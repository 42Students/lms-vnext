import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { announcementApiError } from "@/lib/announcement-api-error";
import {
  createAnnouncement,
  listAnnouncementsForAdmin,
} from "@/modules/announcements/service";
import { announcementsRuntimeEnabled } from "@/modules/announcements/readiness";
import { parseAnnouncementAdminApiQuery } from "@/modules/announcements/admin-api-query";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!announcementsRuntimeEnabled()) {
    return NextResponse.json({ error: "DB10_ANNOUNCEMENTS_MIGRATIONS_PENDING" }, { status: 503 });
  }
  try {
    const context = await getCurrentRequestContext();
    const params=new URL(request.url).searchParams;
    // The old list client consumed an array. Compatibility is opt-in and
    // still uses exactly the same scoped cursor reader and authorized rows.
    const legacy=params.get("format")==="legacy";
    if(params.has("format")){
      if(!legacy)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
      params.delete("format");
    }
    const query = parseAnnouncementAdminApiQuery(params);
    if (!query) return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
    const page = await listAnnouncementsForAdmin(context, query);
    return NextResponse.json(legacy?{
      status:"OK",
      data:page.items.map(item=>({
        ...item,announcementId:item.id,receiver:item.receiverType,
        receiverId:item.receiverId,createdAt:item.createdAt,
      })),
      pagination:{nextCursor:page.nextCursor,hasMore:page.nextCursor!==null,
        pageSize:page.items.length},
      // Total is intentionally absent: a keyset cursor is not an OFFSET count.
    }:page,{headers:{"cache-control":"private, no-store"}});
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
    // Preserve legacy HTTP 200/status OK while retaining the vNext document.
    return NextResponse.json({ status:"OK",announcement,
      data:{...announcement,announcementId:announcement.id}},
      {status:200,headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    return announcementApiError(error);
  }
}
