import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import type { ProjectTemplateBlueprint } from "@/modules/projects/validation";
import { colleges } from "./colleges";
import { collegeMemberships } from "./memberships";
import { users } from "./users";
import { lmsGroups } from "./groups";

export const projectTemplates = pgTable(
  "project_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 96 }).notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    status: varchar("status", { length: 32 })
      .notNull()
      .default("DRAFT"),
    currentVersion: integer("current_version")
      .notNull()
      .default(1),
    publishedVersion: integer("published_version"),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),
    archivedAt: timestamp("archived_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("project_templates_slug_uq").on(
      sql`lower(${table.slug})`,
    ),
    index("project_templates_status_idx").on(
      table.status,
    ),
    check(
      "project_templates_status_ck",
      sql`${table.status} in ('DRAFT', 'PUBLISHED', 'ARCHIVED')`,
    ),
    check(
      "project_templates_current_version_ck",
      sql`${table.currentVersion} >= 1`,
    ),
    check(
      "project_templates_published_version_ck",
      sql`${table.publishedVersion} is null or (${table.publishedVersion} >= 1 and ${table.publishedVersion} <= ${table.currentVersion})`,
    ),
  ],
);

export const projectTemplateVersions = pgTable(
  "project_template_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    templateId: uuid("template_id")
      .notNull()
      .references(() => projectTemplates.id, {
        onDelete: "restrict",
      }),
    version: integer("version").notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    blueprint: jsonb("blueprint")
      .$type<ProjectTemplateBlueprint>()
      .notNull(),
    changeNote: text("change_note"),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "project_template_versions_template_version_uq",
    ).on(table.templateId, table.version),
    index("project_template_versions_template_idx").on(
      table.templateId,
      table.version,
    ),
    check(
      "project_template_versions_version_ck",
      sql`${table.version} >= 1`,
    ),
  ],
);

export const projectTemplateCollegeAssignments =
  pgTable(
    "project_template_college_assignments",
    {
      id: uuid("id").defaultRandom().primaryKey(),
      templateId: uuid("template_id")
        .notNull()
        .references(() => projectTemplates.id, {
          onDelete: "restrict",
        }),
      templateVersionId: uuid("template_version_id")
        .notNull()
        .references(() => projectTemplateVersions.id, {
          onDelete: "restrict",
        }),
      collegeId: uuid("college_id")
        .notNull()
        .references(() => colleges.id, {
          onDelete: "restrict",
        }),
      assignedByUserId: uuid("assigned_by_user_id")
        .notNull()
        .references(() => users.id, {
          onDelete: "restrict",
        }),
      assignedAt: timestamp("assigned_at", {
        withTimezone: true,
      })
        .notNull()
        .defaultNow(),
      revokedAt: timestamp("revoked_at", {
        withTimezone: true,
      }),
    },
    (table) => [
      uniqueIndex(
        "project_template_college_assignments_active_uq",
      )
        .on(table.templateId, table.collegeId)
        .where(sql`${table.revokedAt} is null`),
      index(
        "project_template_college_assignments_college_idx",
      ).on(table.collegeId, table.revokedAt),
      index(
        "project_template_college_assignments_version_idx",
      ).on(table.templateVersionId),
    ],
  );

export const projectInstances = pgTable(
  "project_instances",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, {
        onDelete: "restrict",
      }),
    templateId: uuid("template_id")
      .notNull()
      .references(() => projectTemplates.id, {
        onDelete: "restrict",
      }),
    templateVersionId: uuid("template_version_id")
      .notNull()
      .references(() => projectTemplateVersions.id, {
        onDelete: "restrict",
      }),
    teamGroupId: uuid("team_group_id").references(() => lmsGroups.id, { onDelete: "restrict" }),
    slug: varchar("slug", { length: 96 }).notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    status: varchar("status", { length: 32 })
      .notNull()
      .default("PLANNED"),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),
    materializedAt: timestamp("materialized_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    archivedAt: timestamp("archived_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("project_instances_college_slug_uq").on(
      table.collegeId,
      sql`lower(${table.slug})`,
    ),
    uniqueIndex("project_instances_team_group_uq").on(table.teamGroupId),
    index("project_instances_college_status_idx").on(
      table.collegeId,
      table.status,
    ),
    index("project_instances_template_version_idx").on(
      table.templateVersionId,
    ),
    check(
      "project_instances_status_ck",
      sql`${table.status} in ('PLANNED', 'ACTIVE', 'COMPLETED', 'ARCHIVED')`,
    ),
  ],
);

