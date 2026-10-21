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
export type LearnerBookmarkSurface="LIST"|"DETAIL";
export function learnerSavedDriveCopy(
 saved:boolean,surface:LearnerBookmarkSurface="DETAIL",
){
 return {
  action:saved?"Remove from saved jobs":"Save for later",
  tooltip:saved?"Saved":"Save for later",
  iconLabel:saved?"Saved":"Not saved",
  // List hearts update quietly; detail bookmarks use Ant-style success toast.
  toast:surface==="DETAIL"?
   (saved?"Removed from saved jobs":"Saved for later"):null,
  showToast:surface==="DETAIL",
 };
}
/** After mutation, show the copy for the completed action, not the new button
 * state. This keeps exact legacy punctuation in the detail-level toast. */
export function learnerSavedDriveMutationFeedback(
 nowSaved:boolean,surface:LearnerBookmarkSurface,
){
 return {
  announcement:nowSaved?"Saved for later":"Removed from saved jobs",
  toast:surface==="DETAIL"?(nowSaved?"Saved for later":"Removed from saved jobs"):null,
 };
}
