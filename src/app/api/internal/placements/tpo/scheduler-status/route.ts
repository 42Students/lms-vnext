import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getTpoScheduledJobLeaseHealth } from "@/modules/operations/tpo-scheduled-job-health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" } as const;

/** Read-only operator diagnostics, not a user-facing status screen. */
export async function GET(request: Request) {
  if (request.headers.has("origin"))
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403, headers: noStore });
  const secret = process.env["TPO_NOTICE_SCHEDULER_SECRET"] ?? "";
  const provided = request.headers.get("x-tpo-scheduler-key") ?? "";
  const expectedBytes = Buffer.from(secret, "utf8");
  const receivedBytes = Buffer.from(provided, "utf8");
  if (expectedBytes.length < 32 ||
      expectedBytes.length !== receivedBytes.length ||
      !timingSafeEqual(expectedBytes, receivedBytes)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403, headers: noStore });
  }
  if (new URL(request.url).search)
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400, headers: noStore });
  try {
    const jobs = await getTpoScheduledJobLeaseHealth();
    return NextResponse.json({ jobs, outcomesTracked: false }, {
      headers: noStore,
    });
  } catch {
    // A query outage is not an empty, successful scheduler.
    return NextResponse.json({ error: "JOB_HEALTH_UNAVAILABLE" }, {
      status: 503, headers: { "Cache-Control": "no-store" },
    });
  }
}
