import { z } from "zod";

export const driveApplicationsQuerySchema = z.object({
  q: z.string().trim().max(100).default(""),
  status: z.enum(["ALL","SUBMITTED","WITHDRAWN"]).default("ALL"),
  source: z.enum(["ALL","INTERNAL","EXTERNAL"]).default("ALL"),
  departmentId: z.string().uuid().optional(),
  programId: z.string().uuid().optional(),
  cohortId: z.string().uuid().optional(),
  screening: z.enum(["ALL","PENDING","HOLD","SHORTLISTED","REJECTED","UNRECORDED"]).default("ALL"),
  page: z.coerce.number().int().min(1).max(1000).default(1),
}).strict();
export type DriveApplicationsQuery = z.infer<typeof driveApplicationsQuerySchema>;
export const DRIVE_APPLICATIONS_PAGE_SIZE = 25;
export const DRIVE_APPLICATION_EXPORT_CAP = 1000;

export function driveApplicationsParams(raw: Record<string,string|string[]|undefined>) {
  const input: Record<string,string> = {};
  for (const key of ["q","status","source","departmentId","programId","cohortId","screening","page"] as const) {
    const value = raw[key];
    if (Array.isArray(value)) return null;
    if (typeof value === "string" && value !== "") input[key] = value;
  }
  const result = driveApplicationsQuerySchema.safeParse(input);
  return result.success ? result.data : null;
}
export function driveApplicationsHref(jobId: string, query: DriveApplicationsQuery, exportCsv = false) {
  const params = new URLSearchParams();
  if (query.q) params.set("q",query.q);
  if (query.status !== "ALL") params.set("status",query.status);
  if (query.source !== "ALL") params.set("source",query.source);
  if (query.departmentId) params.set("departmentId",query.departmentId);
  if (query.programId) params.set("programId",query.programId);
  if (query.cohortId) params.set("cohortId",query.cohortId);
  if (query.screening !== "ALL") params.set("screening",query.screening);
  if (!exportCsv && query.page > 1) params.set("page",String(query.page));
  const suffix = exportCsv ? "/export" : "";
  return "/college/placements/jobs/" + encodeURIComponent(jobId) + "/applications" + suffix +
    (params.size ? "?" + params.toString() : "");
}
