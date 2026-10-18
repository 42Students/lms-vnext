import {z} from "zod";
export const mentorFinalDeliveryDecisionSchema=z.object({
 decision:z.enum(["APPROVED","CHANGES_REQUESTED"]),
 feedback:z.string().trim().min(1).max(6000).optional(),
 expectedUpdatedAt:z.iso.datetime({offset:true}),
 confirmed:z.literal(true),
}).strict().refine(v=>v.decision!=="CHANGES_REQUESTED"||Boolean(v.feedback),{
 message:"Explain the required changes",path:["feedback"],
});
export function mentorFinalDeliveryCanReview(status:string,projectStatus:string,locked=false){
 return status==="SUBMITTED"&&projectStatus==="ACTIVE"&&!locked;
}
