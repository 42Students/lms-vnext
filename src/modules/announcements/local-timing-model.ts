/** Form-level temporal validation. Server-side DB10 validation remains authoritative. */
export function announcementLocalTiming(schedule:string,expiry:string){
 const toIso=(value:string):string|null|undefined=>{
  if(!value.trim())return null;
  const parsed=new Date(value);
  return Number.isFinite(parsed.getTime())?parsed.toISOString():undefined;
 };
 const scheduledAt=toIso(schedule);
 const expiresAt=toIso(expiry);
 return {
  valid:scheduledAt!==undefined&&expiresAt!==undefined&&
   !(scheduledAt&&expiresAt&&new Date(expiresAt)<=new Date(scheduledAt)),
  scheduledAt:scheduledAt??null,
  expiresAt:expiresAt??null,
 };
}
