/**
 * Named TPO scheduling contracts from the legacy TpoScheduledJobs service.
 * Cron expressions below have minute precision and are evaluated in
 * Asia/Kolkata by an external scheduler. They are NOT implicit timers.
 * Only bindings with an active, authenticated route are marked wired.
 */
export const TPO_JOB_TIME_ZONE = "Asia/Kolkata";

export const TPO_SCHEDULED_JOBS = {
  "tpo.deadlineToday": {
    schedule: "0 8 * * *", leaseMs: 30 * 60_000, wired: false,
    description: "Application deadlines today",
  },
  "tpo.offersExpiringSoon": {
    schedule: "0 * * * *", leaseMs: 50 * 60_000, wired: false,
    description: "Offers approaching expiry",
  },
  "tpo.shortlistDueTomorrow": {
    schedule: "0 8 * * *", leaseMs: 30 * 60_000, wired: false,
    description: "Shortlists due tomorrow",
  },
  "tpo.escalateWithdrawals": {
    schedule: "*/15 * * * *", leaseMs: 12 * 60_000, wired: true,
    description: "Undecided withdrawal escalations",
  },
  "tpo.finalizeExternalAcceptances": {
    schedule: "*/30 * * * *", leaseMs: 25 * 60_000, wired: false,
    // This dedicated name is not a separately exposed route: the wired 15m
    // offer-expiry job runs the same idempotent finalizer, satisfying the
    // legacy 30m upper bound without duplicate competing scheduler requests.
    description: "External offer acceptance finalization (via 15m expiry worker)",
  },
  "tpo.recruiterInviteReminders": {
    schedule: "0 9 * * *", leaseMs: 30 * 60_000, wired: false,
    description: "Recruiter invitation reminders",
  },
  "tpo.interviewReminders": {
    schedule: "0 19 * * *", leaseMs: 30 * 60_000, wired: false,
    description: "Tomorrow's interviews: in-app and email",
  },
  "tpo.interviewMorningReminders": {
    schedule: "0 8 * * *", leaseMs: 30 * 60_000, wired: false,
    description: "Today's interviews: in-app only",
  },
  "tpo.recruiterMessageEmails": {
    schedule: "*/5 * * * *", leaseMs: 4 * 60_000, wired: true,
    description: "Recruiter unread-message digests",
  },
  "tpo.expireOverdueOffers": {
    schedule: "*/15 * * * *", leaseMs: 12 * 60_000, wired: true,
    description: "Expire issued offers past their expiry timestamp",
  },
} as const;

export type TpoScheduledJobName = keyof typeof TPO_SCHEDULED_JOBS;
