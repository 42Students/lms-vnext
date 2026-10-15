export type MentorProjectAssignmentFilter = "PRIMARY" | "SUPPORTING";
export function matchesMentorProjectAssignment(filter: MentorProjectAssignmentFilter | undefined, isPrimaryMentor: boolean): boolean {
  return filter === undefined || (filter === "PRIMARY" ? isPrimaryMentor : !isPrimaryMentor);
}
