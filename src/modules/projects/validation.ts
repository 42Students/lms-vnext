import { z } from "zod";
import {
  PROJECT_MEMBER_ROLES,
  PROJECT_TASK_PRIORITIES,
} from "./constants";

const projectKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const titleSchema = z.string().trim().min(1).max(200);
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
    sequence: sequenceSchema,
  })
  .strict();

const taskSchema = z
  .object({
    key: projectKeySchema,
    sprintKey: projectKeySchema,
    title: titleSchema,
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
    sequence: sequenceSchema,
  })
  .strict();

const resourceSchema = z
  .object({
    key: projectKeySchema,
    title: titleSchema,
    description: descriptionSchema,
    url: z.string().trim().url().max(2048).optional(),
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
      })
      .strict()
      .default({ deliverables: [] }),
    releases: z.array(releaseSchema).max(50).default([]),
    sprints: z.array(sprintSchema).max(200).default([]),
    tasks: z.array(taskSchema).max(2000).default([]),
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

      if (!sprintKeys.has(task.sprintKey)) {
        ctx.addIssue({
          code: "custom",
          message: "Task must reference an existing sprint",
          path: ["tasks", index, "sprintKey"],
        });
      }

      const siblingSequence =
        task.sprintKey + ":" + task.sequence;
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
    slug: projectKeySchema,
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

export const projectInstanceIdSchema = z.string().uuid();

export const createProjectInstanceInputSchema = z
  .object({
    collegeId: z.string().uuid(),
    templateId: projectTemplateIdSchema,
    slug: projectKeySchema,
    title: titleSchema,
    summary: z.string().trim().min(1).max(2000).optional(),
  })
  .strict();

export type CreateProjectInstanceInput = z.infer<
  typeof createProjectInstanceInputSchema
>;

export const projectMemberIdSchema = z.string().uuid();

export const addProjectMemberInputSchema = z
  .object({
    membershipId: z.string().uuid(),
    role: z.enum(PROJECT_MEMBER_ROLES),
    isPrimary: z.boolean().default(false),
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
      !input.isPrimary || input.role === "MENTOR",
    {
      message:
        "Only a Project mentor can be primary",
      path: ["isPrimary"],
    },
  );

export const updateProjectMemberInputSchema = z
  .object({
    isPrimary: z.boolean().optional(),
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
      input.roleLabel !== undefined,
    {
      message: "At least one member field is required",
    },
  );

export type AddProjectMemberInput = z.infer<
  typeof addProjectMemberInputSchema
>;
export type UpdateProjectMemberInput = z.infer<
  typeof updateProjectMemberInputSchema
>;
