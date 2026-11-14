import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { exportCollegeDepartmentAttendance } from "@/modules/attendance/college-department-csv-service";
import { route } from "@/security/route";

import { attachmentHeader } from "@/security/downloads";
export const runtime = "nodejs";

async function handleGET(request: Request) {
  try {
    const url = new URL(request.url);
    // A strict object rejects caller-supplied college, page, and other scope controls.
    const raw = Object.fromEntries(url.searchParams);
    if ([...url.searchParams.keys()].some(key => url.searchParams.getAll(key).length !== 1)) {
      return NextResponse.json({ error: "INVALID_QUERY" }, { status: 400 });
    }
    const context = await getCurrentRequestContext();
    const { csv } = await exportCollegeDepartmentAttendance(context, raw);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": attachmentHeader("department-attendance.csv"),
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const GET = route(
  { auth: "user", permission: "service-enforced", stepUp: true },
  ({ request }) => handleGET(request as Parameters<typeof handleGET>[0]),
);
