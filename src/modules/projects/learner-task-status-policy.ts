import {z} from "zod";
export const learnerTaskStatusInputSchema=z.strictObject({
 status:z.enum(["IN_PROGRESS","BLOCKED"]),
 expectedUpdatedAt:z.iso.datetime({offset:true}),
 blockerReason:z.string().trim().min(3).max(2000).optional(),
}).superRefine((input,ctx)=>{
 if(input.status==="BLOCKED" && !input.blockerReason)
  ctx.addIssue({code:"custom",path:["blockerReason"],message:"Describe what is blocking this task"});
 if(input.status!=="BLOCKED" && input.blockerReason)
  ctx.addIssue({code:"custom",path:["blockerReason"],message:"Clear blocker details before resuming work"});
});
/** Never allow learner DONE or bypass review; only own TODO/active/blocked. */
export function canLearnerMoveOwnTask(before:string,after:string){
 return (before==="TODO"&&(after==="IN_PROGRESS"||after==="BLOCKED")) ||
   (before==="IN_PROGRESS"&&after==="BLOCKED") ||
   (before==="BLOCKED"&&after==="IN_PROGRESS");
}
