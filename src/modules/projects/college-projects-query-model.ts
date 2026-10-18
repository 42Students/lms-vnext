import { z } from "zod";

const statuses = ["PLANNED", "ACTIVE", "COMPLETED", "ARCHIVED"] as const;
const schema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.enum(statuses).optional(),
  view: z.enum(["cards", "table"]).default("cards"),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(10).max(100).default(25),
});

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** Invalid or hostile URL filters must produce a recoverable UI, not a 500. */
export function parseCollegeProjectsQuery(
  params: Record<string, string | string[] | undefined>,
) {
  const q = first(params.q);
  const status = first(params.status);
  const view = first(params.view);
  const page = first(params.page);
  const pageSize = first(params.pageSize);
  return schema.safeParse({
    ...(q ? { q } : {}),
    ...(status ? { status } : {}),
    ...(view ? { view } : {}),
    ...(page !== undefined ? { page } : {}),
    ...(pageSize !== undefined ? { pageSize } : {}),
  });
}
