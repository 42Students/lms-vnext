/** "Waiting since" means submitted on or before the selected IST date,
 * inclusive of all hours on that date. */
export function matchesWaitingSince(submittedAt:Date,waitingSince:string|undefined):boolean {
 if(!waitingSince)return true;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(waitingSince))throw Error("INVALID_WAITING_SINCE");
 const [year,month,day]=waitingSince.split("-").map(Number);
 const dayStart=new Date(Date.UTC(year,month-1,day));
 if(!Number.isFinite(dayStart.getTime())||
    dayStart.toISOString().slice(0,10)!==waitingSince)throw Error("INVALID_WAITING_SINCE");
 const end=new Date(waitingSince+"T23:59:59.999+05:30");
 if(!Number.isFinite(end.getTime()))throw Error("INVALID_WAITING_SINCE");
 return submittedAt.getTime()<=end.getTime();
}
