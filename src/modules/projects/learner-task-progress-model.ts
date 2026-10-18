import { z } from "zod";

export const learnerTaskProgressParamsSchema = z.strictObject({
  projectId: z.string().uuid(), taskId: z.string().uuid(),
});
const stamp = z.iso.datetime({ offset: true });
export const learnerTaskProgressInputSchema = z.discriminatedUnion("action", [
  z.strictObject({
    action: z.literal("STATUS"),
    status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED"]),
    blockerNote: z.string().trim().min(1).max(4000).optional(),
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
  return ["TODO", "IN_PROGRESS", "BLOCKED"].includes(before) &&
    ["TODO", "IN_PROGRESS", "BLOCKED"].includes(after) &&
    before !== after && (after !== "BLOCKED" || Boolean(blocker?.trim()));
}
export function learnerTaskProgressSuccess(action: "STATUS" | "MOVE_UP" | "MOVE_DOWN", status?: string) {
  return action !== "STATUS" ? "Task update saved." :
    status === "BLOCKED" ? "Blocker reported." :
      status === "IN_PROGRESS" ? "Task moved to In Progress." : "Task update saved.";
}
