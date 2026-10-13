import type { LearnerPlacementJobItem } from "@/components/placements/learner-placement-jobs";

/** Only learner-authorized published job rows may be passed to this model. */
export function learnerJobDetailSummary(items: readonly LearnerPlacementJobItem[]) {
  if (!items.length) return null;
  const jobId = items[0]!.job.id;
  if (items.some((item) => item.job.id !== jobId)) {
    throw new Error("JOB_DETAIL_MIXED_JOBS");
  }
  const appliedCount = items.filter((item) => item.application?.status === "SUBMITTED").length;
  const canApplyCount = items.filter((item) => item.canApply).length;
  const eligibleCount = items.filter((item) =>
    item.eligibility.status === "ELIGIBLE" ||
    item.eligibility.status === "ELIGIBLE_WITH_MISSING_EVIDENCE",
  ).length;
  const missingCount = items.filter((item) => item.eligibility.checks.some((check) =>
    check.status === "MISSING",
  )).length;
  const ineligibleCount = items.filter((item) =>
    item.eligibility.status === "INELIGIBLE",
  ).length;
  return {
    jobId,
    companyName: items[0]!.company.name,
    title: items[0]!.job.title,
    rolesCount: items.length,
    appliedCount,
    canApplyCount,
    eligibleCount,
    missingCount,
    ineligibleCount,
    deadlinePassed: items[0]!.deadlinePassed,
  };
}

export function safeLearnerPlacementUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return (parsed.protocol === "https:" || parsed.protocol === "http:") &&
      parsed.username === "" && parsed.password === ""
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}
