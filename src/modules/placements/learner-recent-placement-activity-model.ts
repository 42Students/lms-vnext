export type LearnerActivityJourney = {
  applicationId: string;
  job: { title: string };
  company: { name: string };
  submittedAt: Date;
  withdrawnAt: Date | null;
  screening: {
    status: string;
    decidedAt: Date | null;
  };
  results: readonly {
    resultId: string;
    roundName: string;
    outcome: string;
    appliedAt: Date | null;
  }[];
};

export type LearnerRecentPlacementEvent = {
  id: string;
  applicationId: string;
  occurredAt: Date;
  heading: string;
  detail: string;
  href: string;
};

/**
 * Only observable persisted timestamps are represented. HOLD/under-review
 * screening stages, staged results and unscheduled rounds are not events.
 * No synthetic activity date or unread count is created.
 */
export function buildLearnerRecentPlacementActivity(
  journeys: readonly LearnerActivityJourney[],
  limit = 8,
): LearnerRecentPlacementEvent[] {
  const events: LearnerRecentPlacementEvent[] = [];
  for (const row of journeys) {
    const base = {
      applicationId: row.applicationId,
      detail: row.company.name + " · " + row.job.title,
      href: "/learn/my-placements/applications?applicationId=" +
        encodeURIComponent(row.applicationId),
    };
    events.push({
      ...base,
      id: "application:" + row.applicationId + ":submitted",
      occurredAt: row.submittedAt,
      heading: "Application submitted",
    });
    if (row.withdrawnAt) {
      events.push({
        ...base,
        id: "application:" + row.applicationId + ":withdrawn",
        occurredAt: row.withdrawnAt,
        heading: "Application withdrawn",
      });
    }
    if (
      row.screening.decidedAt &&
      (row.screening.status === "SHORTLISTED" ||
        row.screening.status === "REJECTED")
    ) {
      events.push({
        ...base,
        id: "application:" + row.applicationId + ":screening",
        occurredAt: row.screening.decidedAt,
        heading: row.screening.status === "SHORTLISTED"
          ? "Screening shortlisted"
          : "Screening rejected",
      });
    }
    for (const result of row.results) {
      if (!result.appliedAt) continue;
      events.push({
        ...base,
        id: "result:" + result.resultId,
        occurredAt: result.appliedAt,
        heading: result.roundName + ": " +
          result.outcome.replaceAll("_", " ").toLowerCase(),
      });
    }
  }
  return events
    .filter((event) => Number.isFinite(event.occurredAt.getTime()))
    .sort((a, b) =>
      b.occurredAt.getTime() - a.occurredAt.getTime() ||
      a.id.localeCompare(b.id),
    )
    .slice(0, Math.max(0, Math.min(50, Math.trunc(limit))));
}
