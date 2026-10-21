import { z } from "zod";

// Backend entry points must reject forged numeric encodings even when an
// internal caller bypasses the page-level URL parser. Do not coerce hex,
// exponent, empty strings, NaN or repeated-array query values into offsets.
const decimalPage = (min: number, max: number, fallback: number) => z.union([
  z.number().int().min(min).max(max),
  z.string().regex(/^[0-9]+$/).transform(Number).pipe(z.number().int().min(min).max(max)),
]).default(fallback);

// Internal callers must project away presentational view toggles before
// entering tenant-scoped services. Unknown fields and injected tenant IDs
// fail closed rather than silently being accepted as query selectors.
export const projectAdminServiceQuerySchema = z.strictObject({
  riskBucket: z.enum(["STALLED", "BLOCKER", "REVIEW"]).optional(),
  riskSort: z.enum(["INACTIVE", "INACTIVE_DESC", "WORKSPACE", "SEVERITY"]).optional(),
  q: z.string().trim().max(120).optional(),
  status: z.enum(["PLANNED", "ACTIVE", "COMPLETED", "ARCHIVED"]).optional(),
  page: decimalPage(1, 100000, 1),
  pageSize: decimalPage(10, 100, 25),
});
