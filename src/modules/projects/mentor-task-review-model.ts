import { z } from "zod";

export const mentorTaskReviewQuerySchema = z.object({
  search: z.string().trim().max(120).default(""),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
}).strict();

export function mentorTaskReviewHref(query: {
  search?: string; page?: number; pageSize?: number;
}) {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  if (query.pageSize && query.pageSize !== 20) params.set("pageSize", String(query.pageSize));
  const suffix = params.toString();
  return "/mentor/task-reviews" + (suffix ? "?" + suffix : "");
}

export function mentorTaskReviewSummary(input: {
  total: number; page: number; pageSize: number;
}) {
  return {
    total: input.total,
    page: input.page,
    pageSize: input.pageSize,
    totalPages: Math.max(1, Math.ceil(input.total / input.pageSize)),
    first: input.total === 0 ? 0 : (input.page - 1) * input.pageSize + 1,
    last: Math.min(input.total, input.page * input.pageSize),
  };
}
