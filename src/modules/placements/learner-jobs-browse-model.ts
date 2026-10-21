import { z } from "zod";

export const learnerClosingSoonQuerySchema = z.literal("1");
export const learnerDriveAvailabilitySchema = z.enum(["all","open","not-open","closed"]);

/** Learner placement browse facets apply to the authorized published-job rows.
 * Filtering never re-evaluates eligibility or mutates application state.
 */
export type BrowseJobShape = {
  job: {
    id: string;
    title: string;
    description: string;
    jobTypeLabel?:string|null;
    responsibilities?:string|null;
    targetDepartmentName?:string|null;
    targetProgramName?:string|null;
    targetDepartmentId?:string|null;
    targetProgramId?:string|null;
    /** Historical saved postings may be inactive but still readable. */
    isActive?:boolean;
    status?:string;
    applicationDeadline: string | null;
    publishedAt?: string | null;
  };
  company: { name: string };
  roleOption: {
    id: string;
    title: string;
    employmentType: string;
    locations: string[];
    minimumAnnualCtcInr: number | null;
    maximumAnnualCtcInr: number | null;
  };
  canApply: boolean;
  /** Legacy visibleFlag: browsing eligibility, not permission to submit. */
  visibleToLearner?:boolean;
  deadlinePassed: boolean;
};

/** Missing/invalid compensation is unknown, never treated as a high offer. */
export function learnerDriveCtcSortKey(row:BrowseJobShape):number{
 const values=[
   row.roleOption.minimumAnnualCtcInr,
   row.roleOption.maximumAnnualCtcInr,
 ].filter((v):v is number=>typeof v==="number"&&Number.isFinite(v)&&v>=0);
 return values.length>0?Math.max(...values):-1;
}

export type LearnerJobBrowseFilters = {
  search: string;
  employmentType: string;
  location: string;
  eligibleOnly: boolean;
  /** Optional permitted-scoped administrative search facets. */
  departmentId?:string;
  programId?:string;
  jobType?:string;
  closingSoon: boolean;
  availability: z.infer<typeof learnerDriveAvailabilitySchema>;
  sort: "deadline" | "ctc" | "title" | "newest";
};

export const DEFAULT_LEARNER_JOB_FILTERS: LearnerJobBrowseFilters = {
  search: "", employmentType: "all", location: "all",
  eligibleOnly: false, closingSoon: false, availability: "all", sort: "deadline",
};

/** A published drive is not necessarily open to THIS learner for a new application. */
export function learnerDriveAvailability(item: BrowseJobShape): "open" | "not-open" | "closed" {
  if (item.deadlinePassed || item.job.isActive===false ||
      (item.job.status!==undefined && item.job.status!=="PUBLISHED")) return "closed";
  return item.canApply ? "open" : "not-open";
}

export function learnerDriveAvailabilityCounts(items:readonly BrowseJobShape[]) {
  const counts={all:items.length,open:0,"not-open":0,closed:0};
  for(const item of items)counts[learnerDriveAvailability(item)]++;
  return counts;
}

const synonyms:Readonly<Record<string,readonly string[]>>={
 "sde":["software engineer","software developer"],"wfh":["remote","work from home"],
 "software engineer":["sde","developer"],"work from home":["wfh","remote"],
 "remote":["wfh","work from home"],"intern":["internship","trainee"],
 "internship":["intern","trainee"],"hybrid":["partly remote","hybrid work"],
};
function visibleJobType(row:BrowseJobShape){
 return row.job.jobTypeLabel?.trim()||row.roleOption.employmentType;
}
export function availableLearnerJobFacets<T extends BrowseJobShape>(items: readonly T[]) {
  return {
    types: [...new Set(items.map(visibleJobType))]
      .filter(Boolean).sort((a,b) => a.localeCompare(b)),
    locations: [...new Map(items.flatMap(row=>row.roleOption.locations)
      .map(value=>value.trim()).filter(Boolean)
      .map(value=>[value.toLocaleLowerCase(),value] as const)).values()]
      .sort((a,b)=>a.localeCompare(b)),
  };
}

/** Role-option counts for filter facets; no unauthorized global catalog lookup. */
export function learnerJobEmploymentTypeCounts(items:readonly BrowseJobShape[]){
 const counts=new Map<string,number>();
 for(const row of items){
  const type=visibleJobType(row);
  if(!type)continue;
  counts.set(type,(counts.get(type)??0)+1);
 }
 return counts;
}

