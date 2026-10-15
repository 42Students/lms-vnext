import {z} from "zod";
export const trackerActivityCursorSchema=z.strictObject({
 activityBeforeCreatedAt:z.iso.datetime({offset:true}).transform(v=>new Date(v)).optional(),
 activityBeforeId:z.uuid().optional(),
}).superRefine((v,ctx)=>{
 if(Boolean(v.activityBeforeCreatedAt)!==Boolean(v.activityBeforeId)){
  ctx.addIssue({code:"custom",path:["activityBeforeId"],message:"Activity cursor must include timestamp and ID"});
 }
});
/** Preserve ISO strings across HTTP boundary; the service performs typed parsing. */
export function parseTrackerActivityCursorParams(raw:Record<string,string|string[]|undefined>){
 if(Object.values(raw).some(Array.isArray))return null;
 const normalized={activityBeforeCreatedAt:raw.activityBeforeCreatedAt,activityBeforeId:raw.activityBeforeId};
 if(Object.keys(raw).some(key=>!Object.hasOwn(normalized,key)))return null;
 return trackerActivityCursorSchema.safeParse(normalized).success?normalized:null;
}
