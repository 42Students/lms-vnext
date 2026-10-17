import {z} from "zod";
/** PR-S2-04 runtime validation for registered migration 0090. */
export const projectTaskExpandedFieldsSchema=z.object({
  taskType:z.enum(["STORY","BUG","CHORE","SPIKE"]).nullable().optional(),
  blockerReason:z.string().trim().min(1).max(4000).nullable().optional(),
  dueDate:z.iso.date().nullable().optional(),
  estimatePoints:z.number().int().min(0).max(1000).nullable().optional(),
}).strict();
export const projectTaskCommentInputSchema=z.object({
  body:z.string().trim().min(1).max(4000),
  commentKind:z.enum(["NOTE","PROGRESS_UPDATE","FLAG_FOR_MENTOR"]).default("NOTE"),
  expectedTaskUpdatedAt:z.iso.datetime({offset:true}),
}).strict();
export function projectTaskBlockerValid(status:string,reason:string|null){
  return status!=="BLOCKED"||Boolean(reason?.trim());
}
