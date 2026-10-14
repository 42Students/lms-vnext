import { z } from "zod";

export const mentorTeamHistoryQuerySchema = z.object({
  projectId: z.string().uuid(),
  view: z.enum(["ALL", "OPEN", "ENDED"]).default("ALL"),
  role: z.enum(["ALL","MENTOR","LEARNER"]).default("ALL"),
  primary: z.enum(["ALL","PRIMARY"]).default("ALL"),
  order: z.enum(["OLDEST","NEWEST"]).default("OLDEST"),
  page: z.coerce.number().int().min(1).max(10000).default(1),
}).strict();

export type MentorTeamHistoryQuery = z.infer<typeof mentorTeamHistoryQuerySchema>;

export function classifyMentorTeamMember(input: {
  endedAt: Date | null;
  membershipStatus: string;
  platformStatus: string;
}): "CURRENT" | "ENDED" | "INACTIVE" {
  if (input.endedAt) return "ENDED";
  if (input.membershipStatus !== "ACTIVE" || input.platformStatus !== "ACTIVE") {
    return "INACTIVE";
  }
  return "CURRENT";
}

export function mentorTeamHistoryHref(
  projectId: string,
  query: Pick<MentorTeamHistoryQuery, "view" | "page"> & {role?: MentorTeamHistoryQuery["role"];primary?:MentorTeamHistoryQuery["primary"];order?:MentorTeamHistoryQuery["order"]},
) {
  const params = new URLSearchParams();
  if (query.view !== "ALL") params.set("view", query.view);
  if (query.role && query.role !== "ALL") params.set("role",query.role);
  if (query.primary === "PRIMARY") params.set("primary","PRIMARY");
  if (query.order === "NEWEST") params.set("order","NEWEST");
  if (query.page > 1) params.set("page", String(query.page));
  const suffix = params.toString();
  return "/mentor/projects/" + encodeURIComponent(projectId) + "/team-history" +
    (suffix ? "?" + suffix : "");
}

export function mentorTeamHistoryPage(total: number, requestedPage: number, size = 20) {
  const totalPages = Math.max(1, Math.ceil(total / size));
  const page = Math.min(requestedPage, totalPages);
  return { total, page, totalPages, pageSize: size };
}
