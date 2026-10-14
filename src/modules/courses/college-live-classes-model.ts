import { z } from "zod";
import { collegeContentQuerySchema } from "./college-content-aggregate-model";
export const collegeLiveClassQuerySchema=collegeContentQuerySchema.omit({format:true}).extend({
 view:z.enum(["ALL","UPCOMING","PAST"]).default("ALL"),
});
export function collegeLiveClassHref(query:{q:string;courseCode?:string;status:string;page:number;view:"ALL"|"UPCOMING"|"PAST"}){
 const p=new URLSearchParams();
 if(query.q)p.set("q",query.q);
 if(query.courseCode)p.set("courseCode",query.courseCode);
 if(query.status!=="ALL")p.set("status",query.status);
 if(query.view!=="ALL")p.set("view",query.view);
 if(query.page>1)p.set("page",String(query.page));
 return "/college/live-classes"+(p.size?"?"+p.toString():"");
}
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
