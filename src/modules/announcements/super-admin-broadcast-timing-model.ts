/** Convert datetime-local to explicit UTC, without throwing or silently erasing invalid dates. */
function parseLocal(value:string):string|null|undefined{
 if(!value.trim())return null;
 const date=new Date(value);
 return Number.isFinite(date.getTime())?date.toISOString():undefined;
}
export function broadcastLocalTiming(schedule:string,expiry:string){
 const scheduledAt=parseLocal(schedule);
 const expiresAt=parseLocal(expiry);
 const valid=scheduledAt!==undefined&&expiresAt!==undefined&&
  !(scheduledAt&&expiresAt&&new Date(expiresAt)<=new Date(scheduledAt));
 return {valid,scheduledAt:scheduledAt??null,expiresAt:expiresAt??null};
}
