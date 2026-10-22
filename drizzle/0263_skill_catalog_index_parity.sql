-- [chat-14] Search performance and restartable per-skill synonym reconciliation.
CREATE INDEX IF NOT EXISTS db10_skills_active_display_idx ON skills(is_active,lower(display_name));
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS db10_skill_synonyms_skill_value_uq
 ON skill_synonyms(skill_id,lower(synonym));
