import { z } from "zod";

export const facultyCourseHealthParamsSchema = z.object({
  deliveryId: z.string().uuid(),
  kind: z.enum(["ALL","QUIZ","ASSIGNMENT"]).default("ALL"),
  page: z.coerce.number().int().min(1).max(10000).default(1),
}).strict();
export type FacultyCourseHealthParams = z.infer<typeof facultyCourseHealthParamsSchema>;
export type FacultyCourseHealthCandidate = {
  id: string;
  deliveryId: string;
  title: string;
  kind: "QUIZ" | "ASSIGNMENT";
  status: string;
  dueAt: Date | null;
};

export function selectFacultyCourseHealthCandidates<T extends FacultyCourseHealthCandidate>(
  rows: readonly T[], query: FacultyCourseHealthParams,
) {
  const matches = rows.filter(row =>
    row.deliveryId === query.deliveryId &&
    (row.status === "PUBLISHED" || (row.kind === "QUIZ" && row.status === "CLOSED")) &&
    (query.kind === "ALL" || row.kind === query.kind),
  ).sort((a,b) => {
    const date = (value: Date | null) => {
      const instant = value?.getTime() ?? 0;
      return Number.isFinite(instant) ? instant : 0;
    };
    return date(b.dueAt) - date(a.dueAt) ||
      a.kind.localeCompare(b.kind) ||
      a.id.localeCompare(b.id);
  });
  const total = matches.length;
  const pageSize = 5;
  const totalPages = Math.max(1,Math.ceil(total/pageSize));
  const page = Math.min(query.page,totalPages);
  return {
    total,page,pageSize,totalPages,
    items: matches.slice((page - 1) * pageSize,page * pageSize),
  };
}

export function facultyCourseHealthHref(query: FacultyCourseHealthParams) {
  const params = new URLSearchParams();
  if (query.kind !== "ALL") params.set("kind",query.kind);
  if (query.page > 1) params.set("page",String(query.page));
  const suffix = params.toString();
  return "/teacher/courses/" + encodeURIComponent(query.deliveryId) +
    "/assessment-health" + (suffix ? "?" + suffix : "");
}

export function responseCoverage(eligible: number, responded: number) {
  // Data integrity failures should be unknown, not a plausible 0% or 100%.
  if (!Number.isInteger(eligible) || eligible <= 0 ||
      !Number.isInteger(responded) || responded < 0 || responded > eligible) {
    return null;
  }
  return Math.round((responded / eligible) * 100);
}
