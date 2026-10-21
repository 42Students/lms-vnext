-- New workspace deletions preserve content; old deletions retain their honest irreversible status.
ALTER TABLE project_workspace ADD COLUMN recoverable_content BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE project_task ADD COLUMN deleted_by_workspace BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE project_sprint ADD COLUMN deleted_by_workspace BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE project_resource ADD COLUMN deleted_by_workspace BOOLEAN NOT NULL DEFAULT FALSE;
