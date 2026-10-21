/** Existing round/job/application relationships still enforce same-college scope. */
export function historicalSlotDurationMinutes(raw:number|null){
 return raw===null||!Number.isSafeInteger(raw)||raw<=0?60:raw;
}
export function legacySlotMode(input:{mode:string|null;room:string|null;url:string|null}){
 const mode=input.mode?.trim().toUpperCase();
 return mode==="ONLINE"?{label:"Online",place:input.url||"Meeting link not added"}:
  {label:"In person",place:input.room?.trim()||"Room not announced"};
}
export function legacySlotDisplayStatus(status:string|null){
 const key=status?.trim().toUpperCase();
 switch(key){
 case "CONFIRMED":return "Confirmed";
 case "RESCHEDULE_REQUESTED":return "Reschedule requested";
 case "COMPLETED":return "Completed";
 case "NO_SHOW":return "No show";
 case "CANCELLED":return "Cancelled";
 default:return "Scheduled";
 }
}
export function legacySlotChanged(previous:Date|null,current:Date){
 return previous!==null&&previous.getTime()!==current.getTime();
}
export function legacySlotDateIst(date:Date){
 return new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(date);
}
