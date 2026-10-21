import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { readBoundedUtf8Body } from "@/lib/bounded-utf8-body";
import { postgresScheduledJobLeaseStore } from "@/modules/operations/postgres-scheduled-job-lease-store";
import {
  executeScheduledJobWithLease,
  LEGACY_NOTIFICATION_JOB_SCHEDULES,
  scheduledJobWorkerIdentity,
} from "@/modules/operations/scheduled-job-runner";
import {
  cleanupScheduledInAppNotifications,
  releaseScheduledInAppNotifications,
  releaseScheduledNotificationOutbox,
} from "@/modules/operations/notification-scheduled-job-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" } as const;
type WiredJob = "notification.release" | "notification.cleanup";

/**
 * Authenticated internal worker entrypoint. Configure Cloud Scheduler to
 * POST the specific job key; no GET, unauthenticated or browser trigger may
 * publish notifications. Deployment/IAM is a separate explicit release gate.
 */
export async function POST(request: Request) {
  const secret = process.env.DB10_NOTIFICATION_SCHEDULER_SECRET ?? "";
  const supplied = request.headers.get("x-notification-scheduler-key") ?? "";
  if (Buffer.byteLength(secret, "utf8") < 32) {
    return NextResponse.json({ error: "SCHEDULER_NOT_CONFIGURED" },
      { status: 503, headers });
  }
  const expected = Buffer.from(secret, "utf8");
  const actual = Buffer.from(supplied, "utf8");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403, headers });
  }
  if (process.env.DB10_NOTIFICATION_SCHEDULER_READY !== "DB10_VERIFIED") {
    return NextResponse.json({ error: "SCHEDULER_NOT_READY" },
      { status: 503, headers });
  }

  const body = await readBoundedUtf8Body(request, 1024);
  if (body.kind !== "OK") {
    return NextResponse.json({ error: "INVALID_JOB" }, { status: 400, headers });
  }
  let name: unknown;
  try {
    const payload: unknown = JSON.parse(body.body);
    if (payload && typeof payload === "object" && !Array.isArray(payload) &&
        Object.keys(payload).length === 1 && "jobName" in payload) {
      name = payload.jobName;
    }
  } catch {
    return NextResponse.json({ error: "INVALID_JOB" }, { status: 400, headers });
  }
  // Interview and assignment reminders require scope-checked, recipient-
  // idempotent producers; do not make an unwired job look successful.
  if (name !== "notification.release" && name !== "notification.cleanup") {
    return NextResponse.json({ error: "NOTIFICATION_JOB_NOT_WIRED" },
      { status: 503, headers });
  }
  const jobName: WiredJob = name;
  const ttlMs = jobName === "notification.release"
    ? LEGACY_NOTIFICATION_JOB_SCHEDULES.release.ttlMs
    : LEGACY_NOTIFICATION_JOB_SCHEDULES.cleanup.ttlMs;
  try {
    const result = await executeScheduledJobWithLease(
      postgresScheduledJobLeaseStore,
      { jobName, holderId: scheduledJobWorkerIdentity().holderId, ttlMs },
      async (fence) => {
        if (jobName === "notification.cleanup") {
          return cleanupScheduledInAppNotifications(fence);
        }
        const receipts = await releaseScheduledInAppNotifications(fence);
        const outbox = await releaseScheduledNotificationOutbox(fence);
        return {
          processed: receipts.processed + outbox.processed,
          hasMore: receipts.hasMore || outbox.hasMore,
        };
      },
    );
    return NextResponse.json(result.ran
      ? { ran: true, ...result.result }
      : { ran: false, reason: result.reason }, { headers });
  } catch {
    return NextResponse.json({ error: "NOTIFICATION_JOB_FAILED" },
      { status: 503, headers });
  }
}
