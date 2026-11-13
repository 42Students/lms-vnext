import { DEFAULT_TIME_ZONE } from "@/config/locale";
/** A corrupt audit timestamp must never crash the private verification page. */
export function learnerVerificationDateLabel(instant:string|null):string|null{
 if(!instant)return null;
 const date=new Date(instant);
 if(!Number.isFinite(date.getTime()))return null;
 return new Intl.DateTimeFormat("en-IN",{timeZone:DEFAULT_TIME_ZONE,dateStyle:"medium",timeStyle:"short"}).format(date);
}

/** A corrupt review date is not evidence that the learner never submitted. */
export function learnerVerificationSubmissionDateFallback(value:string|null):string{
 return value===null?"Not yet submitted":"Saved submission time unavailable";
}
