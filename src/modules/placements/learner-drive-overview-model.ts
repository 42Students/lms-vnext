import type {BrowseJobShape} from "./learner-jobs-browse-model";
/** Count unique published drives independently from their visible role options. */
export function learnerDriveOverview<T extends BrowseJobShape & {application?:unknown|null}>(rows:readonly T[]){
 const jobs=new Set<string>(),applied=new Set<string>();
 for(const row of rows){jobs.add(row.job.id);if(row.application)applied.add(row.job.id);}
 return {drives:jobs.size,roles:rows.length,withApplications:applied.size};
}
