import { and, asc, eq, gt, gte, ilike, isNull, lte, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  colleges,
  departments,
  lectureHalls,
  sectionScheduleEvents,
  sections,
} from "@/db/schema";
import { isSuperAdmin, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { lectureHallScheduledConflict } from "./lecture-hall-conflict-model";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";

/**
 * Lecture halls (rooms) of a college. Managed by College Admin and scoped
 * Super Admin (`academics.manage`). The college always comes from the stored
 * row for an existing hall, never from the request.
 *
 * Legacy migration contract (not a data import): old integer hall/college/dept IDs
 * are NOT interchangeable with vNext UUIDs. A legacy deptId=0 means the nullable
 * vNext departmentId; old rooms had no status and are ACTIVE if explicitly
 * recreated/imported. Existing scheduled history must keep the new hall UUID.
 * This installation has no legacy data migration requirement.
 *
 * Lifecycle deliberately differs from legacy DELETE: ARCHIVED retains the
 * row, its booking references and the ability to restore; active/upcoming
 * scheduled events still block archival. Past bookings do not block archival
 * because their historical foreign keys remain intact, unlike physical DELETE.
 */

/** Tenant-scoped hall ID lookup, never a guessed client college override. */
export async function getLectureHallDetail(ctx:RequestContext,rawId:unknown){
 const hallId=z.string().uuid().parse(rawId);
 const [hall]=await getDb().select().from(lectureHalls).where(eq(lectureHalls.id,hallId)).limit(1);
 if(!hall)throw new LectureHallError("HALL_NOT_FOUND");
 const college = await loadCollege(hall.collegeId);
 authorize(ctx, college, "academics.read");
 return hall;
}
export const ROOM_TYPES = [
  "CLASSROOM",
  "LECTURE_HALL",
  "LAB",
  "SEMINAR_HALL",
  "AUDITORIUM",
  "CONFERENCE_ROOM",
] as const;
export type RoomType = (typeof ROOM_TYPES)[number];

export type LectureHallErrorCode =
  | "COLLEGE_NOT_FOUND"
  | "HALL_NOT_FOUND"
  | "HALL_NAME_TAKEN"
  | "HALL_IN_USE"
  | "HALL_CAPACITY_CONFLICT"
  | "DEPARTMENT_NOT_FOUND";

export class LectureHallError extends Error {
  constructor(
    public readonly code: LectureHallErrorCode,
    public readonly detail?: { upcomingClasses?: number },
  ) {
    super(code);
    this.name = "LectureHallError";
  }
}

// The old backend says "Room name is required"; the old form uses
// "Please enter room name". The shared client already shows the form copy.
const nameSchema = z.string().trim()
  .min(1, "Room name is required")
  .max(255, "Room name must be 255 characters or less");
const descriptionSchema = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    const trimmed = typeof value === "string" ? value.trim() : value;
    return trimmed === "" || trimmed === undefined ? null : trimmed;
  })
  // The vNext column is varchar(255); reject excessive text rather than
  // silently truncating a legacy unlimited description.
  .pipe(z.string().max(255, "Description cannot exceed 255 characters").nullable());

const hallFields = {
  name: nameSchema,
  // Old LMS admin form caps edits at 1000 seats; its old backend accepted 5000.
  // Enforce the visible admin contract server-side too. Historical 1001–5000
  // seat rooms remain readable/filterable; changing their capacity requires
  // choosing a newly supported value.
  capacity: z.coerce.number().int()
    .min(1, "Capacity must be at least 1")
    .max(1000, "Capacity must be 1000 or less").default(50),
  roomType: z.enum(ROOM_TYPES),
  description: descriptionSchema,
  departmentId: z.union([z.string().uuid(), z.null()]).optional(),
};

export const createLectureHallSchema = z
  .object({ collegeId: z.string().uuid(), ...hallFields })
  .strict();

