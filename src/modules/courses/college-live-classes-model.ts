import { z } from "zod";
import { collegeContentQuerySchema } from "./college-content-aggregate-model";
export const collegeIstDateSchema=z.string()
 .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)
 .refine(day=>{const date=new Date(day+"T00:00:00Z");
   return Number.isFinite(date.valueOf())&&date.toISOString().slice(0,10)===day;
 },{message:"Invalid calendar date"});
export const collegeLiveClassQuerySchema=collegeContentQuerySchema.omit({format:true}).extend({
 view:z.enum(["ALL","UPCOMING","PAST"]).default("ALL"),
 from:collegeIstDateSchema.optional(),
 to:collegeIstDateSchema.optional(),
}).refine(q=>!q.from||!q.to||q.from<=q.to,{message:"Inverted date range"})
  .refine(q=>!q.from||!q.to||
   (Date.parse(q.to+"T00:00:00Z")-Date.parse(q.from+"T00:00:00Z"))/86400000<31,
   {message:"Date range exceeds 31 days"});
export function istDayBoundary(day:string,nextDay=false){
 const [year=Number.NaN,month=Number.NaN,date=Number.NaN]=day.split("-").map(Number);
 return new Date(Date.UTC(year,month-1,date+(nextDay?1:0))-330*60000);
}
export function collegeLiveClassHref(query:{q:string;courseCode?:string;status:string;page:number;view:"ALL"|"UPCOMING"|"PAST";from?:string;to?:string;scope?:"ALL"|"SHARED"|"SECTION";deliveryId?:string}){
 const p=new URLSearchParams();
 if(query.q)p.set("q",query.q);
 if(query.courseCode)p.set("courseCode",query.courseCode);
 if(query.status!=="ALL")p.set("status",query.status);
 if(query.view!=="ALL")p.set("view",query.view);
 if(query.scope&&query.scope!=="ALL")p.set("scope",query.scope);
 if(query.deliveryId)p.set("deliveryId",query.deliveryId);
 if(query.from)p.set("from",query.from);
 if(query.to)p.set("to",query.to);
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
