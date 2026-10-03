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
    }).notNull(),
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