export function filterLearnerPlacementJobs<T extends BrowseJobShape>(
  items: readonly T[], filters: LearnerJobBrowseFilters,
  snapshotNowMs: number = Number.NaN,
): T[] {
  const search=filters.search.trim().toLocaleLowerCase();
  // Legacy search combines eight posting fields, but a query can contain
  // words from different fields. Match each word (with recognized legacy
  // synonyms) without requiring them to be adjacent in a single column.
  const terms=search.split(/\s+/).filter(Boolean);
  const rows = items.filter((row) => {
    if (filters.availability !== "all" && learnerDriveAvailability(row) !== filters.availability) return false;
    // Eligibility may be true for a historical snapshot even after closure.
    // Never offer a closed drive as actionable in the eligible-only view.
    // The legacy Eligible-only filter follows audience visibility, even if
    // a visible role is temporarily closed or blocked for self-application.
    if(filters.eligibleOnly && !(row.visibleToLearner ?? row.canApply))return false;
    if(filters.departmentId && row.job.targetDepartmentId!==filters.departmentId)return false;
    if(filters.programId && row.job.targetProgramId!==filters.programId)return false;
    if(filters.jobType && visibleJobType(row).toLocaleLowerCase("en-IN")!==
       filters.jobType.toLocaleLowerCase("en-IN"))return false;
    if (filters.closingSoon) {
      const deadline = row.job.applicationDeadline
        ? Date.parse(row.job.applicationDeadline) : Number.NaN;
      const weekEnd = snapshotNowMs + 7 * 24 * 60 * 60 * 1000;
      if (!Number.isFinite(snapshotNowMs) || !Number.isFinite(deadline) ||
          deadline < snapshotNowMs || deadline > weekEnd || row.deadlinePassed) {
        return false;
      }
    }
    if (filters.employmentType !== "all" &&
        visibleJobType(row) !== filters.employmentType) return false;
    if(filters.location!=="all"&&!(row.roleOption.locations??[]).some(place=>
      place.trim().toLocaleLowerCase()===filters.location.trim().toLocaleLowerCase()))return false;
    if (!search) return true;
    const indexed=[
      row.company?.name,row.roleOption?.title,row.job?.title,row.job?.description,
      row.job?.responsibilities,row.job?.targetDepartmentName,row.job?.targetProgramName,
      row.job?.jobTypeLabel,row.roleOption?.employmentType,...(row.roleOption?.locations??[]),
    ].filter((field):field is string=>typeof field==="string")
     .join(" ").toLocaleLowerCase();
    return indexed.includes(search)||terms.every(term=>
      [term,...(synonyms[term]??[])].some(candidate=>indexed.includes(candidate)));
  });

  return [...rows].sort((a,b) => {
    if (filters.sort === "newest") {
      const published = (row: T) => row.job.publishedAt
        ? Date.parse(row.job.publishedAt) : Number.NaN;
      const publishedTime = (row: T) => Number.isFinite(published(row))
        ? published(row) : Number.NEGATIVE_INFINITY;
      return publishedTime(b) - publishedTime(a) ||
        a.roleOption.id.localeCompare(b.roleOption.id);
    }
    if (filters.sort === "ctc") {
      return learnerDriveCtcSortKey(b)-learnerDriveCtcSortKey(a) ||
        a.roleOption.id.localeCompare(b.roleOption.id);
    }
    if (filters.sort === "title") {
      return (a.roleOption.title??"").localeCompare(b.roleOption.title??"") ||
        a.roleOption.id.localeCompare(b.roleOption.id);
    }
    // A closed or malformed-deadline drive must not outrank actionable
    // upcoming deadlines. No caller time is used to override saved policy.
    const deadline=(row:T)=>{
      if(row.deadlinePassed||!row.job.applicationDeadline)return Number.MAX_SAFE_INTEGER;
      const instant=Date.parse(row.job.applicationDeadline);
      return Number.isFinite(instant)?instant:Number.MAX_SAFE_INTEGER;
    };
    return deadline(a) - deadline(b) ||
      (a.roleOption.title??"").localeCompare(b.roleOption.title??"") ||
      a.roleOption.id.localeCompare(b.roleOption.id);
  });
}
