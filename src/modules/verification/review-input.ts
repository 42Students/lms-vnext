import {z} from "zod";
export const verificationReviewInput=z.strictObject({
 learnerMembershipId:z.string().uuid(),
 section:z.enum(["EDUCATION","IDENTITY"]),
 expectedVersion:z.number().int().min(1),
 action:z.enum(["VERIFY","SEND_BACK"]),
 reason:z.string().trim().max(500).optional(),
}).superRefine((x,ctx)=>{
 if(x.action==="SEND_BACK"&&(!x.reason||x.reason.length<3))
  ctx.addIssue({code:"custom",path:["reason"],message:"Reason is required"});
});
export type VerificationReviewInput=z.infer<typeof verificationReviewInput>;
