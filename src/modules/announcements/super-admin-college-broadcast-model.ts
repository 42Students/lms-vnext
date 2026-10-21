import {z} from "zod";
export const superAdminCollegeBroadcastSchema=z.strictObject({
 audienceMode:z.enum(["ALL_COLLEGES","SELECTED_COLLEGES"]),
 collegeIds:z.array(z.uuid()).max(500),
 reviewedCollegeIds:z.array(z.uuid()).max(500).optional(),
 title:z.string().trim().min(1,{error:"Give it a title"}).max(200,{error:"Title must be 200 characters or fewer"}),
 message:z.string().trim().min(1,{error:"Write the announcement"}).max(8000,{error:"Announcement must be 8000 characters or fewer"}),
 scheduledAt:z.iso.datetime({offset:true}).nullable(),
 expiresAt:z.iso.datetime({offset:true}).nullable(),
 isPinned:z.boolean(),
 buttonLabel:z.string().trim().max(60,{error:"Keep the button label under 60 characters"}).nullable().optional(),
 buttonUrl:z.string().trim().max(500,{error:"Keep the link under 500 characters"}).nullable().optional(),
 publishConsent:z.literal(true),
}).superRefine((v,ctx)=>{
 if(v.buttonLabel&&!v.buttonUrl)ctx.addIssue({code:"custom",path:["buttonUrl"],message:"The link has to start with https://"});
 if(v.buttonUrl&&!/^https:\/\/[^\s]+$/i.test(v.buttonUrl))ctx.addIssue({code:"custom",path:["buttonUrl"],message:"The link has to start with https://"});
 if(v.audienceMode==="ALL_COLLEGES"&&v.collegeIds.length!==0)ctx.addIssue({code:"custom",path:["collegeIds"],message:"All-colleges must not include an explicit target list"});
 if(v.reviewedCollegeIds && new Set(v.reviewedCollegeIds).size!==v.reviewedCollegeIds.length)ctx.addIssue({code:"custom",path:["reviewedCollegeIds"],message:"Reviewed audience may not contain duplicate colleges"});
 if(new Set(v.collegeIds).size!==v.collegeIds.length)ctx.addIssue({code:"custom",path:["collegeIds"],message:"A college must not appear more than once"});
 if(v.audienceMode==="SELECTED_COLLEGES"&&v.collegeIds.length===0)ctx.addIssue({code:"custom",path:["collegeIds"],message:"Pick at least one placement cell"});
 // No durable due-time worker exists; refuse delayed publication rather than
 // leaving unsent bell notices indefinitely.
 if(v.scheduledAt)ctx.addIssue({code:"custom",path:["scheduledAt"],message:"Scheduled delivery is not available"});
 if(v.expiresAt&&new Date(v.expiresAt).getTime()<Date.now()-60_000)ctx.addIssue({code:"custom",path:["expiresAt"],message:"The end date has passed"});
}).transform(v=>({
 ...v,
 // Legacy permits URL-only calls; the CTA displays "Open" when the caller
 // does not customize the label. A label without URL remains invalid.
 buttonLabel:v.buttonUrl ? v.buttonLabel?.trim()||"Open" : null,
}));
export function requestedBroadcastCollegeIds(ids:readonly string[]):string[]{
 return [...new Set(ids)];
}
export function broadcastConsentSummary(mode:"ALL_COLLEGES"|"SELECTED_COLLEGES",count:number,scheduled:boolean){
 return (mode==="ALL_COLLEGES"?"All currently active authorized colleges":"Selected authorized colleges")+
  " · "+count+" college"+(count===1?"":"s")+" · "+(scheduled?"scheduled":"immediate")+" in-app notices";
}

/** All-college resolution happens exactly at immediate publication, AFTER a
 * fresh reviewed preview. A change of eligible colleges invalidates the
 * reviewed exact set; selected colleges are never silently promoted to ALL.
 */
export function broadcastAudienceResolution(mode:"ALL_COLLEGES"|"SELECTED_COLLEGES",count:number){
 return mode==="ALL_COLLEGES"
  ? `All ${count} currently eligible placement cells (resolved at publication)`
  : `${count} reviewed selected placement cells (resolved at publication)`;
}

/** The reviewed audience is an exact set, never just a count. */
export function sameReviewedBroadcastAudience(reviewed:readonly string[],actual:readonly string[]) {
 return reviewed.length===actual.length &&
  [...reviewed].sort().every((id,index)=>id===[...actual].sort()[index]);
}