export const projectReleases = pgTable(
  "project_releases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectInstances.id, {
        onDelete: "restrict",
      }),
    templateKey: varchar("template_key", {
      length: 64,
    }).notNull(),
    title: text("title").notNull(),
    description: text("description"),
    sequence: integer("sequence").notNull(),
    status: varchar("status", { length: 32 })
      .notNull()
      .default("PLANNED"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("project_releases_project_key_uq").on(
      table.projectId,
      table.templateKey,
    ),
    uniqueIndex(
      "project_releases_project_sequence_uq",
    ).on(table.projectId, table.sequence),
    index("project_releases_project_status_idx").on(
      table.projectId,
      table.status,
    ),
    check(
      "project_releases_sequence_ck",
      sql`${table.sequence} >= 0`,
    ),
    check(
      "project_releases_status_ck",
      sql`${table.status} in ('PLANNED', 'IN_PROGRESS', 'SHIPPED')`,
    ),
  ],
);

export const projectSprints = pgTable(
  "project_sprints",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectInstances.id, {
        onDelete: "restrict",
      }),
    releaseId: uuid("release_id")
      .notNull()
      .references(() => projectReleases.id, {
        onDelete: "restrict",
      }),
    templateKey: varchar("template_key", {
      length: 64,
    }).notNull(),
    title: text("title").notNull(),
    description: text("description"),
    sequence: integer("sequence").notNull(),
    status: varchar("status", { length: 32 })
      .notNull()
      .default("PLANNED"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("project_sprints_project_key_uq").on(
      table.projectId,
      table.templateKey,
    ),
    uniqueIndex(
      "project_sprints_release_sequence_uq",
    ).on(table.releaseId, table.sequence),
    uniqueIndex("project_sprints_active_project_uq")
      .on(table.projectId)
      .where(sql`${table.status} = 'ACTIVE'`),
    index("project_sprints_project_status_idx").on(
      table.projectId,
      table.status,
    ),
    check(
      "project_sprints_sequence_ck",
      sql`${table.sequence} >= 0`,
    ),
    check(
      "project_sprints_status_ck",
      sql`${table.status} in ('PLANNED', 'ACTIVE', 'COMPLETED')`,
    ),
  ],
);

export const projectTasks = pgTable(
  "project_tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectInstances.id, {
        onDelete: "restrict",
      }),
    sprintId: uuid("sprint_id")
      .notNull()
      .references(() => projectSprints.id, {
        onDelete: "restrict",
      }),
    templateKey: varchar("template_key", {
      length: 64,
    }).notNull(),
    title: text("title").notNull(),
    description: text("description"),
    acceptanceCriteria: text("acceptance_criteria"),
    priority: varchar("priority", { length: 16 })
      .notNull()
      .default("MEDIUM"),
    status: varchar("status", { length: 32 })
      .notNull()
      .default("TODO"),
    sequence: integer("sequence").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("project_tasks_project_key_uq").on(
      table.projectId,
      table.templateKey,
    ),
    uniqueIndex("project_tasks_sprint_sequence_uq").on(
      table.sprintId,
      table.sequence,
    ),
    index("project_tasks_project_status_idx").on(
      table.projectId,
      table.status,
    ),
    check(
      "project_tasks_sequence_ck",
      sql`${table.sequence} >= 0`,
    ),
    check(
      "project_tasks_priority_ck",
      sql`${table.priority} in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')`,
    ),
    check(
      "project_tasks_status_ck",
      sql`${table.status} in ('TODO', 'IN_PROGRESS', 'BLOCKED', 'IN_REVIEW', 'DONE')`,
    ),
  ],
);

