import { z } from "zod";
const querySchema = z.strictObject({
 deleted: z.literal("1").optional(),
 beforeCreatedAt: z.iso.datetime({offset:true}).optional(),
 beforeId: z.uuid().optional(),
}).superRefine((value,ctx)=>{
 if(Boolean(value.beforeCreatedAt)!==Boolean(value.beforeId)){
  ctx.addIssue({code:"custom",path:["beforeId"],message:"Cursor timestamp and ID must be supplied together"});
 }
});
export function parseSuperAdminAnnouncementParams(raw:Record<string,string|string[]|undefined>){
 if(Object.values(raw).some(Array.isArray))return null;
 const parsed=querySchema.safeParse(raw);
 return parsed.success?parsed.data:null;
}
