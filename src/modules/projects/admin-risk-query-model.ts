import { z } from "zod";

const schema = z.strictObject({
  riskBucket: z.enum(["STALLED","BLOCKER","REVIEW"]).optional(),
  riskSort: z.enum(["INACTIVE","WORKSPACE","SEVERITY"]).optional(),
  q: z.string().trim().max(120).optional(),
  status: z.enum(["PLANNED","ACTIVE","COMPLETED","ARCHIVED"]).optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(10).max(100).default(25),
});
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

/** Fail safely on forged or out-of-range risk URLs, without hiding their filters. */
export function parseProjectAdminRiskQuery(params: Record<string,string|string[]|undefined>) {
  if (Object.values(params).some(Array.isArray)) return schema.safeParse(null);
  const entries = {
    riskBucket: first(params.riskBucket), riskSort: first(params.riskSort),
    q: first(params.q), status: first(params.status),
    page: first(params.page), pageSize: first(params.pageSize),
  };
  return schema.safeParse(Object.fromEntries(
    Object.entries(entries).filter(([,value])=>value!==undefined&&value!==""),
  ));
}
