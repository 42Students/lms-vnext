/**
 * For the Mentor prototype's "Last four sprints", only sprints that have
 * actually begun can contribute to historical workload. Future PLANNED
 * sprints are still offered separately by the sprint picker.
 *
 * A currently ACTIVE sprint is included even if it is past its end date
 * and awaiting sign-off, matching the task metrics on the live board.
 */
export type MentorWorkedSprint = {
  id: string;
  sequence: number;
  status: string;
};

export function recentMentorWorkedSprintIds(
  sprints: readonly MentorWorkedSprint[],
): string[] {
  return sprints
    .filter((sprint) => sprint.status === "ACTIVE" || sprint.status === "COMPLETED")
    .sort((left, right) => right.sequence - left.sequence)
    .slice(0, 4)
    .map((sprint) => sprint.id);
}
