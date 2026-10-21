import { z } from "zod";
import {mentorMeetingFacilitationSchema} from "./mentor-meeting-facilitation-model";
import {projectDeliveryAttachmentsSchema} from "./pr-s2-07-delivery-reopen-model";
import {
  PROJECT_MEETING_TYPES,
  PROJECT_MEMBER_ROLES,
  PROJECT_TASK_PRIORITIES,
  PROJECT_SUBMISSION_REVIEW_DECISIONS,
  PROJECT_TASK_REVIEW_DECISIONS,
} from "./constants";

const projectKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const titleSchema = z.string().trim().min(1).max(200);
const templateSlugSchema=z.string().trim().min(1,"Template slug is required")
 .max(80,"Slug must be 80 characters or fewer")
 .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/,"Use lowercase letters, numbers, and hyphens only");
const descriptionSchema = z
  .string()
  .trim()
  .min(1)
  .max(4000)
  .optional();
const sequenceSchema = z.number().int().min(0);

const releaseSchema = z
  .object({
    key: projectKeySchema,
    title: titleSchema,
    description: descriptionSchema,
    sequence: sequenceSchema,
  })
  .strict();

const sprintSchema = z
  .object({
    key: projectKeySchema,
    releaseKey: projectKeySchema,
    title: titleSchema,
    description: descriptionSchema,
    dueLabel: z.string().trim().min(1).max(120).optional(),
    goal: z.string().trim().min(1).max(1000).optional(),
    sequence: sequenceSchema,
  })
  .strict();

const taskSchema = z
  .object({
    key: projectKeySchema,
    sprintKey: projectKeySchema.nullable().optional(),
    title: titleSchema,
    taskType:z.enum(["STORY","BUG","CHORE","SPIKE"]).optional(),
    legacyKey:z.string().trim().max(120).optional(),
    dueLabel:z.string().trim().max(160).optional(),
    approach:z.string().trim().max(4000).optional(),
    description: descriptionSchema,
    acceptanceCriteria: z
      .string()
      .trim()
      .min(1)
      .max(4000)
      .optional(),
    priority: z
      .enum(PROJECT_TASK_PRIORITIES)
      .default("MEDIUM"),
    estimatePoints: z.number().int().min(1).max(13).optional(),
    sequence: sequenceSchema,
  })
  .strict();

const resourceSchema = z
  .object({
    key: projectKeySchema,
    title: titleSchema,
    description: descriptionSchema,
    url: z
      .string()
      .trim()
      .url()
      .max(2048)
      .refine(
        (value) =>
          value.startsWith("https://") ||
          value.startsWith("http://"),
        {
          message:
            "Project resource URL must use http or https",
        },
      )
      .optional(),
    type: z.enum(["LINK","PDF","DOCUMENT","SLIDES","VIDEO","FILE"]).optional(),
    status: z.enum(["ACTIVE","DRAFT","ARCHIVED"]).optional(),
    pinned: z.boolean().optional(),
    accessNotes: z.string().trim().max(2000).optional(),
    required: z.boolean().default(false),
    sequence: sequenceSchema,
  })
  .strict();

