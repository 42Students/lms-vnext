import type { ProjectParticipantListQuery } from "@/components/projects/project-participant-list-controls";

export type LearnerProjectMobileFilterSummary = {
  count: number;
  labels: string[];
};
/** Active filters are visible even when the compact mobile form is closed. */
export function learnerProjectMobileFilterSummary(
  query: ProjectParticipantListQuery,
): LearnerProjectMobileFilterSummary {
  const labels: string[] = [];
  if (query.search?.trim()) labels.push("Search");
  if (query.sort && query.sort !== "RECENT") labels.push(query.sort === "TITLE" ? "Title order" : "Progress order");
  if (query.work === "BLOCKED") labels.push("Blocked tasks");
  if (query.work === "NO_TASKS") labels.push("No tracked tasks");
  if (query.status) labels.push(query.status === "CURRENT" ? "Current" : query.status);
  if (query.attention === "LEARNER_ACTION") labels.push("Needs my action");
  if (query.attention === "BLOCKED") labels.push("Blocked");
  if (query.pageSize && query.pageSize !== 25) labels.push(String(query.pageSize)+" rows");
  return {count:labels.length,labels};
}
