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
 * - SkillUsageTracker: a SECOND, INDEPENDENT skill_usage counter keyed by
 *   lowercased free-text skill name, without a mandatory skills row.
 *
 * Preserve both counters until product semantics can be formally reconciled:
 * skills.usage_count powers SkillRepository weighted/popular rankings, while
 * skill_usage.usage_count + last_used power v2 SkillUsageTracker rankings.
 * Merging them silently changes active legacy ranking behavior.
 * Likewise, a synonym is not globally unique in legacy; one search term may
 * legitimately match multiple skills.
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
    /** Stable source INTEGER, resolved separately from the canonical UUID. */
    legacySkillId: integer("legacy_skill_id"),
    /** Lowercase/normalized search identity; displayName preserves presentation. */
    name: varchar("name", { length: 200 }).notNull(),
    displayName: varchar("display_name", { length: 200 }).notNull(),
    category: varchar("category", { length: 50 }),
    isActive: boolean("is_active").notNull().default(true),
    /** Legacy SkillRepository's popularity counter (distinct from skill_usage). */
    usageCount: integer("usage_count").notNull().default(0),
    searchPriority: integer("search_priority").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("db10_skills_name_uq").on(sql`lower(${t.name})`),
    uniqueIndex("db10_skills_legacy_id_uq")
      .on(t.legacySkillId).where(sql`${t.legacySkillId} is not null`),
    index("db10_skills_active_display_idx")
      .on(t.isActive,sql`lower(${t.displayName})`),
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
    legacySynonymId: integer("legacy_synonym_id"),
    legacySkillId: integer("legacy_skill_id"),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => db10Skills.id, { onDelete: "restrict" }),
    synonym: varchar("synonym", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("db10_skill_synonyms_legacy_id_uq")
      .on(t.legacySynonymId).where(sql`${t.legacySynonymId} is not null`),
    // Legacy SkillRepository.findBySynonym uses DISTINCT and can return multiple
    // skills per term. This MUST NOT be globally unique.
    index("db10_skill_synonyms_search_idx").on(sql`lower(${t.synonym})`),
    uniqueIndex("db10_skill_synonyms_skill_value_uq")
      .on(t.skillId,sql`lower(${t.synonym})`),
    index("db10_skill_synonyms_skill_idx").on(t.skillId),
    check("db10_skill_synonyms_value_ck", sql`length(trim(${t.synonym})) > 0`),
  ],
);

/**
 * Active legacy v2 SkillUsageTracker writes a name-keyed counter independently
 * of skills.usage_count. Do not add a skill_id FK: free-text names can be
 * recorded before catalog match and search only projects matched names.
 * Registration and integration remain Chat 1-owned.
 */
export const db10SkillUsage = pgTable(
  "skill_usage",
  {
    skillName: varchar("skill_name", { length: 200 }).primaryKey(),
    usageCount: integer("usage_count").notNull().default(0),
    lastUsed: timestamp("last_used", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("db10_skill_usage_name_ck", sql`length(trim(${t.skillName})) > 0`),
    check("db10_skill_usage_count_ck", sql`${t.usageCount} >= 0`),
  ],
);

/** A source synonym is unique per skill after case folding, but the same
 * spelling may intentionally belong to multiple skill UUIDs. Import via
 * idempotent per-skill upsert; never impose global synonym uniqueness. */
export const SKILL_SYNONYM_IMPORT_POLICY={
 perSkillCaseInsensitiveUniqueness:true,
 allowManySkillsPerSynonym:true,
 preserveLegacyIntegerIds:true,
 importIsIdempotent:true,
} as const;
