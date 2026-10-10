import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createFacultyAttendanceSession,
  getFacultyAttendanceWorkspace,
} from "@/modules/attendance/faculty-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
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
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    const body = await request.json();
    const session =
      await createFacultyAttendanceSession(
        context,
        body,
      );
    return NextResponse.json(
      { session },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
