/** A corrupt audit timestamp must never crash the private verification page. */
export function learnerVerificationDateLabel(instant:string|null):string|null{
 if(!instant)return null;
 const date=new Date(instant);
 if(!Number.isFinite(date.getTime()))return null;
 return new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(date);
}
