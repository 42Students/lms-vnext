import { z } from "zod";

export const learnerClosingSoonQuerySchema = z.literal("1");

/** Learner placement browse facets apply to the authorized published-job rows.
 * Filtering never re-evaluates eligibility or mutates application state.
 */
export type BrowseJobShape = {
  job: {
    id: string;
    title: string;
    description: string;
    applicationDeadline: string | null;
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
  deadlinePassed: boolean;
};

export type LearnerJobBrowseFilters = {
  search: string;
  employmentType: string;
  location: string;
  eligibleOnly: boolean;
  closingSoon: boolean;
  sort: "deadline" | "ctc" | "title";
};

export const DEFAULT_LEARNER_JOB_FILTERS: LearnerJobBrowseFilters = {
  search: "", employmentType: "all", location: "all",
  eligibleOnly: false, closingSoon: false, sort: "deadline",
};

export function availableLearnerJobFacets<T extends BrowseJobShape>(items: readonly T[]) {
  return {
    types: [...new Set(items.map((row) => row.roleOption.employmentType))]
      .filter(Boolean).sort((a,b) => a.localeCompare(b)),
    locations: [...new Set(items.flatMap((row) => row.roleOption.locations))]
      .filter(Boolean).sort((a,b) => a.localeCompare(b)),
  };
}

export function filterLearnerPlacementJobs<T extends BrowseJobShape>(
  items: readonly T[], filters: LearnerJobBrowseFilters,
  snapshotNowMs: number = Number.NaN,
): T[] {
  const search = filters.search.trim().toLocaleLowerCase();
  const rows = items.filter((row) => {
    if (filters.eligibleOnly && !row.canApply) return false;
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
        row.roleOption.employmentType !== filters.employmentType) return false;
    if (filters.location !== "all" &&
        !row.roleOption.locations.includes(filters.location)) return false;
    if (!search) return true;
    return [
      row.company.name,
      row.roleOption.title,
      row.job.title,
      row.job.description,
      ...row.roleOption.locations,
    ].join(" ").toLocaleLowerCase().includes(search);
  });

  return [...rows].sort((a,b) => {
    if (filters.sort === "ctc") {
      const ctc = (row: T) => row.roleOption.maximumAnnualCtcInr ??
        row.roleOption.minimumAnnualCtcInr ?? -1;
      return ctc(b) - ctc(a) || a.roleOption.id.localeCompare(b.roleOption.id);
    }
    if (filters.sort === "title") {
      return a.roleOption.title.localeCompare(b.roleOption.title) ||
        a.roleOption.id.localeCompare(b.roleOption.id);
    }
    const deadline = (row: T) => row.job.applicationDeadline
      ? Date.parse(row.job.applicationDeadline) : Number.MAX_SAFE_INTEGER;
    return deadline(a) - deadline(b) ||
      a.roleOption.title.localeCompare(b.roleOption.title) ||
      a.roleOption.id.localeCompare(b.roleOption.id);
  });
}