export const updateLectureHallSchema = z
  .object({
    name: hallFields.name.optional(),
    capacity: hallFields.capacity.optional(),
    roomType: hallFields.roomType.optional(),
    description: z
      .union([z.string(), z.null()])
      .optional()
      .transform((value) => {
        if (value === undefined) return undefined;
        const trimmed = typeof value === "string" ? value.trim() : value;
        return trimmed === "" ? null : trimmed;
      })
      .pipe(z.string().max(255, "Description cannot exceed 255 characters").nullable().optional()),
    departmentId: hallFields.departmentId,
    status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Nothing to update");

// Missing college scope is a validation error, never a signal to query other
// colleges. Global SA / organization-wide discovery would need an approved
// read-only endpoint and explicit role gate outside this mutation service.
export const listLectureHallsSchema = z.object({
  collegeId: z.string().uuid("Select a college to continue"),
  id:z.string().uuid().optional(),
  q: z.string().trim().max(100).optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
  roomType: z.enum(ROOM_TYPES).optional(),
  departmentId: z.string().uuid().optional(),
  minimumCapacity: z.coerce.number().int().min(1).max(5000).optional(),
  maximumCapacity: z.coerce.number().int().min(1).max(5000).optional(),
  upcoming: z.enum(["YES","NO"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

async function loadCollege(collegeId: string) {
  const [college] = await getDb()
    .select({
      id: colleges.id,
      name: colleges.name,
      organizationId: colleges.organizationId,
      status: colleges.status,
    })
    .from(colleges)
    .where(eq(colleges.id, collegeId))
    .limit(1);

  if (!college || college.status !== "ACTIVE") {
    throw new LectureHallError("COLLEGE_NOT_FOUND");
  }
  return college;
}

function authorize(
  context: RequestContext,
  college: { id: string; organizationId: string },
  permission: "academics.manage" | "academics.read" = "academics.manage",
) {
  // Security correction to legacy precedence: department filter never overrides
  // the selected college. A global/organization-only Super Admin must explicitly
  // select a college via the workspace switcher; no unrestricted tenant scan.
  // A read-only global directory would require a distinct audited permission
  // and API, not bypassing this check for a caller-supplied collegeId.
  if (isSuperAdmin(context) && context.adminScope?.collegeId !== college.id) {
    throw new AuthorizationError(permission);
  }
  requirePermission(context, permission, {
    organizationId: college.organizationId,
    collegeId: college.id,
  });
}

type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

async function assertDepartmentInCollege(
  tx: Tx, collegeId: string,
  departmentId: string | null | undefined,
) {
  if (!departmentId) return;
  const [row] = await tx
    .select({ id: departments.id })
    .from(departments)
    .where(
      and(
        eq(departments.id, departmentId),
        eq(departments.collegeId, collegeId),
        isNull(departments.archivedAt),
      ),
    )
    .limit(1);
  if (!row) throw new LectureHallError("DEPARTMENT_NOT_FOUND");
}

function isUniqueViolation(error: unknown) {
  const code = (error as { code?: string; cause?: { code?: string } })?.code
    ?? (error as { cause?: { code?: string } })?.cause?.code;
  return code === "23505";
}

export async function listLectureHalls(
  context: RequestContext,
  rawQuery: unknown,
) {
  const query = listLectureHallsSchema.parse(rawQuery);
  const college = await loadCollege(query.collegeId);
  authorize(context, college, "academics.read");

  const scheduledFuture = sql<boolean>`exists (select 1 from ${sectionScheduleEvents} future where future.lecture_hall_id = ${lectureHalls.id} and future.status = 'SCHEDULED' and future.ends_at > now())`;
  // Match name and optional description after the college/department predicate.
  // Exact and prefix name matches sort above other substrings. This improves
  // relevance without an unapproved pg_trgm/fuzzystrmatch extension.
  // The legacy typo-distance=2 matcher is not available in this DB contract.
  const escapedSearch = query.q?.replace(/[\\%_]/g, "\\$&") ?? "";
  const containsSearch = escapedSearch ? "%" + escapedSearch + "%" : null;
  const prefixSearch = escapedSearch ? escapedSearch + "%" : null;
  const filters = [
    eq(lectureHalls.collegeId, college.id),
    ...(query.id?[eq(lectureHalls.id,query.id)]:[]),
    ...(containsSearch ? [or(
      ilike(lectureHalls.name, containsSearch),
      ilike(lectureHalls.description, containsSearch),
      ilike(lectureHalls.roomType, containsSearch),
      sql`replace(${lectureHalls.roomType}, '_', ' ') ilike ${containsSearch}`,
    )!] : []),
    ...(query.status ? [eq(lectureHalls.status, query.status)] : []),
    ...(query.roomType ? [eq(lectureHalls.roomType, query.roomType)] : []),
    ...(query.minimumCapacity !== undefined ? [gte(lectureHalls.capacity, query.minimumCapacity)] : []),
    ...(query.maximumCapacity !== undefined ? [lte(lectureHalls.capacity, query.maximumCapacity)] : []),
    ...(query.upcoming === "YES" ? [scheduledFuture] : query.upcoming === "NO" ? [sql`not ${scheduledFuture}`] : []),
    ...(query.departmentId
      ? [eq(lectureHalls.departmentId, query.departmentId)]
      : []),
  ];

  const db = getDb();
  const [items, totals] = await Promise.all([
    db
      .select({
        id: lectureHalls.id,
        legacyLectureHallId: lectureHalls.legacyLectureHallId,
        legacyCollegeId: lectureHalls.legacyCollegeId,
        legacyDepartmentId: lectureHalls.legacyDepartmentId,
        legacyOriginalRoomType: lectureHalls.legacyOriginalRoomType,
        legacyOriginalCapacity: lectureHalls.legacyOriginalCapacity,
        legacyNameWasNull: lectureHalls.legacyNameWasNull,
        name: lectureHalls.name,
        capacity: lectureHalls.capacity,
        roomType: lectureHalls.roomType,
        description: lectureHalls.description,
        status: lectureHalls.status,
        departmentId: lectureHalls.departmentId,
        departmentName: departments.name,
        upcomingClasses: sql<number>`(
          select count(*)::int from section_schedule_events e
          where e.lecture_hall_id = "lecture_halls"."id"
            and e.status = 'SCHEDULED' and e.ends_at > now())`,
      })
      .from(lectureHalls)
      .leftJoin(departments, eq(departments.id, lectureHalls.departmentId))
      .where(and(...filters))
      .orderBy(
        ...(query.q && prefixSearch && containsSearch ? [
          asc(sql`case
            when lower(${lectureHalls.name}) = lower(${query.q}) then 0
            when ${lectureHalls.name} ilike ${prefixSearch} then 1
            when ${lectureHalls.name} ilike ${containsSearch} then 2
            else 3 end`),
        ] : []),
        asc(sql`case ${lectureHalls.status} when 'ACTIVE' then 0 else 1 end`),
        asc(sql`lower(${lectureHalls.name})`),
        asc(lectureHalls.id),
      )
      .limit(query.limit)
      .offset(query.offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(lectureHalls)
      .where(and(...filters)),
  ]);

  // This response is a paginated directory, not the old /stats endpoint.
  // Its pagination.total is the authoritative count; do not claim an
  // unimplemented global "Stats retrieved" API wrapper.
  return {
    collegeId: college.id,
    collegeName: college.name,
    items,
    pagination: {
      limit: query.limit,
      offset: query.offset,
      total: totals[0]?.total ?? 0,
    },
  };
}

export async function createLectureHall(context: RequestContext, rawInput: unknown) {
  const input = createLectureHallSchema.parse(rawInput);
  const college = await loadCollege(input.collegeId);
  authorize(context, college);
  try {
    return await getDb().transaction(async tx => {
      await assertDepartmentInCollege(tx, college.id, input.departmentId);
      const [created] = await tx.insert(lectureHalls).values({
        collegeId: college.id,
        name: input.name,
        capacity: input.capacity,
        roomType: input.roomType,
        description: input.description,
        departmentId: input.departmentId ?? null,
      }).returning();
      if (!created) throw new LectureHallError("HALL_NOT_FOUND");
      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.ACADEMICS_LECTURE_HALL_CREATED,
        collegeId: college.id, organizationId: college.organizationId,
        subjectType: "lecture_hall", subjectId: created.id,
        subjectLabel: created.name, summary: "Lecture hall created",
        metadata: { roomType: created.roomType, capacity: created.capacity,
          departmentId: created.departmentId },
      });
      return created;
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new LectureHallError("HALL_NAME_TAKEN");
    throw error;
  }
}

export async function updateLectureHall(
  context: RequestContext,
  hallIdInput: string,
  rawInput: unknown,
) {
  const hallId = z.string().uuid().parse(hallIdInput);
  const input = updateLectureHallSchema.parse(rawInput);
  try {
    return await getDb().transaction(async tx => {
      // Lock first: pending schedule inserts need a foreign-key lock on this room.
      // This prevents archive or capacity changes racing newly scheduled classes.
      const [hall] = await tx.select().from(lectureHalls)
        .where(eq(lectureHalls.id, hallId)).for("update").limit(1);
      if (!hall) throw new LectureHallError("HALL_NOT_FOUND");
      const college = await loadCollege(hall.collegeId);
      authorize(context, college);
      if (input.departmentId !== undefined) {
        await assertDepartmentInCollege(tx, college.id, input.departmentId);
      }

      if ((input.status === "ARCHIVED" && hall.status !== "ARCHIVED") ||
          (input.capacity !== undefined && input.capacity < hall.capacity)) {
        const busy = await tx.select({
          eventId: sectionScheduleEvents.id,
          classCapacity: sections.capacity,
        }).from(sectionScheduleEvents)
          .leftJoin(sections, eq(sections.id, sectionScheduleEvents.sectionId))
          .where(and(
            eq(sectionScheduleEvents.lectureHallId, hall.id),
            eq(sectionScheduleEvents.status, "SCHEDULED"),
            gt(sectionScheduleEvents.endsAt, new Date()),
          ));
        const conflict = lectureHallScheduledConflict({
          archiving: input.status === "ARCHIVED" && hall.status !== "ARCHIVED",
          nextCapacity: input.capacity,
          scheduledCapacityRows: busy.map(row => row.classCapacity),
        });
        if (conflict) {
          throw new LectureHallError(conflict, { upcomingClasses: busy.length });
        }
      }

      const { departmentId, ...rest } = input;
      const [updated] = await tx.update(lectureHalls).set({
        ...rest,
        ...(departmentId !== undefined ? { departmentId } : {}),
        updatedAt: new Date(),
      }).where(eq(lectureHalls.id, hall.id)).returning();
      if (!updated) throw new LectureHallError("HALL_NOT_FOUND");
      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.ACADEMICS_LECTURE_HALL_UPDATED,
        collegeId: college.id, organizationId: college.organizationId,
        subjectType: "lecture_hall", subjectId: updated.id,
        subjectLabel: updated.name,
        summary: updated.status === "ARCHIVED" ? "Lecture hall archived"
          : hall.status === "ARCHIVED" && updated.status === "ACTIVE" ? "Lecture hall restored"
          : "Lecture hall updated",
        metadata: {
          before: { name: hall.name, roomType: hall.roomType, capacity: hall.capacity,
            status: hall.status, departmentId: hall.departmentId },
          after: { name: updated.name, roomType: updated.roomType, capacity: updated.capacity,
            status: updated.status, departmentId: updated.departmentId },
        },
      });
      return updated;
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new LectureHallError("HALL_NAME_TAKEN");
    throw error;
  }
}
