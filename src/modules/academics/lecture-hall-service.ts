import { and, asc, eq, gt, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  colleges,
  departments,
  lectureHalls,
  sectionScheduleEvents,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";

/**
 * Lecture halls (rooms) of a college. Managed by College Admin and scoped
 * Super Admin (`academics.manage`). The college always comes from the stored
 * row for an existing hall, never from the request.
 */

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

const nameSchema = z.string().trim().min(1, "Name is required").max(255);
const descriptionSchema = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    const trimmed = typeof value === "string" ? value.trim() : value;
    return trimmed === "" || trimmed === undefined ? null : trimmed;
  })
  .pipe(z.string().max(255).nullable());

const hallFields = {
  name: nameSchema,
  capacity: z.coerce.number().int().min(1).max(5000),
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
      .pipe(z.string().max(255).nullable().optional()),
    departmentId: hallFields.departmentId,
    status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Nothing to update");

export const listLectureHallsSchema = z.object({
  collegeId: z.string().uuid(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
  roomType: z.enum(ROOM_TYPES).optional(),
  departmentId: z.string().uuid().optional(),
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
) {
  requirePermission(context, "academics.manage", {
    organizationId: college.organizationId,
    collegeId: college.id,
  });
}

async function assertDepartmentInCollege(
  collegeId: string,
  departmentId: string | null | undefined,
) {
  if (!departmentId) return;
  const [row] = await getDb()
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
  authorize(context, college);

  const filters = [
    eq(lectureHalls.collegeId, college.id),
    ...(query.status ? [eq(lectureHalls.status, query.status)] : []),
    ...(query.roomType ? [eq(lectureHalls.roomType, query.roomType)] : []),
    ...(query.departmentId
      ? [eq(lectureHalls.departmentId, query.departmentId)]
      : []),
  ];

  const db = getDb();
  const [items, totals] = await Promise.all([
    db
      .select({
        id: lectureHalls.id,
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
        asc(sql`case ${lectureHalls.status} when 'ACTIVE' then 0 else 1 end`),
        asc(sql`lower(${lectureHalls.name})`),
      )
      .limit(query.limit)
      .offset(query.offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(lectureHalls)
      .where(and(...filters)),
  ]);

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

export async function createLectureHall(
  context: RequestContext,
  rawInput: unknown,
) {
  const input = createLectureHallSchema.parse(rawInput);
  const college = await loadCollege(input.collegeId);
  authorize(context, college);
  await assertDepartmentInCollege(college.id, input.departmentId);

  try {
    const [created] = await getDb()
      .insert(lectureHalls)
      .values({
        collegeId: college.id,
        name: input.name,
        capacity: input.capacity,
        roomType: input.roomType,
        description: input.description,
        departmentId: input.departmentId ?? null,
      })
      .returning();
    return created!;
  } catch (error) {
    if (isUniqueViolation(error)) throw new LectureHallError("HALL_NAME_TAKEN");
    throw error;
  }
}

async function loadHall(hallId: string) {
  const [hall] = await getDb()
    .select()
    .from(lectureHalls)
    .where(eq(lectureHalls.id, hallId))
    .limit(1);
  if (!hall) throw new LectureHallError("HALL_NOT_FOUND");
  return hall;
}

export async function updateLectureHall(
  context: RequestContext,
  hallIdInput: string,
  rawInput: unknown,
) {
  const hallId = z.string().uuid().parse(hallIdInput);
  const input = updateLectureHallSchema.parse(rawInput);
  const hall = await loadHall(hallId);
  const college = await loadCollege(hall.collegeId);
  authorize(context, college);

  if (input.departmentId !== undefined) {
    await assertDepartmentInCollege(college.id, input.departmentId);
  }

  // An archived hall must not have upcoming classes in it.
  if (input.status === "ARCHIVED" && hall.status !== "ARCHIVED") {
    const [row] = await getDb()
      .select({ n: sql<number>`count(*)::int` })
      .from(sectionScheduleEvents)
      .where(
        and(
          eq(sectionScheduleEvents.lectureHallId, hall.id),
          eq(sectionScheduleEvents.status, "SCHEDULED"),
          gt(sectionScheduleEvents.endsAt, new Date()),
        ),
      );
    if ((row?.n ?? 0) > 0) {
      throw new LectureHallError("HALL_IN_USE", { upcomingClasses: row.n });
    }
  }

  const { departmentId, ...rest } = input;
  try {
    const [updated] = await getDb()
      .update(lectureHalls)
      .set({
        ...rest,
        ...(departmentId !== undefined ? { departmentId } : {}),
        updatedAt: new Date(),
      })
      .where(eq(lectureHalls.id, hall.id))
      .returning();
    return updated!;
  } catch (error) {
    if (isUniqueViolation(error)) throw new LectureHallError("HALL_NAME_TAKEN");
    throw error;
  }
}
