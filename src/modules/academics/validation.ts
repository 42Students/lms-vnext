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
  .min(1)
  .max(255);

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

const programDurationTermsSchema = z.number().int().min(1).max(24);
const programDurationYearsSchema = z.number().int().min(1).max(10);

function validateProgramDuration(
  value: {
    durationTerms?: number;
    durationYears?: number;
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
    .max(10000)
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
      .max(10000)
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
