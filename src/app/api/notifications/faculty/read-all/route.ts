import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { markAllOwnFacultyNotificationsRead } from "@/modules/activity/faculty-notification-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor }) => {
    const context = actor!;
    const markedRead = await markAllOwnFacultyNotificationsRead(context);
    return NextResponse.json({ markedRead });
  },
);
