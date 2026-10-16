import { z } from "zod";

export const collegeDriveListQuerySchema = z.object({
  q: z.string().trim().max(100).default(""),
  status: z.enum(["ALL", "DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"]).default("PUBLISHED"),
  deadlineBefore: z.iso.date().optional(),
  minimumApplicants: z.coerce.number().int().min(0).max(100000).optional(),
  seasonId: z.string().uuid().optional(),
  relationshipId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
}).strict();

export const collegeDriveIdSchema = z.string().uuid();
export type CollegeDriveQuery = z.infer<typeof collegeDriveListQuerySchema>;
export const COLLEGE_DRIVE_PAGE_SIZE = 25;

export function driveQueryFromSearch(input: Record<string, string | string[] | undefined>) {
  const raw: Record<string, string> = {};
  for (const key of ["q", "status", "seasonId", "relationshipId", "deadlineBefore", "minimumApplicants", "page"] as const) {
    const value = input[key];
    if (Array.isArray(value)) return null;
    if (typeof value === "string" && value !== "") raw[key] = value;
  }
  const parsed = collegeDriveListQuerySchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function driveListHref(query: CollegeDriveQuery) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.status !== "PUBLISHED") params.set("status", query.status);
  if (query.deadlineBefore) params.set("deadlineBefore",query.deadlineBefore);
  if (query.minimumApplicants !== undefined) params.set("minimumApplicants",String(query.minimumApplicants));
  if (query.seasonId) params.set("seasonId", query.seasonId);
  if (query.relationshipId) params.set("relationshipId", query.relationshipId);
  if (query.page > 1) params.set("page", String(query.page));
  return "/college/placements/drives" + (params.size ? "?" + params.toString() : "");
}
