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

const companyNameCollator=new Intl.Collator("en-IN",{numeric:true,sensitivity:"base"});

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

/** Current saved application/screening statuses, not inferred employer hiring outcomes. */
export function learnerApplicationViewCounts(rows:readonly LearnerApplicationBrowseItem[]){
 const completed=rows.filter(learnerApplicationIsComplete).length;
 return {all:rows.length,progress:rows.length-completed,completed};
}

export function learnerApplicationLatestActivity(item: LearnerApplicationBrowseItem) {
  let latest=Math.max(
    item.submittedAt.getTime(),
    item.withdrawnAt?.getTime() ?? 0,
    item.screening.decidedAt?.getTime() ?? 0,
  );
  for(const result of item.results)latest=Math.max(latest,result.appliedAt?.getTime() ?? 0);
  return latest;
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
  const normalize=(text:string)=>text.trim().replace(/\s+/gu," ").toLocaleLowerCase("en");
  const needle = normalize(filters.search);
  return items.filter((item) => {
    if (filters.view === "progress" && learnerApplicationIsComplete(item)) return false;
    if (filters.view === "completed" && !learnerApplicationIsComplete(item)) return false;
    if (filters.stage !== "all" && learnerApplicationStage(item) !== filters.stage) return false;
    return !needle || normalize(item.companyName + " " + item.jobTitle).includes(needle);
  }).sort((a,b) => {
    if (filters.sort === "company") {
      return companyNameCollator.compare(a.companyName.trim(),b.companyName.trim()) ||
        companyNameCollator.compare(a.jobTitle,b.jobTitle) ||
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
