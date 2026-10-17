-- REC-home-drives-41: proposal only; orchestrator registers numbered migration.
-- Individual reviewer notes must NEVER become part of company-shared notes.
CREATE TABLE IF NOT EXISTS placement_recruiter_private_reviews (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 application_id uuid NOT NULL REFERENCES placement_applications(id) ON DELETE RESTRICT,
 recruiter_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 rating smallint,
 note text NOT NULL DEFAULT '',
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT prpr_rating_ck CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
 CONSTRAINT prpr_note_ck CHECK (length(note) <= 1000),
 CONSTRAINT prpr_recruiter_application_uq UNIQUE (recruiter_user_id, application_id)
);
CREATE INDEX IF NOT EXISTS prpr_application_idx ON placement_recruiter_private_reviews(application_id);
