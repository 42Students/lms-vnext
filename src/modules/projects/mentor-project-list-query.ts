import { z } from "zod";

const optionalSelect = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(value => value === "" ? undefined : value, schema.optional());

export const mentorProjectListQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: optionalSelect(z.enum(["CURRENT","PLANNED","ACTIVE","COMPLETED","ARCHIVED","IN_PROGRESS","READY","BLOCKED"])),
  attention: optionalSelect(z.enum(["MENTOR_REVIEW","MENTOR_REQUESTED","MENTOR_STALLED",
    "MENTOR_MEETING_SOON","MENTOR_ANY_ATTENTION","MENTOR_NO_ATTENTION","BLOCKED"])),
  assignment: optionalSelect(z.enum(["PRIMARY","SUPPORTING"])),
  work: optionalSelect(z.enum(["NO_TASKS","HAS_OPEN_TASKS","ALL_DONE","HAS_DONE_TASKS"])),
  sort: z.enum(["RECENT","TITLE","PROGRESS","PROGRESS_DESC","OPEN_TASKS","TEAM_SIZE_DESC","TEAM_SIZE_ASC"]).default("RECENT"),
  // Historic LMS used zero-based ?page=N for every page, not only page=0.
  // New navigation uses explicit page1 to keep internal 1-based numbering.
  page:z.coerce.number().int().min(0).max(9999).optional(),
  page1:z.coerce.number().int().min(1).max(10000).optional(),
  pageSize: z.coerce.number().int().refine(n => [10,25,50].includes(n)).default(25),
  legacyPage:z.coerce.number().int().min(0).max(9999).optional(),
  // Preserve legacy unknown-key tolerance, but explicitly reject supplied
  // tenant selectors rather than silently discarding forged scope fields.
  collegeId: z.never().optional(),
  organizationId: z.never().optional(),
  tenantId: z.never().optional(),
}).strip().transform(({legacyPage,page1,...query})=>({
 ...query,page:page1??((legacyPage??query.page??0)+1),
})); // SQL always gets 1-based pages; historical ?page=N is zero-based.
export type MentorProjectListQuery = z.infer<typeof mentorProjectListQuerySchema>;
