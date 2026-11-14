import { z } from "zod";
import { zUuid } from "@/lib/schema-primitives";
export const mentorTaskTransitionParamsSchema = z.object({
  projectId: zUuid, taskId: zUuid,
}).strict();
export const mentorTaskTransitionSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED"]),
  expectedUpdatedAt: z.iso.datetime({offset:true}),
  confirmed: z.literal(true),
  blockerReason: z.string().trim().min(1).max(4000).optional(),
}).strict().superRefine((value,ctx)=>{
  if(value.status==="BLOCKED"&&!value.blockerReason)
    ctx.addIssue({code:"custom",path:["blockerReason"],message:"Describe what is blocking this task."});
  if(value.status!=="BLOCKED"&&value.blockerReason)
    ctx.addIssue({code:"custom",path:["blockerReason"],message:"Clear blocker details before continuing."});
});
/** DONE and IN_REVIEW require a recorded learner submission and Mentor review. */
export function allowedMentorTaskTransition(before:string,after:string){
  return ["TODO","IN_PROGRESS","BLOCKED"].includes(before) &&
    ["TODO","IN_PROGRESS","BLOCKED"].includes(after) && before !== after;
}
