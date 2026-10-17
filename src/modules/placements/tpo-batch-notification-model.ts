/** Placement registration copy always displays the batch and IST day deadline. */
export function formatBatchRegistrationNotice(batchName:string,deadline:Date,reopened:boolean) {
  const day = new Intl.DateTimeFormat("en-IN",{
    timeZone:"Asia/Kolkata",day:"numeric",month:"short",year:"numeric",
  }).format(deadline);
  return {
    title: reopened ? "Placement registration reopened" : "Placement registration is open",
    body: batchName + ": " + (reopened?"registration reopened":"registration is open") +
      ". Register by " + day + ".",
  };
}
/** TPO-batches-20: date-level dedupe scoped to IST, not host-local midnight. */
export function tpoBatchReminderDayKey(now:Date):string{
 return indianCalendarDate(now);
}
export function tpoBatchReminderCopy(name:string,deadline:Date){
 const day=new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",
  day:"numeric",month:"short",year:"numeric"}).format(deadline);
 return {title:"Reminder to register for placements",
  body:name+": please record your registration choice by "+day+"."};
}
export function indianCalendarDate(now:Date):string {
  const parts=new Intl.DateTimeFormat("en-US",{
    timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
  }).formatToParts(now);
  const get=(type:string)=>parts.find(part=>part.type===type)?.value??"";
  return get("year")+"-"+get("month")+"-"+get("day");
}
