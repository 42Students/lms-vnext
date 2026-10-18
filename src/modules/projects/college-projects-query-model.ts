import { z } from "zod";

const statuses = ["PLANNED", "ACTIVE", "COMPLETED", "ARCHIVED"] as const;
// URL page values must be base-10 integers. z.coerce.number() also accepts
// scientific notation, hexadecimal and surrounding whitespace from hostile URLs.
const positivePageNumber = (max: number, defaultValue: number) =>
  z.union([
    z.number().int().min(1).max(max),
    z.string().regex(/^[0-9]+$/).transform(Number).pipe(z.number().int().min(1).max(max)),
  ]).default(defaultValue);
const schema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.enum(statuses).optional(),
  view: z.enum(["cards", "table"]).default("cards"),
  page: positivePageNumber(100000, 1),
  pageSize: z.union([z.number().int().min(10).max(100), z.string().regex(/^[0-9]+$/).transform(Number).pipe(z.number().int().min(10).max(100))]).default(25),
});

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** Invalid or hostile URL filters must produce a recoverable UI, not a 500. */
export function parseCollegeProjectsQuery(
  params: Record<string, string | string[] | undefined>,
) {
  // A repeated filter can hide an attacker-controlled second value in a stale
  // URL or query builder. Do not silently prefer the first value for mutations.
  if (Object.keys(params).some(key => !["q", "status", "view", "page", "pageSize"].includes(key)) ||
      Object.values(params).some(Array.isArray)) {
    return schema.safeParse(null);
  }
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
