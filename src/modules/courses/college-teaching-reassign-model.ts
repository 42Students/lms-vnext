import {z} from "zod";
const uuid=z.string().uuid();
export const collegeTeachingReassignSchema=z.strictObject({
  expectedMembershipId:uuid,
  replacementMembershipId:uuid,
  expectedUpdatedAt:z.iso.datetime({offset:true}),
  confirm:z.literal(true),
}).refine(x=>x.expectedMembershipId!==x.replacementMembershipId,{
  path:["replacementMembershipId"],message:"Choose a different Faculty membership",
});
export const collegeTeachingReassignIdSchema=uuid;
export function teachingReassignPrompt(from:string,to:string,role:string){
  return `Replace ${from} with ${to} as ${role}? Teaching history is retained and this change is audited.`;
}
