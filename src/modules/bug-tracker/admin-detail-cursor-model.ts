import {z} from "zod";
export const trackerActivityCursorSchema=z.strictObject({
 activityBeforeCreatedAt:z.iso.datetime({offset:true}).transform(v=>new Date(v)).optional(),
 activityBeforeId:z.uuid().optional(),
 attachmentBeforeCreatedAt:z.iso.datetime({offset:true}).transform(v=>new Date(v)).optional(),
 attachmentBeforeId:z.uuid().optional(),
}).superRefine((v,ctx)=>{
 if(Boolean(v.attachmentBeforeCreatedAt)!==Boolean(v.attachmentBeforeId)){
  ctx.addIssue({code:"custom",path:["attachmentBeforeId"],message:"Attachment cursor must include timestamp and ID"});
 }
 if(Boolean(v.activityBeforeCreatedAt)!==Boolean(v.activityBeforeId)){
  ctx.addIssue({code:"custom",path:["activityBeforeId"],message:"Activity cursor must include timestamp and ID"});
 }
});
/** Preserve ISO strings across HTTP boundary; the service performs typed parsing. */
export function parseTrackerActivityCursorParams(raw:Record<string,string|string[]|undefined>){
 if(Object.values(raw).some(Array.isArray))return null;
 const single=(key:string)=>{const v=raw[key];return typeof v==="string"?v:undefined;};
 const normalized={activityBeforeCreatedAt:single("activityBeforeCreatedAt"),activityBeforeId:single("activityBeforeId"),
  attachmentBeforeCreatedAt:single("attachmentBeforeCreatedAt"),attachmentBeforeId:single("attachmentBeforeId")};
 if(Object.keys(raw).some(key=>!Object.hasOwn(normalized,key)))return null;
 return trackerActivityCursorSchema.safeParse(normalized).success?normalized:null;
}
