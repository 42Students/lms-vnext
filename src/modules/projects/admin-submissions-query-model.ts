import { z } from "zod";

// Guard URL numbers before they reach paging SQL; Zod coercion admits
// hex, exponent notation, whitespace and the empty string as integers.
const decimalPage = (min: number, max: number, fallback: number) => z.union([
  z.number().int().min(min).max(max),
  z.string().regex(/^[0-9]+$/).transform(Number).pipe(z.number().int().min(min).max(max)),
]).default(fallback);

const schema = z.strictObject({
  view: z.enum(["ALL", "NOT_SUBMITTED"]).default("ALL"),
  q: z.string().trim().max(120).optional(),
  status: z.enum(["PLANNED", "ACTIVE", "COMPLETED", "ARCHIVED"]).optional(),
  submissionStatus: z.enum([
    "DRAFT", "SUBMITTED", "CHANGES_REQUESTED", "APPROVED",
    "UNDER_REVIEW", "LOCKED", "DRAFT_REVISING",
  ]).optional(),
  page: decimalPage(1,100000,1),
  pageSize: decimalPage(10,100,25),
});
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export function parseProjectAdminSubmissionsQuery(params: Record<string,string|string[]|undefined>) {
  if (Object.values(params).some(Array.isArray) ||
      Object.keys(params).some(key=>!["view","q","status","submissionStatus","page","pageSize"].includes(key)))
    return schema.safeParse(null);
  const entries = {
    view:first(params.view),q:first(params.q),status:first(params.status),
    submissionStatus:first(params.submissionStatus),
    page:first(params.page),pageSize:first(params.pageSize),
  };
  return schema.safeParse(Object.fromEntries(
    Object.entries(entries).filter(([,value])=>value!==undefined&&value!==""),
  ));
}
