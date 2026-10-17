import { z } from "zod";
import {projectTaskExpandedFieldsSchema} from "./pr-s2-04-task-fields-model";

export const mentorTaskDetailsParamsSchema=z.object({
  projectId:z.string().uuid(),taskId:z.string().uuid(),
}).strict();
export const mentorTaskDetailsInputSchema=z.object({
  title:z.string().trim().min(1).max(200),
  description:z.string().trim().max(4000).nullable(),
  approach:z.string().trim().max(4000).nullable().optional(),
  acceptanceCriteria:z.string().trim().max(4000).nullable(),
  priority:z.enum(["LOW","MEDIUM","HIGH","CRITICAL"]),
  expectedUpdatedAt:z.iso.datetime({offset:true}),
  ...projectTaskExpandedFieldsSchema.shape,
}).strict();
export type MentorTaskDetailsInput=z.infer<typeof mentorTaskDetailsInputSchema>;
export type MentorTaskDetailsFields=Pick<MentorTaskDetailsInput,
  "title"|"description"|"approach"|"acceptanceCriteria"|"priority"|"blockerReason"|"dueDate"|"estimatePoints"|"taskType">;

export function taskDetailsChangedFields(
  old:{title:string;description:string|null;approach?:string|null;acceptanceCriteria:string|null;priority:string;blockerReason?:string|null;dueDate?:string|null;estimatePoints?:number|null;taskType?:string|null},
  next:MentorTaskDetailsFields,
) {
  return (["title","description","approach","acceptanceCriteria","priority","blockerReason","dueDate","estimatePoints","taskType"] as const)
    .filter(key=>(old[key]??null)!==(next[key]??null));
}