export const projectTemplateBlueprintSchema = z
  .object({
    overview: z
      .object({
        goal: z.string().trim().min(1).max(2000).optional(),
        description: z
          .string()
          .trim()
          .min(1)
          .max(4000)
          .optional(),
        deliverables: z
          .array(z.string().trim().min(1).max(500))
          .max(50)
          .default([]),
        courseLabel:z.string().trim().max(160).optional(),
        phase:z.string().trim().max(120).optional(),
        definitionOfDone:z.array(z.string().trim().min(1).max(500)).max(50).optional(),
        personas:z.array(z.string().trim().min(1).max(500)).max(50).optional(),
        submissionType:z.enum(["LINK","FILE","TEXT"]).optional(),
        submissionInstructions:z.string().trim().max(4000).optional(),

      })
      .strict()
      .default({ deliverables: [] }),
    releases: z.array(releaseSchema).max(50).default([]),
    sprints: z.array(sprintSchema).max(200).default([]),
    tasks: z.array(taskSchema).max(500).default([]),
    resources: z
      .array(resourceSchema)
      .max(200)
      .default([]),
  })
  .strict()
  .superRefine((blueprint, ctx) => {
    const releaseKeys = new Set<string>();
    const releaseSequences = new Set<number>();
    blueprint.releases.forEach((release, index) => {
      if (releaseKeys.has(release.key)) {
        ctx.addIssue({
          code: "custom",
          message: "Release keys must be unique",
          path: ["releases", index, "key"],
        });
      }
      releaseKeys.add(release.key);

      if (releaseSequences.has(release.sequence)) {
        ctx.addIssue({
          code: "custom",
          message: "Release sequence must be unique",
          path: ["releases", index, "sequence"],
        });
      }
      releaseSequences.add(release.sequence);
    });

    const sprintKeys = new Set<string>();
    const sprintSequences = new Set<string>();
    blueprint.sprints.forEach((sprint, index) => {
      if (sprintKeys.has(sprint.key)) {
        ctx.addIssue({
          code: "custom",
          message: "Sprint keys must be unique",
          path: ["sprints", index, "key"],
        });
      }
      sprintKeys.add(sprint.key);

      if (!releaseKeys.has(sprint.releaseKey)) {
        ctx.addIssue({
          code: "custom",
          message: "Sprint must reference an existing release",
          path: ["sprints", index, "releaseKey"],
        });
      }

      const siblingSequence =
        sprint.releaseKey + ":" + sprint.sequence;
      if (sprintSequences.has(siblingSequence)) {
        ctx.addIssue({
          code: "custom",
          message:
            "Sprint sequence must be unique inside its release",
          path: ["sprints", index, "sequence"],
        });
      }
      sprintSequences.add(siblingSequence);
    });

    const taskKeys = new Set<string>();
    const taskSequences = new Set<string>();
    blueprint.tasks.forEach((task, index) => {
      if (taskKeys.has(task.key)) {
        ctx.addIssue({
          code: "custom",
          message: "Task keys must be unique",
          path: ["tasks", index, "key"],
        });
      }
      taskKeys.add(task.key);

      if (task.sprintKey && !sprintKeys.has(task.sprintKey)) {
        ctx.addIssue({
          code: "custom",
          message: "Task must reference an existing sprint",
          path: ["tasks", index, "sprintKey"],
        });
      }

      const siblingSequence =
        (task.sprintKey??"__BACKLOG__") + ":" + task.sequence;
      if (taskSequences.has(siblingSequence)) {
        ctx.addIssue({
          code: "custom",
          message:
            "Task sequence must be unique inside its sprint",
          path: ["tasks", index, "sequence"],
        });
      }
      taskSequences.add(siblingSequence);
    });

    const resourceKeys = new Set<string>();
    const resourceSequences = new Set<number>();
    blueprint.resources.forEach((resource, index) => {
      if (resourceKeys.has(resource.key)) {
        ctx.addIssue({
          code: "custom",
          message: "Resource keys must be unique",
          path: ["resources", index, "key"],
        });
      }
      resourceKeys.add(resource.key);

      if (resourceSequences.has(resource.sequence)) {
        ctx.addIssue({
          code: "custom",
          message: "Resource sequence must be unique",
          path: ["resources", index, "sequence"],
        });
      }
      resourceSequences.add(resource.sequence);
    });
  });

export const projectTemplateIdSchema = z.string().uuid();
export const projectTemplateVersionSchema = z.number().int().min(1);

export const createProjectTemplateInputSchema = z
  .object({
    slug: templateSlugSchema,
    title: titleSchema,
    summary: z.string().trim().min(1).max(2000).optional(),
    blueprint: projectTemplateBlueprintSchema,
  })
  .strict();

export type ProjectTemplateBlueprint = z.infer<
  typeof projectTemplateBlueprintSchema
>;
export type CreateProjectTemplateInput = z.infer<
  typeof createProjectTemplateInputSchema
>;

export const publishableProjectTemplateBlueprintSchema =
  projectTemplateBlueprintSchema
    .refine(
      (blueprint) => blueprint.releases.length > 0,
      {
        message:
          "A published Project template needs at least one release",
        path: ["releases"],
      },
    )
    .refine(
      (blueprint) => blueprint.sprints.length > 0,
      {
        message:
          "A published Project template needs at least one sprint",
        path: ["sprints"],
      },
    )
    .refine(
      (blueprint) => blueprint.tasks.length > 0,
      {
        message:
          "A published Project template needs at least one task",
        path: ["tasks"],
      },
    );

