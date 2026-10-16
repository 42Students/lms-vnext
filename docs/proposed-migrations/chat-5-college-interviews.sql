-- PROPOSAL ONLY: COL-placements-04. Orchestrator must register, replay and certify.
CREATE TABLE IF NOT EXISTS placement_college_interviews(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 job_id uuid NOT NULL REFERENCES placement_jobs(id),
 round_id uuid NOT NULL REFERENCES placement_job_rounds(id),
 application_id uuid NOT NULL REFERENCES placement_applications(id),
 scheduled_at timestamptz NOT NULL,
 duration_minutes integer NOT NULL,
 mode varchar(24) NOT NULL,
 venue text,
 meeting_url text,
 interviewer text,
 status varchar(24) NOT NULL DEFAULT 'SCHEDULED',
 outcome_note text,
 created_by_user_id uuid NOT NULL REFERENCES users(id),
 updated_by_user_id uuid NOT NULL REFERENCES users(id),
 completed_at timestamptz,
 cancelled_at timestamptz,
 version integer NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT college_interview_round_job_fk FOREIGN KEY(round_id,job_id) REFERENCES placement_job_rounds(id,job_id),
 CONSTRAINT college_interview_status_ck CHECK(status IN ('SCHEDULED','COMPLETED','NO_SHOW','CANCELLED')),
 CONSTRAINT college_interview_mode_ck CHECK(mode IN ('ON_CAMPUS','VIRTUAL')),
 CONSTRAINT college_interview_duration_ck CHECK(duration_minutes BETWEEN 5 AND 480),
 CONSTRAINT college_interview_version_ck CHECK(version>0),
 CONSTRAINT college_interview_location_ck CHECK(
 (mode='ON_CAMPUS' AND length(trim(coalesce(venue,'')))>=2) OR
 (mode='VIRTUAL' AND length(trim(coalesce(meeting_url,'')))>=8)),
 CONSTRAINT college_interview_lifecycle_ck CHECK(
 (status='SCHEDULED' AND completed_at IS NULL AND cancelled_at IS NULL) OR
 (status IN ('COMPLETED','NO_SHOW') AND completed_at IS NOT NULL AND cancelled_at IS NULL) OR
 (status='CANCELLED' AND cancelled_at IS NOT NULL AND completed_at IS NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS college_interview_active_application_round_uq
 ON placement_college_interviews(round_id,application_id) WHERE status<>'CANCELLED';
CREATE INDEX IF NOT EXISTS college_interview_job_time_idx
 ON placement_college_interviews(job_id,scheduled_at);
-- Service must verify each application.job_id and parent college before updating.
