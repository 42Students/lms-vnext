-- [chat-4] FAC-courses-14 FAC-assessments-01 LEARNER-course-detail-07
-- SCHEMA DELTA ONLY for W01's canonical lesson_content_materials declaration.
-- DO NOT create the table here: W01 first registers the staged
-- src/db/schema/lesson-content-materials-staged.ts base with its exact
-- columns and constraints (id, lesson_content_id, kind, title, external_url,
-- storage_key, original_name, mime_type, size_bytes, sequence,
-- created_by_user_id, created_at, updated_at), unique indexes and FKs.
-- This proposal adds ONLY absent lifecycle/notes columns. Do not
-- recreate lesson_content_materials or duplicate its existing constraints.
ALTER TABLE "lesson_content_materials"
 ADD COLUMN IF NOT EXISTS "notes" text,
 ADD COLUMN IF NOT EXISTS "upload_status" text NOT NULL DEFAULT 'READY',
 ADD COLUMN IF NOT EXISTS "upload_token_hash" varchar(64),
 ADD COLUMN IF NOT EXISTS "upload_expires_at" timestamptz,
 ADD COLUMN IF NOT EXISTS "object_generation" text,
 ADD COLUMN IF NOT EXISTS "scan_status" varchar(16) NOT NULL DEFAULT 'PENDING',
 ADD COLUMN IF NOT EXISTS "scan_attested_by" varchar(80),
 ADD COLUMN IF NOT EXISTS "scan_attested_at" timestamptz,
 ADD COLUMN IF NOT EXISTS "verified_size_bytes" bigint,
 ADD COLUMN IF NOT EXISTS "verified_content_type" varchar(128),
 ADD COLUMN IF NOT EXISTS "completed_at" timestamptz,
 ADD COLUMN IF NOT EXISTS "failure_code" varchar(64);
-- Link materials have no binary upload and retain READY state. An upload
-- service MUST explicitly create FILE rows as UPLOADING, never using the default.
ALTER TABLE "lesson_content_materials"
 ADD CONSTRAINT "lesson_content_materials_upload_status_ck" CHECK
 (upload_status IN ('UPLOADING','VERIFYING','READY','QUARANTINED','FAILED','DELETED')),
 ADD CONSTRAINT "lesson_content_materials_scan_status_ck" CHECK
 (scan_status IN ('PENDING','CLEAN','REJECTED')),
 ADD CONSTRAINT "lesson_content_materials_ready_ck" CHECK
 (kind <> 'FILE' OR upload_status <> 'READY' OR
  (scan_status = 'CLEAN' AND scan_attested_by IS NOT NULL
   AND scan_attested_at IS NOT NULL AND object_generation IS NOT NULL
   AND verified_size_bytes BETWEEN 1 AND 52428800
   AND verified_content_type IS NOT NULL AND completed_at IS NOT NULL));
-- W01 owns migration registration, composite tenant/owner FKs and replay.
-- Signed upload/download grants are request-only. Never store signed URLs.
-- Writers/readers remain gated until this delta, the canonical base,
-- and private storage/scanner permissions have been independently verified.
