import { z } from "zod";

export const collegeIdSchema = z.string().uuid();
export const departmentIdSchema = z.string().uuid();
export const programIdSchema = z.string().uuid();
export const academicPeriodIdSchema = z.string().uuid();
export const cohortIdSchema = z.string().uuid();
export const sectionIdSchema = z.string().uuid();

export const academicNameSchema = z
  .string()
  .trim()
  .min(1, "Enter a name")
  .max(255, "Maximum 255 characters");

export const academicCodeSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(
    /^[A-Za-z0-9][A-Za-z0-9._-]*$/,
    "Code may contain letters, numbers, dots, underscores and hyphens",
  );

export const academicDateSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Date must use YYYY-MM-DD",
  )
  .refine(
    (value) =>
      !Number.isNaN(
        Date.parse(`${value}T00:00:00Z`),
      ),
    "Date is invalid",
  );

// Legacy program duration: at most ten academic years, 20 two-term semesters.
const programDurationTermsSchema = z.number().int().min(1).max(20);
const programDurationYearsSchema = z.number().int().min(1, "Duration must be between 1 and 10 years").max(10, "Duration must be between 1 and 10 years");

function validateProgramDuration(
  value: {
    durationTerms?: number | undefined;
    durationYears?: number | undefined;
  },
  ctx: z.RefinementCtx,
  required: boolean,
) {
  if (
    required &&
    value.durationTerms === undefined &&
    value.durationYears === undefined
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["durationYears"],
      message: "Program duration is required",
    });
    return;
  }

  if (
    value.durationTerms !== undefined &&
    value.durationYears !== undefined &&
    value.durationTerms !== value.durationYears * 2
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["durationYears"],
      message:
        "durationYears must match durationTerms using two academic terms per year",
    });
  }
}

export const createProgramInputSchema = z
  .object({
    departmentId: departmentIdSchema,
    name: academicNameSchema,
    code: academicCodeSchema,
    durationTerms: programDurationTermsSchema.optional(),
    durationYears: programDurationYearsSchema.optional(),
  })
  .superRefine((value, ctx) =>
    validateProgramDuration(value, ctx, true),
  );

export const updateProgramInputSchema = z
  .object({
    departmentId: departmentIdSchema.optional(),
    name: academicNameSchema.optional(),
    code: academicCodeSchema.optional(),
    durationTerms: programDurationTermsSchema.optional(),
    durationYears: programDurationYearsSchema.optional(),
  })
  .refine(
    (value) =>
      value.departmentId !== undefined ||
      value.name !== undefined ||
      value.code !== undefined ||
      value.durationTerms !== undefined ||
      value.durationYears !== undefined,
    "At least one program field is required",
  )
  .superRefine((value, ctx) =>
    validateProgramDuration(value, ctx, false),
  );

export const createAcademicPeriodInputSchema = z
  .object({
    collegeId: collegeIdSchema,
    name: academicNameSchema,
    code: academicCodeSchema,
    startDate: academicDateSchema,
    endDate: academicDateSchema,
  })
  .refine(
    (value) => value.endDate >= value.startDate,
    {
      message:
        "Academic period end date must not precede start date",
      path: ["endDate"],
    },
  );

export const updateAcademicPeriodInputSchema = z
  .object({
    name: academicNameSchema.optional(),
    code: academicCodeSchema.optional(),
    startDate: academicDateSchema.optional(),
    endDate: academicDateSchema.optional(),
  })
  .refine(
    (value) =>
      Object.values(value).some(
        (item) => item !== undefined,
      ),
    "At least one academic period field is required",
  );

export const academicPeriodTransitionSchema = z.object({
  action: z.enum(["ACTIVATE", "CLOSE"]),
});

export const createCohortInputSchema = z.object({
  programId: programIdSchema,
  name: academicNameSchema,
  code: academicCodeSchema,
  startPeriodId: academicPeriodIdSchema,
  expectedEndPeriodId:
    academicPeriodIdSchema.nullable().optional(),
});

export const updateCohortInputSchema = z
  .object({
    name: academicNameSchema.optional(),
    code: academicCodeSchema.optional(),
    expectedEndPeriodId:
      academicPeriodIdSchema.nullable().optional(),
  })
  .refine(
    (value) =>
      Object.values(value).some(
        (item) => item !== undefined,
      ),
    "At least one cohort field is required",
  );

export const cohortTransitionSchema = z.object({
  action: z.enum([
    "ACTIVATE",
    "COMPLETE",
    "ARCHIVE",
  ]),
});

export const createSectionInputSchema = z.object({
  cohortId: cohortIdSchema,
  academicPeriodId: academicPeriodIdSchema,
  name: academicNameSchema,
  code: academicCodeSchema,
  capacity: z
    .number()
    .int()
    .positive()
    .max(200, "Maximum must be a whole number from 1 to 200")
    .nullable()
    .optional(),
});

