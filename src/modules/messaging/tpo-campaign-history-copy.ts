import { DEFAULT_TIME_ZONE } from "@/config/locale";
/** Legacy Emails timestamp shape, fixed to college standard IST. */
export function tpoCampaignHistoryTime(value:Date):string{
 const parts=new Intl.DateTimeFormat("en-GB",{
  timeZone:DEFAULT_TIME_ZONE,hour:"2-digit",minute:"2-digit",
  day:"numeric",month:"short",year:"numeric",hour12:false,
 }).formatToParts(value);
 const read=(kind:Intl.DateTimeFormatPartTypes)=>
  parts.find(part=>part.type===kind)?.value??"";
 return read("hour")+":"+read("minute")+" "+read("day")+" "+
  read("month")+" "+read("year");
}
export function tpoCampaignHistoryStatus(value:string):string{
 return ({DRAFT:"Draft",SENDING:"Sending",SENT:"Sent",CANCELLED:"Cancelled"} as Record<string,string>)[value]??"Recorded";
}
