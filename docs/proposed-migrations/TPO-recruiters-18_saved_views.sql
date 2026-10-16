-- Proposed registration only. Owner must register this in the serialized migration journal.
-- TPO-recruiters-18: per-college, per-owner filter/column view definitions.
CREATE TABLE IF NOT EXISTS placement_tpo_recruiter_saved_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  owner_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  name varchar(100) NOT NULL,
  note varchar(500),
  query_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  columns_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tpo_recruiter_saved_view_name_uq UNIQUE(college_id,owner_user_id,name),
  CONSTRAINT tpo_recruiter_saved_view_query_ck CHECK(jsonb_typeof(query_json)='object'),
  CONSTRAINT tpo_recruiter_saved_view_columns_ck CHECK(jsonb_typeof(columns_json)='array')
);
CREATE INDEX IF NOT EXISTS tpo_recruiter_saved_views_owner_idx
  ON placement_tpo_recruiter_saved_views(college_id,owner_user_id,pinned DESC,updated_at DESC);
-- Pin limit (5) is enforced with a serialized owner row lock in the write service.
