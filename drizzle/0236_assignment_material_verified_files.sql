-- [chat-14] Assignment resource lifecycle. Unregistered until signed upload and audience services integrate.
ALTER TABLE course_assignment_materials ADD COLUMN IF NOT EXISTS source varchar(12) NOT NULL DEFAULT 'DIRECT';
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD COLUMN IF NOT EXISTS storage_key text;
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD COLUMN IF NOT EXISTS original_name varchar(255);
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD COLUMN IF NOT EXISTS mime_type varchar(128);
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD COLUMN IF NOT EXISTS size_bytes bigint;
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD COLUMN IF NOT EXISTS upload_status varchar(16) NOT NULL DEFAULT 'READY';
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD COLUMN IF NOT EXISTS upload_token_hash varchar(64);
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD COLUMN IF NOT EXISTS upload_expires_at timestamptz;
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD COLUMN IF NOT EXISTS object_generation text;
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD COLUMN IF NOT EXISTS scan_status varchar(16) NOT NULL DEFAULT 'PENDING';
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD COLUMN IF NOT EXISTS scan_attested_by varchar(80);
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD COLUMN IF NOT EXISTS scan_attested_at timestamptz;
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD COLUMN IF NOT EXISTS verified_size_bytes bigint;
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD COLUMN IF NOT EXISTS verified_content_type varchar(128);
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD COLUMN IF NOT EXISTS completed_at timestamptz;
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD COLUMN IF NOT EXISTS failure_code varchar(64);
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD COLUMN IF NOT EXISTS legacy_file_dto jsonb;
--> statement-breakpoint
ALTER TABLE course_assignment_materials ALTER COLUMN external_url DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE course_assignment_materials DROP CONSTRAINT course_assignment_materials_link_ck;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE course_assignment_materials ADD CONSTRAINT course_assignment_materials_kind_ck CHECK (kind IN ('LINK','FILE'))$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE course_assignment_materials ADD CONSTRAINT course_assignment_materials_source_ck CHECK (source IN ('DIRECT','DRIVE'))$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE course_assignment_materials ADD CONSTRAINT course_assignment_materials_title_ck CHECK (length(trim(title)) BETWEEN 1 AND 160)$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE course_assignment_materials ADD CONSTRAINT course_assignment_materials_shape_ck CHECK ((kind='LINK' AND external_url IS NOT NULL AND storage_key IS NULL) OR (kind='FILE' AND external_url IS NULL AND storage_key IS NOT NULL AND original_name IS NOT NULL AND mime_type IS NOT NULL AND size_bytes IS NOT NULL))$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE course_assignment_materials ADD CONSTRAINT course_assignment_materials_url_ck CHECK (external_url IS NULL OR (external_url ~ '^https://[^[:space:]]+$' AND length(external_url) BETWEEN 10 AND 2048))$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE course_assignment_materials ADD CONSTRAINT course_assignment_materials_size_ck CHECK (size_bytes IS NULL OR size_bytes BETWEEN 1 AND 52428800)$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE course_assignment_materials ADD CONSTRAINT course_assignment_materials_upload_status_ck CHECK (upload_status IN ('UPLOADING','VERIFYING','READY','QUARANTINED','FAILED','DELETED'))$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE course_assignment_materials ADD CONSTRAINT course_assignment_materials_scan_ck CHECK (scan_status IN ('PENDING','CLEAN','REJECTED'))$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE course_assignment_materials ADD CONSTRAINT course_assignment_materials_file_ready_ck CHECK (kind <> 'FILE' OR upload_status <> 'READY' OR (scan_status='CLEAN' AND scan_attested_by IS NOT NULL AND scan_attested_at IS NOT NULL AND object_generation ~ '^[0-9]+$' AND verified_size_bytes BETWEEN 1 AND 52428800 AND verified_content_type IS NOT NULL AND completed_at IS NOT NULL))$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
