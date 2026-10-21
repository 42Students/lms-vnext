import {z} from "zod";
export const adminFeatureQuerySchema=z.strictObject({
 q:z.string().trim().max(100).transform(value=>value.normalize("NFKC").toLowerCase()).default(""),
 // URL pagination must be decimal; coercion would interpret 0x10 and 1e2.
 pageSize:z.union([
  z.literal(20),z.literal(50),z.literal(100),
  z.enum(["20","50","100"]).transform(Number),
 ]).default(20),
 page:z.union([
  z.number().int().min(1).max(10000),
  z.string().regex(/^[0-9]+$/).transform(Number)
   .pipe(z.number().int().min(1).max(10000)),
 ]).default(1),
 sort:z.enum(["NAME","CODE","NAME_DESC","CODE_DESC"]).default("NAME"),
 module:z.union([z.enum(["projects","placements","electives"]),z.literal("")]).transform(value=>value===""?undefined:value).optional(),
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

/** Reject repeated and unknown URL parameters before any feature matrix DB read. */
export function parseAdminFeaturePageParams(raw:Record<string,string|string[]|undefined>):AdminFeatureQuery|null {
 if(Object.values(raw).some(value=>Array.isArray(value)))return null;
 const parsed=adminFeatureQuerySchema.safeParse(raw);
 return parsed.success?parsed.data:null;
}

/** Clamp stale browser bookmarks to the last nonempty filtered page. */
export function boundedAdminFeaturePage(requested:number,total:number,pageSize:number):number {
 const last=Math.max(1,Math.ceil(total/pageSize));
 return Math.max(1,Math.min(requested,last));
}
