import "server-only";

import { and, count, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  colleges, departments, organizations, programs, courses, facultyProfiles,
} from "@/db/schema";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import type { RequestContext } from "@/modules/identity/context";
import { resolveActingCollege } from "@/modules/permissions/acting-college";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  collegeDepartmentArchiveSchema, collegeDepartmentCreateSchema,
  collegeDepartmentIdSchema, collegeDepartmentRenameSchema,
  canArchiveCollegeDepartment,
} from "./college-department-mutation-model";

export class CollegeDepartmentMutationError extends Error {
  constructor(public readonly code:
    "DEPARTMENT_NOT_FOUND" | "DEPARTMENT_NAME_CONFLICT" |
    "DEPARTMENT_HAS_DEPENDENCIES",
    public readonly dependencies?: {programs:number;courses:number;faculty:number}) {
    const messages={
      DEPARTMENT_NOT_FOUND:"Department not found in the selected college.",
      DEPARTMENT_NAME_CONFLICT:"A department with this name already exists.",
      DEPARTMENT_HAS_DEPENDENCIES:"This department has linked programs, courses or faculty. Reassign them before archiving.",
    } as const;
    super(messages[code]);
    this.name = "CollegeDepartmentMutationError";
  }
}
type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

// SA-academics-people-05: selected Super Admin college and College Admin membership share scoped mutations.
async function own(context: RequestContext) {
  return resolveActingCollege(context, "department.manage");
}
async function liveCollege(tx: Tx, collegeId: string, organizationId: string) {
  const [row] = await tx.select({ id: colleges.id })
    .from(colleges).innerJoin(organizations, eq(organizations.id, colleges.organizationId))
    .where(and(eq(colleges.id, collegeId), eq(colleges.organizationId, organizationId),
      eq(colleges.status, "ACTIVE"), eq(organizations.status, "ACTIVE")))
    .for("share", { of: colleges }).limit(1);
  if (!row) throw new CollegeDepartmentMutationError("DEPARTMENT_NOT_FOUND");
}
async function lockDepartment(tx: Tx, departmentId: string, collegeId: string) {
  const [row] = await tx.select({ id: departments.id, name: departments.name })
    .from(departments)
    .where(and(eq(departments.id, departmentId), eq(departments.collegeId, collegeId),
      isNull(departments.archivedAt)))
    .for("update").limit(1);
  if (!row) throw new CollegeDepartmentMutationError("DEPARTMENT_NOT_FOUND");
  return row;
}
async function ensureUnique(tx: Tx, collegeId: string, name: string, exclude?: string) {
  const rows = await tx.select({ id: departments.id }).from(departments)
    .where(and(eq(departments.collegeId, collegeId),
      isNull(departments.archivedAt),
      sql`lower(${departments.name}) = ${name.toLocaleLowerCase("en-IN")}`));
  if (rows.some(row => row.id !== exclude))
    throw new CollegeDepartmentMutationError("DEPARTMENT_NAME_CONFLICT");
}
function mapConstraint(error: unknown): never {
  if (error instanceof CollegeDepartmentMutationError || error instanceof AuthorizationError)
    throw error;
  let cause:unknown=error;
  for(let n=0;n<6&&cause&&typeof cause==="object";n++){
    const record=cause as {code?:unknown;cause?:unknown};
    if(record.code==="23505")
      throw new CollegeDepartmentMutationError("DEPARTMENT_NAME_CONFLICT");
    if(record.code==="23503")
      throw new CollegeDepartmentMutationError("DEPARTMENT_HAS_DEPENDENCIES");
    cause=record.cause;
  }
  throw error;
}

export async function createCollegeDepartment(context: RequestContext, raw: unknown) {
  const input = collegeDepartmentCreateSchema.parse(raw);
  const member = await own(context);
  try {
    return await getDb().transaction(async tx => {
      await liveCollege(tx, member.collegeId, member.organizationId);
      await ensureUnique(tx, member.collegeId, input.name);
      const [created] = await tx.insert(departments).values({
        collegeId: member.collegeId, name: input.name,
      }).returning();
      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.ACADEMICS_DEPARTMENT_CREATED,
        collegeId: member.collegeId, organizationId: member.organizationId,
        subjectType: "department", subjectId: created.id,
        subjectLabel: created.name, summary: "College department created",
        metadata: { action: "DEPARTMENT_CREATE" },
      });
      return created;
    });
  } catch (error) { return mapConstraint(error); }
}

