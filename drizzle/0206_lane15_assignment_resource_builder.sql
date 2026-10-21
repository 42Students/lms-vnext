CREATE TABLE IF NOT EXISTS course_assignment_resources(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 assignment_id uuid NOT NULL REFERENCES course_assignments(id) ON DELETE RESTRICT,
 kind varchar(16) NOT NULL,
 title varchar(255) NOT NULL,
 body text, external_url text, private_object_key varchar(1024),
 content_type varchar(128), content_bytes integer,sha256_hex varchar(64),
 object_generation varchar(64),
 position integer NOT NULL,
 created_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT course_assignment_resources_kind_ck CHECK(kind IN ('INSTRUCTIONS','PDF','FILE','LINK')),
 CONSTRAINT course_assignment_resources_position_ck CHECK(position BETWEEN 0 AND 99),
 CONSTRAINT course_assignment_resources_title_ck CHECK(length(btrim(title)) BETWEEN 1 AND 255),
 CONSTRAINT course_assignment_resources_shape_ck CHECK(
  (kind='INSTRUCTIONS' AND body IS NOT NULL AND length(btrim(body)) BETWEEN 1 AND 10000
   AND external_url IS NULL AND private_object_key IS NULL)
  OR (kind='LINK' AND body IS NULL AND external_url ~ '^https://[^[:space:]]+$'
      AND length(external_url)<=2048 AND private_object_key IS NULL)
  OR (kind IN ('PDF','FILE') AND body IS NULL AND external_url IS NULL
      AND private_object_key IS NOT NULL AND content_bytes BETWEEN 1 AND 52428800
      AND sha256_hex ~ '^[a-f0-9]{64}$' AND object_generation IS NOT NULL
      AND content_type IS NOT NULL AND (kind<>'PDF' OR content_type='application/pdf'))
 )
);
CREATE UNIQUE INDEX IF NOT EXISTS course_assignment_resources_position_uq
 ON course_assignment_resources(assignment_id,position);
CREATE UNIQUE INDEX IF NOT EXISTS course_assignment_resources_one_instructions_uq
 ON course_assignment_resources(assignment_id) WHERE kind='INSTRUCTIONS';
CREATE INDEX IF NOT EXISTS course_assignment_resources_assignment_kind_idx
 ON course_assignment_resources(assignment_id,kind);
