/** Render only valid persisted UTC instants, never the current time as a fallback. */
export function learnerOfferDisplayDate(raw:string|null):string|null{
 if(raw===null||raw.trim()==="")return null;
 const date=new Date(raw);
 if(!Number.isFinite(date.getTime()))return null;
 return new Intl.DateTimeFormat("en-IN",{
  dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
 }).format(date);
}
