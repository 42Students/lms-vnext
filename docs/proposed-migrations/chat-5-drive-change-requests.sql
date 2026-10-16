-- PROPOSAL ONLY: TPO-drive-workspace-60 college ↔ recruiter change request workflow.
-- Register as a numbered migration before enabling writes. Nothing here automatically edits a drive.
CREATE TABLE IF NOT EXISTS placement_drive_change_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 job_id uuid NOT NULL REFERENCES placement_jobs(id),
 created_by_user_id uuid NOT NULL REFERENCES users(id),
 proposer_party varchar(12) NOT NULL,
 target_party varchar(12) NOT NULL,
 mode varchar(12) NOT NULL,
 field varchar(32) NOT NULL,
 proposed_value text NOT NULL,
 reason text NOT NULL,
 status varchar(16) NOT NULL DEFAULT 'OPEN',
 decision_note text,
 decided_by_user_id uuid REFERENCES users(id),
 decided_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT placement_drive_changes_parties_ck CHECK(proposer_party IN ('TPO','COMPANY') AND target_party IN ('TPO','COMPANY') AND proposer_party<>target_party),
 CONSTRAINT placement_drive_changes_mode_ck CHECK(mode IN ('SUGGEST','ASK')),
 CONSTRAINT placement_drive_changes_field_ck CHECK(field IN ('DEADLINE','PAY','ELIGIBILITY','LOCATION','ROUNDS','OTHER')),
 CONSTRAINT placement_drive_changes_status_ck CHECK(status IN ('OPEN','ACCEPTED','ANSWERED','DECLINED','WITHDRAWN')),
 CONSTRAINT placement_drive_changes_content_ck CHECK(length(trim(proposed_value))>=2 AND length(trim(reason))>=3),
 CONSTRAINT placement_drive_changes_decision_ck CHECK(
 (status='OPEN' AND decided_at IS NULL AND decided_by_user_id IS NULL) OR
 (status<>'OPEN' AND decided_at IS NOT NULL AND decided_by_user_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS placement_drive_changes_job_status_idx ON placement_drive_change_requests(job_id,status,created_at);
CREATE TABLE IF NOT EXISTS placement_drive_change_request_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 request_id uuid NOT NULL REFERENCES placement_drive_change_requests(id),
 sender_user_id uuid NOT NULL REFERENCES users(id),
 sender_party varchar(12) NOT NULL,
 body text NOT NULL,
 sent_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT placement_drive_change_messages_party_ck CHECK(sender_party IN ('TPO','COMPANY')),
 CONSTRAINT placement_drive_change_messages_body_ck CHECK(length(trim(body)) BETWEEN 1 AND 2000)
);
CREATE INDEX IF NOT EXISTS placement_drive_change_messages_request_idx ON placement_drive_change_request_messages(request_id,sent_at);
