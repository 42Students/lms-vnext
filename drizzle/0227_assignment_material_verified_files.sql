-- [chat-14] Assignment resource lifecycle. Unregistered until signed upload and audience services integrate.
ALTER TABLE course_assignment_materials ADD COLUMN source varchar(12) NOT NULL DEFAULT 'DIRECT';
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD COLUMN storage_key text;
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD COLUMN original_name varchar(255);
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD COLUMN mime_type varchar(128);
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD COLUMN size_bytes bigint;
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD COLUMN upload_status varchar(16) NOT NULL DEFAULT 'READY';
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD COLUMN upload_token_hash varchar(64);
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD COLUMN upload_expires_at timestamptz;
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD COLUMN object_generation text;
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD COLUMN scan_status varchar(16) NOT NULL DEFAULT 'PENDING';
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD COLUMN scan_attested_by varchar(80);
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD COLUMN scan_attested_at timestamptz;
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD COLUMN verified_size_bytes bigint;
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD COLUMN verified_content_type varchar(128);
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD COLUMN completed_at timestamptz;
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD COLUMN failure_code varchar(64);
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD COLUMN legacy_file_dto jsonb;
--> statement-breakpoint
ALTER TABLE course_assignment_materials ALTER COLUMN external_url DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE course_assignment_materials DROP CONSTRAINT course_assignment_materials_link_ck;
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD CONSTRAINT course_assignment_materials_kind_ck CHECK (kind IN ('LINK','FILE'));
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD CONSTRAINT course_assignment_materials_source_ck CHECK (source IN ('DIRECT','DRIVE'));
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD CONSTRAINT course_assignment_materials_title_ck CHECK (length(trim(title)) BETWEEN 1 AND 160);
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD CONSTRAINT course_assignment_materials_shape_ck CHECK ((kind='LINK' AND external_url IS NOT NULL AND storage_key IS NULL) OR (kind='FILE' AND external_url IS NULL AND storage_key IS NOT NULL AND original_name IS NOT NULL AND mime_type IS NOT NULL AND size_bytes IS NOT NULL));
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD CONSTRAINT course_assignment_materials_url_ck CHECK (external_url IS NULL OR (external_url ~ '^https://[^[:space:]]+$' AND length(external_url) BETWEEN 10 AND 2048));
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD CONSTRAINT course_assignment_materials_size_ck CHECK (size_bytes IS NULL OR size_bytes BETWEEN 1 AND 52428800);
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD CONSTRAINT course_assignment_materials_upload_status_ck CHECK (upload_status IN ('UPLOADING','VERIFYING','READY','QUARANTINED','FAILED','DELETED'));
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD CONSTRAINT course_assignment_materials_scan_ck CHECK (scan_status IN ('PENDING','CLEAN','REJECTED'));
--> statement-breakpoint
ALTER TABLE course_assignment_materials ADD CONSTRAINT course_assignment_materials_file_ready_ck CHECK (kind <> 'FILE' OR upload_status <> 'READY' OR (scan_status='CLEAN' AND scan_attested_by IS NOT NULL AND scan_attested_at IS NOT NULL AND object_generation ~ '^[0-9]+$' AND verified_size_bytes BETWEEN 1 AND 52428800 AND verified_content_type IS NOT NULL AND completed_at IS NOT NULL));
