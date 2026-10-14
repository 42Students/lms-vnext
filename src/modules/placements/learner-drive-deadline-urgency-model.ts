export type LearnerDriveUrgency="closed"|"no-deadline"|"today"|"soon"|"future";
export function learnerDriveDeadlineUrgency(
  deadlineIso:string|null,deadlinePassed:boolean,snapshotNowIso:string|null,
):{kind:LearnerDriveUrgency;label:string;tone:"error"|"warning"|"neutral"} {
  if(deadlinePassed)return {kind:"closed",label:"Application closed",tone:"error"};
  if(!deadlineIso)return {kind:"no-deadline",label:"No deadline announced",tone:"neutral"};
  const deadline=Date.parse(deadlineIso);
  const now=snapshotNowIso?Date.parse(snapshotNowIso):Number.NaN;
  if(!Number.isFinite(now)||!Number.isFinite(deadline))
    return {kind:"future",label:"Deadline listed",tone:"neutral"};
  const remaining=deadline-now;
  if(remaining<=0)return {kind:"closed",label:"Application closed",tone:"error"};
  if(remaining<=24*60*60*1000)
    return {kind:"today",label:"Closes within 24 hours",tone:"warning"};
  if(remaining<=7*24*60*60*1000)
    return {kind:"soon",label:"Closes within 7 days",tone:"warning"};
  return {kind:"future",label:"Deadline scheduled",tone:"neutral"};
}
