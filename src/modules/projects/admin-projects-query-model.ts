import { z } from "zod";

// URL numbers are decimal-only: coercion would also admit 0x10, 1e2 and whitespace.
const positiveDecimal = (min: number, max: number, fallback: number) =>
  z.union([
    z.number().int().min(min).max(max),
    z.string().regex(/^[0-9]+$/).transform(Number).pipe(z.number().int().min(min).max(max)),
  ]).default(fallback);

/** Legacy status values were not identical to the new lifecycle. Status
 * labels are mapped only where semantics agree; BLOCKED remains an
 * independent blocker rather than a fabricated fifth persisted status. */
export function legacyAdminProjectStatus(status:string,blocker:string|null|undefined){
 if(status==="ARCHIVED")return "Archived";
 if(status==="COMPLETED"||status==="DONE")return "Completed";
 if(blocker?.trim()||status==="BLOCKED")return "Blocked";
 if(status==="ACTIVE"||status==="IN_PROGRESS")return "In progress";
 if(status==="PLANNED"||status==="NOT_STARTED")return "Not started";
 return status.toLowerCase().replaceAll("_"," ");
}

const schema = z.strictObject({
  q: z.string().trim().max(120).optional(),
  status: z.enum(["PLANNED","ACTIVE","IN_PROGRESS","READY","BLOCKED","COMPLETED","ARCHIVED"]).optional(),
  view: z.enum(["cards", "table"]).default("table"),
  page: positiveDecimal(1, 100000, 1),
  pageSize: positiveDecimal(10, 100, 20),
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
  // Unknown keys must not be silently discarded when a stale or forged link
  // reaches the Super Admin projects view.
  if (Object.keys(params).some(key => !["search","q","status","view","page","pageSize"].includes(key)))
    return schema.safeParse(null);
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
  const rawStatus=first(params.status);
  // Preserve the legacy filter dimension. BLOCKED uses the scoped blocker
  // predicate and READY uses authored readiness phase rather than silently
  // falling through to all ACTIVE workspaces.
  const status=rawStatus==="NOT_STARTED"?"PLANNED":
    rawStatus==="DONE"?"COMPLETED":rawStatus;
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
