import { z } from "zod";

export const driveInterviewsQuerySchema = z.object({
  kind: z.enum(["ALL","INTERVIEW","GD"]).default("ALL"),
  status: z.enum(["ALL","PENDING","SCHEDULED","COMPLETED","CANCELLED"]).default("ALL"),
  applicationId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
}).strict();
export type DriveInterviewsQuery = z.infer<typeof driveInterviewsQuerySchema>;
export const DRIVE_INTERVIEW_PAGE_SIZE = 25;

export function driveInterviewsParams(raw: Record<string,string|string[]|undefined>) {
  const filtered: Record<string,string> = {};
  for (const key of ["kind","status","applicationId","page"] as const) {
    const value = raw[key];
    if (Array.isArray(value)) return null;
    if (typeof value === "string" && value !== "") filtered[key] = value;
  }
  const result = driveInterviewsQuerySchema.safeParse(filtered);
  return result.success ? result.data : null;
}

export function driveInterviewsHref(jobId: string, query: DriveInterviewsQuery) {
  const params = new URLSearchParams();
  if (query.kind !== "ALL") params.set("kind",query.kind);
  if (query.status !== "ALL") params.set("status",query.status);
  if (query.applicationId) params.set("applicationId",query.applicationId);
  if (query.page>1) params.set("page",String(query.page));
  return "/college/placements/jobs/" + encodeURIComponent(jobId) + "/interviews" +
    (params.size ? "?" + params.toString() : "");
}
export function driveRoundTime(value: Date | null, timezone: string | null) {
  if (!value) return "Not scheduled";
  return value.toISOString() + (timezone ? " · " + timezone : " · Timezone not recorded");
}
