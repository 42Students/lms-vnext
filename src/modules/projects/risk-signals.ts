export type ProjectRiskSignalInput = {
  projectStatus: string;
  inactiveDays: number;
  latestSubmissionStatus: string | null;
  hasBlockedTask?: boolean;
};

/**
 * Choose the highest persisted submission version.
 *
 * Versions are unique within a project in the registered
 * project_submissions schema. The implementation does not
 * depend on the input collection's ordering.
 */
export function latestProjectSubmission<
  T extends { version: number },
>(submissions: readonly T[]): T | null {
  let latest: T | null = null;

  for (const submission of submissions) {
    if (
      latest === null ||
      submission.version > latest.version
    ) {
      latest = submission;
    }
  }

  return latest;
}

/**
 * Derive the currently supported College Admin risk reasons.
 *
 * A historical SUBMITTED delivery is not a pending review
 * when the latest version has another status.
 *
 * The legacy free-text blocker signal is not represented
 * here because it is not yet persisted in the current
 * project schema.
 */
export function deriveProjectRiskReasons({
  projectStatus,
  inactiveDays,
  latestSubmissionStatus,
  hasBlockedTask = false,
}: ProjectRiskSignalInput): string[] {
  if (
    projectStatus === "ARCHIVED" ||
    projectStatus === "COMPLETED"
  ) {
    return [];
  }

  const reasons: string[] = [];

  // Corrupt/partial activity projections must never produce "Infinity days",
  // "NaN days" or a fractional inactivity duration in customer-facing copy.
  // Retain other independent risk signals if the age is unusable.
  if (Number.isSafeInteger(inactiveDays) && inactiveDays >= 7) {
    reasons.push(
      `No activity in ${inactiveDays} day${
        inactiveDays === 1 ? "" : "s"
      }`,
    );
  }

  if (hasBlockedTask) {
    reasons.push("Active blocker");
  }

  if (latestSubmissionStatus === "SUBMITTED") {
    reasons.push("Pending review");
  }

  return reasons;
}
