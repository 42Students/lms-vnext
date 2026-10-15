/** Invalid historical application timestamps cannot crash the learner drawer. */
export function learnerApplicationDateLabel(date:Date|null):string{
 if(!date||!Number.isFinite(date.getTime()))return "Not available";
 return new Intl.DateTimeFormat("en-IN",{
  dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
 }).format(date);
}
