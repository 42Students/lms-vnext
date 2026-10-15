import { z } from "zod";

export const mentorTeamCoverageQuerySchema = z.object({
  filter: z.enum(["ALL", "NO_LEARNERS", "NO_PRIMARY_MENTOR","HAS_LEARNERS","HAS_PRIMARY_MENTOR"]).default("ALL"),
  assignment: z.enum(["ALL","PRIMARY","SUPPORTING"]).default("ALL"),
  status: z.enum(["ALL","PLANNED","ACTIVE","COMPLETED"]).default("ALL"),
  search: z.string().trim().max(120).default(""),
  page: z.coerce.number().int().min(1).max(10000).default(1),
}).strict();

export type MentorTeamCoverageQuery = z.infer<typeof mentorTeamCoverageQuerySchema>;

export function summarizeActiveProjectTeam(
  members: readonly { role: string; isPrimary: boolean }[],
) {
  const learners = members.filter(row => row.role === "LEARNER").length;
  const mentors = members.filter(row => row.role === "MENTOR").length;
  const hasPrimaryMentor = members.some(row =>
    row.role === "MENTOR" && row.isPrimary,
  );
  return { learners, mentors, hasPrimaryMentor };
}

export type MentorTeamCoverageRow = {
  projectId: string;
  title: string;
  status: string;
  learners: number;
  mentors: number;
  hasPrimaryMentor: boolean;
  isPrimaryMentor: boolean;
};

export function selectMentorTeamCoverage(
  rows: readonly MentorTeamCoverageRow[],
  query: MentorTeamCoverageQuery,
) {
  const term = query.search.toLowerCase();
  const matches = rows.filter(row =>
    (!term || row.title.toLowerCase().includes(term)) &&
    (query.status === "ALL" || row.status === query.status) &&
    (query.assignment === "ALL" || (query.assignment === "PRIMARY") === row.isPrimaryMentor) &&
    (query.filter === "ALL" ||
      (query.filter === "NO_LEARNERS" && row.learners === 0) ||
      (query.filter === "NO_PRIMARY_MENTOR" && !row.hasPrimaryMentor) ||
      (query.filter === "HAS_LEARNERS" && row.learners > 0) ||
      (query.filter === "HAS_PRIMARY_MENTOR" && row.hasPrimaryMentor)),
  ).sort((a,b) => a.title.localeCompare(b.title) ||
    a.projectId.localeCompare(b.projectId));
  const total = matches.length;
  const pageSize = 20;
  const totalPages = Math.max(1,Math.ceil(total/pageSize));
  const page = Math.min(query.page,totalPages);
  return {
    total, page, pageSize, totalPages,
    items: matches.slice((page - 1) * pageSize,page * pageSize),
  };
}

export function mentorTeamCoverageHref(query: MentorTeamCoverageQuery) {
  const params = new URLSearchParams();
  if (query.filter !== "ALL") params.set("filter",query.filter);
  if (query.status !== "ALL") params.set("status",query.status);
  if (query.assignment !== "ALL") params.set("assignment",query.assignment);
  if (query.search) params.set("search",query.search);
  if (query.page > 1) params.set("page",String(query.page));
  const suffix = params.toString();
  return "/mentor/team-coverage" + (suffix ? "?" + suffix : "");
}
