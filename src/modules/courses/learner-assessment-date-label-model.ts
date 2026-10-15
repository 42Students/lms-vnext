/** Keeps invalid academic assessment dates out of visible deadline labels. */
export function learnerAssessmentDateLabel(value:string|null):string{
 if(value===null)return "No deadline";
 const when=new Date(value);
 if(!Number.isFinite(when.getTime()))return "Date unavailable";
 return new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(when);
}
