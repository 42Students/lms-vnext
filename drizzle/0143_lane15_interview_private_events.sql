-- Private interview event ledger: no-show/reschedules/feedback, append-only in services.
-- Job ancestry constraints prevent linking applicants or rounds across drives.
CREATE TABLE IF NOT EXISTS placement_interview_private_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES placement_jobs(id) ON DELETE RESTRICT,
  round_id uuid NOT NULL REFERENCES placement_job_rounds(id) ON DELETE RESTRICT,
  application_id uuid NOT NULL REFERENCES placement_applications(id) ON DELETE RESTRICT,
  event_type varchar(32) NOT NULL,
  previous_scheduled_at timestamptz,
  scheduled_at timestamptz,
  legacy_interview_id varchar(40),
  private_feedback jsonb,
  actor_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT placement_interview_events_round_job_fk FOREIGN KEY (round_id, job_id)
    REFERENCES placement_job_rounds(id, job_id) ON DELETE RESTRICT,
  CONSTRAINT placement_interview_events_app_job_fk FOREIGN KEY (application_id, job_id)
    REFERENCES placement_applications(id, job_id) ON DELETE RESTRICT,
  CONSTRAINT placement_interview_private_events_type_ck
    CHECK (event_type IN ('SCHEDULED', 'CONFIRMED', 'RESCHEDULE_REQUESTED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'FEEDBACK_RECORDED')),
  CONSTRAINT placement_interview_private_events_feedback_ck
    CHECK (private_feedback IS NULL OR jsonb_typeof(private_feedback) = 'object')
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS placement_interview_private_events_subject_idx
 ON placement_interview_private_events(round_id, application_id, created_at);
