import { z } from "zod";
export const mentorTaskTransitionParamsSchema = z.object({
  projectId: z.string().uuid(), taskId: z.string().uuid(),
}).strict();
export const mentorTaskTransitionSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED"]),
  expectedUpdatedAt: z.iso.datetime({offset:true}),
  confirmed: z.literal(true),
}).strict();
/** DONE and IN_REVIEW require a recorded learner submission and Mentor review. */
export function allowedMentorTaskTransition(before:string,after:string){
  return ["TODO","IN_PROGRESS","BLOCKED"].includes(before) &&
    ["TODO","IN_PROGRESS","BLOCKED"].includes(after) && before !== after;
}
