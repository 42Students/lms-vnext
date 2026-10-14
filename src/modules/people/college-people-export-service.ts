import "server-only";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import { listCollegePeopleWithRuntime } from "./runtime";
import { PEOPLE_CSV_CAP, peopleCsvQuery, renderPeopleCsv } from "./college-people-export-model";

export async function exportCollegePeopleCsv(context: RequestContext, raw: unknown) {
  const filter = peopleCsvQuery.parse(raw);
  const own = context.membership;
  if (!own || !hasMembershipRole(context, "COLLEGE_ADMIN"))
    throw new AuthorizationError("people.manage");
  requirePermission(context, "people.manage", {
    organizationId: own.organizationId, collegeId: own.collegeId,
  });
  const rows: Awaited<ReturnType<typeof listCollegePeopleWithRuntime>>["items"] = [];
  let total = 0;
  for (let offset = 0; offset < PEOPLE_CSV_CAP; offset += 100) {
    const page = await listCollegePeopleWithRuntime(context, {
      collegeId: own.collegeId, limit: 100, offset, ...filter,
    });
    if (offset === 0) total = page.pagination.total;
    rows.push(...page.items);
    if (page.items.length < 100 || offset + 100 >= total) break;
  }
  const truncated = total > PEOPLE_CSV_CAP;
  return { csv: renderPeopleCsv(rows, truncated),
    total, exported: rows.length, truncated };
}