export const reviseProjectTemplateInputSchema = z
  .object({
    expectedVersion: projectTemplateVersionSchema,
    title: titleSchema,
    summary: z.string().trim().min(1).max(2000).optional(),
    blueprint: projectTemplateBlueprintSchema,
    changeNote: z
      .string()
      .trim()
      .min(1)
      .max(1000)
      .optional(),
  })
  .strict();

export type ReviseProjectTemplateInput = z.infer<
  typeof reviseProjectTemplateInputSchema
>;

export const duplicateProjectTemplateInputSchema = z
  .object({
    slug: templateSlugSchema.optional(),
    title: titleSchema.optional(),
    summary: z
      .string()
      .trim()
      .min(1)
      .max(2000)
      .optional(),
  })
  .strict();

export type DuplicateProjectTemplateInput = z.infer<
  typeof duplicateProjectTemplateInputSchema
>;

export const projectInstanceIdSchema = z.string().uuid();

export const createProjectInstanceInputSchema = z
  .object({
    collegeId: z.string().uuid(),
    templateId: projectTemplateIdSchema,
    slug: projectKeySchema,
    title: z.string().trim().min(1, "Title is required").max(160, "Title must be 160 characters or fewer"),
    summary: z.string().trim().min(1).max(2000).optional(),
    phase: z.string().trim().max(120).optional(),
    progressPercent: z.number().int().min(0).max(100).default(0),
    dueLabel: z.string().trim().max(80).optional(),
    blocker: z.string().trim().max(4000).optional(),
    nextAction: z.string().trim().max(4000).optional(),
    primaryMentorMembershipId: z.string().uuid().optional(),
    sectionId: z.string().uuid().optional(),
    initialStatus: z.enum(["PLANNED","ACTIVE"]).default("PLANNED"),
    learnerMembershipIds: z.array(z.string().uuid()).max(500).default([]),
  })
  .strict().superRefine((v,ctx)=>{
    if(v.initialStatus==="ACTIVE"&&!v.primaryMentorMembershipId)
      ctx.addIssue({code:"custom",path:["primaryMentorMembershipId"],message:"A mentor is required before a workspace can be Active"});
    if(new Set(v.learnerMembershipIds).size!==v.learnerMembershipIds.length)
      ctx.addIssue({code:"custom",path:["learnerMembershipIds"],message:"Duplicate student"});
  });

export type CreateProjectInstanceInput = z.infer<
  typeof createProjectInstanceInputSchema
>;

export const projectMemberIdSchema = z.string().uuid();

export const projectMemberCandidateQuerySchema = z
  .object({
    role: z.enum(PROJECT_MEMBER_ROLES),
    q: z.string().trim().max(120).default(""),
    limit: z.union([
      z.number().int().min(1).max(50),
      z.string().regex(/^[0-9]+$/).transform(Number)
        .pipe(z.number().int().min(1).max(50)),
    ]).default(20),
  })
  .strict();

export const addProjectMemberInputSchema = z
  .object({
    membershipId: z.string().uuid(),
    role: z.enum(PROJECT_MEMBER_ROLES),
    isPrimary: z.boolean().default(false),
    roleKind: z.enum(["LEARNER","MENTOR","CO_MENTOR","OBSERVER","REVIEWER","QA"]).optional(),
    canMutate: z.boolean().optional(),
    roleLabel: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .optional(),
  })
  .strict()
  .refine(
    (input) =>
      (!input.isPrimary || (input.role === "MENTOR" && (input.roleKind === undefined || input.roleKind === "MENTOR") && input.canMutate !== false)) &&
      (input.roleKind === undefined || input.roleKind === "OBSERVER" || input.roleKind === "REVIEWER" || input.roleKind === "QA" || (input.role === "MENTOR" ? ["MENTOR","CO_MENTOR"].includes(input.roleKind) : input.roleKind === "LEARNER")) &&
      (!["OBSERVER","REVIEWER","QA"].includes(input.roleKind ?? "") || input.canMutate !== true),
    {
      message:
        "Only a Project mentor can be primary",
      path: ["isPrimary"],
    },
  );

export const updateProjectMemberInputSchema = z
  .object({
    isPrimary: z.boolean().optional(),
    roleKind: z.enum(["LEARNER","MENTOR","CO_MENTOR","OBSERVER","REVIEWER","QA"]).optional(),
    canMutate: z.boolean().optional(),
    roleLabel: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .nullable()
      .optional(),
  })
  .strict()
  .refine(
    (input) =>
      input.isPrimary !== undefined ||
      input.roleLabel !== undefined || input.roleKind !== undefined || input.canMutate !== undefined,
    {
      message: "At least one member field is required",
    },
  );

