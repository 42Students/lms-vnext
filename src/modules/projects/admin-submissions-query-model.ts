import { z } from "zod";

const schema = z.strictObject({
  view: z.enum(["ALL", "NOT_SUBMITTED"]).default("ALL"),
  q: z.string().trim().max(120).optional(),
  status: z.enum(["PLANNED", "ACTIVE", "COMPLETED", "ARCHIVED"]).optional(),
  submissionStatus: z.enum([
    "DRAFT", "SUBMITTED", "CHANGES_REQUESTED", "APPROVED",
    "UNDER_REVIEW", "LOCKED", "DRAFT_REVISING",
  ]).optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(10).max(100).default(25),
});
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export function parseProjectAdminSubmissionsQuery(params: Record<string,string|string[]|undefined>) {
  if (Object.values(params).some(Array.isArray)) return schema.safeParse(null);
  const entries = {
    view:first(params.view),q:first(params.q),status:first(params.status),
    submissionStatus:first(params.submissionStatus),
    page:first(params.page),pageSize:first(params.pageSize),
  };
  return schema.safeParse(Object.fromEntries(
    Object.entries(entries).filter(([,value])=>value!==undefined&&value!==""),
  ));
}
