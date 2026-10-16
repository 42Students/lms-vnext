-- [chat-4] FAC-courses-14 FAC-assessments-01 LEARNER-course-detail-07
-- PROPOSAL ONLY. Do not run against production or register independently of DB05.
-- Integrate with W01's DB05 course-resource migration; duplicate table creation
-- must be reconciled with the staged Drizzle schema before journal registration.
CREATE TABLE IF NOT EXISTS lesson_content_materials (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 lesson_content_id uuid NOT NULL REFERENCES lesson_contents(id) ON DELETE CASCADE,
 kind text NOT NULL CHECK (kind IN ('LINK','FILE')),
 title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 255),
 external_url text,
 storage_key text,
 original_name text,
 mime_type text,
 size_bytes integer,
 sequence integer NOT NULL CHECK (sequence >= 0),
 created_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT lesson_content_materials_size_ck
  CHECK (size_bytes IS NULL OR (size_bytes>0 AND size_bytes<=52428800)),
 CONSTRAINT lesson_content_materials_shape_ck
  CHECK (
   (kind='LINK' AND external_url IS NOT NULL AND storage_key IS NULL
    AND original_name IS NULL AND mime_type IS NULL AND size_bytes IS NULL)
   OR
   (kind='FILE' AND external_url IS NULL AND storage_key IS NOT NULL
    AND original_name IS NOT NULL AND mime_type IS NOT NULL AND size_bytes IS NOT NULL)
  )
);
CREATE UNIQUE INDEX IF NOT EXISTS lesson_content_materials_content_sequence_uq
 ON lesson_content_materials(lesson_content_id,sequence);
CREATE UNIQUE INDEX IF NOT EXISTS lesson_content_materials_storage_key_uq
 ON lesson_content_materials(storage_key) WHERE storage_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS lesson_content_materials_content_kind_idx
 ON lesson_content_materials(lesson_content_id,kind);
-- Application service must enforce the legacy 20-material limit under row lock,
-- with duplicate-URL prevention scoped to one resource. File rows must only be
-- committed after the existing scoped object-upload grant and READY/scan check.
-- Never persist signed URLs; store opaque storage keys and issue read grants.
-- Gate every API and UI writer behind DB05_RESOURCE_MATERIALS_READY=DB05_VERIFIED.
