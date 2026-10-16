-- PROPOSAL ONLY: TPO-drive-workspace-44. Orchestrator owns numbered migration registration.
-- Candidate-level slot bookings, room allocations, and reschedule audit state.
CREATE TABLE IF NOT EXISTS placement_round_candidate_slots (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 job_id uuid NOT NULL REFERENCES placement_jobs(id),
 round_id uuid NOT NULL REFERENCES placement_job_rounds(id),
 application_id uuid NOT NULL REFERENCES placement_applications(id),
 starts_at timestamptz NOT NULL,
 ends_at timestamptz NOT NULL,
 room text NOT NULL,
 panel text,
 status varchar(16) NOT NULL DEFAULT 'BOOKED',
 source varchar(16) NOT NULL DEFAULT 'TPO',
 confirmed_at timestamptz,
 changed_by_user_id uuid NOT NULL REFERENCES users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 version integer NOT NULL DEFAULT 1,
 CONSTRAINT candidate_slot_round_job_fk FOREIGN KEY (round_id,job_id) REFERENCES placement_job_rounds(id,job_id),
 CONSTRAINT placement_round_candidate_slots_status_ck CHECK(status IN ('BOOKED','CANCELLED')),
 CONSTRAINT placement_round_candidate_slots_source_ck CHECK(source IN ('TPO','RECRUITER')),
 CONSTRAINT placement_round_candidate_slots_time_ck CHECK(ends_at>starts_at),
 CONSTRAINT placement_round_candidate_slots_version_ck CHECK(version>0),
 CONSTRAINT placement_round_candidate_slots_room_ck CHECK(length(trim(room))>0)
);
CREATE UNIQUE INDEX IF NOT EXISTS placement_round_candidate_slots_active_application_uq
 ON placement_round_candidate_slots(round_id,application_id) WHERE status<>'CANCELLED';
CREATE UNIQUE INDEX IF NOT EXISTS placement_round_candidate_slots_active_room_time_uq
 ON placement_round_candidate_slots(round_id,room,starts_at) WHERE status<>'CANCELLED';
CREATE INDEX IF NOT EXISTS placement_round_candidate_slots_round_date_idx
 ON placement_round_candidate_slots(round_id,starts_at);
-- The write service verifies that application.job_id=slot.job_id and scopes college.
-- Orchestrator: register and verify migration before UI writes are enabled.
