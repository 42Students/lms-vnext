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
  queueFencedCourseDueReminders,
  queueFencedInterviewReminders,
} from "@/modules/operations/notification-scheduled-job-service";
import { internalRoute } from "@/security/internal-route";

import { featureReady } from "@/config/features";
import { CACHE } from "@/security/responses";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": CACHE.NONE } as const;
type WiredJob = "notification.release" | "notification.cleanup"
  | "notification.interviewReminders" | "notification.assignmentReminders"
  | "tpo.interviewReminders" | "tpo.interviewMorningReminders";

/**
 * Authenticated internal worker entrypoint. Configure Cloud Scheduler to
 * POST the specific job key; no GET, unauthenticated or browser trigger may
 * publish notifications. Deployment/IAM is a separate explicit release gate.
 */
async function handlePOST(request: Request) {
  if (!featureReady("notificationScheduler")) {
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
  // Allow only fixed job names with tenant-scoped, persisted idempotent
  // producers. An unknown request can never invoke an arbitrary handler.
  if (name !== "notification.release" && name !== "notification.cleanup" &&
      name !== "notification.interviewReminders" &&
      name !== "notification.assignmentReminders" &&
      name !== "tpo.interviewReminders" &&
      name !== "tpo.interviewMorningReminders") {
    return NextResponse.json({ error: "NOTIFICATION_JOB_NOT_WIRED" },
      { status: 503, headers });
  }
  const jobName: WiredJob = name;
  // Never report a successful release tick while the durable recipient
  // outbox is unverified: that would silently drop delayed notifications.
  // The 0214 migration and producer dedupe index are a release prerequisite.
  if (jobName === "notification.release" &&
      !featureReady("notificationOutbox")) {
    return NextResponse.json({ error: "NOTIFICATION_OUTBOX_NOT_READY" },
      { status: 503, headers });
  }
  const ttlMs = jobName === "notification.release"
    ? LEGACY_NOTIFICATION_JOB_SCHEDULES.release.ttlMs
    : jobName === "notification.cleanup"
      ? LEGACY_NOTIFICATION_JOB_SCHEDULES.cleanup.ttlMs
      : jobName === "notification.assignmentReminders"
        ? LEGACY_NOTIFICATION_JOB_SCHEDULES.assignmentReminder.ttlMs
        : jobName === "tpo.interviewMorningReminders" ||
          jobName === "tpo.interviewReminders"
          ? 30 * 60_000
          : LEGACY_NOTIFICATION_JOB_SCHEDULES.interviewReminder.ttlMs;
  try {
    const result = await executeScheduledJobWithLease(
      postgresScheduledJobLeaseStore,
      { jobName, holderId: scheduledJobWorkerIdentity().holderId, ttlMs },
      async (fence) => {
        if (jobName === "notification.cleanup") {
          return cleanupScheduledInAppNotifications(fence);
        }
        if (jobName === "notification.assignmentReminders") {
          return queueFencedCourseDueReminders(fence);
        }
        if (jobName === "notification.interviewReminders" ||
            jobName === "tpo.interviewReminders") {
          return queueFencedInterviewReminders(fence, "TOMORROW");
        }
        if (jobName === "tpo.interviewMorningReminders") {
          return queueFencedInterviewReminders(fence, "TODAY");
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
// Names of the deployment variable and request header that carry the scheduler credential (names only, no values).
const WORKER_ENV = "DB10_NOTIFICATION_SCHEDULER_SECRET";
const WORKER_HEADER = "x-notification-scheduler-key";
export const POST = internalRoute(
  { name: "internal.operations.notification-scheduler", credential: { kind: "header", header: WORKER_HEADER, secretEnv: WORKER_ENV }, denied: { status: 403, body: { error: "FORBIDDEN" } }, invalid: { error: "INVALID_JOB" } },
  ({ request }) => handlePOST(request),
);
