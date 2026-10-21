import { z } from "zod";

// Filter URLs are user-controlled: decimal strings only, not hex/exponent/blank coercions.
const decimalPage = (min: number, max: number, fallback: number) => z.union([
  z.number().int().min(min).max(max),
  z.string().regex(/^[0-9]+$/).transform(Number).pipe(z.number().int().min(min).max(max)),
]).default(fallback);

const schema = z.strictObject({
  riskBucket: z.enum(["STALLED","BLOCKER","REVIEW"]).optional(),
  riskSort: z.enum(["INACTIVE","INACTIVE_DESC","WORKSPACE","SEVERITY"]).optional(),
  q: z.string().trim().max(120).optional(),
  status: z.enum(["PLANNED","ACTIVE","COMPLETED","ARCHIVED"]).optional(),
  page: decimalPage(1,100000,1),
  pageSize: z.literal(25).default(25),
});
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

/** Fail safely on forged or out-of-range risk URLs, without hiding their filters. */
export function parseProjectAdminRiskQuery(params: Record<string,string|string[]|undefined>) {
  if (Object.values(params).some(Array.isArray) ||
      Object.keys(params).some(key=>!["riskBucket","riskSort","q","status","page","pageSize","filter","search"].includes(key)) ||
      (params.filter!==undefined && params.riskBucket!==undefined) ||
      (params.search!==undefined && params.q!==undefined))
    return schema.safeParse(null);
  const legacyFilter=first(params.filter)?.trim().toLowerCase();
  // Old bookmarks could contain a retired display-only quick filter;
  // ignore unknown *values* without relaxing the strict allowlist of keys.
  const migratedBucket=legacyFilter&&["stalled","blocker","review"].includes(legacyFilter)
    ?legacyFilter.toUpperCase():undefined;
  const entries = {
    riskBucket: migratedBucket ?? first(params.riskBucket),
    riskSort: first(params.riskSort),
    q: first(params.search) ?? first(params.q), status: first(params.status),
    page: first(params.page), pageSize: first(params.pageSize)===undefined?25:first(params.pageSize)==="25"?25:NaN,
  };
  return schema.safeParse(Object.fromEntries(
    Object.entries(entries).filter(([key,value])=>value!==undefined&&(value!=="" || key==="page" || key==="pageSize")),
  ));
}
