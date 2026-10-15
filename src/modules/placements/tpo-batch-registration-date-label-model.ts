export function tpoRegistrationRecordedAtLabel(value:string|null):string{
 if(!value)return "No recorded registration update";
 const time=new Date(value);
 if(!Number.isFinite(time.getTime()))return "Recorded update time unavailable";
 return new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(time)+" IST";
}
export function tpoRegistrationDaysSince(value:string|null,asOf:Date):number|null{
 if(!value)return null;
 const epoch=Date.parse(value);
 if(!Number.isFinite(epoch)||epoch>asOf.getTime())return null;
 return Math.floor((asOf.getTime()-epoch)/86400000);
}
