import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { exportCollegeDepartmentAttendance } from "@/modules/attendance/college-department-csv-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
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
        "content-disposition": 'attachment; filename="department-attendance.csv"',
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
