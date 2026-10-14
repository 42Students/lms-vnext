export type LearnerApplicationBrowseItem = {
  applicationId: string;
  jobTitle: string;
  companyName: string;
  applicationStatus: string;
  submittedAt: Date;
  withdrawnAt: Date | null;
  screening: {
    status: string;
    decidedAt: Date | null;
  };
  results: readonly { appliedAt: Date | null }[];
};

export type LearnerApplicationBrowseFilters = {
  search: string;
  view: "all" | "progress" | "completed";
  stage: string;
  sort: "activity" | "company" | "oldest" | "stage";
};

export const DEFAULT_LEARNER_APPLICATION_FILTERS: LearnerApplicationBrowseFilters = {
  search: "", view: "all", stage: "all", sort: "activity",
};

export function learnerApplicationStage(item: LearnerApplicationBrowseItem): string {
  if (item.withdrawnAt || item.applicationStatus === "WITHDRAWN") return "WITHDRAWN";
  return item.screening.status;
}

export function learnerApplicationIsComplete(item: LearnerApplicationBrowseItem) {
  return learnerApplicationStage(item) === "WITHDRAWN" ||
    learnerApplicationStage(item) === "REJECTED";
}

export function learnerApplicationLatestActivity(item: LearnerApplicationBrowseItem) {
  return Math.max(
    item.submittedAt.getTime(),
    item.withdrawnAt?.getTime() ?? 0,
    item.screening.decidedAt?.getTime() ?? 0,
    ...item.results.map((result) => result.appliedAt?.getTime() ?? 0),
  );
}

export function learnerApplicationStageOptions<T extends LearnerApplicationBrowseItem>(
  items: readonly T[],
) {
  return [...new Set(items.map(learnerApplicationStage))]
    .filter(Boolean).sort((a,b) => a.localeCompare(b));
}

export function browseLearnerApplications<T extends LearnerApplicationBrowseItem>(
  items: readonly T[],
  filters: LearnerApplicationBrowseFilters,
): T[] {
  const needle = filters.search.trim().toLocaleLowerCase();
  return items.filter((item) => {
    if (filters.view === "progress" && learnerApplicationIsComplete(item)) return false;
    if (filters.view === "completed" && !learnerApplicationIsComplete(item)) return false;
    if (filters.stage !== "all" && learnerApplicationStage(item) !== filters.stage) return false;
    return !needle || (item.companyName + " " + item.jobTitle).toLocaleLowerCase().includes(needle);
  }).sort((a,b) => {
    if (filters.sort === "company") {
      return a.companyName.localeCompare(b.companyName) ||
        a.jobTitle.localeCompare(b.jobTitle) ||
        a.applicationId.localeCompare(b.applicationId);
    }
    if (filters.sort === "stage") {
      return learnerApplicationStage(a).localeCompare(learnerApplicationStage(b)) ||
        learnerApplicationLatestActivity(b) - learnerApplicationLatestActivity(a) ||
        a.applicationId.localeCompare(b.applicationId);
    }
    if (filters.sort === "oldest") {
      return a.submittedAt.getTime() - b.submittedAt.getTime() ||
        a.applicationId.localeCompare(b.applicationId);
    }
    return learnerApplicationLatestActivity(b) - learnerApplicationLatestActivity(a) ||
      a.applicationId.localeCompare(b.applicationId);
  });
}
