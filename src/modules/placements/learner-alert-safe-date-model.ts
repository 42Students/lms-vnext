/** A broken saved alert instant must not erase other personal notifications. */
export function learnerAlertSafeDate(value:Date):{iso:string|null;label:string}{
 if(!Number.isFinite(value.getTime()))return {iso:null,label:"Date unavailable"};
 return {iso:value.toISOString(),label:new Intl.DateTimeFormat("en-IN",{
  dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
 }).format(value)+" IST"};
}
