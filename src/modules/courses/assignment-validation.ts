import {assignmentMethodsSchema} from "./assignment-submission-methods";
import { z } from "zod";
import {
  ASSIGNMENT_SUBMISSION_TYPES,
} from "./constants";
import {
  courseLessonIdSchema,
  courseSectionDeliveryIdSchema,
} from "./validation";
import {
  assignmentFileSubmissionSchema,
} from "./assignment-file-validation";

export const courseAssignmentIdSchema =
  z.string().uuid();
export const assignmentSubmissionIdSchema =
  z.string().uuid();

const assignmentTitleSchema = z
  .string()
  .trim()
  .min(1)
  .max(255);

const assignmentDescriptionSchema = z
  .string()
  .trim()
  .max(10000);

const dateTimeSchema = z
  .string()
  .datetime({ offset: true });

export const createCourseAssignmentInputSchema =
  z.object({
    lessonId: courseLessonIdSchema,
    deliveryId:
      courseSectionDeliveryIdSchema
        .nullable()
        .optional(),
    title: assignmentTitleSchema,
    description:
      assignmentDescriptionSchema
        .nullable()
        .optional(),
    dueAt: dateTimeSchema
      .nullable()
      .optional(),
    allowedMethods:assignmentMethodsSchema.optional(),
    maxPoints: z
      .number()
      .int()
      .min(0)
      .max(10000),
    sequence: z
      .number()
      .int()
      .min(0)
      .max(10000),
  });

export const updateCourseAssignmentInputSchema =
  z
    .object({
      expectedUpdatedAt: z.iso.datetime({offset:true}).optional(),
      confirmed: z.literal(true).optional(),
      title:
        assignmentTitleSchema.optional(),
      description:
        assignmentDescriptionSchema
          .nullable()
          .optional(),
      dueAt: dateTimeSchema
        .nullable()
        .optional(),
      allowedMethods:assignmentMethodsSchema.optional(),
      maxPoints: z
        .number()
        .int()
        .min(0)
        .max(10000)
        .optional(),
      sequence: z
        .number()
        .int()
        .min(0)
        .max(10000)
        .optional(),
    })
    .refine(
      (value) =>
        Object.entries(value).some(
          ([key,item]) => key !== "expectedUpdatedAt" && key !== "confirmed" && item !== undefined,
        ),
      "At least one assignment field is required",
    );

export const assignmentTransitionSchema =
  z.object({
    expectedUpdatedAt: z.iso.datetime({offset:true}).optional(),
    confirmed: z.literal(true).optional(),
    action: z.enum([
      "PUBLISH",
      "ARCHIVE",
    ]),
  });

const textSubmissionSchema = z.object({
  deliveryId: courseSectionDeliveryIdSchema,
  submissionType: z.literal("TEXT"),
  textContent: z
    .string()
    .trim()
    .min(1)
    .max(50000),
});

const linkSubmissionSchema = z.object({
  deliveryId: courseSectionDeliveryIdSchema,
  submissionType: z.literal("LINK"),
  linkKind:z.enum(["REPOSITORY_LINK","EXTERNAL_LINK"]).optional(),
  submissionUrl: z
    .string()
    .trim()
    .max(2048)
    .url()
    .refine(
      (value) =>
        new URL(value).protocol === "https:" &&
        !new URL(value).username && !new URL(value).password,
      "Only credential-free https submission links are allowed",
    ),
});

export const submitAssignmentInputSchema =
  z.discriminatedUnion(
    "submissionType",
    [
      textSubmissionSchema,
      linkSubmissionSchema,
      assignmentFileSubmissionSchema,
    ],
  );

export const assignmentSubmissionTypeSchema =
  z.enum(ASSIGNMENT_SUBMISSION_TYPES);

export const gradeAssignmentSubmissionInputSchema =
  z.object({
    pointsAwarded: z
      .number()
      .int()
      .min(0)
      .max(10000),
    feedback: z
      .string()
      .trim()
      .max(10000)
      .nullable()
      .optional(),
    expectedVersion: z
      .number()
      .int()
      .min(0),
  }).strict();

export const publishAssignmentGradeInputSchema =
  z.object({
    expectedVersion: z
      .number()
      .int()
      .min(0),
  }).strict();

export type CreateCourseAssignmentInput =
  z.infer<
    typeof createCourseAssignmentInputSchema
  >;
export type UpdateCourseAssignmentInput =
  z.infer<
    typeof updateCourseAssignmentInputSchema
  >;
export type SubmitAssignmentInput =
  z.infer<
    typeof submitAssignmentInputSchema
  >;
export type GradeAssignmentSubmissionInput =
  z.infer<
    typeof gradeAssignmentSubmissionInputSchema
  >;
