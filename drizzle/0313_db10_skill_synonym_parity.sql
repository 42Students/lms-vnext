-- DB-022: preserve legacy SkillSynonym multiplicity within and across skills.
-- Registered migration 0263 added an incorrect unique index. Replace it
-- without deleting data, modifying previously applied SQL or disabling the
-- separate synonym search / skill-parent indexes.
DROP INDEX IF EXISTS "db10_skill_synonyms_skill_value_uq";
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "db10_skill_synonyms_skill_value_idx"
 ON "skill_synonyms" ("skill_id", lower("synonym"));
