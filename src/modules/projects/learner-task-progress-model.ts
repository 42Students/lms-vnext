import { z } from "zod";
import {canLearnerMoveOwnTask} from "./learner-task-status-policy";

export const learnerTaskProgressParamsSchema = z.strictObject({
  projectId: z.string().uuid(), taskId: z.string().uuid(),
});
const stamp = z.iso.datetime({ offset: true });
export const learnerTaskProgressInputSchema = z.discriminatedUnion("action", [
  z.strictObject({
    action: z.literal("STATUS"),
    status: z.enum(["IN_PROGRESS", "BLOCKED"]),
    blockerNote: z.string().trim().min(3).max(2000).optional(),
    expectedUpdatedAt: stamp,
  }),
  z.strictObject({ action: z.enum(["MOVE_UP", "MOVE_DOWN"]), expectedUpdatedAt: stamp }),
]).superRefine((input,ctx)=>{
  if(input.action!=="STATUS")return;
  if(input.status==="BLOCKED"&&!input.blockerNote?.trim())
    ctx.addIssue({code:"custom",path:["blockerNote"],message:"Describe what is blocking this task."});
  if(input.status!=="BLOCKED"&&input.blockerNote?.trim())
    ctx.addIssue({code:"custom",path:["blockerNote"],message:"Clear blocker details before continuing."});
});

export function learnerTaskTransitionAllowed(before: string, after: string, blocker?: string | null) {
  return canLearnerMoveOwnTask(before,after) &&
    (after !== "BLOCKED" || Boolean(blocker?.trim() && blocker.trim().length >= 3 && blocker.trim().length <= 2000));
}
export function learnerTaskProgressSuccess(action: "STATUS" | "MOVE_UP" | "MOVE_DOWN", status?: string) {
  return action !== "STATUS" ? "Task update saved." :
    status === "BLOCKED" ? "Blocker reported." :
      status === "IN_PROGRESS" ? "Task moved to In Progress." : "Task update saved.";
}
