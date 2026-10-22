-- [chat-14] Legacy object key/receipt identity bridge; does not grant file access.
CREATE TABLE storage_legacy_file_crosswalks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
 owner_membership_id uuid NOT NULL,
 native_kind varchar(32) NOT NULL,
 native_asset_id uuid NOT NULL,
 legacy_receipt_id varchar(120),
 legacy_object_key_mac varchar(64),
 legacy_uploader_id integer,
 legacy_user_type varchar(24),
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT storage_legacy_crosswalk_membership_college_fk
  FOREIGN KEY(owner_membership_id,college_id) REFERENCES college_memberships(id,college_id) ON DELETE RESTRICT,
 CONSTRAINT storage_legacy_crosswalk_kind_ck
  CHECK(native_kind IN ('ASSIGNMENT_SUBMISSION_FILE','PROJECT_RESOURCE_FILE','LESSON_VIDEO')),
 CONSTRAINT storage_legacy_crosswalk_source_ck
  CHECK(legacy_receipt_id IS NOT NULL OR legacy_object_key_mac IS NOT NULL),
 CONSTRAINT storage_legacy_crosswalk_key_mac_ck
  CHECK(legacy_object_key_mac IS NULL OR legacy_object_key_mac ~ '^[a-f0-9]{64}$')
);
--> statement-breakpoint
CREATE UNIQUE INDEX storage_legacy_crosswalk_receipt_uq ON storage_legacy_file_crosswalks(college_id,legacy_receipt_id) WHERE legacy_receipt_id IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX storage_legacy_crosswalk_key_uq ON storage_legacy_file_crosswalks(college_id,legacy_object_key_mac) WHERE legacy_object_key_mac IS NOT NULL;
--> statement-breakpoint
CREATE INDEX storage_legacy_crosswalk_asset_idx ON storage_legacy_file_crosswalks(college_id,native_kind,native_asset_id);