export async function renameCollegeDepartment(
  context: RequestContext, idRaw: unknown, raw: unknown,
) {
  const id = collegeDepartmentIdSchema.parse(idRaw);
  const input = collegeDepartmentRenameSchema.parse(raw);
  const member = await own(context);
  try {
    return await getDb().transaction(async tx => {
      await liveCollege(tx, member.collegeId, member.organizationId);
      const current = await lockDepartment(tx, id, member.collegeId);
      await ensureUnique(tx, member.collegeId, input.name, id);
      if (current.name === input.name) return current;
      const [updated] = await tx.update(departments).set({
        name: input.name, updatedAt: new Date(),
      }).where(and(eq(departments.id, id), isNull(departments.archivedAt)))
        .returning();
      if (!updated) throw new CollegeDepartmentMutationError("DEPARTMENT_NOT_FOUND");
      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.ACADEMICS_DEPARTMENT_UPDATED,
        collegeId: member.collegeId, organizationId: member.organizationId,
        subjectType: "department", subjectId: updated.id,
        subjectLabel: updated.name, summary: "College department renamed",
        metadata: { action: "DEPARTMENT_RENAME", fromName: current.name, toName: updated.name },
      });
      return updated;
    });
  } catch (error) { return mapConstraint(error); }
}

export async function archiveCollegeDepartment(
  context: RequestContext, idRaw: unknown, raw: unknown,
) {
  const id = collegeDepartmentIdSchema.parse(idRaw);
  collegeDepartmentArchiveSchema.parse(raw);
  const member = await own(context);
  try{return await getDb().transaction(async tx => {
    await liveCollege(tx, member.collegeId, member.organizationId);
    const current = await lockDepartment(tx, id, member.collegeId);
    // All historical programs/courses and profile references block archival;
    // active-only checks can hide dependencies after a child is archived.
    const [p, c, f] = await Promise.all([
      tx.select({ total: count() }).from(programs).where(eq(programs.departmentId, id)),
      tx.select({ total: count() }).from(courses).where(eq(courses.departmentId, id)),
      tx.select({ total: count() }).from(facultyProfiles)
        .where(eq(facultyProfiles.primaryDepartmentId, id)),
    ]);
    const usage = {
      programs: p[0]?.total ?? 0, courses: c[0]?.total ?? 0, faculty: f[0]?.total ?? 0,
    };
    if (!canArchiveCollegeDepartment(usage))
      throw new CollegeDepartmentMutationError("DEPARTMENT_HAS_DEPENDENCIES", usage);
    const now = new Date();
    const [archived] = await tx.update(departments).set({
      archivedAt: now, updatedAt: now,
    }).where(and(eq(departments.id, id), isNull(departments.archivedAt)))
      .returning();
    if (!archived) throw new CollegeDepartmentMutationError("DEPARTMENT_NOT_FOUND");
    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.ACADEMICS_DEPARTMENT_ARCHIVED,
      collegeId: member.collegeId, organizationId: member.organizationId,
      subjectType: "department", subjectId: archived.id,
      subjectLabel: archived.name, summary: "College department archived",
      metadata: { action: "DEPARTMENT_ARCHIVE", legacyAction:"DEPARTMENT_DELETE",
        previousName:current.name,usage,legacyDepartmentId:archived.legacyDepartmentId,
        retentionPolicy:"SOFT_ARCHIVE",hiddenFromActiveDirectories:true,
        version:"ACTING_COLLEGE_MEMBERSHIP_VNEXT"},
    });
    return {...archived,retentionPolicy:"SOFT_ARCHIVE" as const,
      hiddenFromActiveDirectories:true as const};
  });}catch(error){return mapConstraint(error);}
}
