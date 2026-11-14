import type { InternalCredential } from "@/security/internal-route-core";

/**
 * Every machine-called job endpoint, in one table: its stable name, URL, method, the credential a scheduler must send and
 * the environment variable that holds it. Routes take their credential from here (`jobCredential(name)`), so rotating a
 * header name or secret variable is one edit, and tests/unit/sec-job-registry.test.ts fails when a route is added, renamed
 * or re-keyed without this table following. Jobs run as the system (no tenant actor); each service they call scopes its own
 * work per college.
 */
export type JobDefinition = {
  name: string;
  path: string;
  method: "GET" | "POST";
  credential: InternalCredential;
  /** What the job does, for the operator who wires its scheduler. */
  purpose: string;
};

export const JOBS = [
  {
    name: "internal.alerts.tick",
    path: "/api/internal/alerts/tick",
    method: "POST",
    credential: { kind: "header", header: "x-internal-alerts-key", secretEnv: "INTERNAL_ALERT_TICK_SECRET" },
    purpose: "Evaluate log alert rules and send due alerts.",
  },
  {
    name: "internal.mentor-project-email-dispatch",
    path: "/api/internal/mentor-project-email-dispatch",
    method: "POST",
    credential: { kind: "bearer", secretEnv: "MENTOR_PROJECT_EMAIL_WORKER_TOKEN" },
    purpose: "Send queued mentor and project emails from the outbox.",
  },
  {
    name: "internal.notifications.release",
    path: "/api/internal/notifications/release",
    method: "POST",
    credential: { kind: "bearer", secretEnv: "NOTIFICATION_RELEASE_TOKEN" },
    purpose: "Release scheduled in-app notifications that have come due.",
  },
  {
    name: "internal.operations.notification-scheduler",
    path: "/api/internal/operations/notification-scheduler",
    method: "POST",
    credential: { kind: "header", header: "x-notification-scheduler-key", secretEnv: "DB10_NOTIFICATION_SCHEDULER_SECRET" },
    purpose: "Run the leased notification scheduler tick.",
  },
  {
    name: "internal.placements.tpo.deadline-today",
    path: "/api/internal/placements/tpo/deadline-today",
    method: "POST",
    credential: { kind: "header", header: "x-tpo-reminder-key", secretEnv: "TPO_REMINDER_SCHEDULER_SECRET" },
    purpose: "Remind learners of placement drives whose deadline is today.",
  },
  {
    name: "internal.placements.tpo.interview-evening",
    path: "/api/internal/placements/tpo/interview-evening",
    method: "POST",
    credential: { kind: "header", header: "x-tpo-reminder-key", secretEnv: "TPO_REMINDER_SCHEDULER_SECRET" },
    purpose: "Send the evening-before interview reminders.",
  },
  {
    name: "internal.tpo.notices.deliver",
    path: "/api/internal/placements/tpo/notices/deliver",
    method: "POST",
    credential: { kind: "header", header: "x-tpo-scheduler-key", secretEnv: "TPO_NOTICE_SCHEDULER_SECRET" },
    purpose: "Deliver scheduled placement notices.",
  },
  {
    name: "internal.tpo.offer-expiry.run",
    path: "/api/internal/placements/tpo/offer-expiry/run",
    method: "POST",
    credential: { kind: "header", header: "x-tpo-scheduler-key", secretEnv: "TPO_NOTICE_SCHEDULER_SECRET" },
    purpose: "Expire offers whose acceptance window has passed.",
  },
  {
    name: "internal.tpo.scheduler-status",
    path: "/api/internal/placements/tpo/scheduler-status",
    method: "GET",
    credential: { kind: "header", header: "x-tpo-scheduler-key", secretEnv: "TPO_NOTICE_SCHEDULER_SECRET" },
    purpose: "Report the state of the placement schedulers (read-only).",
  },
  {
    name: "internal.placements.tpo.withdrawal-escalations",
    path: "/api/internal/placements/tpo/withdrawal-escalations/run",
    method: "POST",
    credential: { kind: "header", header: "x-tpo-scheduler-key", secretEnv: "TPO_NOTICE_SCHEDULER_SECRET" },
    purpose: "Escalate withdrawal requests that have waited too long.",
  },
] as const satisfies readonly JobDefinition[];

export type JobName = (typeof JOBS)[number]["name"];

export function jobCredential(name: JobName): InternalCredential {
  const job = JOBS.find((entry) => entry.name === name);
  if (!job) throw new Error(`Unknown job: ${name}`);
  return job.credential;
}
