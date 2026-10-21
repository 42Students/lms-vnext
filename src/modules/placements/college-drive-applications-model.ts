import { z } from "zod";

export const driveApplicationsQuerySchema = z.object({
  q: z.string().trim().max(100).default(""),
  status: z.enum(["ALL","SUBMITTED","WITHDRAWN"]).default("ALL"),
  source: z.enum(["ALL","INTERNAL","EXTERNAL"]).default("ALL"),
  stage: z.enum(["ALL","APPLIED","SHORTLISTED","ASSESSMENT","INTERVIEW","WAITLISTED","OFFERED","HIRED","REJECTED","WITHDRAWN"]).default("ALL"),
  departmentId: z.string().uuid().optional(),
  programId: z.string().uuid().optional(),
  cohortId: z.string().uuid().optional(),
  appliedFrom: z.iso.date().optional(),
  appliedTo: z.iso.date().optional(),
  screening: z.enum(["ALL","PENDING","HOLD","SHORTLISTED","REJECTED","UNRECORDED"]).default("ALL"),
  page: z.coerce.number().int().min(1).max(1000).default(1),
}).strict();
export type DriveApplicationsQuery = z.infer<typeof driveApplicationsQuerySchema>;
export const DRIVE_APPLICATIONS_PAGE_SIZE = 20;
export const DRIVE_APPLICATION_EXPORT_CAP = 1000;
export const DRIVE_APPLICATION_BULK_CAP = 3000;

export function driveApplicationsParams(raw: Record<string,string|string[]|undefined>) {
  const input: Record<string,string> = {};
  for (const key of ["q","status","stage","source","departmentId","programId","cohortId","screening","appliedFrom","appliedTo","page"] as const) {
    const value = raw[key];
    // The legacy page tolerates malformed optional filters, but identifiers
    // must fail closed rather than silently broadening an academic scope.
    if (Array.isArray(value)) {
      if (key === "departmentId" || key === "programId" || key === "cohortId") return null;
      continue;
    }
    if (typeof value === "string" && value !== "") input[key] = value;
  }
  const allowed: Record<string,readonly string[]> = {
    status:["ALL","SUBMITTED","WITHDRAWN"],
    source:["ALL","INTERNAL","EXTERNAL"],
    stage:["ALL","APPLIED","SHORTLISTED","ASSESSMENT","INTERVIEW","WAITLISTED","OFFERED","HIRED","REJECTED","WITHDRAWN"],
    screening:["ALL","PENDING","HOLD","SHORTLISTED","REJECTED","UNRECORDED"],
  };
  for (const key of ["status","stage","source","screening"] as const) {
    if (input[key] && !allowed[key].includes(input[key])) delete input[key];
  }
  if (input.page && !/^[1-9]\\d{0,3}$/.test(input.page)) delete input.page;
  const result = driveApplicationsQuerySchema.safeParse(input);
  if(!result.success || (result.data.appliedFrom && result.data.appliedTo &&
     result.data.appliedFrom>result.data.appliedTo)) return null;
  return result.data;
}
export function driveApplicationsHref(jobId: string, query: DriveApplicationsQuery, exportCsv = false) {
  const params = new URLSearchParams();
  if (query.q) params.set("q",query.q);
  if (query.status !== "ALL") params.set("status",query.status);
  if (query.source !== "ALL") params.set("source",query.source);
  if (query.stage !== "ALL") params.set("stage",query.stage);
  if (query.departmentId) params.set("departmentId",query.departmentId);
  if (query.programId) params.set("programId",query.programId);
  if (query.cohortId) params.set("cohortId",query.cohortId);
  if (query.appliedFrom) params.set("appliedFrom",query.appliedFrom);
  if (query.appliedTo) params.set("appliedTo",query.appliedTo);
  if (query.screening !== "ALL") params.set("screening",query.screening);
  if (!exportCsv && query.page > 1) params.set("page",String(query.page));
  const suffix = exportCsv ? "/export" : "";
  return "/college/placements/jobs/" + encodeURIComponent(jobId) + "/applications" + suffix +
    (params.size ? "?" + params.toString() : "");
}
