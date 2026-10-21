import { z } from "zod";

export const driveInterviewsQuerySchema = z.object({
  kind: z.enum(["ALL","INTERVIEW","GD"]).default("ALL"),
  status: z.enum(["ALL","PENDING","SCHEDULED","COMPLETED","CANCELLED"]).default("ALL"),
  applicationId: z.string().uuid().optional(),
  appointmentStatus: z.enum(["ALL","UPCOMING","COMPLETED","CANCELLED"]).optional(),
  appointmentMode: z.enum(["ALL","ON_CAMPUS","VIRTUAL"]).optional(),
  appointmentSearch: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  appointmentPage: z.coerce.number().int().min(1).max(1000).default(1),
  appointmentPageSize:z.coerce.number().int().refine(n=>[10,20,50,100].includes(n)).default(20),
  appointmentSort:z.enum(["DATE_ASC","DATE_DESC"]).default("DATE_ASC"),
}).strict();
export type DriveInterviewsQuery = z.infer<typeof driveInterviewsQuerySchema>;
export const DRIVE_INTERVIEW_PAGE_SIZE = 20;
export const DRIVE_INTERVIEW_PAGE_SIZES=[10,20,50,100] as const;

export function driveInterviewsParams(raw: Record<string,string|string[]|undefined>) {
  const filtered: Record<string,string> = {};
  for (const key of ["kind","status","applicationId","page","appointmentStatus","appointmentMode","appointmentSearch","appointmentPage","appointmentPageSize","appointmentSort"] as const) {
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
  if (query.appointmentStatus && query.appointmentStatus !== "ALL") params.set("appointmentStatus",query.appointmentStatus);
  if (query.appointmentMode && query.appointmentMode !== "ALL") params.set("appointmentMode",query.appointmentMode);
  if (query.appointmentSearch) params.set("appointmentSearch",query.appointmentSearch);
  if (query.page>1) params.set("page",String(query.page));
  if(query.appointmentPageSize!==20)params.set("appointmentPageSize",String(query.appointmentPageSize));
  if(query.appointmentSort!=="DATE_ASC")params.set("appointmentSort",query.appointmentSort);
  if (query.appointmentPage>1) params.set("appointmentPage",String(query.appointmentPage));
  return "/college/placements/jobs/" + encodeURIComponent(jobId) + "/interviews" +
    (params.size ? "?" + params.toString() : "");
}
export function driveRoundTime(value: Date | null, timezone: string | null) {
  if (!value) return "Not scheduled";
  return value.toISOString() + (timezone ? " · " + timezone : " · Timezone not recorded");
}

export type CandidateInterviewFilter = {
  appointmentStatus?: "ALL" | "UPCOMING" | "COMPLETED" | "CANCELLED";
  mode?: "ALL" | "ON_CAMPUS" | "VIRTUAL";
  search?: string;
};
export function filterDriveCandidateAppointments<T extends {
  status: string; scheduledAt: string; mode: string; applicationId: string;
}>(rows: readonly T[], filter: CandidateInterviewFilter, now: Date = new Date()): T[] {
  const search = filter.search?.trim().toLowerCase() ?? "";
  return rows.filter(row => {
    const state = row.status.toUpperCase();
    const when = Date.parse(row.scheduledAt);
    const bucket = state === "CANCELLED" || state === "NO_SHOW" ? "CANCELLED"
      : state === "COMPLETED" || (Number.isFinite(when) && when < now.getTime())
        ? "COMPLETED" : "UPCOMING";
    return (!filter.appointmentStatus || filter.appointmentStatus === "ALL" ||
      bucket === filter.appointmentStatus) &&
      (!filter.mode || filter.mode === "ALL" || row.mode === filter.mode) &&
      (!search || row.applicationId.toLowerCase().includes(search));
  });
}
export function driveInterviewFilterError(raw: Record<string, string | string[] | undefined>) {
  if (raw.applicationId && typeof raw.applicationId === "string" &&
      !z.string().uuid().safeParse(raw.applicationId).success)
    return "name is required and must be a valid value";
  if (raw.page !== undefined && !z.coerce.number().int().min(1).max(1000).safeParse(raw.page).success)
    return "Page must be a valid number";
  if (raw.appointmentPage !== undefined &&
      !z.coerce.number().int().min(1).max(1000).safeParse(raw.appointmentPage).success)
    return "Appointment page must be a valid number";
  return "Invalid interview filters";
}

export function appointmentFilterChange(query:DriveInterviewsQuery,patch:Partial<DriveInterviewsQuery>){
 const changed=Object.keys(patch).some(key=>key!=="appointmentPage"&&
  query[key as keyof DriveInterviewsQuery]!==patch[key as keyof DriveInterviewsQuery]);
 return {...query,...patch,appointmentPage:changed?1:(patch.appointmentPage??query.appointmentPage)};
}
export function sortDriveAppointments<T extends {scheduledAt:string;id:string}>(rows:readonly T[],sort:"DATE_ASC"|"DATE_DESC"){
 const direction=sort==="DATE_DESC"?-1:1;
 return [...rows].sort((a,b)=>direction*(Date.parse(a.scheduledAt)-Date.parse(b.scheduledAt))||
  a.id.localeCompare(b.id));
}
export function appointmentConflictLabel(changed:boolean,conflict:boolean){
 return conflict?"Schedule conflict":changed?"Time changed":"On schedule";
}
export function driveInterviewDateIst(date:Date){
 return new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(date)+" IST";
}
