import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { requireRecentDeviceAuthentication } from "@/auth/recent-device-auth";
import { apiErrorResponse } from "@/lib/api-error";
import { parsePeopleCsvParams } from "@/modules/people/college-people-export-model";
import { exportCollegePeopleCsv } from "@/modules/people/college-people-export-service";

export const runtime = "nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    try {
const query = parsePeopleCsvParams(new URL(request.url).searchParams);
await requireRecentDeviceAuthentication(context.user.id);
const report = await exportCollegePeopleCsv(context, query);
return new Response(report.csv, { headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="college-people.csv"',
      "Cache-Control": "private, no-store",
      "X-Export-Truncated": String(report.truncated),
      "X-Export-Total": String(report.total),
    }});
} catch (error) {
    if (error instanceof Error && error.message === "INVALID_CSV_FILTERS")
      return NextResponse.json({ error: "INVALID_FILTERS" }, { status: 400 });
    return apiErrorResponse(error);
  }
  },
);
