import {z} from "zod";
export const MAX_STAFF_BULK_REVIEWS=20;
const candidate=z.strictObject({
 learnerMembershipId:z.uuid(),section:z.enum(["EDUCATION","IDENTITY"]),
 expectedVersion:z.number().int().min(1),
});
export const bulkVerificationInput=z.strictObject({
 action:z.enum(["VERIFY","SEND_BACK"]),
 confirm:z.literal(true),
 reason:z.string().trim().min(3).max(500).optional(),
 items:z.array(candidate).min(1).max(MAX_STAFF_BULK_REVIEWS),
}).superRefine((body,ctx)=>{
 if(body.action==="SEND_BACK"&&!body.reason)
  ctx.addIssue({code:"custom",path:["reason"],message:"Bulk send-back requires a reason"});
 const seen=new Set<string>();
 for(const [index,item] of body.items.entries()){
  const key=item.learnerMembershipId+":"+item.section;
  if(seen.has(key))ctx.addIssue({code:"custom",path:["items",index],message:"Duplicate verification request"});
  seen.add(key);
 }
});
export type BulkVerificationInput=z.infer<typeof bulkVerificationInput>;
