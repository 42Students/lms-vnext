import { z } from "zod";
import {
  COURSE_OFFERING_TYPES,
  COURSE_TEACHING_ROLES,
  LESSON_CONTENT_TYPES,
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

const courseShortTitleSchema=z.string().trim().min(1).max(120);
const courseOfficialCodeSchema=z.string().trim().max(64).nullable();
const courseCardColorSchema=z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable();

export const createCourseInputSchema = z.object({
  departmentId: z.string().uuid(),
  name: courseNameSchema,
  code: courseCodeSchema,
  shortTitle:courseShortTitleSchema.optional(),
  officialCode:courseOfficialCodeSchema.optional(),
  cardColor:courseCardColorSchema.optional(),
  takeaways:z.string().trim().max(2000).nullable().optional(),
  description: z
    .string()
    .trim()
    .max(5000)
    .nullable()
    .optional(),
}).strict();

export const updateCourseInputSchema = z
  .object({
    // The version comes from the course row displayed in the editing form.
    expectedUpdatedAt: z.string().datetime({ offset: true }),
    name: courseNameSchema.optional(),
    code: courseCodeSchema.optional(),
    shortTitle:courseShortTitleSchema.optional(),
    officialCode:courseOfficialCodeSchema.optional(),
    cardColor:courseCardColorSchema.optional(),
    takeaways:z.string().trim().max(2000).nullable().optional(),
    description: z
      .string()
      .trim()
      .max(5000)
      .nullable()
      .optional(),
  }).strict()
  .refine(
    (value) =>
      Object.entries(value).some(
        ([key, item]) => key !== "expectedUpdatedAt" && item !== undefined,
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
  }).strict();

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
    }).strict()
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
  }).strict();

/** A stale browser must not silently overwrite another administrator's role edit. */
export const changeCourseTeachingAssignmentRoleInputSchema = z.object({
  role: z.enum(COURSE_TEACHING_ROLES),
  expectedUpdatedAt: z.string().datetime({offset:true}),
}).strict();
/** A single class may have several courses; batch writes must commit together. */
export const createCourseTeachingAssignmentsBatchInputSchema = z.object({
  deliveryIds: z.array(courseSectionDeliveryIdSchema).min(1).max(10)
    .refine(ids=>new Set(ids).size===ids.length,"Choose each course only once"),
  membershipId: z.string().uuid(),
  role: z.enum(COURSE_TEACHING_ROLES),
}).strict();

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

export const learningPathIdSchema =
  z.string().uuid();
export const courseLessonIdSchema =
  z.string().uuid();
export const lessonContentIdSchema =
  z.string().uuid();

const learningTextSchema = z
  .string()
  .trim()
  .min(1)
  .max(5000);

const optionalHttpsUrlSchema = z
  .string()
  .trim()
  .url()
  .refine(
    (value) => new URL(value).protocol === "https:",
    "Only https URLs are allowed",
  );

const storageKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(1024)
  .regex(
    /^[A-Za-z0-9][A-Za-z0-9/_.-]*$/,
    "Storage key contains unsupported characters",
  )
  .refine(
    (value) =>
      !value.split("/").includes(".."),
    "Storage key must not contain parent traversal",
  );

export const createLearningPathInputSchema =
  z.object({
    offeringId: courseOfferingIdSchema,
    title: courseNameSchema,
    description: z
      .string()
      .trim()
      .max(5000)
      .nullable()
      .optional(),
  });

