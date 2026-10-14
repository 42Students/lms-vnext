import { z } from "zod";

export const facultyResponseFollowUpQuerySchema = z.object({
  kind: z.enum(["ALL", "ASSIGNMENT", "QUIZ"]).default("ALL"),
  search: z.string().trim().max(120).default(""),
  page: z.coerce.number().int().min(1).max(10000).default(1),
}).strict();
export type FacultyResponseFollowUpQuery = z.infer<typeof facultyResponseFollowUpQuerySchema>;

export type FacultyResponseCandidate = {
  id: string;
  deliveryId: string;
  title: string;
  kind: "ASSIGNMENT" | "QUIZ";
  status: string;
  dueAt: Date | null;
  courseName: string;
  sectionName: string;
};

export function selectPastDueAssessments<T extends FacultyResponseCandidate>(
  candidates: readonly T[],
  query: Pick<FacultyResponseFollowUpQuery, "kind" | "search">,
  now: Date,
): T[] {
  const term = query.search.toLowerCase();
  return candidates.filter(row =>
    row.status === "PUBLISHED" && row.dueAt !== null &&
    row.dueAt.getTime() <= now.getTime() &&
    (query.kind === "ALL" || row.kind === query.kind) &&
    (!term || [row.title, row.courseName, row.sectionName].some(value =>
      value.toLowerCase().includes(term))),
  ).sort((a,b) =>
    b.dueAt!.getTime() - a.dueAt!.getTime() ||
    a.kind.localeCompare(b.kind) ||
    a.id.localeCompare(b.id) ||
    a.deliveryId.localeCompare(b.deliveryId),
  );
}

export function facultyResponseFollowUpPage<T>(
  rows: readonly T[], requested: number,
) {
  const pageSize = 5;
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requested, totalPages);
  return {
    total, totalPages, page, pageSize,
    items: rows.slice((page - 1) * pageSize, page * pageSize),
  };
}

export function facultyResponseFollowUpHref(query: FacultyResponseFollowUpQuery) {
  const params = new URLSearchParams();
  if (query.kind !== "ALL") params.set("kind", query.kind);
  if (query.search) params.set("search", query.search);
  if (query.page > 1) params.set("page", String(query.page));
  const suffix = params.toString();
  return "/teacher/response-followups" + (suffix ? "?" + suffix : "");
}

export function limitedMissingLearners<T>(
  learners: readonly T[], limit = 12,
) {
  return { total: learners.length, preview: learners.slice(0, limit),
    hiddenCount: Math.max(0, learners.length - limit) };
}
