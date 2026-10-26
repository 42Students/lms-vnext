import { z } from "zod";

/** Explicit vNext owner decision: ALL means all visible, recruiter-owned
 * published and closed drives, not an unrestricted college-wide global list.
 * Pending approvals live in WAITING; drafts remain in the authoring workspace.
 * The 100-character title search is an intentional validated limit. */
export const RECRUITER_DRIVE_ALL_VIEW_POLICY={
 scope:"AUTHORIZED_OWN_PUBLISHED_AND_CLOSED",queryMaxChars:100,
 includesPendingApprovals:false,includesDrafts:false,
} as const;
export const recruiterDriveListQuerySchema = z.object({
  view: z.preprocess(value=>typeof value==="string"?value.toUpperCase():value,z.enum(["ALL","LIVE","CLOSED","WAITING"]).default("ALL")),
  collegeId: z.string().uuid().optional(),
  q: z.string().trim().max(100).default(""),
  employment: z.enum(["ALL","FULL_TIME","INTERNSHIP","CONTRACT"]).default("ALL"),
  mode: z.enum(["ALL","ONSITE","HYBRID","REMOTE"]).default("ALL"),
  deadline: z.enum(["ALL","SOON","TODAY","PAST","UNKNOWN"]).default("ALL"),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  sort:z.enum(["RECENT","DEADLINE","TITLE"]).default("RECENT"),
}).strict();
export type RecruiterDriveListQuery = z.infer<typeof recruiterDriveListQuerySchema>;

/** Legacy initial tab depends on verified per-college counts, not a blind ALL.
 * The route must call this after retrieving requests and live-drive totals,
 * then write the chosen view to the URL only when no explicit view was given.
 */
export function recruiterDefaultDriveView(counts:{waiting:number;live:number}):
  RecruiterDriveListQuery["view"] {
 // The prototype exposes both waiting and live drives on the default list.
 // Mixed work must not disappear behind the waiting-only filter.
 if(counts.waiting>0&&counts.live>0)return "ALL";
 if(counts.waiting>0)return "WAITING";
 if(counts.live>0)return "LIVE";
 return "ALL";
}

export type RecruiterDriveListItem = {
  collegeId: string;
  job: { id: string; title: string; status: string; archivedAt: Date | null;
    employmentType?: string; workMode?: string; applicationDeadline?: Date | null;
    createdAt?:Date;publishedAt?:Date|null };
};

export function summarizeRecruiterDrives<T extends RecruiterDriveListItem>(rows: readonly T[]) {
  const visible = rows.filter(row => row.job.archivedAt === null &&
    (row.job.status === "PUBLISHED" || row.job.status === "CLOSED"));
  return {
    all: visible.length,
    live: visible.filter(row => row.job.status === "PUBLISHED").length,
    closed: visible.filter(row => row.job.status === "CLOSED").length,
    // Request / approval-state tables are not represented by published jobs.
    waiting: 0,
  };
}

export function isHrDriveDeadlineToday(date:Date,now:Date):boolean{
 if(!Number.isFinite(date.getTime())||!Number.isFinite(now.getTime()))return false;
 const format=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",
  year:"numeric",month:"2-digit",day:"2-digit"});
 return format.format(date)===format.format(now);
}

export function filterRecruiterDrives<T extends RecruiterDriveListItem>(
  rows: readonly T[], query: RecruiterDriveListQuery, now: Date = new Date(),
): T[] {
  const validDeadline=(value:Date|null|undefined):value is Date=>
    value instanceof Date&&Number.isFinite(value.getTime());
  return rows.filter(row =>
    row.job.archivedAt === null &&
    (row.job.status === "PUBLISHED" || row.job.status === "CLOSED") &&
    (!query.collegeId || row.collegeId === query.collegeId) &&
    (query.view === "ALL" || (query.view === "LIVE" && row.job.status === "PUBLISHED") ||
      (query.view === "CLOSED" && row.job.status === "CLOSED")) &&
    row.job.title.toLocaleLowerCase("en").includes(query.q.trim().toLocaleLowerCase("en")) &&
    (query.employment === "ALL" || row.job.employmentType === query.employment) &&
    (query.mode === "ALL" || row.job.workMode === query.mode) &&
    (query.deadline === "ALL" || (query.deadline === "UNKNOWN" && !validDeadline(row.job.applicationDeadline)) ||
      (query.deadline === "TODAY" && row.job.status === "PUBLISHED" &&
        validDeadline(row.job.applicationDeadline) && isHrDriveDeadlineToday(row.job.applicationDeadline,now)) ||
      (query.deadline === "PAST" && validDeadline(row.job.applicationDeadline) &&
        row.job.applicationDeadline.getTime() < now.getTime()) ||
      (query.deadline === "SOON" && row.job.status === "PUBLISHED" && validDeadline(row.job.applicationDeadline) &&
        row.job.applicationDeadline.getTime() >= now.getTime() &&
        row.job.applicationDeadline.getTime() <= now.getTime() + 7*86400000)) &&
    (query.view as string) !== "WAITING"
  );
}

export function recruiterDrivesHref(query: RecruiterDriveListQuery) {
  const p = new URLSearchParams();
  if (query.collegeId) p.set("collegeId", query.collegeId);
  if (query.view !== "ALL") p.set("view", query.view);
  if (query.q) p.set("q", query.q);
  if (query.employment !== "ALL") p.set("employment", query.employment);
  if (query.mode !== "ALL") p.set("mode", query.mode);
  if (query.deadline !== "ALL") p.set("deadline", query.deadline);
  if (query.page > 1) p.set("page", String(query.page));
  if (query.sort !== "RECENT") p.set("sort", query.sort);
  const s = p.toString();
  return "/recruiter/drives" + (s ? "?" + s : "");
}

export const HR_DRIVE_PAGE_SIZE=20;
export function paginateRecruiterDrives<T>(rows:readonly T[],page:number) {
  const pages=Math.ceil(rows.length/HR_DRIVE_PAGE_SIZE);
  const safePage=Math.min(Math.max(1,Math.trunc(page)||1),Math.max(1,pages));
  const first=(safePage-1)*HR_DRIVE_PAGE_SIZE;
  return {total:rows.length,page:safePage,pageSize:HR_DRIVE_PAGE_SIZE,
    pages,rows:rows.slice(first,first+HR_DRIVE_PAGE_SIZE)};
}

export function sortRecruiterDrives<T extends RecruiterDriveListItem>(rows:readonly T[],sort:RecruiterDriveListQuery["sort"]):T[]{
 const value=(date:Date|null|undefined)=>date&&Number.isFinite(date.getTime())?date.getTime():0;
 const deadline=(date:Date|null|undefined)=>date&&Number.isFinite(date.getTime())
  ?date.getTime():Number.MAX_SAFE_INTEGER;
 return [...rows].sort((a,b)=>{
  if(sort==="TITLE")return a.job.title.localeCompare(b.job.title)||a.job.id.localeCompare(b.job.id);
  if(sort==="DEADLINE"){
   const aDeadline=deadline(a.job.applicationDeadline);
   const bDeadline=deadline(b.job.applicationDeadline);
   return aDeadline-bDeadline||a.job.id.localeCompare(b.job.id);
  }
  return value(b.job.createdAt??b.job.publishedAt)-value(a.job.createdAt??a.job.publishedAt)||a.job.id.localeCompare(b.job.id);
 });
}
