import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/auth/origin";
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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" } as const;
type WiredJob = "notification.release" | "notification.cleanup"
  | "notification.interviewReminders" | "notification.assignmentReminders"
  | "tpo.interviewReminders" | "tpo.interviewMorningReminders";

/**
 * Authenticated internal worker entrypoint. Configure Cloud Scheduler to
 * POST the specific job key; no GET, unauthenticated or browser trigger may
 * publish notifications. Deployment/IAM is a separate explicit release gate.
 */
export async function POST(request: Request) {
  // Scheduled/service callbacks have no browser Origin. Reject a foreign Origin when one is supplied.
  if (request.headers.has("origin") && !isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  const secret = process.env["DB10_NOTIFICATION_SCHEDULER_SECRET"] ?? "";
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
  if (process.env["DB10_NOTIFICATION_SCHEDULER_READY"] !== "DB10_VERIFIED") {
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
      process.env["DB10_NOTIFICATION_OUTBOX_READY"] !== "DB10_VERIFIED") {
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
