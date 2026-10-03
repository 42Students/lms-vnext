import { sql } from "drizzle-orm";
import {
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
