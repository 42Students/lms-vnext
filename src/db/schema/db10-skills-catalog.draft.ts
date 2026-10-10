/**
 * DB10 skills catalog schema DRAFT ONLY.
 *
 * Chat 1 owns migration registration and src/db/schema/index.ts. This file is
 * deliberately unexported until the DB10 source contract is reviewed and a
 * numbered migration is replayed on disposable PostgreSQL.
 *
 * Legacy runtime evidence:
 * - Skill / SkillRepository: active searchable catalog, category filters,
 *   popularity ranking, search_priority boost and atomic usage increments.
 * - SkillSynonym / SkillSynonymRepository: persisted alternate terms.
 * - SkillUsageTracker: a second v2-only skill_usage counter keyed by name.
 *
 * Greenfield redesign: collapse the duplicate legacy usage counters into the
 * canonical skill row. last_used_at preserves the active v2 recency concept.
 * This is a documented semantic redesign, not a historical-data migration.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const db10Skills = pgTable(
  "skills",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** Lowercase/normalized search identity; displayName preserves presentation. */
    name: varchar("name", { length: 200 }).notNull(),
    displayName: varchar("display_name", { length: 200 }).notNull(),
    category: varchar("category", { length: 50 }),
    isActive: boolean("is_active").notNull().default(true),
    /** Canonical counter for both legacy SkillRepository and v2 SkillUsageTracker writes. */
    usageCount: integer("usage_count").notNull().default(0),
    searchPriority: integer("search_priority").notNull().default(0),
    /** Replaces skill_usage.last_used after collapsing that duplicate counter table. */
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("db10_skills_name_uq").on(sql`lower(${t.name})`),
    index("db10_skills_active_category_name_idx")
      .on(t.isActive, t.category, t.displayName),
    index("db10_skills_popularity_idx")
      .on(t.isActive, t.usageCount, t.searchPriority),
    check("db10_skills_name_ck", sql`length(trim(${t.name})) > 0`),
    check("db10_skills_display_name_ck", sql`length(trim(${t.displayName})) > 0`),
    check("db10_skills_usage_ck", sql`${t.usageCount} >= 0`),
    check("db10_skills_priority_ck", sql`${t.searchPriority} between 0 and 100`),
  ],
);

export const db10SkillSynonyms = pgTable(
  "skill_synonyms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => db10Skills.id, { onDelete: "restrict" }),
    synonym: varchar("synonym", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Legacy loader/repository treats one synonym as a global alias, not one alias per skill.
    uniqueIndex("db10_skill_synonyms_value_uq").on(sql`lower(${t.synonym})`),
    index("db10_skill_synonyms_skill_idx").on(t.skillId),
    check("db10_skill_synonyms_value_ck", sql`length(trim(${t.synonym})) > 0`),
  ],
);
