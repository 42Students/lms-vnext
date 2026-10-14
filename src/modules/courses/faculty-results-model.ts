import { z } from "zod";

export const facultyResultsQuerySchema = z.object({
  kind: z.enum(["ALL", "ASSIGNMENT", "QUIZ"]).default("ALL"),
  status: z.enum(["ALL", "PUBLISHED"]).default("ALL"),
  deliveryId: z.string().uuid().optional(),
  search: z.string().trim().max(120).default(""),
  page: z.coerce.number().int().min(1).max(10000).default(1),
}).strict();

export type FacultyResultsQuery = z.infer<typeof facultyResultsQuerySchema>;
export type FacultyResultCandidate = {
  id: string;
  kind: "ASSIGNMENT" | "QUIZ";
  status: string;
  title: string;
  courseName: string;
  sectionName: string;
  deliveryId: string;
  dueAt: Date | null;
};

export function filterFacultyResultCandidates<T extends FacultyResultCandidate>(
  rows: readonly T[], query: Pick<FacultyResultsQuery, "kind" | "status" | "search" | "deliveryId">,
): T[] {
  const term = query.search.toLowerCase();
  return rows.filter(row =>
    (query.kind === "ALL" || row.kind === query.kind) &&
    (query.status === "ALL" || row.status === "PUBLISHED" ||
      (row.kind === "QUIZ" && row.status === "CLOSED")) &&
    (!query.deliveryId || row.deliveryId === query.deliveryId) &&
    (!term || [row.title, row.courseName, row.sectionName].some(field =>
      field.toLowerCase().includes(term))),
  ).sort((a,b) =>
    (b.dueAt?.getTime() ?? 0) - (a.dueAt?.getTime() ?? 0) ||
    a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id),
  );
}

export function paginateFacultyResults<T>(
  rows: readonly T[], page: number, pageSize = 5,
) {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);
  return {
    total, page: current, pageSize, totalPages,
    items: rows.slice((current - 1) * pageSize, current * pageSize),
  };
}

export function facultyResultsHref(query: FacultyResultsQuery): string {
  const params = new URLSearchParams();
  if (query.kind !== "ALL") params.set("kind", query.kind);
  if (query.status !== "ALL") params.set("status", query.status);
  if (query.deliveryId) params.set("deliveryId", query.deliveryId);
  if (query.search) params.set("search", query.search);
  if (query.page > 1) params.set("page", String(query.page));
  return "/teacher/results" + (params.size ? "?" + params.toString() : "");
}

/** Returns unknown, not a made-up zero, for absent or inconsistent rosters. */
export function facultyRecordedResponseRate(eligible: number, responded: number) {
  if (!Number.isInteger(eligible) || !Number.isInteger(responded) ||
      eligible <= 0 || responded < 0 || responded > eligible) return null;
  return Math.round(responded / eligible * 100);
}
