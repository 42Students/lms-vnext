import "server-only";
import { and, asc, eq, ilike, isNull, or } from "drizzle-orm";
import { getDb } from "@/db/client";
import { departments, electiveSlots, programs } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { isSuperAdmin } from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import { adminElectiveQuerySchema, summarizeAdminElectives } from "./admin-directory-model";

/** Read-only scoped elective slots; no College Admin membership fallback. */
export async function listSuperAdminElectives(context: RequestContext, raw: unknown) {
  const query = adminElectiveQuerySchema.parse(raw);
  if (!isSuperAdmin(context)) throw new AuthorizationError("academics.read");
  const collegeId = context.adminScope?.collegeId ?? null;
  if (!collegeId) return { state: "CHOOSE_COLLEGE" as const, query,
    ...summarizeAdminElectives([]), truncated: false };
  requirePermission(context, "academics.read", {
    organizationId: context.adminScope?.organizationId,
    collegeId,
  });
  const pattern = query.q ? "%" + query.q.replace(/[\\%_]/g, "\\$&") + "%" : null;
  const rows = await getDb().select({
    id: electiveSlots.id,
    name: electiveSlots.name,
    programName: programs.name,
    semesterNumber: electiveSlots.semesterNumber,
    academicYear: electiveSlots.academicYear,
    credits: electiveSlots.credits,
    minPick: electiveSlots.minPick,
    maxPick: electiveSlots.maxPick,
    status: electiveSlots.status,
  }).from(electiveSlots)
    .innerJoin(programs, eq(programs.id, electiveSlots.programId))
    .innerJoin(departments, and(eq(departments.id, programs.departmentId),
      eq(departments.collegeId, collegeId)))
    .where(and(
      eq(electiveSlots.collegeId, collegeId),
      isNull(electiveSlots.deletedAt),
      query.status === "ALL" ? undefined : eq(electiveSlots.status, query.status),
      pattern ? or(ilike(electiveSlots.name, pattern), ilike(programs.name, pattern)) : undefined,
    ))
    .orderBy(asc(programs.name), asc(electiveSlots.semesterNumber), asc(electiveSlots.name), asc(electiveSlots.id))
    .limit(201);
  return { state: "READY" as const, query,
    ...summarizeAdminElectives(rows.slice(0, 200)),
    truncated: rows.length > 200 };
}
