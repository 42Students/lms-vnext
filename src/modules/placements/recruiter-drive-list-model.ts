import { z } from "zod";

export const recruiterDriveListQuerySchema = z.object({
  view: z.enum(["ALL", "LIVE", "CLOSED", "WAITING"]).default("ALL"),
  collegeId: z.string().uuid().optional(),
  q: z.string().trim().max(100).default(""),
  employment: z.enum(["ALL","FULL_TIME","INTERNSHIP","CONTRACT"]).default("ALL"),
  mode: z.enum(["ALL","ONSITE","HYBRID","REMOTE"]).default("ALL"),
  deadline: z.enum(["ALL","SOON","UNKNOWN"]).default("ALL"),
  page: z.coerce.number().int().min(1).max(1000).default(1),
}).strict();
export type RecruiterDriveListQuery = z.infer<typeof recruiterDriveListQuerySchema>;

export type RecruiterDriveListItem = {
  collegeId: string;
  job: { id: string; title: string; status: string; archivedAt: Date | null;
    employmentType?: string; workMode?: string; applicationDeadline?: Date | null };
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

export function filterRecruiterDrives<T extends RecruiterDriveListItem>(
  rows: readonly T[], query: RecruiterDriveListQuery, now: Date = new Date(),
): T[] {
  return rows.filter(row =>
    row.job.archivedAt === null &&
    (row.job.status === "PUBLISHED" || row.job.status === "CLOSED") &&
    (!query.collegeId || row.collegeId === query.collegeId) &&
    (query.view === "ALL" || (query.view === "LIVE" && row.job.status === "PUBLISHED") ||
      (query.view === "CLOSED" && row.job.status === "CLOSED")) &&
    row.job.title.toLocaleLowerCase("en").includes(query.q.toLocaleLowerCase("en")) &&
    (query.employment === "ALL" || row.job.employmentType === query.employment) &&
    (query.mode === "ALL" || row.job.workMode === query.mode) &&
    (query.deadline === "ALL" || (query.deadline === "UNKNOWN" && !row.job.applicationDeadline) ||
      (query.deadline === "SOON" && row.job.status === "PUBLISHED" && !!row.job.applicationDeadline &&
        row.job.applicationDeadline.getTime() >= now.getTime() &&
        row.job.applicationDeadline.getTime() <= now.getTime() + 7*86400000)) &&
    query.view !== "WAITING"
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
  const s = p.toString();
  return "/hr/drives" + (s ? "?" + s : "");
}

export const HR_DRIVE_PAGE_SIZE=20;
export function paginateRecruiterDrives<T>(rows:readonly T[],page:number) {
  const first=(page-1)*HR_DRIVE_PAGE_SIZE;
  return {total:rows.length,page,pageSize:HR_DRIVE_PAGE_SIZE,
    pages:Math.ceil(rows.length/HR_DRIVE_PAGE_SIZE),rows:rows.slice(first,first+HR_DRIVE_PAGE_SIZE)};
}
