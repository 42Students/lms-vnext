-- REC-home-drives-41 (proposed, register a numbered migration centrally).
-- Author-only recruiter rating and 1000-character private note.
CREATE TABLE IF NOT EXISTS placement_recruiter_private_reviews (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 recruiter_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 application_id uuid NOT NULL REFERENCES placement_applications(id) ON DELETE RESTRICT,
 rating integer,
 note text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT prpr_recruiter_application_uq UNIQUE (recruiter_user_id,application_id),
 CONSTRAINT prpr_rating_ck CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
 CONSTRAINT prpr_note_ck CHECK (char_length(note) <= 1000)
);
CREATE INDEX IF NOT EXISTS prpr_app_id_idx ON placement_recruiter_private_reviews(application_id);
