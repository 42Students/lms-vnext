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
  page: z.preprocess(value => value === "0" || value === 0 ? 1 : value,
    z.coerce.number().int().min(1).max(10000)).default(1),
  pageSize: z.coerce.number().int().refine(n => [10,25,50].includes(n)).default(25),
  // Legacy vNext bookmarks use 1-based page; legacy frontend exports can
  // supply explicit 0-based legacyPage to avoid ambiguous positive page=N.
  legacyPage: z.coerce.number().int().min(0).max(9999).optional(),
  // Preserve legacy unknown-key tolerance, but explicitly reject supplied
  // tenant selectors rather than silently discarding forged scope fields.
  collegeId: z.never().optional(),
  organizationId: z.never().optional(),
  tenantId: z.never().optional(),
}).strip().transform(({legacyPage,...query})=>({
 ...query,page:legacyPage===undefined?query.page:legacyPage+1,
})); // Normalized output is always 1-based; legacyPage is never sent to SQL.
export type MentorProjectListQuery = z.infer<typeof mentorProjectListQuerySchema>;