export type AddProjectMemberInput = z.input<
  typeof addProjectMemberInputSchema
>;
export const projectMentorCandidateQuerySchema = z
  .object({
    q: z.string().trim().max(120).default(""),
    limit: z.union([
      z.number().int().min(1).max(100),
      z.string().regex(/^[0-9]+$/).transform(Number)
        .pipe(z.number().int().min(1).max(100)),
    ]).default(50),
  })
  .strict();

export const bulkProjectMentorReassignmentInputSchema =
  z
    .object({
      collegeId: z.string().uuid(),
      projectIds: z
        .array(projectInstanceIdSchema)
        .min(1)
        .max(100)
        .transform((ids) => [
          ...new Set(ids),
        ]),
      mentorMembershipId: z.string().uuid(),
      roleLabel: z
        .string()
        .trim()
        .min(1)
        .max(120)
        .default("Project Mentor"),
    })
    .strict();

export type BulkProjectMentorReassignmentInput =
  z.input<
    typeof bulkProjectMentorReassignmentInputSchema
  >;

export type UpdateProjectMemberInput = z.infer<
  typeof updateProjectMemberInputSchema
>;

export const projectReleaseVersionInputSchema = z.object({expectedUpdatedAt:z.iso.datetime({offset:true}).optional()}).strict();

export const projectReleaseIdSchema = z.string().uuid();
export const projectSprintIdSchema = z.string().uuid();
export const projectTaskIdSchema = z.string().uuid();

export const updateProjectTaskStatusInputSchema = z
  .object({
    status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED"]),
    expectedUpdatedAt: z.iso.datetime({ offset: true }),
  })
  .strict();

export type UpdateProjectTaskStatusInput = z.infer<
  typeof updateProjectTaskStatusInputSchema
>;

export const projectTaskSubmissionIdSchema =
  z.string().uuid();

export const submitProjectTaskInputSchema = z
  .object({
    submissionUrl: z
      .string()
      .trim()
      .url()
      .max(2048)
      .refine(
        (value) =>
          value.startsWith("https://") ||
          value.startsWith("http://"),
        {
          message:
            "Task submission URL must use http or https",
        },
      ),
    note: z
      .string()
      .trim()
      .min(1)
      .max(4000)
      .optional(),
  })
  .strict();

export const reviewProjectTaskSubmissionInputSchema =
  z
    .object({
      decision: z.enum(
        PROJECT_TASK_REVIEW_DECISIONS,
      ),
      feedback: z
        .string()
        .trim()
        .min(1)
        .max(4000)
        .optional(),
      expectedUpdatedAt:z.string().datetime({offset:true}).optional(),
      confirmed:z.literal(true).optional(),
    })
    .strict()
    .refine(
      (input) =>
        input.decision !== "CHANGES_REQUESTED" ||
        Boolean(input.feedback),
      {
        message:
          "Feedback is required when requesting changes",
        path: ["feedback"],
      },
    );

export type SubmitProjectTaskInput = z.infer<
  typeof submitProjectTaskInputSchema
>;
export type ReviewProjectTaskSubmissionInput =
  z.infer<
    typeof reviewProjectTaskSubmissionInputSchema
  >;

const optionalHttpUrlSchema = z
  .string()
  .trim()
  .url()
  .max(2048)
  .refine(
    (value) =>
      value.startsWith("https://") ||
      value.startsWith("http://"),
    {
      message: "URL must use http or https",
    },
  )
  .optional();

export const projectSubmissionIdSchema =
  z.string().uuid();

export const projectSubmissionDraftInputSchema = z
  .object({
    summary: z.string().trim().min(1).max(6000),
    attachments:projectDeliveryAttachmentsSchema.optional(),
    sourceUrl: optionalHttpUrlSchema,
    demoUrl: optionalHttpUrlSchema,
    notes: z
      .string()
      .trim()
      .min(1)
      .max(6000)
      .optional(),
  })
  .strict();

// Saving a shared draft requires the editor's last server-acknowledged revision.
 // A separate schema preserves create-draft input while preventing stale tabs
 // and multiple devices from silently overwriting each other's draft.
