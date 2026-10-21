import { z } from "zod";

export const collegeDriveListQuerySchema = z.object({
  q: z.string().trim().max(100).default(""),
  status: z.enum(["ALL", "DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"]).default("ALL"),
  deadlineBefore: z.iso.date().optional(),
  deadlineAfter: z.iso.date().optional(),
  sort:z.enum(["TITLE","DEADLINE","NEWEST","APPLICANTS"]).default("NEWEST"),
  minimumApplicants: z.coerce.number().int().min(0).max(100000).optional(),
  seasonId: z.string().uuid().optional(),
  relationshipId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  pageSize:z.coerce.number().int().refine(value=>[10,20,50,100].includes(value)).default(20),
}).strict().superRefine((query,ctx)=>{
  if(query.deadlineAfter&&query.deadlineBefore&&query.deadlineAfter>query.deadlineBefore)
   ctx.addIssue({code:"custom",path:["deadlineBefore"],message:"Deadline end must be on or after start."});
});

export const collegeDriveIdSchema = z.string().uuid();
export type CollegeDriveQuery = z.infer<typeof collegeDriveListQuerySchema>;
export const COLLEGE_DRIVE_PAGE_SIZE = 20;

export function driveQueryFromSearch(input: Record<string, string | string[] | undefined>) {
  const raw: Record<string, string> = {};
  for (const key of ["q", "status", "seasonId", "relationshipId", "deadlineBefore", "deadlineAfter","minimumApplicants","sort", "page","pageSize"] as const) {
    const value = input[key];
    if (Array.isArray(value)) return null;
    if (typeof value === "string" && value !== "") raw[key] = value;
  }
  // Legacy unknown status and sort recover to the baseline list rather than
  // failing the entire page; unsafe tenant/resource identifiers still validate.
  if(raw.status && !["ALL","DRAFT","PUBLISHED","CLOSED","ARCHIVED"].includes(raw.status))delete raw.status;
  if(raw.sort && !["TITLE","DEADLINE","NEWEST","APPLICANTS"].includes(raw.sort))delete raw.sort;
  if(raw.q && raw.q.length>100)raw.q=raw.q.slice(0,100);
  if(raw.page && (!/^\d{1,4}$/.test(raw.page)||Number(raw.page)<1||Number(raw.page)>1000))delete raw.page;
  if(raw.pageSize && !["10","20","50","100"].includes(raw.pageSize))delete raw.pageSize;
  const parsed = collegeDriveListQuerySchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function driveListHref(query: CollegeDriveQuery) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.status !== "ALL") params.set("status", query.status);
  if (query.deadlineBefore) params.set("deadlineBefore",query.deadlineBefore);
  if (query.deadlineAfter) params.set("deadlineAfter",query.deadlineAfter);
  if (query.sort!=="NEWEST")params.set("sort",query.sort);
  if (query.minimumApplicants !== undefined) params.set("minimumApplicants",String(query.minimumApplicants));
  if (query.seasonId) params.set("seasonId", query.seasonId);
  if (query.relationshipId) params.set("relationshipId", query.relationshipId);
  if (query.page > 1) params.set("page", String(query.page));
  if (query.pageSize!==20)params.set("pageSize",String(query.pageSize));
  return "/college/placements/drives" + (params.size ? "?" + params.toString() : "");
}
