/** Links from the unplaced report to the nearest available actionable Students cohort.
 * READY_NOT_APPLYING is a subset, not all unplaced learners. */
export function tpoUnplacedStudentsHref(filters:{batchId?:string|null;branchId?:string|null}):string{
 const params=new URLSearchParams({journeyState:"READY_NOT_APPLYING"});
 if(filters.batchId)params.set("batchId",filters.batchId);
 if(filters.branchId)params.set("branchId",filters.branchId);
 return "/tpo/students?"+params.toString();
}