export const updateProjectSubmissionDraftInputSchema =
  projectSubmissionDraftInputSchema.extend({
    expectedUpdatedAt: z.iso.datetime({offset:true}),
  }).strict();

// Submitting must refer to the exact saved revision the learner reviewed.
// Without this token a stale browser can finalize another teammate's edits.
export const submitProjectSubmissionInputSchema = z.object({
  expectedUpdatedAt:z.iso.datetime({offset:true}),
}).strict();

export const reviewProjectSubmissionInputSchema =
  z
    .object({
      decision: z.enum(
        PROJECT_SUBMISSION_REVIEW_DECISIONS,
      ),
      feedback: z
        .string()
        .trim()
        .min(1)
        .max(6000)
        .optional(),
      expectedVersion:z.number().int().min(1).optional(),
      expectedUpdatedAt:z.iso.datetime({offset:true}).optional(),
    })
    .strict()
    .refine(
      (input) =>
        input.decision !== "CHANGES_REQUESTED" ||
        Boolean(input.feedback),
      {
        message:
          "Feedback is required when requesting changes",
        path: ["feedback"],
      },
    );

const projectEvaluationItemInputSchema = z
  .object({
    criterion: z.string().trim().min(1).max(240),
    score: z.number().int().min(0).max(1000),
    maxScore: z.number().int().min(1).max(1000),
    feedback: z
      .string()
      .trim()
      .min(1)
      .max(4000)
      .optional(),
  })
  .strict()
  .refine(
    (item) => item.score <= item.maxScore,
    {
      message:
        "Evaluation score cannot exceed maxScore",
      path: ["score"],
    },
  );

export const createProjectEvaluationInputSchema =
  z
    .object({
      summary: z
        .string()
        .trim()
        .min(1)
        .max(6000)
        .optional(),
      items: z
        .array(projectEvaluationItemInputSchema)
        .min(1)
        .max(20),
    })
    .strict()
    .superRefine((input, ctx) => {
      const criteria = new Set<string>();
      input.items.forEach((item, index) => {
        const key = item.criterion.toLowerCase();
        if (criteria.has(key)) {
          ctx.addIssue({
            code: "custom",
            message:
              "Evaluation criteria must be unique",
            path: ["items", index, "criterion"],
          });
        }
        criteria.add(key);
      });
    });

export type ProjectSubmissionDraftInput = z.infer<
  typeof projectSubmissionDraftInputSchema
>;
export type UpdateProjectSubmissionDraftInput = z.infer<
  typeof updateProjectSubmissionDraftInputSchema
>;
export type ReviewProjectSubmissionInput = z.infer<
  typeof reviewProjectSubmissionInputSchema
>;
export type CreateProjectEvaluationInput = z.infer<
  typeof createProjectEvaluationInputSchema
>;

export const projectResourceIdSchema = z.string().uuid();

const projectResourceHttpUrlSchema = z
  .string()
  .trim()
  .url()
  .max(2048)
  .refine(
    (value) =>
      value.startsWith("https://") ||
      value.startsWith("http://"),
    {
      message:
        "Project resource URL must use http or https",
    },
  );

export const createProjectResourceInputSchema = z
  .object({
    title: titleSchema,
    description: z
      .string()
      .trim()
      .min(1)
      .max(4000)
      .nullable()
      .optional(),
    url: projectResourceHttpUrlSchema
      .nullable()
      .optional(),
    required: z.boolean().optional(),
    visibility: z.enum(["TEAM","MENTOR_ONLY"]).optional(),
    resourceType: z.enum(["FILE","LINK","DOCUMENT","CODE","NOTE","ENVIRONMENT"]).optional(),
    legacyResourceKind:z.enum(["PDF","DOC","PPT","VIDEO"]).nullable().optional(),
    status: z.enum(["ACTIVE","DRAFT","ARCHIVED"]).optional(),
    pinned: z.boolean().optional(),
    accessNotes: z.string().trim().max(4000).nullable().optional(),
    sprintId: z.string().uuid().nullable().optional(),
    taskId: z.string().uuid().nullable().optional(),
  })
  .strict()
  .refine(
    (input) =>
      Boolean(input.description || input.url),
    {
      message:
        "Project resource requires a description or URL",
    },
  );

