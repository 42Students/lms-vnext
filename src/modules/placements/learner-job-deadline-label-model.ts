/** Timezone-stable display of a saved drive deadline. Invalid persisted dates are unknown. */
export function learnerJobDeadlineLabel(value:string|null):string{
 if(!value)return "Not specified";
 const date=new Date(value);
 if(!Number.isFinite(date.getTime()))return "Not available";
 return new Intl.DateTimeFormat("en-IN",{
  dateStyle:"long",timeStyle:"short",timeZone:"Asia/Kolkata",
 }).format(date);
}
