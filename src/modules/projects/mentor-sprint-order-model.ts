/** Sprint sequence is release-local. Compare the persisted release order first. */
export type MentorOrderedRelease={id:string;sequence:number};
export type MentorOrderedSprint={id:string;releaseId:string;sequence:number;status:string};

export function isLaterMentorSprint(
  current:{releaseSequence:number;sprintSequence:number},
  candidate:{releaseSequence:number;sprintSequence:number},
):boolean {
  return candidate.releaseSequence>current.releaseSequence||
    (candidate.releaseSequence===current.releaseSequence&&
      candidate.sprintSequence>current.sprintSequence);
}

/** Stable project-wide timeline; unknown releases sort last rather than first. */
export function orderMentorSprints<T extends MentorOrderedSprint>(
  sprints:readonly T[],releases:readonly MentorOrderedRelease[],
):T[] {
  const releaseSequence=new Map(releases.map(row=>[row.id,row.sequence] as const));
  return [...sprints].sort((a,b)=>
    (releaseSequence.get(a.releaseId)??Number.MAX_SAFE_INTEGER)-
    (releaseSequence.get(b.releaseId)??Number.MAX_SAFE_INTEGER)||
    a.sequence-b.sequence||a.id.localeCompare(b.id));
}

/** Only offer a following planned sprint, including across release boundaries. */
export function nextPlannedMentorSprint<T extends MentorOrderedSprint>(
  current:T,sprints:readonly T[],releases:readonly MentorOrderedRelease[],
):T|null{
  const ordered=orderMentorSprints(sprints,releases);
  const start=ordered.findIndex(row=>row.id===current.id);
  return start<0?null:ordered.slice(start+1).find(row=>row.status==="PLANNED")??null;
}

/** Keep a contextual Add sprint action scoped to its unsent release choice. */
export function mentorSprintDefaultReleaseId(
  requestedId:string,releases:readonly {id:string;status:string}[],
):string {
  return releases.some(row=>row.id===requestedId&&row.status!=="SHIPPED")
    ?requestedId:"";
}
