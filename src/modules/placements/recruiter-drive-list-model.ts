import { z } from "zod";

export const recruiterDriveListQuerySchema = z.object({
  view: z.enum(["ALL", "LIVE", "CLOSED", "WAITING"]).default("ALL"),
  collegeId: z.string().uuid().optional(),
  q: z.string().trim().max(100).default(""),
}).strict();
export type RecruiterDriveListQuery = z.infer<typeof recruiterDriveListQuerySchema>;

export type RecruiterDriveListItem = {
  collegeId: string;
  job: { id: string; title: string; status: string; archivedAt: Date | null };
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
  rows: readonly T[], query: RecruiterDriveListQuery,
): T[] {
  return rows.filter(row =>
    row.job.archivedAt === null &&
    (row.job.status === "PUBLISHED" || row.job.status === "CLOSED") &&
    (!query.collegeId || row.collegeId === query.collegeId) &&
    (query.view === "ALL" || (query.view === "LIVE" && row.job.status === "PUBLISHED") ||
      (query.view === "CLOSED" && row.job.status === "CLOSED")) &&
    row.job.title.toLocaleLowerCase("en").includes(query.q.toLocaleLowerCase("en")) &&
    query.view !== "WAITING"
  );
}

export function recruiterDrivesHref(query: RecruiterDriveListQuery) {
  const p = new URLSearchParams();
  if (query.collegeId) p.set("collegeId", query.collegeId);
  if (query.view !== "ALL") p.set("view", query.view);
  if (query.q) p.set("q", query.q);
  const s = p.toString();
  return "/hr/drives" + (s ? "?" + s : "");
}
