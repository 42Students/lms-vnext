export function matchesWaitingSince(submittedAt:Date,waitingSince:string|undefined):boolean {
 if(!waitingSince)return true;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(waitingSince))throw Error("INVALID_WAITING_SINCE");
 const boundary=new Date(waitingSince+"T00:00:00+05:30");
 if(!Number.isFinite(boundary.getTime())||boundary.toLocaleDateString("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).length===0)
 throw Error("INVALID_WAITING_SINCE");
 return submittedAt.getTime()<=boundary.getTime();
}
