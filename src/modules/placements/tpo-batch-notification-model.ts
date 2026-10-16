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
export function indianCalendarDate(now:Date):string {
  const parts=new Intl.DateTimeFormat("en-US",{
    timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
  }).formatToParts(now);
  const get=(type:string)=>parts.find(part=>part.type===type)?.value??"";
  return get("year")+"-"+get("month")+"-"+get("day");
}
