-- Provenance ensures restore does not revive members/meetings removed before workspace deletion.
ALTER TABLE project_member ADD COLUMN deleted_by_workspace BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE project_meeting ADD COLUMN deleted_by_workspace BOOLEAN NOT NULL DEFAULT FALSE;
-- Creator identity must be typed: faculty and learner IDs are independent sequences.
-- Historical creator type is unknown; legacy tasks deliberately fail closed for learner self-delete.
ALTER TABLE project_task ADD COLUMN created_by_type VARCHAR(20) NULL;
