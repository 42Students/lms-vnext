import {z} from "zod";
export const mentorTaskReviewTokenSchema=z.object({
 expectedUpdatedAt:z.string().datetime({offset:true}),confirmed:z.literal(true),
}).strict();
export function mentorTaskReviewTokenMatches(current:Date,expected:string){
 const input=new Date(expected);
 return Number.isFinite(input.getTime())&&input.getTime()===current.getTime();
}
