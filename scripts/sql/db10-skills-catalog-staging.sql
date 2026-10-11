-- DB-022 DB10 skill catalog — STAGING ONLY, NOT A NUMBERED MIGRATION.
-- Oracle: 42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5
-- Skill.java / SkillSynonym.java / SkillRepository.java / SkillUsageTracker.java
-- Chat 1 owns integration into drizzle/meta and src/db/schema/index.ts.
CREATE TABLE skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(200) NOT NULL,
  display_name varchar(200) NOT NULL,
  category varchar(50),
  is_active boolean NOT NULL DEFAULT true,
  usage_count integer NOT NULL DEFAULT 0,
  search_priority integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT db10_skills_name_ck CHECK (length(btrim(name)) > 0),
  CONSTRAINT db10_skills_display_name_ck CHECK (length(btrim(display_name)) > 0),
  CONSTRAINT db10_skills_usage_ck CHECK (usage_count >= 0),
  CONSTRAINT db10_skills_priority_ck CHECK (search_priority BETWEEN 0 AND 100)
);
CREATE UNIQUE INDEX db10_skills_name_uq ON skills ((lower(name)));
CREATE INDEX db10_skills_active_category_name_idx ON skills (is_active,category,display_name);
CREATE INDEX db10_skills_popularity_idx ON skills (is_active,usage_count,search_priority);

CREATE TABLE skill_synonyms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE RESTRICT,
  synonym varchar(100) NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT db10_skill_synonyms_value_ck CHECK (length(btrim(synonym)) > 0)
);
-- Legacy synonym lookup can return multiple skills for the same alias.
-- NO global UNIQUE synonym constraint (unlike the superseded initial draft).
CREATE INDEX db10_skill_synonyms_search_idx ON skill_synonyms ((lower(synonym)));
CREATE INDEX db10_skill_synonyms_skill_idx ON skill_synonyms (skill_id);

CREATE TABLE skill_usage (
  skill_name varchar(200) PRIMARY KEY,
  usage_count integer NOT NULL DEFAULT 0,
  last_used timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT db10_skill_usage_name_ck CHECK (length(btrim(skill_name)) > 0),
  CONSTRAINT db10_skill_usage_count_ck CHECK (usage_count >= 0)
);
-- IMPORTANT: skills.usage_count (SkillRepository) and
-- skill_usage.usage_count (SkillUsageTracker) are separate active counters.
-- A free-text skill_usage name need not resolve to a skills row; NO FK.
-- Legacy SkillUsageTracker.recordUsage uses toLowerCase() WITHOUT trim().
-- Preserve leading/trailing whitespace distinction for parity (e.g. 'Java' vs ' Java');
-- do not conflate with searchSkills(), which trims an incoming search QUERY.
-- Intentional blank-name hardening remains a documented DB22 exception pending approval.
-- Future writer must use atomic INSERT ... ON CONFLICT DO UPDATE:
--   INSERT INTO skill_usage(skill_name,usage_count,last_used)
--   VALUES(lower(:name),1,clock_timestamp())
--   ON CONFLICT(skill_name) DO UPDATE SET
--       usage_count=skill_usage.usage_count+1,last_used=clock_timestamp();
-- Search filters inactive skills and can return multiple matching aliases.
-- Greenfield only. NO old rows/data migration. PostgreSQL tests NOT RUN.
