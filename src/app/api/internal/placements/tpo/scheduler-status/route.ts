import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getTpoScheduledJobLeaseHealth } from "@/modules/operations/tpo-scheduled-job-health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Read-only operator diagnostics, not a user-facing status screen. */
export async function GET(request: Request) {
  const secret = process.env["TPO_NOTICE_SCHEDULER_SECRET"] ?? "";
  const provided = request.headers.get("x-tpo-scheduler-key") ?? "";
  const expectedBytes = Buffer.from(secret, "utf8");
  const receivedBytes = Buffer.from(provided, "utf8");
  if (expectedBytes.length < 32 ||
      expectedBytes.length !== receivedBytes.length ||
      !timingSafeEqual(expectedBytes, receivedBytes)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  try {
    const jobs = await getTpoScheduledJobLeaseHealth();
    return NextResponse.json({ jobs, outcomesTracked: false }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    // A query outage is not an empty, successful scheduler.
    return NextResponse.json({ error: "JOB_HEALTH_UNAVAILABLE" }, {
      status: 503, headers: { "Cache-Control": "no-store" },
    });
  }
}