export const projectResources = pgTable(
  "project_resources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectInstances.id, {
        onDelete: "restrict",
      }),
    templateKey: varchar("template_key", {
      length: 64,
    }),
    title: text("title").notNull(),
    description: text("description"),
    url: text("url"),
    required: boolean("required")
      .notNull()
      .default(false),
    sequence: integer("sequence").notNull(),
    status: varchar("status", { length: 32 })
      .notNull()
      .default("ACTIVE"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("project_resources_project_key_uq").on(
      table.projectId,
      table.templateKey,
    ),
    uniqueIndex(
      "project_resources_project_sequence_uq",
    ).on(table.projectId, table.sequence),
    index("project_resources_project_status_idx").on(
      table.projectId,
      table.status,
    ),
    check(
      "project_resources_sequence_ck",
      sql`${table.sequence} >= 0`,
    ),
    check(
      "project_resources_status_ck",
      sql`${table.status} in ('ACTIVE', 'ARCHIVED')`,
    ),
  ],
);

export const projectMembers = pgTable(
  "project_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectInstances.id, {
        onDelete: "restrict",
      }),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => collegeMemberships.id, {
        onDelete: "restrict",
      }),
    role: varchar("role", { length: 16 }).notNull(),
    isPrimary: boolean("is_primary")
      .notNull()
      .default(false),
    roleLabel: text("role_label"),
    startedAt: timestamp("started_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    endedAt: timestamp("ended_at", {
      withTimezone: true,
    }),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("project_members_active_membership_uq")
      .on(table.projectId, table.membershipId)
      .where(sql`${table.endedAt} is null`),
    uniqueIndex("project_members_active_primary_mentor_uq")
      .on(table.projectId)
      .where(
        sql`${table.endedAt} is null and ${table.role} = 'MENTOR' and ${table.isPrimary} = true`,
      ),
    index("project_members_membership_active_idx").on(
      table.membershipId,
      table.endedAt,
    ),
    index("project_members_project_role_idx").on(
      table.projectId,
      table.role,
      table.endedAt,
    ),
    check(
      "project_members_role_ck",
      sql`${table.role} in ('LEARNER', 'MENTOR')`,
    ),
    check(
      "project_members_primary_role_ck",
      sql`${table.isPrimary} = false or ${table.role} = 'MENTOR'`,
    ),
  ],
);

export const projectTaskSubmissions = pgTable(
  "project_task_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectInstances.id, {
        onDelete: "restrict",
      }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => projectTasks.id, {
        onDelete: "restrict",
      }),
    version: integer("version").notNull(),
    submittedByMembershipId: uuid(
      "submitted_by_membership_id",
    )
      .notNull()
      .references(() => collegeMemberships.id, {
        onDelete: "restrict",
      }),
    submissionUrl: text("submission_url").notNull(),
    note: text("note"),
    status: varchar("status", { length: 32 })
      .notNull()
      .default("SUBMITTED"),
    submittedAt: timestamp("submitted_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    reviewedByUserId: uuid("reviewed_by_user_id")
      .references(() => users.id, {
        onDelete: "restrict",
      }),
    reviewedByMembershipId: uuid(
      "reviewed_by_membership_id",
    ).references(() => collegeMemberships.id, {
      onDelete: "restrict",
    }),
    reviewedAt: timestamp("reviewed_at", {
      withTimezone: true,
    }),
    feedback: text("feedback"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "project_task_submissions_task_version_uq",
    ).on(table.taskId, table.version),
    uniqueIndex(
      "project_task_submissions_active_uq",
    )
      .on(table.taskId)
      .where(sql`${table.status} = 'SUBMITTED'`),
    index(
      "project_task_submissions_project_task_idx",
    ).on(table.projectId, table.taskId),
    index(
      "project_task_submissions_submitter_idx",
    ).on(table.submittedByMembershipId),
    check(
      "project_task_submissions_version_ck",
      sql`${table.version} >= 1`,
    ),
    check(
      "project_task_submissions_status_ck",
      sql`${table.status} in ('SUBMITTED', 'CHANGES_REQUESTED', 'APPROVED')`,
    ),
    check(
      "project_task_submissions_review_ck",
      sql`(
        (${table.status} = 'SUBMITTED'
          and ${table.reviewedByUserId} is null
          and ${table.reviewedByMembershipId} is null
          and ${table.reviewedAt} is null
          and ${table.feedback} is null)
        or
        (${table.status} in ('CHANGES_REQUESTED', 'APPROVED')
          and ${table.reviewedByUserId} is not null
          and ${table.reviewedAt} is not null)
      )`,
    ),
  ],
);