export const projectResourceExpectedVersionSchema = z.iso.datetime({offset:true});
export const archiveProjectResourceInputSchema = z.object({expectedUpdatedAt:projectResourceExpectedVersionSchema.optional()}).strict();

export const updateProjectResourceInputSchema = z
  .object({
    expectedUpdatedAt: projectResourceExpectedVersionSchema.optional(),
    title: titleSchema.optional(),
    description: z
      .string()
      .trim()
      .min(1)
      .max(4000)
      .nullable()
      .optional(),
    url: projectResourceHttpUrlSchema
      .nullable()
      .optional(),
    required: z.boolean().optional(),
    visibility: z.enum(["TEAM","MENTOR_ONLY"]).optional(),
    resourceType: z.enum(["FILE","LINK","DOCUMENT","CODE","NOTE","ENVIRONMENT"]).optional(),
    legacyResourceKind:z.enum(["PDF","DOC","PPT","VIDEO"]).nullable().optional(),
    status: z.enum(["ACTIVE","DRAFT","ARCHIVED"]).optional(),
    pinned: z.boolean().optional(),
    accessNotes: z.string().trim().max(4000).nullable().optional(),
    sprintId: z.string().uuid().nullable().optional(),
    taskId: z.string().uuid().nullable().optional(),
  })
  .strict()
  .refine(
    (input) =>
      Object.values(input).some(
        (value) => value !== undefined,
      ),
    {
      message:
        "At least one Project resource field is required",
    },
  );

export type CreateProjectResourceInput = z.infer<
  typeof createProjectResourceInputSchema
>;
export type UpdateProjectResourceInput = z.infer<
  typeof updateProjectResourceInputSchema
>;

export const projectMeetingIdSchema = z.string().uuid();

const projectMeetingWindowShape = {
  title: titleSchema,
  agenda: z
    .string()
    .trim()
    .min(1)
    .max(4000)
    .nullable()
    .optional(),
  startsAt: z
    .string()
    .datetime({ offset: true }),
  endsAt: z
    .string()
    .datetime({ offset: true }),
  timeZone: z
    .string()
    .trim()
    .min(1)
    .max(80)
    // Meeting instants are offset-aware; never trust a caller's free-text
    // display zone to contradict the IST calendar used across the LMS.
    .transform(() => "Asia/Kolkata" as const),
};

function withValidMeetingWindow<
  T extends z.ZodRawShape,
>(shape: T) {
  return z
    .object(shape)
    .strict()
    .refine(
      (input) =>
        new Date(
          (input as { endsAt: string }).endsAt,
        ).getTime() >
        new Date(
          (input as { startsAt: string }).startsAt,
        ).getTime(),
      {
        message:
          "Project meeting end time must be after start time",
        path: ["endsAt"],
      },
    );
}

// MEN-projects-meetings-29: legacy meeting links accept both HTTP and HTTPS.
// Reject non-web schemes and credential-bearing URLs at the API boundary.
const projectMeetingWebUrlSchema = z
  .string()
  .trim()
  .url()
  .max(2048)
  .refine(
    (value) => {
      try {
        const url = new URL(value);
        return (url.protocol === "https:" || url.protocol === "http:") &&
          Boolean(url.hostname) && !url.username && !url.password;
      } catch {
        return false;
      }
    },
    { message: "Enter a valid meeting link." },
  );

export const requestProjectMeetingInputSchema =
  withValidMeetingWindow(
    projectMeetingWindowShape,
  );

export const scheduleProjectMeetingInputSchema =
  withValidMeetingWindow({
    ...projectMeetingWindowShape,
    meetingType: z
      .enum(PROJECT_MEETING_TYPES)
      .optional(),
    status:z.enum(["DRAFT","SCHEDULED","RESCHEDULED"]).optional(),
    meetingUrl: projectMeetingWebUrlSchema.nullable().optional(),
    outcome:z.string().trim().max(4000).nullable().optional(),
    facilitation:mentorMeetingFacilitationSchema.optional(),
    expectedUpdatedAt: z.iso.datetime({offset:true}).optional(),
    expectedProjectUpdatedAt: z.iso.datetime({offset:true}).optional(),
    linkedSprintId:
      projectSprintIdSchema.nullable().optional(),
    linkedTaskId:
      projectTaskIdSchema.nullable().optional(),
  }).superRefine((value,ctx)=>{
    if(value.status!=="DRAFT" && !value.meetingUrl && !value.expectedUpdatedAt)
      ctx.addIssue({code:"custom",path:["meetingUrl"],message:"Meeting link is required."});
  });

