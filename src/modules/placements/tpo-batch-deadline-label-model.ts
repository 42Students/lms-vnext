export function tpoBatchDeadlineLabel(
 deadline:Date|null, lifecycleReady:boolean
):string {
 if(!lifecycleReady)return "Deadline unavailable";
 if(!deadline)return "No registration deadline recorded";
 return "Registration deadline: "+new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:true}).format(deadline)+" IST";
}
