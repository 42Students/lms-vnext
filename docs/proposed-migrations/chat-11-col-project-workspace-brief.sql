-- COL-projects-03 / SA-placements-projects-90 / MEN-projects-meetings-20
-- Workspace-authored brief is distinct from the immutable template blueprint.
-- Orchestrator should register as next numbered migration before enabling writes.
ALTER TABLE project_instances ADD COLUMN IF NOT EXISTS authored_brief jsonb
  NOT NULL DEFAULT '{"goal":"","description":"","deliverables":[],"completionConditions":[],"personas":[]}'::jsonb;
ALTER TABLE project_instances ADD CONSTRAINT project_instances_authored_brief_shape_ck
  CHECK (jsonb_typeof(authored_brief) = 'object');
-- The service must enforce college scope, max row counts, optimistic updated_at,
-- and include actor audit on every change. A workspace brief never mutates a published template version.
