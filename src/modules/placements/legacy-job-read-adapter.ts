import type { listLearnerPlacementJobs } from "./learner-job-service";

/** Safe legacy GET /job/all projection from the current, already scoped
 * learner feed. No hidden jobs or cross-learner application records are loaded.
 * The vNext role-option application remains the authoritative write model. */
type Row = Awaited<ReturnType<typeof listLearnerPlacementJobs>>[number];

export function summarizeLegacyLearnerJobs(rows: readonly Row[]) {
  const byJob = new Map<string, Row[]>();
  for (const row of rows) {
    const group = byJob.get(row.job.id) ?? [];
    group.push(row);
    byJob.set(row.job.id, group);
  }
  return [...byJob.values()].map(group => {
    const first = group[0]!;
    const applications = group.flatMap(row => row.application ? [{
      applicationId: row.application.id,
      applicationStatus: row.application.status,
      roleOptionId: row.roleOption.id,
      roleTitle: row.roleOption.title,
    }] : []);
    const earliest = applications[0];
    const canApply = group.some(row => row.canApply);
    return {
      id: first.job.id,
      jobTitle: first.job.title,
      companyName: first.company.name,
      jobDescription: first.job.description ?? "",
      jobType: first.job.employmentType,
      location: first.job.locations?.join(", ") || "Not specified",
      candidatePreferences: first.job.candidatePreferences ?? null,
      isVisible: true,
      visibilityReason: null,
      canApply,
      applicationBlockers: [...new Set(group.flatMap(row => row.applicationBlockers))],
      applied: applications.length > 0,
      applicationId: earliest?.applicationId ?? null,
      applicationStatus: earliest?.applicationStatus ?? null,
      /** Multi-role offers are not flattened to one application ID. */
      applications,
    };
  });
}

/** Compatibility mapping for retired legacy `{accept:boolean}` offer payloads.
 * Preserve the vNext typed action and let its existing ownership and state
 * validators decide whether the transition may commit. */
export function legacyOfferResponseAction(accept: boolean): "ACCEPT" | "DECLINE" {
  return accept ? "ACCEPT" : "DECLINE";
}
