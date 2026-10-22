import { z } from "zod";
import { ANNOUNCEMENT_SENDER_TYPES } from "./validation";
const querySchema = z.strictObject({
 deleted: z.literal("1").optional(),
 q: z.string().trim().min(1).max(120).optional(),
 receiverType: z.enum(["COLLEGE","PROGRAM","DEPARTMENT","CLASS","LEARNER","FACULTY"]).optional(),
 visibility: z.enum(["LIVE","SCHEDULED","EXPIRED","DELETED"]).optional(),
 pinned: z.enum(["PINNED","UNPINNED"]).optional(),
 senderType: z.enum(ANNOUNCEMENT_SENDER_TYPES).optional(),
 beforeCreatedAt: z.iso.datetime({offset:true}).optional(),
 beforeId: z.uuid().optional(),
}).superRefine((value,ctx)=>{
 if(Boolean(value.beforeCreatedAt)!==Boolean(value.beforeId)){
  ctx.addIssue({code:"custom",path:["beforeId"],message:"Cursor timestamp and ID must be supplied together"});
 }
});
export function parseSuperAdminAnnouncementParams(raw:Record<string,string|string[]|undefined>){
 if(Object.values(raw).some(Array.isArray))return null;
 const parsed=querySchema.safeParse({...raw,q:typeof raw["q"] === "string" && raw["q"].trim() === "" ? undefined : raw["q"],receiverType:raw["receiverType"] === "" ? undefined : raw["receiverType"],visibility:raw["visibility"] === "" ? undefined : raw["visibility"],pinned:raw["pinned"] === "" ? undefined : raw["pinned"],senderType:raw["senderType"] === "" ? undefined : raw["senderType"]});
 return parsed.success?parsed.data:null;
}
