import { z } from "zod";
import { GROUP_STATUSES } from "./admin-read-service";

/** URL-backed College Admin groups are filtered by a validated, unambiguous
 * query. Never use first-value-wins or parseInt on caller-controlled keys;
 * doing so would silently broaden a scoped directory or permit giant offsets. */
const decimalOffset = z.union([
  z.number().int().min(0).max(100000),
  z.string().regex(/^(0|[1-9][0-9]*)$/)
    .transform(Number).pipe(z.number().int().min(0).max(100000)),
]);

export const collegeGroupsDirectoryQuerySchema = z.strictObject({
  kind: z.string().trim().regex(/^[A-Z][A-Z0-9_]{0,39}$/).optional(),
  status: z.enum(GROUP_STATUSES).optional(),
  offset: decimalOffset.default(0),
});
export type CollegeGroupsDirectoryQuery = z.infer<typeof collegeGroupsDirectoryQuerySchema>;

export function parseCollegeGroupsDirectoryParams(
  raw: Record<string,string|string[]|undefined>,
): CollegeGroupsDirectoryQuery | null {
  if (Object.values(raw).some(Array.isArray)) return null;
  const normalized = Object.fromEntries(
    Object.entries(raw)
      .filter(([,value]) => value !== undefined && value !== "")
  );
  const parsed = collegeGroupsDirectoryQuerySchema.safeParse(normalized);
  return parsed.success ? parsed.data : null;
}

export function collegeGroupsDirectoryHref(
  query: CollegeGroupsDirectoryQuery,
): string {
  const parsed = collegeGroupsDirectoryQuerySchema.parse(query);
  const params = new URLSearchParams();
  if (parsed.kind) params.set("kind",parsed.kind);
  if (parsed.status) params.set("status",parsed.status);
  if (parsed.offset>0) params.set("offset",String(parsed.offset));
  return "/college/groups"+(params.size?"?"+params.toString():"");
}
