import {z} from "zod";
export const superAdminCollegeBroadcastSchema=z.strictObject({
 audienceMode:z.enum(["ALL_COLLEGES","SELECTED_COLLEGES"]),
 collegeIds:z.array(z.uuid()).max(500),
 reviewedCollegeIds:z.array(z.uuid()).max(500).optional(),
 title:z.string().trim().min(1).max(200),
 message:z.string().trim().min(1).max(8000),
 scheduledAt:z.iso.datetime({offset:true}).nullable(),
 expiresAt:z.iso.datetime({offset:true}).nullable(),
 isPinned:z.boolean(),
 publishConsent:z.literal(true),
}).superRefine((v,ctx)=>{
 if(v.audienceMode==="ALL_COLLEGES"&&v.collegeIds.length!==0)ctx.addIssue({code:"custom",path:["collegeIds"],message:"All-colleges must not include an explicit target list"});
 if(v.reviewedCollegeIds && new Set(v.reviewedCollegeIds).size!==v.reviewedCollegeIds.length)ctx.addIssue({code:"custom",path:["reviewedCollegeIds"],message:"Reviewed audience may not contain duplicate colleges"});
 if(new Set(v.collegeIds).size!==v.collegeIds.length)ctx.addIssue({code:"custom",path:["collegeIds"],message:"A college must not appear more than once"});
 if(v.audienceMode==="SELECTED_COLLEGES"&&v.collegeIds.length===0)ctx.addIssue({code:"custom",path:["collegeIds"],message:"Select at least one college"});
 if(v.expiresAt&&v.scheduledAt&&new Date(v.expiresAt)<=new Date(v.scheduledAt))ctx.addIssue({code:"custom",path:["expiresAt"],message:"Expiry must be later than schedule"});
});
export function requestedBroadcastCollegeIds(ids:readonly string[]):string[]{
 return [...new Set(ids)];
}
export function broadcastConsentSummary(mode:"ALL_COLLEGES"|"SELECTED_COLLEGES",count:number,scheduled:boolean){
 return (mode==="ALL_COLLEGES"?"All currently active authorized colleges":"Selected authorized colleges")+
  " · "+count+" college"+(count===1?"":"s")+" · "+(scheduled?"scheduled":"immediate")+" in-app notices";
}

/** The reviewed audience is an exact set, never just a count. */
export function sameReviewedBroadcastAudience(reviewed:readonly string[],actual:readonly string[]) {
 return reviewed.length===actual.length &&
  [...reviewed].sort().every((id,index)=>id===[...actual].sort()[index]);
}
