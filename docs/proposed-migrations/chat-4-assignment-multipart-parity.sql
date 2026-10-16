-- [chat-4] FAC-assessments-01 FAC-assessments-02 LEARNER-course-detail-04
-- DB proposal only; orchestrator registers after verification.
ALTER TABLE course_assignments ADD COLUMN IF NOT EXISTS allowed_submission_methods jsonb
 NOT NULL DEFAULT '["WRITTEN_RESPONSE","PDF_UPLOAD","FILE_UPLOAD","REPOSITORY_LINK","EXTERNAL_LINK"]'::jsonb;
ALTER TABLE course_assignments ADD CONSTRAINT course_assignments_methods_shape_ck
 CHECK(jsonb_typeof(allowed_submission_methods)='array' AND
       jsonb_array_length(allowed_submission_methods) BETWEEN 1 AND 5);
ALTER TABLE assignment_submissions DROP CONSTRAINT IF EXISTS assignment_submissions_payload_ck;
ALTER TABLE assignment_submissions ADD CONSTRAINT assignment_submissions_payload_ck CHECK (
 (submission_type='TEXT' AND text_content IS NOT NULL AND length(btrim(text_content))>0 AND submission_url IS NULL)
 OR (submission_type='LINK' AND submission_url IS NOT NULL AND text_content IS NULL)
 OR (submission_type='FILE'));
CREATE TABLE IF NOT EXISTS assignment_submission_links (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 submission_id uuid NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,
 sequence integer NOT NULL CHECK(sequence BETWEEN 0 AND 19),
 kind text NOT NULL CHECK(kind IN ('REPOSITORY_LINK','EXTERNAL_LINK')),
 url text NOT NULL CHECK(length(url) BETWEEN 8 AND 2048),
 caption text NOT NULL DEFAULT '' CHECK(length(caption)<=255),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(submission_id,sequence));
CREATE INDEX IF NOT EXISTS assignment_submission_links_submission_idx
 ON assignment_submission_links(submission_id);
-- Keep READY-file deferred constraint for FILE submissions. Sign and scan all
-- uploaded files before attachment. No public URLs or signed URLs are persisted.
