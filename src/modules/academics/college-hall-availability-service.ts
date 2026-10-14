import "server-only";

import { and, asc, eq, gt, lt } from "drizzle-orm";
import { getDb } from "@/db/client";
import { academicPeriods, cohorts, departments, lectureHalls, programs,
  sectionScheduleEvents, sections } from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import {
  collegeHallAvailabilityProjection, collegeHallAvailabilitySchema, istWindow,
} from "./college-hall-availability-model";

export class CollegeHallAvailabilityNotFoundError extends Error {
  readonly code = "NOT_FOUND";
  constructor() { super("Hall not found"); this.name = "CollegeHallAvailabilityNotFoundError"; }
}

/** Read-only bounded IST calendar. No client-provided college IDs or free/busy
 * promises; only persisted SCHEDULED rows are evidence. */
export async function getCollegeHallAvailability(context: RequestContext, raw: unknown) {
  const query = collegeHallAvailabilitySchema.parse(raw);
  const membership = context.membership;
  if (!membership || membership.status !== "ACTIVE" || !hasMembershipRole(context, "COLLEGE_ADMIN") ||
    !can(context, "academics.manage", {
      collegeId: membership.collegeId, organizationId: membership.organizationId,
    })) throw new AuthorizationError("academics.manage");
  requirePermission(context, "academics.manage", {
    collegeId: membership.collegeId, organizationId: membership.organizationId,
  });
  const db = getDb();
  const [hall] = await db.select({
    id: lectureHalls.id, name: lectureHalls.name, capacity: lectureHalls.capacity,
    roomType: lectureHalls.roomType, status: lectureHalls.status,
  }).from(lectureHalls).where(and(
    eq(lectureHalls.id, query.hallId),
    eq(lectureHalls.collegeId, membership.collegeId),
  )).limit(1);
  if (!hall) throw new CollegeHallAvailabilityNotFoundError();

  const { start, endExclusive } = istWindow(query.from, query.to);
  const rows = await db.select({
    id: sectionScheduleEvents.id,
    title: sectionScheduleEvents.title,
    startsAt: sectionScheduleEvents.startsAt,
    endsAt: sectionScheduleEvents.endsAt,
    updatedAt: sectionScheduleEvents.updatedAt,
    sectionId: sections.id,
    sectionName: sections.name,
    sectionCapacity: sections.capacity,
  }).from(sectionScheduleEvents)
    .innerJoin(sections, eq(sections.id, sectionScheduleEvents.sectionId))
    .innerJoin(academicPeriods, and(
      eq(academicPeriods.id, sections.academicPeriodId),
      eq(academicPeriods.collegeId, membership.collegeId),
    ))
    .innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
    .innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(departments, and(
      eq(departments.id, programs.departmentId),
      eq(departments.collegeId, membership.collegeId),
    ))
    .where(and(
      eq(sectionScheduleEvents.lectureHallId, hall.id),
      eq(sectionScheduleEvents.status, "SCHEDULED"),
      lt(sectionScheduleEvents.startsAt, endExclusive),
      gt(sectionScheduleEvents.endsAt, start),
    ))
    .orderBy(asc(sectionScheduleEvents.startsAt), asc(sectionScheduleEvents.id))
    .limit(501);
  const sessions = collegeHallAvailabilityProjection(hall.capacity, rows.slice(0, 500));
  return {
    hall, from: query.from, to: query.to, sessions, truncated: rows.length > 500,
    conflictCount: sessions.filter(item => item.hasConflict).length,
  };
}
