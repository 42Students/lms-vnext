import { z } from "zod";

export const mentorProjectListQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.enum(["CURRENT","PLANNED","ACTIVE","COMPLETED","ARCHIVED"]).optional(),
  attention: z.enum(["MENTOR_REVIEW","MENTOR_REQUESTED","MENTOR_STALLED",
    "MENTOR_MEETING_SOON","MENTOR_ANY_ATTENTION","MENTOR_NO_ATTENTION"]).optional(),
  assignment: z.enum(["PRIMARY","SUPPORTING"]).optional(),
  work: z.enum(["NO_TASKS"]).optional(),
  sort: z.enum(["RECENT","TITLE"]).default("RECENT"),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().refine(n => [25,50,100].includes(n)).default(25),
}).strict();
export type MentorProjectListQuery = z.infer<typeof mentorProjectListQuerySchema>;
