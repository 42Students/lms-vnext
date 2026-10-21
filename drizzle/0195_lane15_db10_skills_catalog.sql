-- [chat-15] Canonical numbered DB10 skill tables. Source-provenance IDs are not seed data; catalog remains fail-closed until PostgreSQL replay and actual seed reconciliation.
-- Preserve independently tracked skills.usage_count and skill_usage.usage_count.
CREATE TABLE skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_skill_id integer,
  name varchar(200) NOT NULL,
  display_name varchar(200) NOT NULL,
  category varchar(50),
  is_active boolean NOT NULL DEFAULT true,
  usage_count integer NOT NULL DEFAULT 0,
  search_priority integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT db10_skills_name_ck CHECK (length(trim(name)) > 0),
  CONSTRAINT db10_skills_display_name_ck CHECK (length(trim(display_name)) > 0),
  CONSTRAINT db10_skills_usage_ck CHECK (usage_count >= 0),
  CONSTRAINT db10_skills_priority_ck CHECK (search_priority BETWEEN 0 AND 100)
);
--> statement-breakpoint
CREATE UNIQUE INDEX db10_skills_name_uq ON skills(lower(name));
--> statement-breakpoint
CREATE UNIQUE INDEX db10_skills_legacy_id_uq ON skills(legacy_skill_id)
  WHERE legacy_skill_id IS NOT NULL;
--> statement-breakpoint
CREATE INDEX db10_skills_active_category_name_idx ON skills(is_active, category, display_name);
--> statement-breakpoint
CREATE INDEX db10_skills_popularity_idx ON skills(is_active, usage_count, search_priority);
--> statement-breakpoint
CREATE TABLE skill_synonyms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_synonym_id integer,
  legacy_skill_id integer,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE RESTRICT,
  synonym varchar(100) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT db10_skill_synonyms_value_ck CHECK (length(trim(synonym)) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX db10_skill_synonyms_legacy_id_uq ON skill_synonyms(legacy_synonym_id)
  WHERE legacy_synonym_id IS NOT NULL;
--> statement-breakpoint
CREATE INDEX db10_skill_synonyms_search_idx ON skill_synonyms(lower(synonym));
--> statement-breakpoint
CREATE INDEX db10_skill_synonyms_skill_idx ON skill_synonyms(skill_id);
--> statement-breakpoint
CREATE TABLE skill_usage (
  skill_name varchar(200) PRIMARY KEY,
  usage_count integer NOT NULL DEFAULT 0,
  last_used timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT db10_skill_usage_name_ck CHECK (length(trim(skill_name)) > 0),
  CONSTRAINT db10_skill_usage_count_ck CHECK (usage_count >= 0)
);
