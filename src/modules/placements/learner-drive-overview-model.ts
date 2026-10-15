import type {BrowseJobShape} from "./learner-jobs-browse-model";
/** Count unique published drives independently from their visible role options. */
export function learnerDriveOverview<T extends BrowseJobShape & {application?:unknown|null}>(rows:readonly T[]){
 const jobs=new Set<string>(),applied=new Set<string>();
 for(const row of rows){jobs.add(row.job.id);if(row.application)applied.add(row.job.id);}
 return {drives:jobs.size,roles:rows.length,withApplications:applied.size};
}

/** A multi-role job appears once in each drive-state counter. Any applicable
 * open role makes that drive open to the current learner; no new eligibility
 * is inferred beyond the authorized role rows. */
export function learnerDriveAvailabilityDriveCounts<T extends BrowseJobShape>(
 rows:readonly T[],
){
 const states=new Map<string,"open"|"not-open"|"closed">();
 for(const row of rows){
  const next=row.deadlinePassed?"closed":row.canApply?"open":"not-open";
  const prior=states.get(row.job.id);
  if(!prior||next==="open"||(prior==="closed"&&next==="not-open"))states.set(row.job.id,next);
 }
 const counts={all:states.size,open:0,"not-open":0,closed:0};
 for(const value of states.values())counts[value]++;
 return counts;
}
