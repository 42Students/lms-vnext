import { z } from "zod";

export const mentorTaskDetailsParamsSchema=z.object({
  projectId:z.string().uuid(),taskId:z.string().uuid(),
}).strict();
export const mentorTaskDetailsInputSchema=z.object({
  title:z.string().trim().min(1).max(200),
  description:z.string().trim().max(4000).nullable(),
  acceptanceCriteria:z.string().trim().max(4000).nullable(),
  priority:z.enum(["LOW","MEDIUM","HIGH","CRITICAL"]),
  expectedUpdatedAt:z.iso.datetime({offset:true}),
}).strict();
export type MentorTaskDetailsInput=z.infer<typeof mentorTaskDetailsInputSchema>;
export type MentorTaskDetailsFields=Pick<MentorTaskDetailsInput,
  "title"|"description"|"acceptanceCriteria"|"priority">;

export function taskDetailsChangedFields(
  old:{title:string;description:string|null;acceptanceCriteria:string|null;priority:string},
  next:MentorTaskDetailsFields,
) {
  return (["title","description","acceptanceCriteria","priority"] as const)
    .filter(key=>(old[key]??null)!==(next[key]??null));
}
