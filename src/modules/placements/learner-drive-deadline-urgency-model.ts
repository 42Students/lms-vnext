export type LearnerDriveUrgency="closed"|"no-deadline"|"today"|"soon"|"future";
/** Old LMS job-card deadline labels use calendar days, not 24-hour periods.
 * The vNext global display timezone is Asia/Kolkata (UTC+05:30).
 * A deadline is closed only after the exact persisted instant has passed. */
export function learnerDriveDeadlineUrgency(
 deadlineIso:string|null,deadlinePassed:boolean,snapshotNowIso:string|null,
):{kind:LearnerDriveUrgency;label:string;tone:"error"|"warning"|"neutral"}{
 if(!deadlineIso)return {kind:"no-deadline",label:"No deadline set",tone:"neutral"};
 const deadline=Date.parse(deadlineIso);
 if(!snapshotNowIso){
  if(deadlinePassed)return {kind:"closed",label:"Closed "+new Intl.DateTimeFormat("en-IN",{
   day:"numeric",month:"short",year:"numeric",timeZone:"Asia/Kolkata",
  }).format(new Date(deadline)),tone:"error"};
  return {kind:"future",label:"Deadline listed",tone:"neutral"};
 }
 const now=Date.parse(snapshotNowIso);
 if(!Number.isFinite(deadline)||!Number.isFinite(now))
  return {kind:"no-deadline",label:"No deadline set",tone:"neutral"};
 const formatted=new Intl.DateTimeFormat("en-IN",{
  day:"numeric",month:"short",year:"numeric",timeZone:"Asia/Kolkata",
 }).format(new Date(deadline));
 if(deadlinePassed||deadline<now)
  return {kind:"closed",label:"Closed "+formatted,tone:"error"};
 const offset=330*60000,dayMs=86400000;
 const daysLeft=Math.floor((deadline+offset)/dayMs)-Math.floor((now+offset)/dayMs);
 if(daysLeft<=0)return {kind:"today",label:"Closes today",tone:"warning"};
 if(daysLeft===1)return {kind:"today",label:"Closes tomorrow",tone:"warning"};
 if(daysLeft<=3)return {kind:"soon",label:"Closes in "+daysLeft+" days",tone:"warning"};
 if(daysLeft<=7)return {kind:"soon",label:"Closes in "+daysLeft+" days",tone:"warning"};
 return {kind:"future",label:"Apply by "+formatted,tone:"neutral"};
}