export const updateSectionInputSchema = z
  .object({
    name: academicNameSchema.optional(),
    code: academicCodeSchema.optional(),
    capacity: z
      .number()
      .int()
      .positive()
      .max(200, "Maximum must be a whole number from 1 to 200")
      .nullable()
      .optional(),
  })
  .refine(
    (value) =>
      Object.values(value).some(
        (item) => item !== undefined,
      ),
    "At least one section field is required",
  );

export const membershipIdSchema = z.string().uuid();
export const learnerEnrollmentIdSchema =
  z.string().uuid();
export const sectionEnrollmentIdSchema =
  z.string().uuid();
export const facultyAssignmentIdSchema =
  z.string().uuid();
export const scheduleEventIdSchema =
  z.string().uuid();

export const createLearnerProgramEnrollmentInputSchema =
  z.object({
    membershipId: membershipIdSchema,
    programId: programIdSchema,
    cohortId: cohortIdSchema,
  });

export const learnerProgramEnrollmentTransitionSchema =
  z.object({
    action: z.enum(["COMPLETE", "WITHDRAW"]),
  });

export const assignLearnerSectionInputSchema =
  z.object({
    learnerEnrollmentId:
      learnerEnrollmentIdSchema,
    sectionId: sectionIdSchema,
  });

export const sectionEnrollmentTransitionSchema =
  z.object({
    action: z.enum(["COMPLETE", "WITHDRAW"]),
  });

export const createSectionFacultyAssignmentInputSchema =
  z.object({
    sectionId: sectionIdSchema,
    membershipId: membershipIdSchema,
    role: z.enum([
      "ADVISOR",
      "COORDINATOR",
    ]),
  });

export const scheduleDateTimeSchema = z
  .string()
  .datetime({ offset: true });

export const createSectionScheduleEventInputSchema =
  z
    .object({
      sectionId: sectionIdSchema,
      facultyMembershipId:
        membershipIdSchema.nullable().optional(),
      deliveryId: z.string().uuid().nullable().optional(),
      lectureHallId: z.string().uuid().nullable().optional(),
      title: academicNameSchema,
      description: z
        .string()
        .trim()
        .max(4000)
        .nullable()
        .optional(),
      startsAt: scheduleDateTimeSchema,
      endsAt: scheduleDateTimeSchema,
      location: z
        .string()
        .trim()
        .max(500)
        .nullable()
        .optional(),
    })
    .refine(
      (value) =>
        new Date(value.endsAt).getTime() >
        new Date(value.startsAt).getTime(),
      {
        message:
          "Schedule event end time must be after start time",
        path: ["endsAt"],
      },
    );

/**
 * Old ClassScheduleDTO uses snake_case integer IDs and unzoned local start/end
 * strings. This is a compatibility bridge, NOT a permission or FK resolver:
 * callers must supply explicit mappings from the authorized college. Missing
 * course/faculty/hall IDs are rejected, never silently treated as unlinked.
 */
export const legacyClassScheduleSourceSchema = z.object({
  classId: z.number().int().positive("classId must be a positive number"),
  facultyId: z.number().int().positive("facultyId must be a positive number"),
  courseId: z.number().int().nonnegative().default(0),
  courseSlug: z.string().trim().max(160).nullish(),
  lectureHallId: z.number().int().nonnegative().default(0),
  title: z.string().trim().max(160).nullish(),
  startTime: z.string().trim().min(1, "startTime is required"),
  endTime: z.string().trim().min(1, "endTime is required"),
}).strict();

function legacyClassScheduleInstant(value: string): string {
  // Legacy local datetimes were entered and displayed in the LMS IST zone.
  const normalized = value.trim().replace(" ", "T");
  const iso = /(?:Z|[+-]\d{2}:\d{2})$/i.test(normalized)
    ? normalized : normalized + "+05:30";
  return scheduleDateTimeSchema.parse(iso);
}

