import {z} from "zod";
export const mentorTaskCreateParamsSchema=z.object({
  projectId:z.string().uuid(),
}).strict();
export const mentorTaskCreateSchema=z.object({
  sprintId:z.string().uuid(),
  title:z.string().trim().min(1).max(200),
  description:z.string().trim().max(4000).nullable(),
  acceptanceCriteria:z.string().trim().max(4000).nullable(),
  priority:z.enum(["LOW","MEDIUM","HIGH","CRITICAL"]),
  expectedSprintUpdatedAt:z.iso.datetime({offset:true}),
}).strict();
