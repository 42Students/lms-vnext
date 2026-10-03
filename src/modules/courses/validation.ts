import { z } from "zod";
import {
  COURSE_OFFERING_TYPES,
  COURSE_TEACHING_ROLES,
} from "./constants";

export const courseIdSchema = z.string().uuid();
export const courseOfferingIdSchema =
  z.string().uuid();
export const courseSectionDeliveryIdSchema =
  z.string().uuid();
export const courseTeachingAssignmentIdSchema =
  z.string().uuid();

const courseNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(255);

const courseCodeSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(
    /^[A-Za-z0-9][A-Za-z0-9._-]*$/,
    "Code may contain letters, numbers, dots, underscores and hyphens",
  );

export const createCourseInputSchema = z.object({
  departmentId: z.string().uuid(),
  name: courseNameSchema,
  code: courseCodeSchema,
  description: z
    .string()
    .trim()
    .max(5000)
    .nullable()
    .optional(),
});

export const updateCourseInputSchema = z
  .object({
    name: courseNameSchema.optional(),
    code: courseCodeSchema.optional(),
    description: z
      .string()
      .trim()
      .max(5000)
      .nullable()
      .optional(),
  })
  .refine(
    (value) =>
      Object.values(value).some(
        (item) => item !== undefined,
      ),
    "At least one course field is required",
  );

export const createCourseOfferingInputSchema =
  z.object({
    courseId: courseIdSchema,
    cohortId: z.string().uuid(),
    academicPeriodId: z.string().uuid(),
    type: z.enum(COURSE_OFFERING_TYPES),
    credits: z
      .number()
      .int()
      .min(1)
      .max(30)
      .nullable()
      .optional(),
    displayOrder: z
      .number()
      .int()
      .min(0)
      .max(10000)
      .optional()
      .default(0),
  });

export const updateCourseOfferingInputSchema =
  z
    .object({
      type: z
        .enum(COURSE_OFFERING_TYPES)
        .optional(),
      credits: z
        .number()
        .int()
        .min(1)
        .max(30)
        .nullable()
        .optional(),
      displayOrder: z
        .number()
        .int()
        .min(0)
        .max(10000)
        .optional(),
    })
    .refine(
      (value) =>
        Object.values(value).some(
          (item) => item !== undefined,
        ),
      "At least one offering field is required",
    );

export const createCourseSectionDeliveryInputSchema =
  z.object({
    offeringId: courseOfferingIdSchema,
    sectionId: z.string().uuid(),
  });

export const createCourseTeachingAssignmentInputSchema =
  z.object({
    deliveryId:
      courseSectionDeliveryIdSchema,
    membershipId: z.string().uuid(),
    role: z.enum(COURSE_TEACHING_ROLES),
  });

export type CreateCourseInput = z.infer<
  typeof createCourseInputSchema
>;
export type UpdateCourseInput = z.infer<
  typeof updateCourseInputSchema
>;
export type CreateCourseOfferingInput =
  z.infer<
    typeof createCourseOfferingInputSchema
  >;
export type UpdateCourseOfferingInput =
  z.infer<
    typeof updateCourseOfferingInputSchema
  >;
export type CreateCourseSectionDeliveryInput =
  z.infer<
    typeof createCourseSectionDeliveryInputSchema
  >;
export type CreateCourseTeachingAssignmentInput =
  z.infer<
    typeof createCourseTeachingAssignmentInputSchema
  >;
