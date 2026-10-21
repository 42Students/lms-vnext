import "server-only";
import { and, asc, count, countDistinct, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { departments, electiveSlots, electiveOfferings, lmsGroupMembers, collegeMemberships, programs } from "@/db/schema";
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
    ...summarizeAdminElectives([]), truncated: false, programs: [] as {id:string;name:string}[] };
  requirePermission(context, "academics.read", {
    organizationId: context.adminScope?.organizationId,
    collegeId,
  });
  const pattern = query.q ? "%" + query.q.replace(/[\\%_]/g, "\\$&") + "%" : null;
  const rows = await getDb().select({
    id: electiveSlots.id,
    name: electiveSlots.name,
    description: electiveSlots.description,
    version: electiveSlots.version,
    programId: programs.id,
    programName: programs.name,
    semesterNumber: electiveSlots.semesterNumber,
    academicYear: electiveSlots.academicYear,
    academicPeriodId: electiveSlots.academicPeriodId,
    hasEnrollmentHistory: sql<boolean>`exists (
      select 1 from elective_offerings eo where eo.slot_id = ${electiveSlots.id}
      and (exists (select 1 from lms_group_members gm where gm.group_id=eo.group_id)
        or exists (select 1 from lms_group_member_events ev where ev.group_id=eo.group_id))
    )`.as("elective_has_enrollment_history"),
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
      query.programId ? eq(electiveSlots.programId, query.programId) : undefined,
      query.semesterNumber !== undefined ? eq(electiveSlots.semesterNumber, query.semesterNumber) : undefined,
      pattern ? or(ilike(electiveSlots.name, pattern), ilike(programs.name, pattern)) : undefined,
    ))
    .orderBy(asc(programs.name), asc(electiveSlots.semesterNumber), asc(electiveSlots.name), asc(electiveSlots.id))
    .limit(201);
  const shown = rows.slice(0, 200);
  const ids = shown.map(row => row.id);
  const [programChoices, offeringCounts, studentCounts] = await Promise.all([
    getDb().select({id:programs.id,name:programs.name}).from(programs)
      .innerJoin(departments,eq(departments.id,programs.departmentId))
      .where(eq(departments.collegeId,collegeId)).orderBy(asc(programs.name)),
    ids.length ? getDb().select({slotId:electiveOfferings.slotId,total:count()})
      .from(electiveOfferings).where(and(inArray(electiveOfferings.slotId,ids),
        eq(electiveOfferings.status,"ACTIVE"),isNull(electiveOfferings.deletedAt)))
      .groupBy(electiveOfferings.slotId) : Promise.resolve([]),
    ids.length ? getDb().select({slotId:electiveOfferings.slotId,
        total:countDistinct(lmsGroupMembers.membershipId)})
      .from(electiveOfferings)
      .innerJoin(lmsGroupMembers,and(eq(lmsGroupMembers.groupId,electiveOfferings.groupId),
        eq(lmsGroupMembers.state,"ACTIVE"),eq(lmsGroupMembers.memberType,"LEARNER")))
      .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,lmsGroupMembers.membershipId),
        eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.status,"ACTIVE")))
      .where(and(inArray(electiveOfferings.slotId,ids),
        eq(electiveOfferings.status,"ACTIVE"),isNull(electiveOfferings.deletedAt)))
      .groupBy(electiveOfferings.slotId) : Promise.resolve([]),
  ]);
  const offerings = new Map(offeringCounts.map(item=>[item.slotId,item.total]));
  const students = new Map(studentCounts.map(item=>[item.slotId,item.total]));
  return { state: "READY" as const, query, programs:programChoices,
    ...summarizeAdminElectives(shown.map(row=>({...row,
      offerings:offerings.get(row.id)??0,students:students.get(row.id)??0}))),
    truncated: rows.length > 200 };
}
