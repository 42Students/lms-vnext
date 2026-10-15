import { z } from "zod";
const Query = z.strictObject({
  seasonId: z.uuid().optional(),
  jobId: z.uuid().optional(),
});
export function collegeHiringAnalyticsQuery(raw: Record<string,string|string[]|undefined>) {
  // All other query parameters are refused to avoid ambiguous filters.
  return Query.safeParse(raw);
}
