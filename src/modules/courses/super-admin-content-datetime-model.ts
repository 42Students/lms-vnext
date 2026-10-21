import {parseCollegeIstLocal} from "./college-ist-datetime-model";

export type AdminContentTimeZone="Asia/Kolkata"|"UTC"|"America/New_York"|"America/Los_Angeles"|"Europe/London";

/** datetime-local values have no zone. Verify the wall clock explicitly in the
 * selected IANA zone; reject nonexistent or ambiguous DST times rather than
 * silently changing the scheduled class to a different instant. */
export function parseAdminContentLocalMoment(value:string,zone:AdminContentTimeZone):string|null{
 if(zone==="Asia/Kolkata")return parseCollegeIstLocal(value);
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))return null;
 const year=Number(value.slice(0,4));
 if(year<2000||year>9999)return null;
 const wall=Date.parse(value+":00Z");
 if(!Number.isFinite(wall)||new Date(wall).toISOString().slice(0,16)!==value)return null;
 if(zone==="UTC")return new Date(wall).toISOString();
 const formatter=new Intl.DateTimeFormat("en-GB",{timeZone:zone,year:"numeric",
  month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
 let match:string|null=null;
 // Covers every offset used by supported legacy meeting zones, including DST.
 for(let offset=-14*60;offset<=14*60;offset+=15){
  const instant=wall-offset*60000;
  const parts=formatter.formatToParts(new Date(instant));
  const get=(kind:string)=>parts.find(part=>part.type===kind)?.value??"";
  const shown=get("year")+"-"+get("month")+"-"+get("day")+"T"+get("hour")+":"+get("minute");
  if(shown!==value)continue;
  if(match)return null;
  match=new Date(instant).toISOString();
 }
 return match;
}
