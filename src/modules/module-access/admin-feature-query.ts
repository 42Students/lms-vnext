import {z} from "zod";
export const adminFeatureQuerySchema=z.strictObject({
 q:z.string().trim().max(100).default(""),
 page:z.coerce.number().int().min(1).max(10000).default(1),
 sort:z.enum(["NAME","CODE"]).default("NAME"),
 module:z.enum(["projects","placements","electives"]).optional(),
 storedState:z.enum(["ALL","ON","OFF"]).default("ALL"),
 locks:z.enum(["ALL","LOCKED"]).default("ALL"),
 presence:z.enum(["ANY","HAS_RULE","NO_RULE"]).default("ANY"),
}).superRefine((value,ctx)=>{
 if(value.presence==="NO_RULE"&&(value.storedState!=="ALL"||value.locks==="LOCKED"))ctx.addIssue({code:"custom",path:["presence"],message:"No-rule cannot combine with stored value or locked-only"});
});
export type AdminFeatureQuery=z.infer<typeof adminFeatureQuerySchema>;
