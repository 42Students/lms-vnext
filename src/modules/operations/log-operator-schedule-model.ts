import { TPO_SCHEDULED_JOBS } from "./tpo-scheduled-job-registry";

/**
 * Operational cadence catalogue. Cron values are expressed in Asia/Kolkata
 * rather than copying the JVM's UTC host clock. Descriptors do NOT schedule a
 * worker, claim a lease, poll external logs, or send notifications.
 */
export const LOG_OPERATOR_JOBS = {
  "logs.errorAlertPoll": {
    schedule: "*/2 * * * *", leaseMs: 5 * 60_000, wired: false,
    description: "New log signatures and regression alerts",
  },
  "logs.deployHealth": {
    schedule: "*/5 * * * *", leaseMs: 4 * 60_000, wired: false,
    description: "Deploy health after a 12-minute settle period",
  },
  "logs.dailyDigest": {
    schedule: "0 9 * * *", leaseMs: 10 * 60_000, wired: false,
    description: "Daily summary of new errors, regressions and fixes",
  },
  "logs.weeklySummary": {
    schedule: "0 9 * * 1", leaseMs: 10 * 60_000, wired: false,
    description: "Monday weekly error summary",
  },
} as const;

export const OPERATIONS_SCHEDULE_CATALOG = {
  ...TPO_SCHEDULED_JOBS,
  ...LOG_OPERATOR_JOBS,
} as const;
export type OperationsJobName = keyof typeof OPERATIONS_SCHEDULE_CATALOG;

export type PersistedOperatorRun = {
  jobName: OperationsJobName;
  startedAt: Date;
  completedAt: Date | null;
  outcome: "SUCCESS" | "FAILED" | "SKIPPED";
  errorCode: string | null;
};

/** No DB row means unknown, NOT healthy or successfully scheduled. */
export function latestOperatorOutcome(
  jobName: OperationsJobName,
  runs: readonly PersistedOperatorRun[],
) {
  const matching = runs.filter((run) => run.jobName === jobName);
  const latest = [...matching].sort(
    (a, b) => b.startedAt.getTime() - a.startedAt.getTime(),
  )[0];
  const success = matching.filter((run) => run.outcome === "SUCCESS" && run.completedAt)
    .sort((a, b) =>
      (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0),
    )[0];
  return {
    status: latest?.outcome ?? "NOT_RECORDED",
    latestStartedAt: latest?.startedAt ?? null,
    latestCompletedAt: latest?.completedAt ?? null,
    lastSuccessAt: success?.completedAt ?? null,
    lastFailureCode: latest?.outcome === "FAILED" ? latest.errorCode : null,
    verifiedWiring: false as const,
  };
}

export type LogDigestSignature = {
  id: string;
  firstSeenAt: Date | null;
  lastSeenAt: Date | null;
  regressedAt: Date | null;
  fixedAt: Date | null;
  fixStatus: string;
  isMuted: boolean;
  occurrenceCount: number;
};

/** Matches the legacy three independently capped top-ten categories.
 * This selects records only; it neither reads Cloud Logging nor sends mail.
 */
export function selectOperatorDigest(
  signatures: readonly LogDigestSignature[],
  since: Date,
) {
  const within = (when: Date | null) => when !== null &&
    when.getTime() >= since.getTime();
  const eligible = signatures.filter((row) => !row.isMuted);
  return {
    newErrors: [...eligible].filter((row) => within(row.firstSeenAt))
      .sort((a, b) =>
        b.occurrenceCount - a.occurrenceCount ||
        a.id.localeCompare(b.id),
      ).slice(0, 10),
    regressions: signatures.filter((row) => within(row.regressedAt))
      .sort((a, b) =>
        (b.regressedAt?.getTime() ?? 0) - (a.regressedAt?.getTime() ?? 0) ||
        a.id.localeCompare(b.id),
      ).slice(0, 10),
    fixed: signatures.filter((row) =>
      row.fixStatus === "FIXED" && row.regressedAt === null &&
      within(row.fixedAt),
    ).sort((a, b) =>
      (b.fixedAt?.getTime() ?? 0) - (a.fixedAt?.getTime() ?? 0) ||
      a.id.localeCompare(b.id),
    ).slice(0, 10),
    stillActive: eligible.filter((row) =>
      row.fixStatus !== "FIXED" && within(row.lastSeenAt),
    ).length,
  };
}
