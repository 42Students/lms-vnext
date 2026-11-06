import { randomUUID } from "node:crypto";
import { executeScheduledJobWithLease } from "@/modules/operations/scheduled-job-runner";
import { postgresScheduledJobLeaseStore } from "@/modules/operations/postgres-scheduled-job-lease-store";
import { NextResponse } from "next/server";
import { deliverDueTpoNotices } from "@/modules/announcements/tpo-notice-delivery-service";
import { internalRoute } from "@/security/internal-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST-only scheduler: never publish notices from GET or page rendering. */
export const POST = internalRoute(
  {
    name: "internal.tpo.notices.deliver",
    credential: { kind: "header", header: "x-tpo-scheduler-key", secretEnv: "TPO_NOTICE_SCHEDULER_SECRET" },
    emptyBody: true,
    denied: { status: 403, body: { error: "FORBIDDEN" } },
    invalid: { error: "INVALID_REQUEST" },
  },
  async () => {
    try {
      const result = await executeScheduledJobWithLease(
        postgresScheduledJobLeaseStore,
        { jobName: "tpo.deliverDueNotices", holderId: randomUUID(), ttlMs: 50_000 },
        async (fence) => {
          await fence.assertCurrent();
          return deliverDueTpoNotices();
        },
      );
      if (result.ran && !result.result.ready)
        return NextResponse.json({ error: "DELIVERY_STORAGE_NOT_READY" }, { status: 503 });
      if (result.ran && result.result.failed > 0)
        return NextResponse.json(
          {
            error: "NOTICE_DELIVERY_INCOMPLETE",
            failed: result.result.failed,
            scanned: result.result.scanned,
            delivered: result.result.delivered,
            retryable: true,
          },
          { status: 503 },
        );
      return NextResponse.json(result.ran ? result.result : { skipped: true, reason: result.reason });
    } catch {
      return NextResponse.json({ error: "DELIVERY_NOT_COMPLETED" }, { status: 503 });
    }
  },
);
