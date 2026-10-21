-- Concurrent/double-submitted bulk-create requests (bulkCreateProjectsForClass) could each read
-- the same "learners already covered" snapshot and both create a workspace for the same learner
-- under the same class+template, since project_workspace itself carries no column identifying
-- which single learner an auto-generated workspace was created for and thus nothing for the DB
-- to enforce uniqueness against. bulk_learner_id is set only by that creation path; MySQL treats
-- NULL as distinct in a unique index, so manually created (possibly multi-learner) workspaces,
-- which leave it null, are never constrained by this index.
ALTER TABLE project_workspace ADD COLUMN bulk_learner_id INT NULL AFTER template_id;
ALTER TABLE project_workspace ADD UNIQUE KEY uk_project_workspace_bulk_learner (class_id, template_id, bulk_learner_id);
