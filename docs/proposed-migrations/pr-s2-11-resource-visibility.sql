-- PR-S2-11 staged only; orchestrator registers after scope and negative tests.
ALTER TABLE project_resources
  ADD COLUMN visibility varchar(16) NOT NULL DEFAULT 'TEAM';
ALTER TABLE project_resources ADD CONSTRAINT project_resources_visibility_ck
  CHECK (visibility IN ('TEAM','MENTOR_ONLY'));
CREATE INDEX project_resources_visibility_idx ON project_resources(project_id,visibility)
  WHERE status='ACTIVE';
-- After registration, project-resource read/query must filter visibility for
-- LEARNER while retaining college/active-member checks. Create/update requests
-- must validate visibility and preserve mentor-only restrictions on export.
