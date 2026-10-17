-- MEN-projects-meetings-42/43: staged only. Orchestrator must assign/register migration.
-- Do not enable comment kind controls until this SQL has been applied.
ALTER TABLE project_task_comments
  ADD COLUMN comment_kind varchar(24) NOT NULL DEFAULT 'NOTE';
ALTER TABLE project_task_comments
  ADD CONSTRAINT project_task_comments_kind_ck
  CHECK (comment_kind IN ('NOTE','PROGRESS_UPDATE','FLAG_FOR_MENTOR'));
CREATE INDEX project_task_comments_kind_idx
  ON project_task_comments (project_id, task_id, comment_kind, created_at);
