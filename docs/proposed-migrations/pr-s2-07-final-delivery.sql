-- PR-S2-07 proposed migration ONLY: not registered on main.
-- Preserve immutable review history; do NOT revert APPROVED to CHANGES_REQUESTED.
ALTER TABLE project_submissions ADD COLUMN locked_at timestamptz,
  ADD COLUMN reopened_at timestamptz,
  ADD COLUMN attachments jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE project_submissions ADD CONSTRAINT project_submissions_project_id_id_uq UNIQUE (project_id,id);
ALTER TABLE project_submissions ADD CONSTRAINT project_submissions_attachments_array_ck
  CHECK (jsonb_typeof(attachments) = 'array');
CREATE TABLE project_delivery_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES project_instances(id) ON DELETE RESTRICT,
  submission_id uuid NOT NULL,
  event_type varchar(24) NOT NULL CHECK (event_type IN ('LOCKED','REOPENED','ATTACHMENTS_CHANGED')),
  actor_membership_id uuid NOT NULL REFERENCES college_memberships(id) ON DELETE RESTRICT,
  reason text NOT NULL CHECK (length(trim(reason)) BETWEEN 1 AND 4000),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_delivery_events_submission_fk FOREIGN KEY (project_id,submission_id)
    REFERENCES project_submissions(project_id,id) ON DELETE RESTRICT
);
CREATE INDEX project_delivery_events_project_time_idx ON project_delivery_events(project_id,occurred_at);
-- After promotion: transactionally lock submission, check ACTIVE project + no
-- evaluation, write immutable event, permit one new draft only after latest
-- approved submission's explicit REOPENED event. Backfill event log safely.
