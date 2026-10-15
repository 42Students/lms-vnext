import { z } from "zod";
const querySchema = z.strictObject({
 deleted: z.literal("1").optional(),
 q: z.string().trim().min(1).max(120).optional(),
 receiverType: z.enum(["COLLEGE","PROGRAM","DEPARTMENT","CLASS","LEARNER","FACULTY"]).optional(),
 beforeCreatedAt: z.iso.datetime({offset:true}).optional(),
 beforeId: z.uuid().optional(),
}).superRefine((value,ctx)=>{
 if(Boolean(value.beforeCreatedAt)!==Boolean(value.beforeId)){
  ctx.addIssue({code:"custom",path:["beforeId"],message:"Cursor timestamp and ID must be supplied together"});
 }
});
export function parseSuperAdminAnnouncementParams(raw:Record<string,string|string[]|undefined>){
 if(Object.values(raw).some(Array.isArray))return null;
 const parsed=querySchema.safeParse({...raw,q:raw.q === "" ? undefined : raw.q,receiverType:raw.receiverType === "" ? undefined : raw.receiverType});
 return parsed.success?parsed.data:null;
}
