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
  offerStatus?: string | null;
  /** Authoritatively derived drive live flag, if returned by the journey. */
  live?: boolean | null;
  jobStatus?: string | null;
  results: readonly { appliedAt: Date | null; outcome?: string | null }[];
};

export type LearnerApplicationBrowseFilters = {
  search: string;
  view: "all" | "progress" | "completed";
  stage: string;
  sort: "activity" | "company" | "oldest" | "stage";
};

const companyNameCollator=new Intl.Collator("en-IN",{numeric:true,sensitivity:"base"});

/** Legacy default keeps backend order; modern optional activity/company/
 * stage sorting is explicit. A search input appears after five applications.
 * Returning the first visible ID allows a detail panel to auto-open without
 * exposing another learner's application.
 */
export function legacyApplicationsBrowseState<T extends LearnerApplicationBrowseItem>(
 items:readonly T[],search="",pageSize=20,page=1,
){
 const needle=search.trim().toLocaleLowerCase("en-IN");
 const matched=items.filter(row=>!needle||
  (row.companyName+" "+row.jobTitle).trim().toLocaleLowerCase("en-IN").includes(needle));
 const perPage=Math.max(1,Math.min(100,pageSize));
 const current=Math.max(1,Math.trunc(page));
 const visible=matched.slice((current-1)*perPage,current*perPage);
 return {showSearch:items.length>5,total:matched.length,page:current,
  totalPages:Math.max(1,Math.ceil(matched.length/perPage)),items:visible,
  initiallyOpenedApplicationId:visible[0]?.applicationId??null};
}
export const DEFAULT_LEARNER_APPLICATION_FILTERS: LearnerApplicationBrowseFilters = {
  search: "", view: "progress", stage: "all", sort: "activity",
};

export function learnerApplicationStage(item: LearnerApplicationBrowseItem): string {
  if (item.withdrawnAt || item.applicationStatus === "WITHDRAWN") return "WITHDRAWN";
  if (item.offerStatus === "ACCEPTED") return "HIRED";
  if (item.offerStatus === "ISSUED" || item.offerStatus === "RELEASED") return "OFFERED";
  const applied = item.results.filter((row) => row.appliedAt && row.outcome)
    .sort((a,b) => b.appliedAt!.getTime() - a.appliedAt!.getTime());
  const latest = applied[0]?.outcome;
  if (latest === "FAIL" || latest === "ABSENT") return "REJECTED";
  if (latest === "HOLD") return "WAITLISTED";
  return item.screening.status;
}

export function learnerApplicationIsComplete(item: LearnerApplicationBrowseItem) {
  const stage=learnerApplicationStage(item);
  if(stage==="WITHDRAWN"||stage==="HIRED")return true;
  // Old LMS treats a released offer as in progress even after the drive ends.
  if(item.offerStatus==="RELEASED"||item.offerStatus==="ISSUED")return false;
  // Honor the verified drive-live fact when present; otherwise retain
  // vNext's safe terminal-stage fallback instead of guessing from a title.
  if(typeof item.live==="boolean")return !item.live;
  if(item.jobStatus==="PUBLISHED")return false;
  if(item.jobStatus==="CLOSED"||item.jobStatus==="ARCHIVED"||item.jobStatus==="CANCELLED")return true;
  return stage==="REJECTED";
}

/** Current saved application/screening statuses, not inferred employer hiring outcomes. */
export function learnerApplicationViewCounts(rows:readonly LearnerApplicationBrowseItem[]){
 const completed=rows.filter(learnerApplicationIsComplete).length;
 return {all:rows.length,progress:rows.length-completed,completed};
}

export function learnerApplicationLatestActivity(item: LearnerApplicationBrowseItem) {
  const validTime=(date:Date|null)=>date&&Number.isFinite(date.getTime())?date.getTime():0;
  let latest=Math.max(validTime(item.submittedAt),validTime(item.withdrawnAt),validTime(item.screening.decidedAt));
  for(const result of item.results)latest=Math.max(latest,validTime(result.appliedAt));
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
      const submitted = (item: T) => {
        const time = item.submittedAt.getTime();
        return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
      };
      return submitted(a) - submitted(b) ||
        a.applicationId.localeCompare(b.applicationId);
    }
    return learnerApplicationLatestActivity(b) - learnerApplicationLatestActivity(a) ||
      a.applicationId.localeCompare(b.applicationId);
  });
}
