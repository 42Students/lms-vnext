/** "Waiting since" means submitted on or before the selected IST date,
 * inclusive of all hours on that date. */
export function matchesWaitingSince(submittedAt:Date,waitingSince:string|undefined):boolean {
 if(!waitingSince)return true;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(waitingSince))throw Error("INVALID_WAITING_SINCE");
 const [year,month,day]=waitingSince.split("-").map(Number);
 if (year === undefined || month === undefined || day === undefined) throw Error("INVALID_WAITING_SINCE");
 const dayStart=new Date(Date.UTC(year,month-1,day));
 if(!Number.isFinite(dayStart.getTime())||
    dayStart.toISOString().slice(0,10)!==waitingSince)throw Error("INVALID_WAITING_SINCE");
 const end=new Date(waitingSince+"T23:59:59.999+05:30");
 if(!Number.isFinite(end.getTime()))throw Error("INVALID_WAITING_SINCE");
 return submittedAt.getTime()<=end.getTime();
}

/** Includes all submissions from the beginning of the given Asia/Kolkata day. */
export function matchesSubmittedFrom(submittedAt:Date,submittedFrom:string|undefined):boolean {
 if(!submittedFrom)return true;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(submittedFrom))throw Error("INVALID_SUBMITTED_FROM");
 const [year,month,day]=submittedFrom.split("-").map(Number);
 if (year === undefined || month === undefined || day === undefined) throw Error("INVALID_SUBMITTED_FROM");
 const valid=new Date(Date.UTC(year,month-1,day));
 if(!Number.isFinite(valid.getTime())||valid.toISOString().slice(0,10)!==submittedFrom)throw Error("INVALID_SUBMITTED_FROM");
 return submittedAt.getTime()>=new Date(submittedFrom+"T00:00:00+05:30").getTime();
}
export function verificationSubmissionWindowValid(filter:{submittedFrom?:string|undefined;waitingSince?:string|undefined}):boolean {
 return !(filter.submittedFrom&&filter.waitingSince&&filter.submittedFrom>filter.waitingSince);
}

/** Pure, fixed-offset IST day boundaries. Upper bound is exclusive next midnight. */
export function verificationSubmittedSqlBounds(filter:{submittedFrom?:string|undefined;waitingSince?:string|undefined}){
 const valid=(value:string)=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&
  new Date(value+"T00:00:00Z").toISOString().slice(0,10)===value;
 const start=(value:string)=>{
  if(!valid(value))throw Error("INVALID_VERIFICATION_DATE");
  return new Date(value+"T00:00:00+05:30");
 };
 const from=filter.submittedFrom?start(filter.submittedFrom):undefined;
 const before=filter.waitingSince?new Date(start(filter.waitingSince).getTime()+86400000):undefined;
 return {from,before};
}
