import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  createFacultyAttendanceSession,
  getFacultyAttendanceWorkspace,
} from "@/modules/attendance/faculty-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const url = new URL(request.url);
    const deliveryId = url.searchParams.get("deliveryId");
    if (!deliveryId) {
      return NextResponse.json(
        { error: "INVALID_REQUEST" },
        { status: 400 },
      );
    }
    const workspace =
      await getFacultyAttendanceWorkspace(
        context,
        deliveryId,
      );
    return NextResponse.json({ workspace });
  },
);

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const body = await boundedRequestJson(request);
    const session =
      await createFacultyAttendanceSession(
        context,
        body,
      );
    return NextResponse.json(
      { session },
      { status: 201 },
    );
  },
);
