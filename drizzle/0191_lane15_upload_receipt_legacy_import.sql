ALTER TABLE course_upload_receipts
 ADD COLUMN IF NOT EXISTS legacy_receipt_id varchar(120),
 ADD COLUMN IF NOT EXISTS legacy_owner_user_id integer,
 ADD COLUMN IF NOT EXISTS legacy_owner_user_type varchar(32),
 ADD COLUMN IF NOT EXISTS legacy_folder varchar(64),
 ADD COLUMN IF NOT EXISTS legacy_lesson_content_id integer,
 ADD COLUMN IF NOT EXISTS legacy_was_deleted boolean,
 ADD COLUMN IF NOT EXISTS legacy_source_created_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS course_upload_receipts_legacy_id_uq
 ON course_upload_receipts(legacy_receipt_id) WHERE legacy_receipt_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS course_upload_receipts_legacy_content_idx
 ON course_upload_receipts(legacy_lesson_content_id)
 WHERE legacy_lesson_content_id IS NOT NULL;
ALTER TABLE course_upload_receipts ADD CONSTRAINT course_upload_receipts_legacy_folder_ck
 CHECK (legacy_folder IS NULL OR
  (legacy_folder='assignment' AND purpose='ASSIGNMENT_SUBMISSION') OR
  (legacy_folder='lesson-content' AND purpose='COURSE_RESOURCE'));
ALTER TABLE course_upload_receipts ADD CONSTRAINT course_upload_receipts_legacy_deleted_ck
 CHECK (legacy_was_deleted IS DISTINCT FROM TRUE OR deleted_at IS NOT NULL);
