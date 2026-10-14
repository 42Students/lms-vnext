import { collegeContentQuerySchema } from "./college-content-aggregate-model";
export const collegeLiveClassQuerySchema=collegeContentQuerySchema.omit({format:true});
export function liveClassSearchParams(values:Record<string,string|string[]|undefined>){
 const out:Record<string,string>={};
 for(const [key,value] of Object.entries(values)){
  if(Array.isArray(value))return null;
  if(value!==undefined)out[key]=value;
 }
 return out;
}
export function liveClassIstSchedule(start:Date|null,end:Date|null){
 if(!start||!end)return "Schedule not recorded";
 const fmt=new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",
  day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:true});
 return fmt.format(start)+" – "+fmt.format(end)+" IST";
}
