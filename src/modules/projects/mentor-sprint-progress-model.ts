import { z } from "zod";

export const mentorSprintProgressQuerySchema = z.object({
  order:z.enum(["PROJECT","ACTIVE_FIRST"]).default("PROJECT"),
  taskAttention:z.enum(["ALL","BLOCKED","IN_REVIEW","NO_TASKS"]).default("ALL"),
  projectId:z.preprocess(value=>value===""?undefined:value,z.string().uuid().optional()),
  state: z.enum(["ALL", "PLANNED", "ACTIVE", "COMPLETED"]).default("ALL"),
  release: z.enum(["ALL","PLANNED","IN_PROGRESS","SHIPPED"]).default("ALL"),
  search: z.string().trim().max(120).default(""),
  page: z.coerce.number().int().min(1).max(10000).default(1),
}).strict();
export type MentorSprintProgressQuery = z.infer<typeof mentorSprintProgressQuerySchema>;

export function mentorSprintProgressPage(total: number, requested: number) {
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requested, totalPages);
  return { total, page, pageSize, totalPages };
}

export function summarizeSprintTasks(
  statusCounts: readonly { status: string; total: number }[],
) {
  const total = statusCounts.reduce((sum, row) => sum + row.total, 0);
  const completed = statusCounts.filter(row => row.status === "DONE")
    .reduce((sum, row) => sum + row.total, 0);
  const inReview = statusCounts.filter(row => row.status === "IN_REVIEW")
    .reduce((sum, row) => sum + row.total, 0);
  const blocked = statusCounts.filter(row => row.status === "BLOCKED")
    .reduce((sum, row) => sum + row.total, 0);
  return {
    total,
    completed,
    inReview,
    blocked,
    completionPercent: total === 0 ? null : Math.round((completed / total) * 100),
  };
}

export function mentorSprintProgressHref(query: Pick<MentorSprintProgressQuery,"state"|"search"|"page"> &
  {release?:MentorSprintProgressQuery["release"];projectId?:MentorSprintProgressQuery["projectId"];taskAttention?:MentorSprintProgressQuery["taskAttention"];order?:MentorSprintProgressQuery["order"]}) {
  const params = new URLSearchParams();
  if (query.projectId)params.set("projectId",query.projectId);
  if (query.taskAttention&&query.taskAttention!=="ALL")params.set("taskAttention",query.taskAttention);
  if (query.order&&query.order!=="PROJECT")params.set("order",query.order);
  if (query.state !== "ALL") params.set("state", query.state);
  if (query.release && query.release !== "ALL") params.set("release", query.release);
  if (query.search) params.set("search", query.search);
  if (query.page > 1) params.set("page", String(query.page));
  const search = params.toString();
  return "/mentor/sprint-progress" + (search ? "?" + search : "");
}