export function adaptLegacyClassScheduleCreate(
  raw: unknown,
  mapping: {
    sectionIds: ReadonlyMap<number, string>;
    facultyMembershipIds: ReadonlyMap<number, string>;
    deliveryIdsByLegacyCourseId: ReadonlyMap<number, string>;
    deliveryIdsByCourseSlug: ReadonlyMap<string, string>;
    lectureHallIds: ReadonlyMap<number, string>;
  },
) {
  const fields = z.record(z.string(), z.unknown()).parse(raw);
  const value = (camel: string, snake: string) => {
    if (camel in fields && snake in fields && fields[camel] !== fields[snake])
      throw new Error("LEGACY_SCHEDULE_FIELD_CONFLICT");
    return fields[snake] ?? fields[camel];
  };
  const source = legacyClassScheduleSourceSchema.parse({
    classId: value("classId", "class_id"),
    facultyId: value("facultyId", "faculty_id"),
    courseId: value("courseId", "course_id"),
    courseSlug: value("courseSlug", "course_slug"),
    lectureHallId: value("lectureHallId", "lecture_hall_id"),
    title: value("title", "title"),
    startTime: value("startTime", "start_time"),
    endTime: value("endTime", "end_time"),
  });
  const sectionId = mapping.sectionIds.get(source.classId);
  const facultyMembershipId = mapping.facultyMembershipIds.get(source.facultyId);
  if (!sectionId || !facultyMembershipId)
    throw new Error("LEGACY_SCHEDULE_MEMBER_OR_SECTION_UNMAPPED");
  const slug = source.courseSlug?.trim();
  const deliveryId = slug
    ? mapping.deliveryIdsByCourseSlug.get(slug)
    : source.courseId > 0
      ? mapping.deliveryIdsByLegacyCourseId.get(source.courseId)
      : null;
  if ((slug || source.courseId > 0) && !deliveryId)
    throw new Error("LEGACY_SCHEDULE_DELIVERY_UNMAPPED");
  const lectureHallId = source.lectureHallId > 0
    ? mapping.lectureHallIds.get(source.lectureHallId) : null;
  if (source.lectureHallId > 0 && !lectureHallId)
    throw new Error("LEGACY_SCHEDULE_HALL_UNMAPPED");
  return createSectionScheduleEventInputSchema.parse({
    sectionId: z.uuid().parse(sectionId),
    facultyMembershipId: z.uuid().parse(facultyMembershipId),
    deliveryId: deliveryId ? z.uuid().parse(deliveryId) : null,
    lectureHallId: lectureHallId ? z.uuid().parse(lectureHallId) : null,
    title: source.title || "Class schedule",
    startsAt: legacyClassScheduleInstant(source.startTime),
    endsAt: legacyClassScheduleInstant(source.endTime),
  });
}

export const updateSectionScheduleEventInputSchema =
  z
    .object({
      facultyMembershipId:
        membershipIdSchema.nullable().optional(),
      deliveryId: z.string().uuid().nullable().optional(),
      lectureHallId: z.string().uuid().nullable().optional(),
      title: academicNameSchema.optional(),
      description: z
        .string()
        .trim()
        .max(4000)
        .nullable()
        .optional(),
      startsAt: scheduleDateTimeSchema.optional(),
      endsAt: scheduleDateTimeSchema.optional(),
      location: z
        .string()
        .trim()
        .max(500)
        .nullable()
        .optional(),
    })
    .refine(
      (value) =>
        Object.values(value).some(
          (item) => item !== undefined,
        ),
      "At least one schedule field is required",
    );

export const scheduleEventTransitionSchema =
  z.object({
    action: z.literal("CANCEL"),
  });

export type CreateProgramInput = z.infer<
  typeof createProgramInputSchema
>;
export type UpdateProgramInput = z.infer<
  typeof updateProgramInputSchema
>;
export type CreateAcademicPeriodInput = z.infer<
  typeof createAcademicPeriodInputSchema
>;
export type UpdateAcademicPeriodInput = z.infer<
  typeof updateAcademicPeriodInputSchema
>;
export type CreateCohortInput = z.infer<
  typeof createCohortInputSchema
>;
export type UpdateCohortInput = z.infer<
  typeof updateCohortInputSchema
>;
export type CreateSectionInput = z.infer<
  typeof createSectionInputSchema
>;
export type UpdateSectionInput = z.infer<
  typeof updateSectionInputSchema
>;
export type CreateLearnerProgramEnrollmentInput =
  z.infer<
    typeof createLearnerProgramEnrollmentInputSchema
  >;
export type AssignLearnerSectionInput = z.infer<
  typeof assignLearnerSectionInputSchema
>;
export type CreateSectionFacultyAssignmentInput =
  z.infer<
    typeof createSectionFacultyAssignmentInputSchema
  >;
export type CreateSectionScheduleEventInput =
  z.infer<
    typeof createSectionScheduleEventInputSchema
  >;
export type UpdateSectionScheduleEventInput =
  z.infer<
    typeof updateSectionScheduleEventInputSchema
  >;

/** The old backend supplied numeric dept_id and optional program codes.
 * This adapter deliberately requires an authorized college-scoped FK lookup;
 * a dangling/foreign legacy department never gets a guessed UUID.
 */
export const legacyProgramImportInputSchema=z.object({
  id:z.number().int().positive(),
  dept_id:z.number().int().positive(),
  name:z.string().trim().min(1).max(255),
  code:z.string().trim().max(64).nullable().optional(),
  duration_years:z.number().int().min(1).max(10),
}).strict();

export function translateLegacyProgramImport(
  raw:unknown,
  mapped:{legacyDepartmentId:number;departmentId:string},
){
  const source=legacyProgramImportInputSchema.parse(raw);
  if(source.dept_id!==mapped.legacyDepartmentId)
    throw new z.ZodError([{code:"custom",path:["dept_id"],
      message:"Legacy department has no mapping in the selected college"}]);
  const proposedCode=source.code?.trim()||
    "PROG-"+String(source.id);
  return createProgramInputSchema.parse({
    departmentId:departmentIdSchema.parse(mapped.departmentId),
    name:source.name,code:proposedCode,
    durationYears:source.duration_years,durationTerms:source.duration_years*2,
  });
}
