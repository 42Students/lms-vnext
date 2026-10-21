import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  smallint,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import type { ProjectTemplateBlueprint } from "@/modules/projects/validation";
import type {MentorMeetingFacilitation} from "@/modules/projects/mentor-meeting-facilitation-model";
import { colleges } from "./colleges";
import { collegeMemberships } from "./memberships";
import { users } from "./users";
import { lmsGroups } from "./groups";
import { sections } from "./academics";

export const projectTemplates = pgTable(
  "project_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 96 }).notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    // Old template create defaults/status are import provenance only.
    legacyInitialWorkspaceStatus: varchar("legacy_initial_workspace_status", { length: 40 }),
    legacyCourseLabel: varchar("legacy_course_label", { length: 160 }),
    legacyPhase: varchar("legacy_phase", { length: 120 }),
    status: varchar("status", { length: 32 })
      .notNull()
      .default("DRAFT"),
    currentVersion: integer("current_version")
      .notNull()
      .default(1),
    legacyTaskFields: jsonb("legacy_task_fields").$type<Record<string, unknown>>(),
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

/**
 * Historic legacy template actions are append-only events. Do not collapse
 * same-numbered legacy actions into the immutable vNext blueprint version row.
 * The source snapshot is historical data and not an executable template.
 */
export const projectTemplateLegacyEvents = pgTable(
  "project_template_legacy_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    templateId: uuid("template_id")
      .notNull()
      .references(() => projectTemplates.id, { onDelete: "restrict" }),
    legacyEventId: integer("legacy_event_id"),
    legacyTemplateVersion: integer("legacy_template_version"),
    actionType: varchar("action_type", { length: 40 }),
    lifecycleStatus: varchar("lifecycle_status", { length: 20 }),
    snapshot: jsonb("snapshot").$type<Record<string, unknown>>(),
    sourceActorName: text("source_actor_name"),
    changedByUserId: uuid("changed_by_user_id")
      .references(() => users.id, { onDelete: "restrict" }),
    changedAt: timestamp("changed_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("project_template_legacy_events_template_source_uq")
      .on(table.templateId, table.legacyEventId)
      .where(sql`${table.legacyEventId} is not null`),
    index("project_template_legacy_events_template_time_idx")
      .on(table.templateId, table.changedAt),
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
    // Imported numeric identity and old five-state status, never permission scope.
    legacyProjectId: integer("legacy_project_id"),
    legacyStatus: varchar("legacy_status", { length: 32 }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    legacyTemplateBound: boolean("legacy_template_bound"),
    legacyRecoverableContent: boolean("legacy_recoverable_content"),
    legacyOverview: jsonb("legacy_overview").$type<Record<string, unknown>>(),
    legacyTemplateSnapshot: jsonb("legacy_template_snapshot").$type<Record<string, unknown>>(),
    // Source-only serialized meeting list; current meetings remain relational.
    legacyMeetingsList: jsonb("legacy_meetings_list").$type<unknown[]>(),
    legacyOrganizationId: integer("legacy_organization_id"),
    legacyClassId: integer("legacy_class_id"),
    legacyRevision: integer("legacy_revision"),
    slug: varchar("slug", { length: 96 }).notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    status: varchar("status", { length: 32 })
      .notNull()
      .default("PLANNED"),
    progressPercent: smallint("progress_percent").notNull().default(0),
    phase: varchar("phase", { length: 120 }),
    dueLabel: varchar("due_label", { length: 160 }),
    courseLabel: varchar("course_label", { length: 160 }),
    sectionId: uuid("section_id").references(() => sections.id, { onDelete: "restrict" }),
    blocker: text("blocker"),
    nextAction: text("next_action"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    sprintLengthWeeks: integer("sprint_length_weeks"),
    estimationUnit: varchar("estimation_unit", { length: 32 }).default("POINTS"),
    authoredBrief: jsonb("authored_brief").notNull().default(sql`'{"goal":"","description":"","deliverables":[],"completionConditions":[],"personas":[]}'::jsonb`),
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
    uniqueIndex("project_instances_college_legacy_id_uq")
      .on(table.collegeId, table.legacyProjectId)
      .where(sql`${table.legacyProjectId} is not null`),
    // Parent key for tenant-scoped composite FKs (project_resource_files).
    uniqueIndex("project_instances_id_college_uq").on(table.id, table.collegeId),
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
    index("project_instances_section_idx")
      .on(table.sectionId)
      .where(sql`${table.sectionId} is not null`),
    check("project_instances_progress_percent_ck", sql`${table.progressPercent} between 0 and 100`),
    check(
      "project_instances_sprint_length_weeks_ck",
      sql`${table.sprintLengthWeeks} is null or ${table.sprintLengthWeeks} between 1 and 104`,
    ),
    check(
      "project_instances_authored_brief_shape_ck",
      sql`jsonb_typeof(${table.authoredBrief}) = 'object'`,
    ),
    check(
      "project_instances_dates_ck",
      sql`${table.endDate} is null or ${table.startDate} is null or ${table.endDate} >= ${table.startDate}`,
    ),
    check(
      "project_instances_estimation_unit_ck",
      sql`${table.estimationUnit} is null or ${table.estimationUnit} in ('POINTS','HOURS','TASKS')`,
    ),
  ],
);

export const projectReleases = pgTable(
  "project_releases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    legacyReleaseId: integer("legacy_release_id"),
    legacyReleaseKey: varchar("legacy_release_key", {length: 120}),
    legacySortOrder: integer("legacy_sort_order"),
    legacyReleaseLabel: varchar("legacy_release_label", {length: 160}),
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
    targetDate: date("target_date", { mode: "string" }),
    notes: text("notes"),
    version: integer("version").notNull().default(0),
    legacyVersion: bigint("legacy_version", {mode:"number"}),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
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
    index("project_releases_source_order_idx").on(table.projectId,table.legacySortOrder,table.id),
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
    goal: text("goal"),
    legacyReleaseKey: varchar("legacy_release_key", { length: 120 }),
    dueLabel: varchar("due_label", { length: 160 }),
    legacySprintKey: varchar("legacy_sprint_key", { length: 120 }),
    legacySprintId: integer("legacy_sprint_id"),
    legacySortOrder: integer("legacy_sort_order"),
    legacyVersion: bigint("legacy_version", {mode:"number"}),
    legacyReleaseLabel: varchar("legacy_release_label", { length: 160 }),
    legacyDerivedStatus: varchar("legacy_derived_status", { length: 32 }),
    sprintNumber: integer("sprint_number"),
    startedByMembershipId: uuid("started_by_membership_id")
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedByMembershipId: uuid("completed_by_membership_id")
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedByWorkspace: boolean("deleted_by_workspace").notNull().default(false),
    definitionOfDone: text("definition_of_done"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    dueDate: date("due_date"),
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
    index("project_sprints_source_order_idx").on(table.projectId,table.releaseId,table.legacySortOrder,table.id),
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
      "project_sprints_dates_ck",
      sql`${table.startDate} is null or ${table.endDate} is null or ${table.endDate} >= ${table.startDate}`,
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
    /** NULL = product backlog task (MEN-projects-meetings-36/39). */
    sprintId: uuid("sprint_id").references(() => projectSprints.id, {
      onDelete: "restrict",
    }),
    carriedFromSprintId: uuid("carried_from_sprint_id").references(
      () => projectSprints.id,
      { onDelete: "restrict" },
    ),
    carriedOverAt: timestamp("carried_over_at", { withTimezone: true }),
    templateKey: varchar("template_key", {
      length: 64,
    }).notNull(),
    // Overlength source keys are preserved; runtime key remains strict 64.
    legacyTaskKey: varchar("legacy_task_key", { length: 120 }),
    legacyTaskId: integer("legacy_task_id"),
    legacySortOrder: integer("legacy_sort_order"),
    legacyCarriedFromSprintKey: varchar("legacy_carried_from_sprint_key", {length: 120}),
    legacyVersion: bigint("legacy_version", {mode:"number"}),
    title: text("title").notNull(),
    description: text("description"),
    dueLabel: varchar("due_label", { length: 160 }),
    legacySprintLabel: varchar("legacy_sprint_label", { length: 160 }),
    acceptanceCriteria: text("acceptance_criteria"),
    approach: text("approach"),
    priority: varchar("priority", { length: 16 })
      .notNull()
      .default("MEDIUM"),
    status: varchar("status", { length: 32 })
      .notNull()
      .default("TODO"),
    sequence: integer("sequence").notNull(),
    /** PR-S2-03: nullable for historical tasks; active-LEARNER-member scoping is enforced in the service. */
    assigneeMembershipId: uuid("assignee_membership_id").references(
      () => collegeMemberships.id,
      { onDelete: "restrict" },
    ),
    /** PR-S2-04: required when status is BLOCKED (enforced in the service). */
    blockerReason: text("blocker_reason"),
    // Historical display only: actual authorization uses active membership.
    legacyAssigneeType: varchar("legacy_assignee_type", { length: 32 }),
    legacyAssigneeName: text("legacy_assignee_name"),
    createdByMembershipId: uuid("created_by_membership_id")
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    updatedByMembershipId: uuid("updated_by_membership_id")
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedByWorkspace: boolean("deleted_by_workspace").notNull().default(false),
    dueDate: date("due_date", { mode: "string" }),
    estimatePoints: integer("estimate_points"),
    taskType: varchar("task_type", { length: 16 }).default("STORY"),
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
    uniqueIndex("project_tasks_project_id_id_uq").on(
      table.projectId,
      table.id,
    ),
    uniqueIndex("project_tasks_project_key_uq").on(
      table.projectId,
      table.templateKey,
    ),
    uniqueIndex("project_tasks_sprint_sequence_uq").on(
      table.sprintId,
      table.sequence,
    ),
    index("project_tasks_source_order_idx").on(table.projectId,table.sprintId,table.legacySortOrder,table.id),
    index("project_tasks_backlog_project_idx")
      .on(table.projectId, table.sequence)
      .where(sql`${table.sprintId} is null`),
    index("project_tasks_project_status_idx").on(
      table.projectId,
      table.status,
    ),
    index("project_tasks_active_order_idx")
      .on(table.projectId,table.sprintId,table.sequence,table.id)
      .where(sql`${table.deletedAt} is null`),
    index("project_tasks_assignee_membership_idx")
      .on(table.assigneeMembershipId)
      .where(sql`${table.assigneeMembershipId} is not null`),
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
    check(
      "project_tasks_estimate_points_ck",
      sql`${table.estimatePoints} is null or (${table.estimatePoints} >= 0 and ${table.estimatePoints} <= 1000)`,
    ),
    check(
      "project_tasks_task_type_ck",
      sql`${table.taskType} is null or ${table.taskType} in ('STORY', 'BUG', 'CHORE', 'SPIKE')`,
    ),
    check(
      "project_tasks_approach_length_ck",
      sql`${table.approach} is null or length(${table.approach}) <= 4000`,
    ),
  ],
);

/** PR-S2-04: task comments; composite FK keeps comments in the task's project. */
export const projectTaskComments = pgTable(
  "project_task_comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    legacyCommentId: integer("legacy_comment_id"),
    legacyProjectId: integer("legacy_project_id"),
    legacyTaskId: integer("legacy_task_id"),
    legacyCommenterId: integer("legacy_commenter_id"),
    legacyCommenterType: varchar("legacy_commenter_type", {length: 20}),
    legacyCommenterName: varchar("legacy_commenter_name", {length: 160}),
    legacyWasDeleted: boolean("legacy_was_deleted"),
    legacyBodyWasNull: boolean("legacy_body_was_null"),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectInstances.id, {
        onDelete: "restrict",
      }),
    taskId: uuid("task_id").notNull(),
    authorMembershipId: uuid("author_membership_id")
      .notNull()
      .references(() => collegeMemberships.id, {
        onDelete: "restrict",
      }),
    body: text("body").notNull(),
    commentKind: varchar("comment_kind", { length: 24 })
      .notNull()
      .default("NOTE"),
    progressValue: integer("progress_value"),
    taskStatusSnapshot: varchar("task_status_snapshot", { length: 30 }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
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
    foreignKey({
      name: "project_task_comments_project_task_fk",
      columns: [table.projectId, table.taskId],
      foreignColumns: [projectTasks.projectId, projectTasks.id],
    }).onDelete("restrict"),
    index("project_task_comments_task_time_idx").on(
      table.taskId,
      table.createdAt,
    ),
    index("project_task_comments_scoped_history_idx")
      .on(table.projectId,table.taskId,table.deletedAt,table.createdAt,table.id),
    check(
      "project_task_comments_body_ck",
      sql`length(trim(${table.body})) between 1 and 4000`,
    ),
    check(
      "project_task_comments_kind_ck",
      sql`${table.commentKind} in ('NOTE','PROGRESS_UPDATE','FLAG_FOR_MENTOR','PROGRESS','NEEDS_HELP','REVIEW','BLOCKED','STATUS_UPDATE')`,
    ),
    check("project_task_comments_progress_value_ck",
      sql`${table.progressValue} is null or ${table.progressValue} between 0 and 100`),
    index("project_task_comments_kind_idx").on(
      table.projectId,
      table.taskId,
      table.commentKind,
      table.createdAt,
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
    legacyResourceKey: varchar("legacy_resource_key", { length: 120 }),
    legacySortOrder: integer("legacy_sort_order"),
    legacyResourceKind: varchar("legacy_resource_kind", { length: 32 }),
    legacySprintKey: varchar("legacy_sprint_key", { length: 120 }),
    legacyTaskKey: varchar("legacy_task_key", { length: 120 }),
    legacyFileName: text("legacy_file_name"),
    legacyFileUrl: text("legacy_file_url"),
    legacyAttachmentUrl: text("legacy_attachment_url"),
    legacyDownloadUrl: text("legacy_download_url"),
    legacyUploadedByMembershipId: uuid("legacy_uploaded_by_membership_id")
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    description: text("description"),
    url: text("url"),
    resourceType: varchar("resource_type", { length: 24 }).notNull().default("LINK"),
    pinned: boolean("pinned").notNull().default(false),
    accessNotes: text("access_notes"),
    sprintId: uuid("sprint_id").references(() => projectSprints.id,{onDelete:"restrict"}),
    taskId: uuid("task_id").references(() => projectTasks.id,{onDelete:"restrict"}),

    required: boolean("required")
      .notNull()
      .default(false),
    sequence: integer("sequence").notNull(),
    status: varchar("status", { length: 32 })
      .notNull()
      .default("ACTIVE"),
    /** PR-S2-11: TEAM or MENTOR_ONLY. */
    visibility: varchar("visibility", { length: 16 })
      .notNull()
      .default("TEAM"),
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
    uniqueIndex("project_resources_id_project_uq").on(table.id, table.projectId),
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
      sql`${table.status} in ('ACTIVE', 'DRAFT', 'ARCHIVED')`,
    ),
    check(
      "project_resources_visibility_ck",
      sql`${table.visibility} in ('TEAM','MENTOR_ONLY')`,
    ),
    check("project_resources_type_ck",
      sql`${table.resourceType} in ('FILE','LINK','DOCUMENT','CODE','NOTE','ENVIRONMENT')`),
    check("project_resources_access_notes_ck",
      sql`${table.accessNotes} is null or length(${table.accessNotes}) <= 4000`),
    index("project_resources_sprint_idx").on(table.projectId,table.sprintId),
    index("project_resources_task_idx").on(table.projectId,table.taskId),
    index("project_resources_visibility_idx")
      .on(table.projectId, table.visibility)
      .where(sql`${table.status} = 'ACTIVE'`),
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
    /** PR-S2-08: fine-grained kind; read-only kinds can never mutate. */
    roleKind: varchar("role_kind", { length: 24 }).notNull(),
    canMutate: boolean("can_mutate").notNull(),
    isPrimary: boolean("is_primary")
      .notNull()
      .default(false),
    roleLabel: text("role_label"),
    legacyUserType: varchar("legacy_user_type", { length: 32 }),
    legacyMemberId: integer("legacy_member_id"),
    legacyVersion: bigint("legacy_version", {mode:"number"}),
    legacyRoleLabel: varchar("legacy_role_label", {length: 80}),
    legacyDisplayName: text("legacy_display_name"),
    legacyMemberStatus: varchar("legacy_member_status", { length: 32 }),
    deletedByWorkspace: boolean("deleted_by_workspace").notNull().default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
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
    index("project_members_source_type_idx").on(table.projectId,table.legacyUserType,table.membershipId),
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
      "project_members_role_kind_ck",
      sql`${table.roleKind} in ('LEARNER','MENTOR','CO_MENTOR','OBSERVER','REVIEWER','QA')`,
    ),
    check(
      "project_members_readonly_role_ck",
      sql`${table.roleKind} not in ('OBSERVER','REVIEWER','QA') or ${table.canMutate} = false`,
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
    legacyDeliveryId: integer("legacy_delivery_id"),
    legacySnapshot: text("legacy_snapshot"),
    legacyStatus: varchar("legacy_status", { length: 60 }),
    legacyRevisionCount: integer("legacy_revision_count"),
    legacyReviewStatus: varchar("legacy_review_status", { length: 60 }),
    legacyOptimisticVersion: integer("legacy_optimistic_version"),
    legacyFileName: varchar("legacy_file_name", { length: 255 }),
    legacyFileSize: integer("legacy_file_size"),
    legacyMimeType: varchar("legacy_mime_type", { length: 160 }),
    legacyStorageKey: text("legacy_storage_key"),
    legacySubmittedLocal: timestamp("legacy_submitted_local", { withTimezone: false }),
    legacyDraftSavedAt: timestamp("legacy_draft_saved_at", {withTimezone:true}),
    legacyDraftSavedByName: varchar("legacy_draft_saved_by_name", {length:160}),
    legacySubmittedByName: varchar("legacy_submitted_by_name", {length:160}),
    legacySubmittedByType: varchar("legacy_submitted_by_type", {length:40}),
    legacyReviewedByName: varchar("legacy_reviewed_by_name", {length:160}),
    legacyReviewedByType: varchar("legacy_reviewed_by_type", {length:40}),
    legacyLockedByName: varchar("legacy_locked_by_name", {length:160}),
    legacyLastUpdatedAt: timestamp("legacy_last_updated_at", {withTimezone:true}),
    legacyLastUpdatedByName: varchar("legacy_last_updated_by_name", {length:160}),
    legacyLastUpdatedByType: varchar("legacy_last_updated_by_type", {length:40}),
    legacyPrimaryAttachmentUrl: text("legacy_primary_attachment_url"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
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
    /** PR-S2-07: final-delivery lock/reopen markers; review history stays immutable. */
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    reopenedAt: timestamp("reopened_at", { withTimezone: true }),
    attachments: jsonb("attachments")
      .$type<unknown[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
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
    uniqueIndex("project_submissions_project_id_id_uq").on(
      table.projectId,
      table.id,
    ),
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
      "project_submissions_attachments_array_ck",
      sql`jsonb_typeof(${table.attachments}) = 'array'`,
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

/** PR-S2-07: append-only lock/reopen/attachment event log for final delivery. */
export const projectDeliveryEvents = pgTable(
  "project_delivery_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectInstances.id, {
        onDelete: "restrict",
      }),
    submissionId: uuid("submission_id").notNull(),
    eventType: varchar("event_type", { length: 24 }).notNull(),
    actorMembershipId: uuid("actor_membership_id")
      .notNull()
      .references(() => collegeMemberships.id, {
        onDelete: "restrict",
      }),
    reason: text("reason").notNull(),
    // Historical snapshots never authorize the current event actor.
    legacyAction: varchar("legacy_action", { length: 32 }),
    legacyStatus: varchar("legacy_status", { length: 60 }),
    legacyActorId: integer("legacy_actor_id"),
    legacyActorName: text("legacy_actor_name"),
    legacyActorType: varchar("legacy_actor_type", { length: 32 }),
    legacyNotes: text("legacy_notes"),
    legacyAttachmentUrl: text("legacy_attachment_url"),
    legacyFeedback: text("legacy_feedback"),
    legacyRevisionCount: integer("legacy_revision_count"),
    occurredAt: timestamp("occurred_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "project_delivery_events_submission_fk",
      columns: [table.projectId, table.submissionId],
      foreignColumns: [
        projectSubmissions.projectId,
        projectSubmissions.id,
      ],
    }).onDelete("restrict"),
    index("project_delivery_events_submission_history_idx")
      .on(table.projectId,table.submissionId,table.occurredAt,table.id),
    index("project_delivery_events_project_time_idx").on(
      table.projectId,
      table.occurredAt,
    ),
    check(
      "project_delivery_events_event_type_ck",
      sql`${table.eventType} in ('LOCKED', 'REOPENED', 'ATTACHMENTS_CHANGED')`,
    ),
    check(
      "project_delivery_events_reason_ck",
      sql`length(trim(${table.reason})) between 1 and 4000`,
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
    meetingKey: varchar("meeting_key", { length: 120 }),
    legacyMeetingId: integer("legacy_meeting_id"),
    legacyLocalStart: timestamp("legacy_local_start", {withTimezone:false}),
    legacyLocalEnd: timestamp("legacy_local_end", {withTimezone:false}),
    legacyTimeZone: varchar("legacy_time_zone", {length:80}),
    legacyOrganizerName: varchar("legacy_organizer_name", {length:160}),
    legacyOrganizerType: varchar("legacy_organizer_type", {length:32}),
    legacyCalendarSyncStatus: varchar("legacy_calendar_sync_status", {length:24}),
    legacyNeedsScheduleReview: boolean("legacy_needs_schedule_review").notNull().default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedByWorkspace: boolean("deleted_by_workspace").notNull().default(false),
    version: integer("version").notNull().default(0),
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
    facilitation: jsonb("facilitation").$type<MentorMeetingFacilitation>()
      .notNull().default(sql`'{}'::jsonb`),
    cancellationNote: text("cancellation_note"),
    calendarSyncError: varchar("calendar_sync_error", { length: 500 }),
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
    uniqueIndex("project_meetings_project_key_uq")
      .on(table.projectId, sql`lower(${table.meetingKey})`)
      .where(sql`${table.meetingKey} is not null`),
    index("project_meetings_legacy_id_idx")
      .on(table.projectId,table.legacyMeetingId)
      .where(sql`${table.legacyMeetingId} is not null`),
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
      sql`${table.status} in ('DRAFT', 'REQUESTED', 'SCHEDULED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED')`,
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
      sql`${table.status} not in ('SCHEDULED', 'RESCHEDULED', 'COMPLETED') or (${table.scheduledByUserId} is not null and ${table.meetingUrl} is not null)`,
    ),
    // MEN-projects-meetings-27: enforce the exact shape registered by the
    // unnumbered facilitation proposal once the orchestrator migrates it.
    check(
      "project_meetings_facilitation_object_ck",
      sql`jsonb_typeof(${table.facilitation}) = 'object'`,
    ),
  ],
);
