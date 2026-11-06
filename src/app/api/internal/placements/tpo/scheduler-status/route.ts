import { NextResponse } from "next/server";
import { getTpoScheduledJobLeaseHealth } from "@/modules/operations/tpo-scheduled-job-health";
import { internalRoute } from "@/security/internal-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Read-only operator diagnostics, not a user-facing status screen. */
export const GET = internalRoute(
  {
    name: "internal.tpo.scheduler-status",
    credential: { kind: "header", header: "x-tpo-scheduler-key", secretEnv: "TPO_NOTICE_SCHEDULER_SECRET" },
    denied: { status: 403, body: { error: "FORBIDDEN" } },
    invalid: { error: "INVALID_REQUEST" },
  },
  async () => {
    try {
      const jobs = await getTpoScheduledJobLeaseHealth();
      return NextResponse.json({ jobs, outcomesTracked: false });
    } catch {
      // A query outage is not an empty, successful scheduler.
      return NextResponse.json({ error: "JOB_HEALTH_UNAVAILABLE" }, { status: 503 });
    }
  },
);
