export type MentorPrototypeSprintSummary={
  total:number;
  completed:number;
  /** One-based project-wide timeline position, not the release-local sequence. */
  activeSequence:number|null;
  segments:readonly {sequence:number;releaseSequence:number;status:string}[];
};

/** Stable project-wide timeline for roster dots and X-of-Y progress.
 * Sprint sequence may restart in each release: release order always wins.
 */
export function summarizeMentorProjectSprints(rows:readonly {
  id:string;projectId:string;sequence:number;releaseSequence:number;status:string;
}[]):Map<string,MentorPrototypeSprintSummary>{
 const ordered=[...rows].sort((a,b)=>
   a.projectId.localeCompare(b.projectId)||
   a.releaseSequence-b.releaseSequence||a.sequence-b.sequence||
   a.id.localeCompare(b.id));
 const grouped=new Map<string,Array<{sequence:number;releaseSequence:number;status:string}>>();
 for(const row of ordered){
  const found=grouped.get(row.projectId)??[];
  found.push({sequence:row.sequence,releaseSequence:row.releaseSequence,status:row.status});
  grouped.set(row.projectId,found);
 }
 const results=new Map<string,MentorPrototypeSprintSummary>();
 for(const [projectId,segments] of grouped){
  const activeIndex=segments.findIndex(item=>item.status==="ACTIVE");
  results.set(projectId,{
   total:segments.length,
   completed:segments.filter(item=>item.status==="COMPLETED").length,
   activeSequence:activeIndex>=0?activeIndex+1:null,
   segments,
  });
 }
 return results;
}
