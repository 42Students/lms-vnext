import { DEFAULT_TIME_ZONE } from "@/config/locale";
export function tpoBatchDeadlineLabel(
 deadline:Date|null, lifecycleReady:boolean
):string {
 if(!lifecycleReady)return "Deadline unavailable";
 if(!deadline)return "No registration deadline recorded";
 return "Registration deadline: "+new Intl.DateTimeFormat("en-IN",{timeZone:DEFAULT_TIME_ZONE,day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:true}).format(deadline)+" IST";
}

/** TPO-batches-13 legacy card copy: finished batches carry no open registration date. */
export function tpoBatchCardDeadlineLabel(
 deadline:Date|null,lifecycleReady:boolean,finished:boolean,
):string|null{
 if(finished||!lifecycleReady||!deadline)return null;
 const parts=new Intl.DateTimeFormat("en-IN",{timeZone:DEFAULT_TIME_ZONE,
  day:"numeric",month:"short"}).formatToParts(deadline);
 const day=parts.find(p=>p.type==="day")?.value;
 const month=parts.find(p=>p.type==="month")?.value;
 return day&&month?"Register by "+Number(day)+" "+month:null;
}
