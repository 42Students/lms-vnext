import {orderMentorSprints} from "./mentor-sprint-order-model";

export type MentorAllocatableSprint={
  id:string;releaseId:string;sequence?:number;status?:string;
};
export type MentorAllocatableRelease={
  id:string;status?:string;sequence?:number;
};

/** Sprint numbers restart within each release. The next allocation target is
 * the first future planned sprint in release-order, not the sprint with the
 * next largest *local* sequence. Unknown/shipped releases are never targets.
 */
export function nextMentorAllocatableSprint<T extends MentorAllocatableSprint>(
  sprints:readonly T[],releases:readonly MentorAllocatableRelease[],
):T|null {
  const available=new Set(releases.filter(release=>release.status!=="SHIPPED")
    .map(release=>release.id));
  const orderedReleases=releases.map((release,index)=>({
    id:release.id,sequence:release.sequence??index,
  }));
  const eligible=sprints.filter((sprint):sprint is T&{sequence:number;status:string}=>
    available.has(sprint.releaseId)&&Number.isSafeInteger(sprint.sequence)&&
    typeof sprint.status==="string");
  const ordered=orderMentorSprints(eligible,orderedReleases);
  const currentIndex=ordered.findIndex(sprint=>sprint.status==="ACTIVE");
  return ordered.slice(currentIndex<0?0:currentIndex+1)
    .find(sprint=>sprint.status==="PLANNED")??null;
}