export const projectSubmissions = pgTable(
  "project_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectInstances.id, {
        onDelete: "restrict",
      }),
    version: integer("version").notNull(),
    status: varchar("status", { length: 32 })
      .notNull()
      .default("DRAFT"),
    summary: text("summary").notNull(),
    sourceUrl: text("source_url"),
    demoUrl: text("demo_url"),
    notes: text("notes"),
    createdByMembershipId: uuid(
      "created_by_membership_id",
    )
      .notNull()
      .references(() => collegeMemberships.id, {
        onDelete: "restrict",
      }),
    submittedByMembershipId: uuid(
      "submitted_by_membership_id",
    ).references(() => collegeMemberships.id, {
      onDelete: "restrict",
    }),
    submittedAt: timestamp("submitted_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "project_submissions_project_version_uq",
    ).on(table.projectId, table.version),
    uniqueIndex(
      "project_submissions_open_project_uq",
    )
      .on(table.projectId)
      .where(
        sql`${table.status} in ('DRAFT', 'SUBMITTED')`,
      ),
    index("project_submissions_project_status_idx").on(
      table.projectId,
      table.status,
    ),
    check(
      "project_submissions_version_ck",
      sql`${table.version} >= 1`,
    ),
    check(
      "project_submissions_status_ck",
      sql`${table.status} in ('DRAFT', 'SUBMITTED', 'CHANGES_REQUESTED', 'APPROVED')`,
    ),
    check(
      "project_submissions_submit_shape_ck",
      sql`(
        (${table.status} = 'DRAFT'
          and ${table.submittedByMembershipId} is null
          and ${table.submittedAt} is null)
        or
        (${table.status} in ('SUBMITTED', 'CHANGES_REQUESTED', 'APPROVED')
          and ${table.submittedByMembershipId} is not null
          and ${table.submittedAt} is not null)
      )`,
    ),
  ],
);

export const projectSubmissionReviews = pgTable(
  "project_submission_reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectInstances.id, {
        onDelete: "restrict",
      }),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => projectSubmissions.id, {
        onDelete: "restrict",
      }),
    decision: varchar("decision", {
      length: 32,
    }).notNull(),
    feedback: text("feedback"),
    reviewedByUserId: uuid("reviewed_by_user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),
    reviewedByMembershipId: uuid(
      "reviewed_by_membership_id",
    ).references(() => collegeMemberships.id, {
      onDelete: "restrict",
    }),
    reviewedAt: timestamp("reviewed_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "project_submission_reviews_submission_uq",
    ).on(table.submissionId),
    index(
      "project_submission_reviews_project_idx",
    ).on(table.projectId, table.reviewedAt),
    check(
      "project_submission_reviews_decision_ck",
      sql`${table.decision} in ('CHANGES_REQUESTED', 'APPROVED')`,
    ),
    check(
      "project_submission_reviews_feedback_ck",
      sql`${table.decision} <> 'CHANGES_REQUESTED' or (${table.feedback} is not null and length(trim(${table.feedback})) > 0)`,
    ),
  ],
);

export const projectEvaluations = pgTable(
  "project_evaluations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectInstances.id, {
        onDelete: "restrict",
      }),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => projectSubmissions.id, {
        onDelete: "restrict",
      }),
    evaluatorUserId: uuid("evaluator_user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),
    evaluatorMembershipId: uuid(
      "evaluator_membership_id",
    ).references(() => collegeMemberships.id, {
      onDelete: "restrict",
    }),
    totalScore: integer("total_score").notNull(),
    maxScore: integer("max_score").notNull(),
    summary: text("summary"),
    evaluatedAt: timestamp("evaluated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "project_evaluations_submission_uq",
    ).on(table.submissionId),
    index("project_evaluations_project_idx").on(
      table.projectId,
      table.evaluatedAt,
    ),
    check(
      "project_evaluations_score_ck",
      sql`${table.maxScore} > 0 and ${table.totalScore} >= 0 and ${table.totalScore} <= ${table.maxScore}`,
    ),
  ],
);

