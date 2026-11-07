import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { confirmTpoOwnNotificationRead } from "@/modules/placements/tpo-own-notification-service";
export const runtime = "nodejs";
export const POST = route(
  { auth: "user", permission: "placements.manage" },
  async ({ request, context: actor }) => {
    const context = actor!;
    return NextResponse.json(await confirmTpoOwnNotificationRead(context, await boundedRequestJson(request)));
  },
);
