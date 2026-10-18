import { z } from "zod";

const schema = z.strictObject({
  q: z.string().trim().max(120).optional(),
  status: z.enum(["PLANNED", "ACTIVE", "COMPLETED", "ARCHIVED"]).optional(),
  view: z.enum(["cards", "table"]).default("table"),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(10).max(100).default(20),
});

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** Super Admin supports legacy `search` and current `q` query keys.
 * Query validation happens before the DB call so invalid URL parameters render
 * a recoverable page rather than an uncaught Zod error.
 */
export function parseAdminProjectsQuery(
  params: Record<string, string | string[] | undefined>,
) {
  // Duplicate values are ambiguous for every filter, including legacy
  // `search` and modern `q`. Fail closed before querying tenant data.
  if (Object.values(params).some(Array.isArray))
    return schema.safeParse(null);
  // Legacy `search` and current `q` are aliases, not independently
  // selectable filters. Reject conflicts rather than silently preferring one.
  const legacySearch=first(params.search);
  const currentSearch=first(params.q);
  if(legacySearch!==undefined&&currentSearch!==undefined&&
     legacySearch.trim()!==currentSearch.trim())return schema.safeParse(null);
  const search = legacySearch ?? currentSearch;
  const status = first(params.status);
  const view = first(params.view);
  const page = first(params.page);
  const pageSize = first(params.pageSize);
  return schema.safeParse({
    ...(search !== undefined ? { q: search } : {}),
    ...(status ? { status } : {}),
    ...(view !== undefined ? { view } : {}),
    ...(page !== undefined ? { page } : {}),
    ...(pageSize !== undefined ? { pageSize } : {}),
  });
}
