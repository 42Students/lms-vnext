import {z} from "zod";
export const adminFeatureQuerySchema=z.strictObject({
 q:z.string().trim().max(100).default(""),
 page:z.coerce.number().int().min(1).max(10000).default(1),
 sort:z.enum(["NAME","CODE"]).default("NAME"),
 module:z.enum(["projects","placements","electives"]).optional(),
 storedState:z.enum(["ALL","ON","OFF"]).default("ALL"),
 locks:z.enum(["ALL","LOCKED"]).default("ALL"),
 presence:z.enum(["ANY","HAS_RULE","NO_RULE"]).default("ANY"),
 recent:z.enum(["ALL","7D","30D","90D"]).default("ALL"),
 searchField:z.enum(["ALL","NAME","CODE"]).default("ALL"),
}).superRefine((value,ctx)=>{
 if(value.presence==="NO_RULE"&&(value.storedState!=="ALL"||value.locks==="LOCKED"||value.recent!=="ALL"))ctx.addIssue({code:"custom",path:["presence"],message:"No-rule cannot combine with stored value or locked-only"});
});
export type AdminFeatureQuery=z.infer<typeof adminFeatureQuerySchema>;

/** Clock injected at request boundary so count and page share one fixed cutoff. */
export function featureRuleCutoff(recent:"ALL"|"7D"|"30D"|"90D",now:Date):Date|null {
 const days=recent==="7D"?7:recent==="30D"?30:recent==="90D"?90:0;
 return days?new Date(now.getTime()-days*86400000):null;
}
