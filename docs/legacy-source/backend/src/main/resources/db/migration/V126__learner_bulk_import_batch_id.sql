-- B3 in the super-admin audit: "A bad bulk import has no undo. 200 wrongly-created learners
-- can't be reversed as a batch -- no import batch id, no grouping, no 'undo this import'."
--
-- Every learner created through LearnerServiceImpl.bulkRegister is now stamped with a UUID
-- shared by every row from that one import call, so an admin can see "this batch of 200 rows"
-- as a unit and soft-delete (undo) the whole batch, reusing the existing isDeleted convention --
-- reversible the same way every other suspend/delete action in this console already is. NULL for
-- every learner created any other way (manual create, single registration, etc.).

ALTER TABLE learner
    ADD COLUMN bulk_import_batch_id VARCHAR(64) NULL;

CREATE INDEX idx_learner_bulk_import_batch_id ON learner (bulk_import_batch_id);
