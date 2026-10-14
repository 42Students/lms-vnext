export type LearnerRoadmapMobileLesson={
  id:string;name:string;sequence:number;visibleCount:number;
};
/** The controller supplies counts from the learner's authorized and published lesson items. */
export function learnerRoadmapMobileOutline(
  rows:readonly LearnerRoadmapMobileLesson[],filter:"all"|"lectures"|"resources"|"assessments"|"live-sessions",
){
  return [...rows]
    .filter(row=>filter==="all"||row.visibleCount>0)
    .sort((a,b)=>a.sequence-b.sequence||a.id.localeCompare(b.id))
    .map(row=>({id:row.id,name:row.name,count:row.visibleCount}));
}
