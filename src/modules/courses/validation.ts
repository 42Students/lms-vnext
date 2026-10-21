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
  .min(1,"Enter a course name")
  .max(255,"Maximum 255 characters");

const courseCodeSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(
    /^[A-Za-z0-9][A-Za-z0-9._-]*$/,
    "Code may contain letters, numbers, dots, underscores and hyphens",
  );

const courseShortTitleSchema=z.string().trim().min(1,"Enter short display name")
 .max(120,"Maximum 120 characters");
const courseOfficialCodeSchema=z.string().trim().max(40,"Maximum 40 characters").nullable();
/** Immutable legacy/public course slug; the department-local code is separate. */
export const courseSlugSchema=z.string().trim()
 .regex(/^[a-z0-9][a-z0-9-]{0,63}$/,"Invalid slug format");
const courseCardColorSchema=z.string().regex(/^#[0-9A-Fa-f]{6}$/,"Use a colour like #0a7c88").nullable();

/** Legacy CourseDTO crosswalk (IDs remain tenant-scoped UUIDs): course_name
 * -> name, short_title -> shortTitle (120 DB chars), dept_id -> departmentId,
 * parent_course_id -> parentCourseId, enabled -> enabled, and intro/takeaways
 * metadata -> course-display fields. Legacy active maps to lifecycle transitions,
 * allowed_for_display to persisted legacyAllowedForDisplay; neither flag is
 * accepted from an untrusted creation request. The Super Admin form generates
 * the vNext internal code; created_by_org_id is intentionally excluded because
 * the service derives organization from the verified department/actor scope. */
export const createCourseInputSchema = z.object({
  departmentId: z.string().uuid("Select a department"),
  parentCourseId:z.string().uuid().nullable().optional(),
  name: courseNameSchema,
  code: courseCodeSchema,
  shortTitle:courseShortTitleSchema.optional(),
  officialCode:courseOfficialCodeSchema.optional(),
  cardColor:courseCardColorSchema.optional(),
  /** Legacy public course cover is a verified HTTPS image URL. A private
   * uploaded object must first be promoted to a signed/public safe asset. */
  thumbnailUrl:z.string().trim().max(2048).refine(value=>{
    if(!value)return true;
    try{
      const url=new URL(value);
      return url.protocol==="https:"&&Boolean(url.hostname)&&
        !/^(localhost|127(?:\.\d+){3}|0\.0\.0\.0)$/i.test(url.hostname)&&
        !url.username&&!url.password;
    }catch{return false;}
  },"Enter a valid HTTPS course cover URL").nullable().optional(),
  takeaways:z.string().trim().max(2000).nullable().optional(),
  introductionHeading:z.string().trim().min(1,"Enter the heading").max(255,"Maximum 255 characters").optional(),
  enabled:z.boolean().optional(),
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
    parentCourseId:z.string().uuid().nullable().optional(),
    shortTitle:courseShortTitleSchema.optional(),
    officialCode:courseOfficialCodeSchema.optional(),
    cardColor:courseCardColorSchema.optional(),
    takeaways:z.string().trim().max(2000).nullable().optional(),
    introductionHeading:z.string().trim().min(1,"Enter the heading").max(255,"Maximum 255 characters").optional(),
    enabled:z.boolean().optional(),
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
    role: z.enum(COURSE_TEACHING_ROLES).default("PRIMARY"),
  }).strict();

/** A stale browser must not silently overwrite another administrator's role edit. */
export const changeCourseTeachingAssignmentRoleInputSchema = z.object({
  role: z.enum(COURSE_TEACHING_ROLES),
  expectedUpdatedAt: z.string().datetime({offset:true}),
}).strict();
/** A single class may have several courses; batch writes must commit together. */
export const createCourseTeachingAssignmentsBatchInputSchema = z.object({
  deliveryIds: z.array(courseSectionDeliveryIdSchema).min(1).max(10)
    .refine(ids=>new Set(ids).size===ids.length,"Duplicate course: choose each course only once"),
  membershipId: z.string().uuid(),
  role: z.enum(COURSE_TEACHING_ROLES).default("PRIMARY"),
}).strict();

/** Legacy CourseDTO adapter for explicitly resolved college-scoped UUIDs.
 * The original integers dept_id / course_id are NOT trusted in a vNext
 * request; a caller must first resolve them against its acting college.
 * Legacy field names are normalized without relaxing the typed vNext model.
 */
export const legacyCourseDraftSchema=z.object({
 departmentId:z.string().uuid("Select a department"),
 course_name:z.string().trim().min(1,"Enter a course name").max(255,"Maximum 255 characters"),
 short_title:z.string().trim().min(1,"Enter short display name").max(255).optional(),
 official_course_code:z.string().trim().max(40,"Maximum 40 characters").optional(),
 in_this_course_description:z.string().trim().min(1,"In this Course Description is required").max(5000),
 takeaways:z.array(z.string().trim().min(1)).max(50).optional(),
 parentCourseId:z.string().uuid().nullable().optional(),
 enabled:z.boolean().optional(),
 cardColor:courseCardColorSchema.optional(),
}).strict();

export function normalizeLegacyCourseDraft(
 raw:unknown,internalCode:string,
):z.input<typeof createCourseInputSchema>{
 const source=legacyCourseDraftSchema.parse(raw);
 const ordered=source.takeaways?.map(item=>item.trim()).filter(Boolean)??[];
 const points=ordered.join("\n");
 if(points.length>2000)throw new Error("Course Takeaways exceed 2000 characters");
 const shortTitle=(source.short_title??source.course_name).slice(0,120);
 return createCourseInputSchema.parse({
  departmentId:source.departmentId,name:source.course_name,
  shortTitle,code:internalCode,officialCode:source.official_course_code||null,
  description:source.in_this_course_description,
  takeaways:points||null,enabled:source.enabled??true,
  cardColor:source.cardColor??null,parentCourseId:source.parentCourseId??null,
 });
}

/** Old bulk faculty/course mappings are imported in explicit delivery batches.
 * Limit each locked transaction to ten grants, matching the native endpoint.
 * De-duplicate repeated IDs and preserve per-input diagnostics instead of
 * silently issuing the same course grant twice. */
export function planLegacyFacultyCourseBatches(
 rawDeliveryIds:readonly string[],batchSize=10,
){
 if(!Number.isInteger(batchSize)||batchSize<1||batchSize>10)
  throw new RangeError("Faculty course batch size must be between 1 and 10");
 const batches:string[][]=[],duplicateIndices:number[]=[],invalidIndices:number[]=[];
 const seen=new Set<string>();
 for(const [index,id] of rawDeliveryIds.entries()){
  const parsed=courseSectionDeliveryIdSchema.safeParse(id);
  if(!parsed.success){invalidIndices.push(index);continue;}
  if(seen.has(parsed.data)){duplicateIndices.push(index);continue;}
  seen.add(parsed.data);
  let batch=batches.at(-1);
  if(!batch||batch.length===batchSize){batch=[];batches.push(batch);}
  batch.push(parsed.data);
 }
 return {batches,duplicateIndices,invalidIndices};
}

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

const legacyLessonNameSchema=z.string().trim()
 .min(1,"Lesson name is required")
 .max(255,"Lesson name must not exceed 255 characters");
export const createCourseLessonInputSchema =
  z.object({
    learningPathId: learningPathIdSchema,
    name: legacyLessonNameSchema,
    description: z.string().trim().max(5000).nullable().optional(),
    // Legacy zero or omitted order appends after the last active lesson.
    sequence:z.number().int().min(0).max(10000).optional(),
    active:z.boolean().optional(),
    enabled:z.boolean().optional(),
    visibleToStudents:z.boolean().optional(),
  }).strict().refine(value=>value.enabled===undefined||
    value.visibleToStudents===undefined||value.enabled===value.visibleToStudents,{
      path:["enabled"],message:"Enabled and visibility values conflict",
    });

export const updateCourseLessonInputSchema =
  z.object({
    name:legacyLessonNameSchema.optional(),
    description:z.string().trim().max(5000).nullable().optional(),
    sequence:z.number().int().min(0).max(10000).optional(),
    active:z.boolean().optional(),
    enabled:z.boolean().optional(),
    visibleToStudents:z.boolean().optional(),
    expectedUpdatedAt:z.iso.datetime({offset:true}),
    expectedVersion:z.number().int().nonnegative().optional(),
  }).strict().refine(value=>
    value.name!==undefined||value.description!==undefined||
    value.sequence!==undefined||value.active!==undefined||
    value.enabled!==undefined||value.visibleToStudents!==undefined,{
      message:"At least one lesson field is required",
    }).refine(value=>value.enabled===undefined||
     value.visibleToStudents===undefined||value.enabled===value.visibleToStudents,{
      path:["enabled"],message:"Enabled and visibility values conflict",
    });

const lessonContentBaseSchema = z.object({
  visibleToStudents:z.boolean().optional(),
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
      visibleToStudents:z.boolean().optional(),
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
        value.completed !== undefined,
      "Provide a position update or mark the content complete",
    );

export type SaveLearnerContentProgressInput =
  z.infer<
    typeof saveLearnerContentProgressInputSchema
  >;