export const projectEvaluationItems = pgTable(
  "project_evaluation_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    evaluationId: uuid("evaluation_id")
      .notNull()
      .references(() => projectEvaluations.id, {
        onDelete: "restrict",
      }),
    criterion: text("criterion").notNull(),
    score: integer("score").notNull(),
    maxScore: integer("max_score").notNull(),
    feedback: text("feedback"),
    sequence: integer("sequence").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "project_evaluation_items_evaluation_sequence_uq",
    ).on(table.evaluationId, table.sequence),
    index(
      "project_evaluation_items_evaluation_idx",
    ).on(table.evaluationId),
    check(
      "project_evaluation_items_score_ck",
      sql`${table.maxScore} > 0 and ${table.score} >= 0 and ${table.score} <= ${table.maxScore}`,
    ),
    check(
      "project_evaluation_items_sequence_ck",
      sql`${table.sequence} >= 0`,
    ),
  ],
);

export const projectMeetings = pgTable(
  "project_meetings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectInstances.id, {
        onDelete: "restrict",
      }),
    status: varchar("status", { length: 32 })
      .notNull()
      .default("REQUESTED"),
    meetingType: varchar("meeting_type", {
      length: 20,
    })
      .notNull()
      .default("GENERAL"),
    title: text("title").notNull(),
    agenda: text("agenda"),
    startsAt: timestamp("starts_at", {
      withTimezone: true,
    }).notNull(),
    endsAt: timestamp("ends_at", {
      withTimezone: true,
    }).notNull(),
    timeZone: varchar("time_zone", {
      length: 80,
    }).notNull(),
    meetingUrl: text("meeting_url"),
    requestedByMembershipId: uuid(
      "requested_by_membership_id",
    ).references(() => collegeMemberships.id, {
      onDelete: "restrict",
    }),
    scheduledByUserId: uuid("scheduled_by_user_id")
      .references(() => users.id, {
        onDelete: "restrict",
      }),
    scheduledByMembershipId: uuid(
      "scheduled_by_membership_id",
    ).references(() => collegeMemberships.id, {
      onDelete: "restrict",
    }),
    linkedSprintId: uuid("linked_sprint_id")
      .references(() => projectSprints.id, {
        onDelete: "restrict",
      }),
    linkedTaskId: uuid("linked_task_id")
      .references(() => projectTasks.id, {
        onDelete: "restrict",
      }),
    outcome: text("outcome"),
    cancellationNote: text("cancellation_note"),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("project_meetings_project_start_idx").on(
      table.projectId,
      table.startsAt,
    ),
    index("project_meetings_project_status_idx").on(
      table.projectId,
      table.status,
    ),
    index("project_meetings_requester_idx").on(
      table.requestedByMembershipId,
      table.status,
    ),
    check(
      "project_meetings_status_ck",
      sql`${table.status} in ('REQUESTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED')`,
    ),
    check(
      "project_meetings_type_ck",
      sql`${table.meetingType} in ('GENERAL', 'PLANNING', 'STANDUP', 'REVIEW', 'RETRO')`,
    ),
    check(
      "project_meetings_time_order_ck",
      sql`${table.endsAt} > ${table.startsAt}`,
    ),
    check(
      "project_meetings_request_shape_ck",
      sql`${table.status} <> 'REQUESTED' or ${table.requestedByMembershipId} is not null`,
    ),
    check(
      "project_meetings_schedule_shape_ck",
      sql`${table.status} not in ('SCHEDULED', 'COMPLETED') or (${table.scheduledByUserId} is not null and ${table.meetingUrl} is not null)`,
    ),
  ],
);
