/** LEARNER-placements-13: saved drives are bookmarks, not applications. */
export function learnerSavedDriveIds(rows:readonly {jobId:string}[]):string[]{
 return [...new Set(rows.map(row=>row.jobId))];
}
export function learnerSavedDriveSummary(
 visibleJobIds:readonly string[],savedJobIds:readonly string[],
):{saved:number;expired:number;visibleIds:Set<string>} {
 const available=new Set(visibleJobIds);
 const saved=new Set(savedJobIds);
 const visibleIds=new Set([...saved].filter(id=>available.has(id)));
 return {saved:visibleIds.size,expired:saved.size-visibleIds.size,visibleIds};
}
export function learnerSavedDriveCopy(saved:boolean){
 return saved?{action:"Remove from saved jobs",toast:"Removed from saved jobs"}:
  {action:"Save for later",toast:"Saved for later"};
}