export const projectMeetingTransitionInputSchema =
  z.discriminatedUnion("action", [
    z
      .object({
        action: z.literal("COMPLETE"),
        expectedUpdatedAt: z.iso.datetime({offset:true}).optional(),
        outcome: z
          .string()
          .trim()
          .min(1)
          .max(4000)
          .optional(),
      })
      .strict(),
    z
      .object({
        action: z.literal("CANCEL"),
        expectedUpdatedAt: z.iso.datetime({offset:true}).optional(),
        note: z
          .string()
          .trim()
          .min(1)
          .max(2000)
          .optional(),
      })
      .strict(),
  ]);

export type RequestProjectMeetingInput = z.infer<
  typeof requestProjectMeetingInputSchema
>;
export type ScheduleProjectMeetingInput = z.infer<
  typeof scheduleProjectMeetingInputSchema
>;
export type ProjectMeetingTransitionInput = z.infer<
  typeof projectMeetingTransitionInputSchema
>;

/** Import-only compatibility. Native template mutations still use the strict
 * parsed model; old labels and non-kebab task keys must never be silently lost.
 */
export function normalizeLegacyProjectBlueprint(raw:unknown):unknown{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return raw;
 const input=raw as Record<string,unknown>;
 const normalizeRows=(value:unknown)=>Array.isArray(value)
   ?value.filter((item):item is Record<string,unknown>=>Boolean(item)&&
      typeof item==="object"&&!Array.isArray(item)):[];
 const slug=(value:string)=>value.normalize("NFKD").toLowerCase()
   .replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-")
   .replace(/^-|-$/g,"").slice(0,55).replace(/-$/g,"")||"item";
 const hash=(value:string)=>{
   let state=2166136261;
   for(let i=0;i<value.length;i++){
     state=Math.imul(state^value.charCodeAt(i),16777619)>>>0;
   }
   return state.toString(36);
 };
 const unique=(value:string,seen:Set<string>)=>{
   const normalized=slug(value);
   let next=normalized;
   if(seen.has(next))next=(normalized.slice(0,54)+"-"+hash(value)).slice(0,64);
   let seq=2;
   while(seen.has(next))next=(normalized.slice(0,57)+"-"+(seq++)).slice(0,64);
   seen.add(next);return next;
 };
 const sprintSeen=new Set<string>(),taskSeen=new Set<string>(),resourceSeen=new Set<string>();
 const sprints=normalizeRows(input.sprints).map(row=>{
   const legacy=typeof row.key==="string"?row.key:
     typeof row.sprintKey==="string"?row.sprintKey:"sprint";
   return {...row,key:unique(legacy,sprintSeen)};
 });
 const originalSprints=normalizeRows(input.sprints);
 const sprintMap=new Map(originalSprints.map((row,i)=>[
   String(row.key??row.sprintKey??""),String(sprints[i]?.key??""),
 ]));
 const tasks=normalizeRows(input.tasks).map(row=>{
   const original=String(row.key??row.taskKey??row.title??"task");
   const key=unique(original,taskSeen);
   const legacyKey=original!==key&&original.length<=120?original:undefined;
   const oldSprint=typeof row.sprintKey==="string"?row.sprintKey:"";
   return {...row,key,legacyKey,
     sprintKey:oldSprint?(sprintMap.get(oldSprint)||null):null,
     taskType:typeof row.taskType==="string"?
       row.taskType.toUpperCase():undefined};
 });
 const kindMap:Record<string,string>={
   link:"LINK",pdf:"PDF",doc:"DOCUMENT",document:"DOCUMENT",
   ppt:"SLIDES",slides:"SLIDES",video:"VIDEO",file:"FILE",
 };
 const resources=normalizeRows(input.resources).map(row=>{
   const original=String(row.key??row.title??"resource");
   const legacyType=String(row.type??row.resourceType??"LINK").toLowerCase();
   const {isPinned:_,isRequired:__,resourceType:___,...rest}=row;
   void _;void __;void ___;
   return {...rest,key:unique(original,resourceSeen),
     type:kindMap[legacyType]??"LINK",
     pinned:row.pinned===true||row.isPinned===true,
     required:row.required===true||row.isRequired===true};
 });
 return {...input,sprints,tasks,resources};
}