export const updateLearningPathInputSchema =
  z
    .object({
      title: courseNameSchema.optional(),
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
      "At least one learning path field is required",
    );

export const learningPathTransitionSchema =
  z.object({
    action: z.enum(["PUBLISH", "UNPUBLISH", "ARCHIVE"]),
  }).strict();

export const createCourseLessonInputSchema =
  z.object({
    learningPathId: learningPathIdSchema,
    name: courseNameSchema,
    description: z
      .string()
      .trim()
      .max(5000)
      .nullable()
      .optional(),
    sequence: z
      .number()
      .int()
      .min(0)
      .max(10000),
    visibleToStudents: z.boolean().optional(),
  }).strict();

export const updateCourseLessonInputSchema =
  z
    .object({
      name: courseNameSchema.optional(),
      description: z
        .string()
        .trim()
        .max(5000)
        .nullable()
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
        Object.values(value).some(
          (item) => item !== undefined,
        ),
      "At least one lesson field is required",
    ).strict();

const lessonContentBaseSchema = z.object({
  lessonId: courseLessonIdSchema,
  deliveryId:
    courseSectionDeliveryIdSchema
      .nullable()
      .optional(),
  title: courseNameSchema,
  points: z.number().int().min(0).max(1000).default(1),
  sequence: z
    .number()
    .int()
    .min(0)
    .max(10000),
});

const resourceContentSchema =
  lessonContentBaseSchema.extend({
    contentType: z.literal("RESOURCE"),
    notes: learningTextSchema
      .nullable()
      .optional(),
    externalUrl:
      optionalHttpsUrlSchema
        .nullable()
        .optional(),
    storageKey:
      storageKeySchema.nullable().optional(),
  }).refine(
    (value) =>
      Boolean(
        value.notes ||
          value.externalUrl ||
          value.storageKey,
      ),
    {
      message:
        "Resource content requires notes, an https URL or a storage key",
    },
  );

const videoContentSchema =
  lessonContentBaseSchema.extend({
    contentType: z.literal("VIDEO"),
    notes: learningTextSchema
      .nullable()
      .optional(),
    storageKey: storageKeySchema,
    durationSeconds: z
      .number()
      .int()
      .min(1)
      .max(86400),
  });

const youtubeContentSchema =
  lessonContentBaseSchema.extend({
    contentType: z.literal("YOUTUBE"),
    notes: learningTextSchema
      .nullable()
      .optional(),
    externalUrl:
      optionalHttpsUrlSchema.refine(
        (value) => {
          const host =
            new URL(value).hostname.toLowerCase();
          return (
            host === "youtube.com" ||
            host.endsWith(".youtube.com") ||
            host === "youtu.be"
          );
        },
        "YouTube content requires a youtube.com or youtu.be URL",
      ),
    durationSeconds: z
      .number()
      .int()
      .min(1)
      .max(86400),
  });

const liveClassContentSchema =
  lessonContentBaseSchema
    .extend({
      contentType: z.literal("LIVE_CLASS"),
      notes: learningTextSchema
        .nullable()
        .optional(),
      externalUrl: optionalHttpsUrlSchema,
      startsAt: z
        .string()
        .datetime({ offset: true }),
      endsAt: z
        .string()
        .datetime({ offset: true }),
    })
    .refine(
      (value) =>
        new Date(value.endsAt).getTime() >
        new Date(value.startsAt).getTime(),
      {
        message:
          "Live class end time must be after start time",
        path: ["endsAt"],
      },
    );

export const createLessonContentInputSchema =
  z.discriminatedUnion("contentType", [
    resourceContentSchema,
    videoContentSchema,
    youtubeContentSchema,
    liveClassContentSchema,
  ]);

export const updateLessonContentInputSchema =
  z
    .object({
      title: courseNameSchema.optional(),
      points: z.number().int().min(0).max(1000).optional(),
      notes: learningTextSchema
        .nullable()
        .optional(),
      externalUrl:
        optionalHttpsUrlSchema
          .nullable()
          .optional(),
      storageKey:
        storageKeySchema.nullable().optional(),
      durationSeconds: z
        .number()
        .int()
        .min(1)
        .max(86400)
        .nullable()
        .optional(),
      startsAt: z
        .string()
        .datetime({ offset: true })
        .nullable()
        .optional(),
      endsAt: z
        .string()
        .datetime({ offset: true })
        .nullable()
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
        Object.values(value).some(
          (item) => item !== undefined,
        ),
      "At least one content field is required",
    );

export const lessonContentTransitionSchema =
  z.object({
    action: z.enum(["PUBLISH", "ARCHIVE"]),
  });

export type CreateLearningPathInput =
  z.infer<
    typeof createLearningPathInputSchema
  >;
export type UpdateLearningPathInput =
  z.infer<
    typeof updateLearningPathInputSchema
  >;
export type CreateCourseLessonInput =
  z.infer<
    typeof createCourseLessonInputSchema
  >;
export type UpdateCourseLessonInput =
  z.infer<
    typeof updateCourseLessonInputSchema
  >;
export type CreateLessonContentInput =
  z.input<
    typeof createLessonContentInputSchema
  >;
export type UpdateLessonContentInput =
  z.infer<
    typeof updateLessonContentInputSchema
  >;


export const saveLearnerContentProgressInputSchema =
  z
    .object({
      deliveryId:
        courseSectionDeliveryIdSchema,
      positionSeconds: z
        .number()
        .int()
        .min(0)
        .max(86400)
        .optional(),
      completed: z
        .boolean()
        .optional(),
    })
    .refine(
      (value) =>
        value.positionSeconds !== undefined ||
        value.completed === true,
      "Provide a position update or mark the content complete",
    );

export type SaveLearnerContentProgressInput =
  z.infer<
    typeof saveLearnerContentProgressInputSchema
  >;
