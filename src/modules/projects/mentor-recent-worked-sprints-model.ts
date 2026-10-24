import {orderMentorSprints,type MentorOrderedRelease} from "./mentor-sprint-order-model";

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
  releaseId?: string;
  status: string;
};

export function recentMentorWorkedSprintIds(
  sprints: readonly MentorWorkedSprint[],
  releases?: readonly MentorOrderedRelease[],
): string[] {
  const scoped=sprints.filter(
    (s):s is MentorWorkedSprint&{releaseId:string}=>typeof s.releaseId==="string");
  const chronological=releases&&scoped.length===sprints.length
    ?orderMentorSprints(scoped,releases)
    :[...sprints].sort((a,b)=>a.sequence-b.sequence||a.id.localeCompare(b.id));
  return chronological
    .filter((sprint) => sprint.status === "ACTIVE" || sprint.status === "COMPLETED")
    .reverse()
    .slice(0, 4)
    .map((sprint) => sprint.id);
}
