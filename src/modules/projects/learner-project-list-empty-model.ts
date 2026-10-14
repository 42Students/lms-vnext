export type LearnerProjectListEmptyState = {
  title: string;
  description: string;
  reason: "NO_ASSIGNMENTS" | "FILTERED_EMPTY" | "HAS_RESULTS";
};
/** Only a successfully loaded source may be classified as empty. */
export function learnerProjectListEmptyState(
  assignedCount: number,
  matchedCount: number,
): LearnerProjectListEmptyState {
  if (assignedCount === 0)
    return {reason:"NO_ASSIGNMENTS",title:"No Projects yet",
      description:"Projects will appear here after your college assigns you to a Project team."};
  if (matchedCount === 0)
    return {reason:"FILTERED_EMPTY",title:"No Projects match these filters",
      description:"Clear or change the filters to see other assigned Projects."};
  return {reason:"HAS_RESULTS",title:"Projects",
    description:"Your assigned Project workspaces."};
}
