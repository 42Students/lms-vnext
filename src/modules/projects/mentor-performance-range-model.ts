export type MentorPerformanceRangeSprint={
  id:string;releaseId:string;status:string;
};

/** A scoped selection over sprints the caller already loaded for one project.
 * User-supplied selections never introduce an ID outside that authorized list,
 * and release-local sprint sequences need not be globally unique.
 */
export function selectMentorPerformanceSprints<T extends MentorPerformanceRangeSprint>(
  sortedSprints:readonly T[],
  range:string,
  lastFourIds:ReadonlySet<string>,
  pickedIds:readonly string[],
):T[]{
  if(range==="whole")return [...sortedSprints];
  if(range==="last4")return sortedSprints.filter(item=>lastFourIds.has(item.id));
  if(range==="current"){
    const current=sortedSprints.find(item=>item.status==="ACTIVE");
    return current?[current]:[];
  }
  if(range==="picked"){
    const requested=new Set(pickedIds);
    return sortedSprints.filter(item=>requested.has(item.id));
  }
  if(range.startsWith("release:")){
    const releaseId=range.slice("release:".length);
    return sortedSprints.filter(item=>item.releaseId===releaseId);
  }
  const selected=sortedSprints.find(item=>item.id===range);
  return selected?[selected]:[];
}
