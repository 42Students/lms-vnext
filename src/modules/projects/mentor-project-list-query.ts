import { z } from "zod";

const optionalSelect = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(value => value === "" ? undefined : value, schema.optional());

export const mentorProjectListQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: optionalSelect(z.enum(["CURRENT","PLANNED","ACTIVE","COMPLETED","ARCHIVED"])),
  attention: optionalSelect(z.enum(["MENTOR_REVIEW","MENTOR_REQUESTED","MENTOR_STALLED",
    "MENTOR_MEETING_SOON","MENTOR_ANY_ATTENTION","MENTOR_NO_ATTENTION"])),
  assignment: optionalSelect(z.enum(["PRIMARY","SUPPORTING"])),
  work: optionalSelect(z.enum(["NO_TASKS","HAS_OPEN_TASKS","ALL_DONE","HAS_DONE_TASKS"])),
  sort: z.enum(["RECENT","TITLE","PROGRESS","PROGRESS_DESC"]).default("RECENT"),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().refine(n => [25,50,100].includes(n)).default(25),
}).strict();
export type MentorProjectListQuery = z.infer<typeof mentorProjectListQuerySchema>;
